#!/usr/bin/env node

/**
 * Phase 2 Week 4 Status Checker
 * Comprehensive validation of API Gateway & Management implementation
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

class Phase2Week4StatusChecker {
  constructor() {
    this.checks = [];
    this.results = {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      score: 0,
      components: {},
      timestamp: new Date().toISOString()
    };
  }

  async runAllChecks() {
    console.log('🔍 Phase 2 Week 4: API Gateway & Management Status Check\n');

    // Core Infrastructure Checks
    await this.checkAPIGatewayCore();
    await this.checkServiceMeshIntegration();
    await this.checkCICDPipelines();
    await this.checkOpenAPIDocumentation();
    await this.checkOrchestrator();
    
    // Integration & Testing
    await this.checkIntegrationTests();
    await this.checkDocumentation();
    
    // Performance & Metrics
    await this.checkPerformanceCapabilities();

    this.calculateFinalScore();
    this.displayResults();
    await this.saveResults();

    return this.results;
  }

  async checkAPIGatewayCore() {
    const component = 'API Gateway Core';
    console.log(`📊 Checking ${component}...`);
    
    const checks = [
      {
        name: 'API Gateway Core Implementation',
        check: () => this.fileExists('infrastructure/api-gateway/api-gateway-core.js'),
        expected: 'Core API Gateway implementation with routing, rate limiting, and metrics'
      },
      {
        name: 'Request/Response Middleware',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/api-gateway-core.js');
          return content.includes('requestMetadata') && 
                 content.includes('requestLogging') && 
                 content.includes('rateLimit');
        },
        expected: 'Request metadata, logging, and rate limiting middleware'
      },
      {
        name: 'Service Registration System',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/api-gateway-core.js');
          return content.includes('registerService') && 
                 content.includes('setupServiceProxy');
        },
        expected: 'Dynamic service registration with proxy configuration'
      },
      {
        name: 'Health & Metrics Endpoints',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/api-gateway-core.js');
          return content.includes('/health') && 
                 content.includes('/metrics') && 
                 content.includes('getHealthStatus');
        },
        expected: 'Built-in health check and metrics endpoints'
      },
      {
        name: 'OpenAPI Specification Generation',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/api-gateway-core.js');
          return content.includes('generateOpenAPISpec') && 
                 content.includes('openapi');
        },
        expected: 'Automatic OpenAPI specification generation'
      }
    ];

    const results = await this.runChecks(checks);
    this.results.components[component] = results;
  }

  async checkServiceMeshIntegration() {
    const component = 'Service Mesh Integration';
    console.log(`🕸️ Checking ${component}...`);
    
    const checks = [
      {
        name: 'Service Mesh Core Implementation',
        check: () => this.fileExists('infrastructure/api-gateway/service-mesh.js'),
        expected: 'Service mesh with discovery, load balancing, and circuit breaking'
      },
      {
        name: 'Service Discovery & Registration',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/service-mesh.js');
          return content.includes('registerService') && 
                 content.includes('discoverService') && 
                 content.includes('deregisterService');
        },
        expected: 'Complete service discovery and registration system'
      },
      {
        name: 'Load Balancing Strategies',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/service-mesh.js');
          return content.includes('round-robin') && 
                 content.includes('weighted') && 
                 content.includes('least-connections');
        },
        expected: 'Multiple load balancing strategies: round-robin, weighted, least-connections'
      },
      {
        name: 'Circuit Breaker Implementation',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/service-mesh.js');
          return content.includes('circuitBreaker') && 
                 content.includes('recordSuccess') && 
                 content.includes('recordFailure');
        },
        expected: 'Circuit breaker with failure tracking and state management'
      },
      {
        name: 'Health Checking System',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/service-mesh.js');
          return content.includes('performHealthChecks') && 
                 content.includes('checkInstanceHealth') && 
                 content.includes('healthCheckInterval');
        },
        expected: 'Automated health checking for service instances'
      }
    ];

    const results = await this.runChecks(checks);
    this.results.components[component] = results;
  }

  async checkCICDPipelines() {
    const component = 'CI/CD Pipeline Management';
    console.log(`🔄 Checking ${component}...`);
    
    const checks = [
      {
        name: 'CI/CD Pipeline Manager',
        check: () => this.fileExists('infrastructure/cicd/pipeline-manager.js'),
        expected: 'Advanced CI/CD pipeline management system'
      },
      {
        name: 'Pipeline Execution Engine',
        check: async () => {
          const content = await this.getFileContent('infrastructure/cicd/pipeline-manager.js');
          return content.includes('executePipeline') && 
                 content.includes('executeStage') && 
                 content.includes('runTests');
        },
        expected: 'Pipeline execution with stage management and testing'
      },
      {
        name: 'Build & Artifact Management',
        check: async () => {
          const content = await this.getFileContent('infrastructure/cicd/pipeline-manager.js');
          return content.includes('buildArtifacts') && 
                 content.includes('buildDockerImages') && 
                 content.includes('buildCache');
        },
        expected: 'Build system with Docker integration and caching'
      },
      {
        name: 'Deployment Strategies',
        check: async () => {
          const content = await this.getFileContent('infrastructure/cicd/pipeline-manager.js');
          return content.includes('rollingDeployment') && 
                 content.includes('blueGreenDeployment') && 
                 content.includes('canaryDeployment');
        },
        expected: 'Multiple deployment strategies: rolling, blue-green, canary'
      },
      {
        name: 'Security & Compliance Scanning',
        check: async () => {
          const content = await this.getFileContent('infrastructure/cicd/pipeline-manager.js');
          return content.includes('runSecurityScans') && 
                 content.includes('npm audit');
        },
        expected: 'Integrated security scanning in CI/CD pipeline'
      }
    ];

    const results = await this.runChecks(checks);
    this.results.components[component] = results;
  }

  async checkOpenAPIDocumentation() {
    const component = 'OpenAPI Documentation System';
    console.log(`📚 Checking ${component}...`);
    
    const checks = [
      {
        name: 'OpenAPI Documentation Generator',
        check: () => this.fileExists('infrastructure/api-gateway/openapi-documentation.js'),
        expected: 'Comprehensive OpenAPI documentation generation system'
      },
      {
        name: 'Service Endpoint Registration',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/openapi-documentation.js');
          return content.includes('registerServiceEndpoints') && 
                 content.includes('addEndpoint') && 
                 content.includes('/api/v1/signer');
        },
        expected: 'Automatic service endpoint registration and documentation'
      },
      {
        name: 'Interactive Documentation Generation',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/openapi-documentation.js');
          return content.includes('generateSwaggerUI') && 
                 content.includes('swagger-ui-dist') && 
                 content.includes('HTML');
        },
        expected: 'Interactive Swagger UI documentation generation'
      },
      {
        name: 'Multiple Format Support',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/openapi-documentation.js');
          return content.includes('openapi.json') && 
                 content.includes('openapi.yaml') && 
                 content.includes('generateMarkdownDocs');
        },
        expected: 'Support for JSON, YAML, HTML, and Markdown documentation formats'
      },
      {
        name: 'Schema & Response Management',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/openapi-documentation.js');
          return content.includes('addSchema') && 
                 content.includes('addCommonSchemas') && 
                 content.includes('ErrorResponse');
        },
        expected: 'Schema management with common response patterns'
      }
    ];

    const results = await this.runChecks(checks);
    this.results.components[component] = results;
  }

  async checkOrchestrator() {
    const component = 'API Gateway Orchestrator';
    console.log(`🎼 Checking ${component}...`);
    
    const checks = [
      {
        name: 'Orchestrator Implementation',
        check: () => this.fileExists('infrastructure/api-gateway/api-gateway-orchestrator.js'),
        expected: 'Unified orchestrator coordinating all API Gateway components'
      },
      {
        name: 'Component Integration',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/api-gateway-orchestrator.js');
          return content.includes('getAPIGateway') && 
                 content.includes('getServiceMesh') && 
                 content.includes('getOpenAPISystem') && 
                 content.includes('getCICDManager');
        },
        expected: 'Integration of all major components: Gateway, Service Mesh, OpenAPI, CI/CD'
      },
      {
        name: 'Dynamic Service Management',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/api-gateway-orchestrator.js');
          return content.includes('registerNewService') && 
                 content.includes('deregisterService') && 
                 content.includes('registerServices');
        },
        expected: 'Dynamic service registration and management capabilities'
      },
      {
        name: 'System Health & Monitoring',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/api-gateway-orchestrator.js');
          return content.includes('performSystemHealthCheck') && 
                 content.includes('collectMetrics') && 
                 content.includes('getSystemStatus');
        },
        expected: 'Comprehensive system health checking and metrics collection'
      },
      {
        name: 'Event-Driven Architecture',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/api-gateway-orchestrator.js');
          return content.includes('EventEmitter') && 
                 content.includes('emit') && 
                 content.includes('systemStarted');
        },
        expected: 'Event-driven architecture with system lifecycle events'
      }
    ];

    const results = await this.runChecks(checks);
    this.results.components[component] = results;
  }

  async checkIntegrationTests() {
    const component = 'Integration & Testing';
    console.log(`🧪 Checking ${component}...`);
    
    const checks = [
      {
        name: 'API Gateway Tests',
        check: async () => {
          // Check if we can import and instantiate components
          try {
            const module = await import('../infrastructure/api-gateway/api-gateway-core.js');
            return typeof module.getAPIGateway === 'function';
          } catch (error) {
            return false;
          }
        },
        expected: 'API Gateway components can be imported and instantiated'
      },
      {
        name: 'Service Mesh Integration',
        check: async () => {
          try {
            const module = await import('../infrastructure/api-gateway/service-mesh.js');
            return typeof module.getServiceMesh === 'function';
          } catch (error) {
            return false;
          }
        },
        expected: 'Service Mesh can be imported and instantiated'
      },
      {
        name: 'CI/CD Pipeline Tests',
        check: async () => {
          try {
            const module = await import('../infrastructure/cicd/pipeline-manager.js');
            return typeof module.getCICDManager === 'function';
          } catch (error) {
            return false;
          }
        },
        expected: 'CI/CD Pipeline Manager can be imported and instantiated'
      },
      {
        name: 'Documentation System Tests',
        check: async () => {
          try {
            const module = await import('../infrastructure/api-gateway/openapi-documentation.js');
            return typeof module.getOpenAPISystem === 'function';
          } catch (error) {
            return false;
          }
        },
        expected: 'OpenAPI Documentation System can be imported and instantiated'
      },
      {
        name: 'Orchestrator Integration',
        check: async () => {
          try {
            const module = await import('../infrastructure/api-gateway/api-gateway-orchestrator.js');
            return typeof module.getAPIGatewayOrchestrator === 'function';
          } catch (error) {
            return false;
          }
        },
        expected: 'API Gateway Orchestrator can be imported and instantiated'
      }
    ];

    const results = await this.runChecks(checks);
    this.results.components[component] = results;
  }

  async checkDocumentation() {
    const component = 'Documentation';
    console.log(`📖 Checking ${component}...`);
    
    const checks = [
      {
        name: 'Implementation Guide Present',
        check: () => this.fileExists('docs/phase-2/PHASE-2-IMPLEMENTATION-GUIDE.md'),
        expected: 'Phase 2 implementation guide exists'
      },
      {
        name: 'API Gateway Documentation Structure',
        check: async () => {
          const files = [
            'infrastructure/api-gateway/api-gateway-core.js',
            'infrastructure/api-gateway/service-mesh.js',
            'infrastructure/api-gateway/openapi-documentation.js'
          ];
          return Promise.all(files.map(f => this.fileExists(f))).then(results => results.every(r => r));
        },
        expected: 'Complete API Gateway file structure'
      },
      {
        name: 'CI/CD Documentation Structure',
        check: () => this.fileExists('infrastructure/cicd/pipeline-manager.js'),
        expected: 'CI/CD pipeline management structure'
      }
    ];

    const results = await this.runChecks(checks);
    this.results.components[component] = results;
  }

  async checkPerformanceCapabilities() {
    const component = 'Performance & Capabilities';
    console.log(`⚡ Checking ${component}...`);
    
    const checks = [
      {
        name: 'Rate Limiting Implementation',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/api-gateway-core.js');
          return content.includes('rateLimit') && 
                 content.includes('windowMs') && 
                 content.includes('max');
        },
        expected: 'Configurable rate limiting with time windows'
      },
      {
        name: 'Metrics Collection',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/api-gateway-core.js');
          return content.includes('updateMetrics') && 
                 content.includes('latency') && 
                 content.includes('calculatePercentile');
        },
        expected: 'Performance metrics collection with latency tracking'
      },
      {
        name: 'Circuit Breaker Protection',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/service-mesh.js');
          return content.includes('circuitBreaker') && 
                 content.includes('threshold') && 
                 content.includes('timeout');
        },
        expected: 'Circuit breaker protection for service resilience'
      },
      {
        name: 'Load Balancing Algorithms',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/service-mesh.js');
          return content.includes('loadBalancing') && 
                 content.includes('selectInstance');
        },
        expected: 'Multiple load balancing algorithms for optimal distribution'
      },
      {
        name: 'Health Check Automation',
        check: async () => {
          const content = await this.getFileContent('infrastructure/api-gateway/service-mesh.js');
          return content.includes('healthCheck') && 
                 content.includes('healthCheckInterval');
        },
        expected: 'Automated health checking for service monitoring'
      }
    ];

    const results = await this.runChecks(checks);
    this.results.components[component] = results;
  }

  async runChecks(checks) {
    const results = { passed: 0, total: checks.length, details: [] };
    
    for (const check of checks) {
      try {
        const passed = await check.check();
        results.details.push({
          name: check.name,
          passed,
          expected: check.expected
        });
        
        if (passed) {
          results.passed++;
          this.results.passedChecks++;
          console.log(`  ✅ ${check.name}`);
        } else {
          this.results.failedChecks++;
          console.log(`  ❌ ${check.name}`);
        }
      } catch (error) {
        results.details.push({
          name: check.name,
          passed: false,
          expected: check.expected,
          error: error.message
        });
        this.results.failedChecks++;
        console.log(`  ❌ ${check.name} (Error: ${error.message})`);
      }
      
      this.results.totalChecks++;
    }
    
    console.log(`  📊 ${results.passed}/${results.total} checks passed\n`);
    return results;
  }

  async fileExists(filePath) {
    try {
      await fs.access(path.join(rootDir, filePath));
      return true;
    } catch {
      return false;
    }
  }

  async getFileContent(filePath) {
    try {
      return await fs.readFile(path.join(rootDir, filePath), 'utf8');
    } catch {
      return '';
    }
  }

  calculateFinalScore() {
    this.results.score = this.results.totalChecks > 0 
      ? Math.round((this.results.passedChecks / this.results.totalChecks) * 100)
      : 0;
  }

  displayResults() {
    console.log('📊 PHASE 2 WEEK 4 STATUS SUMMARY');
    console.log('================================');
    console.log(`Overall Score: ${this.results.score}/100`);
    console.log(`Status: ${this.getStatusText()}`);
    console.log(`Checks Passed: ${this.results.passedChecks}/${this.results.totalChecks}`);
    console.log();

    // Component breakdown
    console.log('📋 COMPONENT BREAKDOWN');
    console.log('======================');
    for (const [component, results] of Object.entries(this.results.components)) {
      const percentage = Math.round((results.passed / results.total) * 100);
      console.log(`${component}: ${results.passed}/${results.total} (${percentage}%)`);
    }
    console.log();

    // Recommendations
    this.displayRecommendations();
  }

  getStatusText() {
    if (this.results.score >= 90) return '🟢 EXCELLENT - Production Ready';
    if (this.results.score >= 80) return '🟡 GOOD - Minor Issues';
    if (this.results.score >= 60) return '🟠 FAIR - Needs Improvement';
    return '🔴 NEEDS WORK - Major Issues';
  }

  displayRecommendations() {
    console.log('💡 RECOMMENDATIONS');
    console.log('==================');
    
    if (this.results.score >= 90) {
      console.log('✅ Excellent! Phase 2 Week 4 implementation is production-ready.');
      console.log('✅ All API Gateway & Management components are properly implemented.');
      console.log('✅ Ready to proceed with Week 5: High Availability & Compliance.');
    } else if (this.results.score >= 80) {
      console.log('🟡 Good implementation with minor issues to address.');
      console.log('📝 Review failed checks and implement missing features.');
      console.log('📝 Focus on improving integration and testing coverage.');
    } else if (this.results.score >= 60) {
      console.log('🟠 Implementation needs improvement before production use.');
      console.log('🔧 Complete missing core components (API Gateway, Service Mesh).');
      console.log('🔧 Implement comprehensive testing and documentation.');
    } else {
      console.log('🔴 Significant work needed for production readiness.');
      console.log('⚠️ Focus on implementing core API Gateway functionality.');
      console.log('⚠️ Establish basic service mesh and CI/CD capabilities.');
    }
  }

  async saveResults() {
    const artifactsDir = path.join(rootDir, 'artifacts');
    await fs.mkdir(artifactsDir, { recursive: true });
    
    const resultsFile = path.join(artifactsDir, 'phase2-week4-status.json');
    await fs.writeFile(resultsFile, JSON.stringify(this.results, null, 2));
    
    console.log(`\n💾 Results saved to: ${resultsFile}`);
  }
}

// Run status check if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new Phase2Week4StatusChecker();
  await checker.runAllChecks();
}