#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

class SecurityWorkflowsValidationTest {
  constructor() {
    this.results = [];
    this.workflowsDir = path.join(repoRoot, '.github/workflows');
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

  async testCodeQLWorkflow() {
    await this.runTest('CodeQL workflow runs on PRs', async () => {
      const workflowPath = path.join(this.workflowsDir, 'codeql.yml');
      const content = fs.readFileSync(workflowPath, 'utf8');
      const workflow = yaml.load(content);

      if (!workflow.on.pull_request) {
        throw new Error('CodeQL workflow missing pull_request trigger');
      }

      // Check that it reports security/codeql status check
      const scriptSteps = workflow.jobs.analyze.steps.filter(step => 
        step.uses && step.uses.includes('actions/github-script')
      );
      
      const hasStatusReporting = scriptSteps.some(step => 
        step.with.script.includes('security/codeql')
      );

      if (!hasStatusReporting) {
        throw new Error('CodeQL workflow missing security/codeql status check reporting');
      }
    });
  }

  async testGitleaksWorkflow() {
    await this.runTest('Gitleaks workflow enforces failures', async () => {
      const workflowPath = path.join(this.workflowsDir, 'gitleaks.yml');
      const content = fs.readFileSync(workflowPath, 'utf8');
      const workflow = yaml.load(content);

      if (!workflow.on.pull_request) {
        throw new Error('Gitleaks workflow missing pull_request trigger');
      }

      // Check that it doesn't have continue-on-error
      const gitleaksStep = workflow.jobs.scan.steps.find(step => 
        step.name && step.name.includes('gitleaks')
      );

      if (gitleaksStep && gitleaksStep['continue-on-error']) {
        throw new Error('Gitleaks workflow still has continue-on-error (should be enforced)');
      }

      // Check status reporting
      const scriptSteps = workflow.jobs.scan.steps.filter(step => 
        step.uses && step.uses.includes('actions/github-script')
      );
      
      const hasStatusReporting = scriptSteps.some(step => 
        step.with.script.includes('security/secret-scan')
      );

      if (!hasStatusReporting) {
        throw new Error('Gitleaks workflow missing security/secret-scan status check reporting');
      }
    });
  }

  async testComprehensiveTestsWorkflow() {
    await this.runTest('CI comprehensive tests enforces security failures', async () => {
      const workflowPath = path.join(this.workflowsDir, 'ci-comprehensive-tests.yml');
      const content = fs.readFileSync(workflowPath, 'utf8');
      const workflow = yaml.load(content);

      if (!workflow.on.pull_request) {
        throw new Error('CI comprehensive tests workflow missing pull_request trigger');
      }

      const securityJob = workflow.jobs['security-scan'];
      if (!securityJob) {
        throw new Error('CI comprehensive tests workflow missing security-scan job');
      }

      // Check npm audit step doesn't have continue-on-error
      const npmAuditStep = securityJob.steps.find(step => 
        step.name && step.name.includes('npm audit')
      );

      if (npmAuditStep && npmAuditStep['continue-on-error']) {
        throw new Error('npm audit step still has continue-on-error (should fail on high/critical)');
      }

      // Check secret scanning step doesn't have continue-on-error
      const secretScanStep = securityJob.steps.find(step => 
        step.name && step.name.includes('secret scanning')
      );

      if (secretScanStep && secretScanStep['continue-on-error']) {
        throw new Error('Secret scanning step still has continue-on-error (should be enforced)');
      }

      // Check for ci/security status reporting
      const statusStep = securityJob.steps.find(step => 
        step.name && step.name.includes('Report security status')
      );

      if (!statusStep) {
        throw new Error('Security job missing ci/security status check reporting');
      }
    });
  }

  async testDependabotConfig() {
    await this.runTest('Dependabot is configured', async () => {
      const dependabotPath = path.join(repoRoot, '.github/dependabot.yml');
      const content = fs.readFileSync(dependabotPath, 'utf8');
      const config = yaml.load(content);

      if (!config.updates || !Array.isArray(config.updates)) {
        throw new Error('Dependabot config missing updates array');
      }

      const npmUpdate = config.updates.find(update => update['package-ecosystem'] === 'npm');
      if (!npmUpdate) {
        throw new Error('Dependabot config missing npm package ecosystem');
      }

      if (npmUpdate.schedule?.interval !== 'weekly') {
        throw new Error('Dependabot npm updates should be weekly for security patches');
      }
    });
  }

  async testStatusCheckContexts() {
    await this.runTest('Required status check contexts are documented', async () => {
      const branchProtectionDocPath = path.join(repoRoot, 'docs/ci-cd/branch-protection.md');
      if (!fs.existsSync(branchProtectionDocPath)) {
        throw new Error('Branch protection documentation missing');
      }

      const content = fs.readFileSync(branchProtectionDocPath, 'utf8');
      
      const requiredContexts = [
        'security/codeql',
        'security/secret-scan',
        'ci/security'
      ];

      for (const context of requiredContexts) {
        if (!content.includes(context)) {
          throw new Error(`Required status check context '${context}' not documented`);
        }
      }
    });
  }

  async generateReport() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;

    const report = {
      test_type: 'security_workflows_validation',
      timestamp: new Date().toISOString(),
      status: failed === 0 ? 'PASS' : 'FAIL',
      summary: `Security workflows validation: ${passed} passed, ${failed} failed`,
      tests: {
        total: this.results.length,
        passed,
        failed
      },
      results: this.results,
      requirements_met: {
        codeql_on_prs: this.results.find(r => r.name.includes('CodeQL'))?.status === 'PASS',
        secret_scan_enforced: this.results.find(r => r.name.includes('Gitleaks'))?.status === 'PASS',
        dependency_scanning: this.results.find(r => r.name.includes('Dependabot'))?.status === 'PASS',
        security_gates_enforced: this.results.find(r => r.name.includes('comprehensive tests'))?.status === 'PASS',
        status_checks_documented: this.results.find(r => r.name.includes('status check contexts'))?.status === 'PASS'
      }
    };

    await fs.promises.mkdir(path.join(repoRoot, 'artifacts'), { recursive: true });
    await fs.promises.writeFile(
      path.join(repoRoot, 'artifacts/security-workflows-validation-test.json'),
      JSON.stringify(report, null, 2)
    );

    return report;
  }

  async run() {
    console.log('🔒 Testing Security Workflows Configuration...\n');

    try {
      await this.testCodeQLWorkflow();
      await this.testGitleaksWorkflow();
      await this.testComprehensiveTestsWorkflow();
      await this.testDependabotConfig();
      await this.testStatusCheckContexts();
    } catch (error) {
      console.error(`Failed during tests: ${error.message}`);
    }

    const report = await this.generateReport();

    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${report.tests.passed}`);
    console.log(`❌ Failed: ${report.tests.failed}`);

    if (report.status === 'FAIL') {
      console.log('\n❌ Some security workflow tests failed!');
      console.log('Review the test results and fix the issues.');
      process.exit(1);
    } else {
      console.log('\n✅ All security workflow tests passed!');
      console.log('Security gates are properly configured and enforced.');
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new SecurityWorkflowsValidationTest();
  test.run().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export default SecurityWorkflowsValidationTest;