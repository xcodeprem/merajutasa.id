import { promises as fs } from 'fs';
import crypto from 'crypto';

function canonical(raw){
  return raw.replace(/hash_of_decision_document:\s*"[a-f0-9<AUTO>]+"/i,'hash_of_decision_document: "<HASH_VALUE>"');
}

async function main(){
  const file = process.argv[2];
  if(!file){ console.error('File path required'); process.exit(1);}
  const manifestPath = 'docs/integrity/spec-hash-manifest-v1.json';
  const raw = await fs.readFile(file,'utf8');
  const hash = crypto.createHash('sha256').update(canonical(raw)).digest('hex');
  const manifest = JSON.parse(await fs.readFile(manifestPath,'utf8'));
  if(manifest.files.some(f=>f.path===file)){
    console.error('Entry already exists'); process.exit(2);
  }
  manifest.files.push({
    path: file,
    version: '1.0.0',
    dec_ref: 'SELF',
    hash_sha256: hash,
    integrity_class: 'decision',
    mutable_policy: 'immutable',
    next_change_requires_dec: false,
    notes: 'Auto appended via dec-manifest-append.js',
  });
  await fs.writeFile(manifestPath, JSON.stringify(manifest,null,2));
  console.log('Appended to manifest', file, hash);
}
main().catch(e=>{ console.error(e); process.exit(1); });
