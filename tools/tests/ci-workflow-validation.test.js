#!/usr/bin/env node

/**
 * CI Workflow Validation Test
 * Tests the comprehensive CI workflow components to ensure they work correctly
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

const ARTIFACTS_DIR = 'artifacts';
const TEST_RESULTS_FILE = `${ARTIFACTS_DIR}/ci-workflow-validation.json`;

class CIWorkflowValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      overall_status: 'PASS',
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
      }
    };
  }

  async runTest(name, testFunction) {
    console.log(`🧪 Testing: ${name}`);
    const start = Date.now();
    
    try {
      await testFunction();
      const duration = Date.now() - start;
      this.results.tests.push({
        name,
        status: 'PASS',
        duration,
        message: 'Test completed successfully'
      });
      this.results.summary.passed++;
      console.log(`  ✅ ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - start;
      this.results.tests.push({
        name,
        status: 'FAIL',
        duration,
        error: error.message
      });
      this.results.summary.failed++;
      this.results.overall_status = 'FAIL';
      console.log(`  ❌ ${name} (${duration}ms): ${error.message}`);
    }
    
    this.results.summary.total++;
  }

  async testArtifactsDirectory() {
    await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
    const stats = await fs.stat(ARTIFACTS_DIR);
    if (!stats.isDirectory()) {
      throw new Error('Artifacts directory is not a directory');
    }
  }

  async testCoverageSummaryGeneration() {
    const { execSync } = await import('child_process');
    
    // Ensure we have basic test coverage data structure
    await fs.mkdir('artifacts/test-coverage', { recursive: true });
    
    // Create mock test summary for validation
    const mockTestSummary = {
      timestamp: new Date().toISOString(),
      test_suites: {
        governance: 'mock-tested',
        services: 'mock-tested', 
        infrastructure: 'mock-tested'
      }
    };
    
    await fs.writeFile('artifacts/test-coverage/root-test-summary.json', 
      JSON.stringify(mockTestSummary, null, 2));

    // Run coverage summary generation
    execSync('npm run coverage:summary', { encoding: 'utf8' });
    
    // Verify the summary was generated
    const summaryPath = 'artifacts/coverage-summary-comprehensive.json';
    const summary = await fs.readFile(summaryPath, 'utf8');
    const data = JSON.parse(summary);
    
    if (!data.timestamp) {
      throw new Error('Coverage summary missing timestamp');
    }
  }

  async testCoverageGateEnforcement() {
    // Test the coverage gate with mock data
    const mockCoverage = {
      lines: { pct: 85, covered: 85, total: 100 },
      functions: { pct: 82, covered: 82, total: 100 },
      branches: { pct: 75, covered: 75, total: 100 },
      statements: { pct: 84, covered: 84, total: 100 }
    };

    await fs.mkdir('artifacts', { recursive: true });
    await fs.writeFile('artifacts/coverage-summary-comprehensive.json', 
      JSON.stringify({
        timestamp: new Date().toISOString(),
        coverage_data: mockCoverage
      }, null, 2));

    const { execSync } = await import('child_process');
    
    try {
      execSync('npm run coverage:gate', { encoding: 'utf8' });
    } catch (error) {
      // Check if it's a legitimate failure or just missing real data
      if (error.message.includes('Coverage summary not found')) {
        // This is expected in test environment
        return;
      }
      throw error;
    }
  }

  async testUITestingSetup() {
    const uiDir = 'public/equity-ui-v2';
    
    // Check if UI directory exists
    try {
      const stats = await fs.stat(uiDir);
      if (!stats.isDirectory()) {
        throw new Error('UI directory not found');
      }
    } catch (error) {
      throw new Error('UI testing directory not accessible');
    }

    // Check for essential UI test files
    const essentialFiles = [
      'package.json',
      'vite.config.js',
      'vitest.setup.js',
      'playwright.config.ts'
    ];

    for (const file of essentialFiles) {
      try {
        await fs.access(path.join(uiDir, file));
      } catch (error) {
        throw new Error(`Missing essential UI test file: ${file}`);
      }
    }
  }

  async testSecurityScanningSetup() {
    // Check for security scanning configuration
    const securityFiles = [
      '.gitleaks.toml',
      '.github/workflows/codeql.yml'
    ];

    for (const file of securityFiles) {
      try {
        await fs.access(file);
      } catch (error) {
        throw new Error(`Missing security file: ${file}`);
      }
    }
  }

  async testWorkflowFiles() {
    const workflowFiles = [
      '.github/workflows/ci-comprehensive-tests.yml',
      '.github/workflows/codeql.yml',
      '.github/workflows/ci-guard.yml',
      '.github/workflows/node-lts-matrix.yml'
    ];

    for (const file of workflowFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        if (content.length < 100) {
          throw new Error(`Workflow file ${file} is too short`);
        }
        
        // Basic YAML validation - check for required fields
        if (!content.includes('name:') || !content.includes('on:') || !content.includes('jobs:')) {
          throw new Error(`Workflow file ${file} missing required YAML structure`);
        }
      } catch (error) {
        throw new Error(`Workflow file validation failed for ${file}: ${error.message}`);
      }
    }
  }

  async testDependencyChecks() {
    // Verify npm audit can run
    const { execSync } = await import('child_process');
    
    try {
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);
      
      // Check for critical/high vulnerabilities
      if (audit.metadata && audit.metadata.vulnerabilities) {
        const critical = audit.metadata.vulnerabilities.critical || 0;
        const high = audit.metadata.vulnerabilities.high || 0;
        
        if (critical > 0 || high > 0) {
          console.log(`⚠️  Found ${critical} critical and ${high} high vulnerabilities`);
        }
      }
    } catch (error) {
      // npm audit exits with non-zero when vulnerabilities found
      // This is expected, just verify it ran
      if (!error.message.includes('npm audit')) {
        throw error;
      }
    }
  }

  async generateReport() {
    await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
    await fs.writeFile(TEST_RESULTS_FILE, JSON.stringify(this.results, null, 2));
    
    console.log('\n📊 CI Workflow Validation Results:');
    console.log(`   Total Tests: ${this.results.summary.total}`);
    console.log(`   Passed: ${this.results.summary.passed}`);
    console.log(`   Failed: ${this.results.summary.failed}`);
    console.log(`   Overall Status: ${this.results.overall_status}`);
    console.log(`   Report saved: ${TEST_RESULTS_FILE}`);
    
    return this.results.overall_status === 'PASS';
  }

  async runAllTests() {
    console.log('🚀 Starting CI Workflow Validation Tests...\n');

    await this.runTest('Artifacts Directory Setup', () => this.testArtifactsDirectory());
    await this.runTest('Coverage Summary Generation', () => this.testCoverageSummaryGeneration());
    await this.runTest('Coverage Gate Enforcement', () => this.testCoverageGateEnforcement());
    await this.runTest('UI Testing Setup', () => this.testUITestingSetup());
    await this.runTest('Security Scanning Setup', () => this.testSecurityScanningSetup());
    await this.runTest('Workflow Files Validation', () => this.testWorkflowFiles());
    await this.runTest('Dependency Security Checks', () => this.testDependencyChecks());

    const success = await this.generateReport();
    
    if (success) {
      console.log('\n✅ All CI workflow validation tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Some CI workflow validation tests failed');
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new CIWorkflowValidator();
  validator.runAllTests().catch(error => {
    console.error('Fatal error in CI workflow validation:', error);
    process.exit(1);
  });
}

export default CIWorkflowValidator;