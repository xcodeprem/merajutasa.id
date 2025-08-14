#!/usr/bin/env node
/**
 * feedback-smoke.js
 * Minimal smoke write path for feedback storage: redact text, detect simple PII categories,
 * validate against schemas/feedback/feedback-record-v1.json, and append to artifacts/feedback-records.ndjson
 * Also writes artifacts/feedback-smoke-report.json
 */
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const FEEDBACK_SCHEMA_PATH = 'schemas/feedback/feedback-record-v1.json';
const OUT_NDJSON = 'artifacts/feedback-records.ndjson';
const OUT_REPORT = 'artifacts/feedback-smoke-report.json';

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /\b(?:\+?\d[\d\s\-()]{7,}\d)\b/g;

function redact(text){
  let redacted = text.replace(EMAIL_RE, '[email]');
  redacted = redacted.replace(PHONE_RE, '[phone]');
  return redacted;
}

function detectPiiCategories(text){
  const cats = new Set();
  if (EMAIL_RE.test(text)) cats.add('CONTACT_EMAIL');
  EMAIL_RE.lastIndex = 0;
  if (PHONE_RE.test(text)) cats.add('CONTACT_PHONE');
  PHONE_RE.lastIndex = 0;
  return [...cats];
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const ajv = new Ajv2020({ strict:false, allErrors:true });
  addFormats(ajv);
  const schema = JSON.parse(await fs.readFile(FEEDBACK_SCHEMA_PATH,'utf8'));
  const validate = ajv.compile(schema);

  const samples = [
    { categories:['product','ux'], text: 'Halo tim, email saya user@example.com, tolong perbaiki.' },
    { categories:['bug'], text: 'Kontak saya +62 812-3456-7890 bila butuh info lanjut.' }
  ];

  const results = [];
  for (const s of samples){
    const piiCats = detectPiiCategories(s.text);
    const red = redact(s.text);
    const rec = {
      record_id: randomUUID(),
      event_id: randomUUID(),
      created_at: new Date().toISOString(),
      categories: s.categories,
      redacted_text: red,
      pii_categories: piiCats,
      meta: { len: s.text.length }
    };
    const ok = validate(rec);
    if (!ok){
      results.push({ status:'INVALID', errors: validate.errors });
    } else {
      await fs.appendFile(OUT_NDJSON, JSON.stringify(rec)+'\n');
      results.push({ status:'OK', record_id: rec.record_id, pii_categories: piiCats });
    }
  }
  await fs.writeFile(OUT_REPORT, JSON.stringify({ version:1, total: samples.length, results }, null, 2));
  console.log('[feedback-smoke] wrote', samples.length, 'records');
}

main().catch(e=>{ console.error('[feedback-smoke] error', e); process.exit(2); });
