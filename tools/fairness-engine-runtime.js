#!/usr/bin/env node
/**
 * fairness-engine-runtime.js
 * Wave 1 runtime harness executing hysteresis engine over generated or provided sequences.
 * Produces artifacts/fairness-engine-runtime-report.json with state distribution & transition metrics.
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

function generateSequence(len=40){
  // Random ratios 0.45–0.75 biased to borderline zone to exercise transitions
  const seq=[]; for(let i=0;i<len;i++){ const r = 0.45 + Math.random()*0.30; seq.push(+r.toFixed(2)); }
  return seq;
}

async function run(){
  await fs.mkdir('artifacts',{recursive:true});
  const params = await loadConfig();
  // Accept optional input file path via CLI: --input=path.json
  const arg = process.argv.slice(2).find(a=>a.startsWith('--input='));
  let sequence;
  if(arg){
    const p = arg.split('=')[1];
    try { sequence = JSON.parse(await fs.readFile(p,'utf8')).sequence; } catch { sequence = generateSequence(); }
  } else sequence = generateSequence();
  let st=null; const transitions=[]; const stateDurations={NONE:0,CANDIDATE:0,ACTIVE:0,CLEARED:0};
  sequence.forEach((ratio, idx)=>{
    const res = decide(params, st, ratio); st = { ...res, lastRatio:ratio }; stateDurations[st.state] = (stateDurations[st.state]||0)+1; if(res.events.length){ res.events.forEach(ev=> transitions.push({ idx, ratio, ...ev })); }
  });
  const metrics = {
    total_snapshots: sequence.length,
    transitions: transitions.length,
    enters: transitions.filter(t=>t.type==='ENTER').length,
    reenters: transitions.filter(t=>t.type==='REENTER').length,
    exits: transitions.filter(t=>t.type==='EXIT').length,
    final_state: st?.state || 'NONE',
    state_durations: stateDurations,
    state_distribution: Object.fromEntries(Object.entries(stateDurations).map(([k,v])=>[k, Number((v/sequence.length).toFixed(3))]))
  };
  const report = { version:'1.0.0', generated_utc: new Date().toISOString(), params_version: params.version||null, metrics, sequence }; 
  await fs.writeFile('artifacts/fairness-engine-runtime-report.json', JSON.stringify(report,null,2));
  console.log(`[fairness-engine-runtime] final=${metrics.final_state} enters=${metrics.enters} reenters=${metrics.reenters} exits=${metrics.exits}`);
}
run().catch(e=>{ console.error('fairness-engine-runtime error', e); process.exit(2); });
