#!/usr/bin/env node
/**
 * governance-verify.js
 * Wave 0 (Enable Seal) orchestration with fail-fast ordering (12.3):
 *  1. spec-hash-diff (verify mode) – CRITICAL (must be clean; no advisory bypass now)
 *  2. param-integrity – CRITICAL (matrix must generate; mismatches will be enforced Wave 1)
 *  3. hype-lint – NON-CRITICAL (advisory only Wave 0)
 *  4. disclaimers-lint – ADVISORY (bootstrap tolerance via DISC_BOOTSTRAP env)
 *  5. principles-impact – NON-CRITICAL (informational baseline)
 *  6. evidence-freshness – NON-CRITICAL (advisory freshness signals)
 *  7. evidence-collision-test – CRITICAL (DB-02 hash prefix uniqueness)
 *  8. no-silent-drift – NON-CRITICAL aggregator (now includes gating matrix)
 *
 * Exit policy (Wave 0): any CRITICAL step non-zero exit -> overall failure; ADVISORY steps allowed to continue.
 */
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const STEPS = [
  { name: 'spec-hash-diff', cmd: ['node','tools/spec-hash-diff.js','--mode=verify'], critical: true },
  { name: 'param-integrity', cmd: ['node','tools/param-integrity.js'], critical: true },
  { name: 'param-lock', cmd: ['node','tools/param-lock-verify.js'], critical: true },
  { name: 'fairness-unit', cmd: ['node','tools/tests/fairness-engine-unit-tests.js'], critical: true },
  { name: 'hype-lint', cmd: ['node','tools/hype-lint.js'], advisory: true },
  { name: 'disclaimers-lint', cmd: ['node','tools/disclaimers-lint.js'], critical: true },
  // Promote DEC lint to critical now that violations are 0
  { name: 'dec-lint', cmd: ['node','tools/dec-lint.js'], critical: true },
  { name: 'principles-impact', cmd: ['node','tools/principles-impact.js'], advisory: true },
  { name: 'evidence-freshness', cmd: ['node','tools/evidence-freshness.js'], advisory: true },
  { name: 'evidence-collision-test', cmd: ['node','tools/evidence-collision-test.js'], critical: true },
  { name: 'fairness-sim', cmd: ['node','tools/fairness-sim.js'], advisory: true },
  { name: 'fairness-metrics', cmd: ['node','tools/fairness/fairness-metrics.js'], advisory: true },
  { name: 'no-silent-drift', cmd: ['node','tools/no-silent-drift.js'], critical: true },
  { name: 'governed-change-scan', cmd: ['node','tools/governed-change-scan.js'], critical: true }
];

async function runStep(step){
  return new Promise((resolve,reject)=>{
    const started = Date.now();
    const child = spawn(step.cmd[0], step.cmd.slice(1), { stdio: 'inherit' });
    child.on('exit', code => {
      const durationMs = Date.now() - started;
      const isAdvisory = !!step.advisory;
      const isCritical = !!step.critical;
      let status;
      if(code === 0) status = 'OK';
      else if(isAdvisory) status = 'ADVISORY';
      else if(isCritical) status = 'ERROR';
      else status = 'ERROR';
      if(code !== 0 && isAdvisory){
        console.error(`[governance-verify] Advisory step non-zero (continuing): ${step.name} exit=${code}`);
      }
      logAction({ action: 'step', step: step.name, cmd: step.cmd.join(' '), exit_code: code, status, duration_ms: durationMs, critical:isCritical, advisory:isAdvisory });
      if(code === 0 || isAdvisory) return resolve();
      reject(new Error(`${step.name} critical failure`));
    });
  });
}

const ACTION_LOG_DIR = 'artifacts';
function currentLogPath(){
  const d = new Date();
  const day = d.toISOString().slice(0,10).replace(/-/g,'');
  return path.join(ACTION_LOG_DIR, `agent-action-log-${day}.json`);
}
async function logAction(entry){
  try {
    await fs.mkdir(ACTION_LOG_DIR,{recursive:true});
    const p = currentLogPath();
    let arr = [];
    try { arr = JSON.parse(await fs.readFile(p,'utf8')); if(!Array.isArray(arr)) arr=[]; } catch {/*ignore*/}
    arr.push({ timestamp: new Date().toISOString(), ...entry });
    await fs.writeFile(p, JSON.stringify(arr,null,2));
  } catch (e){
    console.error('[governance-verify] Failed to write action log', e);
  }
}

async function aggregate(){
  const artifactPaths = {
    specHash: 'artifacts/spec-hash-diff.json',
    params: 'artifacts/param-integrity-matrix.json',
    hype: 'artifacts/hype-lint.json',
    disclaimers: 'artifacts/disclaimers-lint.json',
  decLint: 'artifacts/dec-lint.json',
    principles: 'artifacts/principles-impact-report.json',
    drift: 'artifacts/no-silent-drift-report.json'
  };
  const out = { timestamp: new Date().toISOString(), artifacts: {}, summary: {} };
  for (const [k,p] of Object.entries(artifactPaths)){
    try { out.artifacts[k] = JSON.parse(await fs.readFile(p,'utf8')); }
    catch { out.artifacts[k] = { error: 'missing' }; }
  }
  const paramRows = Array.isArray(out.artifacts.params?.rows)? out.artifacts.params.rows.length : 0;
  out.summary = {
    total_param_checks: paramRows,
    param_mismatches: out.artifacts.params?.mismatches ?? 0,
    hype_hits: out.artifacts.hype?.total_hits ?? 0,
    disclaimers_status: out.artifacts.disclaimers?.status || 'unknown',
  dec_lint_violation_count: out.artifacts.decLint?.summary?.violation_count ?? out.artifacts.decLint?.violations?.length ?? 0,
    drift_status: out.artifacts.drift?.status || 'unknown'
  };
  await fs.writeFile('artifacts/governance-verify-summary.json', JSON.stringify(out,null,2));
}

async function main(){
  for (const step of STEPS){
    console.log(`[governance-verify] Running step: ${step.name}${step.critical?' [CRITICAL]': (step.advisory?' [ADVISORY]':'')}`);
    await runStep(step);
  }
  // Optional: sign and append spec-hash-diff artifact to chain if services are reachable
  try {
    const spec = JSON.parse(await fs.readFile('artifacts/spec-hash-diff.json','utf8'));
    const canonical = JSON.stringify({ mode: spec.mode, updated: spec.updated, summary: spec.summary });
    // Call signer
    const signerRes = await fetch(`http://127.0.0.1:${process.env.SIGNER_PORT||4601}/sign`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ payload: canonical }) });
    if (signerRes.ok){
      const sig = await signerRes.json();
      const chainRes = await fetch(`http://127.0.0.1:${process.env.CHAIN_PORT||4602}/append`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ canonical: sig.canonical, signature: sig.signature, publicKeyPem: (await (await fetch(`http://127.0.0.1:${process.env.SIGNER_PORT||4601}/pubkey`)).json()).publicKeyPem }) });
      if (chainRes.ok) {
        const entry = await chainRes.json();
        await fs.writeFile('artifacts/chain-append-latest.json', JSON.stringify({
          proof_version: 1,
          appended: {
            seq: entry.seq,
            contentHash: entry.contentHash,
            prevHash: entry.prevHash,
            ts: entry.ts
          }
        }, null, 2));
        await logAction({ action:'chain-append', status:'OK', seq: entry.seq, contentHash: entry.contentHash });
      } else {
        await logAction({ action:'chain-append', status:'SKIP', reason:'chain not reachable or append failed' });
      }
    } else {
      await logAction({ action:'sign-artifact', status:'SKIP', reason:'signer not reachable' });
    }
  } catch { /* non-blocking */ }
  await aggregate();
  await logAction({ action: 'aggregate', status: 'OK' });
  console.log('[governance-verify] Completed. See artifacts/governance-verify-summary.json');
}

main().catch(e=>{ console.error('governance-verify failed', e); process.exit(2); });