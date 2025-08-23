/**
 * Dependency Drift Detector
 *
 * Compares actual system dependencies against documented dependencies
 * to detect drift and synchronization issues between implementation and documentation.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { stableStringify, addMetadata } from './lib/json-stable.js';

class DependencyDriftDetector {
  constructor() {
    this.criticalDriftCount = 0;
    this.docSyncIssues = 0;
    this.recommendations = [];
    this.findings = [];
    this.ciMode = process.env.CI_MODE === 'true';
  }

  async safeReadJSON(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`⚠️ Could not read ${filePath}: ${error.message}`);
      return null;
    }
  }

  async safeReadText(filePath) {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      console.warn(`⚠️ Could not read ${filePath}: ${error.message}`);
      return null;
    }
  }

  async loadDocumentedDependencies() {
    console.log('📚 Loading documented dependencies...');

    const dependencies = await this.safeReadJSON('docs/architecture/dependencies.json');
    const startupGuide = await this.safeReadText('docs/onboarding/startup-dependencies-guide.md');
    const componentRegistry = await this.safeReadJSON('config/component-registry.json');

    return {
      architecture: dependencies,
      startupGuide,
      componentRegistry,
    };
  }

  async loadActualState() {
    console.log('🔍 Loading actual system state...');

    const governanceReport = await this.safeReadJSON('artifacts/governance-verify-summary.json');
    const driftReport = await this.safeReadJSON('artifacts/no-silent-drift-report.json');
    const infraHealth = await this.safeReadJSON('artifacts/infra-health-summary.json');
    const serviceMeshHealth = await this.safeReadJSON('artifacts/service-mesh-health-check.json');
    const slaStatus = await this.safeReadJSON('artifacts/sla-status-check.json');

    return {
      governance: governanceReport,
      drift: driftReport,
      infrastructure: infraHealth,
      serviceMesh: serviceMeshHealth,
      sla: slaStatus,
    };
  }

  analyzeComponentDrift(documented, actual) {
    console.log('🔄 Analyzing component drift...');

    const findings = [];

    if (!documented.architecture) {
      findings.push({
        type: 'missing_documentation',
        severity: 'high',
        message: 'docs/architecture/dependencies.json not found or invalid',
        recommendation: 'Regenerate dependency documentation using npm run deps:matrix',
      });
      this.criticalDriftCount++;
      return findings;
    }

    // Check if documented components match actual infrastructure health
    const documentedComponents = documented.architecture.nodes || [];
    const actualHealthy = actual.infrastructure?.summary?.healthy_services || [];

    // Find components that are documented but not healthy
    const documentedIds = documentedComponents.map(c => c.id);
    const healthyIds = actualHealthy.map(s => s.service_name || s.name || s.id).filter(Boolean);

    const missingInHealth = documentedIds.filter(id => !healthyIds.includes(id));
    const extraInHealth = healthyIds.filter(id => !documentedIds.includes(id));

    if (missingInHealth.length > 0) {
      findings.push({
        type: 'component_health_mismatch',
        severity: 'medium',
        message: `Components documented but not found in health check: ${missingInHealth.join(', ')}`,
        recommendation: 'Update component registry or fix health check implementation',
      });
      this.docSyncIssues++;
    }

    if (extraInHealth.length > 0) {
      findings.push({
        type: 'undocumented_components',
        severity: 'low',
        message: `Components in health check but not documented: ${extraInHealth.join(', ')}`,
        recommendation: 'Update dependency documentation to include these components',
      });
    }

    return findings;
  }

  analyzeDependencySequence(documented, actual) {
    console.log('🚀 Analyzing boot sequence...');

    const findings = [];

    // Extract startup phases from documentation
    const startupGuideContent = documented.startupGuide || '';
    const phaseMatches = startupGuideContent.match(/### Phase \d+: (.+)/g) || [];

    if (phaseMatches.length === 0) {
      findings.push({
        type: 'missing_boot_sequence',
        severity: 'medium',
        message: 'No startup phases found in startup dependencies guide',
        recommendation: 'Document boot sequence phases in docs/onboarding/startup-dependencies-guide.md',
      });
      this.docSyncIssues++;
    }

    // Check governance verification status
    if (actual.governance) {
      const criticalFailures = actual.governance.summary?.critical_failures || 0;
      if (criticalFailures > 0) {
        findings.push({
          type: 'governance_critical_failure',
          severity: 'high',
          message: `Governance verification has ${criticalFailures} critical failures`,
          recommendation: 'Fix critical governance issues before proceeding with deployment',
        });
        this.criticalDriftCount++;
      }
    }

    return findings;
  }

  analyzeServiceMeshDrift(documented, actual) {
    console.log('🌐 Analyzing service mesh drift...');

    const findings = [];

    if (actual.serviceMesh) {
      const meshStatus = actual.serviceMesh.status;
      const totalServices = actual.serviceMesh.totalServices || 0;
      const healthyServices = actual.serviceMesh.healthyServices || 0;

      if (meshStatus !== 'healthy') {
        findings.push({
          type: 'service_mesh_unhealthy',
          severity: 'medium',
          message: `Service mesh status: ${meshStatus}`,
          recommendation: 'Investigate service mesh connectivity issues',
        });
      }

      if (totalServices > 0 && healthyServices < totalServices) {
        findings.push({
          type: 'service_mesh_partial_health',
          severity: 'medium',
          message: `Service mesh: ${healthyServices}/${totalServices} services healthy`,
          recommendation: 'Check unhealthy services in service mesh',
        });
      }
    }

    return findings;
  }

  analyzeSLADrift(documented, actual) {
    console.log('📈 Analyzing SLA status drift...');

    const findings = [];

    if (actual.sla) {
      const services = Object.keys(actual.sla);
      const noDataServices = services.filter(s => actual.sla[s].status === 'no_data');

      if (noDataServices.length > 0) {
        findings.push({
          type: 'sla_no_data',
          severity: 'low',
          message: `SLA monitoring has no data for: ${noDataServices.join(', ')}`,
          recommendation: 'Ensure SLA monitoring is properly configured for all services',
        });
      }
    }

    return findings;
  }

  generateRecommendations() {
    const uniqueRecommendations = [...new Set(this.findings.map(f => f.recommendation))];

    // Add general recommendations based on findings
    if (this.criticalDriftCount > 0) {
      uniqueRecommendations.unshift('🚨 Address critical drift issues before deployment');
    }

    if (this.docSyncIssues > 0) {
      uniqueRecommendations.push('📝 Update documentation to match current implementation');
    }

    // Add preventive recommendations
    uniqueRecommendations.push('🔄 Run dependency drift check regularly to catch issues early');
    uniqueRecommendations.push('📊 Consider automating dependency documentation updates');

    return uniqueRecommendations;
  }

  async generateReport() {
    console.log('📄 Generating dependency drift report...');

    const documented = await this.loadDocumentedDependencies();
    const actual = await this.loadActualState();

    // Perform all drift analyses
    this.findings = [
      ...this.analyzeComponentDrift(documented, actual),
      ...this.analyzeDependencySequence(documented, actual),
      ...this.analyzeServiceMeshDrift(documented, actual),
      ...this.analyzeSLADrift(documented, actual),
    ];

    this.recommendations = this.generateRecommendations();

    const report = {
      summary: {
        total_findings: this.findings.length,
        critical_drift_count: this.criticalDriftCount,
        doc_sync_issues: this.docSyncIssues,
        boot_sequence_status: this.criticalDriftCount === 0 ? 'PASS' : 'FAIL',
        service_mesh_status: actual.serviceMesh?.status || 'unknown',
        sla_status: actual.sla ? 'checked' : 'not_available',
      },
      findings: this.findings,
      recommendations: this.recommendations,
      analysis: {
        documented_components: documented.architecture?.nodes?.length || 0,
        documented_dependencies: documented.architecture?.edges?.length || 0,
        governance_status: actual.governance?.status || 'unknown',
        infrastructure_health: actual.infrastructure?.summary?.overall_health || 'unknown',
      },
      metadata: {
        ci_mode: this.ciMode,
        event_name: process.env.GITHUB_EVENT_NAME || 'unknown',
        pr_number: process.env.PR_NUMBER || null,
      },
    };

    // Add metadata for consistency
    const enhancedReport = addMetadata(report, {
      actor: 'dependency-drift-detector',
      generator: 'dependency-drift-detector.js',
    });

    return enhancedReport;
  }

  async saveReport(report) {
    await fs.mkdir('artifacts', { recursive: true });

    const reportPath = 'artifacts/dependency-drift-report.json';
    await fs.writeFile(reportPath, stableStringify(report));

    console.log(`✅ Dependency drift report saved to ${reportPath}`);

    // Also save a summary for easy consumption
    const summaryPath = 'artifacts/dependency-drift-summary.json';
    await fs.writeFile(summaryPath, stableStringify({
      critical_drift_count: report.summary.critical_drift_count,
      doc_sync_issues: report.summary.doc_sync_issues,
      status: report.summary.critical_drift_count === 0 ? 'PASS' : 'FAIL',
      recommendations: report.recommendations.slice(0, 3), // Top 3 recommendations
    }));

    console.log(`✅ Dependency drift summary saved to ${summaryPath}`);
  }

  printSummary(report) {
    console.log('\n🔄 DEPENDENCY DRIFT CHECK SUMMARY');
    console.log('=====================================');
    console.log(`Critical Drift Issues: ${report.summary.critical_drift_count}`);
    console.log(`Documentation Sync Issues: ${report.summary.doc_sync_issues}`);
    console.log(`Boot Sequence Status: ${report.summary.boot_sequence_status}`);
    console.log(`Service Mesh Status: ${report.summary.service_mesh_status}`);
    console.log(`SLA Status: ${report.summary.sla_status}`);

    if (this.findings.length > 0) {
      console.log('\n📋 Key Findings:');
      this.findings.slice(0, 5).forEach(finding => {
        const icon = finding.severity === 'high' ? '🔴' : finding.severity === 'medium' ? '🟡' : '🟢';
        console.log(`  ${icon} ${finding.message}`);
      });
    }

    if (this.recommendations.length > 0) {
      console.log('\n💡 Top Recommendations:');
      this.recommendations.slice(0, 3).forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }

    console.log('=====================================\n');
  }
}

async function main() {
  try {
    console.log('🔄 Starting Dependency Drift Detection...\n');

    const detector = new DependencyDriftDetector();
    const report = await detector.generateReport();

    await detector.saveReport(report);
    detector.printSummary(report);

    // Exit with error code if critical drift detected
    if (report.summary.critical_drift_count > 0) {
      console.error('❌ Critical dependency drift detected. Check the report for details.');
      process.exit(1);
    }

    console.log('✅ Dependency drift check completed successfully.');

  } catch (error) {
    console.error('❌ Dependency drift detection failed:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error in dependency drift detection:', error);
  process.exit(1);
});
