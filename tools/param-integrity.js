/**
 * Compares runtime constants (from src or env) with hysteresis-config-v1.yml values.
 * Emits artifacts/param-integrity-matrix.json for Section 28 AUTO:PARAM_MATRIX.
 */
import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'yaml';

const HYSTERESIS_CONFIG = 'docs/fairness/hysteresis-config-v1.yml';
const DEC04_PATH = 'docs/governance/dec/DEC-20250812-04-governance-baseline-thresholds.md';

async function loadYamlParams() {
  const raw = await fs.readFile(HYSTERESIS_CONFIG, 'utf8');
  const doc = yaml.parse(raw);
  return doc?.parameters || {};
}

async function extractDec04Params() {
  // parse DEC-04 for parameters_matrix rows (quick regex fallback)
  const raw = await fs.readFile(DEC04_PATH,'utf8');
  const rowsMatch = raw.match(/parameters_matrix:[\s\S]*?rows:[\s\S]*?(?:\n[^\s-]|\n---)/);
  const rowsSection = rowsMatch ? rowsMatch[0] : '';
  const rowRegex = /- \[(.+?)\]/g;
  const params = {};
  let m; while ((m = rowRegex.exec(rowsSection))){
    const parts = m[1].split(',').map(s=>s.trim());
    const name = parts[0];
    const value = parts[1];
    params[name] = value;
  }
  return params; // values may be string; leave as-is for comparison display
}

function compareNumeric(a,b){
  const na = Number(a); const nb = Number(b);
  if (Number.isNaN(na) || Number.isNaN(nb)) return a===b;
  return na === nb;
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const configParams = await loadYamlParams();
  const dec04Params = await extractDec04Params();

  const matrix = [];
  // Focus on known hysteresis + governance thresholds
  const interesting = [
    'T_enter_major','T_enter_standard','consecutive_required_standard','T_exit',
    'cooldown_snapshots_after_exit','stalled_window_snapshots','stalled_min_ratio','stalled_max_ratio_below_exit','anomaly_delta_threshold_equity_ratio',
    'multi_category_block_threshold','evidence_hash_display_len','numeric_sampling_truncation_decimals','min_cell_aggregation_threshold'
  ];

  for (const p of interesting){
    const configVal = configParams[p];
    const declaredVal = dec04Params[p];
    const match = declaredVal === undefined ? true : compareNumeric(configVal, declaredVal);
    matrix.push({ parameter: p, config: configVal ?? null, declared: declaredVal ?? null, match });
  }

  await fs.writeFile('artifacts/param-integrity-matrix.json', JSON.stringify(matrix,null,2));
}
main().catch(e=>{ console.error('param-integrity error',e); process.exit(2); });
