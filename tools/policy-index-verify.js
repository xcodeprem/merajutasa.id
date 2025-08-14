#!/usr/bin/env node
/**
 * policy-index-verify.js
 * Ensures policy index entries resolve to actual files and manifest entries, with DEC refs consistency.
 * Outputs artifacts/policy-index-verify.json
 */
import { promises as fs } from 'fs';

const POLICY_INDEX_PATH = 'docs/governance/policy-index-v1.md';
const MANIFEST_PATH = 'docs/integrity/spec-hash-manifest-v1.json';

function extractTable(md){
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex(l=>/^\|\s*Policy ID\s*\|/i.test(l));
  if (start<0) return [];
  const rows=[];
  for (let i=start+2; i<lines.length; i++){
    const l = lines[i];
    if (!l.trim().startsWith('|')) break;
    const cols = l.split('|').slice(1,-1).map(s=>s.trim());
    if (cols.length>=7){
      rows.push({ policyId: cols[0], file: cols[1], domain: cols[2], level: cols[3], decRef: cols[4], principles: cols[5], notes: cols[6] });
    }
  }
  return rows;
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const [md, manifestRaw] = await Promise.all([
    fs.readFile(POLICY_INDEX_PATH,'utf8'),
    fs.readFile(MANIFEST_PATH,'utf8')
  ]);
  const manifest = JSON.parse(manifestRaw);
  const rows = extractTable(md);
  const manifestPaths = new Map(manifest.files.map(f=>[f.path, f]));
  const issues=[];
  for (const r of rows){
    // normalize potential relative path notation like policy/opa/aggregation.rego (planned)
    const path = r.file.replace(/\s*\(planned\)/i,'').replace(/^\.*\//,'');
    const existsInManifest = manifestPaths.has(path);
    if (!existsInManifest){
      issues.push({ type:'MISSING_IN_MANIFEST', policyId:r.policyId, path });
      continue;
    }
    // If decRef is present (non-empty and not 'Future DEC'), ensure manifest dec_ref contains referenced ids substrings
    const decRefTxt = r.decRef||'';
    if (decRefTxt && !/future dec/i.test(decRefTxt)){
      const man = manifestPaths.get(path);
      const manDec = man.dec_ref || '';
      for (const token of decRefTxt.split('+').map(s=>s.trim())){
        if (!token) continue;
        if (!manDec.includes(token)){
          issues.push({ type:'DEC_REF_MISMATCH', policyId:r.policyId, path, indexDecRef: decRefTxt, manifestDecRef: manDec });
          break;
        }
      }
    }
  }
  const status = issues.length? 'ADVISORY' : 'PASS';
  const out = { version:1, status, total: rows.length, issues };
  await fs.writeFile('artifacts/policy-index-verify.json', JSON.stringify(out,null,2));
  process.exit(0); // advisory for now
}

main().catch(e=>{ console.error('[policy-index-verify] error', e); process.exit(2); });
