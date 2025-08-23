#!/usr/bin/env node
/**
 * Simple stability test for event-pipeline-hash.js
 * - Runs the hasher twice and asserts identical output (hash & events) within a single run
 */
import { spawnSync } from 'child_process';
import { promises as fs } from 'fs';

function runHasher(){
  const r = spawnSync(process.execPath, ['tools/event-pipeline-hash.js'], { encoding: 'utf8' });
  if (r.status !== 0) {throw new Error('hasher failed: ' + (r.stderr||r.stdout));}
}

async function main(){
  runHasher();
  const a = JSON.parse(await fs.readFile('artifacts/event-pipeline-hash.json','utf8'));
  // touch a second run
  runHasher();
  const b = JSON.parse(await fs.readFile('artifacts/event-pipeline-hash.json','utf8'));
  const same = a.pipeline_hash === b.pipeline_hash && JSON.stringify(a.events) === JSON.stringify(b.events);
  if (!same){
    console.error('[test] pipeline hash instability detected');
    console.error('A:', a.pipeline_hash, a.event_count);
    console.error('B:', b.pipeline_hash, b.event_count);
    process.exit(1);
  }
  console.log('[test] pipeline hash stability PASS:', a.pipeline_hash.slice(0,16)+'…');
}

main().catch(e=>{ console.error('[test] error', e); process.exit(2); });
