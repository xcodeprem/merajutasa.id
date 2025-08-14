#!/usr/bin/env node
/** Skeleton: validate -> sign -> store to chain */
import { promises as fs } from 'fs';
import http from 'http';

function httpPostJson(port, path, body){
  return new Promise((resolve,reject)=>{
    const data = JSON.stringify(body);
    const req = http.request({ hostname:'127.0.0.1', port, path, method:'POST', headers:{ 'content-type':'application/json', 'content-length': Buffer.byteLength(data) }}, res=>{
      let b=''; res.on('data',d=>b+=d); res.on('end',()=>{ try{ resolve({ status: res.statusCode, json: b? JSON.parse(b): null }); } catch(e){ reject(e);} });
    });
    req.on('error', reject); req.write(data); req.end();
  });
}

async function httpGetJson(port, path){
  return new Promise((resolve,reject)=>{
    const req = http.request({ hostname:'127.0.0.1', port, path, method:'GET' }, res=>{
      let b=''; res.on('data',d=>b+=d); res.on('end',()=>{ try{ resolve({ status: res.statusCode, json: b? JSON.parse(b): null }); } catch(e){ reject(e);} });
    });
    req.on('error', reject); req.end();
  });
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const cred = { id:`cred-${Date.now()}`, subject:'user:123', issued_at: new Date().toISOString(), claims:{ level:'basic' } };
  const sign = await httpPostJson(4601, '/sign', { payload: cred });
  if (sign.status!==200) throw new Error('sign failed');
  const pub = await httpGetJson(4601, '/pubkey');
  const append = await httpPostJson(4602, '/append', { canonical: sign.json.canonical, signature: sign.json.signature, publicKeyPem: pub.json.publicKeyPem });
  if (append.status!==200) throw new Error('append failed');
  await fs.writeFile('artifacts/credential-pipeline.json', JSON.stringify({ credential: cred, chain_entry: append.json },null,2));
  console.log('[credential-pipeline] OK seq='+append.json.seq);
}
main().catch(e=>{ console.error('credential-pipeline error', e); process.exit(2); });
