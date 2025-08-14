#!/usr/bin/env node
import { promises as fs } from 'fs';

async function main(){
  const path = 'artifacts/chain.json';
  let chain=[]; try { chain = JSON.parse(await fs.readFile(path,'utf8')); } catch {}
  const issues=[];
  for (let i=0;i<chain.length;i++){
    const prev = i? chain[i-1].contentHash : null;
    if (chain[i].prevHash !== prev) issues.push({ seq: i, code:'PREV_HASH_MISSING_OR_MISMATCH' });
  }
  const report = { version:'1.0.0', generated_utc: new Date().toISOString(), length: chain.length, issues };
  await fs.mkdir('artifacts',{recursive:true});
  await fs.writeFile('artifacts/chain-monitor.json', JSON.stringify(report,null,2));
  if (issues.length){ console.error('[chain-monitor] FAIL', issues); process.exit(1); }
  console.log('[chain-monitor] PASS length='+chain.length);
}
main().catch(e=>{ console.error('chain-monitor error', e); process.exit(2); });
