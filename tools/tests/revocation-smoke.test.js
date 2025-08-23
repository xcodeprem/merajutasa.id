#!/usr/bin/env node
/**
 * revocation-smoke.test.js
 * H1-I1/I2: Smoke test that server responds and schema matches expectations.
 */
import http from 'http';
import { spawn } from 'child_process';

const PORT = 4630; // use test port to avoid conflicts

function httpGet(path){
  return new Promise((resolve,reject)=>{
    const req = http.request({ hostname:'127.0.0.1', port: PORT, path, method:'GET' }, res =>{
      let data='';
      res.on('data', chunk => data += chunk);
      res.on('end', ()=> resolve({ status: res.statusCode, json: data ? JSON.parse(data) : null }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main(){
  const child = spawn(process.execPath, ['tools/services/revocation.js'], { env: { ...process.env, REVOCATION_PORT: String(PORT) }, stdio: ['ignore','pipe','pipe'] });
  const ready = await new Promise(resolve=>{
    const timeout = setTimeout(()=> resolve(false), 3000);
    child.stdout.on('data', d=>{ if (d.toString().includes('listening')) { clearTimeout(timeout); resolve(true); } });
  });
  if (!ready){
    child.kill('SIGKILL');
    console.error('[revocation-smoke] FAIL: server did not start');
    process.exit(1);
  }
  try {
    const health = await httpGet('/health');
    if (health.status !== 200 || !health.json?.ok) {throw new Error('health check failed');}
    const rev = await httpGet('/revocations');
    if (rev.status !== 200 || !Array.isArray(rev.json)) {throw new Error('revocations not array');}
    console.log('[revocation-smoke] PASS');
  } finally {
    child.kill('SIGKILL');
  }
}

main().catch(e=>{ console.error('[revocation-smoke] FAIL', e); process.exit(1); });
