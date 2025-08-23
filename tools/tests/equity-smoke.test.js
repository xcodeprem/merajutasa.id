#!/usr/bin/env node
import http from 'http';
import { spawn } from 'child_process';

const PORT = 4625;

function httpGet(path){
  return new Promise((resolve,reject)=>{
    const req = http.request({ hostname:'127.0.0.1', port: PORT, path, method:'GET' }, res =>{
      let data='';
      res.on('data', c=> data+=c);
      res.on('end', ()=> resolve({ status: res.statusCode, json: data? JSON.parse(data): null }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main(){
  const child = spawn(process.execPath, ['tools/services/equity.js'], { env: { ...process.env, EQUITY_PORT: String(PORT) }, stdio: ['ignore','pipe','pipe'] });
  const ready = await new Promise(resolve=>{
    const timeout = setTimeout(()=> resolve(false), 3000);
    child.stdout.on('data', d=>{ if (d.toString().includes('listening')) { clearTimeout(timeout); resolve(true); } });
  });
  if (!ready){ child.kill('SIGKILL'); console.error('[equity-smoke] FAIL: start'); process.exit(1); }
  try {
    const health = await httpGet('/health');
    if (health.status!==200 || !health.json?.ok) {throw new Error('health');}
    const under = await httpGet('/under-served');
    if (under.status!==200 || typeof under.json?.total !== 'number') {throw new Error('under-served');}
    const anomalies = await httpGet('/equity/anomalies');
    if (anomalies.status!==200 || typeof anomalies.json?.anomalies_count !== 'number') {throw new Error('anomalies');}
    const summary = await httpGet('/equity/summary');
    if (summary.status!==200 || typeof summary.json?.equity_index !== 'number') {throw new Error('summary');}
    const monthly = await httpGet('/feedback/monthly');
    if (monthly.status===200 && !Array.isArray(monthly.json?.months)) {throw new Error('monthly');}
    console.log('[equity-smoke] PASS');
  } finally {
    child.kill('SIGKILL');
  }
}

main().catch(e=>{ console.error('[equity-smoke] FAIL', e); process.exit(1); });
