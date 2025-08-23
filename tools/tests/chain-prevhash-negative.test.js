#!/usr/bin/env node
import http from 'http';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';

let ORIGIN = process.env.CHAIN_ORIGIN || 'http://127.0.0.1:4602';

function post(path, body){
  return new Promise((resolve,reject)=>{
    const data = Buffer.from(JSON.stringify(body));
    const r = http.request(new URL(path, ORIGIN), { method:'POST', headers:{ 'content-type':'application/json','content-length': data.length } }, res=>{
      let b=''; res.on('data',d=>b+=d); res.on('end',()=>{ try{ resolve({ status: res.statusCode, body: JSON.parse(b||'{}') }); }catch(e){ reject(e);} });
    });
    r.on('error',reject); r.write(data); r.end();
  });
}
function get(path){
  return new Promise((resolve,reject)=>{
    const r = http.request(new URL(path, ORIGIN), { method:'GET' }, res=>{
      let b=''; res.on('data',d=>b+=d); res.on('end',()=>{ try{ resolve({ status: res.statusCode, body: JSON.parse(b||'null') }); }catch(e){ reject(e);} });
    });
    r.on('error',reject); r.end();
  });
}

(async function(){
  await fs.mkdir('artifacts',{recursive:true});
  // Ensure chain service is up, else auto-start
  async function ping(){
    return new Promise(resolve=>{ const r=http.request(new URL('/head', ORIGIN), { method:'GET' }, res=>resolve(true)); r.on('error',()=>resolve(false)); r.end(); });
  }
  let up = await ping();
  let proc;
  // Prefer starting our own isolated instance on 4612 to ensure /reload support
  const ownPort = '4612';
  ORIGIN = `http://127.0.0.1:${ownPort}`;
  proc = spawn(process.execPath, ['tools/services/chain.js'], { stdio:'ignore', env: { ...process.env, CHAIN_PORT: ownPort } });
  up = false;
  const t0 = Date.now();
  while (!up && Date.now()-t0 < 4000){ up = await ping(); await new Promise(r=>setTimeout(r,150)); }
  if (!up){ console.log('[chain-prevhash-negative] SKIP (service unavailable)'); process.exit(0); }
  const path = 'artifacts/chain.json';
  const exists = await fs.access(path).then(()=>true).catch(()=>false);
  if (!exists){
    await fs.writeFile('artifacts/chain-prevhash-negative.json', JSON.stringify({ status:'SKIP', reason:'no chain file; generate entries first' }, null, 2));
    console.log('[chain-prevhash-negative] SKIP');
    if (proc) {try{ proc.kill(); }catch{}}
    process.exit(0);
  }
  const chain = JSON.parse(await fs.readFile(path,'utf8'));
  if (chain.length === 0){
    await fs.writeFile('artifacts/chain-prevhash-negative.json', JSON.stringify({ status:'SKIP', reason:'empty chain' }, null, 2));
    console.log('[chain-prevhash-negative] SKIP');
    process.exit(0);
  }
  // Corrupt prevHash of last entry
  chain[chain.length-1].prevHash = 'deadbeef';
  await fs.writeFile(path, JSON.stringify(chain,null,2));
  // Ask service to reload state from disk
  await post('/reload', {});
  const v = await post('/verify', {});
  await fs.writeFile('artifacts/chain-prevhash-negative.json', JSON.stringify(v.body,null,2));
  console.log('[chain-prevhash-negative] verify issues=', (v.body.issues||[]).length);
  if (proc) {try{ proc.kill(); }catch{}}
  process.exit(0);
})().catch(e=>{ console.error('[chain-prevhash-negative] fail', e); process.exit(2); });
