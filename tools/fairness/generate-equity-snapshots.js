#!/usr/bin/env node
/**
 * generate-equity-snapshots.js
 * Creates synthetic equity ratio snapshots AND derives an equity summary
 * using computeEquityIndex (DEC-20250813-09 rounding rules).
 * NOTE: This is a synthetic generator for demo/tests. In production, buckets
 *       come from 24h event aggregation per unit (see Equity Snapshot Pseudocode).
 */
import { promises as fs } from 'fs';
import { computeEquityIndex } from './rounding-util.js';

async function main(){
  const baseTs = Date.now();
  const mkTs = i => new Date(baseTs + i*3600_000).toISOString();
  const snaps = [
    { unit:'U1', ratio:0.58, ts: mkTs(0) },
    { unit:'U1', ratio:0.59, ts: mkTs(1) },
  { unit:'U1', ratio:0.61, ts: mkTs(2) },
  { unit:'U1', ratio:0.62, ts: mkTs(3) },
    { unit:'U2', ratio:0.49, ts: mkTs(0) },
    { unit:'U2', ratio:0.51, ts: mkTs(1) },
    { unit:'U2', ratio:0.64, ts: mkTs(2) },
    { unit:'U2', ratio:0.66, ts: mkTs(3) }
  ];
  await fs.mkdir('artifacts',{recursive:true});
  await fs.writeFile('artifacts/equity-snapshots.json', JSON.stringify(snaps,null,2));

  // Latest ratio per unit -> pseudo counts (scaled) -> equity index
  const latestByUnit = {};
  for (const s of snaps) {
    if (!latestByUnit[s.unit] || latestByUnit[s.unit].ts < s.ts) latestByUnit[s.unit] = s;
  }
  // Scale ratios to counts (0..10000) to approximate distribution shape
  const buckets = Object.fromEntries(Object.entries(latestByUnit).map(([u, v]) => [u, Number((v.ratio * 10000).toFixed(0))]));
  const equity = computeEquityIndex(buckets);
  await fs.writeFile('artifacts/equity-summary.json', JSON.stringify({
    version: '0.1.0',
    generated_utc: new Date().toISOString(),
    buckets,
    equity_index_raw: equity.raw,
    equity_index: equity.rounded,
    rounding_decimals: 2,
    rounding_method: 'half_up'
  }, null, 2));

  console.log('[snapshots] wrote artifacts/equity-snapshots.json');
  console.log(`[snapshots] equity_index=${equity.rounded} raw=${equity.raw}`);
}
main().catch(e=>{ console.error('snapshot generation error', e); process.exit(2); });
