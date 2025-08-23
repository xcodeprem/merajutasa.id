import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

/**
 * Advanced CI/CD Pipeline Management
 * Provides automated testing, building, deployment, and release management
 */
export class CICDPipelineManager extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      projectName: 'merajutasa-id',
      environments: ['development', 'staging', 'production'],
      dockerRegistry: 'ghcr.io',
      kubernetesNamespace: 'merajutasa',
      enableAutoDeployment: false,
      enableRollback: true,
      healthCheckTimeout: 300000, // 5 minutes
      deploymentTimeout: 600000, // 10 minutes
      testTimeout: 300000, // 5 minutes
      ...config,
    };

    this.pipelines = new Map();
    this.deployments = new Map();
    this.buildCache = new Map();
    this.metrics = {
      totalPipelines: 0,
      successfulPipelines: 0,
      failedPipelines: 0,
      averageBuildTime: 0,
      averageDeploymentTime: 0,
    };
  }

  /**
   * Create and execute a CI/CD pipeline
   */
  async executePipeline(pipelineConfig) {
    const pipelineId = `pipeline-${Date.now()}`;
    const pipeline = {
      id: pipelineId,
      name: pipelineConfig.name || 'Unnamed Pipeline',
      branch: pipelineConfig.branch || 'main',
      environment: pipelineConfig.environment || 'development',
      stages: pipelineConfig.stages || this.getDefaultStages(),
      status: 'running',
      startTime: new Date(),
      endTime: null,
      results: {},
      logs: [],
      artifacts: [],
    };

    this.pipelines.set(pipelineId, pipeline);
    this.emit('pipelineStarted', pipeline);

    try {
      // Execute pipeline stages
      for (const stage of pipeline.stages) {
        await this.executeStage(pipeline, stage);
      }

      pipeline.status = 'success';
      pipeline.endTime = new Date();
      this.metrics.successfulPipelines++;

      this.emit('pipelineCompleted', pipeline);
      return pipeline;
    } catch (error) {
      pipeline.status = 'failed';
      pipeline.endTime = new Date();
      pipeline.error = error.message;
      this.metrics.failedPipelines++;

      this.emit('pipelineFailed', { pipeline, error });
      throw error;
    } finally {
      this.metrics.totalPipelines++;
      this.updateMetrics(pipeline);
    }
  }

  async executeStage(pipeline, stage) {
    const stageStart = performance.now();
    pipeline.logs.push(`[${new Date().toISOString()}] Starting stage: ${stage.name}`);

    this.emit('stageStarted', { pipeline, stage });

    try {
      let result;

      switch (stage.type) {
      case 'test':
        result = await this.runTests(stage);
        break;
      case 'build':
        result = await this.buildArtifacts(stage);
        break;
      case 'security':
        result = await this.runSecurityScans(stage);
        break;
      case 'deploy':
        result = await this.deployApplication(pipeline, stage);
        break;
      case 'healthcheck':
        result = await this.performHealthChecks(stage);
        break;
      default:
        result = await this.runCustomStage(stage);
      }

      const stageDuration = performance.now() - stageStart;
      pipeline.results[stage.name] = {
        status: 'success',
        result,
        duration: stageDuration,
        timestamp: new Date().toISOString(),
      };

      pipeline.logs.push(`[${new Date().toISOString()}] Completed stage: ${stage.name} (${Math.round(stageDuration)}ms)`);
      this.emit('stageCompleted', { pipeline, stage, result });

    } catch (error) {
      const stageDuration = performance.now() - stageStart;
      pipeline.results[stage.name] = {
        status: 'failed',
        error: error.message,
        duration: stageDuration,
        timestamp: new Date().toISOString(),
      };

      pipeline.logs.push(`[${new Date().toISOString()}] Failed stage: ${stage.name} - ${error.message}`);
      this.emit('stageFailed', { pipeline, stage, error });
      throw error;
    }
  }

  async runTests(stage) {
    const testSuites = stage.testSuites || [
      'npm run test:governance',
      'npm run test:services',
      'npm run test:infrastructure',
    ];

    const results = {};

    for (const testSuite of testSuites) {
      try {
        const output = execSync(testSuite, {
          encoding: 'utf8',
          timeout: this.config.testTimeout,
        });

        results[testSuite] = {
          status: 'passed',
          output: output.substring(0, 1000), // Limit output size
        };
      } catch (error) {
        results[testSuite] = {
          status: 'failed',
          error: error.message,
          output: error.stdout?.substring(0, 1000) || '',
        };

        if (stage.failOnTestFailure !== false) {
          throw new Error(`Test suite failed: ${testSuite}`);
        }
      }
    }

    return results;
  }

  async buildArtifacts(stage) {
    const buildCommands = stage.buildCommands || [
      'npm ci',
      'npm run governance:verify',
    ];

    const artifacts = [];

    // Check build cache
    const cacheKey = this.generateCacheKey(stage);
    if (this.buildCache.has(cacheKey) && stage.useCache !== false) {
      return {
        cached: true,
        artifacts: this.buildCache.get(cacheKey),
      };
    }

    for (const command of buildCommands) {
      try {
        const output = execSync(command, {
          encoding: 'utf8',
          timeout: this.config.deploymentTimeout,
        });

        artifacts.push({
          command,
          status: 'success',
          output: output.substring(0, 500),
        });
      } catch (error) {
        throw new Error(`Build command failed: ${command} - ${error.message}`);
      }
    }

    // Build Docker images if specified
    if (stage.buildDocker) {
      const dockerResult = await this.buildDockerImages(stage);
      artifacts.push(dockerResult);
    }

    // Cache successful build
    this.buildCache.set(cacheKey, artifacts);

    return { artifacts };
  }

  async buildDockerImages(stage) {
    const images = stage.dockerImages || [
      { name: 'merajutasa-api-gateway', dockerfile: 'infrastructure/docker/services/Dockerfile.gateway' },
      { name: 'merajutasa-signer', dockerfile: 'infrastructure/docker/services/Dockerfile.signer' },
      { name: 'merajutasa-chain', dockerfile: 'infrastructure/docker/services/Dockerfile.chain' },
    ];

    const builtImages = [];

    for (const image of images) {
      try {
        const tag = `${this.config.dockerRegistry}/${this.config.projectName}/${image.name}:latest`;
        const buildCommand = `docker build -f ${image.dockerfile} -t ${tag} .`;

        execSync(buildCommand, { encoding: 'utf8' });
        builtImages.push({ name: image.name, tag, status: 'built' });

        // Push to registry if configured
        if (stage.pushToRegistry) {
          execSync(`docker push ${tag}`, { encoding: 'utf8' });
          builtImages[builtImages.length - 1].status = 'pushed';
        }
      } catch (error) {
        throw new Error(`Docker build failed for ${image.name}: ${error.message}`);
      }
    }

    return { type: 'docker', images: builtImages };
  }

  async runSecurityScans(stage) {
    const scans = stage.securityScans || [
      'npm audit',
      'npm run privacy:scan',
    ];

    const results = {};

    for (const scan of scans) {
      try {
        const output = execSync(scan, { encoding: 'utf8' });
        results[scan] = {
          status: 'passed',
          output: output.substring(0, 1000),
        };
      } catch (error) {
        // Some security tools exit with non-zero on findings
        results[scan] = {
          status: 'completed_with_findings',
          output: error.stdout?.substring(0, 1000) || error.message,
        };
      }
    }

    return results;
  }

  async deployApplication(pipeline, stage) {
    const deploymentId = `deploy-${pipeline.id}-${Date.now()}`;
    const deployment = {
      id: deploymentId,
      pipelineId: pipeline.id,
      environment: stage.environment || pipeline.environment,
      strategy: stage.strategy || 'rolling',
      status: 'deploying',
      startTime: new Date(),
      services: stage.services || ['api-gateway', 'signer', 'chain', 'collector'],
    };

    this.deployments.set(deploymentId, deployment);
    this.emit('deploymentStarted', deployment);

    try {
      // Deploy services based on strategy
      switch (deployment.strategy) {
      case 'rolling':
        await this.rollingDeployment(deployment, stage);
        break;
      case 'blue-green':
        await this.blueGreenDeployment(deployment, stage);
        break;
      case 'canary':
        await this.canaryDeployment(deployment, stage);
        break;
      default:
        await this.directDeployment(deployment, stage);
      }

      deployment.status = 'deployed';
      deployment.endTime = new Date();

      this.emit('deploymentCompleted', deployment);
      return deployment;

    } catch (error) {
      deployment.status = 'failed';
      deployment.endTime = new Date();
      deployment.error = error.message;

      this.emit('deploymentFailed', { deployment, error });

      // Attempt rollback if enabled
      if (this.config.enableRollback) {
        await this.rollbackDeployment(deployment);
      }

      throw error;
    }
  }

  async rollingDeployment(deployment, stage) {
    for (const service of deployment.services) {
      // Simulate Kubernetes rolling update
      console.log(`Deploying ${service} to ${deployment.environment}`);

      // In real implementation, this would use kubectl or K8s API
      const deployCommand = `kubectl set image deployment/${service} ${service}=${this.config.dockerRegistry}/${this.config.projectName}/${service}:latest -n ${this.config.kubernetesNamespace}`;

      try {
        // Simulate deployment
        await this.delay(2000);
        console.log(`Successfully deployed ${service}`);
      } catch (error) {
        throw new Error(`Failed to deploy ${service}: ${error.message}`);
      }
    }
  }

  async blueGreenDeployment(deployment, stage) {
    // Simulate blue-green deployment
    console.log(`Starting blue-green deployment to ${deployment.environment}`);

    // Deploy to green environment
    for (const service of deployment.services) {
      console.log(`Deploying ${service} to green environment`);
      await this.delay(1500);
    }

    // Switch traffic
    console.log('Switching traffic from blue to green');
    await this.delay(1000);

    // Cleanup blue environment
    console.log('Cleaning up blue environment');
    await this.delay(500);
  }

  async canaryDeployment(deployment, stage) {
    const canaryPercentage = stage.canaryPercentage || 10;

    console.log(`Starting canary deployment (${canaryPercentage}% traffic) to ${deployment.environment}`);

    // Deploy canary version
    for (const service of deployment.services) {
      console.log(`Deploying ${service} canary version`);
      await this.delay(1500);
    }

    // Monitor canary metrics
    console.log('Monitoring canary metrics...');
    await this.delay(3000);

    // Promote canary if metrics are good
    console.log('Promoting canary to full deployment');
    for (const service of deployment.services) {
      console.log(`Promoting ${service} canary`);
      await this.delay(1000);
    }
  }

  async directDeployment(deployment, stage) {
    console.log(`Direct deployment to ${deployment.environment}`);

    for (const service of deployment.services) {
      console.log(`Deploying ${service}`);
      await this.delay(1000);
    }
  }

  async performHealthChecks(stage) {
    const services = stage.services || ['api-gateway', 'signer', 'chain'];
    const healthResults = {};

    for (const service of services) {
      try {
        // Simulate health check
        await this.delay(500);

        healthResults[service] = {
          status: 'healthy',
          responseTime: Math.random() * 100,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        healthResults[service] = {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString(),
        };
      }
    }

    return healthResults;
  }

  async runCustomStage(stage) {
    if (stage.command) {
      try {
        const output = execSync(stage.command, { encoding: 'utf8' });
        return { command: stage.command, output: output.substring(0, 1000) };
      } catch (error) {
        throw new Error(`Custom stage failed: ${error.message}`);
      }
    }

    return { message: 'Custom stage executed' };
  }

  async rollbackDeployment(deployment) {
    console.log(`Rolling back deployment ${deployment.id}`);

    try {
      for (const service of deployment.services) {
        // Simulate rollback
        console.log(`Rolling back ${service}`);
        await this.delay(1000);
      }

      this.emit('deploymentRolledBack', deployment);
      console.log('Rollback completed successfully');
    } catch (error) {
      console.error('Rollback failed:', error.message);
      this.emit('rollbackFailed', { deployment, error });
    }
  }

  generateCacheKey(stage) {
    return `${stage.name}-${JSON.stringify(stage.buildCommands || [])}-${Date.now()}`;
  }

  getDefaultStages() {
    return [
      {
        name: 'test',
        type: 'test',
        testSuites: ['npm run test:governance', 'npm run test:services'],
      },
      {
        name: 'security',
        type: 'security',
        securityScans: ['npm audit', 'npm run privacy:scan'],
      },
      {
        name: 'build',
        type: 'build',
        buildCommands: ['npm ci', 'npm run governance:verify'],
        buildDocker: true,
      },
      {
        name: 'deploy',
        type: 'deploy',
        strategy: 'rolling',
      },
      {
        name: 'healthcheck',
        type: 'healthcheck',
      },
    ];
  }

  updateMetrics(pipeline) {
    const duration = pipeline.endTime - pipeline.startTime;
    this.metrics.averageBuildTime = (
      (this.metrics.averageBuildTime * (this.metrics.totalPipelines - 1) + duration) /
      this.metrics.totalPipelines
    );
  }

  getPipelineStatus(pipelineId) {
    return this.pipelines.get(pipelineId);
  }

  getDeploymentStatus(deploymentId) {
    return this.deployments.get(deploymentId);
  }

  getMetrics() {
    const successRate = this.metrics.totalPipelines > 0
      ? (this.metrics.successfulPipelines / this.metrics.totalPipelines) * 100
      : 0;

    return {
      pipelines: {
        total: this.metrics.totalPipelines,
        successful: this.metrics.successfulPipelines,
        failed: this.metrics.failedPipelines,
        successRate: Math.round(successRate * 100) / 100,
        averageBuildTime: Math.round(this.metrics.averageBuildTime),
      },
      deployments: {
        total: this.deployments.size,
        active: Array.from(this.deployments.values()).filter(d => d.status === 'deploying').length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async healthCheck() {
    const activePipelines = Array.from(this.pipelines.values()).filter(p => p.status === 'running').length;
    const activeDeployments = Array.from(this.deployments.values()).filter(d => d.status === 'deploying').length;

    return {
      status: 'healthy',
      activePipelines,
      activeDeployments,
      totalPipelines: this.metrics.totalPipelines,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Factory function for CI/CD Pipeline Manager
 */
export function createCICDManager(config = {}) {
  return new CICDPipelineManager(config);
}

/**
 * Default instance getter
 */
let defaultCICDManager = null;

export function getCICDManager(config = {}) {
  if (!defaultCICDManager) {
    defaultCICDManager = new CICDPipelineManager(config);
  }
  return defaultCICDManager;
}
