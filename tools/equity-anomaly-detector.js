#!/usr/bin/env node
/**
 * equity-anomaly-detector.js (enhanced)
 * H1-B3: Detect equity ratio delta anomalies using hysteresis-consistent gates + TWD-style partitioning:
 *  - EMA smoothing (alpha)
 *  - phi(s) confidence from logistic->entropy (normalized) -> phi = 1 - H
 *  - dynamic alpha/beta thresholds via rolling mean/std of phi (μ±λσ)
 *  - three-way regions: POS (act), BND (defer), NEG (ignore)
 *  - min samples
 *  - consecutive deltas above threshold (only counted in POS)
 *  - cooldown between alerts
 *  - toggling guard: max anomalies per sliding window
 * Inputs:
 *   - artifacts/equity-snapshots.json (array {unit, ratio, ts})
 *   - docs/fairness/hysteresis-config-v1.yml (parameters.anomaly)
 * Output: artifacts/equity-anomalies.json
 */
import { promises as fs } from 'fs';
import yaml from 'yaml';

async function readJson(p){ try { return JSON.parse(await fs.readFile(p,'utf8')); } catch { return null; } }

async function loadParams(){
  const raw = await fs.readFile('docs/fairness/hysteresis-config-v1.yml','utf8');
  const cfg = yaml.parse(raw)?.parameters || {};
  const a = cfg.anomaly || {};
  return {
    delta_threshold: a.delta_threshold ?? cfg.anomaly_delta_threshold_equity_ratio ?? 0.03,
    min_samples: a.min_samples ?? 5,
    consecutive_required: a.consecutive_required ?? 2,
    cooldown_snapshots: a.cooldown_snapshots ?? 3,
    smoothing_alpha: a.smoothing_alpha ?? 0,
    // TWD-style confidence and dynamic thresholds
    phi_k: a.phi_k ?? 0.01,                    // logistic slope scale for mapping |delta|-thr
    phi_window: a.phi_window ?? 20,            // rolling window size for phi statistics
    lambda: a.lambda ?? 1.0,                   // width multiplier for dynamic thresholds
    alpha_beta_min_gap: a.alpha_beta_min_gap ?? 0.1, // ensure α<β by at least this gap when σ≈0
    // toggling guard
    guard_window: a.guard_window ?? 12,        // sliding window (snapshots) to limit firings
    guard_max_alerts: a.guard_max_alerts ?? 2,  // max anomalies allowed in the window
  };
}

function ema(prev, x, alpha){ return prev==null? x : alpha * x + (1-alpha) * prev; }

function logistic(x){ return 1 / (1 + Math.exp(-x)); }

function entropy01(p){
  // binary entropy normalized to [0,1] using log base e divided by ln 2
  const eps = 1e-12;
  const pp = Math.min(1 - eps, Math.max(eps, p));
  const q = 1 - pp;
  const H = -(pp * Math.log(pp) + q * Math.log(q)) / Math.log(2); // in [0,1]
  return H; // already normalized to [0,1] for binary case
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const params = await loadParams();
  const snaps = (await readJson('artifacts/equity-snapshots.json')) || [];
  // Load persisted phi history (per unit)
  const phiHistoryPath = 'artifacts/equity-phi-history.json';
  const phiHistory = (await readJson(phiHistoryPath)) || {};
  // Load decision log (per snapshot) to enable weekly aggregation and de-dup across runs
  const decisionLogPath = 'artifacts/equity-decision-log.json';
  const decisionLogArr = Array.isArray(await readJson(decisionLogPath)) ? await readJson(decisionLogPath) : [];
  const decisionLogMap = new Map();
  for (const e of decisionLogArr){ if (e && e.unit && e.ts) {decisionLogMap.set(`${e.unit}__${e.ts}`, e);} }
  const byUnit = new Map();
  for (const s of snaps){ if (!byUnit.has(s.unit)) {byUnit.set(s.unit, []);} byUnit.get(s.unit).push(s); }

  const anomalies = [];
  const regionStats = {};
  for (const [unit, arr] of byUnit.entries()){
    const sorted = arr.slice().sort((a,b)=> a.ts.localeCompare(b.ts));
    if (sorted.length < params.min_samples) {continue;}
    let smoothedPrev = null; let consec=0; let cooldown=0; let lastAnomTs=null;
    // TWD tracking
    // Seed phi window with persisted history for smoothing across restarts
    const phiWindow = Array.isArray(phiHistory[unit]) ? phiHistory[unit].slice(-params.phi_window) : [];
    const regionCounts = { POS:0, BND:0, NEG:0 };
    // toggling guard (by index window)
    const recentAnomalyIdx = [];
    for (let i=0;i<sorted.length;i++){
      const curr = sorted[i];
      const ratioSm = params.smoothing_alpha>0? ema(smoothedPrev, curr.ratio, params.smoothing_alpha) : curr.ratio;
      if (smoothedPrev==null){ smoothedPrev = ratioSm; continue; }
      const delta = +(ratioSm - smoothedPrev).toFixed(4);
      smoothedPrev = ratioSm;
      if (cooldown>0){ cooldown--; continue; }
      // Compute phi(s): map |delta|-threshold via logistic; then phi = 1 - entropy(p)
      const margin = Math.abs(delta) - params.delta_threshold;
      const pAnom = logistic(margin / Math.max(1e-9, params.phi_k));
      const phi = 1 - entropy01(pAnom);
      // maintain rolling phi stats
      phiWindow.push(phi);
      if (phiWindow.length > params.phi_window) {phiWindow.shift();}
      const mu = phiWindow.reduce((s,v)=>s+v,0) / phiWindow.length;
      const variance = phiWindow.reduce((s,v)=> s + (v-mu)*(v-mu), 0) / phiWindow.length;
      const sigma = Math.sqrt(Math.max(0, variance));
      let alpha = Math.max(0, Math.min(1, mu - params.lambda * sigma));
      let beta  = Math.max(0, Math.min(1, mu + params.lambda * sigma));
      if (beta - alpha < params.alpha_beta_min_gap){
        // enforce minimal separation around mu when distribution is too tight
        alpha = Math.max(0, Math.min(1, mu - params.alpha_beta_min_gap/2));
        beta  = Math.max(0, Math.min(1, mu + params.alpha_beta_min_gap/2));
      }
      // region assignment
      let region;
      if (phi >= beta) {region = 'POS';} else if (phi <= alpha) {region = 'NEG';} else {region = 'BND';}
      regionCounts[region]++;

      // Record per-snapshot decision for weekly aggregation; de-dup by (unit,ts)
      const key = `${unit}__${curr.ts}`;
      decisionLogMap.set(key, { unit, ts: curr.ts, region, phi: +phi.toFixed(4), alpha: +alpha.toFixed(4), beta: +beta.toFixed(4) });

      // Sliding window guard: drop old anomaly indices
      while (recentAnomalyIdx.length && recentAnomalyIdx[0] <= i - params.guard_window) {
        recentAnomalyIdx.shift();
      }

      // Decision: count consecutive only in POS (confident); defer in BND; reset in NEG
      if (region === 'POS' && Math.abs(delta) >= params.delta_threshold){
        consec += 1;
        if (consec >= params.consecutive_required){
          // toggling guard: suppress if too many in recent window
          if (recentAnomalyIdx.length < params.guard_max_alerts){
            anomalies.push({ unit, ts: curr.ts, delta, threshold: params.delta_threshold, consec, last_anomaly_ts: lastAnomTs,
              twd: { phi: +phi.toFixed(4), alpha: +alpha.toFixed(4), beta: +beta.toFixed(4), region } });
            lastAnomTs = curr.ts;
            recentAnomalyIdx.push(i);
            cooldown = params.cooldown_snapshots;
          }
          consec = 0; // reset after considering fire
        }
      } else if (region === 'NEG') {
        consec = 0;
      } else {
        // BND: defer, do not change consec (neither inc nor reset)
      }
    }
    // Update persisted phi history for this unit (keep last phi_window values)
    phiHistory[unit] = phiWindow.slice(-params.phi_window);
    // capture region stats per unit
    regionStats[unit] = regionCounts;
  }
  const report = { version:'1.2.1', generated_utc: new Date().toISOString(), params, anomalies_count: anomalies.length, anomalies, region_stats: regionStats };
  await fs.writeFile('artifacts/equity-anomalies.json', JSON.stringify(report,null,2));
  // Persist updated phi history map
  await fs.writeFile(phiHistoryPath, JSON.stringify(phiHistory,null,2));
  // Persist compacted decision log (keep last 5000 by ts)
  const merged = Array.from(decisionLogMap.values()).sort((a,b)=> String(a.ts).localeCompare(String(b.ts)));
  const trimmed = merged.slice(-5000);
  await fs.writeFile(decisionLogPath, JSON.stringify(trimmed,null,2));
  console.log(`[equity-anomaly] anomalies=${anomalies.length} thr=${params.delta_threshold} min=${params.min_samples} consec=${params.consecutive_required} cool=${params.cooldown_snapshots} phi_window=${params.phi_window} lambda=${params.lambda} guard=${params.guard_max_alerts}/${params.guard_window}`);
}

main().catch(e=>{ console.error('[equity-anomaly] error', e); process.exit(2); });
