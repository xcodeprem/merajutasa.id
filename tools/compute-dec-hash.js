import { promises as fs } from 'fs';
import crypto from 'crypto';

// Unify with spec-hash-diff canonicalization token
const CANON_TOKEN = 'hash_of_decision_document:"<CANON>"';
function canonical(raw){
  return raw.replace(/hash_of_decision_document:\s*"[0-9a-f]{64}"/, CANON_TOKEN);
}

async function main(){
  const file = process.argv[2];
  if(!file){
    console.error('Usage: node tools/compute-dec-hash.js <dec-file-path>');
    process.exit(1);
  }
  const raw = await fs.readFile(file,'utf8');
  const hash = crypto.createHash('sha256').update(canonical(raw)).digest('hex');
  console.log(hash);
}

main().catch(e=>{ console.error(e); process.exit(1); });
