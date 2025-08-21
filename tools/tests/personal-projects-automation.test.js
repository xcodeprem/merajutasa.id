#!/usr/bin/env node
/**
 * Personal Projects Automation Test Suite
 * Validates core automation logic and workflow integration
 */

import { promises as fs } from 'fs';
import { strict as assert } from 'assert';
import {
  PROJECTS_CONFIG,
  getProjectConfig,
  extractLabels,
  determinePRStatus,
  mapLabelsToFields,
  generateSuggestedLabels,
  calculateSubIssuesProgress,
  generateRetroNotes
} from '../github/personal-projects-automation.js';

class PersonalProjectsAutomationTest {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runTest(name, testFn) {
    this.testResults.total++;
    console.log(`🧪 Testing: ${name}`);
    
    try {
      await testFn();
      this.testResults.passed++;
      console.log(`  ✅ PASS`);
    } catch (error) {
      this.testResults.failed++;
      this.testResults.errors.push({ test: name, error: error.message });
      console.log(`  ❌ FAIL: ${error.message}`);
    }
  }

  async testProjectConfigurations() {
    await this.runTest('Project configurations exist', () => {
      const expectedProjects = ['feature-release', 'team-retrospective', 'iterative-development'];
      
      for (const project of expectedProjects) {
        const config = getProjectConfig(project);
        assert(config.id, `Project ${project} should have an ID`);
        assert(config.title, `Project ${project} should have a title`);
        assert(config.url, `Project ${project} should have a URL`);
        assert(config.fields, `Project ${project} should have fields configuration`);
      }
    });

    await this.runTest('Feature Release project fields', () => {
      const config = getProjectConfig('feature-release');
      const expectedFields = ['Status', 'Sub-Issues Progress', 'Priority', 'Size', 'Estimate', 'Iteration', 'Start Date', 'End Date'];
      
      for (const field of expectedFields) {
        assert(config.fields[field], `Feature Release should have ${field} field`);
      }
    });

    await this.runTest('Team Retrospective project fields', () => {
      const config = getProjectConfig('team-retrospective');
      const expectedFields = ['Status', 'Sub-Issues Progress', 'Category', 'Notes'];
      
      for (const field of expectedFields) {
        assert(config.fields[field], `Team Retrospective should have ${field} field`);
      }
    });

    await this.runTest('Iterative Development project fields', () => {
      const config = getProjectConfig('iterative-development');
      const expectedFields = ['Status', 'Sub-Issues Progress', 'Priority', 'Size', 'Estimate', 'Iteration'];
      
      for (const field of expectedFields) {
        assert(config.fields[field], `Iterative Development should have ${field} field`);
      }
    });
  }

  async testLabelExtraction() {
    await this.runTest('Extract labels from string array', () => {
      const labels = extractLabels({ labels: ['priority:p1', 'size:m', 'status:open'] });
      assert.deepEqual(labels, ['priority:p1', 'size:m', 'status:open']);
    });

    await this.runTest('Extract labels from object array', () => {
      const labels = extractLabels({ 
        labels: [
          { name: 'priority:p1' },
          { name: 'size:m' },
          { name: 'status:open' }
        ]
      });
      assert.deepEqual(labels, ['priority:p1', 'size:m', 'status:open']);
    });

    await this.runTest('Handle empty labels', () => {
      const labels = extractLabels({ labels: [] });
      assert.deepEqual(labels, []);
    });
  }

  async testStatusDetermination() {
    await this.runTest('Draft PR status', () => {
      const status = determinePRStatus({ draft: true, state: 'open' });
      assert.equal(status, 'To Do');
    });

    await this.runTest('Open PR status', () => {
      const status = determinePRStatus({ draft: false, state: 'open' });
      assert.equal(status, 'In Review');
    });

    await this.runTest('Merged PR status', () => {
      const status = determinePRStatus({ draft: false, state: 'closed', merged: true });
      assert.equal(status, 'Done');
    });

    await this.runTest('Closed PR status', () => {
      const status = determinePRStatus({ draft: false, state: 'closed', merged: false });
      assert.equal(status, 'Done');
    });
  }

  async testFieldMapping() {
    await this.runTest('Priority field mapping', () => {
      const config = getProjectConfig('feature-release');
      const fields = mapLabelsToFields(['priority:p1'], config);
      assert.equal(fields.Priority, 'P1');
    });

    await this.runTest('Size field mapping', () => {
      const config = getProjectConfig('feature-release');
      const fields = mapLabelsToFields(['size:xl'], config);
      assert.equal(fields.Size, 'XL');
    });

    await this.runTest('Category field mapping (retrospective)', () => {
      const config = getProjectConfig('team-retrospective');
      const fields = mapLabelsToFields(['category:what-went-well'], config);
      assert.equal(fields.Category, 'What Went Well');
    });

    await this.runTest('Iteration field mapping', () => {
      const config = getProjectConfig('feature-release');
      const fields = mapLabelsToFields(['iteration:current'], config);
      assert.equal(fields.Iteration, 'CURRENT');
    });

    await this.runTest('Estimate field mapping', () => {
      const config = getProjectConfig('feature-release');
      const fields = mapLabelsToFields(['est:h:16'], config);
      assert.equal(fields.Estimate, 16);
    });

    await this.runTest('Date field mapping', () => {
      const config = getProjectConfig('feature-release');
      const fields = mapLabelsToFields(['start:2024-01-15', 'due:2024-01-30'], config);
      assert.equal(fields['Start Date'], '2024-01-15');
      assert.equal(fields['End Date'], '2024-01-30');
    });
  }

  async testSuggestedLabels() {
    await this.runTest('Feature Release suggested labels', () => {
      const mockPR = { number: 123, title: 'Test PR', draft: false, state: 'open', labels: [] };
      const suggested = generateSuggestedLabels(mockPR, 'feature-release');
      
      assert(suggested.includes('project:feature-release'), 'Should include project label');
      assert(suggested.includes('status:in-review'), 'Should include status label');
      assert(suggested.includes('priority:p2'), 'Should include default priority');
      assert(suggested.includes('size:m'), 'Should include default size');
    });

    await this.runTest('Team Retrospective suggested labels', () => {
      const mockPR = { number: 123, title: 'Test PR', draft: false, state: 'open', labels: [] };
      const suggested = generateSuggestedLabels(mockPR, 'team-retrospective');
      
      assert(suggested.includes('project:team-retrospective'), 'Should include project label');
      assert(suggested.includes('category:what-went-well'), 'Should include default category');
    });

    await this.runTest('Iterative Development suggested labels', () => {
      const mockPR = { number: 123, title: 'Test PR', draft: false, state: 'open', labels: [] };
      const suggested = generateSuggestedLabels(mockPR, 'iterative-development');
      
      assert(suggested.includes('project:iterative-development'), 'Should include project label');
      assert(suggested.includes('size:m'), 'Should include default size');
    });

    await this.runTest('Skip existing labels', () => {
      const mockPR = { 
        number: 123, 
        title: 'Test PR', 
        draft: false, 
        state: 'open', 
        labels: [{ name: 'priority:p1' }]
      };
      const suggested = generateSuggestedLabels(mockPR, 'feature-release');
      
      assert(!suggested.includes('priority:p2'), 'Should not suggest priority if already exists');
    });
  }

  async testSubIssuesProgress() {
    await this.runTest('Calculate sub-issues progress', () => {
      const mockPR = {
        body: `
## Checklist
- [x] Task 1 completed
- [x] Task 2 completed  
- [ ] Task 3 pending
- [ ] Task 4 pending
`
      };
      const progress = calculateSubIssuesProgress(mockPR);
      assert.equal(progress, 50, 'Should calculate 50% progress (2/4 tasks)');
    });

    await this.runTest('No checkboxes returns 0', () => {
      const mockPR = { body: 'No checkboxes here' };
      const progress = calculateSubIssuesProgress(mockPR);
      assert.equal(progress, 0);
    });

    await this.runTest('All completed returns 100', () => {
      const mockPR = {
        body: `
- [x] Task 1
- [x] Task 2
`
      };
      const progress = calculateSubIssuesProgress(mockPR);
      assert.equal(progress, 100);
    });
  }

  async testRetroNotes() {
    await this.runTest('Generate retrospective notes', () => {
      const mockPR = {
        additions: 150,
        deletions: 25,
        requested_reviewers: [{ login: 'reviewer1' }, { login: 'reviewer2' }],
        milestone: { title: 'v1.2.0' }
      };
      const notes = generateRetroNotes(mockPR);
      
      assert(notes.includes('Changes: +150 -25 lines'), 'Should include change stats');
      assert(notes.includes('Reviewers: reviewer1, reviewer2'), 'Should include reviewers');
      assert(notes.includes('Milestone: v1.2.0'), 'Should include milestone');
    });

    await this.runTest('Handle empty PR data', () => {
      const mockPR = {};
      const notes = generateRetroNotes(mockPR);
      assert.equal(notes, '', 'Should return empty string for empty PR');
    });
  }

  async testWorkflowFiles() {
    await this.runTest('Feature Release workflow exists', async () => {
      const content = await fs.readFile('.github/workflows/feature-release-automation.yml', 'utf8');
      assert(content.includes('Feature Release Project Automation'), 'Workflow should have correct title');
      assert(content.includes('feature-release'), 'Workflow should reference correct project key');
    });

    await this.runTest('Team Retrospective workflow exists', async () => {
      const content = await fs.readFile('.github/workflows/team-retrospective-automation.yml', 'utf8');
      assert(content.includes('Team Retrospective Project Automation'), 'Workflow should have correct title');
      assert(content.includes('team-retrospective'), 'Workflow should reference correct project key');
    });

    await this.runTest('Iterative Development workflow exists', async () => {
      const content = await fs.readFile('.github/workflows/iterative-development-automation.yml', 'utf8');
      assert(content.includes('Iterative Development Project Automation'), 'Workflow should have correct title');
      assert(content.includes('iterative-development'), 'Workflow should reference correct project key');
    });

    await this.runTest('Master automation workflow exists', async () => {
      const content = await fs.readFile('.github/workflows/personal-projects-master-automation.yml', 'utf8');
      assert(content.includes('Personal Projects Master Automation'), 'Master workflow should have correct title');
      assert(content.includes('matrix:'), 'Master workflow should use matrix strategy');
    });
  }

  async generateReport() {
    await fs.mkdir('artifacts', { recursive: true });
    
    const report = {
      test_suite: 'Personal Projects Automation',
      timestamp: new Date().toISOString(),
      summary: {
        total_tests: this.testResults.total,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        success_rate: this.testResults.total > 0 ? 
          Math.round((this.testResults.passed / this.testResults.total) * 100) : 0
      },
      errors: this.testResults.errors,
      projects_tested: Object.keys(PROJECTS_CONFIG),
      workflow_files_validated: 4,
      core_features_tested: [
        'Project configuration validation',
        'Label extraction and mapping',
        'PR status determination',
        'Field mapping logic',
        'Suggested labels generation',
        'Sub-issues progress calculation',
        'Retrospective notes generation',
        'Workflow file validation'
      ]
    };
    
    await fs.writeFile(
      'artifacts/personal-projects-automation-test.json', 
      JSON.stringify(report, null, 2)
    );
    
    console.log(`\n📊 Test Report: artifacts/personal-projects-automation-test.json`);
    return report;
  }

  async run() {
    console.log('🧪 Personal Projects Automation Test Suite');
    console.log('==========================================\n');
    
    // Run all test suites
    await this.testProjectConfigurations();
    await this.testLabelExtraction();
    await this.testStatusDetermination();
    await this.testFieldMapping();
    await this.testSuggestedLabels();
    await this.testSubIssuesProgress();
    await this.testRetroNotes();
    await this.testWorkflowFiles();
    
    // Generate report
    const report = await this.generateReport();
    
    // Print summary
    console.log('\n🎯 Test Summary');
    console.log('================');
    console.log(`Total Tests: ${report.summary.total_tests}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Success Rate: ${report.summary.success_rate}%`);
    
    if (report.summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      report.errors.forEach(error => {
        console.log(`  - ${error.test}: ${error.error}`);
      });
    }
    
    const exitCode = report.summary.failed > 0 ? 1 : 0;
    console.log(`\n${exitCode === 0 ? '✅' : '❌'} Test suite ${exitCode === 0 ? 'PASSED' : 'FAILED'}`);
    
    return exitCode;
  }
}

// Run tests if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new PersonalProjectsAutomationTest();
  tester.run()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error('Test suite error:', error);
      process.exit(1);
    });
}

export default PersonalProjectsAutomationTest;