#!/usr/bin/env node
/**
 * derive-under-served-list.js
 * H1-B1: Produce under-served units list from snapshots using hysteresis engine params.
 * Input: artifacts/equity-snapshots.json
 * Output: artifacts/under-served.json [{ unit, state, last_ratio, last_ts }]
 */
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { decide } from './fairness/engine-core.js';

async function loadParams(){
  const raw = await fs.readFile('docs/fairness/hysteresis-config-v1.yml','utf8');
  return yaml.parse(raw).parameters;
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const params = await loadParams();
  const snaps = JSON.parse(await fs.readFile('artifacts/equity-snapshots.json','utf8'));
  const byUnit = new Map();
  for (const s of snaps){
    if (!byUnit.has(s.unit)) {byUnit.set(s.unit, []);}
    byUnit.get(s.unit).push(s);
  }
  const out=[];
  for (const [unit, arr] of byUnit.entries()){
    const sorted = arr.slice().sort((a,b)=> a.ts.localeCompare(b.ts));
    let st=null; let lastRatio=null; let lastTs=null;
    for (const s of sorted){
      const res = decide(params, st, s.ratio);
      st = res; lastRatio = s.ratio; lastTs = s.ts;
    }
    out.push({ unit, state: st?.state || 'NONE', last_ratio: lastRatio, last_ts: lastTs });
  }
  const underServed = out.filter(u=> u.state==='ACTIVE' || u.state==='STALLED');
  await fs.writeFile('artifacts/under-served.json', JSON.stringify({ version:'1.0.0', generated_utc: new Date().toISOString(), total: underServed.length, units: underServed }, null, 2));
  console.log(`[under-served] total=${underServed.length}`);
}

main().catch(e=>{ console.error('[under-served] error', e); process.exit(2); });
