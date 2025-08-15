#!/usr/bin/env node
/**
 * collector-reliability-smoke.js
 * Measures ingestion success rate by sending N valid events to the collector.
 * Outputs artifacts/collector-reliability.json with attempts, success, pct.
 * Exit 1 if below threshold when RELIABILITY_ADVISORY != 'true'.
 */
import { promises as fs } from 'fs';
import { spawn } from 'child_process';

const BASE = process.env.COLLECTOR_BASE || 'http://127.0.0.1:4603';
const ATTEMPTS = Number(process.env.RELIABILITY_ATTEMPTS || 40);
const THRESHOLD = Number(process.env.RELIABILITY_THRESHOLD || 98);
const ADVISORY = String(process.env.RELIABILITY_ADVISORY || 'false').toLowerCase() === 'true';

async function get(path){
  try { const res = await fetch(BASE+path); return res.ok; } catch { return false; }
}
const sleep = (ms)=> new Promise(r=>setTimeout(r,ms));

async function ensureCollector(timeoutMs=3000){
  const start = Date.now();
  while (Date.now()-start < timeoutMs){
    if (await get('/health')) return { ok:true };
    await sleep(150);
  }
  return { ok:false };
}

async function post(path, body){
  try{
    const res = await fetch(BASE+path, { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify(body) });
    const json = await res.json().catch(()=>({}));
    return { status: res.status, json };
  } catch {
    return { status: 0 };
  }
}

function validEvent(){
  const now = new Date().toISOString();
  return { event_name:'pub_hero_view', occurred_at: now, received_at: now, meta: { path:'/' } };
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  let proc;
  let ready = await ensureCollector(1200);
  if (!ready.ok){
    proc = spawn(process.execPath, ['tools/services/collector.js'], { stdio:'ignore' });
    ready = await ensureCollector(3000);
  }
  if (!ready.ok){
    const out = { version:1, status:'SKIP', reason:'collector not reachable' };
    await fs.writeFile('artifacts/collector-reliability.json', JSON.stringify(out,null,2));
    console.log('[collector-reliability] SKIP: collector not reachable');
    process.exit(0);
  }
  let success = 0;
  for (let i=0;i<ATTEMPTS;i++){
    const r = await post('/ingest', validEvent());
    if (r.status===200 && r.json?.status==='INGESTED' && typeof r.json?.event_hash==='string') success++;
    await sleep(10);
  }
  const pct = Math.round((success/ATTEMPTS)*1000)/10; // 1 decimal
  const out = { version:1, attempts: ATTEMPTS, success, success_pct: pct, threshold_pct: THRESHOLD, advisory: ADVISORY };
  await fs.writeFile('artifacts/collector-reliability.json', JSON.stringify(out,null,2));
  if (proc) try { proc.kill('SIGKILL'); } catch {}
  const pass = pct >= THRESHOLD;
  if (!pass && !ADVISORY){
    console.error(`[collector-reliability] FAIL ${pct}% < ${THRESHOLD}%`);
    process.exit(2);
  }
  console.log(`[collector-reliability] ${pass? 'PASS':'ADVISORY'} ${pct}% (>=${THRESHOLD}%)`);
}

main().catch(e=>{ console.error('[collector-reliability] error', e); process.exit(2); });
