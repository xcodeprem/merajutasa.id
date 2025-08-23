#!/usr/bin/env node

/**
 * Quick Phase 2 Week 5 Test
 * Simple verification that all components load correctly
 */

async function testPhase2Week5() {
  console.log('🔍 Quick Phase 2 Week 5 Test - Component Loading\n');

  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    overall: 'unknown',
  };

  try {
    // Test 1: Multi-Region Deployment
    console.log('1. Testing Multi-Region Deployment...');
    const { getMultiRegionDeployment } = await import('../infrastructure/high-availability/multi-region-deployment.js');
    const multiRegion = getMultiRegionDeployment();
    const mrHealth = await multiRegion.healthCheck();
    results.tests.push({
      name: 'Multi-Region Deployment',
      status: mrHealth.status,
      score: mrHealth.status === 'healthy' ? 100 : 50,
    });
    console.log(`   ✅ ${mrHealth.status}`);

    // Test 2: Disaster Recovery
    console.log('2. Testing Disaster Recovery...');
    const { getDisasterRecoverySystem } = await import('../infrastructure/high-availability/disaster-recovery.js');
    const dr = getDisasterRecoverySystem();
    const drHealth = await dr.healthCheck();
    results.tests.push({
      name: 'Disaster Recovery',
      status: drHealth.status,
      score: drHealth.status === 'healthy' ? 100 : drHealth.status === 'warning' ? 75 : 25,
    });
    console.log(`   ✅ ${drHealth.status}`);

    // Test 3: Auto-Scaling
    console.log('3. Testing Auto-Scaling...');
    const { getAutoScalingSystem } = await import('../infrastructure/high-availability/auto-scaling.js');
    const autoScaling = getAutoScalingSystem();
    const asHealth = await autoScaling.healthCheck();
    results.tests.push({
      name: 'Auto-Scaling',
      status: asHealth.status,
      score: asHealth.status === 'healthy' ? 100 : 50,
    });
    console.log(`   ✅ ${asHealth.status}`);

    // Test 4: Fault Tolerance
    console.log('4. Testing Fault Tolerance...');
    const { getFaultToleranceSystem } = await import('../infrastructure/high-availability/fault-tolerance.js');
    const faultTolerance = getFaultToleranceSystem();
    const ftHealth = await faultTolerance.healthCheck();
    results.tests.push({
      name: 'Fault Tolerance',
      status: ftHealth.status,
      score: ftHealth.status === 'healthy' ? 100 : 50,
    });
    console.log(`   ✅ ${ftHealth.status}`);

    // Test 5: Health Monitoring
    console.log('5. Testing Health Monitoring...');
    const { getHealthMonitoringSystem } = await import('../infrastructure/high-availability/health-monitoring.js');
    const healthMonitoring = getHealthMonitoringSystem();
    const hmHealth = await healthMonitoring.healthCheck();
    results.tests.push({
      name: 'Health Monitoring',
      status: hmHealth.status,
      score: hmHealth.status === 'healthy' ? 100 : 50,
    });
    console.log(`   ✅ ${hmHealth.status}`);

    // Test 6: HA Orchestrator (quick initialization)
    console.log('6. Testing HA Orchestrator...');
    const { getHighAvailabilityOrchestrator } = await import('../infrastructure/high-availability/ha-orchestrator.js');
    const haOrchestrator = getHighAvailabilityOrchestrator();
    // Don't fully initialize, just test component creation
    const haHealth = await haOrchestrator.healthCheck();
    results.tests.push({
      name: 'HA Orchestrator',
      status: haHealth.status,
      score: haHealth.status === 'healthy' ? 100 : 50,
    });
    console.log(`   ✅ ${haHealth.status}`);

    // Calculate overall score
    const totalScore = results.tests.reduce((sum, test) => sum + test.score, 0);
    const averageScore = totalScore / results.tests.length;

    results.overall = averageScore >= 90 ? 'excellent' :
      averageScore >= 80 ? 'good' :
        averageScore >= 70 ? 'acceptable' : 'needs-work';

    console.log('\n📊 Test Results:');
    results.tests.forEach(test => {
      const icon = test.score >= 90 ? '✅' : test.score >= 70 ? '⚠️' : '❌';
      console.log(`   ${icon} ${test.name}: ${test.score}/100 (${test.status})`);
    });

    console.log(`\n🎯 Overall: ${results.overall.toUpperCase()} (${Math.round(averageScore)}/100)`);

    if (averageScore >= 90) {
      console.log('🎉 Phase 2 Week 5: All components loaded successfully!');
    } else if (averageScore >= 70) {
      console.log('✅ Phase 2 Week 5: Components loaded with minor issues.');
    } else {
      console.log('❌ Phase 2 Week 5: Some components have issues.');
    }

    return { success: true, results, averageScore };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    results.overall = 'failed';
    results.error = error.message;
    return { success: false, results, averageScore: 0 };
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPhase2Week5()
    .then(result => {
      process.exit(result.success && result.averageScore >= 70 ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testPhase2Week5 };
