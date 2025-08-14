#!/usr/bin/env node
/**
 * signer.js
 * Minimal Ed25519 signer service (in-memory key) for baseline trust primitive.
 * NOT production ready (no HSM, no rotation). Endpoints:
 *  - GET  /pubkey  => { publicKeyPem }
 *  - POST /sign    => { canonical, hash_sha256, signature, alg }
 *  - POST /verify  => { verified }
 * Canonicalization: deterministic JSON (sorted keys).
 */
import http from 'http';
import { promises as fs } from 'fs';
import { generateKeyPairSync } from 'crypto';
import crypto from 'crypto';

const PORT = process.env.SIGNER_PORT || 4601;
const KEY_DIR = '.integrity';
const KEYS_STATE = `${KEY_DIR}/keys.json`;

function stableStringify(obj){
  if (typeof obj === 'string') return obj;
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k=>`"${k}":${stableSerialize(obj[k])}`).join(',') + '}';
}
function stableSerialize(v){
  if (v === null) return 'null';
  if (Array.isArray(v)) return '['+v.map(stableSerialize).join(',')+']';
  switch(typeof v){
    case 'string': return JSON.stringify(v);
    case 'number': return Number.isFinite(v)? String(v):'null';
    case 'boolean': return v?'true':'false';
    case 'object': return stableStringify(v);
    default: return 'null';
  }
}

async function ensureKeys(){
  await fs.mkdir(KEY_DIR,{recursive:true});
  let state = null;
  try { state = JSON.parse(await fs.readFile(KEYS_STATE,'utf8')); } catch { /* no-op */ }
  if (!state || !Array.isArray(state.keys) || typeof state.activeIndex !== 'number'){
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    state = { activeIndex: 0, keys: [
      {
        id: `k-${Date.now()}`,
        privPem: privateKey.export({type:'pkcs8',format:'pem'}),
        pubPem: publicKey.export({type:'spki',format:'pem'})
      }
    ]};
    await fs.writeFile(KEYS_STATE, JSON.stringify(state,null,2));
  }
  return state;
}

function signCanonical(privPem, canonical){
  return crypto.sign(null, Buffer.from(canonical,'utf8'), privPem).toString('base64');
}
function verifyCanonical(pubPem, canonical, sigB64){
  return crypto.verify(null, Buffer.from(canonical,'utf8'), pubPem, Buffer.from(sigB64,'base64'));
}

async function start(){
  let state = await ensureKeys();
  const server = http.createServer(async (req,res)=>{
    try {
      if (req.method === 'GET' && req.url === '/pubkey'){
        res.writeHead(200,{ 'content-type':'application/json' });
        const active = state.keys[state.activeIndex];
        return res.end(JSON.stringify({ publicKeyPem: active.pubPem }));
      }
      if (req.method === 'GET' && req.url === '/pubkeys'){
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify({ activeIndex: state.activeIndex, keys: state.keys.map(k=>({ id:k.id, publicKeyPem: k.pubPem })) }));
      }
      if (req.method === 'POST' && req.url === '/sign'){
        const body = await readBody(req);
        const { payload = {} } = body;
        const canonical = typeof payload === 'string'? payload : stableStringify(payload);
        const hash = crypto.createHash('sha256').update(canonical).digest('hex');
        const active = state.keys[state.activeIndex];
        const signature = signCanonical(active.privPem, canonical);
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify({ canonical, hash_sha256: hash, signature, alg: 'Ed25519' }));
      }
      if (req.method === 'POST' && req.url === '/rotate'){
        // generate new key and set active; keep old keys for verify
        const { publicKey, privateKey } = generateKeyPairSync('ed25519');
        state.keys.push({ id:`k-${Date.now()}`, privPem: privateKey.export({type:'pkcs8',format:'pem'}), pubPem: publicKey.export({type:'spki',format:'pem'}) });
        state.activeIndex = state.keys.length - 1;
        await fs.writeFile(KEYS_STATE, JSON.stringify(state,null,2));
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify({ ok:true, activeIndex: state.activeIndex }));
      }
      if (req.method === 'POST' && req.url === '/verify'){
        const body = await readBody(req);
        const { canonical, signature } = body;
        if (!canonical || !signature){
          res.writeHead(400,{ 'content-type':'application/json' });
          return res.end(JSON.stringify({ error:'canonical & signature required'}));
        }
        // try verify with all known keys
        const verified = state.keys.some(k=> verifyCanonical(k.pubPem, canonical, signature));
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify({ verified }));
      }
      res.writeHead(404); res.end();
    } catch(e){
      res.writeHead(500,{ 'content-type':'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
  server.listen(PORT, ()=> console.log(`[signer] listening on ${PORT}`));
}

function readBody(req){
  return new Promise((resolve,reject)=>{ let b=''; req.on('data',d=>b+=d); req.on('end',()=>{ try { resolve(b? JSON.parse(b):{}); } catch(e){ reject(e);} }); req.on('error',reject); });
}

start().catch(e=>{ console.error('signer fatal', e); process.exit(2); });
