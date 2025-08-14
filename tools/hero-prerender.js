#!/usr/bin/env node
/**
 * hero-prerender.js
 * Minimal SSR-like snapshot for the hero module. Produces artifacts/hero-snapshot.json
 * Pulls equity summary and a couple of governance artifacts to embed as a static payload.
 */
import { promises as fs } from 'fs';

async function safeReadJson(p){ try{ return JSON.parse(await fs.readFile(p,'utf8')); }catch{ return null; } }

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const equity = await safeReadJson('artifacts/equity-summary.json');
  const gv = await safeReadJson('artifacts/governance-verify-summary.json');
  const payload = {
    version: 1,
    generated_utc: new Date().toISOString(),
    equity: equity ? { equity_index: equity.equity_index, buckets: equity.buckets, ts: equity.generated_utc } : null,
    governance: gv ? { param_mismatches: gv.summary?.param_mismatches ?? 0, disclaimers_status: gv.summary?.disclaimers_status ?? 'unknown' } : null,
    hero_copy: {
      title: 'MerajutASA',
      subtitle: 'Transparansi & Keadilan—tanpa ranking',
      badges: [ 'Decision Pending', 'Privacy-Aware' ]
    }
  };
  await fs.writeFile('artifacts/hero-snapshot.json', JSON.stringify(payload, null, 2));
  console.log('[hero-prerender] wrote artifacts/hero-snapshot.json');
}

main().catch(e=>{ console.error('[hero-prerender] error', e); process.exit(2); });
