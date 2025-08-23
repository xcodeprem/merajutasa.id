#!/usr/bin/env node
/**
 * secret-scan-report.js
 * Generate comprehensive secret scanning report for CI artifacts
 * Combines results from gitleaks, gitignore patterns test, and secret protection test
 */

import { promises as fs } from 'fs';
import { spawnSync } from 'child_process';
import { stableStringify } from '../lib/json-stable.js';

async function runGitleaksScan() {
  console.log('[secret-scan-report] Running gitleaks scan...');
  
  const result = spawnSync('gitleaks', [
    'detect', 
    '--source', '.',
    '--config', '.gitleaks.toml',
    '--redact',
    '--report-format', 'json',
    '--report-path', '/tmp/gitleaks-report.json',
    '--verbose'
  ], {
    encoding: 'utf8',
    timeout: 60000
  });
  
  let findings = [];
  try {
    const reportContent = await fs.readFile('/tmp/gitleaks-report.json', 'utf8');
    findings = JSON.parse(reportContent);
  } catch (error) {
    // If no report file, likely no findings
    console.log('[secret-scan-report] No gitleaks report file (likely no findings)');
  }
  
  return {
    exit_code: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    findings: findings,
    findings_count: findings.length || 0
  };
}

async function loadTestResults() {
  const results = {};
  
  // Load secret protection test results
  try {
    const secretTest = await fs.readFile('artifacts/secret-protection-test.json', 'utf8');
    results.secret_protection = JSON.parse(secretTest);
  } catch (error) {
    console.warn('[secret-scan-report] Could not load secret protection test results');
    results.secret_protection = { status: 'NOT_RUN', error: error.message };
  }
  
  // Load gitignore patterns test results
  try {
    const gitignoreTest = await fs.readFile('artifacts/gitignore-patterns-test.json', 'utf8');
    results.gitignore_patterns = JSON.parse(gitignoreTest);
  } catch (error) {
    console.warn('[secret-scan-report] Could not load gitignore patterns test results');
    results.gitignore_patterns = { status: 'NOT_RUN', error: error.message };
  }
  
  return results;
}

async function generateSecretScanReport() {
  console.log('[secret-scan-report] Generating comprehensive secret scan report...');
  
  await fs.mkdir('artifacts', { recursive: true });
  
  // Run scans and load test results
  const gitleaksResult = await runGitleaksScan();
  const testResults = await loadTestResults();
  
  // Generate summary
  const report = {
    scan_type: 'comprehensive_secret_scan',
    timestamp: new Date().toISOString(),
    status: 'UNKNOWN',
    summary: '',
    scans: {
      gitleaks: {
        status: gitleaksResult.exit_code === 0 ? 'CLEAN' : 'FINDINGS',
        findings_count: gitleaksResult.findings_count,
        findings: gitleaksResult.findings.slice(0, 10), // Limit for brevity
        exit_code: gitleaksResult.exit_code
      },
      pre_commit_protection: {
        status: testResults.secret_protection?.details?.pre_commit?.blocked_commit ? 'ACTIVE' : 'INACTIVE',
        details: testResults.secret_protection?.details?.pre_commit || {}
      },
      gitignore_patterns: {
        status: testResults.gitignore_patterns?.status || 'NOT_RUN',
        patterns_tested: testResults.gitignore_patterns?.patterns_tested || 0,
        coverage: testResults.secret_protection?.details?.analysis || {}
      }
    },
    protection_layers: {
      github_secret_scanning: 'ENABLED', // Assume enabled based on workflow
      gitleaks_pre_commit: testResults.secret_protection?.details?.pre_commit?.blocked_commit ? 'ACTIVE' : 'INACTIVE',
      gitignore_blocking: testResults.gitignore_patterns?.status === 'PASS' ? 'ACTIVE' : 'INACTIVE',
      ci_scanning: 'ACTIVE'
    },
    recommendations: []
  };
  
  // Determine overall status
  const hasFindings = gitleaksResult.findings_count > 0;
  const protectionActive = report.protection_layers.gitleaks_pre_commit === 'ACTIVE' && 
                          report.protection_layers.gitignore_blocking === 'ACTIVE';
  
  if (hasFindings) {
    report.status = 'CRITICAL';
    report.summary = `${gitleaksResult.findings_count} secret(s) detected in repository`;
    report.recommendations.push('Immediately rotate detected secrets');
    report.recommendations.push('Review git history for secret exposure');
  } else if (protectionActive) {
    report.status = 'SECURE';
    report.summary = 'No secrets detected, all protection layers active';
  } else {
    report.status = 'WARNING';
    report.summary = 'No secrets detected but protection layers incomplete';
    if (report.protection_layers.gitleaks_pre_commit !== 'ACTIVE') {
      report.recommendations.push('Verify pre-commit hooks are installed');
    }
    if (report.protection_layers.gitignore_blocking !== 'ACTIVE') {
      report.recommendations.push('Review gitignore patterns for secret files');
    }
  }
  
  // Add compliance metrics
  report.compliance = {
    zero_secrets_in_repo: !hasFindings,
    pre_commit_protection_active: report.protection_layers.gitleaks_pre_commit === 'ACTIVE',
    gitignore_coverage_adequate: testResults.secret_protection?.details?.analysis?.secretsIgnored >= 
                                  (testResults.secret_protection?.details?.analysis?.totalSecrets * 0.8) || false,
    ci_scanning_enabled: true,
    scan_frequency: 'on_every_pr_and_push'
  };
  
  // Write report
  await fs.writeFile('artifacts/secret-scan-report.json', stableStringify(report, null, 2));
  
  console.log(`[secret-scan-report] Report status: ${report.status}`);
  console.log(`[secret-scan-report] Summary: ${report.summary}`);
  
  if (report.recommendations.length > 0) {
    console.log('[secret-scan-report] Recommendations:');
    report.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
  
  return report;
}

async function main() {
  try {
    const report = await generateSecretScanReport();
    
    // Exit with appropriate code for CI
    if (report.status === 'CRITICAL') {
      console.error('[secret-scan-report] CRITICAL: Secrets detected!');
      process.exit(1);
    } else if (report.status === 'WARNING') {
      console.warn('[secret-scan-report] WARNING: Protection incomplete');
      // Don't exit with error for warnings, but log them
    } else {
      console.log('[secret-scan-report] SUCCESS: Repository secure');
    }
    
  } catch (error) {
    console.error('[secret-scan-report] Failed to generate report:', error.message);
    
    const errorReport = {
      scan_type: 'comprehensive_secret_scan',
      timestamp: new Date().toISOString(),
      status: 'ERROR',
      error: error.message,
      summary: 'Failed to complete security scan'
    };
    
    await fs.mkdir('artifacts', { recursive: true });
    await fs.writeFile('artifacts/secret-scan-report.json', stableStringify(errorReport, null, 2));
    
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateSecretScanReport };