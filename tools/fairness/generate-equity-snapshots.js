#!/usr/bin/env node
/**
 * generate-equity-snapshots.js
 * Creates synthetic equity ratio snapshots.
 */
import { promises as fs } from 'fs';

async function main(){
  const baseTs = Date.now();
  const mkTs = i => new Date(baseTs + i*3600_000).toISOString();
  const snaps = [
    { unit:'U1', ratio:0.58, ts: mkTs(0) },
    { unit:'U1', ratio:0.59, ts: mkTs(1) },
    { unit:'U1', ratio:0.61, ts: mkTs(2) },
    { unit:'U1', ratio:0.66, ts: mkTs(3) },
    { unit:'U2', ratio:0.49, ts: mkTs(0) },
    { unit:'U2', ratio:0.51, ts: mkTs(1) },
    { unit:'U2', ratio:0.64, ts: mkTs(2) },
    { unit:'U2', ratio:0.66, ts: mkTs(3) }
  ];
  await fs.mkdir('artifacts',{recursive:true});
  await fs.writeFile('artifacts/equity-snapshots.json', JSON.stringify(snaps,null,2));
  console.log('[snapshots] wrote artifacts/equity-snapshots.json');
}
main().catch(e=>{ console.error('snapshot generation error', e); process.exit(2); });
