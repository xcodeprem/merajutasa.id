#!/usr/bin/env node

/**
 * Comprehensive Health Check System for MerajutASA.id
 * Checks health of all 35+ components across the infrastructure
 */

import { promises as fs } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// Import health check modules
const healthCheckModules = {
  // Core Services
  async signer() {
    try {
      const response = await fetch(`http://localhost:${process.env.SIGNER_PORT || 4601}/pubkey`);
      return {
        name: 'Signer Service',
        status: response.ok ? 'healthy' : 'degraded',
        health_score: response.ok ? 100 : 50,
        endpoint: `http://localhost:${process.env.SIGNER_PORT || 4601}`,
        details: { port: process.env.SIGNER_PORT || 4601 }
      };
    } catch (error) {
      return {
        name: 'Signer Service',
        status: 'critical',
        health_score: 0,
        error: error.message,
        details: { port: process.env.SIGNER_PORT || 4601 }
      };
    }
  },

  async chain() {
    try {
      const response = await fetch(`http://localhost:${process.env.CHAIN_PORT || 4602}/health`);
      return {
        name: 'Chain Service',
        status: response.ok ? 'healthy' : 'degraded',
        health_score: response.ok ? 100 : 50,
        endpoint: `http://localhost:${process.env.CHAIN_PORT || 4602}`,
        details: { port: process.env.CHAIN_PORT || 4602 }
      };
    } catch (error) {
      return {
        name: 'Chain Service',
        status: 'critical',
        health_score: 0,
        error: error.message,
        details: { port: process.env.CHAIN_PORT || 4602 }
      };
    }
  },

  async collector() {
    try {
      const response = await fetch(`http://localhost:${process.env.COLLECTOR_PORT || 4603}/health`);
      return {
        name: 'Collector Service',
        status: response.ok ? 'healthy' : 'degraded',
        health_score: response.ok ? 100 : 50,
        endpoint: `http://localhost:${process.env.COLLECTOR_PORT || 4603}`,
        details: { port: process.env.COLLECTOR_PORT || 4603 }
      };
    } catch (error) {
      return {
        name: 'Collector Service',
        status: 'critical',
        health_score: 0,
        error: error.message,
        details: { port: process.env.COLLECTOR_PORT || 4603 }
      };
    }
  },

  // Week 6 Compliance & Security Components
  async auditSystem() {
    try {
      const { getAuditSystem } = await import('../infrastructure/compliance/audit-system.js');
      const audit = getAuditSystem({ compliance_mode: 'strict', storage_path: '/tmp/health-check-audit' });
      const health = await audit.getHealthStatus();
      await audit.shutdown();
      return health;
    } catch (error) {
      return {
        name: 'Enterprise Audit System',
        status: 'critical',
        health_score: 0,
        error: error.message
      };
    }
  },

  async complianceAutomation() {
    try {
      const { getComplianceAutomation } = await import('../infrastructure/compliance/compliance-automation.js');
      const compliance = getComplianceAutomation({ 
        real_time_monitoring: false,
        frameworks: ['gdpr', 'sox']
      });
      const health = await compliance.getHealthStatus();
      await compliance.shutdown();
      return health;
    } catch (error) {
      return {
        name: 'Compliance Automation',
        status: 'critical',
        health_score: 0,
        error: error.message
      };
    }
  },

  async securityHardening() {
    try {
      const { getSecurityHardening } = await import('../infrastructure/security/enhanced/security-hardening.js');
      const security = getSecurityHardening({
        real_time_monitoring: false,
        automated_response: false
      });
      const health = await security.getHealthStatus();
      await security.shutdown();
      return health;
    } catch (error) {
      return {
        name: 'Security Hardening',
        status: 'critical',
        health_score: 0,
        error: error.message
      };
    }
  },

  async privacyRights() {
    try {
      const { getPrivacyRightsManagement } = await import('../infrastructure/compliance/privacy-rights-management.js');
      const privacy = getPrivacyRightsManagement({
        automated_processing: false,
        response_time_limit: 30
      });
      const health = await privacy.getHealthStatus();
      await privacy.shutdown();
      return health;
    } catch (error) {
      return {
        name: 'Privacy Rights Management',
        status: 'critical',
        health_score: 0,
        error: error.message
      };
    }
  },

  async complianceOrchestrator() {
    try {
      const { getComplianceOrchestrator } = await import('../infrastructure/compliance/compliance-orchestrator.js');
      const orchestrator = getComplianceOrchestrator({
        real_time_correlation: false,
        alerting_enabled: false
      });
      const health = await orchestrator.getHealthStatus();
      await orchestrator.shutdown();
      return health;
    } catch (error) {
      return {
        name: 'Compliance Orchestrator',
        status: 'critical',
        health_score: 0,
        error: error.message
      };
    }
  },

  // High Availability Components
  async haOrchestrator() {
    try {
      const { getHighAvailabilityOrchestrator } = await import('../infrastructure/high-availability/ha-orchestrator.js');
      const ha = getHighAvailabilityOrchestrator();
      const health = await ha.healthCheck();
      return {
        name: 'HA Orchestrator',
        status: health.status === 'healthy' ? 'healthy' : 'degraded',
        health_score: health.health_score || 75,
        details: health.details
      };
    } catch (error) {
      return {
        name: 'HA Orchestrator',
        status: 'critical',
        health_score: 0,
        error: error.message
      };
    }
  },

  // Observability Components
  async observability() {
    try {
      const { getAdvancedObservabilitySystem } = await import('../infrastructure/observability/advanced-observability-system.js');
      const obs = getAdvancedObservabilitySystem();
      const health = await obs.getHealthStatus();
      return health;
    } catch (error) {
      return {
        name: 'Observability System',
        status: 'critical',
        health_score: 0,
        error: error.message
      };
    }
  },

  async logAggregation() {
    try {
      const { getLogAggregationSystem } = await import('../infrastructure/observability/logs/log-aggregation.js');
      const logs = getLogAggregationSystem({ output_directory: '/tmp/health-check-logs' });
      const health = await logs.getHealthStatus();
      return health;
    } catch (error) {
      return {
        name: 'Log Aggregation System',
        status: 'critical',
        health_score: 0,
        error: error.message
      };
    }
  },

  // API Gateway Components
  async apiGateway() {
    try {
      const { getAPIGatewayOrchestrator } = await import('../infrastructure/api-gateway/api-gateway-orchestrator.js');
      const gateway = getAPIGatewayOrchestrator();
      const health = await gateway.healthCheck();
      return {
        name: 'API Gateway',
        status: health.status === 'healthy' ? 'healthy' : 'degraded',
        health_score: health.health_score || 75,
        details: health.details
      };
    } catch (error) {
      return {
        name: 'API Gateway',
        status: 'critical',
        health_score: 0,
        error: error.message
      };
    }
  },

  // Performance Components
  async performance() {
    try {
      const { getPerformanceOrchestrator } = await import('../infrastructure/performance/performance-orchestrator.js');
      const perf = getPerformanceOrchestrator();
      const health = await perf.healthCheck();
      return {
        name: 'Performance Monitor',
        status: health.status === 'healthy' ? 'healthy' : 'degraded',
        health_score: health.health_score || 75,
        details: health.details
      };
    } catch (error) {
      return {
        name: 'Performance Monitor',
        status: 'critical',
        health_score: 0,
        error: error.message
      };
    }
  },

  // File System Health Checks
  async fileSystem() {
    const checks = [];
    const directories = [
      './artifacts',
      './data',
      './docs',
      './infrastructure',
      './tools'
    ];

    for (const dir of directories) {
      try {
        const stats = await fs.stat(dir);
        checks.push({
          path: dir,
          accessible: true,
          type: stats.isDirectory() ? 'directory' : 'file'
        });
      } catch (error) {
        checks.push({
          path: dir,
          accessible: false,
          error: error.message
        });
      }
    }

    const accessibleCount = checks.filter(c => c.accessible).length;
    const healthScore = Math.round((accessibleCount / directories.length) * 100);

    return {
      name: 'File System',
      status: healthScore > 80 ? 'healthy' : healthScore > 50 ? 'warning' : 'critical',
      health_score: healthScore,
      details: { directories: checks, total: directories.length, accessible: accessibleCount }
    };
  }
};

class IntegratedHealthChecker {
  constructor() {
    this.results = new Map();
    this.startTime = Date.now();
  }

  async checkAll(components = null) {
    console.log('🏥 Starting comprehensive health check across all components...');
    
    const componentsToCheck = components || Object.keys(healthCheckModules);
    const results = new Map();
    
    // Run health checks in parallel for better performance
    const healthPromises = componentsToCheck.map(async (component) => {
      console.log(`🔍 Checking ${component}...`);
      try {
        const result = await healthCheckModules[component]();
        results.set(component, result);
        
        const statusIcon = result.status === 'healthy' ? '✅' : 
                          result.status === 'warning' ? '⚠️' : 
                          result.status === 'degraded' ? '🟡' : '❌';
        console.log(`${statusIcon} ${result.name}: ${result.status} (${result.health_score}/100)`);
        
        return result;
      } catch (error) {
        const errorResult = {
          name: component,
          status: 'critical',
          health_score: 0,
          error: error.message
        };
        results.set(component, errorResult);
        console.log(`❌ ${component}: critical (0/100) - ${error.message}`);
        return errorResult;
      }
    });

    await Promise.allSettled(healthPromises);
    this.results = results;
    
    return this.generateReport();
  }

  generateReport() {
    const totalComponents = this.results.size;
    const healthyComponents = Array.from(this.results.values()).filter(r => r.status === 'healthy').length;
    const warningComponents = Array.from(this.results.values()).filter(r => r.status === 'warning').length;
    const degradedComponents = Array.from(this.results.values()).filter(r => r.status === 'degraded').length;
    const criticalComponents = Array.from(this.results.values()).filter(r => r.status === 'critical').length;
    
    const avgHealthScore = Array.from(this.results.values())
      .reduce((sum, r) => sum + (r.health_score || 0), 0) / totalComponents;
    
    const overallStatus = avgHealthScore > 80 ? 'healthy' : 
                         avgHealthScore > 60 ? 'warning' : 
                         avgHealthScore > 40 ? 'degraded' : 'critical';
    
    const report = {
      timestamp: new Date().toISOString(),
      overall_status: overallStatus,
      overall_health_score: Math.round(avgHealthScore),
      duration_ms: Date.now() - this.startTime,
      summary: {
        total_components: totalComponents,
        healthy: healthyComponents,
        warning: warningComponents,
        degraded: degradedComponents,
        critical: criticalComponents
      },
      components: Object.fromEntries(this.results),
      system_dependencies: this.generateDependencyGraph(),
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  generateDependencyGraph() {
    // Define startup order and dependencies
    return {
      startup_order: [
        { phase: 1, components: ['fileSystem'], description: 'File system access validation' },
        { phase: 2, components: ['signer', 'chain', 'collector'], description: 'Core services (can start in parallel)' },
        { phase: 3, components: ['auditSystem', 'logAggregation'], description: 'Foundation services' },
        { phase: 4, components: ['securityHardening', 'privacyRights', 'complianceAutomation'], description: 'Compliance & Security services' },
        { phase: 5, components: ['complianceOrchestrator', 'observability'], description: 'Orchestration services' },
        { phase: 6, components: ['haOrchestrator', 'apiGateway', 'performance'], description: 'Infrastructure services' }
      ],
      dependencies: {
        complianceOrchestrator: ['auditSystem', 'securityHardening', 'privacyRights', 'complianceAutomation'],
        observability: ['logAggregation'],
        apiGateway: ['signer', 'chain', 'collector'],
        haOrchestrator: ['signer', 'chain', 'collector'],
        performance: ['observability']
      }
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    for (const [component, result] of this.results) {
      if (result.status === 'critical') {
        recommendations.push({
          priority: 'high',
          component,
          issue: `${result.name} is not responding`,
          action: `Restart ${component} service and check logs`,
          health_score: result.health_score
        });
      } else if (result.status === 'degraded') {
        recommendations.push({
          priority: 'medium',
          component,
          issue: `${result.name} performance degraded`,
          action: `Monitor ${component} resources and investigate performance`,
          health_score: result.health_score
        });
      } else if (result.status === 'warning') {
        recommendations.push({
          priority: 'low',
          component,
          issue: `${result.name} showing warning signs`,
          action: `Review ${component} configuration and metrics`,
          health_score: result.health_score
        });
      }
    }

    return recommendations;
  }

  async saveReport(report) {
  const reportPath = './artifacts/integrated-health-check-report.json';
  // Ensure artifacts directory exists (Windows-safe)
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 Health check report saved to ${reportPath}`);
    return reportPath;
  }

  printSummary(report) {
    console.log('\n🏥 INTEGRATED HEALTH CHECK SUMMARY');
    console.log('=====================================');
    console.log(`🎯 Overall Status: ${report.overall_status.toUpperCase()}`);
    console.log(`📊 Overall Health Score: ${report.overall_health_score}/100`);
    console.log(`⏱️ Check Duration: ${report.duration_ms}ms`);
    console.log(`📈 Components: ${report.summary.healthy}✅ ${report.summary.warning}⚠️ ${report.summary.degraded}🟡 ${report.summary.critical}❌`);
    
    if (report.recommendations.length > 0) {
      console.log('\n🔧 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, i) => {
        const icon = rec.priority === 'high' ? '🚨' : rec.priority === 'medium' ? '⚠️' : '💡';
        console.log(`${icon} ${rec.priority.toUpperCase()}: ${rec.action}`);
      });
    }
    
    console.log('\n📋 STARTUP DEPENDENCY ORDER:');
    report.system_dependencies.startup_order.forEach(phase => {
      console.log(`Phase ${phase.phase}: ${phase.components.join(', ')} - ${phase.description}`);
    });
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const targetComponents = args.length > 0 ? args : null;
  
  try {
    const checker = new IntegratedHealthChecker();
    const report = await checker.checkAll(targetComponents);
    
    checker.printSummary(report);
    await checker.saveReport(report);
    
    // Exit with appropriate code
    process.exit(report.overall_status === 'critical' ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  }
}

// Export for programmatic use
export { IntegratedHealthChecker, healthCheckModules };

// Windows-safe direct-run detection
const __isDirectRun = (() => {
  try {
    const argv1 = process.argv && process.argv[1] ? process.argv[1] : '';
    return import.meta.url === pathToFileURL(argv1).href;
  } catch {
    return false;
  }
})();

// Run if called directly
if (__isDirectRun) {
  main();
}