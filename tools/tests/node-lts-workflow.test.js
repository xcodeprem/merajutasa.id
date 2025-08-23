#!/usr/bin/env node

/**
 * Test Node LTS Matrix Workflow Configuration
 * Validates the new workflow file structure and requirements
 */

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import yaml from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const workflowPath = path.join(repoRoot, '.github/workflows/node-lts-matrix.yml');

class NodeLTSWorkflowTest {
  constructor() {
    this.results = [];
    this.workflow = null;
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

  async loadWorkflow() {
    const content = await fs.readFile(workflowPath, 'utf8');
    this.workflow = yaml.parse(content);
  }

  async testWorkflowExists() {
    await this.runTest('Workflow file exists', async () => {
      const exists = await fs.access(workflowPath).then(() => true).catch(() => false);
      if (!exists) {throw new Error('Workflow file does not exist');}
    });
  }

  async testWorkflowStructure() {
    await this.runTest('Workflow has correct structure', async () => {
      if (!this.workflow.name || !this.workflow.on || !this.workflow.jobs) {
        throw new Error('Missing required workflow structure');
      }
      if (this.workflow.name !== 'Node LTS Matrix Build') {
        throw new Error('Incorrect workflow name');
      }
    });
  }

  async testNodeLTSMatrix() {
    await this.runTest('Node LTS matrix is configured', async () => {
      const matrixJob = this.workflow.jobs['matrix-build'];
      if (!matrixJob) {throw new Error('matrix-build job not found');}

      const strategy = matrixJob.strategy;
      if (!strategy || !strategy.matrix) {throw new Error('Matrix strategy not configured');}

      const nodeVersions = strategy.matrix['node-version'];
      if (!Array.isArray(nodeVersions)) {throw new Error('Node versions not configured as array');}

      const expectedVersions = [18, 20, 22];
      if (!expectedVersions.every(v => nodeVersions.includes(v))) {
        throw new Error(`Expected Node versions ${expectedVersions.join(', ')}, got ${nodeVersions.join(', ')}`);
      }
    });
  }

  async testCachingStrategy() {
    await this.runTest('Caching strategy is comprehensive', async () => {
      const matrixJob = this.workflow.jobs['matrix-build'];
      const steps = matrixJob.steps;

      // Check for npm cache in setup-node
      const nodeSetup = steps.find(step => step.uses && step.uses.includes('actions/setup-node'));
      if (!nodeSetup || !nodeSetup.with || nodeSetup.with.cache !== 'npm') {
        throw new Error('npm cache not configured in setup-node');
      }

      // Check for Node modules cache
      const nodeModulesCache = steps.find(step =>
        step.uses && step.uses.includes('actions/cache') &&
        step.with && step.with.path && step.with.path.includes('node_modules'),
      );
      if (!nodeModulesCache) {
        throw new Error('Node modules cache not configured');
      }

      // Check for build artifacts cache
      const buildCache = steps.find(step =>
        step.uses && step.uses.includes('actions/cache') &&
        step.with && step.with.path && step.with.path.includes('artifacts'),
      );
      if (!buildCache) {
        throw new Error('Build artifacts cache not configured');
      }
    });
  }

  async testActionsPinning() {
    await this.runTest('All actions are pinned to SHA', async () => {
      const collectActions = (obj, actions = []) => {
        if (typeof obj === 'object' && obj !== null) {
          if (obj.uses && typeof obj.uses === 'string') {
            actions.push(obj.uses);
          }
          for (const value of Object.values(obj)) {
            collectActions(value, actions);
          }
        }
        return actions;
      };

      const actions = collectActions(this.workflow);
      const externalActions = actions.filter(action => !action.startsWith('./'));

      for (const action of externalActions) {
        // Should be in format: owner/repo@sha
        const parts = action.split('@');
        if (parts.length !== 2) {
          throw new Error(`Action ${action} not pinned to SHA`);
        }

        const sha = parts[1];
        // SHA should be 40 characters hex
        if (!/^[a-f0-9]{40}$/.test(sha)) {
          throw new Error(`Action ${action} not pinned to valid SHA: ${sha}`);
        }
      }
    });
  }

  async testArtifactUploads() {
    await this.runTest('Artifact uploads are configured', async () => {
      const collectArtifactUploads = (jobs) => {
        const uploads = [];
        for (const [jobName, job] of Object.entries(jobs)) {
          if (job.steps) {
            for (const step of job.steps) {
              if (step.uses && step.uses.includes('actions/upload-artifact')) {
                uploads.push({ job: jobName, name: step.with?.name });
              }
            }
          }
        }
        return uploads;
      };

      const uploads = collectArtifactUploads(this.workflow.jobs);
      if (uploads.length === 0) {
        throw new Error('No artifact uploads configured');
      }

      // Check for SBOM artifacts
      const sbomUpload = uploads.find(upload => upload.name && upload.name.includes('sbom'));
      if (!sbomUpload) {
        throw new Error('SBOM artifact upload not found');
      }

      // Check for build artifacts
      const buildUpload = uploads.find(upload => upload.name && upload.name.includes('build'));
      if (!buildUpload) {
        throw new Error('Build artifact upload not found');
      }
    });
  }

  async testSBOMGeneration() {
    await this.runTest('SBOM generation is configured', async () => {
      const sbomJob = this.workflow.jobs['sbom-generation'];
      if (!sbomJob) {throw new Error('SBOM generation job not found');}

      const sbomStep = sbomJob.steps.find(step =>
        step.uses && step.uses.includes('anchore/sbom-action'),
      );
      if (!sbomStep) {
        throw new Error('SBOM generation step not found');
      }

      if (!sbomStep.with || sbomStep.with.format !== 'spdx-json') {
        throw new Error('SBOM format not set to spdx-json');
      }
    });
  }

  async testSecurityScanning() {
    await this.runTest('Security scanning is configured', async () => {
      const secJob = this.workflow.jobs['security-scan'];
      if (!secJob) {throw new Error('Security scanning job not found');}

      const npmAuditStep = secJob.steps.find(step =>
        step.run && step.run.includes('npm audit'),
      );
      if (!npmAuditStep) {
        throw new Error('npm audit step not found');
      }

      const secretScanStep = secJob.steps.find(step =>
        step.run && step.run.includes('secrets:scan'),
      );
      if (!secretScanStep) {
        throw new Error('Secret scanning step not found');
      }
    });
  }

  async testConcurrencyControl() {
    await this.runTest('Concurrency control is configured', async () => {
      if (!this.workflow.concurrency) {
        throw new Error('Concurrency control not configured');
      }

      if (!this.workflow.concurrency.group || !this.workflow.concurrency['cancel-in-progress']) {
        throw new Error('Concurrency group or cancel-in-progress not configured');
      }
    });
  }

  async testTimeouts() {
    await this.runTest('Job timeouts are configured', async () => {
      for (const [jobName, job] of Object.entries(this.workflow.jobs)) {
        if (!job['timeout-minutes']) {
          throw new Error(`Job ${jobName} missing timeout-minutes`);
        }

        const timeout = job['timeout-minutes'];
        if (timeout > 20) {
          throw new Error(`Job ${jobName} timeout too long: ${timeout}m (max 20m for performance)`);
        }
      }
    });
  }

  async testRequiredContexts() {
    await this.runTest('Required contexts are reported', async () => {
      const uploadJob = this.workflow.jobs['upload-artifacts'];
      if (!uploadJob) {throw new Error('Upload artifacts job not found');}

      const reportStep = uploadJob.steps.find(step =>
        step.uses && step.uses.includes('actions/github-script') &&
        step.with && step.with.script && step.with.script.includes('ci/build'),
      );
      if (!reportStep) {
        throw new Error('Required contexts reporting step not found');
      }
    });
  }

  async generateReport() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;

    const report = {
      timestamp: new Date().toISOString(),
      workflow_file: 'node-lts-matrix.yml',
      tests: {
        total: this.results.length,
        passed,
        failed,
      },
      results: this.results,
      status: failed === 0 ? 'PASS' : 'FAIL',
      coverage: {
        node_lts_matrix: passed >= 10,
        caching_strategy: this.results.find(r => r.name.includes('Caching'))?.status === 'PASS',
        actions_pinning: this.results.find(r => r.name.includes('pinned'))?.status === 'PASS',
        sbom_generation: this.results.find(r => r.name.includes('SBOM'))?.status === 'PASS',
        security_scanning: this.results.find(r => r.name.includes('Security'))?.status === 'PASS',
        artifact_uploads: this.results.find(r => r.name.includes('Artifact'))?.status === 'PASS',
      },
    };

    await fs.mkdir(path.join(repoRoot, 'artifacts'), { recursive: true });
    await fs.writeFile(
      path.join(repoRoot, 'artifacts/node-lts-workflow-test.json'),
      JSON.stringify(report, null, 2),
    );

    return report;
  }

  async run() {
    console.log('🧪 Testing Node LTS Matrix Workflow...\n');

    try {
      await this.loadWorkflow();

      await this.testWorkflowExists();
      await this.testWorkflowStructure();
      await this.testNodeLTSMatrix();
      await this.testCachingStrategy();
      await this.testActionsPinning();
      await this.testArtifactUploads();
      await this.testSBOMGeneration();
      await this.testSecurityScanning();
      await this.testConcurrencyControl();
      await this.testTimeouts();
      await this.testRequiredContexts();

    } catch (error) {
      console.error(`Failed to load workflow: ${error.message}`);
      process.exit(1);
    }

    const report = await this.generateReport();

    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${report.tests.passed}`);
    console.log(`❌ Failed: ${report.tests.failed}`);

    if (report.status === 'FAIL') {
      console.log('\n❌ Some tests failed!');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!');
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new NodeLTSWorkflowTest();
  test.run().catch(console.error);
}

export { NodeLTSWorkflowTest };
