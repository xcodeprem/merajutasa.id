#!/usr/bin/env node

/**
 * Phase 2 Week 5 Interactive Demo
 * Demonstrates High Availability & Infrastructure Resilience capabilities
 */

import { getHighAvailabilityOrchestrator } from '../infrastructure/high-availability/ha-orchestrator.js';

async function runPhase2Week5Demo() {
  console.log('🚀 Phase 2 Week 5: High Availability & Infrastructure Resilience Demo\n');
  console.log('This demo showcases enterprise-grade high availability capabilities:\n');

  let haOrchestrator;

  try {
    // Initialize High Availability Orchestrator
    console.log('🎯 Step 1: Initializing High Availability Orchestrator...');
    haOrchestrator = getHighAvailabilityOrchestrator({
      orchestratorName: 'merajutasa-ha-demo',
      coordinationInterval: 10000, // 10 seconds for demo
      emergencyResponseEnabled: true,
    });

    await haOrchestrator.initialize();
    console.log('✅ High Availability Orchestrator initialized with 5 components\n');

    // Register demo services
    console.log('🔧 Step 2: Registering demo services...');
    await haOrchestrator.registerService('demo-api', {
      url: 'http://localhost:8080',
      critical: true,
      healthMonitoring: {
        healthEndpoint: '/health',
        timeout: 5000,
        customChecks: [
          { name: 'database-check', type: 'database-connection' },
          { name: 'memory-check', type: 'memory-usage', threshold: 80 },
        ],
      },
      autoScaling: {
        minInstances: 2,
        maxInstances: 20,
        targetCPU: 70,
      },
    });

    await haOrchestrator.registerService('demo-worker', {
      url: 'http://localhost:8081',
      critical: false,
      healthMonitoring: {
        healthEndpoint: '/health',
      },
      autoScaling: {
        minInstances: 1,
        maxInstances: 10,
        targetCPU: 80,
      },
    });

    console.log('✅ Registered 2 demo services\n');

    // Demonstrate Multi-Region Deployment
    console.log('🌍 Step 3: Demonstrating Multi-Region Deployment...');
    const deployment = await haOrchestrator.components.multiRegionDeployment.deployToRegions({
      strategy: 'blue-green',
      version: 'v1.5.0',
      services: ['demo-api', 'demo-worker'],
      regions: ['us-east-1', 'us-west-2'],
    });
    console.log(`✅ Multi-region deployment completed: ${deployment.id}`);
    console.log(`   Duration: ${deployment.duration}ms, Status: ${deployment.status}\n`);

    // Demonstrate Disaster Recovery
    console.log('💾 Step 4: Demonstrating Disaster Recovery...');
    const backup = await haOrchestrator.components.disasterRecovery.createFullBackup({
      triggered: 'demo',
    });
    console.log(`✅ Full backup created: ${backup.id}`);
    console.log(`   Size: ${Math.round(backup.totalSize / 1024 / 1024)}MB, Components: ${backup.components.size}\n`);

    // Demonstrate Auto-Scaling
    console.log('📈 Step 5: Demonstrating Auto-Scaling...');
    await haOrchestrator.components.autoScaling.registerService('demo-api', {
      minInstances: 2,
      maxInstances: 15,
      targetCPU: 70,
      predictiveScalingEnabled: true,
    });

    const scalingStatus = await haOrchestrator.components.autoScaling.getScalingStatus();
    console.log(`✅ Auto-scaling configured for ${Object.keys(scalingStatus.services).length} services`);
    console.log(`   Predictive scaling: ${scalingStatus.system.predictiveScalingEnabled ? 'enabled' : 'disabled'}\n`);

    // Demonstrate Fault Tolerance
    console.log('🔧 Step 6: Demonstrating Fault Tolerance...');
    const faultTolerance = haOrchestrator.components.faultTolerance;

    // Create circuit breaker
    faultTolerance.createCircuitBreaker('demo-api-circuit', {
      failureThreshold: 3,
      resetTimeout: 30000,
    });

    // Create retry manager
    faultTolerance.createRetryManager('demo-retry', {
      maxRetries: 3,
      retryDelay: 1000,
    });

    // Create bulkhead
    faultTolerance.createBulkhead('demo-bulkhead', {
      maxConcurrentCalls: 10,
      queueSize: 50,
    });

    const faultStatus = await faultTolerance.getFaultToleranceStatus();
    console.log('✅ Fault tolerance systems configured:');
    console.log(`   Circuit breakers: ${faultStatus.circuitBreakers.total}`);
    console.log(`   Retry managers: ${faultStatus.retryManagers.total}`);
    console.log(`   Bulkheads: ${faultStatus.bulkheads.total}\n`);

    // Demonstrate Health Monitoring
    console.log('❤️ Step 7: Demonstrating Health Monitoring...');
    const healthMonitoring = haOrchestrator.components.healthMonitoring;

    healthMonitoring.registerService('demo-api', {
      url: 'http://localhost:8080',
      healthEndpoint: '/health',
      customChecks: [
        { name: 'db-connection', type: 'database-connection' },
        { name: 'api-performance', type: 'api-endpoint', threshold: 500 },
      ],
    });

    // Wait for health checks
    await sleep(3000);

    const healthStatus = await healthMonitoring.getHealthStatus();
    console.log(`✅ Health monitoring active for ${healthStatus.systemSummary.totalServices} services`);
    console.log(`   Healthy services: ${healthStatus.systemSummary.healthyServices}/${healthStatus.systemSummary.totalServices}`);
    console.log(`   Active alerts: ${healthStatus.systemSummary.totalActiveAlerts}\n`);

    // Demonstrate Emergency Response
    console.log('🚨 Step 8: Demonstrating Emergency Response...');

    // Simulate a critical alert
    const mockAlert = {
      id: 'demo-alert-1',
      serviceName: 'demo-api',
      type: 'consecutive-failures',
      severity: 'critical',
      message: 'Demo service has 5 consecutive failures',
      value: 5,
      threshold: 3,
    };

    const emergencyResponse = await haOrchestrator.initiateEmergencyResponse(mockAlert);
    console.log(`✅ Emergency response initiated: ${emergencyResponse.id}`);
    console.log(`   Actions executed: ${emergencyResponse.actions.length}`);
    console.log(`   Status: ${emergencyResponse.status}\n`);

    // System Status Summary
    console.log('📊 Step 9: System Status Summary...');
    const systemStatus = await haOrchestrator.getSystemStatus();

    console.log(`✅ Overall System Health: ${systemStatus.systemHealth.overallHealth.toUpperCase()}`);
    console.log(`   Health Percentage: ${Math.round(systemStatus.systemHealth.healthPercentage)}%`);
    console.log(`   Components: ${systemStatus.systemHealth.totalComponents} (${systemStatus.systemHealth.healthyComponents} healthy)`);
    console.log(`   Services: ${systemStatus.services.length}`);
    console.log(`   Emergency Actions: ${systemStatus.emergencyActions}\n`);

    // Demonstrate Coordination
    console.log('🎼 Step 10: Demonstrating Component Coordination...');
    console.log('   Orchestrator continuously coordinates between components');
    console.log('   - Health monitoring triggers auto-scaling');
    console.log('   - Circuit breakers trigger failover');
    console.log('   - Backup failures trigger emergency response');
    console.log('   - All events are correlated and managed centrally\n');

    // Performance Metrics
    console.log('📈 Performance Metrics:');
    const metrics = systemStatus.metrics;
    if (metrics) {
      console.log(`   Orchestrator uptime: ${Math.round(metrics.orchestrator.uptime / 1000)}s`);
      console.log(`   Coordination cycles: ${metrics.orchestrator.coordinationCycles}`);
      console.log(`   Emergency actions: ${metrics.orchestrator.emergencyActions}`);
    }

    console.log('\n🎉 Demo completed successfully!');
    console.log('\nPhase 2 Week 5 High Availability capabilities demonstrated:');
    console.log('  ✅ Multi-region deployment with blue-green strategy');
    console.log('  ✅ Automated disaster recovery and backup');
    console.log('  ✅ Intelligent auto-scaling with predictive analytics');
    console.log('  ✅ Comprehensive fault tolerance (circuit breakers, retries, bulkheads)');
    console.log('  ✅ Real-time health monitoring with custom checks');
    console.log('  ✅ Emergency response automation');
    console.log('  ✅ Centralized orchestration and coordination');

    return {
      success: true,
      components: Object.keys(haOrchestrator.components).length,
      services: systemStatus.services.length,
      systemHealth: systemStatus.systemHealth.overallHealth,
      deploymentId: deployment.id,
      backupId: backup.id,
      emergencyResponseId: emergencyResponse.id,
    };

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error('Stack trace:', error.stack);
    return { success: false, error: error.message };
  } finally {
    // Cleanup
    if (haOrchestrator) {
      console.log('\n🧹 Cleaning up demo resources...');
      haOrchestrator.destroy();
      console.log('✅ Cleanup completed');
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPhase2Week5Demo()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 Demo completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Demo failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Demo execution failed:', error);
      process.exit(1);
    });
}

export { runPhase2Week5Demo };
