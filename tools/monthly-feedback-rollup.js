#!/usr/bin/env node
/**
 * monthly-feedback-rollup.js
 * H1-G2 (dry run): Aggregate feedback records per calendar month.
 * Input: artifacts/feedback-records.ndjson (append-only)
 * Output: artifacts/feedback-monthly-rollup.json
 */
import { promises as fs } from 'fs';
import path from 'path';

async function readNdjson(p){
  try {
    const txt = await fs.readFile(p,'utf8');
    return txt.split(/\r?\n/).filter(Boolean).map(l=>{ try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch {
    return [];
  }
}

function ymKey(ts){
  const d = ts ? new Date(ts) : new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth()+1).padStart(2,'0');
  return `${y}-${m}`;
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const inPath = path.resolve('artifacts/feedback-records.ndjson');
  const records = await readNdjson(inPath);

  // Aggregate
  const months = new Map();
  for (const r of records){
    const key = ymKey(r.created_at);
    const bucket = months.get(key) || { month: key, total: 0, categories: {}, pii: {}, avg_len: 0 };
    bucket.total += 1;
    // categories[]
    if (Array.isArray(r.categories)){
      for (const c of r.categories){
        const k = String(c).toLowerCase();
        bucket.categories[k] = (bucket.categories[k]||0)+1;
      }
    }
    // pii_categories[]
    if (Array.isArray(r.pii_categories)){
      for (const p of r.pii_categories){
        const k = String(p).toUpperCase();
        bucket.pii[k] = (bucket.pii[k]||0)+1;
      }
    }
    // simple avg length of original text if meta.len provided
    const len = Number(r?.meta?.len || 0) || 0;
    bucket.avg_len = Number(((bucket.avg_len * (bucket.total-1) + len) / bucket.total).toFixed(1));
    months.set(key, bucket);
  }

  // Try to capture blocked counts from smoke report as context (optional)
  let blocked_hint = null;
  try {
    const smoke = JSON.parse(await fs.readFile('artifacts/feedback-smoke-report.json','utf8'));
    const blocked = (Array.isArray(smoke.results) ? smoke.results.filter(x=>x.status==='BLOCKED').length : 0);
    blocked_hint = blocked;
  } catch {}

  const out = {
    version: '1.0.0',
    generated_utc: new Date().toISOString(),
    source_records: records.length,
    blocked_hint,
    months: Array.from(months.values()).sort((a,b)=> a.month.localeCompare(b.month))
  };

  await fs.writeFile('artifacts/feedback-monthly-rollup.json', JSON.stringify(out,null,2));
  const last = out.months[out.months.length-1];
  console.log(`[monthly-feedback] months=${out.months.length} last_month_total=${last? last.total: 0}`);
}

main().catch(e=>{ console.error('[monthly-feedback] error', e); process.exit(2); });
