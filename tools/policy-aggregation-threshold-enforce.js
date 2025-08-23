#!/usr/bin/env node
/**
 * policy-aggregation-threshold-enforce.js
 * Hard deny sample publish if any aggregation cell count < threshold.
 * Usage: node tools/policy-aggregation-threshold-enforce.js [pathToCellsJson]
 * Env:
 *  - POLICY_MIN_CELL_THRESHOLD (default 20)
 */
import { promises as fs } from 'fs';

const CELLS_PATH = process.argv[2] || process.env.POLICY_CELLS_PATH || 'artifacts/aggregation-cells.json';
const THRESHOLD = Number(process.env.POLICY_MIN_CELL_THRESHOLD || 20);

async function loadCells(path){
  try {
    const raw = await fs.readFile(path, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {return Object.fromEntries(data.filter(Boolean).map(x=>[x.id, { count: Number(x.count||0) }]));}
    return data;
  } catch { return null; }
}

function evaluate(cells){
  const violations = [];
  const keys = Object.keys(cells||{});
  for (const k of keys){ const c = Number(cells[k]?.count||0); if (c < THRESHOLD) {violations.push({ cell:k, count:c });} }
  return { total_cells: keys.length, violations };
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const cells = await loadCells(CELLS_PATH);
  if (!cells){
    await fs.writeFile('artifacts/policy-aggregation-threshold.json', JSON.stringify({ version:1, status:'NO_DATA', threshold: THRESHOLD, source: CELLS_PATH }, null, 2));
    console.error('[policy-aggregation-enforce] NO_DATA, deny by default');
    process.exit(2);
  }
  const res = evaluate(cells);
  const status = res.violations.length ? 'DENY' : 'ALLOW';
  await fs.writeFile('artifacts/policy-aggregation-threshold.json', JSON.stringify({ version:1, status, threshold: THRESHOLD, source: CELLS_PATH, ...res }, null, 2));
  if (status === 'DENY'){
    console.error(`[policy-aggregation-enforce] DENY: ${res.violations.length} violation(s)`);
    process.exit(2);
  }
  console.log('[policy-aggregation-enforce] ALLOW');
}

main().catch(e=>{ console.error('[policy-aggregation-enforce] error', e); process.exit(2); });
