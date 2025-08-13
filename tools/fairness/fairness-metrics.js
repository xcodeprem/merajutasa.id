#!/usr/bin/env node
/**
 * fairness-metrics.js (Wave 1 - 5.3 instrumentation)
 * Consumes fairness simulation scenarios + unit test artifact + optionally live run logs (future)
 * to produce aggregated transition/time-in-state metrics.
 * Output: artifacts/fairness-metrics.json
 */
import { promises as fs } from 'fs';
import { decide } from './engine-core.js';
import yaml from 'yaml';

async function loadParams(){
  try { const raw=await fs.readFile('docs/fairness/hysteresis-config-v1.yml','utf8'); return yaml.parse(raw).parameters; } catch { return null; }
}

async function safeRead(p){ try { return JSON.parse(await fs.readFile(p,'utf8')); } catch { return null; } }

function accumulateFromScenarios(scenarios, params){
  if(!scenarios) return { states:{}, events:{}, scenario_count:0, time_in_state:{} };
  const states={}, events={}, time_in_state={};
  scenarios.scenarios?.forEach(sc=>{
    let st=null; const seq = sc.sequence || []; let lastState='NONE';
    seq.forEach(ratio=>{
      const res = decide(params||{}, st, ratio);
      const s = res.state;
      time_in_state[s]=(time_in_state[s]||0)+1;
      st = res;
      res.events.forEach(ev=>{ events[ev.type]=(events[ev.type]||0)+1; });
      lastState = s;
    });
    states[lastState]=(states[lastState]||0)+1;
  });
  return { states, events, scenario_count: scenarios.scenario_count || (scenarios.scenarios?.length||0), time_in_state };
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const scenarios = await safeRead('artifacts/fairness-sim-scenarios.json');
  const params = await loadParams();
  const unit = await safeRead('artifacts/fairness-engine-unit-tests.json');
  const eventsAgg = accumulateFromScenarios(scenarios, params);
  const unitSummary = unit?.summary || null;
  const report = {
    version: '1.0.0',
    generated_utc: new Date().toISOString(),
    sources: {
      scenarios_present: !!scenarios,
      unit_tests_present: !!unit
    },
    transitions: eventsAgg.events,
  final_state_distribution: eventsAgg.states,
  time_in_state_snapshots: eventsAgg.time_in_state,
    scenario_count: eventsAgg.scenario_count,
    unit_tests: unitSummary,
    quality: {
      unit_fail: unitSummary ? unitSummary.fail : null,
      unit_pass: unitSummary ? unitSummary.pass : null
    }
  };
  await fs.writeFile('artifacts/fairness-metrics.json', JSON.stringify(report,null,2));
  console.log('[fairness-metrics] written artifacts/fairness-metrics.json');
}

main().catch(e=>{ console.error('[fairness-metrics] error', e); process.exit(2); });
