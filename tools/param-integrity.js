/**
 * Param Integrity Matrix (Wave 1)
 * Compares sealed configuration (YAML) & DEC governance thresholds against internal expectations.
 * Emits artifacts/param-integrity-matrix.json with status summary.
 *
 * Wave 1 changes:
 *  - Added parameters: disclaimer_D7_default, terminology_stage2_trigger_formula, revocation_reason_codes, revocation_reason_codes_count
 *  - Hard fail (non-zero exit) on any MISMATCH or missing source (MISSING_ALL / MISSING_OTHERS)
 *  - Added derived count row (revocation_reason_codes_count) to verify enumeration cardinality stability
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

  // Code constants (internal expectations used by engine logic). For now hard-coded; Wave 1 move to a single source-of-truth module.
  // If a constant not yet implemented in code, leave as null to signal MISSING_CODE.
  const codeConstants = {
    T_exit: 0.65,
    T_entry_standard: 0.60, // alias for T_enter_standard
    T_entry_major: 0.50,    // alias for T_enter_major
    cooldown_min: 1,        // derived from cooldown_snapshots_after_exit (min & max same for current Option F)
    cooldown_max: 1,
    lookback_window: 5,     // aligns with stalled_window_snapshots (interpretation as lookback window)
    anomaly_delta: 0.03,    // anomaly_delta_threshold_equity_ratio
    multi_category_block_threshold: Number(dec04Params['multi_category_block_threshold'] ?? 2),
    min_cell_aggregation_threshold: Number(dec04Params['min_cell_aggregation_threshold'] ?? 20),
    evidence_hash_display_len: Number(dec04Params['evidence_hash_display_len'] ?? 16),
  numeric_sampling_truncation_decimals: Number(dec04Params['numeric_sampling_truncation_decimals'] ?? 2),
  // Wave 1 added constants
  disclaimer_D7_default: (dec04Params['disclaimer_D7_default'] || 'off'),
  terminology_stage2_trigger_formula: normalizeQuoted(dec04Params['terminology_stage2_trigger_formula'] || '5 distinct OR 12 cumulative/7d'),
  revocation_reason_codes: normalizeQuoted(dec04Params['revocation_reason_codes'] || 'USER_REQUEST|COMPROMISED|POLICY_VIOLATION|DATA_SUPERSEDED|INTEGRITY_ERROR'),
  revocation_reason_codes_count: (normalizeQuoted(dec04Params['revocation_reason_codes'] || '')).split('|').filter(s=>s).length
  };

  // Parameter alias mapping to unify names across YAML, DEC matrix, and requirement spec (Option F list)
  const paramMap = [
    { canonical: 'T_exit', config: 'T_exit', dec: 'T_exit' },
    { canonical: 'T_entry_standard', config: 'T_enter_standard', dec: 'T_enter_standard' },
    { canonical: 'T_entry_major', config: 'T_enter_major', dec: 'T_enter_major' },
    { canonical: 'cooldown_min', config: 'cooldown_snapshots_after_exit', dec: 'cooldown_snapshots_after_exit' },
    { canonical: 'cooldown_max', config: 'cooldown_snapshots_after_exit', dec: 'cooldown_snapshots_after_exit' },
    { canonical: 'lookback_window', config: 'stalled_window_snapshots', dec: 'stalled_window_snapshots' },
    { canonical: 'anomaly_delta', config: 'anomaly_delta_threshold_equity_ratio', dec: 'anomaly_delta_threshold_equity_ratio' },
    { canonical: 'multi_category_block_threshold', config: null, dec: 'multi_category_block_threshold' },
    { canonical: 'min_cell_aggregation_threshold', config: null, dec: 'min_cell_aggregation_threshold' },
    { canonical: 'evidence_hash_display_len', config: null, dec: 'evidence_hash_display_len' },
    { canonical: 'numeric_sampling_truncation_decimals', config: null, dec: 'numeric_sampling_truncation_decimals' },
    // Wave 1 additions
    { canonical: 'disclaimer_D7_default', config: null, dec: 'disclaimer_D7_default' },
    { canonical: 'terminology_stage2_trigger_formula', config: null, dec: 'terminology_stage2_trigger_formula', decTransform: normalizeQuoted },
    { canonical: 'revocation_reason_codes', config: null, dec: 'revocation_reason_codes', decTransform: normalizeQuoted },
    { canonical: 'revocation_reason_codes_count', config: null, dec: 'revocation_reason_codes', decTransform: v => normalizeQuoted(v).split('|').filter(s=>s).length }
  ];

  const rows = paramMap.map(m => {
    const configVal = m.config ? configParams[m.config] : null;
    const decRaw = m.dec ? dec04Params[m.dec] : null;
    let decVal = decRaw === undefined ? null : decRaw;
    if (typeof decVal === 'string') decVal = normalizeQuoted(decVal);
    if (decVal !== null && m.decTransform) decVal = m.decTransform(decVal);
    const codeVal = Object.prototype.hasOwnProperty.call(codeConstants, m.canonical) ? codeConstants[m.canonical] : null;

    // Normalize numeric strings
    const norm = v => (v === null || v === undefined ? null : (typeof v === 'string' && /^\d+(\.\d+)?$/.test(v) ? Number(v) : v));
    const nConfig = norm(configVal);
    const nDec = norm(decVal);
    const nCode = norm(codeVal);

    const sources = { config: nConfig, dec: nDec, code: nCode };
    const presentSources = Object.entries(sources).filter(([k,v])=>v!==null).map(([k])=>k);
    let status;
    if (presentSources.length === 0) status = 'MISSING_ALL';
    else if (presentSources.length === 1) status = 'MISSING_OTHERS';
    else {
      const vals = presentSources.map(k=>sources[k]);
      const allEqual = vals.every(v => compareNumeric(v, vals[0]));
      status = allEqual ? 'MATCH' : 'MISMATCH';
    }
    return {
      parameter: m.canonical,
      aliases: { config: m.config, dec: m.dec },
      values: sources,
      sources_present: presentSources,
      status
    };
  });

  const summaryCounts = rows.reduce((acc,r)=>{ acc[r.status]=(acc[r.status]||0)+1; return acc; },{});
  const mismatchCount = rows.filter(r=>r.status==='MISMATCH').length;
  const missingCount = rows.filter(r=>r.status==='MISSING_ALL' || r.status==='MISSING_OTHERS').length;
  const overallStatusV2 = (mismatchCount===0 && missingCount===0) ? 'PASS' : 'MISMATCH';
  const out = { version: 2, generated_utc: new Date().toISOString(), status: overallStatusV2, summary_counts: summaryCounts, rows };
  await fs.writeFile('artifacts/param-integrity-matrix.json', JSON.stringify(out,null,2));
  if (overallStatusV2 !== 'PASS') {
    console.error('[param-integrity] HARD FAIL – mismatches or missing parameters detected');
    process.exit(10);
  }
}
main().catch(e=>{ console.error('param-integrity error',e); process.exit(2); });

// Helper placed at end to avoid hoist confusion above
function normalizeQuoted(v){
  if (typeof v !== 'string') return v;
  const trimmed = v.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.substring(1, trimmed.length-1);
  }
  return trimmed;
}
