#!/usr/bin/env node
/**
 * collector.js
 * Minimal HTTP Event Collector (H0):
 *  - POST /ingest { event }
 *  - POST /ingest-batch (ndjson/plain or JSON array)
 *  - GET  /stats (counts)
 *  - GET  /health
 * Validates against base schema (draft 2020-12), enforces date-time formats,
 * computes integrity.event_hash if missing, and performs basic prohibited meta scan.
 * For feedback-like events, attempts light redaction on `meta.text`/`meta.message`.
 */
import http from 'http';
import { promises as fs } from 'fs';
import { createHash, randomUUID } from 'crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { compileMetaValidators } from '../event-meta-schemas.js';

const PORT = Number(process.env.COLLECTOR_PORT || 4603);
const BASE_SCHEMA_PATH = 'schemas/events/public-event-v1.json';
const INGEST_PATH = 'artifacts/ingested-events.ndjson';
const PIPELINE_HASH_ARTIFACT = 'artifacts/event-pipeline-hash.json';
const SCHEMA_DOC = 'docs/analytics/event-schema-canonical-v1.md';

function sha256Hex(buf){ return createHash('sha256').update(buf).digest('hex'); }
function canonicalStringify(obj){
  const sort = (v)=> Array.isArray(v)? v.map(sort) : (v && typeof v==='object'? Object.keys(v).sort().reduce((a,k)=>{ a[k]=sort(v[k]); return a; }, {}) : v);
  return JSON.stringify(sort(obj));
}
const PROHIBITED_META_RE = /\b(ip(address)?|email|e[-_]?mail|phone|tel(ephone)?|address|lat(itude)?|lng|long(itude)?|geo(coordinates)?|user[-_ ]?agent|cookie|fingerprint|session(secret)?|auth|token|child(Name|DOB|Birth)|rank(ing)?|rating|score)\b/i;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /\b(?:\+?\d[\d\s\-()]{7,}\d)\b/g;

async function appendNdjson(obj){
  await fs.mkdir('artifacts',{recursive:true});
  await fs.appendFile(INGEST_PATH, JSON.stringify(obj)+'\n');
}

async function loadValidator(){
  const baseSchema = JSON.parse(await fs.readFile(BASE_SCHEMA_PATH,'utf8'));
  const ajv = new Ajv2020({ strict:false, allErrors:true });
  addFormats(ajv);
  const validate = ajv.compile(baseSchema);
  return validate;
}

async function tryLoadPipelineHash(){
  // Prefer artifact, else compute from schema doc like tools/event-pipeline-hash.js
  let schema_version = '1.0';
  let pipeline_hash = null;
  try{
    const raw = await fs.readFile(PIPELINE_HASH_ARTIFACT,'utf8');
    const obj = JSON.parse(raw);
    if (obj && obj.pipeline_hash) {
      pipeline_hash = obj.pipeline_hash;
      if (obj.schema_version) schema_version = obj.schema_version;
      return { schema_version, pipeline_hash };
    }
  }catch{}
  let event_names = [];
  try{
    const doc = await fs.readFile(SCHEMA_DOC,'utf8');
    const versionMatch = doc.match(/Canonical Specification \(v([0-9.]+)\)/);
    if (versionMatch) schema_version = versionMatch[1];
    const eventNames = Array.from(doc.matchAll(/^[-*]\s+(pub|sys)_[a-z0-9_]+/gmi)).map(m=>m[0].replace(/^[-*]\s+/,'').trim());
    const uniqueSorted = [...new Set(eventNames)].sort();
    event_names = uniqueSorted;
    const schemaHash = sha256Hex(doc);
    pipeline_hash = sha256Hex(`${schema_version}|${uniqueSorted.join(',')}|${schemaHash}`);
  }catch{}
  return { schema_version, pipeline_hash, event_names };
}

function redactFeedbackMeta(evt){
  if (!evt || !evt.meta) return { redacted:false };
  let redacted=false;
  for (const key of ['text','message']){
    if (typeof evt.meta[key] === 'string'){
      const before = evt.meta[key];
      let v = before.replace(EMAIL_RE,'[email]');
      v = v.replace(PHONE_RE,'[phone]');
      if (v !== before){ evt.meta[key] = v; redacted=true; }
    }
  }
  return { redacted };
}

function prepareEvent(evt){
  // Compute event_hash if missing
  const clone = JSON.parse(JSON.stringify(evt));
  if (clone.integrity) delete clone.integrity.event_hash;
  const canon = canonicalStringify(clone);
  const digest = sha256Hex(canon);
  if (!evt.integrity) evt.integrity = {};
  if (!evt.integrity.event_hash) evt.integrity.event_hash = digest;
  return { digest };
}

function ensureDefaults(evt, defaults){
  // Minimal defaults for H0 bootstrap to reduce schema friction
  if (!evt.schema_version) evt.schema_version = defaults.schema_version || '1.0';
  if (!evt.event_name) evt.event_name = 'pub_hero_view';
  if (!evt.event_id) evt.event_id = (typeof randomUUID === 'function') ? randomUUID() : `${Date.now()}-evt`;
  if (!evt.session_id) evt.session_id = (typeof randomUUID === 'function') ? randomUUID() : `${Date.now()}-sess`;
  if (!evt.user_type) evt.user_type = 'public_anonymous';
  if (!evt.page) evt.page = 'landing';
  if (!evt.source) evt.source = 'web_public';
  if (!evt.occurred_at) evt.occurred_at = new Date().toISOString();
  if (!evt.received_at) evt.received_at = new Date().toISOString();
  if (!evt.privacy) evt.privacy = { pii_scan_performed: true, pii_detected: false, raw_payload_scrubbed: true };
  if (!evt.integrity) evt.integrity = {};
  if (!evt.integrity.schema_version_ack) evt.integrity.schema_version_ack = evt.schema_version;
  if (!evt.integrity.pipeline_hash && defaults.pipeline_hash) evt.integrity.pipeline_hash = defaults.pipeline_hash;
}

async function start(){
  const validate = await loadValidator();
  const defaults = await tryLoadPipelineHash();
  const { validators: metaValidators } = compileMetaValidators();
  const server = http.createServer(async (req,res)=>{
    try{
      if (req.method==='GET' && req.url==='/health'){
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify({ ok:true, pipeline_hash_loaded: !!defaults.pipeline_hash, schema_version: defaults.schema_version }));
      }
      if (req.method==='GET' && req.url==='/stats'){
        const exists = await fs.access(INGEST_PATH).then(()=>true).catch(()=>false);
        if (!exists){ res.writeHead(200,{ 'content-type':'application/json' }); return res.end(JSON.stringify({ total:0, byEvent:{} })); }
        const txt = await fs.readFile(INGEST_PATH,'utf8');
        const lines = txt.split(/\r?\n/).filter(Boolean);
        const byEvent = {};
        for (const line of lines){
          try{ const e = JSON.parse(line); byEvent[e.event_name] = (byEvent[e.event_name]||0)+1; }catch{}
        }
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify({ total: lines.length, byEvent }));
      }
  if (req.method==='POST' && req.url==='/ingest'){
  const body = await readJson(req);
  const evt = body.event || body; // allow raw event
  ensureDefaults(evt, defaults);
  // Compute event_hash before validation because schema requires it
  const { digest } = prepareEvent(evt);
  // Enforce whitelist when available
  if (Array.isArray(defaults.event_names) && defaults.event_names.length>0) {
    if (!defaults.event_names.includes(evt.event_name)){
      res.writeHead(400,{ 'content-type':'application/json' });
      return res.end(JSON.stringify({ status:'UNKNOWN_EVENT', event_name: evt.event_name }));
    }
  }
  const ok = validate(evt);
        if (!ok){ res.writeHead(400,{ 'content-type':'application/json' }); return res.end(JSON.stringify({ status:'SCHEMA_ERROR', errors: validate.errors })); }
        const metaStr = JSON.stringify(evt.meta||{});
        const prohibited = PROHIBITED_META_RE.test(metaStr);
        // per-event meta validation (advisory)
        let meta_valid = true; let meta_errors = undefined;
        const mv = metaValidators.get(evt.event_name);
        if (mv){
          meta_valid = mv(evt.meta || {});
          if (!meta_valid) meta_errors = mv.errors;
        }
        if (/feedback/i.test(evt.event_name||'') || /feedback|message|text/i.test(metaStr)){
          redactFeedbackMeta(evt);
        }
        await appendNdjson(evt);
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify({ status:'INGESTED', event_hash: digest, prohibited_meta: !!prohibited, meta_valid, meta_errors }));
      }
    if (req.method==='POST' && req.url==='/ingest-batch'){
        const raw = await readRaw(req);
        let count=0, errors=0;
        // Accept NDJSON or JSON array
        const isJsonArray = raw.trim().startsWith('[');
        const lines = isJsonArray? JSON.parse(raw) : raw.split(/\r?\n/).filter(Boolean).map(l=>{ try{return JSON.parse(l);}catch{return { __parse_error:true, raw:l}}});
        for (const evt of lines){
          if (!evt || evt.__parse_error){ errors++; continue; }
          ensureDefaults(evt, defaults);
          // Pre-compute event_hash so required field exists
          prepareEvent(evt);
          const ok = validate(evt);
          if (!ok){ errors++; continue; }
          if (/feedback/i.test(evt.event_name||'')) redactFeedbackMeta(evt);
          await appendNdjson(evt);
          count++;
        }
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify({ status:'BATCH_DONE', ingested: count, errors }));
      }
      res.writeHead(404); res.end();
    }catch(e){
      res.writeHead(500,{ 'content-type':'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
  server.listen(PORT, ()=> console.log(`[collector] listening on ${PORT}`));
}

function readRaw(req){
  return new Promise((resolve,reject)=>{ let b=''; req.on('data',d=>b+=d); req.on('end',()=>resolve(b)); req.on('error',reject); });
}
function readJson(req){
  return new Promise((resolve,reject)=>{ let b=''; req.on('data',d=>b+=d); req.on('end',()=>{ try{ resolve(b? JSON.parse(b):{});} catch(e){ reject(e);} }); req.on('error',reject); });
}

start().catch(e=>{ console.error('[collector] fatal', e); process.exit(2); });
