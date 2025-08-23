import { getAPIGateway } from './api-gateway-core.js';
import { getServiceMesh } from './service-mesh.js';
import { getOpenAPISystem } from './openapi-documentation.js';
import { getCICDManager } from '../cicd/pipeline-manager.js';
import { EventEmitter } from 'events';

/**
 * API Gateway & Management Orchestrator
 * Unified system that coordinates API Gateway, Service Mesh,
 * CI/CD pipelines, and documentation generation
 */
export class APIGatewayOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      serviceName: 'api-gateway-orchestrator',
      gatewayPort: 8080,
      enableAutoDiscovery: true,
      enableHealthChecking: true,
      enableMetrics: true,
      enableDocumentation: true,
      enableCICD: true,
      services: {
        signer: { host: 'localhost', port: 4601 },
        chain: { host: 'localhost', port: 4602 },
        collector: { host: 'localhost', port: 4603 },
      },
      ...config,
    };

    this.components = {};
    this.status = 'initializing';
    this.startTime = new Date();
    this.metrics = {
      totalRequests: 0,
      totalServices: 0,
      totalPipelines: 0,
      uptime: 0,
    };

    this.initializeComponents();
  }

  async initializeComponents() {
    try {
      // Initialize API Gateway
      this.components.gateway = getAPIGateway({
        port: this.config.gatewayPort,
        name: 'merajutasa-api-gateway',
        enableMetrics: this.config.enableMetrics,
        auth: { enabled: true, allowedApiKeys: ['dev-key'] },
        authz: {
          enabled: true,
          serviceRoles: {
            collector: ['ingest:write'],
            chain: ['append:write'],
            signer: ['sign:write'],
          },
        },
        validation: {
          enabled: true,
          serviceSchemas: {
            collector: {
              type: 'object',
              required: ['event'],
              properties: {
                event: {
                  type: 'object',
                  required: ['event_name', 'occurred_at'],
                  properties: {
                    event_name: { type: 'string', minLength: 1 },
                    occurred_at: { type: 'string' },
                    received_at: { type: 'string' },
                    meta: { type: 'object' },
                  },
                  additionalProperties: true,
                },
              },
              additionalProperties: false,
            },
          },
        },
        mtls: { enabled: false, simulateHeader: 'x-client-cert' },
      });

      // Initialize Service Mesh
      this.components.serviceMesh = getServiceMesh({
        serviceName: this.config.serviceName,
        enableMetrics: this.config.enableMetrics,
      });

      // Initialize OpenAPI Documentation
      if (this.config.enableDocumentation) {
        this.components.documentation = getOpenAPISystem({
          title: 'MerajutASA.id API Gateway',
          version: '1.0.0',
        });
      }

      // Initialize CI/CD Manager
      if (this.config.enableCICD) {
        this.components.cicd = getCICDManager({
          projectName: 'merajutasa-id',
          enableAutoDeployment: false,
        });
      }

      this.status = 'initialized';
      this.emit('componentsInitialized');

    } catch (error) {
      this.status = 'failed';
      this.emit('initializationFailed', error);
      throw error;
    }
  }

  /**
   * Start the complete API Gateway system
   */
  async start() {
    if (this.status !== 'initialized') {
      await this.initializeComponents();
    }

    try {
      // Register services with gateway and service mesh
      await this.registerServices();

      // Start API Gateway
      await this.components.gateway.start();

      // Generate API documentation
      if (this.components.documentation) {
        await this.components.documentation.generateDocumentation();
      }

      // Setup health checking
      if (this.config.enableHealthChecking) {
        this.startHealthChecking();
      }

      // Setup metrics collection
      if (this.config.enableMetrics) {
        this.startMetricsCollection();
      }

      this.status = 'running';
      this.emit('systemStarted');

      console.log('🚀 API Gateway Orchestrator started successfully');
      console.log(`📊 Gateway: http://localhost:${this.config.gatewayPort}`);
      console.log(`📚 Documentation: http://localhost:${this.config.gatewayPort}/docs`);
      console.log(`🔍 Health: http://localhost:${this.config.gatewayPort}/health`);

      return this;

    } catch (error) {
      this.status = 'failed';
      this.emit('startupFailed', error);
      throw error;
    }
  }

  async registerServices() {
    for (const [serviceName, serviceConfig] of Object.entries(this.config.services)) {
      try {
        // Register with API Gateway
        this.components.gateway.registerService(serviceName, {
          ...serviceConfig,
          version: 'v1',
          healthPath: '/health',
        });

        // Register with Service Mesh
        const instanceId = this.components.serviceMesh.registerService(serviceName, {
          ...serviceConfig,
          healthPath: '/health',
          weight: 1,
        });

        console.log(`✅ Registered service: ${serviceName} (${instanceId})`);
        this.metrics.totalServices++;

      } catch (error) {
        console.error(`❌ Failed to register service ${serviceName}:`, error.message);
      }
    }

    this.emit('servicesRegistered', { count: this.metrics.totalServices });
  }

  startHealthChecking() {
    setInterval(async () => {
      await this.performSystemHealthCheck();
    }, 30000); // Every 30 seconds
  }

  startMetricsCollection() {
    setInterval(() => {
      this.collectMetrics();
    }, 10000); // Every 10 seconds
  }

  async performSystemHealthCheck() {
    try {
      const results = {
        gateway: await this.components.gateway.getHealthStatus(),
        serviceMesh: await this.components.serviceMesh.healthCheck(),
        documentation: this.components.documentation ?
          await this.components.documentation.healthCheck() : null,
        cicd: this.components.cicd ?
          await this.components.cicd.healthCheck() : null,
      };

      const allHealthy = Object.values(results)
        .filter(r => r !== null)
        .every(r => r.status === 'healthy');

      if (!allHealthy) {
        this.emit('healthCheckFailed', results);
      }

      return results;
    } catch (error) {
      this.emit('healthCheckError', error);
      return { error: error.message };
    }
  }

  collectMetrics() {
    try {
      const gatewayMetrics = this.components.gateway.getMetrics();
      const meshMetrics = this.components.serviceMesh.getMetrics();

      this.metrics = {
        ...this.metrics,
        totalRequests: gatewayMetrics.gateway.requests,
        uptime: Date.now() - this.startTime.getTime(),
        gateway: gatewayMetrics,
        serviceMesh: meshMetrics,
        timestamp: new Date().toISOString(),
      };

      this.emit('metricsUpdated', this.metrics);
    } catch (error) {
      this.emit('metricsError', error);
    }
  }

  /**
   * Execute a CI/CD pipeline
   */
  async deployServices(pipelineConfig = {}) {
    if (!this.components.cicd) {
      throw new Error('CI/CD component not enabled');
    }

    const defaultPipeline = {
      name: 'API Gateway Deployment',
      branch: 'main',
      environment: 'development',
      stages: [
        {
          name: 'test',
          type: 'test',
          testSuites: ['npm run test:infrastructure', 'npm run test:services'],
        },
        {
          name: 'build',
          type: 'build',
          buildCommands: ['npm ci'],
          buildDocker: true,
          dockerImages: [
            { name: 'api-gateway', dockerfile: 'infrastructure/docker/Dockerfile.gateway' },
          ],
        },
        {
          name: 'deploy',
          type: 'deploy',
          strategy: 'rolling',
          services: Object.keys(this.config.services),
        },
        {
          name: 'healthcheck',
          type: 'healthcheck',
          services: Object.keys(this.config.services),
        },
      ],
    };

    const pipeline = { ...defaultPipeline, ...pipelineConfig };

    try {
      const result = await this.components.cicd.executePipeline(pipeline);
      this.metrics.totalPipelines++;
      this.emit('deploymentCompleted', result);
      return result;
    } catch (error) {
      this.emit('deploymentFailed', error);
      throw error;
    }
  }

  /**
   * Register a new service dynamically
   */
  async registerNewService(serviceName, serviceConfig) {
    try {
      // Add to configuration
      this.config.services[serviceName] = serviceConfig;

      // Register with gateway and service mesh
      this.components.gateway.registerService(serviceName, {
        ...serviceConfig,
        version: 'v1',
        healthPath: '/health',
      });

      const instanceId = this.components.serviceMesh.registerService(serviceName, {
        ...serviceConfig,
        healthPath: '/health',
        weight: 1,
      });

      // Update documentation
      if (this.components.documentation) {
        await this.components.documentation.generateDocumentation();
      }

      this.metrics.totalServices++;
      this.emit('serviceAdded', { serviceName, instanceId });

      console.log(`✅ Dynamically registered service: ${serviceName}`);
      return instanceId;

    } catch (error) {
      this.emit('serviceRegistrationFailed', { serviceName, error });
      throw error;
    }
  }

  /**
   * Remove a service
   */
  async deregisterService(serviceName) {
    try {
      // Get service instances
      const instances = this.components.serviceMesh.services.get(serviceName);

      if (instances) {
        // Remove all instances
        for (const instance of instances) {
          this.components.serviceMesh.deregisterService(serviceName, instance.id);
        }
      }

      // Remove from configuration
      delete this.config.services[serviceName];

      // Update documentation
      if (this.components.documentation) {
        await this.components.documentation.generateDocumentation();
      }

      this.metrics.totalServices--;
      this.emit('serviceRemoved', { serviceName });

      console.log(`🗑️ Deregistered service: ${serviceName}`);
      return true;

    } catch (error) {
      this.emit('serviceDeregistrationFailed', { serviceName, error });
      throw error;
    }
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus() {
    const uptime = Date.now() - this.startTime.getTime();

    const status = {
      orchestrator: {
        status: this.status,
        uptime: uptime,
        version: '1.0.0',
        startTime: this.startTime.toISOString(),
      },
      components: {
        gateway: this.components.gateway ? await this.components.gateway.getHealthStatus() : null,
        serviceMesh: this.components.serviceMesh ? await this.components.serviceMesh.healthCheck() : null,
        documentation: this.components.documentation ? await this.components.documentation.healthCheck() : null,
        cicd: this.components.cicd ? await this.components.cicd.healthCheck() : null,
      },
      services: {
        registered: Object.keys(this.config.services),
        count: this.metrics.totalServices,
      },
      metrics: this.metrics,
      timestamp: new Date().toISOString(),
    };

    return status;
  }

  /**
   * Get unified metrics from all components
   */
  getUnifiedMetrics() {
    return {
      orchestrator: {
        uptime: Date.now() - this.startTime.getTime(),
        totalServices: this.metrics.totalServices,
        totalPipelines: this.metrics.totalPipelines,
        status: this.status,
      },
      gateway: this.components.gateway ? this.components.gateway.getMetrics() : null,
      serviceMesh: this.components.serviceMesh ? this.components.serviceMesh.getMetrics() : null,
      cicd: this.components.cicd ? this.components.cicd.getMetrics() : null,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Graceful shutdown
   */
  async stop() {
    console.log('🛑 Stopping API Gateway Orchestrator...');

    try {
      // Stop components
      if (this.components.gateway) {
        await this.components.gateway.stop();
      }

      if (this.components.serviceMesh) {
        await this.components.serviceMesh.stop();
      }

      this.status = 'stopped';
      this.emit('systemStopped');

      console.log('✅ API Gateway Orchestrator stopped successfully');
    } catch (error) {
      console.error('❌ Error during shutdown:', error.message);
      this.emit('shutdownError', error);
    }
  }
}

/**
 * Factory function for API Gateway Orchestrator
 */
export function createAPIGatewayOrchestrator(config = {}) {
  return new APIGatewayOrchestrator(config);
}

/**
 * Default instance getter
 */
let defaultOrchestrator = null;

export function getAPIGatewayOrchestrator(config = {}) {
  if (!defaultOrchestrator) {
    defaultOrchestrator = new APIGatewayOrchestrator(config);
  }
  return defaultOrchestrator;
}
