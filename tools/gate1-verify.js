#!/usr/bin/env node
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

function run(cmd, args = [], opts = {}){
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(cmd, args, { stdio: 'inherit', ...opts });
    child.on('exit', (code) => resolve({ code, ms: Date.now() - started }));
  });
}

async function runNode(script, env) {
  return run(process.execPath, [script], { env: { ...process.env, ...env } });
}

async function signerChainCheck() {
  // Start signer and chain, append once, verify
  const signer = spawn(process.execPath, ['tools/services/signer.js'], { stdio: 'ignore', env: { ...process.env, SIGNER_PORT: String(process.env.SIGNER_PORT || 4601) } });
  const chain = spawn(process.execPath, ['tools/services/chain.js'], { stdio: 'ignore', env: { ...process.env, CHAIN_PORT: String(process.env.CHAIN_PORT || 4602) } });
  // Small wait for services
  await new Promise((r) => setTimeout(r, 800));
  try {
    const append = await runNode('tools/chain-append-from-signer.js');
    const verify = await fetch(`http://127.0.0.1:${process.env.CHAIN_PORT || 4602}/verify`, { method: 'POST' }).then(r => r.json()).catch(() => ({ ok: false }));
    const ok = append.code === 0 && verify && verify.ok === true;
    return { ok, append_code: append.code, verify_ok: !!verify?.ok, length: verify?.length ?? null };
  } catch {
    return { ok: false };
  } finally {
    try { signer.kill('SIGKILL'); } catch {}
    try { chain.kill('SIGKILL'); } catch {}
  }
}

async function main() {
  await fs.mkdir('artifacts', { recursive: true });
  const results = {};
  results.governance = await runNode('tools/governance-verify.js');
  results.h1_guard = await runNode('tools/h1-verify-guard.js');
  // Collector reliability strict (default threshold 98, non-advisory)
  results.collector_reliability = await runNode('tools/collector-reliability-smoke.js');
  results.signer_chain = await signerChainCheck();

  // Merge perf/a11y summaries into governance-verify summary for a single-pane view
  try {
    const govPath = 'artifacts/governance-verify-summary.json';
    const perfPath = 'artifacts/perf-budget-report.json';
    const a11yPath = 'artifacts/a11y-smoke-report.json';
    const exists = async (p)=> !!(await fs.stat(p).catch(()=>null));
    if (await exists(govPath)){
      const gov = JSON.parse(await fs.readFile(govPath,'utf8'));
      const out = { ...gov };
      out.summary = out.summary || {};
      // Perf summary
      if (await exists(perfPath)){
        const perf = JSON.parse(await fs.readFile(perfPath,'utf8'));
        out.artifacts = out.artifacts || {};
        out.artifacts.perf = perf;
        const a = perf.actual || {};
        const b = perf.budgets || {};
        const perfViol = [];
        if (typeof a.perf_score === 'number' && typeof b.perf_score_min === 'number' && a.perf_score < b.perf_score_min) perfViol.push('PERF_SCORE');
        if (typeof a.lcp_ms === 'number' && typeof b.lcp_ms === 'number' && a.lcp_ms > b.lcp_ms) perfViol.push('LCP');
        if (typeof a.tbt_ms === 'number' && typeof b.tbt_ms === 'number' && a.tbt_ms > b.tbt_ms) perfViol.push('TBT');
        if (typeof a.cls === 'number' && typeof b.cls_max === 'number' && a.cls > b.cls_max) perfViol.push('CLS');
        out.summary.perf = {
          url: perf.url,
          actual: a,
          budgets: b,
          pass: perfViol.length === 0,
          violations: perfViol
        };
      }
      // A11y summary
      if (await exists(a11yPath)){
        const a11y = JSON.parse(await fs.readFile(a11yPath,'utf8'));
        out.artifacts = out.artifacts || {};
        out.artifacts.a11y = a11y;
        const counts = a11y.counts || {};
        out.summary.a11y = {
          url: a11y.url,
          counts,
          pass: (counts.serious ?? 0) === 0
        };
      }
      await fs.writeFile(govPath, JSON.stringify(out,null,2));
    }
  } catch (e) {
    console.warn('[gate1] WARN could not merge perf/a11y into governance summary:', e.message);
  }

  const pass = results.governance.code === 0 && results.h1_guard.code === 0 && results.collector_reliability.code === 0 && results.signer_chain.ok;
  const report = {
    version: 1,
    timestamp_utc: new Date().toISOString(),
    pass,
    criteria: {
      governance_verify_pass: results.governance.code === 0,
      h1_guard_pass: results.h1_guard.code === 0,
      collector_reliability_pass: results.collector_reliability.code === 0,
      signer_chain_append_and_verify_pass: results.signer_chain.ok
    },
    details: results
  };
  await fs.writeFile('artifacts/gate1-report.json', JSON.stringify(report, null, 2));
  if (!pass) {
    console.error('[gate1] FAIL — see artifacts/gate1-report.json');
    process.exit(2);
  }
  console.log('[gate1] PASS — Gate 1 closed. See artifacts/gate1-report.json');
}

main().catch(e => { console.error('[gate1] error', e); process.exit(2); });
