#!/usr/bin/env node
/**
 * query-seeds.js
 * Minimal raw counts for landing sessions & hero interactions using collector /stats.
 * Writes artifacts/query-seeds.json
 */
import { promises as fs } from 'fs';

const BASE = process.env.COLLECTOR_BASE || 'http://127.0.0.1:4603';

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  let stats = { total:0, byEvent:{} };
  try {
    const res = await fetch(`${BASE}/stats`);
    if (res.ok) {stats = await res.json();}
  } catch {}
  // Align with canonical taxonomy: count landing impressions and a key hero interaction
  const landing = (stats.byEvent?.pub_landing_impression) || 0;
  const hero = (stats.byEvent?.pub_hero_card_cta_click) || (stats.byEvent?.pub_hero_view) || 0;
  const out = { version:1, generated_utc: new Date().toISOString(), total_events: stats.total||0, landing_sessions: landing, hero_interactions: hero };
  await fs.writeFile('artifacts/query-seeds.json', JSON.stringify(out,null,2));
  console.log('[query-seeds] landing_sessions=', landing, 'hero_interactions=', hero);
}

main().catch(e=>{ console.error('[query-seeds] error', e); process.exit(2); });
