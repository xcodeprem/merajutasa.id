#!/usr/bin/env node
/**
 * event-anchor-chain.js
 * Batches selected events (fairness enter/exit & verify attempts) from a sample NDJSON and appends a summary canonical to the chain.
 */
import { promises as fs } from 'fs';

async function* readNdjson(path){
  const txt = await fs.readFile(path,'utf8');
  for (const line of txt.split(/\r?\n/)){
    if(!line.trim()) continue;
    try { yield JSON.parse(line); } catch {/*skip*/}
  }
}

async function main(){
  const file = process.argv.includes('--file')? process.argv[process.argv.indexOf('--file')+1] : 'data/events-sample.ndjson';
  const out = { schema_version:'1.0', type:'event_anchor_batch', items:[], counts:{} };
  for await (const evt of readNdjson(file)){
    if (!evt || !evt.event_name) continue;
    if (/^(sys_fairness_under_served_(enter|exit)|pub_hash_verify_click)$/.test(evt.event_name)){
      out.items.push({ event_name: evt.event_name, occurred_at: evt.occurred_at, unit_id: evt.meta?.unit_id || null, result: evt.meta?.result || null });
      out.counts[evt.event_name] = (out.counts[evt.event_name]||0) + 1;
    }
  }
  const canonical = JSON.stringify(out, Object.keys(out).sort());
  try {
    const signerRes = await fetch(`http://127.0.0.1:${process.env.SIGNER_PORT||4601}/sign`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ payload: canonical }) });
    if (!signerRes.ok) throw new Error('signer not reachable');
    const sig = await signerRes.json();
    const pub = await (await fetch(`http://127.0.0.1:${process.env.SIGNER_PORT||4601}/pubkey`)).json();
    const chainRes = await fetch(`http://127.0.0.1:${process.env.CHAIN_PORT||4602}/append`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ canonical: sig.canonical, signature: sig.signature, publicKeyPem: pub.publicKeyPem }) });
    if (!chainRes.ok) throw new Error('chain append failed');
    const entry = await chainRes.json();
    await fs.writeFile('artifacts/event-anchor-latest.json', JSON.stringify({ appended: { seq: entry.seq, contentHash: entry.contentHash, prevHash: entry.prevHash, ts: entry.ts } }, null, 2));
  } catch(e){
    await fs.writeFile('artifacts/event-anchor-latest.json', JSON.stringify({ skipped: true, reason: e.message }, null, 2));
  }
}

main().catch(e=>{ console.error('[event-anchor-chain] error', e); process.exit(2); });
