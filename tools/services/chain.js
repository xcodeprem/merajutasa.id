#!/usr/bin/env node
/**
 * chain.js
 * Minimal hash chain append & verify service.
 * Storage: artifacts/chain.json (array of entries {seq, prevHash, contentHash, signature, ts}).
 * Endpoints:
 *  - POST /append { canonical, signature, publicKeyPem }
 *  - GET  /chain
 *  - GET  /head
 *  - POST /verify {}
 */
import http from 'http';
import { promises as fs } from 'fs';
import crypto from 'crypto';

const PORT = process.env.CHAIN_PORT || 4602;
const CHAIN_PATH = 'artifacts/chain.json';

async function loadChain(){
  const exists = await fs.access(CHAIN_PATH).then(()=>true).catch(()=>false);
  if (!exists) return [];
  return JSON.parse(await fs.readFile(CHAIN_PATH,'utf8'));
}
async function saveChain(chain){
  await fs.mkdir('artifacts',{recursive:true});
  await fs.writeFile(CHAIN_PATH, JSON.stringify(chain,null,2));
}

function verifySig(pubPem, canonical, signature){
  return crypto.verify(null, Buffer.from(canonical,'utf8'), pubPem, Buffer.from(signature,'base64'));
}
function sha256(data){ return crypto.createHash('sha256').update(data,'utf8').digest('hex'); }

function verifyChain(chain){
  let ok = true; const issues=[];
  for (let i=0;i<chain.length;i++){
    const entry = chain[i];
    const expectedPrev = i===0? null : chain[i-1].contentHash;
    if (entry.prevHash !== expectedPrev){ ok=false; issues.push({ seq: entry.seq, code:'PREV_HASH_MISMATCH', expectedPrev, actual: entry.prevHash }); }
    const recomputed = sha256(entry.canonical);
    if (recomputed !== entry.contentHash){ ok=false; issues.push({ seq: entry.seq, code:'CONTENT_HASH_MISMATCH', recomputed, stored: entry.contentHash }); }
  }
  return { ok, issues, length: chain.length };
}

async function start(){
  let chain = await loadChain();
  const server = http.createServer(async (req,res)=>{
    try {
      if (req.method === 'GET' && req.url === '/chain'){
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify(chain));
      }
      if (req.method === 'GET' && req.url === '/head'){
        const head = chain[chain.length-1] || null;
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify(head));
      }
      if (req.method === 'POST' && req.url === '/append'){
        const body = await readBody(req);
        const { canonical, signature, publicKeyPem } = body;
        if (!canonical || !signature || !publicKeyPem){ res.writeHead(400); return res.end(JSON.stringify({ error:'canonical, signature, publicKeyPem required'})); }
        if (!verifySig(publicKeyPem, canonical, signature)){
          res.writeHead(400); return res.end(JSON.stringify({ error:'signature_invalid'})); }
        const contentHash = sha256(canonical);
        const prevHash = chain.length? chain[chain.length-1].contentHash : null;
        const entry = { seq: chain.length, prevHash, contentHash, signature, canonical, ts: new Date().toISOString() };
        chain.push(entry);
        await saveChain(chain);
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify(entry));
      }
      if (req.method === 'POST' && req.url === '/reload'){
        // Test helper: reload chain from disk
        chain = await loadChain();
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify({ status:'RELOADED', length: chain.length }));
      }
      if (req.method === 'POST' && req.url === '/verify'){
        const result = verifyChain(chain);
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify(result));
      }
      res.writeHead(404); res.end();
    } catch(e){
      res.writeHead(500,{ 'content-type':'application/json' });
      res.end(JSON.stringify({ error:e.message }));
    }
  });
  server.listen(PORT, ()=> console.log(`[chain] listening on ${PORT}`));
}

function readBody(req){
  return new Promise((resolve,reject)=>{ let b=''; req.on('data',d=>b+=d); req.on('end',()=>{ try { resolve(b? JSON.parse(b):{}); } catch(e){ reject(e);} }); req.on('error',reject); });
}

start().catch(e=>{ console.error('chain fatal', e); process.exit(2); });
