#!/usr/bin/env node
/**
 * evidence-bundle.js (Requirement 4.5)
 * Generates a canonical manifest (artifacts/evidence-bundle.json) for the Phase 1.5 Evidence Minimum Set
 * plus auxiliary evidence artifacts, including per‑artifact SHA256 and an aggregate bundle hash.
 *
 * Required (A1–A8):
 *  A1 spec-hash-diff.json
 *  A2 param-integrity-matrix.json
 *  A3 principles-impact-report.json
 *  A4 hype-lint.json
 *  A5 disclaimers-lint.json
 *  A6 pii-scan-report.json
 *  A7 fairness-sim-scenarios.json (+ include fairness-sim-report.json)
 *  A8 no-silent-drift-report.json
 * Additional: evidence-schema-validation.json (schema validation summary)
 *
 * Output Structure:
 *  version, generated_utc, artifacts:[{ id, path, exists, size_bytes, sha256, sha256_short, schema_ref, category }],
 *  summary:{ total, missing, with_schema, bundle_hash }
 *  integrity: { hash_algorithm:'SHA256', bundle_hash_derivation:'sha256(concat(sorted sha256 per existing artifact with "\n"))' }
 */
import { promises as fs } from 'fs';
import crypto from 'crypto';
import path from 'path';

// Mapping of evidence artifacts to schema files (when available)
const EVIDENCE_MAP = [
  { id:'A1', path:'artifacts/spec-hash-diff.json', schema:'schemas/evidence/spec-hash-diff-v1.json', category:'governance' },
  { id:'A2', path:'artifacts/param-integrity-matrix.json', schema:'schemas/evidence/param-integrity-v1.json', category:'fairness' },
  { id:'A3', path:'artifacts/principles-impact-report.json', schema:'schemas/evidence/principles-impact-v2.json', category:'principles' },
  { id:'A4', path:'artifacts/hype-lint.json', schema:'schemas/evidence/hype-lint-v1.json', category:'language' },
  { id:'A5', path:'artifacts/disclaimers-lint.json', schema:'schemas/evidence/disclaimers-lint-v1.json', category:'disclaimers' },
  { id:'A6', path:'artifacts/pii-scan-report.json', schema:'schemas/evidence/pii-scan-v1.json', category:'privacy' },
  { id:'A7', path:'artifacts/fairness-sim-scenarios.json', schema:'schemas/evidence/fairness-sim-scenarios-v1.json', category:'fairness-sim' },
  { id:'A7R', path:'artifacts/fairness-sim-report.json', schema:'schemas/evidence/fairness-sim-report-v1.json', category:'fairness-sim' },
  { id:'A8', path:'artifacts/no-silent-drift-report.json', schema:'schemas/evidence/no-silent-drift-v1.json', category:'aggregator' },
  { id:'A9', path:'artifacts/fairness-engine-runtime-report.json', schema:'schemas/evidence/fairness-engine-runtime-v1.json', category:'fairness-runtime' },
  { id:'A10', path:'artifacts/evidence-collision-test.json', schema:'schemas/evidence/evidence-collision-test-v1.json', category:'governance' },
  { id:'SCHEMA_VALIDATION', path:'artifacts/evidence-schema-validation.json', schema:null, category:'meta' }
];

function sha256(buf){ return crypto.createHash('sha256').update(buf).digest('hex'); }
async function fileStat(p){ try { return await fs.stat(p); } catch { return null; } }
async function readFileMaybe(p){ try { return await fs.readFile(p); } catch { return null; } }

async function main(){
  await fs.mkdir('artifacts', { recursive:true });
  const artifacts = [];
  for (const item of EVIDENCE_MAP){
    const st = await fileStat(item.path);
    if (!st){
      artifacts.push({ id:item.id, path:item.path, exists:false, size_bytes:0, sha256:null, sha256_short:null, schema_ref:item.schema?path.basename(item.schema):null, category:item.category });
      continue;
    }
    const buf = await readFileMaybe(item.path);
    const hash = buf ? sha256(buf) : null;
    artifacts.push({ id:item.id, path:item.path, exists:true, size_bytes:st.size, sha256:hash, sha256_short: hash? hash.slice(0,16):null, schema_ref:item.schema?path.basename(item.schema):null, category:item.category });
  }

  // Derive bundle hash from existing artifacts only (stable ordering by path)
  const existingHashes = artifacts.filter(a=>a.exists && a.sha256).sort((a,b)=> a.path.localeCompare(b.path)).map(a=>a.sha256);
  const bundleHash = sha256(Buffer.from(existingHashes.join('\n'),'utf8'));

  const summary = {
    total: artifacts.length,
    missing: artifacts.filter(a=>!a.exists).length,
    with_schema: artifacts.filter(a=>a.schema_ref).length,
    bundle_hash: bundleHash
  };
  const out = {
    version:'1.0.0',
    generated_utc: new Date().toISOString(),
    evidence_phase: '1.5',
    artifacts,
    summary,
    integrity: {
      hash_algorithm:'SHA256',
      bundle_hash_derivation:'sha256(concat(sorted sha256 per existing artifact with "\\n"))'
    }
  };
  await fs.writeFile('artifacts/evidence-bundle.json', JSON.stringify(out,null,2));

  // Legacy status file for backward compatibility (simple exists list)
  const legacy = artifacts.map(a=>({ file:path.basename(a.path), exists:a.exists }));
  await fs.writeFile('artifacts/evidence-bundle-status.json', JSON.stringify(legacy,null,2));
  console.log(`[evidence-bundle] artifacts=${artifacts.length} missing=${summary.missing} bundle_hash=${bundleHash.slice(0,16)}`);
}

main().catch(e=>{ console.error('evidence-bundle error', e); process.exit(2); });
