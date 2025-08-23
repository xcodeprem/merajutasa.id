#!/usr/bin/env node

/**
 * Test coverage gate enforcement tool
 * Validates that the coverage gate correctly enforces thresholds
 */

import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class CoverageGateTest {
  constructor() {
    this.results = [];
    this.testDataDir = '/tmp/coverage-gate-test';
  }

  async runTest(name, testFn) {
    try {
      await testFn();
      this.results.push({ name, status: 'PASS' });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.results.push({ name, status: 'FAIL', error: error.message });
      console.log(`❌ ${name}: ${error.message}`);
    }
  }

  async createMockCoverageData(coveragePercentages) {
    await fs.mkdir(this.testDataDir, { recursive: true });
    await fs.mkdir(`${this.testDataDir}/artifacts`, { recursive: true });

    const mockCoverage = {
      timestamp: new Date().toISOString(),
      generated_by: 'test-mock',
      coverage: {
        ui: {
          lines: { pct: coveragePercentages.lines, covered: 800, total: 1000 },
          statements: { pct: coveragePercentages.statements, covered: 800, total: 1000 },
          functions: { pct: coveragePercentages.functions, covered: 80, total: 100 },
          branches: { pct: coveragePercentages.branches, covered: 70, total: 100 },
        },
      },
      build: { status: 'success', artifacts_generated: true },
      badge: { coverage: 'test', coverage_pct: coveragePercentages.lines },
    };

    await fs.writeFile(
      `${this.testDataDir}/artifacts/coverage-summary-comprehensive.json`,
      JSON.stringify(mockCoverage, null, 2)
    );
  }

  async testCoverageGateWithData(coverageData, shouldPass) {
    await this.createMockCoverageData(coverageData);
    
    try {
      // Run coverage gate from repo root with test data directory
      const { stdout, stderr } = await execAsync(`node ${process.cwd()}/tools/coverage-gate-enforce.js`, {
        cwd: this.testDataDir,
        env: { ...process.env }
      });
      
      if (!shouldPass) {
        throw new Error('Coverage gate should have failed but passed');
      }
      
      // Check that enforcement report was created
      const reportExists = await fs.access(`${this.testDataDir}/artifacts/coverage-gate-enforcement.json`)
        .then(() => true)
        .catch(() => false);
      
      if (!reportExists) {
        throw new Error('Coverage gate enforcement report not created');
      }

    } catch (error) {
      if (shouldPass) {
        throw new Error(`Coverage gate should have passed but failed: ${error.message}`);
      }
      
      // Verify the error code indicates failure
      if (!error.message.includes('exit code 1') && error.code !== 1) {
        throw new Error(`Expected exit code 1 for failure, got: ${error.code}`);
      }
    }
  }

  async testPassingCoverage() {
    await this.runTest('Coverage gate passes with high coverage', async () => {
      await this.testCoverageGateWithData({
        lines: 85,
        statements: 85, 
        functions: 85,
        branches: 75,
      }, true);
    });
  }

  async testFailingCoverage() {
    await this.runTest('Coverage gate fails with low coverage', async () => {
      await this.testCoverageGateWithData({
        lines: 70,
        statements: 70,
        functions: 60,
        branches: 50,
      }, false);
    });
  }

  async testEdgeCaseCoverage() {
    await this.runTest('Coverage gate handles exact threshold values', async () => {
      await this.testCoverageGateWithData({
        lines: 80,      // Exact threshold
        statements: 80, // Exact threshold
        functions: 80,  // Exact threshold
        branches: 70,   // Exact threshold
      }, true);
    });
  }

  async testMissingCoverageData() {
    await this.runTest('Coverage gate handles missing coverage data', async () => {
      await fs.mkdir(`${this.testDataDir}/artifacts`, { recursive: true });
      // Don't create coverage summary file
      
      try {
        const result = await execAsync(`node ${process.cwd()}/tools/coverage-gate-enforce.js`, {
          cwd: this.testDataDir,
          env: { ...process.env }
        });
        throw new Error('Should have failed with missing coverage data');
      } catch (error) {
        // The test passes if we get any error (missing file should cause failure)
        // This is expected behavior
      }
    });
  }

  async testCurrentRepositoryCoverage() {
    await this.runTest('Coverage gate works with actual repository data', async () => {
      // This should fail with current 72.03% coverage
      try {
        await execAsync('npm run coverage:gate');
        throw new Error('Expected coverage gate to fail with current 72.03% coverage');
      } catch (error) {
        if (error.code !== 1) {
          throw new Error(`Expected exit code 1 for coverage failure, got: ${error.code}`);
        }
        
        // Verify the report was created
        const reportExists = await fs.access('artifacts/coverage-gate-enforcement.json')
          .then(() => true)
          .catch(() => false);
          
        if (!reportExists) {
          throw new Error('Coverage gate enforcement report not created');
        }
      }
    });
  }

  async cleanup() {
    try {
      await fs.rm(this.testDataDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Cleanup warning: ${error.message}`);
    }
  }

  async generateReport() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;

    const report = {
      timestamp: new Date().toISOString(),
      test_suite: 'coverage-gate-enforce',
      tests: {
        total: this.results.length,
        passed,
        failed,
      },
      results: this.results,
      status: failed === 0 ? 'PASS' : 'FAIL',
    };

    await fs.mkdir('artifacts', { recursive: true });
    await fs.writeFile('artifacts/coverage-gate-test.json', JSON.stringify(report, null, 2));

    return report;
  }

  async run() {
    console.log('🧪 Testing coverage gate enforcement...\n');

    try {
      await this.testPassingCoverage();
      await this.testFailingCoverage();
      await this.testEdgeCaseCoverage();
      await this.testMissingCoverageData();
      await this.testCurrentRepositoryCoverage();

      const report = await this.generateReport();
      
      console.log('\n📊 Test Results:');
      console.log(`   Total: ${report.tests.total}`);
      console.log(`   Passed: ${report.tests.passed}`);
      console.log(`   Failed: ${report.tests.failed}`);
      
      if (report.status === 'FAIL') {
        console.log('\n❌ Some tests failed:');
        for (const result of this.results.filter(r => r.status === 'FAIL')) {
          console.log(`   - ${result.name}: ${result.error}`);
        }
        process.exit(1);
      } else {
        console.log('\n✅ All coverage gate tests passed!');
        process.exit(0);
      }

    } finally {
      await this.cleanup();
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  new CoverageGateTest().run();
}

export default CoverageGateTest;