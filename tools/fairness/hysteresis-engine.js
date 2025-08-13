#!/usr/bin/env node
/**
 * hysteresis-engine.js
 * Applies Option F hysteresis logic to equity ratio snapshots.
 */
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { decide } from './engine-core.js';

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

// decide() now imported from engine-core.js

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
