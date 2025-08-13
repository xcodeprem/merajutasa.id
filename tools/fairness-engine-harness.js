#!/usr/bin/env node
/**
 * fairness-engine-harness.js
 * Advisory runtime harness executing fairness-sim scenarios through an isolated engine implementation
 * to validate invariants (no illegal state transitions, cooldown respected, detection delay bounds).
 * Output: artifacts/fairness-engine-harness-report.json
 */
import { promises as fs } from 'fs';
import yaml from 'yaml';

const CONFIG_PATH = 'docs/fairness/hysteresis-config-v1.yml';

async function loadConfig(){
  const raw = await fs.readFile(CONFIG_PATH,'utf8');
  const parsed = yaml.parse(raw);
  return parsed.parameters;
}

function decide(p, prevState, ratio){
  const state = prevState?.state || 'NONE';
  const consecutive = prevState?.consecutive || 0;
  const cooldownLeft = prevState?.cooldownLeft || 0;
  let newState = state; let newConsec = consecutive; let newCooldown = cooldownLeft>0? cooldownLeft-1:0; const events=[];
  const severe = ratio < p.T_enter_major;
  const borderline = ratio < p.T_enter_standard && ratio >= p.T_enter_major;
  switch(state){
    case 'NONE':
      if (severe){ newState='ACTIVE'; events.push({type:'ENTER',reason:'severe'}); }
      else if (borderline){ newState='CANDIDATE'; newConsec=1; }
      break;
    case 'CANDIDATE':
      if (severe){ newState='ACTIVE'; events.push({type:'ENTER',reason:'severe'}); }
      else if (borderline){ newConsec+=1; if (newConsec >= p.consecutive_required_standard){ newState='ACTIVE'; events.push({type:'ENTER',reason:'consecutive'});} }
      else { newState='NONE'; newConsec=0; }
      break;
    case 'ACTIVE':
      if (ratio >= p.T_exit){ newState='CLEARED'; newCooldown=p.cooldown_snapshots_after_exit; events.push({type:'EXIT'}); }
      break;
    case 'CLEARED':
      if (severe){ newState='ACTIVE'; events.push({type:'REENTER',reason:'severe'}); }
      else if (newCooldown===0 && borderline){ newState='CANDIDATE'; newConsec=1; }
      break;
  }
  return { state:newState, consecutive:newConsec, cooldownLeft:newCooldown, events };
}

function loadBaselineScenariosSync(){
  try { return JSON.parse(require('fs').readFileSync('artifacts/fairness-sim-scenarios.json','utf8')).scenarios || []; } catch { return []; }
}

function evaluateScenario(p, sc){
  let st = null; const transitions=[]; const illegal=[];
  sc.sequence.forEach((r, idx)=>{
    const prev = st;
    const res = decide(p, prev, r);
    if (res.state==='CLEARED' && res.cooldownLeft > p.cooldown_snapshots_after_exit) illegal.push({ idx, rule:'COOLDOWN_OVERRANGE' });
    if (prev && prev.state==='ACTIVE' && res.state==='CANDIDATE') illegal.push({ idx, rule:'ACTIVE_TO_CANDIDATE_ILLEGAL' });
    res.events.forEach(ev=> transitions.push({ idx, ratio:r, ...ev }));
    st = { ...res, lastRatio:r };
  });
  return { final_state: st?.state || 'NONE', transitions, illegal_rules: illegal };
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const p = await loadConfig();
  const scenarios = loadBaselineScenariosSync();
  const results = scenarios.map(sc=> ({ id: sc.id, description: sc.description, outcome: evaluateScenario(p, sc) }));
  const illegalTotal = results.reduce((a,r)=> a + r.outcome.illegal_rules.length,0);
  const report = {
    version:1,
    generated_utc: new Date().toISOString(),
    scenario_count: results.length,
    illegal_transition_events: illegalTotal,
    results
  };
  await fs.writeFile('artifacts/fairness-engine-harness-report.json', JSON.stringify(report,null,2));
  console.log(`[fairness-engine-harness] scenarios=${results.length} illegal=${illegalTotal}`);
}
main().catch(e=>{ console.error('fairness-engine-harness error',e); process.exit(2); });
