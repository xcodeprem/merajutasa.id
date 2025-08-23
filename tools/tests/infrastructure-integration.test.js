#!/usr/bin/env node
/**
 * Infrastructure Integration Tests
 * Comprehensive testing for Docker containers and Kubernetes deployments
 * Phase 1 + Phase 2 Week 1 implementation validation
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

class InfrastructureIntegrationTests {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  async runTest(name, testFunction) {
    console.log(`\n🧪 Running test: ${name}`);
    const testStart = Date.now();

    try {
      await testFunction();
      const duration = Date.now() - testStart;
      console.log(`✅ ${name} - PASSED (${duration}ms)`);
      this.testResults.push({ name, status: 'PASSED', duration });
      return true;
    } catch (error) {
      const duration = Date.now() - testStart;
      console.log(`❌ ${name} - FAILED (${duration}ms)`);
      console.log(`   Error: ${error.message}`);
      this.testResults.push({ name, status: 'FAILED', duration, error: error.message });
      return false;
    }
  }

  async testDockerBuildScript() {
    const buildScript = path.join(process.cwd(), 'infrastructure/docker/scripts/build-all.sh');

    try {
      const stats = await fs.stat(buildScript);
      if (!stats.isFile()) {
        throw new Error('Build script is not a file');
      }

      if (process.platform !== 'win32') {
        const { stdout } = await execAsync(`test -x "${buildScript}" && echo "executable"`);
        if (!stdout.includes('executable')) {
          throw new Error('Build script is not executable');
        }
      }
    } catch (error) {
      throw new Error(`Docker build script test failed: ${error.message}`);
    }
  }

  async testDockerComposeFiles() {
    const composeFiles = [
      { file: 'infrastructure/docker/compose/docker-compose.yml', services: ['signer', 'chain', 'collector', 'monitoring'] },
      { file: 'infrastructure/docker/compose/docker-compose.prod.yml', services: ['signer', 'chain', 'collector', 'monitoring'] },
      { file: 'infrastructure/docker/compose/docker-compose.test.yml', services: ['signer-test', 'chain-test', 'collector-test', 'monitoring-test'] },
    ];

    for (const { file, services } of composeFiles) {
      const filePath = path.join(process.cwd(), file);
      try {
        const content = await fs.readFile(filePath, 'utf8');

        // Docker Compose v2 doesn't require version declaration
        if (!content.includes('services:')) {
          throw new Error(`${file} missing services section`);
        }

        for (const service of services) {
          if (!content.includes(`${service}:`)) {
            throw new Error(`${file} missing ${service} service`);
          }
        }
      } catch (error) {
        throw new Error(`Docker compose file test failed for ${file}: ${error.message}`);
      }
    }
  }

  async testDockerfiles() {
    const dockerfiles = [
      'infrastructure/docker/services/Dockerfile.signer',
      'infrastructure/docker/services/Dockerfile.chain',
      'infrastructure/docker/services/Dockerfile.collector',
      'infrastructure/docker/services/Dockerfile.backup',
      'infrastructure/docker/services/Dockerfile.monitoring',
    ];

    for (const dockerfile of dockerfiles) {
      const filePath = path.join(process.cwd(), dockerfile);
      try {
        const content = await fs.readFile(filePath, 'utf8');

        if (!content.includes('FROM node:18-alpine')) {
          throw new Error(`${dockerfile} not using expected base image`);
        }
        if (!content.includes('USER merajutasa')) {
          throw new Error(`${dockerfile} not running as non-root user`);
        }
        if (!content.includes('HEALTHCHECK')) {
          throw new Error(`${dockerfile} missing health check`);
        }
      } catch (error) {
        throw new Error(`Dockerfile test failed for ${dockerfile}: ${error.message}`);
      }
    }
  }

  async testKubernetesManifests() {
    const manifestDirs = [
      'infrastructure/kubernetes/deployments',
      'infrastructure/kubernetes/services',
      'infrastructure/kubernetes/configmaps',
    ];

    for (const dir of manifestDirs) {
      const dirPath = path.join(process.cwd(), dir);
      try {
        const files = await fs.readdir(dirPath);
        if (files.length === 0) {
          throw new Error(`${dir} directory is empty`);
        }

        for (const file of files) {
          if (file.endsWith('.yaml') || file.endsWith('.yml')) {
            const filePath = path.join(dirPath, file);
            const content = await fs.readFile(filePath, 'utf8');

            if (!content.includes('apiVersion:')) {
              throw new Error(`${file} missing apiVersion`);
            }
            if (!content.includes('kind:')) {
              throw new Error(`${file} missing kind`);
            }
            if (!content.includes('metadata:')) {
              throw new Error(`${file} missing metadata`);
            }
          }
        }
      } catch (error) {
        throw new Error(`Kubernetes manifest test failed for ${dir}: ${error.message}`);
      }
    }
  }

  async testTerraformConfiguration() {
    const terraformFiles = [
      'infrastructure/terraform/main.tf',
      'infrastructure/terraform/variables.tf',
      'infrastructure/terraform/outputs.tf',
    ];

    for (const file of terraformFiles) {
      const filePath = path.join(process.cwd(), file);
      try {
        const content = await fs.readFile(filePath, 'utf8');

        if (file.includes('main.tf')) {
          if (!content.includes('terraform {')) {
            throw new Error(`${file} missing terraform configuration block`);
          }
          if (!content.includes('provider "aws"')) {
            throw new Error(`${file} missing AWS provider`);
          }
        }

        if (file.includes('variables.tf')) {
          if (!content.includes('variable "environment"')) {
            throw new Error(`${file} missing environment variable`);
          }
        }

        if (file.includes('outputs.tf')) {
          if (!content.includes('output "cluster_endpoint"')) {
            throw new Error(`${file} missing cluster_endpoint output`);
          }
        }
      } catch (error) {
        throw new Error(`Terraform configuration test failed for ${file}: ${error.message}`);
      }
    }
  }

  async testNPMScripts() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');

    try {
      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);

      const requiredScripts = [
        'docker:build-all',
        'docker:deploy-dev',
        'docker:deploy-prod',
        'k8s:deploy',
        'k8s:status',
        'phase2:status',
      ];

      for (const script of requiredScripts) {
        if (!packageJson.scripts[script]) {
          throw new Error(`Missing npm script: ${script}`);
        }
      }
    } catch (error) {
      throw new Error(`NPM scripts test failed: ${error.message}`);
    }
  }

  async testDirectoryStructure() {
    const requiredDirs = [
      'infrastructure/docker/services',
      'infrastructure/docker/compose',
      'infrastructure/docker/scripts',
      'infrastructure/docker/configs',
      'infrastructure/kubernetes/deployments',
      'infrastructure/kubernetes/services',
      'infrastructure/kubernetes/configmaps',
      'infrastructure/terraform',
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(process.cwd(), dir);
      try {
        const stats = await fs.stat(dirPath);
        if (!stats.isDirectory()) {
          throw new Error(`${dir} is not a directory`);
        }
      } catch (error) {
        throw new Error(`Directory structure test failed: ${dir} does not exist`);
      }
    }
  }

  async generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.testResults.filter(t => t.status === 'PASSED').length;
    const failed = this.testResults.filter(t => t.status === 'FAILED').length;

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.length,
        passed,
        failed,
        success_rate: Math.round((passed / this.testResults.length) * 100),
        total_duration: totalDuration,
      },
      results: this.testResults,
    };

    const artifactsDir = path.join(process.cwd(), 'artifacts');
    await fs.mkdir(artifactsDir, { recursive: true });

    const reportPath = path.join(artifactsDir, 'infrastructure-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 Test Report Summary:');
    console.log(`   Total Tests: ${report.summary.total}`);
    console.log(`   Passed: ${report.summary.passed}`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Success Rate: ${report.summary.success_rate}%`);
    console.log(`   Duration: ${report.summary.total_duration}ms`);
    console.log(`   Report saved: ${reportPath}`);

    return report;
  }

  async runAllTests() {
    console.log('🚀 Starting Infrastructure Integration Tests...');

    await this.runTest('Directory Structure', () => this.testDirectoryStructure());
    await this.runTest('Docker Build Scripts', () => this.testDockerBuildScript());
    await this.runTest('Docker Compose Files', () => this.testDockerComposeFiles());
    await this.runTest('Dockerfiles', () => this.testDockerfiles());
    await this.runTest('Kubernetes Manifests', () => this.testKubernetesManifests());
    await this.runTest('Terraform Configuration', () => this.testTerraformConfiguration());
    await this.runTest('NPM Scripts', () => this.testNPMScripts());

    const report = await this.generateReport();

    if (report.summary.failed > 0) {
      console.log('\n❌ Some infrastructure tests failed');
      process.exit(1);
    } else {
      console.log('\n✅ All infrastructure tests passed');
      process.exit(0);
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new InfrastructureIntegrationTests();
  tester.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export default InfrastructureIntegrationTests;
