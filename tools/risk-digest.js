#!/usr/bin/env node
/**
 * risk-digest.js
 * Aggregates reliability and risk signals into a compact digest for UI.
 * Inputs (optional):
 * - artifacts/collector-reliability.json
 * - artifacts/chain-monitor.json
 * - artifacts/pii-scan-report.json
 * Output:
 * - artifacts/risk-digest.json
 */
import { promises as fs } from 'fs';

async function safeJson(p){ try { return JSON.parse(await fs.readFile(p,'utf8')); } catch { return null; } }

function pct(n){ if (n==null || isNaN(n)) return null; return Math.round(n*1000)/10; }

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const [reliab, chain, pii] = await Promise.all([
    safeJson('artifacts/collector-reliability.json'),
    safeJson('artifacts/chain-monitor.json'),
    safeJson('artifacts/pii-scan-report.json')
  ]);
  const digest = {
    ts: new Date().toISOString(),
    collector: {
      success_rate_pct: reliab?.success_rate_pct ?? (reliab?.success_rate != null ? pct(reliab.success_rate) : null),
      total_events: reliab?.total_events ?? null,
      status: reliab?.status ?? (reliab?.success_rate >= 0.98 ? 'PASS' : (reliab?.success_rate != null ? 'WARN' : 'N/A'))
    },
    chain: {
      mismatches: chain?.mismatches ?? 0,
      last_seq: chain?.last_seq ?? null,
      status: chain?.mismatches > 0 ? 'WARN' : (chain ? 'PASS' : 'N/A')
    },
    privacy: {
      pii_high_risk_hits: pii?.summary?.highRiskHits ?? null,
      blocks: pii?.summary?.blocks ?? null,
      status: (pii?.summary?.highRiskHits ?? 0) > 0 ? 'WARN' : (pii ? 'PASS' : 'N/A')
    }
  };
  await fs.writeFile('artifacts/risk-digest.json', JSON.stringify(digest, null, 2));
  console.log('[risk-digest] wrote artifacts/risk-digest.json');
}

main().catch(e=>{ console.error('[risk-digest] error', e); process.exit(2); });
