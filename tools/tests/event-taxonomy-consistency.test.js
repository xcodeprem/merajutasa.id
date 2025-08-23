#!/usr/bin/env node
/**
 * Test: Event Taxonomy Consistency
 * Asserts that schemas/events/event-taxonomy-v1.json events[]
 * are a subset of the canonical taxonomy listed in docs/analytics/event-schema-canonical-v1.md.
 */
import { promises as fs } from 'fs';

const TAX_PATH = 'schemas/events/event-taxonomy-v1.json';
const MD_PATH = 'docs/analytics/event-schema-canonical-v1.md';

async function readJson(p){ return JSON.parse(await fs.readFile(p,'utf8')); }
async function readText(p){ return fs.readFile(p,'utf8'); }

function parseDocEvents(md){
  const ev = [];
  for (const line of md.split(/\r?\n/)){
    const m = line.match(/^\s*-\s*((?:pub|sys)_[a-z0-9_]+)/);
    if (m) {ev.push(m[1]);}
  }
  return Array.from(new Set(ev));
}

async function main(){
  const tax = await readJson(TAX_PATH);
  const md = await readText(MD_PATH);
  const docEvents = new Set(parseDocEvents(md));
  const jsonEvents = Array.isArray(tax.events) ? tax.events : [];
  const extraInJson = jsonEvents.filter(e => !docEvents.has(e));
  if (extraInJson.length){
    console.error('[taxonomy-consistency] FAIL events present in JSON but missing in doc:', extraInJson);
    process.exit(1);
  }
  // optional advisory if doc has events not in JSON
  const extraInDoc = Array.from(docEvents).filter(e => !jsonEvents.includes(e));
  if (extraInDoc.length){
    console.log('[taxonomy-consistency] ADVISORY: events in doc not listed in JSON (ok if by design):', extraInDoc);
  }
  console.log('[taxonomy-consistency] PASS: JSON events are subset of canonical doc. Count:', jsonEvents.length);
}

main().catch(e=>{ console.error('[taxonomy-consistency] error', e); process.exit(2); });
