#!/usr/bin/env node
/**
 * policy-index-verify.js
 * Ensures policy index entries resolve to actual files and manifest entries, with DEC refs consistency.
 * Also verifies presence/linkage of Non-code Policy References (Portal Panti) in README.
 * Outputs artifacts/policy-index-verify.json
 */
import { promises as fs } from 'fs';

const POLICY_INDEX_PATH = 'docs/governance/policy-index-v1.md';
const MANIFEST_PATH = 'docs/integrity/spec-hash-manifest-v1.json';
const README_PATH = 'README.md';

function extractTable(md){
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex(l=>/^\|\s*Policy ID\s*\|/i.test(l));
  if (start<0) {return [];}
  const rows=[];
  for (let i=start+2; i<lines.length; i++){
    const l = lines[i];
    if (!l.trim().startsWith('|')) {break;}
    const cols = l.split('|').slice(1,-1).map(s=>s.trim());
    if (cols.length>=7){
      rows.push({ policyId: cols[0], file: cols[1], domain: cols[2], level: cols[3], decRef: cols[4], principles: cols[5], notes: cols[6] });
    }
  }
  return rows;
}

function extractNonCodeRefs(md){
  const lines = md.split(/\r?\n/);
  // Find the heading line for Non-code Policy References (case-insensitive)
  const start = lines.findIndex(l=>/^##\s*Non-code Policy References/i.test(l));
  if (start < 0) {return { items: [], sectionFound: false };}
  const items = [];
  for (let i = start + 1; i < lines.length; i++){
    const l = lines[i];
    if (/^#/ .test(l)) {break;} // next heading ends the section
    const m = /^\s*-\s+(.*)$/.exec(l);
    if (m){
      // take the raw path text, strip surrounding code/link markup if any
      let path = m[1].trim();
      // If it's a markdown link [text](path), extract inside parens
      const linkMatch = /^\[[^\]]+\]\(([^)]+)\)/.exec(path);
      if (linkMatch) {path = linkMatch[1];}
      // strip surrounding backticks
      path = path.replace(/^`+|`+$/g,'');
      items.push(path);
    }
  }
  return { items, sectionFound: true };
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const [md, manifestRaw, readme] = await Promise.all([
    fs.readFile(POLICY_INDEX_PATH,'utf8'),
    fs.readFile(MANIFEST_PATH,'utf8'),
    fs.readFile(README_PATH,'utf8').catch(()=>''),
  ]);
  const manifest = JSON.parse(manifestRaw);
  const rows = extractTable(md);
  const nonCode = extractNonCodeRefs(md);
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
        if (!token) {continue;}
        if (!manDec.includes(token)){
          issues.push({ type:'DEC_REF_MISMATCH', policyId:r.policyId, path, indexDecRef: decRefTxt, manifestDecRef: manDec });
          break;
        }
      }
    }
  }

  // Verify Non-code Policy References existence and linkage in README
  const nonCodeItems = [];
  if (!nonCode.sectionFound){
    issues.push({ type:'NONCODE_SECTION_MISSING', note: 'Heading "Non-code Policy References" not found in policy index' });
  }
  for (const p of nonCode.items){
    const normalized = p.replace(/^\.*\//,'');
    // Check file existence on disk
    let exists = false;
    try {
      await fs.stat(normalized);
      exists = true;
    } catch {
      // try with original path if normalization altered directories
      try { await fs.stat(p); exists = true; } catch { exists = false; }
    }
    if (!exists){
      issues.push({ type:'NONCODE_REF_MISSING', path: p });
    }
    // Check README linkage (path substring present)
    const linkedInReadme = readme.includes(p) || readme.includes(normalized);
    if (!linkedInReadme){
      issues.push({ type:'NONCODE_REF_NOT_IN_README', path: p });
    }
    nonCodeItems.push({ path: p, exists, linkedInReadme });
  }

  const nonCodeSummary = {
    total: nonCodeItems.length,
    missing_count: nonCodeItems.filter(i=>!i.exists).length,
    not_linked_count: nonCodeItems.filter(i=>!i.linkedInReadme).length,
    items: nonCodeItems,
  };

  const status = issues.length? 'ADVISORY' : 'PASS';
  const out = { version:2, status, total: rows.length, issues, nonCodeSummary };
  await fs.writeFile('artifacts/policy-index-verify.json', JSON.stringify(out,null,2));
  process.exit(0); // advisory for now
}

main().catch(e=>{ console.error('[policy-index-verify] error', e); process.exit(2); });
