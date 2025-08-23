#!/usr/bin/env node
/**
 * snapshot-artifacts-baseline.js
 * Captures hashes of key evidence artifacts as a regression baseline.
 */
import { promises as fs } from 'fs';
import crypto from 'crypto';
const ARTIFACTS = [
  'artifacts/spec-hash-diff.json',
  'artifacts/param-integrity-matrix.json',
  'artifacts/hype-lint.json',
  'artifacts/disclaimers-lint.json',
  'artifacts/principles-impact-report.json',
  'artifacts/pii-scan-report.json',
  'artifacts/no-silent-drift-report.json',
  'artifacts/fairness-sim-report.json',
  'artifacts/fairness-engine-runtime-report.json',
];
function sha256(buf){ return crypto.createHash('sha256').update(buf).digest('hex'); }
async function hashFile(p){ try { const data = await fs.readFile(p); return { path:p, hash:sha256(data) }; } catch { return { path:p, missing:true }; } }
async function main(){
  await fs.mkdir('artifacts', {recursive:true});
  const results = [];
  for (const a of ARTIFACTS){ results.push(await hashFile(a)); }
  const snapshot = { version:1, timestamp_utc: new Date().toISOString(), artifacts: results };
  const outPath = `artifacts/baseline-artifacts-snapshot-${Date.now()}.json`;
  await fs.writeFile(outPath, JSON.stringify(snapshot,null,2));
  console.log('[snapshot] wrote', outPath);
}
main().catch(e=>{ console.error('snapshot baseline error', e); process.exit(2); });
