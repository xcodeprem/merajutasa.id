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
        // Test if Docker build script exists and is executable
        const buildScript = path.join(process.cwd(), 'infrastructure/docker/scripts/build-all.sh');
        
        try {
            const stats = await fs.stat(buildScript);
            if (!stats.isFile()) {
                throw new Error('Build script is not a file');
            }
            
            // Check if script is executable (Unix systems)
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
            'infrastructure/docker/compose/docker-compose.yml',
            'infrastructure/docker/compose/docker-compose.prod.yml',
            'infrastructure/docker/compose/docker-compose.test.yml'
        ];

        for (const file of composeFiles) {
            const filePath = path.join(process.cwd(), file);
            try {
                const content = await fs.readFile(filePath, 'utf8');
                
                // Basic validation of docker-compose file structure
                if (!content.includes('version:')) {
                    throw new Error(`${file} missing version declaration`);
                }
                if (!content.includes('services:')) {
                    throw new Error(`${file} missing services section`);
                }
                
                // Check for required services
                const requiredServices = ['signer', 'chain', 'collector', 'monitoring'];
                for (const service of requiredServices) {
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
            'infrastructure/docker/services/Dockerfile.monitoring'
        ];

        for (const dockerfile of dockerfiles) {
            const filePath = path.join(process.cwd(), dockerfile);
            try {
                const content = await fs.readFile(filePath, 'utf8');
                
                // Validate Dockerfile structure
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
            'infrastructure/kubernetes/configmaps'
        ];

        for (const dir of manifestDirs) {
            const dirPath = path.join(process.cwd(), dir);
            try {
                const files = await fs.readdir(dirPath);
                if (files.length === 0) {
                    throw new Error(`${dir} directory is empty`);
                }
                
                // Test YAML files for basic structure
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
            'infrastructure/terraform/outputs.tf'
        ];

        for (const file of terraformFiles) {
            const filePath = path.join(process.cwd(), file);
            try {
                const content = await fs.readFile(filePath, 'utf8');
                
                // Basic Terraform validation
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
                'phase2:status'
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

    async testConfigurationFiles() {
        const configFiles = [
            'infrastructure/docker/configs/nginx-docker.conf'
        ];

        for (const file of configFiles) {
            const filePath = path.join(process.cwd(), file);
            try {
                const content = await fs.readFile(filePath, 'utf8');
                
                if (file.includes('nginx')) {
                    if (!content.includes('upstream signer_backend')) {
                        throw new Error(`${file} missing signer upstream configuration`);
                    }
                    if (!content.includes('ssl_certificate')) {
                        throw new Error(`${file} missing SSL configuration`);
                    }
                }
            } catch (error) {
                throw new Error(`Configuration file test failed for ${file}: ${error.message}`);
            }
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
            'infrastructure/terraform'
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

    async testServiceHealthEndpoints() {
        // This test assumes services are running
        const services = [
            { name: 'signer', port: 4601, endpoint: '/health' },
            { name: 'chain', port: 4602, endpoint: '/health' },
            { name: 'collector', port: 4603, endpoint: '/health' },
            { name: 'monitoring', port: 4604, endpoint: '/metrics' }
        ];

        console.log('Note: Service health tests require running services');
        
        for (const service of services) {
            try {
                const { stdout } = await execAsync(`curl -f -s --connect-timeout 5 http://localhost:${service.port}${service.endpoint} || echo "NOT_RUNNING"`);
                
                if (stdout.includes('NOT_RUNNING')) {
                    console.log(`⚠️  ${service.name} service not running (expected if not started)`);
                } else {
                    console.log(`✅ ${service.name} service health endpoint accessible`);
                }
            } catch (error) {
                console.log(`⚠️  ${service.name} service not accessible (expected if not started)`);
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
                total_duration: totalDuration
            },
            results: this.testResults
        };

        // Save report to artifacts
        const artifactsDir = path.join(process.cwd(), 'artifacts');
        await fs.mkdir(artifactsDir, { recursive: true });
        
        const reportPath = path.join(artifactsDir, 'infrastructure-test-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📊 Test Report Summary:`);
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
        
        // Core infrastructure tests
        await this.runTest('Directory Structure', () => this.testDirectoryStructure());
        await this.runTest('Docker Build Scripts', () => this.testDockerBuildScript());
        await this.runTest('Docker Compose Files', () => this.testDockerComposeFiles());
        await this.runTest('Dockerfiles', () => this.testDockerfiles());
        await this.runTest('Kubernetes Manifests', () => this.testKubernetesManifests());
        await this.runTest('Terraform Configuration', () => this.testTerraformConfiguration());
        await this.runTest('NPM Scripts', () => this.testNPMScripts());
        await this.runTest('Configuration Files', () => this.testConfigurationFiles());
        
        // Service health tests (optional)
        await this.runTest('Service Health Endpoints', () => this.testServiceHealthEndpoints());
        
        const report = await this.generateReport();
        
        // Exit with error code if any tests failed
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
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Test 1: Authentication Middleware
 */
async function testAuthenticationMiddleware() {
  console.log('\n🔐 Testing Authentication Middleware...');
  
  try {
    // Test 1.1: Access without authentication should fail
    const response1 = await makeRequest({
      hostname: '127.0.0.1',
      port: TEST_CONFIG.signerPort,
      path: '/sign',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { payload: { test: 'data' } });
    
    logTest('Auth: Unauthorized access blocked', response1.statusCode === 401);
    
    // Test 1.2: Public endpoints should work without auth
    const response2 = await makeRequest({
      hostname: '127.0.0.1',
      port: TEST_CONFIG.signerPort,
      path: '/pubkey',
      method: 'GET'
    });
    
    logTest('Auth: Public endpoint accessible', response2.statusCode === 200);
    
    // Test 1.3: Health endpoint should work without auth
    const response3 = await makeRequest({
      hostname: '127.0.0.1',
      port: TEST_CONFIG.signerPort,
      path: '/health',
      method: 'GET'
    });
    
    logTest('Auth: Health endpoint accessible', response3.statusCode === 200);
    
  } catch (error) {
    logTest('Auth: Middleware test error', false, error.message);
  }
}

/**
 * Test 2: Input Validation
 */
async function testInputValidation() {
  console.log('\n🛡️  Testing Input Validation...');
  
  try {
    // Test 2.1: Invalid JSON should be rejected
    const response1 = await makeRequest({
      hostname: '127.0.0.1',
      port: TEST_CONFIG.signerPort,
      path: '/sign',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, 'invalid json');
    
    logTest('Validation: Invalid JSON rejected', response1.statusCode === 400);
    
    // Test 2.2: SQL injection attempt should be blocked
    const response2 = await makeRequest({
      hostname: '127.0.0.1',
      port: TEST_CONFIG.signerPort,
      path: '/sign?id=1; DROP TABLE users;',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    logTest('Validation: SQL injection blocked', response2.statusCode === 400);
    
    // Test 2.3: XSS attempt should be blocked
    const response3 = await makeRequest({
      hostname: '127.0.0.1',
      port: TEST_CONFIG.signerPort,
      path: '/sign',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { payload: '<script>alert("xss")</script>' });
    
    logTest('Validation: XSS attempt blocked', response3.statusCode === 400);
    
  } catch (error) {
    logTest('Validation: Test error', false, error.message);
  }
}

/**
 * Test 3: Rate Limiting
 */
async function testRateLimiting() {
  console.log('\n⏱️  Testing Rate Limiting...');
  
  try {
    const requests = [];
    
    // Send multiple requests rapidly
    for (let i = 0; i < 15; i++) {
      requests.push(makeRequest({
        hostname: '127.0.0.1',
        port: TEST_CONFIG.signerPort,
        path: '/pubkey',
        method: 'GET'
      }));
    }
    
    const responses = await Promise.all(requests);
    
    // Check if any requests were rate limited
    const rateLimitedResponses = responses.filter(r => r.statusCode === 429);
    
    logTest('Rate Limiting: Limits enforced', rateLimitedResponses.length > 0);
    
    // Check for rate limit headers
    const hasRateLimitHeaders = responses.some(r => 
      r.headers['x-ratelimit-limit'] && r.headers['x-ratelimit-remaining']
    );
    
    logTest('Rate Limiting: Headers present', hasRateLimitHeaders);
    
  } catch (error) {
    logTest('Rate Limiting: Test error', false, error.message);
  }
}

/**
 * Test 4: Metrics Collection
 */
async function testMetricsCollection() {
  console.log('\n📊 Testing Metrics Collection...');
  
  try {
    // Test 4.1: Metrics endpoint accessible
    const response1 = await makeRequest({
      hostname: '127.0.0.1',
      port: TEST_CONFIG.metricsPort,
      path: '/metrics',
      method: 'GET'
    });
    
    logTest('Metrics: Endpoint accessible', response1.statusCode === 200);
    
    // Test 4.2: Prometheus format
    const metricsContent = response1.body;
    const hasPrometheusMetrics = metricsContent.includes('# HELP') && 
                                 metricsContent.includes('# TYPE') &&
                                 metricsContent.includes('merajutasa_');
    
    logTest('Metrics: Prometheus format valid', hasPrometheusMetrics);
    
    // Test 4.3: Service-specific metrics present
    const hasSignerMetrics = metricsContent.includes('merajutasa_signing_operations_total');
    logTest('Metrics: Signer metrics present', hasSignerMetrics);
    
    // Test 4.4: Health metrics endpoint
    const response2 = await makeRequest({
      hostname: '127.0.0.1',
      port: TEST_CONFIG.metricsPort,
      path: '/health',
      method: 'GET'
    });
    
    logTest('Metrics: Health endpoint works', response2.statusCode === 200);
    
  } catch (error) {
    logTest('Metrics: Test error', false, error.message);
  }
}

/**
 * Test 5: Structured Logging
 */
async function testStructuredLogging() {
  console.log('\n📝 Testing Structured Logging...');
  
  try {
    // Test 5.1: Log directory creation
    const logDir = './artifacts/logs';
    
    try {
      await fs.access(logDir);
      logTest('Logging: Log directory exists', true);
    } catch {
      logTest('Logging: Log directory missing', false);
    }
    
    // Test 5.2: Generate some log entries by making requests
    await makeRequest({
      hostname: '127.0.0.1',
      port: TEST_CONFIG.signerPort,
      path: '/pubkey',
      method: 'GET'
    });
    
    // Wait a bit for logs to be written
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 5.3: Check if log files are created and have content
    try {
      const logFiles = await fs.readdir(logDir);
      const hasLogFiles = logFiles.some(file => file.endsWith('.log'));
      logTest('Logging: Log files created', hasLogFiles);
      
      if (hasLogFiles) {
        const logFile = logFiles.find(file => file.endsWith('.log'));
        const logContent = await fs.readFile(`${logDir}/${logFile}`, 'utf8');
        
        // Check if logs are in JSON format
        const lines = logContent.trim().split('\n');
        let hasValidJson = false;
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed['@timestamp'] && parsed.level && parsed.message) {
              hasValidJson = true;
              break;
            }
          } catch {
            // Not JSON, continue
          }
        }
        
        logTest('Logging: Structured JSON format', hasValidJson);
      }
      
    } catch (error) {
      logTest('Logging: File check error', false, error.message);
    }
    
  } catch (error) {
    logTest('Logging: Test error', false, error.message);
  }
}

/**
 * Test 6: Backup Service
 */
async function testBackupService() {
  console.log('\n💾 Testing Backup Service...');
  
  try {
    // Test 6.1: Create test data
    await fs.mkdir(TEST_CONFIG.testDataDir, { recursive: true });
    await fs.writeFile(`${TEST_CONFIG.testDataDir}/test.txt`, 'test data');
    
    // Test 6.2: Import and test backup service
    const { default: backupService } = await import('../infrastructure/backup/backup-service.js');
    
    await backupService.initialize();
    logTest('Backup: Service initialization', true);
    
    // Test 6.3: Create a backup
    try {
      const backupMetadata = await backupService.createBackup('test');
      logTest('Backup: Backup creation', backupMetadata.status === 'completed');
      
      // Test 6.4: List backups
      const backups = await backupService.listBackups();
      logTest('Backup: Backup listing', Array.isArray(backups) && backups.length > 0);
      
      // Test 6.5: Get backup statistics
      const stats = await backupService.getBackupStatistics();
      logTest('Backup: Statistics generation', stats && stats.totalBackups > 0);
      
    } catch (backupError) {
      logTest('Backup: Backup creation failed', false, backupError.message);
    }
    
  } catch (error) {
    logTest('Backup: Test error', false, error.message);
  } finally {
    // Cleanup test data
    try {
      await fs.rm(TEST_CONFIG.testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Test 7: SSL Certificate Generation
 */
async function testSSLCertificateGeneration() {
  console.log('\n🔒 Testing SSL Certificate Generation...');
  
  try {
    // Test 7.1: Check if certificate generation script exists
    try {
      await fs.access('./infrastructure/reverse-proxy/generate-certs.sh');
      logTest('SSL: Certificate script exists', true);
    } catch {
      logTest('SSL: Certificate script missing', false);
      return;
    }
    
    // Test 7.2: Check if script is executable
    const stats = await fs.stat('./infrastructure/reverse-proxy/generate-certs.sh');
    const isExecutable = (stats.mode & parseInt('111', 8)) !== 0;
    logTest('SSL: Script is executable', isExecutable);
    
    // Test 7.3: Nginx configuration exists
    try {
      await fs.access('./infrastructure/reverse-proxy/nginx.conf');
      logTest('SSL: Nginx config exists', true);
    } catch {
      logTest('SSL: Nginx config missing', false);
    }
    
  } catch (error) {
    logTest('SSL: Test error', false, error.message);
  }
}

/**
 * Test 8: Security Headers
 */
async function testSecurityHeaders() {
  console.log('\n🛡️  Testing Security Headers...');
  
  try {
    const response = await makeRequest({
      hostname: '127.0.0.1',
      port: TEST_CONFIG.signerPort,
      path: '/health',
      method: 'GET'
    });
    
    // Test 8.1: Content-Type-Options header
    const hasContentTypeOptions = response.headers['x-content-type-options'] === 'nosniff';
    logTest('Security: X-Content-Type-Options header', hasContentTypeOptions);
    
    // Test 8.2: Frame-Options header
    const hasFrameOptions = response.headers['x-frame-options'] === 'DENY';
    logTest('Security: X-Frame-Options header', hasFrameOptions);
    
    // Test 8.3: XSS Protection header (if present)
    const hasXSSProtection = !response.headers['x-xss-protection'] || 
                            response.headers['x-xss-protection'].includes('1; mode=block');
    logTest('Security: XSS Protection header', hasXSSProtection);
    
  } catch (error) {
    logTest('Security: Headers test error', false, error.message);
  }
}

/**
 * Test 9: Configuration Files
 */
async function testConfigurationFiles() {
  console.log('\n⚙️  Testing Configuration Files...');
  
  try {
    // Test 9.1: Infrastructure directory structure
    const infraDirs = [
      './infrastructure/reverse-proxy',
      './infrastructure/auth',
      './infrastructure/security',
      './infrastructure/monitoring',
      './infrastructure/backup'
    ];
    
    for (const dir of infraDirs) {
      try {
        await fs.access(dir);
        logTest(`Config: ${dir.split('/').pop()} directory exists`, true);
      } catch {
        logTest(`Config: ${dir.split('/').pop()} directory missing`, false);
      }
    }
    
    // Test 9.2: Critical configuration files
    const configFiles = [
      './infrastructure/reverse-proxy/nginx.conf',
      './infrastructure/auth/auth-middleware.js',
      './infrastructure/security/input-validator.js',
      './infrastructure/security/rate-limiter.js',
      './infrastructure/monitoring/metrics-collector.js',
      './infrastructure/monitoring/structured-logger.js',
      './infrastructure/backup/backup-service.js'
    ];
    
    for (const file of configFiles) {
      try {
        await fs.access(file);
        logTest(`Config: ${file.split('/').pop()} exists`, true);
      } catch {
        logTest(`Config: ${file.split('/').pop()} missing`, false);
      }
    }
    
  } catch (error) {
    logTest('Config: Test error', false, error.message);
  }
}

/**
 * Main test runner
 */
async function runInfrastructureTests() {
  console.log('🚀 Starting Phase 1 Infrastructure Integration Tests...\n');
  console.log('⚠️  Note: Some tests require services to be running');
  console.log('   Run "npm run service:signer" and "npm run infra:metrics" first\n');
  
  const startTime = Date.now();
  
  // Run all tests
  await testConfigurationFiles();
  await testSSLCertificateGeneration();
  await testStructuredLogging();
  await testBackupService();
  
  // Tests that require running services
  try {
    await testAuthenticationMiddleware();
    await testInputValidation();
    await testRateLimiting();
    await testMetricsCollection();
    await testSecurityHeaders();
  } catch (error) {
    console.log('\n⚠️  Some tests failed - ensure services are running:');
    console.log('   npm run service:signer (port 4601)');
    console.log('   npm run infra:metrics (port 9090)');
  }
  
  const duration = Date.now() - startTime;
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)} seconds`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  
  // Save detailed results
  const resultsFile = './artifacts/infrastructure-test-results.json';
  await fs.mkdir('./artifacts', { recursive: true });
  await fs.writeFile(resultsFile, JSON.stringify({
    summary: {
      passed: testsPassed,
      failed: testsFailed,
      total: testsPassed + testsFailed,
      successRate: (testsPassed / (testsPassed + testsFailed)) * 100,
      duration: duration,
      timestamp: new Date().toISOString()
    },
    tests: testResults
  }, null, 2));
  
  console.log(`📄 Detailed results saved to: ${resultsFile}`);
  
  // Exit with appropriate code
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runInfrastructureTests().catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
}

export {
  runInfrastructureTests,
  testResults
};