#!/usr/bin/env node
/**
 * governance-verify.js
 * Orchestrates baseline governance checks: spec-hash-diff (report-only), param-integrity, hype-lint, principles-impact, no-silent-drift aggregation.
 * Phase: pre-seal baseline (Wave 0).
 */
import { spawn } from 'child_process';
import { promises as fs } from 'fs';

const STEPS = [
  { name: 'spec-hash-diff', cmd: ['node','tools/spec-hash-diff.js','--mode=report-only'] },
  { name: 'param-integrity', cmd: ['node','tools/param-integrity.js'] },
  { name: 'hype-lint', cmd: ['node','tools/hype-lint.js'] },
  { name: 'disclaimers-lint', cmd: ['node','tools/disclaimers-lint.js'] },
  { name: 'principles-impact', cmd: ['node','tools/principles-impact.js'] },
  { name: 'evidence-freshness', cmd: ['node','tools/evidence-freshness.js'] },
  { name: 'no-silent-drift', cmd: ['node','tools/no-silent-drift.js'] }
];

async function runStep(step){
  return new Promise((resolve,reject)=>{
    const child = spawn(step.cmd[0], step.cmd.slice(1), { stdio: 'inherit' });
    child.on('exit', code => {
      if (code === 0) return resolve();
      // Wave 0: allow spec-hash-diff non-zero (advisory) to proceed
      if (step.name === 'spec-hash-diff') {
        console.error(`[governance-verify] Continuing despite non-zero exit from ${step.name} (advisory mode)`);
        return resolve();
      }
      reject(new Error(`${step.name} exited with code ${code}`));
    });
  });
}

async function aggregate(){
  const artifactPaths = {
    specHash: 'artifacts/spec-hash-diff.json',
    params: 'artifacts/param-integrity-matrix.json',
    hype: 'artifacts/hype-lint.json',
    disclaimers: 'artifacts/disclaimers-lint.json',
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
    drift_status: out.artifacts.drift?.status || 'unknown'
  };
  await fs.writeFile('artifacts/governance-verify-summary.json', JSON.stringify(out,null,2));
}

async function main(){
  for (const step of STEPS){
    console.log(`[governance-verify] Running step: ${step.name}`);
    await runStep(step);
  }
  await aggregate();
  console.log('[governance-verify] Completed. See artifacts/governance-verify-summary.json');
}

main().catch(e=>{ console.error('governance-verify failed', e); process.exit(2); });