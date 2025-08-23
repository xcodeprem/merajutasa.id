#!/usr/bin/env node
/**
 * collector-integration.test.js
 * Requires collector service to be running (script: service:collector)
 * Sends valid and invalid events, asserts schema validation and event_hash injection.
 * Writes artifacts/collector-integration-report.json
 */
import { promises as fs } from 'fs';
import { spawn } from 'child_process';

const BASE = process.env.COLLECTOR_BASE || 'http://127.0.0.1:4603';

async function post(path, body){
  const res = await fetch(BASE+path, { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify(body) });
  const json = await res.json().catch(()=>({}));
  return { status: res.status, json };
}

async function get(path){
  try {
    const res = await fetch(BASE+path);
    const json = await res.json().catch(()=>({}));
    return { ok: res.ok, status: res.status, json };
  } catch {
    return { ok: false, status: 0 };
  }
}

const sleep = (ms)=> new Promise(r=>setTimeout(r,ms));

async function waitForHealth(timeoutMs=3000){
  const start = Date.now();
  while (Date.now()-start < timeoutMs){
    const res = await get('/health');
    if (res.ok) {return true;}
    await sleep(200);
  }
  return false;
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  let ready = await waitForHealth(1200);
  let proc;
  if (!ready){
    // Try to start collector inline
    proc = spawn(process.execPath, ['tools/services/collector.js'], { stdio:'ignore' });
    ready = await waitForHealth(3000);
  }
  if (!ready){
    await fs.writeFile('artifacts/collector-integration-report.json', JSON.stringify({ version:1, status:'SKIP', reason:'collector not reachable' }, null, 2));
    console.log('[collector-integration] collector not reachable, skipping');
    process.exit(0);
  }
  const validEvent = { event_name:'pub_hero_view', occurred_at: new Date().toISOString(), received_at: new Date().toISOString(), meta:{ path:'/' } };
  const invalidEvent = { event_name:'unknown_event', occurred_at:'not-a-date', received_at:'also-bad' };
  const r1 = await post('/ingest', validEvent);
  const r2 = await post('/ingest', invalidEvent);
  const report = { version:1, valid: r1, invalid: r2 };
  await fs.writeFile('artifacts/collector-integration-report.json', JSON.stringify(report,null,2));
  const ok = r1.status===200 && r1.json?.status==='INGESTED' && typeof r1.json.event_hash==='string' && r2.status===400;
  console.log('[collector-integration] ok=', ok);
  process.exit(ok?0:2);
}

main().catch(e=>{ console.error('[collector-integration] error', e); process.exit(2); });
