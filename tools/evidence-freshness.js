#!/usr/bin/env node
/**
 * evidence-freshness.js
 * Computes age of key evidence artifacts and reports staleness against thresholds.
 * Phase: Advisory (future DEC may escalate stale/missing to FAIL).
 * Output: artifacts/evidence-freshness-report.json
 */
import { promises as fs } from 'fs';

const ARTIFACTS = [
  'artifacts/spec-hash-diff.json',
  'artifacts/param-integrity-matrix.json',
  'artifacts/principles-impact-report.json',
  'artifacts/hype-lint.json',
  'artifacts/disclaimers-lint.json',
  'artifacts/pii-scan-report.json',
  'artifacts/fairness-sim-scenarios.json',
  'artifacts/fairness-sim-report.json',
  // Exclude self-referential aggregator to avoid circular stale status in A8
  // 'artifacts/no-silent-drift-report.json',
  'artifacts/evidence-bundle.json',
];

const DEFAULT_THRESHOLD_HOURS = 24;
const THRESHOLDS = {
  'artifacts/spec-hash-diff.json': 24,
  // 'artifacts/no-silent-drift-report.json': 6,
  'artifacts/evidence-bundle.json': 6,
};

function parseTimestamp(obj){
  if (!obj || typeof obj !== 'object') {return null;}
  return obj.generated_utc || obj.timestamp_utc || obj.generation_timestamp_utc || null;
}
async function statMaybe(p){ try { return await fs.stat(p); } catch { return null; } }
async function readJSONMaybe(p){ try { return JSON.parse(await fs.readFile(p,'utf8')); } catch { return null; } }
function hoursSince(dateStr, fallbackMtime){
  let ts = Date.parse(dateStr);
  if (isNaN(ts)) {ts = fallbackMtime;}
  if (!ts) {return null;}
  const diffMs = Date.now() - ts;
  return diffMs / 3600000;
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const items = [];
  for (const path of ARTIFACTS){
    const st = await statMaybe(path);
    if (!st){
      items.push({ path, exists:false, age_hours:null, threshold_hours: THRESHOLDS[path]||DEFAULT_THRESHOLD_HOURS, status:'MISSING', source_timestamp_type:'none' });
      continue;
    }
    const json = await readJSONMaybe(path);
    const internalTs = parseTimestamp(json);
    const age = hoursSince(internalTs, st.mtimeMs);
    const threshold = THRESHOLDS[path] || DEFAULT_THRESHOLD_HOURS;
    let status = 'PASS';
    if (age !== null && age > threshold) {status = 'STALE';}
    items.push({ path, exists:true, age_hours: age!==null? Number(age.toFixed(2)):null, threshold_hours: threshold, status, source_timestamp_type: internalTs? 'internal':'mtime' });
  }
  const summary = {
    total: items.length,
    pass: items.filter(i=>i.status==='PASS').length,
    stale: items.filter(i=>i.status==='STALE').length,
    missing: items.filter(i=>i.status==='MISSING').length,
  };
  let overall = 'PASS';
  if (summary.stale>0 || summary.missing>0) {overall = 'ADVISORY';}
  const out = {
    version:'1.0.0',
    generated_utc: new Date().toISOString(),
    default_threshold_hours: DEFAULT_THRESHOLD_HOURS,
    items,
    summary: { ...summary, overall_status: overall },
  };
  await fs.writeFile('artifacts/evidence-freshness-report.json', JSON.stringify(out,null,2));
  console.log(`[evidence-freshness] overall=${overall} stale=${summary.stale} missing=${summary.missing}`);
}

main().catch(e=>{ console.error('evidence-freshness error', e); process.exit(2); });
