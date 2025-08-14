#!/usr/bin/env node
/**
 * seed-events.js
 * Seeds a couple of canonical events (landing impression + hero CTA click)
 * against the local collector, then runs query-seeds to produce non-zero counts.
 */
import { spawn, spawnSync } from 'child_process';
import { promises as fs } from 'fs';

const BASE = process.env.COLLECTOR_BASE || 'http://127.0.0.1:4603';

async function get(path){
  try{
    const res = await fetch(BASE+path);
    const json = await res.json().catch(()=>({}));
    return { ok: res.ok, status: res.status, json };
  }catch{
    return { ok:false, status:0 };
  }
}

const sleep = (ms)=> new Promise(r=>setTimeout(r,ms));

async function waitForHealth(timeoutMs=3000){
  const start = Date.now();
  while (Date.now()-start < timeoutMs){
    const res = await get('/health');
    if (res.ok) return true;
    await sleep(200);
  }
  return false;
}

async function post(path, body){
  const res = await fetch(BASE+path, { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify(body) });
  const json = await res.json().catch(()=>({}));
  return { status: res.status, json };
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  let ready = await waitForHealth(1200);
  let proc;
  if (!ready){
    proc = spawn(process.execPath, ['tools/services/collector.js'], { stdio:'ignore' });
    ready = await waitForHealth(3000);
  }
  if (!ready){
    console.error('[seed-events] collector not reachable');
    process.exit(2);
  }
  const now = new Date().toISOString();
  const landing = { event_name:'pub_landing_impression', page:'landing', occurred_at: now, received_at: now, meta:{ path:'/' } };
  const hero = { event_name:'pub_hero_card_cta_click', page:'landing', occurred_at: now, received_at: now, meta:{ card_id:'C1', classification:'Monitoring', position_index:0 } };
  const r1 = await post('/ingest', landing);
  const r2 = await post('/ingest', hero);
  const report = { version:1, landing: r1, hero: r2 };
  await fs.writeFile('artifacts/seed-events-report.json', JSON.stringify(report,null,2));
  console.log('[seed-events] posted landing=', r1.status, 'hero=', r2.status);
  // Run query-seeds to emit non-zero counts
  const res = spawnSync(process.execPath, ['tools/query-seeds.js'], { stdio: 'inherit' });
  if (proc){ try{ proc.kill(); }catch{} }
  process.exit((r1.status===200 && r2.status===200 && res.status===0)?0:2);
}

main().catch(e=>{ console.error('[seed-events] error', e); process.exit(2); });
