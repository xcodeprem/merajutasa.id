#!/usr/bin/env node
/**
 * event-canonicalize.js
 * - Reads an event JSON from stdin or file (--file)
 * - Removes integrity.event_hash if present
 * - Performs JCS-like canonicalization (stable key sort)
 * - Outputs canonical JSON string to stdout
 */
import { promises as fs } from 'fs';

function sortObject(value){
  if (Array.isArray(value)) {return value.map(sortObject);}
  if (value && typeof value === 'object'){
    const sorted = {};
    Object.keys(value).sort().forEach(k=>{ sorted[k] = sortObject(value[k]); });
    return sorted;
  }
  return value;
}

async function readInput(file){
  if (file){ return JSON.parse(await fs.readFile(file,'utf8')); }
  const chunks=[]; for await (const c of process.stdin) {chunks.push(c);}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function stripEventHash(evt){
  const clone = JSON.parse(JSON.stringify(evt));
  if (clone.integrity && clone.integrity.event_hash){ delete clone.integrity.event_hash; }
  return clone;
}

async function main(){
  const args = process.argv.slice(2);
  const fileArgIdx = args.indexOf('--file');
  const file = fileArgIdx>=0 ? args[fileArgIdx+1] : null;
  const input = await readInput(file);
  const prepared = stripEventHash(input);
  const canonical = sortObject(prepared);
  process.stdout.write(JSON.stringify(canonical));
}

main().catch(e=>{ console.error('[event-canonicalize] error', e); process.exit(2); });
