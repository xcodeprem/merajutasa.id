/**
 * spec-hash-diff.js
 * Purpose: Compute SHA256 for spec/governance files, update manifest placeholders, emit diff report.
 * Policy: Append-only updates to manifest (replace <PENDING_HASH> only). No silent hash change for next_change_requires_dec=true.
 */
import { promises as fs } from 'fs';
import crypto from 'crypto';

const MANIFEST_PATH = 'docs/integrity/spec-hash-manifest-v1.json';
async function sha256(path) {
  const data = await fs.readFile(path);
  return crypto.createHash('sha256').update(data).digest('hex');
}
async function main() {
  const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH,'utf8'));
  const report = { updated: [], unchanged: [], violations: [] };
  for (const f of manifest.files) {
    try {
      await fs.access(f.path);
    } catch {
      continue; // placeholder canonical not yet committed
    }
    const h = await sha256(f.path);
    if (f.hash_sha256 === '<PENDING_HASH>') {
      f.hash_sha256 = h;
      report.updated.push({ path: f.path, hash: h, reason: 'fill_pending' });
    } else if (f.hash_sha256 !== h) {
      if (f.next_change_requires_dec) {
        report.violations.push({ path: f.path, previous: f.hash_sha256, current: h, code: 'HASH_MISMATCH_DEC_REQUIRED' });
      } else {
        report.updated.push({ path: f.path, previous: f.hash_sha256, hash: h, reason: 'non_dec_allowed' });
        f.hash_sha256 = h;
      }
    } else {
      report.unchanged.push({ path: f.path });
    }
  }
  manifest.generation_timestamp_utc = new Date().toISOString();
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  await fs.writeFile('artifacts/spec-hash-diff.json', JSON.stringify(report, null, 2));
  if (report.violations.length) {
    console.error('Spec hash violations detected');
    process.exit(1);
  }
  console.log('Spec hash diff completed');
}
main().catch(e => { console.error(e); process.exit(1); });
