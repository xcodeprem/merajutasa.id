#!/usr/bin/env node
/**
 * generate-h1-kpi-summary.js
 * Aggregates fairness and equity artifacts into a simple KPI summary for UI.
 */
import { promises as fs } from 'fs';
import { stableStringify, addMetadata } from './lib/json-stable.js';

async function read(path){ try { return JSON.parse(await fs.readFile(path,'utf8')); } catch { return null; } }
async function readNdjson(path){
  try {
    const txt = await fs.readFile(path,'utf8');
    return txt.split(/\r?\n/).filter(Boolean).map(l=>{ try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return null; }
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const fairness = await read('artifacts/fairness-sim-report.json');
  const under = await read('artifacts/under-served.json');
  const anomalies = await read('artifacts/equity-anomalies.json');
  const summary = await read('artifacts/equity-summary.json');
  const phase = await read('artifacts/phase-tracker.json');
  const adoption = await read('artifacts/terminology-adoption.json');
  const feedback = await read('artifacts/feedback-smoke-report.json');
  const feedbackRecords = await readNdjson('artifacts/feedback-records.ndjson');
  const hero = await read('artifacts/hero-snapshot.json');
  const weekly = await read('artifacts/weekly-trends.json');

  const scenariosPass = fairness?.scenarios_pass ?? 0;
  const scenariosTotal = fairness?.scenarios_total ?? 0;
  const fairnessPass = scenariosTotal>0 && scenariosPass === scenariosTotal;
  const result = {
    version: '1.1.0',
    generated_utc: new Date().toISOString(),
    phase: phase?.current_phase || null,
    fairness: {
      pass: fairnessPass,
      scenarios_pass: scenariosPass,
      scenarios_total: scenariosTotal,
      detection_delay_avg_snapshots: fairness?.detection_delay_avg_snapshots ?? null,
    },
    equity: {
      index: summary?.equity_index ?? null,
      index_raw: summary?.equity_index_raw ?? null,
      under_served_total: under?.total ?? null,
      anomalies_count: anomalies?.anomalies_count ?? null,
    },
    adoption: {
      percent: adoption?.adoptionPercent ?? null,
      old_total: adoption?.old_total ?? null,
      new_total: adoption?.new_total ?? null,
    },
    feedback: (()=>{
      const out = { ingested: null, categories: null };
      // Prefer real records if available
      if (Array.isArray(feedbackRecords) && feedbackRecords.length){
        out.ingested = feedbackRecords.length;
        const counts = {};
        for (const r of feedbackRecords){
          if (Array.isArray(r.categories)){
            for (const c of r.categories){
              const key = String(c).toLowerCase();
              counts[key] = (counts[key]||0)+1;
            }
          }
        }
        out.categories = counts;
        return out;
      }
      // Fallback to smoke report if it contains summary-like fields
      if (feedback){
        out.ingested = feedback.ingested ?? (Array.isArray(feedback.results)? feedback.results.filter(x=>x.status==='OK').length : null);
        out.categories = feedback.categories ?? null;
      }
      return out;
    })(),
    trust: {
      hero_badges: hero?.hero_copy?.badges ?? null,
      disclaimers_status: hero?.governance?.disclaimers_status ?? null,
    },
    weekly: {
      weeks: weekly?.weeks ?? [],
      latest: weekly?.weeks?.length ? weekly.weeks[weekly.weeks.length-1] : null,
      coverage_latest: weekly?.weeks?.length ? weekly.weeks[weekly.weeks.length-1].totals?.coverage ?? null : null,
      throughput_latest: weekly?.weeks?.length ? weekly.weeks[weekly.weeks.length-1].totals?.events ?? null : null,
      decision_mix: weekly?.decision_mix ?? null,
    },
  };
  const resultWithMetadata = addMetadata(result, { generator: 'generate-h1-kpi-summary.js' });
  await fs.writeFile('artifacts/h1-kpi-summary.json', stableStringify(resultWithMetadata));
  console.log(`[h1-kpi] fairness_pass=${result.fairness.pass} under_served=${result.equity.under_served_total} anomalies=${result.equity.anomalies_count}`);
}

main().catch(e=>{ console.error('[h1-kpi] error', e); process.exit(2); });
