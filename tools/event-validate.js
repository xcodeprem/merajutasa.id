#!/usr/bin/env node
/**
 * event-validate.js
 * - Validates event(s) against base schema and prohibited fields policy.
 * - Optional: validate meta by event_name when sub-schemas are available.
 * - Computes event_hash when --rehash provided and writes a verification report.
 * Usage:
 *   node tools/event-validate.js --file path/to/events.ndjson --rehash
 */
import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { compileMetaValidators } from './event-meta-schemas.js';

const BASE_SCHEMA_PATH = 'schemas/events/public-event-v1.json';
const OUT_PATH = 'artifacts/event-validate-report.json';

function sha256Hex(buf){ return createHash('sha256').update(buf).digest('hex'); }
function canonicalStringify(obj){
  const sort = (v)=> Array.isArray(v)? v.map(sort) : (v && typeof v==='object'? Object.keys(v).sort().reduce((a,k)=>{ a[k]=sort(v[k]); return a; }, {}) : v);
  return JSON.stringify(sort(obj));
}

const PROHIBITED_META_RE = /\b(ip(address)?|email|e[-_]?mail|phone|tel(ephone)?|address|lat(itude)?|lng|long(itude)?|geo(coordinates)?|user[-_ ]?agent|cookie|fingerprint|session(secret)?|auth|token|child(Name|DOB|Birth)|rank(ing)?|rating|score)\b/i;

async function* readNdjson(file){
  const txt = await fs.readFile(file,'utf8');
  for (const line of txt.split(/\r?\n/)){
    if (!line.trim()) {continue;}
    try { yield JSON.parse(line); } catch { yield { __parse_error: true, line }; }
  }
}

async function main(){
  const args = process.argv.slice(2);
  await fs.mkdir('artifacts',{recursive:true});
  const fileIdx = args.indexOf('--file');
  const rehash = args.includes('--rehash');
  const file = fileIdx>=0 ? args[fileIdx+1] : null;
  if (!file){ console.error('Usage: node tools/event-validate.js --file events.ndjson [--rehash]'); process.exit(2); }
  const baseSchema = JSON.parse(await fs.readFile(BASE_SCHEMA_PATH,'utf8'));
  // Use Ajv2020 to support $schema: 2020-12 declared in the base schema
  const ajv = new Ajv2020({ strict:false, allErrors:true });
  addFormats(ajv);
  const validate = ajv.compile(baseSchema);
  const { validators: metaValidators } = compileMetaValidators(ajv);

  let total=0, valid=0, invalid=0, prohibited=0, hashMismatch=0, metaInvalid=0;
  const results = [];
  for await (const evt of readNdjson(file)){
    total++;
    if (evt.__parse_error){ invalid++; results.push({ status:'PARSE_ERROR', detail:'Invalid JSON', line: evt.line.slice(0,200) }); continue; }
    // If rehashing, compute digest and backfill empty/missing integrity.event_hash prior to schema validation
    if (rehash){
      const cloneForHash = JSON.parse(JSON.stringify(evt));
      if (cloneForHash.integrity) {delete cloneForHash.integrity.event_hash;}
      const canonForHash = canonicalStringify(cloneForHash);
      const digestForHash = sha256Hex(canonForHash);
      if (!evt.integrity) {evt.integrity = {};}
      if (!evt.integrity.event_hash || evt.integrity.event_hash === ''){
        evt.integrity.event_hash = digestForHash;
        results.push({ status:'HASH_FILLED', event_id: evt.event_id, event_hash: digestForHash });
      }
    }
    const ok = validate(evt);
    if (!ok){ invalid++; results.push({ status:'SCHEMA_ERROR', errors: validate.errors }); continue; }
    // prohibited field scan
    const metaStr = JSON.stringify(evt.meta||{});
    if (PROHIBITED_META_RE.test(metaStr)){ prohibited++; results.push({ status:'PROHIBITED_META', event_id: evt.event_id }); }
    // per-event meta validation (advisory in Wave 1.5)
    const mv = metaValidators.get(evt.event_name);
    if (mv){
      const okMeta = mv(evt.meta || {});
      if (!okMeta){ metaInvalid++; results.push({ status:'META_SCHEMA_ERROR', event_id: evt.event_id, event_name: evt.event_name, errors: mv.errors }); }
    }
    // rehash
    if (rehash){
      const clone = JSON.parse(JSON.stringify(evt));
      if (clone.integrity) {delete clone.integrity.event_hash;}
      const canon = canonicalStringify(clone);
      const digest = sha256Hex(canon);
      if (evt.integrity?.event_hash && evt.integrity.event_hash !== digest){
        hashMismatch++; results.push({ status:'HASH_MISMATCH', event_id: evt.event_id, expected: evt.integrity.event_hash, actual: digest });
      }
    }
    if (ok) {valid++;}
  }

  const report = { version:1, summary:{ total, valid, invalid, prohibited, hashMismatch, metaInvalid }, results };
  await fs.writeFile(OUT_PATH, JSON.stringify(report,null,2));
  const exitCode = invalid>0 ? 2 : 0; // advisory for prohibited/hashMismatch in Wave 1.5
  process.exit(exitCode);
}

main().catch(e=>{ console.error('[event-validate] error', e); process.exit(2); });
