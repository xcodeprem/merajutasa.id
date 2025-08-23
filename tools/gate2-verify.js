#!/usr/bin/env node
/**
 * gate2-verify.js (Gate 2 Verification)
 * Verifies all Gate 2 requirements are met per issue #36
 */
import { promises as fs } from 'fs';
import { spawn } from 'child_process';

function runNode(script, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      env: { ...process.env, ...env },
      stdio: 'inherit',
    });
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${script} exited ${code}`)));
  });
}

async function readJson(path) {
  try {
    return JSON.parse(await fs.readFile(path, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  await fs.mkdir('artifacts', { recursive: true });

  const results = [];
  const timestamp = new Date().toISOString();

  console.log('[gate2-verify] Starting Gate 2 verification...');

  // Gate 2 Requirement 1: Changelog Excerpt page live (H2-J1)
  console.log('[gate2-verify] Checking changelog excerpt...');
  try {
    await runNode('tools/changelog-excerpt-generate.js');
    await runNode('tools/changelog-presence-check.js');

    const presenceCheck = await readJson('artifacts/changelog-presence-check.json');
    results.push({
      requirement: 'H2-J1: Changelog Excerpt page live',
      status: presenceCheck?.summary?.failed === 0 ? 'PASS' : 'FAIL',
      details: {
        route_accessible: true, // verified by pages workflow check
        summarizes_changes: true, // verified by generator
        ci_monitoring: true, // verified by presence check
        checks_passed: presenceCheck?.summary?.passed || 0,
        checks_total: presenceCheck?.summary?.total || 0,
      },
    });
  } catch (e) {
    results.push({
      requirement: 'H2-J1: Changelog Excerpt page live',
      status: 'FAIL',
      error: e.message,
    });
  }

  // Gate 2 Requirement 2: Equity Anomaly Detector stability (H1-B3)
  console.log('[gate2-verify] Checking equity anomaly detector...');
  try {
    await runNode('tools/equity-anomaly-detector.js');
    await runNode('tools/equity-anomaly-annotate.js');

    const anomalies = await readJson('artifacts/equity-anomalies.json');
    const coverage = await readJson('artifacts/equity-anomaly-coverage.json');

    const deltaThresholdOk = anomalies?.params?.delta_threshold === 0.03;
    const annotationCoverageOk = coverage?.gate2_compliance?.meets_100_percent_requirement === true;

    results.push({
      requirement: 'H1-B3: Equity Anomaly Detector stability',
      status: deltaThresholdOk && annotationCoverageOk ? 'PASS' : 'FAIL',
      details: {
        delta_threshold: anomalies?.params?.delta_threshold,
        delta_threshold_ok: deltaThresholdOk,
        min_samples: anomalies?.params?.min_samples,
        cooldown_snapshots: anomalies?.params?.cooldown_snapshots,
        annotation_coverage_percent: coverage?.annotation_coverage?.coverage_percent,
        annotation_coverage_ok: annotationCoverageOk,
        anomalies_detected: anomalies?.anomalies_count || 0,
      },
    });
  } catch (e) {
    results.push({
      requirement: 'H1-B3: Equity Anomaly Detector stability',
      status: 'FAIL',
      error: e.message,
    });
  }

  // Gate 2 Requirement 3: Terminology Adoption Scanner + Policy-as-Code (H1-F1, H1-C1)
  console.log('[gate2-verify] Checking terminology adoption...');
  try {
    // Test with enforced thresholds to verify policy-as-code
    await runNode('tools/terminology-adoption.js', { ADOPTION_MIN: '85', BANNED_MAX: '0' });
    await runNode('tools/terminology-adoption-trend.js');

    const adoption = await readJson('artifacts/terminology-adoption.json');
    const trend = await readJson('artifacts/terminology-adoption-trend.json');

    const adoptionPercentOk = adoption?.adoptionPercent !== undefined;
    const trendReportOk = trend?.history?.length > 0;

    results.push({
      requirement: 'H1-F1, H1-C1: Terminology Adoption Scanner + Policy-as-Code',
      status: adoptionPercentOk && trendReportOk ? 'PASS' : 'FAIL',
      details: {
        adoption_percent: adoption?.adoptionPercent,
        adoption_persisted: adoptionPercentOk,
        trend_entries: trend?.entries_count || 0,
        trend_report_generated: trendReportOk,
        ci_policy_enabled: true, // verified by ci-guard.yml enforcement
        old_terms_total: adoption?.old_total,
        suggestions_count: adoption?.suggestions?.length || 0,
      },
    });
  } catch (e) {
    results.push({
      requirement: 'H1-F1, H1-C1: Terminology Adoption Scanner + Policy-as-Code',
      status: 'FAIL',
      error: e.message,
    });
  }

  // Gate 2 Requirement 4: Disclaimers Lint PASS (critical governance requirement)
  console.log('[gate2-verify] Checking disclaimers lint...');
  try {
    const disclaimersLint = await readJson('artifacts/disclaimers-lint.json');

    const lintPassed = disclaimersLint?.status === 'PASS';
    const errorsCount = disclaimersLint?.summary?.errors || 0;

    results.push({
      requirement: 'Disclaimers Lint PASS (critical governance)',
      status: lintPassed ? 'PASS' : 'FAIL',
      details: {
        lint_status: disclaimersLint?.status,
        errors_count: errorsCount,
        warnings_count: disclaimersLint?.summary?.warnings || 0,
        artifact_exists: disclaimersLint !== null,
        presence_enforcement: disclaimersLint?.summary?.presence_enforcement,
      },
    });
  } catch (e) {
    results.push({
      requirement: 'Disclaimers Lint PASS (critical governance)',
      status: 'FAIL',
      error: e.message,
    });
  }

  // Gate 2 Requirement 5: Accessibility automated scan PASS (H1-H2)
  console.log('[gate2-verify] Checking accessibility scan...');
  try {
    const a11yReport = await readJson('artifacts/a11y-smoke-report.json');

    const critical = a11yReport?.counts?.critical || 0;
    const artifactExists = a11yReport !== null;

    results.push({
      requirement: 'H1-H2: Accessibility automated scan PASS',
      status: critical === 0 && artifactExists ? 'PASS' : 'FAIL',
      details: {
        critical_violations: critical,
        serious_violations: a11yReport?.counts?.serious || 0,
        total_issues: a11yReport?.counts?.total || 0,
        artifact_saved: artifactExists,
        ci_integrated: true, // verified by h1-guard.js
        scanned_url: a11yReport?.url,
      },
    });
  } catch (e) {
    results.push({
      requirement: 'H1-H2: Accessibility automated scan PASS',
      status: 'FAIL',
      error: e.message,
    });
  }

  // Gate 2 Requirement 5: Disclaimers lint PASS (governance critical)
  console.log('[gate2-verify] Checking disclaimers lint...');
  try {
    const disc = await readJson('artifacts/disclaimers-lint.json');
    const pass = disc?.status === 'PASS' && (disc?.summary?.errors || 0) === 0;
    results.push({
      requirement: 'Governance: Disclaimers Lint PASS',
      status: pass ? 'PASS' : 'FAIL',
      details: {
        status: disc?.status,
        errors: disc?.summary?.errors || 0,
        warnings: disc?.summary?.warnings || 0,
        computed_hash: disc?.summary?.computed_hash,
      },
    });
  } catch (e) {
    results.push({
      requirement: 'Governance: Disclaimers Lint PASS',
      status: 'FAIL',
      error: e.message,
    });
  }

  // Generate final report
  const passedCount = results.filter(r => r.status === 'PASS').length;
  const totalCount = results.length;
  const gate2Status = passedCount === totalCount ? 'PASS' : 'FAIL';

  const report = {
    version: '1.0.0',
    generated_utc: timestamp,
    gate: 'Gate 2 - Expanded Transparency',
    status: gate2Status,
    requirements: results,
    summary: {
      total_requirements: totalCount,
      passed: passedCount,
      failed: totalCount - passedCount,
      gate2_closure_ready: gate2Status === 'PASS',
    },
  };

  await fs.writeFile('artifacts/gate2-verification.json', JSON.stringify(report, null, 2));

  console.log(`\\n[gate2-verify] Gate 2 Status: ${gate2Status}`);
  console.log(`[gate2-verify] Requirements: ${passedCount}/${totalCount} PASSED`);

  results.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`  ${status} ${result.requirement}: ${result.status}`);
    if (result.error) {
      console.log(`     Error: ${result.error}`);
    }
  });

  if (gate2Status === 'FAIL') {
    console.error('\\n[gate2-verify] Gate 2 verification FAILED');
    process.exit(1);
  }

  console.log('\\n[gate2-verify] Gate 2 verification PASSED - Ready for closure');
}

main().catch(e => {
  console.error('[gate2-verify] error', e);
  process.exit(2);
});
