#!/usr/bin/env node
/**
 * chain-append-from-signer.js
 * Auto-start signer/chain if needed, sign 2 payloads via signer, append to chain.
 * Writes artifacts/chain-append-report.json
 */
import http from 'http';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';

const SIGNER = process.env.SIGNER_ORIGIN || 'http://127.0.0.1:4601';
const CHAIN = process.env.CHAIN_ORIGIN || 'http://127.0.0.1:4602';

function req(origin, method, path, body){
  return new Promise((resolve,reject)=>{
    const data = body? Buffer.from(JSON.stringify(body)) : null;
    const r = http.request(new URL(path, origin), { method, headers: data? { 'content-type':'application/json','content-length': data.length }:{} }, res=>{
      let b=''; res.on('data',d=>b+=d); res.on('end',()=>{ try{ resolve({ status: res.statusCode, json: JSON.parse(b||'{}') }); }catch(e){ reject(e);} });
    });
    r.on('error',reject); if (data) r.write(data); r.end();
  });
}
async function waitHealth(origin, path='/'){ return new Promise(resolve=>{ const r=http.request(new URL(path,origin),{method:'GET'},res=>resolve(true)); r.on('error',()=>resolve(false)); r.end(); });}

(async function(){
  await fs.mkdir('artifacts',{recursive:true});
  // Ensure signer up
  let signerOk = await waitHealth(SIGNER, '/pubkey');
  let signerProc;
  if (!signerOk){ signerProc = spawn(process.execPath, ['tools/services/signer.js'], { stdio:'ignore' }); }
  const t0 = Date.now();
  while (!signerOk && Date.now()-t0 < 4000){ signerOk = await waitHealth(SIGNER, '/pubkey'); await new Promise(r=>setTimeout(r,150)); }
  if (!signerOk) throw new Error('signer not reachable');

  // Ensure chain up
  let chainOk = await waitHealth(CHAIN, '/head');
  let chainProc;
  if (!chainOk){ chainProc = spawn(process.execPath, ['tools/services/chain.js'], { stdio:'ignore' }); }
  const t1 = Date.now();
  while (!chainOk && Date.now()-t1 < 4000){ chainOk = await waitHealth(CHAIN, '/head'); await new Promise(r=>setTimeout(r,150)); }
  if (!chainOk) throw new Error('chain not reachable');

  const pub = await req(SIGNER,'GET','/pubkey');
  const publicKeyPem = pub.json.publicKeyPem;
  const payloads = [
    { id: 'chain-test-1', ts: new Date().toISOString(), purpose:'append-seed' },
    { id: 'chain-test-2', ts: new Date().toISOString(), purpose:'append-seed', n: 2 }
  ];
  const entries = [];
  for (const p of payloads){
    const signed = await req(SIGNER,'POST','/sign',{ payload: p });
    if (signed.status !== 200) throw new Error('sign failed');
    const app = await req(CHAIN,'POST','/append',{ canonical: signed.json.canonical, signature: signed.json.signature, publicKeyPem });
    if (app.status !== 200) throw new Error('append failed');
    entries.push(app.json);
  }
  await fs.writeFile('artifacts/chain-append-report.json', JSON.stringify({ version:1, appended: entries.map(e=>({ seq:e.seq, contentHash:e.contentHash, prevHash:e.prevHash })) }, null, 2));
  console.log('[chain-append] appended', entries.length, 'entries');
  // Gracefully stop services we started (if any)
  try { if (signerProc) signerProc.kill(); } catch {}
  try { if (chainProc) chainProc.kill(); } catch {}
  process.exit(0);
})().catch(e=>{ console.error('[chain-append] error', e); process.exit(2); });
