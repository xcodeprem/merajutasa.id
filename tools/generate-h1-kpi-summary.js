#!/usr/bin/env node
/**
 * generate-h1-kpi-summary.js
 * Aggregates fairness and equity artifacts into a simple KPI summary for UI.
 */
import { promises as fs } from 'fs';

async function read(path){ try { return JSON.parse(await fs.readFile(path,'utf8')); } catch { return null; } }

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const fairness = await read('artifacts/fairness-sim-report.json');
  const under = await read('artifacts/under-served.json');
  const anomalies = await read('artifacts/equity-anomalies.json');
  const summary = await read('artifacts/equity-summary.json');
  const phase = await read('artifacts/phase-tracker.json');
  const adoption = await read('artifacts/terminology-adoption.json');
  const feedback = await read('artifacts/feedback-smoke-report.json');
  const hero = await read('artifacts/hero-snapshot.json');
  const weekly = await read('artifacts/weekly-trends.json');

  const scenariosPass = fairness?.scenarios_pass ?? 0;
  const scenariosTotal = fairness?.scenarios_total ?? 0;
  const fairnessPass = scenariosTotal>0 && scenariosPass === scenariosTotal;
  const result = {
    version: '1.0.0',
    generated_utc: new Date().toISOString(),
    phase: phase?.current_phase || null,
    fairness: {
      pass: fairnessPass,
      scenarios_pass: scenariosPass,
      scenarios_total: scenariosTotal,
      detection_delay_avg_snapshots: fairness?.detection_delay_avg_snapshots ?? null
    },
    equity: {
      index: summary?.equity_index ?? null,
      index_raw: summary?.equity_index_raw ?? null,
      under_served_total: under?.total ?? null,
      anomalies_count: anomalies?.anomalies_count ?? null
    },
    adoption: {
      percent: adoption?.adoptionPercent ?? null,
      old_total: adoption?.old_total ?? null,
      new_total: adoption?.new_total ?? null
    },
    feedback: {
      ingested: feedback?.ingested ?? null,
      categories: feedback?.categories ?? null
    },
    trust: {
      hero_badges: hero?.hero_copy?.badges ?? null,
      disclaimers_status: hero?.governance?.disclaimers_status ?? null
    },
    weekly: {
      weeks: weekly?.weeks ?? [],
      latest: weekly?.weeks?.length ? weekly.weeks[weekly.weeks.length-1] : null,
      coverage_latest: weekly?.weeks?.length ? weekly.weeks[weekly.weeks.length-1].totals?.coverage ?? null : null,
      throughput_latest: weekly?.weeks?.length ? weekly.weeks[weekly.weeks.length-1].totals?.events ?? null : null
    }
  };
  await fs.writeFile('artifacts/h1-kpi-summary.json', JSON.stringify(result,null,2));
  console.log(`[h1-kpi] fairness_pass=${result.fairness.pass} under_served=${result.equity.under_served_total} anomalies=${result.equity.anomalies_count}`);
}

main().catch(e=>{ console.error('[h1-kpi] error', e); process.exit(2); });
