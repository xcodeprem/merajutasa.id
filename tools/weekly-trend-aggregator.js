#!/usr/bin/env node
/**
 * weekly-trend-aggregator.js
 * D2: Aggregate ingested events (NDJSON) into ISO week buckets and compute coverage.
 * Output: artifacts/weekly-trends.json
 */
import { promises as fs } from 'fs';
import path from 'path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

function isoWeek(date) {
  // Returns e.g., '2025-W33' and week start/end in UTC (Mon-Sun)
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Set to nearest Thursday to determine week number
  const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const diff = d - firstThursday;
  const week = 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
  const year = d.getUTCFullYear();

  // Compute week start (Monday) and end (Sunday) for display
  const weekStart = new Date(d);
  weekStart.setUTCDate(weekStart.getUTCDate() - 3); // back to Monday of that ISO week
  const startDayNum = (weekStart.getUTCDay() + 6) % 7;
  weekStart.setUTCDate(weekStart.getUTCDate() - startDayNum);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  return {
    key: `${year}-W${String(week).padStart(2,'0')}`,
    start_utc: weekStart.toISOString().slice(0,10),
    end_utc: weekEnd.toISOString().slice(0,10),
  };
}

const PROHIBITED_META_RE = /\b(ip(address)?|email|e[-_]?mail|phone|tel(ephone)?|address|lat(itude)?|lng|long(itude)?|geo(coordinates)?|user[-_ ]?agent|cookie|fingerprint|session(secret)?|auth|token|child(Name|DOB|Birth)|rank(ing)?|rating|score)\b/i;

async function buildSchemaValidator(){
  try {
    const schemaTxt = await fs.readFile('schemas/events/public-event-v1.json','utf8');
    const schema = JSON.parse(schemaTxt);
    const ajv = new Ajv2020({ strict:false, allErrors:false });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    return (ev)=> !!validate(ev);
  } catch (e){
    // Fallback to heuristic if schema cannot be read/compiled
    return (ev)=> ev && typeof ev.event_name === 'string' && ev.event_name.length>0
      && typeof ev.occurred_at === 'string' && typeof ev.received_at === 'string'
      && ev.meta && typeof ev.meta === 'object';
  }
}

async function main(){
  await fs.mkdir('artifacts', { recursive: true });
  const ndjsonPath = path.resolve('artifacts/ingested-events.ndjson');
  let content = '';
  try { content = await fs.readFile(ndjsonPath, 'utf8'); }
  catch { content = ''; }
  // Try to get latest adoption percent snapshot for reference
  let adoptionPercent = null;
  try {
    const adoption = JSON.parse(await fs.readFile('artifacts/terminology-adoption.json','utf8'));
    if (typeof adoption?.adoptionPercent === 'number') {adoptionPercent = adoption.adoptionPercent;}
  } catch {}

  const isCanonical = await buildSchemaValidator();
  const weeks = new Map();
  if (content) {
    const lines = content.split(/\r?\n/).filter(Boolean);
    for (const line of lines){
      let ev; try { ev = JSON.parse(line); } catch { continue; }
      const ts = ev.occurred_at || ev.received_at;
      if (!ts) {continue;}
      const wk = isoWeek(new Date(ts));
      const bucket = weeks.get(wk.key) || { week: wk.key, start_utc: wk.start_utc, end_utc: wk.end_utc, totals: { events:0, canonical_ok:0, hero_views:0, feedback:0, prohibited:0 } };
      bucket.totals.events += 1;
      if (isCanonical(ev)) {bucket.totals.canonical_ok += 1;}
      if (PROHIBITED_META_RE.test(JSON.stringify(ev.meta||{}))) {bucket.totals.prohibited += 1;}
      const name = String(ev.event_name||'');
      if (name === 'pub_hero_view') {bucket.totals.hero_views += 1;}
      if (name.startsWith('feedback_')) {bucket.totals.feedback += 1;}
      weeks.set(wk.key, bucket);
    }
  }

  const out = Array.from(weeks.values()).sort((a,b)=> a.week.localeCompare(b.week)).map(w=>({
    ...w,
    totals: { ...w.totals, coverage: w.totals.events? Number((w.totals.canonical_ok / w.totals.events).toFixed(3)) : 0 },
  }));
  // Try to attach decision mix (POS/BND/NEG) from latest anomalies run if available
  let decision_mix = null;
  const weekly_decisions = new Map();
  try {
    const anomaliesTxt = await fs.readFile('artifacts/equity-anomalies.json','utf8');
    const anomalies = JSON.parse(anomaliesTxt);
    if (anomalies && anomalies.region_stats){
      // Summarize region counts across units
      const agg = { POS:0, BND:0, NEG:0 };
      for (const k of Object.keys(anomalies.region_stats)){
        const rs = anomalies.region_stats[k]||{};
        agg.POS += rs.POS||0; agg.BND += rs.BND||0; agg.NEG += rs.NEG||0;
      }
      const total = agg.POS + agg.BND + agg.NEG;
      decision_mix = total>0 ? {
        counts: agg,
        ratios: {
          POS: +(agg.POS/total).toFixed(3),
          BND: +(agg.BND/total).toFixed(3),
          NEG: +(agg.NEG/total).toFixed(3),
        },
      } : { counts: agg, ratios: { POS:0, BND:0, NEG:0 } };
    }
    // Per-snapshot decision log → aggregate by ISO week
    try {
      const dlogTxt = await fs.readFile('artifacts/equity-decision-log.json','utf8');
      const dlog = JSON.parse(dlogTxt);
      for (const e of dlog){
        if (!e?.ts || !e?.region) {continue;}
        const wk = isoWeek(new Date(e.ts)).key;
        const bucket = weekly_decisions.get(wk) || { POS:0, BND:0, NEG:0, total:0 };
        if (e.region==='POS') {bucket.POS++;} else if (e.region==='NEG') {bucket.NEG++;} else {bucket.BND++;}
        bucket.total++;
        weekly_decisions.set(wk, bucket);
      }
    } catch {}
  } catch {}

  // Attach per-week decision ratios if any
  const outWithDecisions = out.map(w=>{
    const dec = weekly_decisions.get(w.week);
    if (!dec || dec.total===0) {return w;}
    const ratios = { POS:+(dec.POS/dec.total).toFixed(3), BND:+(dec.BND/dec.total).toFixed(3), NEG:+(dec.NEG/dec.total).toFixed(3) };
    return { ...w, decisions: { counts: { POS:dec.POS, BND:dec.BND, NEG:dec.NEG }, ratios } };
  });

  const result = { version:'1.2.0', generated_utc: new Date().toISOString(), weeks: outWithDecisions, adoption_percent_latest: adoptionPercent, decision_mix };
  await fs.writeFile('artifacts/weekly-trends.json', JSON.stringify(result,null,2));
  const last = out[out.length-1];
  console.log(`[weekly-trends] weeks=${out.length} last_coverage=${last? last.totals.coverage : 'n/a'} last_events=${last? last.totals.events : 0}`);
}

main().catch(e=>{ console.error('[weekly-trends] error', e); process.exit(2); });
