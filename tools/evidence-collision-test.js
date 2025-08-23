#!/usr/bin/env node
/**
 * evidence-collision-test.js (DB-02 enforcement path)
 * Verifies no collisions among displayed evidence hash prefixes (length from param-integrity or DEC).
 * Sources hashes from evidence-bundle (preferred) or by hashing each existing evidence artifact if bundle missing.
 * Output: artifacts/evidence-collision-test.json
 * Exit: non-zero if any collision detected.
 */
import { promises as fs } from 'fs';
import crypto from 'crypto';

function sha256(buf){ return crypto.createHash('sha256').update(buf).digest('hex'); }
async function safeJSON(p){ try { return JSON.parse(await fs.readFile(p,'utf8')); } catch { return null; } }
async function safeRead(p){ try { return await fs.readFile(p); } catch { return null; } }

async function derivePrefixLen(){
  const matrix = await safeJSON('artifacts/param-integrity-matrix.json');
  const row = matrix?.rows?.find(r=> r.parameter === 'evidence_hash_display_len');
  const len = row?.values?.dec || row?.values?.code || 16;
  return typeof len === 'number' ? len : 16;
}

async function collectHashes(){
  const bundle = await safeJSON('artifacts/evidence-bundle.json');
  if(bundle && Array.isArray(bundle.artifacts)){
    return bundle.artifacts.filter(a=>a.exists && a.sha256).map(a=>({ id:a.id, path:a.path, full:a.sha256 }));
  }
  // Fallback: derive from known evidence list (subset)
  const paths = [
    'artifacts/spec-hash-diff.json',
    'artifacts/param-integrity-matrix.json',
    'artifacts/principles-impact-report.json',
    'artifacts/hype-lint.json',
    'artifacts/disclaimers-lint.json',
    'artifacts/pii-scan-report.json',
    'artifacts/fairness-sim-scenarios.json',
    'artifacts/no-silent-drift-report.json',
  ];
  const out=[];
  for(const p of paths){ const buf = await safeRead(p); if(!buf) {continue;} out.push({ id:p, path:p, full: sha256(buf) }); }
  return out;
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const prefixLen = await derivePrefixLen();
  const hashes = await collectHashes();
  const map = new Map(); const collisions=[];
  hashes.forEach(h=>{
    const prefix = h.full.slice(0,prefixLen);
    if(map.has(prefix)) {collisions.push({ prefix, first: map.get(prefix), second: h });} else {map.set(prefix,h);}
  });
  const report = {
    version:'1.0.0',
    generated_utc: new Date().toISOString(),
    prefix_length: prefixLen,
    artifact_hashes: hashes.length,
    collision_count: collisions.length,
    collisions,
  };
  await fs.writeFile('artifacts/evidence-collision-test.json', JSON.stringify(report,null,2));
  if(collisions.length){
    console.error(`[evidence-collision-test] COLLISION DETECTED count=${collisions.length}`);
    process.exit(20);
  } else {
    console.log(`[evidence-collision-test] OK no collisions (n=${hashes.length} prefixes length=${prefixLen})`);
  }
}
main().catch(e=>{ console.error('evidence-collision-test error', e); process.exit(2); });
