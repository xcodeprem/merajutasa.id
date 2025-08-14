#!/usr/bin/env node
/**
 * equity-anomaly-detector.js
 * H1-B3: Detect equity ratio delta anomalies (threshold=0.03 per roadmap) from snapshots.
 * Input: artifacts/equity-snapshots.json (array {unit, ratio, ts})
 * Output: artifacts/equity-anomalies.json
 */
import { promises as fs } from 'fs';

const THRESHOLD = 0.03; // delta threshold

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  let snaps = [];
  try { snaps = JSON.parse(await fs.readFile('artifacts/equity-snapshots.json','utf8')); }
  catch { snaps = []; }
  const byUnit = new Map();
  for (const s of snaps){
    if (!byUnit.has(s.unit)) byUnit.set(s.unit, []);
    byUnit.get(s.unit).push(s);
  }
  const anomalies = [];
  for (const [unit, arr] of byUnit.entries()){
    const sorted = arr.slice().sort((a,b)=> a.ts.localeCompare(b.ts));
    for (let i=1;i<sorted.length;i++){
      const prev = sorted[i-1]; const curr = sorted[i];
      const delta = +(curr.ratio - prev.ratio).toFixed(4);
      if (Math.abs(delta) >= THRESHOLD){
        anomalies.push({ unit, prev_ts: prev.ts, curr_ts: curr.ts, prev_ratio: prev.ratio, curr_ratio: curr.ratio, delta, threshold: THRESHOLD });
      }
    }
  }
  const report = { version:'1.0.0', generated_utc: new Date().toISOString(), threshold: THRESHOLD, anomalies_count: anomalies.length, anomalies };
  await fs.writeFile('artifacts/equity-anomalies.json', JSON.stringify(report,null,2));
  console.log(`[equity-anomaly] anomalies=${anomalies.length} threshold=${THRESHOLD}`);
}

main().catch(e=>{ console.error('[equity-anomaly] error', e); process.exit(2); });
