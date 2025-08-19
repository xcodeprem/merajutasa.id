#!/usr/bin/env node
/**
 * Test GitHub workflow GraphQL queries for syntax and compatibility
 * with public GitHub accounts (repositoryOwner pattern)
 */

import { promises as fs } from 'fs';
import path from 'path';

class WorkflowGraphQLTests {
  constructor() {
    this.results = {
      tests: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  log(message, level = 'info') {
    const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  assert(condition, message) {
    this.results.tests++;
    if (condition) {
      this.results.passed++;
      this.log(message, 'success');
    } else {
      this.results.failed++;
      this.results.errors.push(message);
      this.log(`FAIL: ${message}`, 'error');
    }
  }

  async testWorkflowFile(filePath, expectedPatterns) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const fileName = path.basename(filePath);

      this.log(`Testing ${fileName}...`);

      // Test for repositoryOwner pattern instead of combined user+organization
      if (expectedPatterns.shouldUseRepositoryOwner) {
        this.assert(
          content.includes('repositoryOwner(login:'),
          `${fileName} should use repositoryOwner GraphQL pattern`
        );
        
        this.assert(
          content.includes('... on User') && content.includes('... on Organization'),
          `${fileName} should use type fragments for User and Organization`
        );

        this.assert(
          !content.includes('user(login:') || !content.includes('organization(login:') ||
          !(content.includes('user(login:') && content.includes('organization(login:')),
          `${fileName} should not use combined user+organization query pattern`
        );
      }

      // Test for proper error handling
      if (expectedPatterns.shouldHaveErrorHandling) {
        this.assert(
          content.includes('try {') && content.includes('catch'),
          `${fileName} should have try/catch error handling`
        );

        this.assert(
          content.includes('core.warning'),
          `${fileName} should use core.warning for non-fatal errors`
        );
      }

      // Test for core.setOutput instead of ::set-output
      if (expectedPatterns.shouldUseNewOutput) {
        this.assert(
          content.includes('core.setOutput'),
          `${fileName} should use core.setOutput`
        );

        this.assert(
          !content.includes('::set-output'),
          `${fileName} should not use deprecated ::set-output`
        );
      }

      // Test for proper project not found handling
      if (expectedPatterns.shouldHandleProjectNotFound) {
        this.assert(
          content.includes('not found') && (content.includes('Project') || content.includes('project')),
          `${fileName} should handle project not found gracefully`
        );
      }

    } catch (error) {
      this.results.failed++;
      this.results.errors.push(`Failed to test ${filePath}: ${error.message}`);
      this.log(`Failed to test ${filePath}: ${error.message}`, 'error');
    }
  }

  async runTests() {
    console.log('GitHub Workflow GraphQL Tests');
    console.log('==============================');

    const workflowDir = '.github/workflows';

    // Test setup-project-v2.yml
    await this.testWorkflowFile(`${workflowDir}/setup-project-v2.yml`, {
      shouldUseRepositoryOwner: true,
      shouldHaveErrorHandling: true,
      shouldUseNewOutput: true,
      shouldHandleProjectNotFound: false
    });

    // Test auto-add-to-project.yml
    await this.testWorkflowFile(`${workflowDir}/auto-add-to-project.yml`, {
      shouldUseRepositoryOwner: true,
      shouldHaveErrorHandling: true,
      shouldUseNewOutput: false,
      shouldHandleProjectNotFound: true
    });

    // Test bulk-import-to-project.yml
    await this.testWorkflowFile(`${workflowDir}/bulk-import-to-project.yml`, {
      shouldUseRepositoryOwner: true,
      shouldHaveErrorHandling: true,
      shouldUseNewOutput: false,
      shouldHandleProjectNotFound: true
    });

    // Test seed-labels.yml (should remain unchanged)
    await this.testWorkflowFile(`${workflowDir}/seed-labels.yml`, {
      shouldUseRepositoryOwner: false,
      shouldHaveErrorHandling: false,
      shouldUseNewOutput: false,
      shouldHandleProjectNotFound: false
    });

    return this.generateReport();
  }

  generateReport() {
    console.log('\n=== Test Results ===');
    console.log(`Total tests: ${this.results.tests}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n=== Errors ===');
      this.results.errors.forEach(error => console.log(`- ${error}`));
    }

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_tests: this.results.tests,
        passed: this.results.passed,
        failed: this.results.failed,
        success_rate: this.results.tests > 0 ? (this.results.passed / this.results.tests * 100).toFixed(1) : 0
      },
      errors: this.results.errors
    };

    // Write report to artifacts
    const artifactPath = 'artifacts/github-workflows-graphql-test.json';
    return fs.writeFile(artifactPath, JSON.stringify(report, null, 2))
      .then(() => {
        console.log(`\nTest report saved to ${artifactPath}`);
        return this.results.failed === 0;
      })
      .catch(err => {
        console.error('Failed to save test report:', err.message);
        return this.results.failed === 0;
      });
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new WorkflowGraphQLTests();
  const success = await tester.runTests();
  process.exit(success ? 0 : 1);
}

export { WorkflowGraphQLTests };