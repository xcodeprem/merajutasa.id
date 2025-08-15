#!/usr/bin/env node
import http from 'http';
import { spawn } from 'child_process';

const PORT = 4626;

function httpGetText(path){
  return new Promise((resolve,reject)=>{
    const req = http.request({ hostname:'127.0.0.1', port: PORT, path, method:'GET' }, res =>{
      let data=''; res.on('data', c=> data+=c); res.on('end', ()=> resolve({ status: res.statusCode, text: data }));
    });
    req.on('error', reject); req.end();
  });
}

function httpGetJson(path){
  return new Promise((resolve,reject)=>{
    const req = http.request({ hostname:'127.0.0.1', port: PORT, path, method:'GET' }, res =>{
      let data=''; res.on('data', c=> data+=c); res.on('end', ()=>{
        try { resolve({ status: res.statusCode, json: data? JSON.parse(data): null }); }
        catch(e){ reject(e); }
      });
    });
    req.on('error', reject); req.end();
  });
}

async function main(){
  const child = spawn(process.execPath, ['tools/services/equity.js'], { env: { ...process.env, EQUITY_PORT: String(PORT) }, stdio: ['ignore','pipe','pipe'] });
  const ready = await new Promise(resolve=>{
    const timeout = setTimeout(()=> resolve(false), 3000);
    child.stdout.on('data', d=>{ if (d.toString().includes('listening')) { clearTimeout(timeout); resolve(true); } });
  });
  if(!ready){ child.kill('SIGKILL'); console.error('[equity-ui-smoke] FAIL: start'); process.exit(1); }
  try{
    const page = await httpGetText('/');
    if (page.status!==200 || !page.text.includes('H1 Equity Dashboard')) throw new Error('ui index');
  const api = await httpGetJson('/kpi/h1');
  if (api.status!==200 || typeof api.json?.fairness?.pass === 'undefined') throw new Error('kpi');
  const under = await httpGetJson('/under-served');
  if (under.status!==200 || typeof under.json?.total !== 'number') throw new Error('under');
  const weekly = await httpGetJson('/kpi/weekly');
  if (weekly.status!==200 || !Array.isArray(weekly.json?.weeks)) throw new Error('weekly');
  // Monthly endpoint is optional in early runs; treat 200 with schema as pass, 404 as ok
  const monthly = await httpGetJson('/feedback/monthly');
  if (monthly.status===200 && !Array.isArray(monthly.json?.months)) throw new Error('monthly schema');
    console.log('[equity-ui-smoke] PASS');
  } finally {
    child.kill('SIGKILL');
  }
}

main().catch(e=>{ console.error('[equity-ui-smoke] FAIL', e); process.exit(1); });
