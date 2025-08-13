#!/usr/bin/env node
/**
 * run-basic-integrity-tests.js
 * Minimal ad-hoc test harness for signer + chain.
 */
import { spawn } from 'child_process';
import http from 'http';

const RESULTS = [];
function log(name, ok, detail){
  RESULTS.push({ name, ok, detail });
  console.log(`[${ok? 'PASS':'FAIL'}] ${name}${detail? ' :: '+detail:''}`);
  if (!ok) process.exitCode = 1;
}
function req(method, url, body){
  return new Promise((resolve,reject)=>{
    const parsed = new URL(url);
    const data = body? Buffer.from(JSON.stringify(body)) : null;
    const opt = { method, hostname: parsed.hostname, port: parsed.port, path: parsed.pathname, headers: data? { 'content-type':'application/json','content-length':data.length }:{} };
    const r = http.request(opt,res=>{ let b=''; res.on('data',d=>b+=d); res.on('end',()=>{ try { resolve({ status: res.statusCode, json: b? JSON.parse(b):{} }); } catch(e){ reject(e);} }); });
    r.on('error',reject); if (data) r.write(data); r.end();
  });
}
const CHILDREN = [];
async function ensureService(path, port, healthPath){
  const child = spawn('node',[path],{ stdio:'inherit' });
  CHILDREN.push(child);
  const start = Date.now();
  const maxWait = 5000;
  const probePath = healthPath || '/pubkey';
  return new Promise(resolve=>{
    (function poll(){
      const req = http.get({ hostname:'localhost', port, path: probePath }, res=>{
        if (res.statusCode === 200) return resolve(child);
        if (Date.now()-start > maxWait) return resolve(child);
        setTimeout(poll,150);
      });
      req.on('error',()=>{
        if (Date.now()-start > maxWait) return resolve(child);
        setTimeout(poll,150);
      });
    })();
  });
}
async function run(){
  await ensureService('tools/services/signer.js',4601,'/pubkey');
  const signResp = await req('POST','http://localhost:4601/sign',{ payload: { a:1, b:2 }});
  log('signer sign status 200', signResp.status===200);
  const { canonical, signature } = signResp.json;
  log('signer canonical stable ordering', canonical === '{"a":1,"b":2}' );
  const verifyResp = await req('POST','http://localhost:4601/verify',{ canonical, signature });
  log('signer verify success', verifyResp.json.verified === true);
  await ensureService('tools/services/chain.js',4602,'/head');
  const pub = await req('GET','http://localhost:4601/pubkey');
  const append = await req('POST','http://localhost:4602/append',{ canonical, signature, publicKeyPem: pub.json.publicKeyPem });
  log('chain append status 200', append.status===200);
  const verifyChain = await req('POST','http://localhost:4602/verify',{});
  log('chain verify ok', verifyChain.json.ok === true);
  console.log('--- TEST SUMMARY ---');
  console.log(JSON.stringify(RESULTS,null,2));
  // Graceful shutdown
  for (const c of CHILDREN){ try { c.kill(); } catch(e){} }
  setTimeout(()=> process.exit(process.exitCode || 0), 200); // allow log flush
}
run().catch(e=>{ console.error('test harness error', e); process.exit(2); });
