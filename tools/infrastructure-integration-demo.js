/**
 * Infrastructure Integration Test & Demo
 * Lead Infrastructure Architect: System integration demonstration
 *
 * Demonstrates the complete infrastructure integration platform capabilities
 */

import { getInfrastructureIntegrationPlatform } from '../infrastructure/integration/infrastructure-integration-platform.js';
import { getComponentDependencyAnalyzer } from '../infrastructure/integration/component-dependency-analyzer.js';

/**
 * Comprehensive Infrastructure Integration Demo
 */
async function runInfrastructureIntegrationDemo() {
  console.log('🚀 Starting Infrastructure Integration Platform Demo');
  console.log('=' .repeat(80));

  try {
    // 1. Initialize Integration Platform
    console.log('\n📋 Phase 1: Integration Platform Initialization');
    console.log('-'.repeat(50));

    const platform = getInfrastructureIntegrationPlatform();
    const initResult = await platform.initialize();

    console.log('✅ Platform initialized successfully');
    console.log(`   • Components discovered: ${initResult.components}`);
    console.log(`   • Dependencies mapped: ${initResult.dependencies}`);
    console.log(`   • Startup order calculated: ${initResult.startupOrder} components`);

    // 2. Get System Status
    console.log('\n📊 Phase 2: System Status Analysis');
    console.log('-'.repeat(50));

    const systemStatus = await platform.getSystemStatus();
    console.log(`Platform: ${systemStatus.platform.name}`);
    console.log(`Status: ${systemStatus.platform.initialized ? '✅ Operational' : '⏳ Initializing'}`);
    console.log(`Components: ${systemStatus.components.healthy}/${systemStatus.components.total} healthy`);
    console.log(`Dependencies: ${systemStatus.dependencies.totalRelationships} relationships`);
    console.log(`Data Flows: ${systemStatus.dataFlows.optimized}/${systemStatus.dataFlows.total} optimized`);
    console.log(`Health Score: ${((systemStatus.components.healthy / systemStatus.components.total) * 100).toFixed(1)}%`);

    // 3. Component Dependency Analysis
    console.log('\n🔍 Phase 3: Dependency Analysis');
    console.log('-'.repeat(50));

    const analyzer = getComponentDependencyAnalyzer();
    const analysisResult = await analyzer.initialize();

    console.log('✅ Dependency analysis completed');
    console.log(`   • Components analyzed: ${analysisResult.components}`);
    console.log(`   • Dependencies mapped: ${analysisResult.dependencies}`);
    console.log(`   • Circular dependencies: ${analysisResult.circularDependencies}`);
    console.log(`   • Critical paths: ${analysisResult.criticalPaths}`);
    console.log(`   • Startup phases: ${analysisResult.startupPhases}`);

    // 4. Startup Order Documentation
    console.log('\n📋 Phase 4: Startup Order Documentation');
    console.log('-'.repeat(50));

    const startupDoc = platform.getStartupOrderDocumentation();
    console.log(`Startup phases generated: ${startupDoc.phases.length}`);

    for (const phase of startupDoc.phases) {
      console.log(`\n   Phase ${phase.phase}: ${phase.description}`);
      console.log(`   Components: ${phase.components.join(', ')}`);
    }

    // 5. Health Check Demo
    console.log('\n🏥 Phase 5: Health Monitoring Demo');
    console.log('-'.repeat(50));

    const platformHealth = await platform.healthCheck();
    console.log(`Platform Health: ${platformHealth.status}`);
    console.log(`Components: ${platformHealth.components.healthy}/${platformHealth.components.discovered}`);
    console.log(`Coordination Cycles: ${platformHealth.platform.coordinationCycles}`);

    const analyzerHealth = await analyzer.healthCheck();
    console.log(`\nAnalyzer Health: ${analyzerHealth.status}`);
    console.log(`Analysis Health Score: ${analyzerHealth.analysis.healthScore}/100`);

    // 6. Optimization Recommendations
    console.log('\n💡 Phase 6: Optimization Recommendations');
    console.log('-'.repeat(50));

    const documentation = await analyzer.generateDependencyDocumentation();
    const recommendations = documentation.optimization_recommendations.priority_actions;

    console.log('Priority recommendations (showing top 5):');
    recommendations.slice(0, 5).forEach((rec, index) => {
      console.log(`\n   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.type}`);
      console.log(`      Issue: ${rec.issue}`);
      console.log(`      Recommendation: ${rec.recommendation}`);
    });

    // 7. Architecture Summary
    console.log('\n🏗️ Phase 7: Architecture Summary');
    console.log('-'.repeat(50));

    console.log(`System Health Score: ${documentation.executive_summary.health_score}/100`);
    console.log('\nArchitecture Highlights:');
    console.log(`✅ Unified integration platform managing ${documentation.executive_summary.total_components} components`);
    console.log(`✅ Comprehensive dependency analysis with ${documentation.executive_summary.total_dependencies} relationships`);
    console.log(`✅ Multi-phase startup with ${documentation.executive_summary.startup_phases} phases`);
    console.log(`${documentation.executive_summary.circular_dependencies > 0 ? '⚠️' : '✅'} Circular dependencies: ${documentation.executive_summary.circular_dependencies}`);
    console.log(`✅ Critical path analysis: ${documentation.executive_summary.critical_paths} paths identified`);

    // 8. Next Steps
    console.log('\n🎯 Phase 8: Next Steps & Recommendations');
    console.log('-'.repeat(50));

    console.log('Immediate Actions Required:');
    if (documentation.executive_summary.circular_dependencies > 0) {
      console.log(`🔴 1. Resolve ${documentation.executive_summary.circular_dependencies} circular dependencies`);
    }
    console.log('🟡 2. Implement dependency injection to reduce coupling');
    console.log('🟡 3. Add circuit breakers for critical components');
    console.log('🟢 4. Enable parallel component initialization');
    console.log('🟢 5. Enhance monitoring with dependency health dashboards');

    console.log('\n' + '='.repeat(80));
    console.log('🎉 Infrastructure Integration Platform Demo Completed Successfully!');
    console.log('='.repeat(80));

    return {
      platformInitialized: initResult.success,
      systemHealth: systemStatus,
      analysisCompleted: analysisResult.success,
      healthScore: documentation.executive_summary.health_score,
      totalComponents: documentation.executive_summary.total_components,
      totalDependencies: documentation.executive_summary.total_dependencies,
      circularDependencies: documentation.executive_summary.circular_dependencies,
      criticalPaths: documentation.executive_summary.critical_paths,
      startupPhases: documentation.executive_summary.startup_phases,
      recommendations: recommendations.length,
    };

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    throw error;
  }
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runInfrastructureIntegrationDemo()
    .then(result => {
      console.log('\n📊 Demo Results Summary:');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Demo execution failed:', error);
      process.exit(1);
    });
}

export default runInfrastructureIntegrationDemo;
