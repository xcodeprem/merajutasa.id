#!/usr/bin/env node

/**
 * Generate comprehensive test coverage summary for CI artifacts
 * Combines UI coverage from Vitest and root test results
 */

import fs from 'fs/promises';
import path from 'path';

async function generateCoverageSummary() {
  const timestamp = new Date().toISOString();
  const summary = {
    timestamp,
    generated_by: 'tools/generate-coverage-summary.js',
    coverage: {
      ui: null,
      root_tests: null
    },
    build: {
      status: 'unknown',
      artifacts_generated: false
    }
  };

  try {
    // Read UI coverage summary if available
    const uiCoveragePath = 'artifacts/equity-ui-v2-coverage/coverage-summary.json';
    try {
      const uiCoverageData = await fs.readFile(uiCoveragePath, 'utf8');
      const uiCoverage = JSON.parse(uiCoverageData);
      
      if (uiCoverage.total) {
        summary.coverage.ui = {
          lines: {
            pct: uiCoverage.total.lines.pct,
            covered: uiCoverage.total.lines.covered,
            total: uiCoverage.total.lines.total
          },
          statements: {
            pct: uiCoverage.total.statements.pct,
            covered: uiCoverage.total.statements.covered,
            total: uiCoverage.total.statements.total
          },
          functions: {
            pct: uiCoverage.total.functions.pct,
            covered: uiCoverage.total.functions.covered,
            total: uiCoverage.total.functions.total
          },
          branches: {
            pct: uiCoverage.total.branches.pct,
            covered: uiCoverage.total.branches.covered,
            total: uiCoverage.total.branches.total
          }
        };
      }
    } catch (error) {
      console.log('UI coverage not available:', error.message);
      summary.coverage.ui = { status: 'not_available', error: error.message };
    }

    // Read root test summary if available
    const rootTestPath = 'artifacts/test-coverage/root-test-summary.json';
    try {
      const rootTestData = await fs.readFile(rootTestPath, 'utf8');
      summary.coverage.root_tests = JSON.parse(rootTestData);
    } catch (error) {
      console.log('Root test summary not available:', error.message);
      summary.coverage.root_tests = { status: 'not_available', error: error.message };
    }

    // Check build artifacts
    try {
      const buildSummaryPath = 'artifacts/build/ui-build-summary.json';
      const buildData = await fs.readFile(buildSummaryPath, 'utf8');
      const buildSummary = JSON.parse(buildData);
      summary.build = buildSummary;
      
      // Check if build directory exists
      try {
        await fs.access('public/dist');
        summary.build.artifacts_generated = true;
      } catch {
        summary.build.artifacts_generated = false;
      }
    } catch (error) {
      console.log('Build summary not available:', error.message);
    }

    // Generate coverage badge data
    let coverageBadge = 'unknown';
    if (summary.coverage.ui && summary.coverage.ui.lines) {
      const pct = summary.coverage.ui.lines.pct;
      if (pct >= 90) coverageBadge = 'excellent';
      else if (pct >= 80) coverageBadge = 'good';
      else if (pct >= 60) coverageBadge = 'fair';
      else coverageBadge = 'needs-improvement';
    }

    summary.badge = {
      coverage: coverageBadge,
      coverage_pct: summary.coverage.ui?.lines?.pct || 0
    };

    // Ensure artifacts directory exists
    await fs.mkdir('artifacts', { recursive: true });

    // Write comprehensive summary
    const outputPath = 'artifacts/coverage-summary-comprehensive.json';
    await fs.writeFile(outputPath, JSON.stringify(summary, null, 2));

    console.log(`Coverage summary generated: ${outputPath}`);
    console.log(`UI Coverage: ${summary.coverage.ui?.lines?.pct || 'N/A'}%`);
    console.log(`Build Status: ${summary.build.status}`);

    return summary;
  } catch (error) {
    console.error('Failed to generate coverage summary:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateCoverageSummary();
}

export default generateCoverageSummary;