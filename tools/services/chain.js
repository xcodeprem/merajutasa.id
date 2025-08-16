#!/usr/bin/env node
/**
 * chain.js
 * Minimal hash chain append & verify service.
 * Storage:
 *  - Snapshot: artifacts/chain.json (array of entries {seq, prevHash, contentHash, signature, ts}).
 *  - Write-ahead log: artifacts/chain.ndjson (append-only, one JSON per line)
 *  - Head summary: artifacts/chain-head.json ({seq, contentHash, ts})
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
const CHAIN_SNAPSHOT_PATH = 'artifacts/chain.json';
const CHAIN_LOG_PATH = 'artifacts/chain.ndjson';
const CHAIN_HEAD_PATH = 'artifacts/chain-head.json';

async function pathExists(p){ try { await fs.access(p); return true; } catch { return false; } }

async function safeWriteFileAtomic(p, data){
  await fs.mkdir('artifacts',{recursive:true});
  const tmp = p + '.tmp';
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, p);
}

async function loadChain(){
  if (await pathExists(CHAIN_SNAPSHOT_PATH)){
    return JSON.parse(await fs.readFile(CHAIN_SNAPSHOT_PATH,'utf8'));
  }
  // Rebuild from log if snapshot missing
  if (await pathExists(CHAIN_LOG_PATH)){
    const txt = await fs.readFile(CHAIN_LOG_PATH,'utf8');
    const lines = txt.split(/\r?\n/).filter(Boolean);
    return lines.map(l=>{ try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  }
  return [];
}
async function saveChain(chain){
  await fs.mkdir('artifacts',{recursive:true});
  await safeWriteFileAtomic(CHAIN_SNAPSHOT_PATH, JSON.stringify(chain,null,2));
  const head = chain[chain.length-1] || null;
  await safeWriteFileAtomic(CHAIN_HEAD_PATH, JSON.stringify(head, null, 2));
}

async function appendLog(entry){
  await fs.mkdir('artifacts',{recursive:true});
  await fs.appendFile(CHAIN_LOG_PATH, JSON.stringify(entry)+"\n");
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
  // Simple in-process queue to serialize appends
  let q = Promise.resolve();
  const enqueue = fn => { q = q.then(fn, fn); return q; };
  const server = http.createServer(async (req,res)=>{
    try {
      if (req.method === 'GET' && req.url === '/chain'){
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify(chain));
      }
      if (req.method === 'GET' && req.url === '/health'){
        const result = verifyChain(chain);
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify({ status: result.ok? 'OK':'DEGRADED', length: result.length }));
      }
      if (req.method === 'GET' && req.url === '/head'){
        const head = chain[chain.length-1] || null;
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify(head));
      }
      if (req.method === 'POST' && req.url === '/append'){
        await enqueue(async ()=>{
          const body = await readBody(req);
          const { canonical, signature, publicKeyPem } = body;
          if (!canonical || !signature || !publicKeyPem){ res.writeHead(400); return res.end(JSON.stringify({ error:'canonical, signature, publicKeyPem required'})); }
          if (!verifySig(publicKeyPem, canonical, signature)){
            res.writeHead(400); return res.end(JSON.stringify({ error:'signature_invalid'})); }
          const contentHash = sha256(canonical);
          // Idempotency: if head already equals this contentHash, return existing
          const head = chain[chain.length-1];
          if (head && head.contentHash === contentHash){
            res.writeHead(200,{ 'content-type':'application/json' });
            return res.end(JSON.stringify(head));
          }
          const prevHash = chain.length? chain[chain.length-1].contentHash : null;
          const entry = { seq: chain.length, prevHash, contentHash, signature, canonical, ts: new Date().toISOString() };
          // Append to in-memory chain
          chain.push(entry);
          try {
            await appendLog(entry);
            await saveChain(chain);
            res.writeHead(200,{ 'content-type':'application/json' });
            return res.end(JSON.stringify(entry));
          } catch (e){
            // Rollback in-memory on failure
            chain.pop();
            res.writeHead(500,{ 'content-type':'application/json' });
            return res.end(JSON.stringify({ error:'persist_failed', detail: e.message }));
          }
        });
        return;
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
