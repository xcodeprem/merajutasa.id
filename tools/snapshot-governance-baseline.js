#!/usr/bin/env node
/**
 * snapshot-governance-baseline.js
 * Captures a content-addressed snapshot (hash) of governance-verify summary & key artifacts
 * to establish immutable Wave 0 baseline.
 */
import { promises as fs } from 'fs';
import crypto from 'crypto';

const TARGETS = [
  'artifacts/governance-verify-summary.json',
  'artifacts/spec-hash-diff.json',
  'artifacts/param-integrity-matrix.json',
];

function sha256(buf){ return crypto.createHash('sha256').update(buf).digest('hex'); }

async function main(){
  await fs.mkdir('artifacts/baseline',{recursive:true});
  const snapshot = { generated_utc: new Date().toISOString(), files: [] };
  for (const p of TARGETS){
    try {
      const raw = await fs.readFile(p);
      snapshot.files.push({ path:p, sha256: sha256(raw), size: raw.length });
    } catch { snapshot.files.push({ path:p, missing:true }); }
  }
  snapshot.summary_hash = sha256(Buffer.from(JSON.stringify(snapshot.files),'utf8'));
  const outPath = `artifacts/baseline/wave0-baseline-${Date.now()}.json`;
  await fs.writeFile(outPath, JSON.stringify(snapshot,null,2));
  console.log('[baseline] snapshot written', outPath, 'summary_hash=', snapshot.summary_hash);
}
main().catch(e=>{ console.error('[baseline] error', e); process.exit(2); });
