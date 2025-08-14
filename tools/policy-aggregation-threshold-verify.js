#!/usr/bin/env node
/**
 * policy-aggregation-threshold-verify.js
 * Advisory check: evaluate aggregation cell counts against a minimum threshold.
 * Inputs (optional):
 *  - POLICY_CELLS_PATH (env) path to JSON of cells counts. Shape:
 *      { "cellA": {"count": 12}, "cellB": {"count": 34} }
 *    or an array of { id, count }.
 * Output: artifacts/policy-aggregation-threshold.json
 */
import { promises as fs } from 'fs';

const OUT_PATH = 'artifacts/policy-aggregation-threshold.json';
const CELLS_PATH = process.env.POLICY_CELLS_PATH || 'artifacts/aggregation-cells.json';
// Baseline per DEC-20250812-04-governance-baseline-thresholds.md
const THRESHOLD = Number(process.env.POLICY_MIN_CELL_THRESHOLD || 20);

async function loadCells(path){
  try {
    const raw = await fs.readFile(path, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      const obj = {};
      for (const it of data) { if (it && it.id) obj[it.id] = { count: Number(it.count||0) }; }
      return obj;
    }
    if (data && typeof data === 'object') return data;
  } catch {/* ignore */}
  return null;
}

function evaluate(cells){
  const violations = [];
  const keys = Object.keys(cells);
  for (const k of keys){
    const c = Number(cells[k]?.count || 0);
    if (c < THRESHOLD) violations.push({ cell: k, count: c });
  }
  return { total_cells: keys.length, violations };
}

async function main(){
  await fs.mkdir('artifacts', { recursive: true });
  const cells = await loadCells(CELLS_PATH);
  if (!cells){
    const out = { version: 1, status: 'NO_DATA', threshold: THRESHOLD, source: CELLS_PATH, total_cells: 0, violations: [] };
    await fs.writeFile(OUT_PATH, JSON.stringify(out, null, 2));
    console.log('[policy-aggregation-threshold] NO_DATA (advisory)');
    process.exit(0);
  }
  const res = evaluate(cells);
  const status = res.violations.length > 0 ? 'VIOLATIONS' : 'OK';
  const out = { version: 1, status, threshold: THRESHOLD, source: CELLS_PATH, ...res };
  await fs.writeFile(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(`[policy-aggregation-threshold] ${status} violations=${res.violations.length} total_cells=${res.total_cells}`);
}

main().catch(e=>{ console.error('[policy-aggregation-threshold] error', e); process.exit(0); });
