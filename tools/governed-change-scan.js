#!/usr/bin/env node
/**
 * governed-change-scan.js (Wave 1 - 17.x)
 * Scans git diff (against origin/main or last commit) for modifications to governed files (next_change_requires_dec=true or immutable/delta policies)
 * and verifies a DEC reference mentioning those files exists in new/modified DEC files.
 * Emits artifacts/governed-change-scan.json and exits non-zero if violation.
 */
import { spawnSync } from 'child_process';
import { promises as fs } from 'fs';

const MANIFEST = 'docs/integrity/spec-hash-manifest-v1.json';

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const manifest = JSON.parse(await fs.readFile(MANIFEST,'utf8'));
  const governed = manifest.files.filter(f=> f.next_change_requires_dec || ['immutable','delta-via-dec','locked-by-config-hash'].includes(f.mutable_policy));
  const governedPaths = new Set(governed.map(g=> g.path));

  // Get diff names
  const graceCommits = parseInt(process.env.GOV_SCAN_GRACE_COMMITS||'1',10);
  const rangeBase = `HEAD~${graceCommits}`;
  const diff = spawnSync('git',['--no-pager','diff','--name-only',rangeBase,'HEAD'],{encoding:'utf8'});
  const changed = diff.stdout.split(/\r?\n/).filter(l=> l.trim());
  const impacted = changed.filter(p=> governedPaths.has(p));
  const decFilesChanged = changed.filter(p=> /docs\/governance\/dec\/DEC-.*\.md$/.test(p));
  const violations=[]; const evidence=[];
  if(impacted.length){
    // scan DEC files for references
    const decContents = await Promise.all(decFilesChanged.map(async p=>({path:p, content: await fs.readFile(p,'utf8')})));
    impacted.forEach(ip=>{
      const isDecisionFile = /docs\/governance\/dec\/DEC-.*\.md$/.test(ip);
      const refFound = decContents.some(dc=> dc.content.includes(ip));
      if(isDecisionFile){
        // Self changes allowed; treat presence of its own filename in itself as implicit reference
        evidence.push({ path: ip, referenced_in: [ip] });
        return;
      }
      if(!refFound){
        violations.push({ path: ip, code:'GOVERNED_CHANGE_NO_DEC_REF' });
      } else {
        evidence.push({ path: ip, referenced_in: decContents.filter(dc=> dc.content.includes(ip)).map(d=> d.path) });
      }
    });
  }
  const report = { version:1, generated_utc:new Date().toISOString(), changed_count:changed.length, governed_impacted: impacted, dec_files_changed: decFilesChanged, violations, evidence };
  await fs.writeFile('artifacts/governed-change-scan.json', JSON.stringify(report,null,2));
  if(violations.length){ console.error('[governed-change-scan] violations'); process.exit(20); }
  console.log('[governed-change-scan] PASS');
}

main().catch(e=>{ console.error('[governed-change-scan] error', e); process.exit(2); });
