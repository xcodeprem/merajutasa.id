#!/usr/bin/env node
/**
 * chain-append-spec-hash.js
 * Standalone helper to sign and append a canonical summary of spec-hash-diff to the hash chain,
 * producing artifacts/chain-append-latest.json as proof.
 */
import { promises as fs } from 'fs';

async function main(){
  const signerPort = process.env.SIGNER_PORT || 4601;
  const chainPort = process.env.CHAIN_PORT || 4602;
  const spec = JSON.parse(await fs.readFile('artifacts/spec-hash-diff.json','utf8'));
  const canonical = JSON.stringify({ mode: spec.mode, updated: spec.updated, summary: spec.summary });

  const signerRes = await fetch(`http://127.0.0.1:${signerPort}/sign`, {
    method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ payload: canonical })
  });
  if(!signerRes.ok){
    throw new Error(`signer not reachable (status ${signerRes.status})`);
  }
  const sig = await signerRes.json();
  const pubRes = await fetch(`http://127.0.0.1:${signerPort}/pubkey`);
  if(!pubRes.ok){
    throw new Error('failed to fetch public key');
  }
  const { publicKeyPem } = await pubRes.json();
  const chainRes = await fetch(`http://127.0.0.1:${chainPort}/append`, {
    method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ canonical: sig.canonical, signature: sig.signature, publicKeyPem })
  });
  if(!chainRes.ok){
    throw new Error(`chain append failed (status ${chainRes.status})`);
  }
  const entry = await chainRes.json();
  await fs.mkdir('artifacts',{recursive:true});
  await fs.writeFile('artifacts/chain-append-latest.json', JSON.stringify({ proof_version:1, appended:{ seq:entry.seq, contentHash:entry.contentHash, prevHash: entry.prevHash, ts: entry.ts } }, null, 2));
  console.log(`[chain-append] OK seq=${entry.seq} hash=${entry.contentHash}`);
}

main().catch(e=>{ console.error('[chain-append] ERROR', e.message); process.exit(2); });
