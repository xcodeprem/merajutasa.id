#!/usr/bin/env node
/**
 * generate-test-vectors.js
 * Generates simple canonical payload + signature using running signer service.
 * Outputs artifacts/test-vectors.json.
 */
import { promises as fs } from 'fs';
import http from 'http';

const SIGNER = process.env.SIGNER_ORIGIN || 'http://localhost:4601';

function request(method, path, body){
  return new Promise((resolve,reject)=>{
    const data = body? Buffer.from(JSON.stringify(body)) : null;
    const req = http.request(new URL(path, SIGNER), { method, headers: data? { 'content-type':'application/json','content-length':data.length }:{} }, res=>{
      let b=''; res.on('data',d=>b+=d); res.on('end',()=>{ try { resolve(JSON.parse(b||'{}')); } catch(e){ reject(e); } });
    });
    req.on('error',reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main(){
  const sample = { id:'cred-test-001', subject:'did:example:123', issuanceDate:'2025-08-13T00:00:00Z', claim:{ role:'tester', level:1 } };
  const signed = await request('POST','/sign',{ payload: sample });
  await fs.mkdir('artifacts',{recursive:true});
  await fs.writeFile('artifacts/test-vectors.json', JSON.stringify({ sample, signed },null,2));
  console.log('[test-vectors] wrote artifacts/test-vectors.json');
}
main().catch(e=>{ console.error('test-vector generation failed', e); process.exit(2); });
