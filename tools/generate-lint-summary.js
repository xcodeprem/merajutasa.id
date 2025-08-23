#!/usr/bin/env node

/**
 * Generate comprehensive lint summary for CI artifacts
 * Combines results from markdown lint, DEC lint, disclaimers lint, etc.
 */

import fs from 'fs/promises';
import path from 'path';

async function generateLintSummary() {
  const timestamp = new Date().toISOString();
  const summary = {
    timestamp,
    generated_by: 'tools/generate-lint-summary.js',
    lint_results: {
      markdown: null,
      dec: null,
      disclaimers: null,
      security_patterns: null,
    },
    overall_status: 'unknown',
  };

  let passCount = 0;
  let totalChecks = 0;

  try {
    // Check DEC lint results
    try {
      const decLintPath = 'artifacts/dec-lint.json';
      const decData = await fs.readFile(decLintPath, 'utf8');
      const decResults = JSON.parse(decData);
      summary.lint_results.dec = {
        status: decResults.status || 'unknown',
        files_checked: decResults.files_checked || 0,
        violations: decResults.violations || 0,
      };
      totalChecks++;
      if (decResults.status === 'pass' || decResults.status === 'PASS' || (decResults.violations && decResults.violations.length === 0)) {passCount++;}
    } catch (error) {
      console.log('DEC lint results not available:', error.message);
      summary.lint_results.dec = { status: 'not_available', error: error.message };
    }

    // Check disclaimers lint results
    try {
      const disclaimersPath = 'artifacts/disclaimers-lint.json';
      const disclaimersData = await fs.readFile(disclaimersPath, 'utf8');
      const disclaimersResults = JSON.parse(disclaimersData);
      summary.lint_results.disclaimers = {
        status: disclaimersResults.status || 'unknown',
        pages_checked: disclaimersResults.pages_checked || 0,
        violations: disclaimersResults.violations || 0,
      };
      totalChecks++;
      if (disclaimersResults.status === 'pass' || disclaimersResults.status === 'PASS' || disclaimersResults.violations === 0) {passCount++;}
    } catch (error) {
      console.log('Disclaimers lint results not available:', error.message);
      summary.lint_results.disclaimers = { status: 'not_available', error: error.message };
    }

    // Check security patterns smoke results
    try {
      const securityPath = 'artifacts/security-patterns-smoke.json';
      const securityData = await fs.readFile(securityPath, 'utf8');
      const securityResults = JSON.parse(securityData);
      summary.lint_results.security_patterns = {
        status: securityResults.status || 'unknown',
        patterns_checked: securityResults.patterns_checked || 0,
        high_severity_findings: securityResults.high_severity_findings || 0,
      };
      totalChecks++;
      if (securityResults.status === 'pass' || securityResults.status === 'PASS' || securityResults.high_severity_findings === 0) {passCount++;}
    } catch (error) {
      console.log('Security patterns results not available:', error.message);
      summary.lint_results.security_patterns = { status: 'not_available', error: error.message };
    }

    // Determine overall status
    if (totalChecks === 0) {
      summary.overall_status = 'no_data';
    } else if (passCount === totalChecks) {
      summary.overall_status = 'pass';
    } else if (passCount > totalChecks / 2) {
      summary.overall_status = 'mostly_pass';
    } else {
      summary.overall_status = 'fail';
    }

    // Generate badge data
    let lintBadge = 'unknown';
    if (summary.overall_status === 'pass') {lintBadge = 'passing';}
    else if (summary.overall_status === 'mostly_pass') {lintBadge = 'mostly-passing';}
    else if (summary.overall_status === 'fail') {lintBadge = 'failing';}
    else {lintBadge = 'no-data';}

    summary.badge = {
      lint: lintBadge,
      pass_rate: totalChecks > 0 ? Math.round((passCount / totalChecks) * 100) : 0,
    };

    // Ensure artifacts directory exists
    await fs.mkdir('artifacts', { recursive: true });

    // Write comprehensive summary
    const outputPath = 'artifacts/lint-summary-comprehensive.json';
    await fs.writeFile(outputPath, JSON.stringify(summary, null, 2));

    console.log(`Lint summary generated: ${outputPath}`);
    console.log(`Overall Status: ${summary.overall_status}`);
    console.log(`Pass Rate: ${summary.badge.pass_rate}% (${passCount}/${totalChecks})`);

    return summary;
  } catch (error) {
    console.error('Failed to generate lint summary:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateLintSummary();
}

export default generateLintSummary;
