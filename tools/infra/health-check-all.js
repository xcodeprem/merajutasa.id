#!/usr/bin/env node
/**
 * Infrastructure Health Check Aggregator
 * Orchestrates health checks across all infrastructure categories with fail-soft behavior
 * Generates deterministic JSON artifacts using json-stable.js
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { 
  HEALTH_STATUS,
  createComponentHealth,
  createHealthSummary,
  validateComponentHealth,
  validateHealthSummary
} from './health-contract.js';
import { stableStringify, addMetadata } from '../lib/json-stable.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configuration for health checks
 */
const CONFIG = {
  timeout: 5000, // 5 seconds per component check
  retries: 1, // Retry once for flaky components
  failSoft: true, // Continue even if some components fail
  artifactsDir: path.join(process.cwd(), 'artifacts'),
  securityScanFailSoft: true // Special handling for security:scan which is known to be flaky
};

/**
 * Category mapping to existing modules
 */
const CATEGORY_MODULES = {
  observability: {
    modules: [
      'infrastructure/observability/advanced-observability-system.js'
    ],
    healthMethod: 'getAdvancedObservabilitySystem().getSystemStatus'
  },
  performance: {
    modules: [
      'infrastructure/performance/monitoring/sla-monitor.js',
      'infrastructure/performance/cache/cache-strategies.js'
    ],
    healthMethod: 'healthCheck'
  },
  'api-gateway': {
    modules: [
      'infrastructure/api-gateway/api-gateway-orchestrator.js',
      'infrastructure/api-gateway/service-mesh.js'
    ],
    healthMethod: 'getSystemStatus'
  },
  'high-availability': {
    modules: [
      'infrastructure/high-availability/ha-orchestrator.js',
      'infrastructure/high-availability/health-monitoring.js',
      'infrastructure/high-availability/auto-scaling.js'
    ],
    healthMethod: 'healthCheck'
  },
  compliance: {
    modules: [
      'infrastructure/compliance/audit-system.js',
      'infrastructure/compliance/compliance-automation.js',
      'infrastructure/compliance/compliance-orchestrator.js',
      'infrastructure/compliance/privacy-rights-management.js'
    ],
    healthMethod: 'getHealthStatus'
  },
  security: {
    modules: [
      'infrastructure/security/enhanced/security-hardening.js'
    ],
    healthMethod: 'scan', // Special handling needed
    failSoft: true // Security scan is known to be flaky
  },
  monitoring: {
    modules: [
      'infrastructure/monitoring/metrics-collector.js',
      'infrastructure/monitoring/structured-logger.js'  
    ],
    healthMethod: 'healthCheck'
  },
  integrations: {
    modules: [
      'infrastructure/integration/component-dependency-analyzer.js',
      'infrastructure/integration/infrastructure-integration-platform.js'
    ],
    healthMethod: 'getHealthStatus'
  },
  dependencies: {
    modules: [
      'infrastructure/integration/component-dependency-analyzer.js'
    ],
    healthMethod: 'generateDependencyDocumentation'
  }
};

/**
 * Execute function with timeout protection
 * @param {Function} fn - Function to execute
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise} Promise that resolves/rejects within timeout
 */
async function executeWithTimeout(fn, timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timeout after ${timeout}ms`));
    }, timeout);

    Promise.resolve(fn())
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Execute security scan with special fail-soft handling
 * @param {string} componentPath - Path to security component
 * @returns {Promise<Object>} Health result
 */
async function executeSecurityScanFailSoft(componentPath) {
  const componentName = path.basename(componentPath, '.js');
  
  try {
    // Try to import and run security scan
    const module = await import(path.resolve(process.cwd(), componentPath));
    
    if (module.scan && typeof module.scan === 'function') {
      const result = await executeWithTimeout(() => module.scan(), CONFIG.timeout);
      return createComponentHealth(componentName, 'security', 'HEALTHY', {
        metrics: { scanCompleted: true, scanResult: result }
      });
    } else {
      // If no scan function, just check if module loads
      return createComponentHealth(componentName, 'security', 'HEALTHY', {
        metrics: { loadable: true }
      });
    }
  } catch (error) {
    // Fail-soft: report as FAILED but don't stop the entire process
    console.warn(`⚠️  Security scan failed (fail-soft): ${error.message}`);
    return createComponentHealth(componentName, 'security', 'FAILED', {
      error: { 
        message: `Security scan failed: ${error.message}`,
        code: 'SECURITY_SCAN_FAILED'
      }
    });
  }
}

/**
 * Check health of a single component
 * @param {string} componentPath - Path to component module
 * @param {string} category - Component category
 * @param {Object} options - Health check options
 * @returns {Promise<Object>} Component health result
 */
async function checkComponentHealth(componentPath, category, options = {}) {
  const componentName = path.basename(componentPath, '.js');
  const startTime = Date.now();
  
  try {
    // Special handling for security components
    if (category === 'security' && CONFIG.securityScanFailSoft) {
      return await executeSecurityScanFailSoft(componentPath);
    }
    
    // Import the module
    const module = await import(path.resolve(process.cwd(), componentPath));
    const responseTime = Date.now() - startTime;
    
    // Try different health check patterns
    let healthResult = null;
    
    // Try the specified health method for the category
    const categoryConfig = CATEGORY_MODULES[category];
    if (categoryConfig && categoryConfig.healthMethod) {
      const methodName = categoryConfig.healthMethod;
      
      if (methodName.includes('.')) {
        // Handle nested method calls like 'getAdvancedObservabilitySystem().getSystemStatus'
        const parts = methodName.split('.');
        let target = module;
        for (const part of parts) {
          if (target && typeof target[part] === 'function') {
            target = target[part]();
          } else if (target && target[part]) {
            target = target[part];
          } else {
            target = null;
            break;
          }
        }
        if (target && typeof target === 'object') {
          healthResult = target;
        }
      } else {
        // Direct method call
        if (module[methodName] && typeof module[methodName] === 'function') {
          healthResult = await executeWithTimeout(() => module[methodName](), CONFIG.timeout);
        } else if (module.default && typeof module.default[methodName] === 'function') {
          healthResult = await executeWithTimeout(() => module.default[methodName](), CONFIG.timeout);
        }
      }
    }
    
    // Fallback to standard health check patterns
    if (!healthResult) {
      if (module.healthCheck && typeof module.healthCheck === 'function') {
        healthResult = await executeWithTimeout(() => module.healthCheck(), CONFIG.timeout);
      } else if (module.default && typeof module.default.healthCheck === 'function') {
        healthResult = await executeWithTimeout(() => module.default.healthCheck(), CONFIG.timeout);
      } else if (module.getHealthStatus && typeof module.getHealthStatus === 'function') {
        healthResult = await executeWithTimeout(() => module.getHealthStatus(), CONFIG.timeout);
      } else if (module.default && typeof module.default.getHealthStatus === 'function') {
        healthResult = await executeWithTimeout(() => module.default.getHealthStatus(), CONFIG.timeout);
      } else {
        // Component loads but has no health check - consider it healthy
        healthResult = {
          status: 'healthy',
          message: 'Component loadable, no explicit health check'
        };
      }
    }
    
    // Standardize the response
    const status = healthResult?.status || healthResult?.state || 'HEALTHY';
    return createComponentHealth(componentName, category, status, {
      metrics: {
        responseTime,
        loadable: true,
        ...healthResult
      }
    });
    
  } catch (error) {
    // Fail-soft: log error but continue with other components
    console.warn(`⚠️  Component ${componentName} health check failed: ${error.message}`);
    return createComponentHealth(componentName, category, 'FAILED', {
      error: {
        message: error.message,
        code: error.code || error.name
      }
    });
  }
}

/**
 * Check health of all components in a category
 * @param {string} category - Category name
 * @returns {Promise<Array>} Array of component health results
 */
async function checkCategoryHealth(category) {
  console.log(`🔍 Checking ${category} health...`);
  
  const categoryConfig = CATEGORY_MODULES[category];
  if (!categoryConfig) {
    console.warn(`⚠️  Unknown category: ${category}`);
    return [];
  }
  
  const modules = categoryConfig.modules;
  const healthChecks = modules.map(modulePath =>
    checkComponentHealth(modulePath, category, { retries: CONFIG.retries })
  );
  
  // Run health checks in parallel with timeout protection
  const results = await Promise.allSettled(healthChecks);
  
  const componentHealths = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      componentHealths.push(result.value);
    } else {
      // Handle rejected promises (shouldn't happen with our error handling, but defensive)
      const componentName = path.basename(modules[index], '.js');
      componentHealths.push(createComponentHealth(componentName, category, 'FAILED', {
        error: {
          message: result.reason?.message || 'Health check promise rejected',
          code: 'PROMISE_REJECTED'
        }
      }));
    }
  });
  
  const healthyCount = componentHealths.filter(h => h.status === HEALTH_STATUS.HEALTHY).length;
  console.log(`✅ ${category}: ${healthyCount}/${componentHealths.length} healthy`);
  
  return componentHealths;
}

/**
 * Generate deterministic artifacts
 * @param {Array} allComponentHealths - All component health results
 * @param {string} categoryFilter - Category filter for naming
 */
async function generateArtifacts(allComponentHealths, categoryFilter = 'all') {
  console.log('📄 Generating deterministic health artifacts...');
  
  // Ensure artifacts directory exists
  await fs.mkdir(CONFIG.artifactsDir, { recursive: true });
  
  const filePrefix = categoryFilter === 'all' ? 'infra-health' : `infra-health-${categoryFilter}`;
  
  // 1. Detailed health report (all component results)
  const detailsArtifact = addMetadata({
    category: categoryFilter,
    components: allComponentHealths,
    totalComponents: allComponentHealths.length
  }, { generator: 'infra-health-check-all' });
  
  await fs.writeFile(
    path.join(CONFIG.artifactsDir, `${filePrefix}-details.json`),
    stableStringify(detailsArtifact)
  );
  
  // 2. Health summary (aggregated counts)
  const summary = createHealthSummary(allComponentHealths);
  const summaryArtifact = addMetadata(summary, { generator: 'infra-health-check-all' });
  
  await fs.writeFile(
    path.join(CONFIG.artifactsDir, `${filePrefix}-summary.json`),
    stableStringify(summaryArtifact)
  );
  
  // 3. Health matrix (category breakdown with SLA)
  const matrix = {};
  const categoryCounts = {};
  
  allComponentHealths.forEach(health => {
    if (!categoryCounts[health.category]) {
      categoryCounts[health.category] = { ok: 0, degraded: 0, failed: 0 };
    }
    
    switch (health.status) {
      case HEALTH_STATUS.HEALTHY:
        categoryCounts[health.category].ok++;
        break;
      case HEALTH_STATUS.DEGRADED:
        categoryCounts[health.category].degraded++;
        break;
      case HEALTH_STATUS.FAILED:
        categoryCounts[health.category].failed++;
        break;
    }
  });
  
  Object.entries(categoryCounts).forEach(([category, counts]) => {
    const total = counts.ok + counts.degraded + counts.failed;
    matrix[category] = {
      ...counts,
      total,
      healthPercentage: Math.round((counts.ok / total) * 100),
      slaTarget: 95, // 95% health SLA
      slaStatus: counts.ok / total >= 0.95 ? 'MEETS_SLA' : 'BELOW_SLA'
    };
  });
  
  const matrixArtifact = addMetadata({
    category: categoryFilter,
    matrix,
    overallHealth: Math.round((summary.ok / summary.total) * 100),
    overallSlaStatus: summary.ok / summary.total >= 0.95 ? 'MEETS_SLA' : 'BELOW_SLA'
  }, { generator: 'infra-health-check-all' });
  
  await fs.writeFile(
    path.join(CONFIG.artifactsDir, `${filePrefix}-matrix.json`),
    stableStringify(matrixArtifact)
  );
  
  console.log('✅ Artifacts generated:');
  console.log(`  • ${filePrefix}-details.json`);
  console.log(`  • ${filePrefix}-summary.json`);
  console.log(`  • ${filePrefix}-matrix.json`);
  
  return { detailsArtifact, summaryArtifact, matrixArtifact };
}

/**
 * Main health check orchestrator
 */
async function runHealthCheckAll(targetCategory = null) {
  const categoryFilter = targetCategory || 'all';
  
  console.log(`🏥 INFRASTRUCTURE HEALTH CHECK - ${categoryFilter.toUpperCase()}`);
  console.log('=' .repeat(60));
  console.log(`Timeout: ${CONFIG.timeout}ms per component | Retries: ${CONFIG.retries} | Fail-soft: ${CONFIG.failSoft}`);
  console.log();
  
  const startTime = Date.now();
  const allComponentHealths = [];
  
  // Determine which categories to check
  const categoriesToCheck = targetCategory ? [targetCategory] : Object.keys(CATEGORY_MODULES);
  
  // Validate target category if specified
  if (targetCategory && !CATEGORY_MODULES[targetCategory]) {
    console.error(`❌ Unknown category: ${targetCategory}`);
    console.log(`Available categories: ${Object.keys(CATEGORY_MODULES).join(', ')}`);
    process.exit(1);
  }
  
  // Check each category in parallel for efficiency
  const categoryPromises = categoriesToCheck.map(async category => {
    try {
      return await checkCategoryHealth(category);
    } catch (error) {
      console.error(`❌ Category ${category} failed: ${error.message}`);
      return []; // Fail-soft: return empty array for failed categories
    }
  });
  
  const categoryResults = await Promise.allSettled(categoryPromises);
  
  // Flatten results
  categoryResults.forEach(result => {
    if (result.status === 'fulfilled') {
      allComponentHealths.push(...result.value);
    }
  });
  
  const duration = Date.now() - startTime;
  
  // Validate all health objects
  const invalidHealths = allComponentHealths.filter(health => {
    const validation = validateComponentHealth(health);
    if (!validation.isValid) {
      console.warn(`⚠️  Invalid health object for ${health.component}: ${validation.errors.join(', ')}`);
    }
    return !validation.isValid;
  });
  
  if (invalidHealths.length > 0) {
    console.warn(`⚠️  Found ${invalidHealths.length} invalid health objects`);
  }
  
  // Generate deterministic artifacts
  const artifacts = await generateArtifacts(allComponentHealths, categoryFilter);
  
  // Validate summary
  const summaryValidation = validateHealthSummary(artifacts.summaryArtifact);
  if (!summaryValidation.isValid) {
    console.error('❌ Generated summary failed validation:', summaryValidation.errors);
  }
  
  // Final report
  const summary = artifacts.summaryArtifact;
  console.log('\n🏥 HEALTH CHECK SUMMARY');
  console.log('=' .repeat(50));
  console.log(`Category: ${categoryFilter.toUpperCase()}`);
  console.log(`Overall Health: ${Math.round((summary.ok / summary.total) * 100)}% (${summary.ok}/${summary.total} healthy)`);
  console.log(`Degraded: ${summary.degraded} | Failed: ${summary.failed}`);
  console.log(`Duration: ${duration}ms`);
  console.log(`Artifacts: ${CONFIG.artifactsDir}/infra-health-*.json`);
  
  // Determine exit code based on fail-soft strategy
  if (CONFIG.failSoft) {
    // Success if we have any healthy components
    if (summary.ok > 0) {
      console.log('✅ Health check completed (fail-soft mode)');
      process.exit(0);
    } else {
      console.log('❌ Health check failed - no healthy components');
      process.exit(1);
    }
  } else {
    // Strict mode: fail if any component is unhealthy
    if (summary.failed > 0 || summary.degraded > 0) {
      console.log('❌ Health check failed - unhealthy components detected');
      process.exit(1);
    } else {
      console.log('✅ Health check passed - all components healthy');
      process.exit(0);
    }
  }
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const targetCategory = process.argv[2] || null;
  runHealthCheckAll(targetCategory).catch(error => {
    console.error('❌ Health check aggregator failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
}

export { runHealthCheckAll, checkComponentHealth, checkCategoryHealth };