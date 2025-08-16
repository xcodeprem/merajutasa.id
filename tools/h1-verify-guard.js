#!/usr/bin/env node
import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import http from 'http';

function runNode(script, env){
  return new Promise((resolve,reject)=>{
    const child = spawn(process.execPath, [script], { env: { ...process.env, ...env }, stdio:'inherit' });
    child.on('exit', code=> code===0? resolve(): reject(new Error(`${script} exited ${code}`)) );
  });
}

async function read(path){ try { return JSON.parse(await fs.readFile(path,'utf8')); } catch { return null; } }

async function main(){
  await runNode('tools/fairness-sim.js');
  await runNode('tools/fairness/generate-equity-snapshots.js');
  await runNode('tools/derive-under-served-list.js');
  await runNode('tools/equity-anomaly-detector.js');
  await runNode('tools/weekly-trend-aggregator.js');
  // Include feedback smoke ingestion to surface feedback metrics in H1 KPI
  await runNode('tools/feedback-smoke.js');
  await runNode('tools/generate-h1-kpi-summary.js');
  // Start equity service for perf/a11y checks
  const port = Number(process.env.EQUITY_PORT || 4620);
  let svc = spawn(process.execPath, ['tools/services/equity.js'], { env: { ...process.env, EQUITY_PORT: String(port) }, stdio:['ignore','pipe','pipe'] });
  let svcExited = false;
  svc.on('exit', (code, sig)=>{ svcExited = true; console.warn(`[h1-guard] equity service exited early code=${code} sig=${sig||''}`); });
  // Wait for either "listening" log or healthy /health response, up to ~20s
  const started = Date.now();
  let ready = false;
  const waitLog = new Promise((resolve)=>{
    const t = setTimeout(()=> resolve(false), 5000);
    svc.stdout.on('data', d=>{ if (String(d).includes('listening')) { clearTimeout(t); resolve(true); }});
  });
  const waitHealth = (async ()=>{
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/health`, { method: 'GET' });
        if (res.ok) return true;
      } catch {}
      await new Promise(r=> setTimeout(r, 500));
    }
    return false;
  })();
  ready = (await Promise.race([waitLog, waitHealth])) || (await waitHealth);
  if (!ready) {
    console.error(`[h1-guard] equity service not ready after ${Math.round((Date.now()-started)/1000)}s`);
    throw new Error('equity service not ready');
  }
  try {
    try {
      await runNode('tools/perf-budget-smoke.js');
    } catch (e) {
      const actor = (process.env.GITHUB_ACTOR||'').toLowerCase();
      const evt = (process.env.GITHUB_EVENT_NAME||'').toLowerCase();
      const headRef = (process.env.PR_HEAD_REF||'').toLowerCase();
      const ghHeadRef = (process.env.GITHUB_HEAD_REF||'').toLowerCase();
      const refName = (process.env.GITHUB_REF_NAME || process.env.GITHUB_REF || '').toLowerCase();
      const perfAdvisory = String(process.env.PERF_ADVISORY||'').toLowerCase() === 'true';
      const isDependabot = actor.includes('dependabot');
      const isPRLike = evt === 'pull_request' || evt === 'pull_request_target';
      const isDependabotBranch = [headRef, ghHeadRef, refName].some(r => r && (r.startsWith('dependabot/') || r.includes('/dependabot/')));
      if (perfAdvisory || (isDependabot && isPRLike) || isDependabotBranch) {
        console.warn(`[h1-guard] perf-budget failed (${e?.message||'error'}) but treated as ADVISORY. ctx actor=${actor} evt=${evt} headRef=${headRef||ghHeadRef||refName}`);
      } else {
        throw e;
      }
    }
    // Re-check health and auto-restart once if needed before a11y
    const check = ()=> new Promise((resolve)=>{
      const req = http.get({ hostname:'127.0.0.1', port, path:'/health', timeout:1500 }, res=>{ res.resume(); resolve(res.statusCode && res.statusCode<500); });
      req.on('error', ()=> resolve(false));
      req.on('timeout', ()=> { req.destroy(); resolve(false); });
    });
    let ok = await check();
    if (!ok || svcExited) {
      console.warn('[h1-guard] equity health not OK before a11y; restarting service once');
      try { svc.kill('SIGKILL'); } catch {}
      await new Promise(r=> setTimeout(r, 250));
      svcExited = false;
      svc = spawn(process.execPath, ['tools/services/equity.js'], { env: { ...process.env, EQUITY_PORT: String(port) }, stdio:['ignore','pipe','pipe'] });
      // wait up to 5s again
      const t0 = Date.now();
      ok = false;
      while(Date.now()-t0 < 5000){ ok = await check(); if (ok) break; await new Promise(r=> setTimeout(r,200)); }
      if (!ok) throw new Error('equity service not healthy after restart');
    }
    await runNode('tools/a11y-smoke.js');
  } finally {
    try { svc.kill('SIGKILL'); } catch {}
  }
  const fairness = await read('artifacts/fairness-sim-report.json');
  if (!fairness || fairness.scenarios_pass !== fairness.scenarios_total){
    console.error('[h1-guard] FAIL: fairness sim not 100%');
    process.exit(1);
  }
  console.log('[h1-guard] PASS');
}

main().catch(e=>{ console.error('[h1-guard] error', e); process.exit(1); });
