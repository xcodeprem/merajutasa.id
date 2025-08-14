#!/usr/bin/env node
import http from 'http';
import assert from 'assert';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';

const ORIGIN = process.env.SIGNER_ORIGIN || 'http://127.0.0.1:4601';

function req(method, path, body){
  return new Promise((resolve,reject)=>{
    const data = body? Buffer.from(JSON.stringify(body)) : null;
    const r = http.request(new URL(path, ORIGIN), { method, headers: data? { 'content-type':'application/json','content-length': data.length }:{} }, res=>{
      let b=''; res.on('data',d=>b+=d); res.on('end',()=>{ try{ resolve(JSON.parse(b||'{}')); }catch(e){ reject(e);} });
    });
    r.on('error',reject); if (data) r.write(data); r.end();
  });
}

(async function(){
  // wait for /pubkey health; start signer if needed
  async function health(){
    return new Promise(resolve=>{
      const r = http.request(new URL('/pubkey', ORIGIN), { method:'GET' }, res=>{ resolve(res.statusCode===200); });
      r.on('error', ()=> resolve(false)); r.end();
    });
  }
  let ok = await health();
  let proc;
  if (!ok){ proc = spawn(process.execPath, ['tools/services/signer.js'], { stdio:'ignore' }); }
  const start = Date.now();
  while (!ok && Date.now()-start < 3000){ ok = await health(); await new Promise(r=>setTimeout(r,150)); }
  if (!ok) throw new Error('signer not reachable');
  const payload = { foo:'bar', n:1 };
  const signed = await req('POST','/sign',{ payload });
  assert(signed.signature && signed.canonical);
  const verify = await req('POST','/verify',{ canonical: signed.canonical, signature: signed.signature });
  assert(verify.verified === true);
  await fs.mkdir('artifacts',{recursive:true});
  await fs.writeFile('artifacts/signer-e2e.json', JSON.stringify({ signed, verify }, null, 2));
  console.log('[signer-e2e] OK');
  process.exit(0);
})().catch(e=>{ console.error('[signer-e2e] fail', e); process.exit(2); });
