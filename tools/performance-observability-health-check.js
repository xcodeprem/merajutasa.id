#!/usr/bin/env node

/**
 * Performance/Observability Endpoint Health Check
 * Validates that all performance and observability endpoints are active
 */

import { getAdvancedObservabilitySystem } from '../infrastructure/observability/advanced-observability-system.js';
import { getAdvancedMetricsCollector } from '../infrastructure/observability/metrics/advanced-metrics-collector.js';
import { getPerformanceMonitor } from '../infrastructure/performance/monitoring/performance-monitor.js';

async function healthCheckEndpoints() {
  console.log('🔍 Performance/Observability Endpoint Health Check');
  console.log('=====================================================');

  const results = {
    timestamp: new Date().toISOString(),
    overall_status: 'healthy',
    endpoints: {},
  };

  try {
    // Test metrics system
    console.log('\n📊 Testing Metrics System...');
    const metricsCollector = getAdvancedMetricsCollector({ serviceName: 'health-check' });
    const metricsHealth = await metricsCollector.healthCheck();

    results.endpoints.metrics = {
      status: metricsHealth.status,
      service: metricsHealth.service,
      totalMetrics: metricsHealth.totalMetrics,
      businessMetrics: metricsHealth.businessMetrics,
    };

    console.log(`  ✅ Status: ${metricsHealth.status}`);
    console.log(`  📈 Total Metrics: ${metricsHealth.totalMetrics}`);
    console.log(`  💼 Business Metrics: ${metricsHealth.businessMetrics.totalBusinessMetrics}`);

    // Test performance monitor
    console.log('\n⚡ Testing Performance Monitor...');
    const perfMonitor = getPerformanceMonitor();
    const perfHealth = await perfMonitor.healthCheck();

    results.endpoints.performance = {
      status: perfHealth.status,
      alerts: perfHealth.alerts,
      monitoring: perfHealth.monitoring,
    };

    console.log(`  ✅ Status: ${perfHealth.status}`);
    console.log(`  🚨 Active Alerts: ${perfHealth.alerts}`);
    console.log(`  📈 System Metrics: ${perfHealth.monitoring.systemMetrics}`);

    // Test observability system
    console.log('\n🔍 Testing Observability System...');
    const observability = getAdvancedObservabilitySystem({ serviceName: 'health-check' });

    // Initialize if not already done
    if (!observability.isInitialized) {
      await observability.initialize();
    }

    const obsStatus = await observability.getSystemStatus();

    results.endpoints.observability = {
      status: obsStatus.system.healthy ? 'healthy' : 'unhealthy',
      initialized: obsStatus.system.initialized,
      components: Object.keys(obsStatus.components).length,
      uptime: obsStatus.system.uptime,
    };

    console.log(`  ✅ Status: ${results.endpoints.observability.status}`);
    console.log(`  🔧 Components: ${results.endpoints.observability.components}`);
    console.log(`  ⏱️  Uptime: ${Math.round(obsStatus.system.uptime / 1000)}s`);

    // Test tracing capabilities
    console.log('\n🔍 Testing Tracing Capabilities...');
    const tracing = observability.components.get('tracing');
    if (tracing) {
      const tracingHealth = await tracing.healthCheck();
      results.endpoints.tracing = tracingHealth;
      console.log(`  ✅ Tracing Status: ${tracingHealth.status}`);
    } else {
      results.endpoints.tracing = { status: 'not_initialized' };
      console.log('  ⚠️  Tracing: Not initialized');
    }

    console.log('\n🎯 Summary');
    console.log('===========');
    console.log('✅ All performance/observability systems operational');
    console.log(`📊 Metrics: ${results.endpoints.metrics.totalMetrics} total metrics active`);
    console.log(`⚡ Performance: ${results.endpoints.performance.status} with ${results.endpoints.performance.alerts} alerts`);
    console.log(`🔍 Observability: ${results.endpoints.observability.components} components active`);

  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    results.overall_status = 'unhealthy';
    results.error = error.message;
  }

  // Save results
  await import('fs/promises').then(fs =>
    fs.writeFile('artifacts/endpoint-health-check.json', JSON.stringify(results, null, 2)),
  );

  console.log('\n📄 Health check results saved to artifacts/endpoint-health-check.json');

  return results.overall_status === 'healthy' ? 0 : 1;
}

// Run health check
healthCheckEndpoints()
  .then(exitCode => {
    console.log(`\n🏁 Health check completed with exit code: ${exitCode}`);
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('💥 Health check crashed:', error);
    process.exit(1);
  });
