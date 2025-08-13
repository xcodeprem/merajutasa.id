#!/usr/bin/env node
/**
 * hysteresis-engine.js
 * Applies Option F hysteresis logic to equity ratio snapshots.
 */
import { promises as fs } from 'fs';
import yaml from 'yaml';

const CONFIG_PATH = 'docs/fairness/hysteresis-config-v1.yml';
const SNAPSHOT_INPUT = process.env.HYST_SNAPSHOT_INPUT || 'artifacts/equity-snapshots.json';
const STATE_PATH = 'artifacts/hysteresis-state.json';
const EVENTS_PATH = 'artifacts/hysteresis-events.json';

async function loadConfig(){
  const raw = await fs.readFile(CONFIG_PATH,'utf8');
  return yaml.parse(raw).parameters;
}
async function loadSnapshots(){ try { return JSON.parse(await fs.readFile(SNAPSHOT_INPUT,'utf8')); } catch { return []; } }
async function loadState(){ try { return JSON.parse(await fs.readFile(STATE_PATH,'utf8')); } catch { return {}; } }
async function loadEvents(){ try { return JSON.parse(await fs.readFile(EVENTS_PATH,'utf8')); } catch { return []; } }

function decide(p, prev, ratio){
  const state = prev?.state || 'NONE';
  const consecutive = prev?.consecutive || 0;
  const cooldownLeft = prev?.cooldownLeft || 0;
  let newState = state; let newConsec = consecutive; let newCooldown = cooldownLeft>0? cooldownLeft-1:0; const evs=[];
  const severe = ratio < p.T_enter_major;
  const borderline = ratio < p.T_enter_standard && ratio >= p.T_enter_major;
  switch(state){
    case 'NONE':
      if (severe){ newState='ACTIVE'; evs.push({type:'ENTER',reason:'severe'}); }
      else if (borderline){ newState='CANDIDATE'; newConsec=1; }
      break;
    case 'CANDIDATE':
      if (severe){ newState='ACTIVE'; evs.push({type:'ENTER',reason:'severe'}); }
      else if (borderline){ newConsec+=1; if (newConsec >= p.consecutive_required_standard){ newState='ACTIVE'; evs.push({type:'ENTER',reason:'consecutive'});} }
      else { newState='NONE'; newConsec=0; }
      break;
    case 'ACTIVE':
      if (ratio >= p.T_exit){ newState='CLEARED'; newCooldown=p.cooldown_snapshots_after_exit; evs.push({type:'EXIT'}); }
      break;
    case 'CLEARED':
      if (severe){ newState='ACTIVE'; evs.push({type:'REENTER',reason:'severe'}); }
      else if (newCooldown===0 && borderline){ newState='CANDIDATE'; newConsec=1; }
      break;
  }
  return { state:newState, consecutive:newConsec, cooldownLeft:newCooldown, events:evs };
}

async function main(){
  const p = await loadConfig();
  const snaps = await loadSnapshots();
  const state = await loadState();
  const allEvents = await loadEvents();
  for (const s of snaps){
    const prev = state[s.unit];
    const r = decide(p, prev, s.ratio);
    state[s.unit] = { ...r, lastRatio:s.ratio, lastTs:s.ts };
    r.events.forEach(ev=> allEvents.push({ unit:s.unit, ts:s.ts, ratio:s.ratio, ...ev }));
  }
  await fs.mkdir('artifacts',{recursive:true});
  await fs.writeFile(STATE_PATH, JSON.stringify(state,null,2));
  await fs.writeFile(EVENTS_PATH, JSON.stringify(allEvents,null,2));
  console.log(`[hysteresis] processed ${snaps.length} snapshots; units=${Object.keys(state).length}`);
}
main().catch(e=>{ console.error('hysteresis engine error', e); process.exit(2); });
