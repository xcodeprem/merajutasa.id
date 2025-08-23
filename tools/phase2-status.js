#!/usr/bin/env node
/**
 * Phase 2 Status Tool
 * Comprehensive status checker for Phase 2 Week 1 implementation
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class Phase2StatusChecker {
  constructor() {
    this.components = {
      'Docker Containerization': {
        weight: 25,
        checks: [
          'Dockerfiles exist for all services',
          'Docker compose configurations',
          'Build scripts are executable',
          'Health checks configured',
        ],
      },
      'Kubernetes Orchestration': {
        weight: 25,
        checks: [
          'Deployment manifests created',
          'Service definitions exist',
          'ConfigMaps configured',
          'Resource limits defined',
        ],
      },
      'Infrastructure as Code': {
        weight: 25,
        checks: [
          'Terraform configurations',
          'Variable definitions',
          'Output configurations',
          'Provider configurations',
        ],
      },
      'Integration & Automation': {
        weight: 25,
        checks: [
          'NPM scripts added',
          'Integration tests updated',
          'Configuration files',
          'Directory structure',
        ],
      },
    };

    this.results = {};
    this.overallScore = 0;
  }

  async checkDockerFiles() {
    const dockerfiles = [
      'infrastructure/docker/services/Dockerfile.signer',
      'infrastructure/docker/services/Dockerfile.chain',
      'infrastructure/docker/services/Dockerfile.collector',
      'infrastructure/docker/services/Dockerfile.backup',
      'infrastructure/docker/services/Dockerfile.monitoring',
    ];

    const composeFiles = [
      'infrastructure/docker/compose/docker-compose.yml',
      'infrastructure/docker/compose/docker-compose.prod.yml',
      'infrastructure/docker/compose/docker-compose.test.yml',
    ];

    const scripts = [
      'infrastructure/docker/scripts/build-all.sh',
      'infrastructure/docker/scripts/deploy-stack.sh',
      'infrastructure/docker/scripts/health-check.sh',
    ];

    let score = 0;
    const checks = [];

    // Check Dockerfiles
    for (const dockerfile of dockerfiles) {
      try {
        const content = await fs.readFile(dockerfile, 'utf8');
        if (content.includes('HEALTHCHECK') && content.includes('USER merajutasa')) {
          score += 4;
          checks.push(`✅ ${path.basename(dockerfile)} configured properly`);
        } else {
          checks.push(`⚠️ ${path.basename(dockerfile)} missing health check or user config`);
        }
      } catch (error) {
        checks.push(`❌ ${path.basename(dockerfile)} not found`);
      }
    }

    // Check compose files
    for (const composeFile of composeFiles) {
      try {
        const content = await fs.readFile(composeFile, 'utf8');
        if (content.includes('services:') && content.includes('networks:')) {
          score += 7;
          checks.push(`✅ ${path.basename(composeFile)} configured`);
        } else {
          checks.push(`⚠️ ${path.basename(composeFile)} incomplete`);
        }
      } catch (error) {
        checks.push(`❌ ${path.basename(composeFile)} not found`);
      }
    }

    // Check scripts
    for (const script of scripts) {
      try {
        const stats = await fs.stat(script);
        if (stats.isFile()) {
          score += 2;
          checks.push(`✅ ${path.basename(script)} exists`);
        }
      } catch (error) {
        checks.push(`❌ ${path.basename(script)} not found`);
      }
    }

    return {
      score: Math.min(score, 100),
      checks,
      maxScore: 100,
    };
  }

  async checkKubernetesFiles() {
    const manifests = [
      'infrastructure/kubernetes/deployments/signer-deployment.yaml',
      'infrastructure/kubernetes/deployments/chain-deployment.yaml',
      'infrastructure/kubernetes/deployments/collector-deployment.yaml',
      'infrastructure/kubernetes/services/services.yaml',
      'infrastructure/kubernetes/configmaps/configmaps.yaml',
    ];

    let score = 0;
    const checks = [];

    for (const manifest of manifests) {
      try {
        const content = await fs.readFile(manifest, 'utf8');
        if (content.includes('apiVersion:') && content.includes('kind:') && content.includes('metadata:')) {
          score += 20;
          checks.push(`✅ ${path.basename(manifest)} properly structured`);
        } else {
          checks.push(`⚠️ ${path.basename(manifest)} incomplete structure`);
        }
      } catch (error) {
        checks.push(`❌ ${path.basename(manifest)} not found`);
      }
    }

    return {
      score: Math.min(score, 100),
      checks,
      maxScore: 100,
    };
  }

  async checkTerraformFiles() {
    const terraformFiles = [
      'infrastructure/terraform/main.tf',
      'infrastructure/terraform/variables.tf',
      'infrastructure/terraform/outputs.tf',
    ];

    let score = 0;
    const checks = [];

    for (const tfFile of terraformFiles) {
      try {
        const content = await fs.readFile(tfFile, 'utf8');

        if (tfFile.includes('main.tf')) {
          if (content.includes('terraform {') && content.includes('provider "aws"') && content.includes('resource "aws_eks_cluster"')) {
            score += 35;
            checks.push(`✅ ${path.basename(tfFile)} with EKS configuration`);
          } else {
            checks.push(`⚠️ ${path.basename(tfFile)} incomplete`);
          }
        } else if (tfFile.includes('variables.tf')) {
          if (content.includes('variable "environment"') && content.includes('variable "cluster_name"')) {
            score += 30;
            checks.push(`✅ ${path.basename(tfFile)} with required variables`);
          } else {
            checks.push(`⚠️ ${path.basename(tfFile)} missing variables`);
          }
        } else if (tfFile.includes('outputs.tf')) {
          if (content.includes('output "cluster_endpoint"') && content.includes('output "vpc_id"')) {
            score += 35;
            checks.push(`✅ ${path.basename(tfFile)} with required outputs`);
          } else {
            checks.push(`⚠️ ${path.basename(tfFile)} missing outputs`);
          }
        }
      } catch (error) {
        checks.push(`❌ ${path.basename(tfFile)} not found`);
      }
    }

    return {
      score: Math.min(score, 100),
      checks,
      maxScore: 100,
    };
  }

  async checkIntegrationFiles() {
    const integrationFiles = [
      'package.json',
      'tools/tests/infrastructure-integration.test.js',
      'infrastructure/docker/configs/nginx-docker.conf',
    ];

    let score = 0;
    const checks = [];

    // Check package.json for new scripts
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      const requiredScripts = [
        'docker:build-all',
        'docker:deploy-dev',
        'docker:deploy-prod',
        'k8s:deploy',
        'k8s:status',
        'phase2:status',
      ];

      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
      if (missingScripts.length === 0) {
        score += 40;
        checks.push('✅ All Phase 2 npm scripts added');
      } else {
        checks.push(`⚠️ Missing npm scripts: ${missingScripts.join(', ')}`);
      }
    } catch (error) {
      checks.push('❌ package.json not readable');
    }

    // Check integration tests
    try {
      const testContent = await fs.readFile('tools/tests/infrastructure-integration.test.js', 'utf8');
      if (testContent.includes('testDockerfiles') && testContent.includes('testKubernetesManifests')) {
        score += 30;
        checks.push('✅ Infrastructure integration tests updated');
      } else {
        checks.push('⚠️ Integration tests incomplete');
      }
    } catch (error) {
      checks.push('❌ Integration tests not found');
    }

    // Check configuration files
    try {
      const nginxConfig = await fs.readFile('infrastructure/docker/configs/nginx-docker.conf', 'utf8');
      if (nginxConfig.includes('upstream signer_backend') && nginxConfig.includes('ssl_certificate')) {
        score += 30;
        checks.push('✅ NGINX configuration for containers');
      } else {
        checks.push('⚠️ NGINX configuration incomplete');
      }
    } catch (error) {
      checks.push('❌ NGINX configuration not found');
    }

    return {
      score: Math.min(score, 100),
      checks,
      maxScore: 100,
    };
  }

  async runDockerValidation() {
    try {
      // Check if docker is available
      await execAsync('docker --version');
      return '✅ Docker available';
    } catch (error) {
      return '⚠️ Docker not available (install for full validation)';
    }
  }

  async runKubernetesValidation() {
    try {
      // Check if kubectl is available
      await execAsync('kubectl version --client');
      return '✅ kubectl available';
    } catch (error) {
      return '⚠️ kubectl not available (install for full validation)';
    }
  }

  async runTerraformValidation() {
    try {
      // Check if terraform is available
      await execAsync('terraform --version');
      return '✅ Terraform available';
    } catch (error) {
      return '⚠️ Terraform not available (install for full validation)';
    }
  }

  async generateWeek1Summary() {
    console.log('🚀 Phase 2 Week 1 Implementation Status\n');

    // Check each component
    this.results['Docker Containerization'] = await this.checkDockerFiles();
    this.results['Kubernetes Orchestration'] = await this.checkKubernetesFiles();
    this.results['Infrastructure as Code'] = await this.checkTerraformFiles();
    this.results['Integration & Automation'] = await this.checkIntegrationFiles();

    // Calculate overall score
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const [component, data] of Object.entries(this.components)) {
      const result = this.results[component];
      const weightedScore = (result.score / 100) * data.weight;
      totalWeightedScore += weightedScore;
      totalWeight += data.weight;

      console.log(`\n📦 ${component} (${data.weight}% weight):`);
      console.log(`   Score: ${result.score}/100`);
      console.log(`   Weighted: ${weightedScore.toFixed(1)}/${data.weight}`);

      result.checks.forEach(check => {
        console.log(`   ${check}`);
      });
    }

    this.overallScore = Math.round(totalWeightedScore);

    // Tool validation
    console.log('\n🛠️ Tool Availability:');
    console.log(`   ${await this.runDockerValidation()}`);
    console.log(`   ${await this.runKubernetesValidation()}`);
    console.log(`   ${await this.runTerraformValidation()}`);

    // Overall summary
    console.log('\n📊 Week 1 Implementation Summary:');
    console.log(`   Overall Score: ${this.overallScore}/100`);

    let status = '';
    let nextSteps = [];

    if (this.overallScore >= 90) {
      status = '🎉 EXCELLENT - Ready for Week 2';
      nextSteps = [
        'Proceed to Week 2: Performance optimization & caching',
        'Test container builds: npm run docker:build-all',
        'Deploy development environment: npm run docker:deploy-dev',
      ];
    } else if (this.overallScore >= 75) {
      status = '✅ GOOD - Minor issues to address';
      nextSteps = [
        'Address missing components before Week 2',
        'Run integration tests: npm run test:infrastructure',
        'Validate configurations',
      ];
    } else if (this.overallScore >= 50) {
      status = '⚠️ PARTIAL - Significant work needed';
      nextSteps = [
        'Complete missing Docker configurations',
        'Finish Kubernetes manifests',
        'Review Terraform setup',
      ];
    } else {
      status = '❌ INCOMPLETE - Major work required';
      nextSteps = [
        'Start with Docker containerization',
        'Follow PHASE-2-IMPLEMENTATION-GUIDE.md',
        'Focus on one component at a time',
      ];
    }

    console.log(`   Status: ${status}`);
    console.log('\n📋 Next Steps:');
    nextSteps.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step}`);
    });

    // Generate detailed report
    await this.generateDetailedReport();

    return {
      score: this.overallScore,
      status: status,
      nextSteps: nextSteps,
      components: this.results,
    };
  }

  async generateDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      phase: 'Phase 2 Week 1',
      overallScore: this.overallScore,
      components: this.results,
      recommendations: this.generateRecommendations(),
    };

    // Save report
    const artifactsDir = path.join(process.cwd(), 'artifacts');
    await fs.mkdir(artifactsDir, { recursive: true });

    const reportPath = path.join(artifactsDir, 'phase2-week1-status.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Detailed report saved: ${reportPath}`);
  }

  generateRecommendations() {
    const recommendations = [];

    for (const [component, result] of Object.entries(this.results)) {
      if (result.score < 80) {
        recommendations.push({
          component,
          priority: result.score < 50 ? 'HIGH' : 'MEDIUM',
          action: `Improve ${component} - current score: ${result.score}/100`,
        });
      }
    }

    return recommendations;
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new Phase2StatusChecker();
  checker.generateWeek1Summary().catch(error => {
    console.error('Phase 2 status check failed:', error);
    process.exit(1);
  });
}

export default Phase2StatusChecker;
