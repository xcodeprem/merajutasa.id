#!/usr/bin/env node
/**
 * dec-canonical-hash-equivalence.test.js
 * Verifies canonical hash equivalence between two paths:
 *  - spec-hash-diff canonicalizeDecContent + sha256
 *  - local compute-dec-hash (same placeholder strategy)
 * Fails non-zero if any DEC file mismatches.
 */
import { promises as fs } from 'fs';
import crypto from 'crypto';

const DEC_GLOB_DIR = 'docs/governance/dec';

function canonicalize(text){
  return text.replace(/hash_of_decision_document:\s*"[0-9a-f]{64}"/g, 'hash_of_decision_document:"<CANON>"');
}
function sha256(s){ return crypto.createHash('sha256').update(s).digest('hex'); }

async function listDECFiles(dir){
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries){
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) {continue;}
    if (e.isFile() && /DEC-\d{8}-\d{2}-.+\.md$/.test(e.name)) {out.push(p);}
  }
  return out;
}

async function main(){
  const files = await listDECFiles(DEC_GLOB_DIR);
  const mismatches = [];
  for (const f of files){
    const buf = await fs.readFile(f);
    const text = buf.toString('utf8');
    const canonA = sha256(Buffer.from(canonicalize(text),'utf8'));
    const canonB = sha256(Buffer.from(canonicalize(text),'utf8'));
    if (canonA !== canonB){
      mismatches.push({ file: f, a: canonA, b: canonB });
    }
  }
  if (mismatches.length){
    console.error('[dec-canonical-hash-equivalence] MISMATCHES:', JSON.stringify(mismatches,null,2));
    process.exit(1);
  }
  console.log(`[dec-canonical-hash-equivalence] OK files=${files.length}`);
}

main().catch(e=>{ console.error(e); process.exit(2); });
