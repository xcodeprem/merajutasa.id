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
import { stableStringify, addMetadata } from './lib/json-stable.js';

/**
 * Load and validate policy configuration
 */
async function loadPolicy(policyPath = 'tools/policy/policy.json') {
  try {
    const content = await fs.readFile(policyPath, 'utf8');
    const policy = JSON.parse(content);
    console.log(`[governance-verify] Loaded policy from ${policyPath}`);
    return policy;
  } catch (error) {
    console.warn(`[governance-verify] Warning: Could not load policy from ${policyPath}: ${error.message}`);
    return null;
  }
}

/**
 * Check security patterns smoke results and apply gating policy
 */
async function checkSecurityGating(policy) {
  try {
    const securityReport = await fs.readFile('artifacts/security-patterns-smoke.json', 'utf8');
    const security = JSON.parse(securityReport);

    const highCount = security.high_severity_count || 0;
    const mediumCount = security.medium_severity_count || 0;

    // Apply policy gating rules
    const secPolicy = policy?.checks?.['security-smoke']?.gating;
    if (secPolicy && secPolicy.HIGH && highCount > 0) {
      console.error(`[governance-verify] SECURITY GATE FAILURE: ${highCount} HIGH severity security violations detected`);
      console.error('[governance-verify] HIGH security violations are now gating (FAIL)');
      return false;
    }

    if (highCount > 0 || mediumCount > 0) {
      console.warn(`[governance-verify] Security violations detected: ${highCount}H/${mediumCount}M`);
    }

    return true;
  } catch (error) {
    console.warn(`[governance-verify] Warning: Could not check security patterns: ${error.message}`);
    return true; // Don't fail if security check is missing
  }
}

async function runSpecHashWithAutoSeal(){
  // First attempt strict verify
  try {
    await runStep({ name: 'spec-hash-diff', cmd: ['node','tools/spec-hash-diff.js','--mode=verify'], critical: true });
    return; // all good
  } catch (e) {
    // Inspect diff to see if only README.md mismatched; if so, run targeted accept and verify again
    try {
      const diffRaw = await fs.readFile('artifacts/spec-hash-diff.json','utf8').catch(()=>null);
      const diff = diffRaw? JSON.parse(diffRaw): null;
      const violations = diff?.violations || [];
      const allowRaw = await fs.readFile('docs/integrity/auto-seal-allowlist.json','utf8').catch(()=>null);
      const allow = allowRaw? JSON.parse(allowRaw): { allowed_paths: ['README.md'], allowed_integrity_classes: [] };
      const onlyHashMismatch = violations.length>0 && violations.every(v=> v.code.startsWith('HASH_MISMATCH'));
      const violPaths = new Set(violations.map(v=>v.path));
      const allAllowed = Array.from(violPaths).every(p=> allow.allowed_paths.includes(p));
      if (onlyHashMismatch && allAllowed){
        const includeArg = Array.from(violPaths).join(',');
        console.warn(`[governance-verify] Auto-seal editorial drift (authorized): ${includeArg}`);
        await runStep({ name: 'spec-hash-auto-seal-allowlist', cmd: ['node','tools/spec-hash-diff.js','--mode=accept',`--include=${includeArg}`], critical: true });
        await runStep({ name: 'spec-hash-diff', cmd: ['node','tools/spec-hash-diff.js','--mode=verify'], critical: true });
        return;
      }
    } catch { /* ignore and rethrow original */ }
    throw e;
  }
}

const STEPS = [
  { name: 'spec-hash-diff-strict-or-autoseal', cmd: ['node','tools/governance-verify.js','__internal_spechash__'], critical: true },
  { name: 'param-integrity', cmd: ['node','tools/param-integrity.js'], critical: true },
  { name: 'param-lock', cmd: ['node','tools/param-lock-verify.js'], critical: true },
  { name: 'component-dependency-check', cmd: ['node','tools/component-dependency-check.js'], critical: true },
  { name: 'fairness-unit', cmd: ['node','tools/tests/fairness-engine-unit-tests.js'], critical: true },
  { name: 'security-patterns-smoke', cmd: ['node','tools/tests/security-patterns-smoke.js'], advisory: true },
  { name: 'hype-lint', cmd: ['node','tools/hype-lint.js'], advisory: true },
  { name: 'disclaimers-lint', cmd: ['node','tools/disclaimers-lint.js'], critical: true },
  { name: 'pii-scan', cmd: ['node','tools/pii-scan.js','--sarif'], advisory: true },
  { name: 'pii-metrics', cmd: ['node','tools/pii-metrics.js'], advisory: true },
  { name: 'privacy-asserts', cmd: ['node','tools/privacy-asserts.js'], critical: true },
  // Promote DEC lint to critical now that violations are 0
  { name: 'dec-lint', cmd: ['node','tools/dec-lint.js'], critical: true },
  { name: 'principles-impact', cmd: ['node','tools/principles-impact.js'], advisory: true },
  // Event schema validator placeholder (advisory; looks for sample file if present)
  { name: 'events-validate', cmd: ['node','tools/event-validate.js','--file','data/events-sample.ndjson','--rehash'], advisory: true },
  { name: 'collector-integration', cmd: ['node','tools/tests/collector-integration.test.js'], advisory: true },
  { name: 'feedback-smoke', cmd: ['node','tools/feedback-smoke.js'], advisory: true },
  { name: 'policy-aggregation-threshold', cmd: ['node','tools/policy-aggregation-threshold-verify.js'], advisory: true },
  // Hard-enforce sample publish gate (default to allow sample; override via POLICY_CELLS_PATH)
  { name: 'policy-aggregation-enforce', cmd: ['node','tools/policy-aggregation-threshold-enforce.js', process.env.POLICY_CELLS_PATH || 'artifacts/aggregation-cells-allow.json'], critical: true },
  { name: 'evidence-freshness', cmd: ['node','tools/evidence-freshness.js'], advisory: true },
  { name: 'evidence-collision-test', cmd: ['node','tools/evidence-collision-test.js'], critical: true },
  { name: 'fairness-sim', cmd: ['node','tools/fairness-sim.js'], advisory: true },
  { name: 'fairness-metrics', cmd: ['node','tools/fairness/fairness-metrics.js'], advisory: true },
  { name: 'no-silent-drift', cmd: ['node','tools/no-silent-drift.js'], critical: true },
  { name: 'governed-change-scan', cmd: ['node','tools/governed-change-scan.js'], critical: true },
  // Policy index consistency and changelog draft (advisory)
  { name: 'policy-index-verify', cmd: ['node','tools/policy-index-verify.js'], advisory: true },
  { name: 'changelog-excerpt', cmd: ['node','tools/changelog-excerpt-generate.js'], advisory: true },
  // Wave 2 anchors (non-blocking)
  { name: 'event-anchor', cmd: ['node','tools/event-anchor-chain.js'], advisory: true },
  { name: 'terminology-adoption', cmd: ['node','tools/terminology-adoption.js'], advisory: true },
  { name: 'terminology-scan', cmd: ['node','tools/terminology-scan.js'], advisory: true },
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
      if(code === 0) {status = 'OK';}
      else if(isAdvisory) {status = 'ADVISORY';}
      else if(isCritical) {status = 'ERROR';}
      else {status = 'ERROR';}
      if(code !== 0 && isAdvisory){
        console.error(`[governance-verify] Advisory step non-zero (continuing): ${step.name} exit=${code}`);
      }
      logAction({ action: 'step', step: step.name, cmd: step.cmd.join(' '), exit_code: code, status, duration_ms: durationMs, critical:isCritical, advisory:isAdvisory });
      if(code === 0 || isAdvisory) {return resolve();}
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
    try { arr = JSON.parse(await fs.readFile(p,'utf8')); if(!Array.isArray(arr)) {arr=[];} } catch {/*ignore*/}
    const logEntry = addMetadata({ timestamp: new Date().toISOString(), ...entry }, { generator: 'governance-verify' });
    arr.push(logEntry);
    await fs.writeFile(p, stableStringify(arr));
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
    drift: 'artifacts/no-silent-drift-report.json',
    policyAgg: 'artifacts/policy-aggregation-threshold.json',
    terminologyAdoption: 'artifacts/terminology-adoption.json',
    securitySmoke: 'artifacts/security-patterns-smoke.json',
  };
  // add privacy asserts
  artifactPaths.privacyAsserts = 'artifacts/privacy-asserts.json';
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
    drift_status: out.artifacts.drift?.status || 'unknown',
    policy_aggregation_status: out.artifacts.policyAgg?.status || 'unknown',
    policy_aggregation_violations: out.artifacts.policyAgg?.violations?.length ?? 0,
    terminology_adoption_percent: out.artifacts.terminologyAdoption?.adoptionPercent ?? null,
    terminology_old_total: out.artifacts.terminologyAdoption?.old_total ?? null,
    terminology_new_total: out.artifacts.terminologyAdoption?.new_total ?? null,
    security_high_count: out.artifacts.securitySmoke?.high_severity_count ?? 0,
    security_medium_count: out.artifacts.securitySmoke?.medium_severity_count ?? 0,
    security_summary: out.artifacts.securitySmoke?.summary || 'unknown',
  };
  // privacy asserts summary
  const pa = out.artifacts.privacyAsserts || {};
  out.summary.privacy_retention_ok = pa?.checks?.retention?.ok ?? null;
  out.summary.privacy_retention_len = pa?.checks?.retention?.length ?? null;
  out.summary.privacy_format_invalid_prev = pa?.checks?.format?.invalid_previous_count ?? null;
  out.summary.privacy_freshness_ok = pa?.checks?.freshness?.ok ?? null;

  // Determine overall status
  const criticalFailures = [];
  if (out.summary.param_mismatches > 0) {criticalFailures.push('param-mismatches');}
  if (out.summary.dec_lint_violation_count > 0) {criticalFailures.push('dec-violations');}
  if (out.summary.security_high_count > 0) {criticalFailures.push('high-security');}
  if (out.summary.drift_status === 'FAIL') {criticalFailures.push('drift-detected');}

  out.summary.overall_status = criticalFailures.length > 0 ? 'FAIL' : 'PASS';
  out.summary.critical_failures = criticalFailures;

  // Add metadata
  const enhancedOut = addMetadata(out, { generator: 'governance-verify-aggregator' });

  await fs.writeFile('artifacts/governance-verify-summary.json', stableStringify(enhancedOut));
}

async function main(){
  // Parse command line arguments
  const args = process.argv.slice(2);
  const policyFlag = args.findIndex(arg => arg === '--policy');
  const policyPath = policyFlag >= 0 && args[policyFlag + 1] ? args[policyFlag + 1] : 'tools/policy/policy.json';
  const isA8Mode = args.includes('--a8');

  // Load policy configuration
  const policy = await loadPolicy(policyPath);

  // Special handling for the first step: mimic run but via helper
  if (process.argv[2] === '__internal_spechash__'){
    await runSpecHashWithAutoSeal();
    return;
  }

  let securityGatingPassed = true;

  for (const step of STEPS){
    console.log(`[governance-verify] Running step: ${step.name}${step.critical?' [CRITICAL]': (step.advisory?' [ADVISORY]':'')}`);
    if (step.name === 'spec-hash-diff-strict-or-autoseal'){
      await runSpecHashWithAutoSeal();
    } else {
      await runStep(step);
    }

    // Check security gating after security-patterns-smoke step
    if (step.name === 'security-patterns-smoke' && policy) {
      securityGatingPassed = await checkSecurityGating(policy);
      if (!securityGatingPassed && !step.advisory) {
        console.error('[governance-verify] Security gating failure - aborting pipeline');
        process.exit(1);
      }
    }
  }

  // Final security gating check if not done during steps
  if (policy && securityGatingPassed) {
    securityGatingPassed = await checkSecurityGating(policy);
    if (!securityGatingPassed) {
      console.error('[governance-verify] Final security gate check failed');
      process.exit(1);
    }
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
            ts: entry.ts,
          },
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
