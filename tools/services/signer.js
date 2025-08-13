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
const PRIV_PATH = `${KEY_DIR}/ed25519_sk.pem`;
const PUB_PATH = `${KEY_DIR}/ed25519_pk.pem`;

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

async function ensureKeypair(){
  await fs.mkdir(KEY_DIR,{recursive:true});
  const hasPriv = await fs.access(PRIV_PATH).then(()=>true).catch(()=>false);
  if (!hasPriv){
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    await fs.writeFile(PRIV_PATH, privateKey.export({type:'pkcs8',format:'pem'}));
    await fs.writeFile(PUB_PATH, publicKey.export({type:'spki',format:'pem'}));
  }
  const priv = await fs.readFile(PRIV_PATH,'utf8');
  const pub = await fs.readFile(PUB_PATH,'utf8');
  return { priv, pub };
}

function signCanonical(privPem, canonical){
  return crypto.sign(null, Buffer.from(canonical,'utf8'), privPem).toString('base64');
}
function verifyCanonical(pubPem, canonical, sigB64){
  return crypto.verify(null, Buffer.from(canonical,'utf8'), pubPem, Buffer.from(sigB64,'base64'));
}

async function start(){
  const keys = await ensureKeypair();
  const server = http.createServer(async (req,res)=>{
    try {
      if (req.method === 'GET' && req.url === '/pubkey'){
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify({ publicKeyPem: keys.pub }));
      }
      if (req.method === 'POST' && req.url === '/sign'){
        const body = await readBody(req);
        const { payload = {} } = body;
        const canonical = typeof payload === 'string'? payload : stableStringify(payload);
        const hash = crypto.createHash('sha256').update(canonical).digest('hex');
        const signature = signCanonical(keys.priv, canonical);
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify({ canonical, hash_sha256: hash, signature, alg: 'Ed25519' }));
      }
      if (req.method === 'POST' && req.url === '/verify'){
        const body = await readBody(req);
        const { canonical, signature } = body;
        if (!canonical || !signature){
          res.writeHead(400,{ 'content-type':'application/json' });
          return res.end(JSON.stringify({ error:'canonical & signature required'}));
        }
        const verified = verifyCanonical(keys.pub, canonical, signature);
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
