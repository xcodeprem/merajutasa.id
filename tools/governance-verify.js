#!/usr/bin/env node
/**
 * governance-verify.js
 * Orchestrates baseline governance checks: spec-hash-diff (report-only), param-integrity, hype-lint, principles-impact, no-silent-drift aggregation.
 * Phase: pre-seal baseline (Wave 0).
 */
import { spawn } from 'child_process';
import { promises as fs } from 'fs';

const STEPS = [
  { name: 'spec-hash-diff', cmd: ['node','tools/spec-hash-diff.js','--mode=report-only','--allow-initial-placeholders=true'] },
  { name: 'param-integrity', cmd: ['node','tools/param-integrity.js'] },
  { name: 'hype-lint', cmd: ['node','tools/hype-lint.js'] },
  { name: 'principles-impact', cmd: ['node','tools/principles-impact.js'] },
  { name: 'no-silent-drift', cmd: ['node','tools/no-silent-drift.js'] }
];

async function runStep(step){
  return new Promise((resolve,reject)=>{
    const child = spawn(step.cmd[0], step.cmd.slice(1), { stdio: 'inherit' });
    child.on('exit', code => {
      if (code === 0) return resolve();
      reject(new Error(`${step.name} exited with code ${code}`));
    });
  });
}

async function aggregate(){
  const artifactPaths = {
    specHash: 'artifacts/spec-hash-diff.json',
    params: 'artifacts/param-integrity-matrix.json',
    hype: 'artifacts/hype-lint.json',
    principles: 'artifacts/principles-impact-report.json'
  };
  const out = { timestamp: new Date().toISOString(), artifacts: {}, summary: {} };
  for (const [k,p] of Object.entries(artifactPaths)){
    try { out.artifacts[k] = JSON.parse(await fs.readFile(p,'utf8')); }
    catch { out.artifacts[k] = { error: 'missing' }; }
  }
  out.summary = {
    total_param_checks: Array.isArray(out.artifacts.params)? out.artifacts.params.length : (out.artifacts.params?.length||0),
    hype_hits: out.artifacts.hype?.total_hits ?? 0,
    principles_rows: Array.isArray(out.artifacts.principles)? out.artifacts.principles.length : (out.artifacts.principles?.length||0)
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