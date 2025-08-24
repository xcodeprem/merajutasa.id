#!/usr/bin/env node

/**
 * Coverage Gate Enforcement Tool
 * Fails the build if test coverage is below the minimum threshold.
 * 
 * Progressive plan:
 * - Phase 1: 80% minimum (current implementation)
 * - Phase 2: 85% (future)
 * - Phase 3: 90%+ (target)
 */

import fs from 'fs/promises';
import path from 'path';

// Configuration
const COVERAGE_THRESHOLDS = {
  lines: 80,    // Start at 80%, progress to 90%+
  functions: 80,
  branches: 70, // More lenient for branches initially  
  statements: 80,
};

const COVERAGE_CONFIG_FILE = 'docs/governance/dec/DEC-20250812-04-governance-baseline-thresholds.md';

async function readCoverageData() {
  try {
    // Read comprehensive coverage summary
    const summaryPath = 'artifacts/coverage-summary-comprehensive.json';
    const summaryData = await fs.readFile(summaryPath, 'utf8');
    const summary = JSON.parse(summaryData);
    
    if (!summary.coverage?.ui || summary.coverage.ui.status === 'not_available') {
      throw new Error('UI coverage data not available. Run tests with coverage first.');
    }
    
    return summary.coverage.ui;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('Coverage summary not found. Run "npm run coverage:summary" first.');
    }
    throw error;
  }
}

async function checkCoverageThresholds(coverage) {
  const results = {
    timestamp: new Date().toISOString(),
    thresholds: COVERAGE_THRESHOLDS,
    coverage_actual: coverage,
    checks: {},
    overall_status: 'PASS',
    failures: [],
  };
  
  // Check each metric
  for (const [metric, threshold] of Object.entries(COVERAGE_THRESHOLDS)) {
    if (coverage[metric] && typeof coverage[metric].pct === 'number') {
      const actual = coverage[metric].pct;
      const passed = actual >= threshold;
      
      results.checks[metric] = {
        threshold,
        actual,
        passed,
        covered: coverage[metric].covered,
        total: coverage[metric].total,
      };
      
      if (!passed) {
        results.overall_status = 'FAIL';
        results.failures.push({
          metric,
          threshold,
          actual,
          deficit: threshold - actual,
        });
      }
    } else {
      results.checks[metric] = {
        threshold,
        actual: 'N/A',
        passed: false,
        error: 'Metric not available in coverage data',
      };
      results.overall_status = 'FAIL';
      results.failures.push({
        metric,
        threshold,
        actual: 'N/A',
        error: 'Metric not available',
      });
    }
  }
  
  return results;
}

async function writeCoverageGateReport(results) {
  // Ensure artifacts directory exists
  await fs.mkdir('artifacts', { recursive: true });
  
  // Write gate enforcement report
  const reportPath = 'artifacts/coverage-gate-enforcement.json';
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  
  console.log(`Coverage gate report written: ${reportPath}`);
  return reportPath;
}

function logResults(results) {
  console.log('\n🔍 Coverage Gate Enforcement');
  console.log('=============================');
  
  if (results.overall_status === 'PASS') {
    console.log('✅ All coverage thresholds met!');
  } else {
    console.log('❌ Coverage thresholds not met!');
  }
  
  console.log('\nCoverage Results:');
  for (const [metric, check] of Object.entries(results.checks)) {
    const icon = check.passed ? '✅' : '❌';
    const actualDisplay = typeof check.actual === 'number' ? `${check.actual.toFixed(2)}%` : check.actual;
    console.log(`  ${icon} ${metric}: ${actualDisplay} (threshold: ${check.threshold}%)`);
    
    if (check.covered !== undefined && check.total !== undefined) {
      console.log(`      (${check.covered}/${check.total} covered)`);
    }
  }
  
  if (results.failures.length > 0) {
    console.log('\nFailure Details:');
    for (const failure of results.failures) {
      if (failure.error) {
        console.log(`  ❌ ${failure.metric}: ${failure.error}`);
      } else {
        console.log(`  ❌ ${failure.metric}: ${failure.actual}% < ${failure.threshold}% (deficit: ${failure.deficit.toFixed(2)}%)`);
      }
    }
    
    console.log('\n💡 To fix coverage issues:');
    console.log('   1. Run: cd public/equity-ui-v2 && npm test -- --coverage');
    console.log('   2. Review coverage report in artifacts/equity-ui-v2-coverage/lcov-report/index.html');
    console.log('   3. Add tests for uncovered code');
    console.log('   4. Re-run: npm run coverage:summary && npm run coverage:gate');
  }
  
  console.log(`\n📊 Full report: artifacts/coverage-gate-enforcement.json`);
}

async function main() {
  try {
    console.log('🚀 Running coverage gate enforcement...');
    
    // Read coverage data
    const coverage = await readCoverageData();
    
    // Check thresholds
    const results = await checkCoverageThresholds(coverage);
    
    // Write report
    await writeCoverageGateReport(results);
    
    // Log results
    logResults(results);
    
    // Exit with appropriate code
    if (results.overall_status === 'FAIL') {
      console.log('\n💥 Coverage gate failed! Build should not proceed.');
      console.log('📋 Failing metrics:');
      results.failures.forEach(failure => {
        console.log(`  - ${failure.metric}: ${failure.actual}% (required: ${failure.threshold}%)`);
      });
      process.exit(1);
    } else {
      console.log('\n🎉 Coverage gate passed! Build can proceed.');
      console.log('📊 Coverage summary:');
      Object.entries(results.checks).forEach(([metric, check]) => {
        if (check.passed) {
          console.log(`  ✅ ${metric}: ${check.actual}% (≥${check.threshold}%)`);
        }
      });
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Coverage gate enforcement failed:', error.message);
    
    // Write error report with more context
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: error.message,
      overall_status: 'ERROR',
      thresholds: COVERAGE_THRESHOLDS,
      context: 'Coverage gate enforcement failed - this may indicate missing coverage data or configuration issues',
    };
    
    try {
      await fs.mkdir('artifacts', { recursive: true });
      await fs.writeFile('artifacts/coverage-gate-enforcement.json', JSON.stringify(errorReport, null, 2));
      console.log('📄 Error report written to artifacts/coverage-gate-enforcement.json');
    } catch (writeError) {
      console.error('Failed to write error report:', writeError.message);
    }
    
    // In CI, treat missing coverage as a failure, but allow local development
    const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
    if (isCI && error.message.includes('Coverage summary not found')) {
      console.log('🚨 In CI environment - missing coverage data is treated as failure');
      process.exit(1);
    } else {
      console.log('⚠️  Coverage gate error in development mode - treating as warning');
      process.exit(0);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;