/**
 * disclaimers-lint (Wave 0 stub)
 * Scans docs/... for future canonical disclaimers. Currently placeholder producing an artifact.
 * Output: artifacts/disclaimers-lint.json
 */
import { promises as fs } from 'fs';
import { glob } from 'glob';

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const disclaimerFiles = await glob('docs/**/disclaimers*.md');
  const items = [];
  for (const f of disclaimerFiles){
    const txt = await fs.readFile(f,'utf8');
    items.push({ file: f, length: txt.length, hash: await sha256(txt) });
  }
  const rules = [
    { id: 'DISC-PRES-001', description: 'Presence of canonical disclaimer set (stub)', status: disclaimerFiles.length>0? 'PRESENT' : 'MISSING' }
  ];
  const status = rules.every(r=>r.status==='PRESENT') ? 'PASS_STUB' : 'ADVISORY';
  const out = { version: 0, mode: 'stub', status, files_scanned: disclaimerFiles.length, rules, items };
  await fs.writeFile('artifacts/disclaimers-lint.json', JSON.stringify(out,null,2));
}

async function sha256(text){
  const { createHash } = await import('crypto');
  return createHash('sha256').update(text).digest('hex');
}

main().catch(e=>{ console.error('disclaimers-lint error', e); process.exit(2); });
