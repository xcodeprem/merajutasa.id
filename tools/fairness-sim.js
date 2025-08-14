/**
 * fairness-sim.js
 * Minimal simulation harness for Option F hysteresis state machine.
 * Produces:
 *  - artifacts/fairness-sim-scenarios.json (baseline scenario definitions + outcomes)
 *  - artifacts/fairness-sim-report.json (aggregated metrics)
 */
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { decide } from './fairness/engine-core.js';

const CONFIG_PATH = 'docs/fairness/hysteresis-config-v1.yml';

async function loadConfig(){
  const raw = await fs.readFile(CONFIG_PATH,'utf8');
  const parsed = yaml.parse(raw);
  return { parameters: parsed.parameters, dec_id: parsed.dec_id };
}


function simulateScenario(p, scenario){
  let st = null; // holds state per unit (single unit harness)
  const transitions=[]; let firstSignalIdx=null; let activeIdx=null; let exitIdx=null;
  const ratios = scenario.sequence;
  ratios.forEach((r, idx)=>{
    const prev = st;
    const result = decide(p, prev, r);
    st = { ...result, lastRatio:r, idx };
    if (result.events.length){
      result.events.forEach(ev=> transitions.push({ idx, ratio:r, ...ev }));
      if (activeIdx==null && result.events.find(e=> e.type==='ENTER')) activeIdx=idx;
      if (exitIdx==null && result.events.find(e=> e.type==='EXIT')) exitIdx=idx;
    }
    if (firstSignalIdx==null && (r < p.T_enter_standard)) firstSignalIdx=idx; // borderline or severe
  });
  const final = st?.state || 'NONE';
  const entryEvent = transitions.find(t=> t.type==='ENTER');
  const detectionDelay = (activeIdx!=null && firstSignalIdx!=null) ? (activeIdx - firstSignalIdx) : null;
  return { final_state: final, entry_reason: entryEvent?.reason || null, transitions, detection_delay_snapshots: detectionDelay };
}

function buildScenarios(){
  // At least 10 baseline scenarios.
  return [
    {
      id:'S1',
      description:'Immediate severe entry (<0.50) leads to ACTIVE',
      sequence:[0.49],
      expected:{ final_state:'ACTIVE', entry_reason:'severe' }
    },
    {
      id:'S2',
      description:'Single borderline snapshot remains CANDIDATE',
      sequence:[0.55],
      expected:{ final_state:'CANDIDATE' }
    },
    {
      id:'S3',
      description:'Two consecutive borderline snapshots promote to ACTIVE (consecutive)',
      sequence:[0.58,0.59,0.59],
      expected:{ final_state:'ACTIVE', entry_reason:'consecutive' }
    },
    {
      id:'S4',
      description:'Borderline then high ratio aborts candidate back to NONE',
      sequence:[0.58,0.62],
      expected:{ final_state:'NONE' }
    },
    {
      id:'S5',
      description:'Severe entry then exit when ratio >= T_exit',
      sequence:[0.49,0.52,0.66],
      expected:{ final_state:'CLEARED' }
    },
    {
      id:'S6',
      description:'Consecutive borderline entry then no exit (stays ACTIVE)',
      sequence:[0.55,0.56,0.56,0.57],
      expected:{ final_state:'ACTIVE' }
    },
    {
      id:'S7',
      description:'Exit then borderline after cooldown -> CANDIDATE (cooldown length=1)',
  sequence:[0.49,0.70,0.57],
  expected:{ final_state:'CANDIDATE' }
    },
    {
      id:'S8',
      description:'Exit then severe ratio triggers REENTER while in cooldown (engine behavior)',
      sequence:[0.49,0.70,0.49],
      expected:{ final_state:'ACTIVE' }
    },
    {
      id:'S9',
      description:'Multiple severe re-entries (churn example)',
      sequence:[0.49,0.70,0.49,0.70,0.49],
      expected:{ final_state:'ACTIVE' }
    },
    {
      id:'S10',
      description:'No activation path (all high ratios)',
      sequence:[0.70,0.72,0.74],
      expected:{ final_state:'NONE' }
    }
  ];
}

async function main(){
  const { parameters: p, dec_id } = await loadConfig();
  const scenarios = buildScenarios();
  const enriched = scenarios.map(sc=>{
    const result = simulateScenario(p, sc);
    const pass = Object.entries(sc.expected).every(([k,v])=> result[k] === v);
    return { ...sc, result, pass };
  });
  const activeEntries = enriched.flatMap(s=> s.result.transitions.filter(t=> t.type==='ENTER'));
  const reentries = enriched.flatMap(s=> s.result.transitions.filter(t=> t.type==='REENTER'));
  const exits = enriched.flatMap(s=> s.result.transitions.filter(t=> t.type==='EXIT'));
  const detectionDelays = enriched.map(s=> s.result.detection_delay_snapshots).filter(v=> v!=null);
  const detectionDelayAvg = detectionDelays.length? (detectionDelays.reduce((a,b)=>a+b,0)/detectionDelays.length) : null;
  const report = {
    version:'1.0.0',
    generated_at: new Date().toISOString(),
    dec_ref: dec_id || null,
    scenarios_total: enriched.length,
    scenarios_pass: enriched.filter(s=> s.pass).length,
    active_entries_total: activeEntries.length,
    reentries_total: reentries.length,
    exits_total: exits.length,
    churn_ratio: activeEntries.length ? Number((reentries.length / activeEntries.length).toFixed(3)) : 0,
    detection_delay_avg_snapshots: detectionDelayAvg
  };
  await fs.mkdir('artifacts',{recursive:true});
  await fs.writeFile('artifacts/fairness-sim-scenarios.json', JSON.stringify({
    version:'1.0.0',
    coverage_tag:'baseline_v1',
    dec_ref: dec_id || null,
    scenario_count: enriched.length,
    scenarios: enriched
  },null,2));
  await fs.writeFile('artifacts/fairness-sim-report.json', JSON.stringify(report,null,2));
  console.log(`[fairness-sim] scenarios=${enriched.length} pass=${report.scenarios_pass}/${report.scenarios_total} activeEntries=${report.active_entries_total} exits=${report.exits_total}`);
}

main().catch(e=>{ console.error('fairness-sim error', e); process.exit(2); });
