#!/usr/bin/env node
/**
 * gap-analysis.js
 * Comprehensive gap analysis tool for MerajutASA project.
 * Systematically identifies implementation, documentation, and integrity gaps.
 */
import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import { glob } from 'glob';
import { createHash } from 'crypto';

async function main() {
  console.log('[gap-analysis] Starting comprehensive gap analysis...');
  
  const gaps = {
    integrity: [],
    implementation: [],
    documentation: [],
    services: [],
    testing: [],
    configuration: []
  };

  // 1. Analyze hash integrity gaps
  await analyzeHashIntegrityGaps(gaps);
  
  // 2. Analyze implementation gaps
  await analyzeImplementationGaps(gaps);
  
  // 3. Analyze service gaps
  await analyzeServiceGaps(gaps);
  
  // 4. Analyze documentation gaps
  await analyzeDocumentationGaps(gaps);
  
  // 5. Analyze testing gaps
  await analyzeTestingGaps(gaps);
  
  // 6. Analyze configuration gaps
  await analyzeConfigurationGaps(gaps);
  
  // Generate comprehensive report
  const report = await generateGapReport(gaps);
  
  await fs.writeFile('artifacts/gap-analysis-report.json', JSON.stringify(report, null, 2));
  console.log('[gap-analysis] Report written to artifacts/gap-analysis-report.json');
  
  // Print summary
  printGapSummary(report);
}

async function analyzeHashIntegrityGaps(gaps) {
  console.log('[gap-analysis] Analyzing hash integrity gaps...');
  
  try {
    // Check if spec hash report exists
    let specHashReport;
    try {
      const data = await fs.readFile('artifacts/spec-hash-diff.json', 'utf8');
      specHashReport = JSON.parse(data);
    } catch (e) {
      // Run spec-hash-diff to generate report
      try {
        execSync('node tools/spec-hash-diff.js --mode=verify', { stdio: 'pipe' });
      } catch (err) {
        // Expected to fail if there are violations
      }
      const data = await fs.readFile('artifacts/spec-hash-diff.json', 'utf8');
      specHashReport = JSON.parse(data);
    }
    
    if (specHashReport.violations && specHashReport.violations.length > 0) {
      gaps.integrity.push({
        category: 'HASH_VIOLATIONS',
        severity: 'HIGH',
        count: specHashReport.violations.length,
        description: `${specHashReport.violations.length} files have hash mismatches indicating content drift`,
        impact: 'Governance integrity compromised, documents changed without proper versioning',
        files: specHashReport.violations.map(v => v.file).slice(0, 10), // First 10 files
        recommendation: 'Run spec-hash-diff.js --mode=seal-first to update hashes after reviewing changes'
      });
    }
    
    if (specHashReport.remaining_placeholders > 0) {
      gaps.integrity.push({
        category: 'HASH_PLACEHOLDERS',
        severity: 'MEDIUM',
        count: specHashReport.remaining_placeholders,
        description: `${specHashReport.remaining_placeholders} files still have placeholder hashes`,
        impact: 'Incomplete governance sealing process',
        recommendation: 'Complete hash sealing for all governed documents'
      });
    }
  } catch (e) {
    gaps.integrity.push({
      category: 'HASH_ANALYSIS_FAILED',
      severity: 'HIGH',
      description: 'Unable to analyze hash integrity',
      error: e.message,
      recommendation: 'Fix spec-hash-diff.js execution issues'
    });
  }
}

async function analyzeImplementationGaps(gaps) {
  console.log('[gap-analysis] Analyzing implementation gaps...');
  
  // Check for planned vs implemented features based on progress docs
  const progressFiles = await glob('docs/status/progress-*.md');
  
  for (const file of progressFiles) {
    const content = await fs.readFile(file, 'utf8');
    
    // Look for sections indicating missing implementations
    if (content.includes('Belum ada') || content.includes('Belum diimplementasi') || content.includes('Placeholder saja')) {
      const lines = content.split('\n');
      const missingItems = lines.filter(line => 
        line.includes('Belum ada') || 
        line.includes('Belum diimplementasi') || 
        line.includes('Placeholder saja') ||
        line.includes('Belum') ||
    if (IMPLEMENTATION_GAP_KEYWORDS.some(keyword => content.includes(keyword))) {
      const lines = content.split('\n');
      const missingItems = lines.filter(line =>
        IMPLEMENTATION_GAP_KEYWORDS.some(keyword => line.includes(keyword))
      );
      
      if (missingItems.length > 0) {
        gaps.implementation.push({
          category: 'PLANNED_NOT_IMPLEMENTED',
          severity: 'HIGH',
          source: file,
          count: missingItems.length,
          description: 'Features documented but not implemented',
          items: missingItems.slice(0, 5), // First 5 items
          impact: 'Core functionality missing, system incomplete',
          recommendation: 'Prioritize implementation of critical missing features'
        });
      }
    }
  }
  
  // Check specific critical implementations
  const criticalImplementations = [
    { path: 'tools/services/signer.js', feature: 'Cryptographic signing service' },
    { path: 'tools/services/chain.js', feature: 'Hash chain service' },
    { path: 'tools/services/collector.js', feature: 'Event collection service' },
    { path: 'tools/fairness/hysteresis-engine.js', feature: 'Hysteresis state machine' },
    { path: 'tools/policy-as-code-enforcer.js', feature: 'Policy enforcement engine' }
  ];
  
  for (const impl of criticalImplementations) {
    try {
      const content = await fs.readFile(impl.path, 'utf8');
      
      // Check if it's just a placeholder
      if (content.length < CRITICAL_SERVICE_PLACEHOLDER_LENGTH_THRESHOLD || content.includes('placeholder') || content.includes('TODO') || content.includes('FIXME')) {
        gaps.implementation.push({
          category: 'INCOMPLETE_CRITICAL_SERVICE',
          severity: 'CRITICAL',
          path: impl.path,
          feature: impl.feature,
          description: `${impl.feature} exists but appears to be placeholder or incomplete`,
          impact: 'Core system functionality not operational',
          recommendation: 'Complete implementation of critical service'
        });
      }
    } catch (e) {
      gaps.implementation.push({
        category: 'MISSING_CRITICAL_SERVICE',
        severity: 'CRITICAL',
        path: impl.path,
        feature: impl.feature,
        description: `${impl.feature} does not exist`,
        impact: 'Core system functionality missing',
        recommendation: 'Implement critical service from scratch'
      });
    }
  }
}

async function analyzeServiceGaps(gaps) {
  console.log('[gap-analysis] Analyzing service gaps...');
  
  const services = await glob('tools/services/*.js');
  
  for (const service of services) {
    try {
      const content = await fs.readFile(service, 'utf8');
      const serviceName = service.split('/').pop();
      
      // Check for basic service completeness
      const hasHealthCheck = content.includes('health') || content.includes('/health');
      const hasErrorHandling = content.includes('catch') || content.includes('try');
      const hasLogging = content.includes('console.log') || content.includes('console.error');
      
      const issues = [];
      if (!hasHealthCheck) issues.push('No health check endpoint');
      if (!hasErrorHandling) issues.push('No error handling');
      if (!hasLogging) issues.push('No logging');
      
      if (content.length < MINIMAL_SERVICE_CONTENT_LENGTH_THRESHOLD) {
        gaps.services.push({
          category: 'MINIMAL_SERVICE',
          severity: 'HIGH',
          service: serviceName,
          description: 'Service appears to be minimal placeholder',
          size: content.length,
          impact: 'Service may not be production ready',
          recommendation: 'Expand service implementation'
        });
      }
      
      if (issues.length > 0) {
        gaps.services.push({
          category: 'SERVICE_QUALITY_ISSUES',
          severity: 'MEDIUM',
          service: serviceName,
          issues: issues,
          description: 'Service missing production readiness features',
          impact: 'Reliability and monitoring concerns',
          recommendation: 'Add missing production features'
        });
      }
    } catch (e) {
      gaps.services.push({
        category: 'SERVICE_READ_ERROR',
        severity: 'MEDIUM',
        service: service,
        error: e.message,
        recommendation: 'Fix service file access issues'
      });
    }
  }
}

async function analyzeDocumentationGaps(gaps) {
  console.log('[gap-analysis] Analyzing documentation gaps...');
  
  // Check for incomplete docs mentioned in progress reports
  const docGaps = [
    { path: 'docs/integrity/verify-cli-doc-draft.md', feature: 'CLI verification documentation' },
    { path: 'docs/fairness/hysteresis-public-methodology-fragment-v1.md', feature: 'Hysteresis methodology' },
    { path: 'README.md', feature: 'Main project documentation' }
  ];
  
  for (const doc of docGaps) {
    try {
      const content = await fs.readFile(doc.path, 'utf8');
      
      if (
        INCOMPLETE_DOC_KEYWORDS.some(keyword => content.includes(keyword)) ||
        content.length < INCOMPLETE_DOC_LENGTH_THRESHOLD
      ) {
        gaps.documentation.push({
          category: 'INCOMPLETE_DOCUMENTATION',
          severity: 'MEDIUM',
          path: doc.path,
          feature: doc.feature,
          description: 'Documentation exists but appears incomplete',
          size: content.length,
          impact: 'Users may not understand how to use the system',
          recommendation: 'Complete documentation'
        });
      }
    } catch (e) {
      gaps.documentation.push({
        category: 'MISSING_DOCUMENTATION',
        severity: 'HIGH',
        path: doc.path,
        feature: doc.feature,
        description: 'Required documentation missing',
        impact: 'Critical documentation unavailable',
        recommendation: 'Create missing documentation'
      });
    }
  }
  
  // Check for API documentation
  const hasApiDocs = await checkFileExists('docs/api') || await checkFileExists('docs/endpoints');
  if (!hasApiDocs) {
    gaps.documentation.push({
      category: 'MISSING_API_DOCS',
      severity: 'HIGH',
      description: 'No API documentation found',
      impact: 'Developers cannot integrate with services',
      recommendation: 'Create comprehensive API documentation'
    });
  }
}

async function analyzeTestingGaps(gaps) {
  console.log('[gap-analysis] Analyzing testing gaps...');
  
  const testFiles = await glob('tools/tests/*.js');
  const toolFiles = await glob('tools/*.js');
  
  // Calculate test coverage ratio
  const testCoverage = testFiles.length / toolFiles.length;
  
  if (testCoverage < 0.3) {
    gaps.testing.push({
      category: 'LOW_TEST_COVERAGE',
      severity: 'HIGH',
      testFiles: testFiles.length,
      toolFiles: toolFiles.length,
      coverage: Math.round(testCoverage * 100),
      description: 'Insufficient test coverage for tools',
      impact: 'Risk of regressions and bugs',
      recommendation: 'Increase test coverage to at least 50%'
    });
  }
  
  // Check for integration tests
  const hasIntegrationTests = testFiles.some(f => f.includes('integration') || f.includes('e2e'));
  if (!hasIntegrationTests) {
    gaps.testing.push({
      category: 'MISSING_INTEGRATION_TESTS',
      severity: 'MEDIUM',
      description: 'No integration or end-to-end tests found',
      impact: 'System-level functionality not validated',
      recommendation: 'Add integration test suite'
    });
  }
  
  // Check if tests are runnable
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    const hasTestScript = packageJson.scripts && packageJson.scripts.test;
    
    if (!hasTestScript) {
      gaps.testing.push({
        category: 'NO_TEST_SCRIPT',
        severity: 'MEDIUM',
        description: 'No npm test script configured',
        impact: 'Tests cannot be run easily',
        recommendation: 'Add npm test script'
      });
    }
  } catch (e) {
    gaps.testing.push({
      category: 'PACKAGE_JSON_ERROR',
      severity: 'LOW',
      description: 'Cannot read package.json',
      recommendation: 'Fix package.json access'
    });
  }
}

async function analyzeConfigurationGaps(gaps) {
  console.log('[gap-analysis] Analyzing configuration gaps...');
  
  // Check for configuration files
  const configFiles = [
    'tools/config/privacy-policy.json',
    'docs/fairness/hysteresis-config-v1.yml',
    '.env.example'
  ];
  
  for (const configFile of configFiles) {
    try {
      const content = await fs.readFile(configFile, 'utf8');
      if (
        GAP_ANALYSIS_CONFIG.configFileDetectionPatterns.some(pattern => content.includes(pattern)) ||
        content.length < GAP_ANALYSIS_CONFIG.configFileMinLength
      ) {
        gaps.configuration.push({
          category: 'INCOMPLETE_CONFIG',
          severity: 'MEDIUM',
          path: configFile,
          description: 'Configuration file appears incomplete',
          impact: 'System may not be properly configurable',
          recommendation: 'Complete configuration'
        });
      }
    } catch (e) {
      gaps.configuration.push({
        category: 'MISSING_CONFIG',
        severity: 'HIGH',
        path: configFile,
        description: 'Required configuration file missing',
        impact: 'System cannot be configured properly',
        recommendation: 'Create required configuration file'
      });
    }
  }
}

async function generateGapReport(gaps) {
  const totalGaps = Object.values(gaps).reduce((sum, category) => sum + category.length, 0);
  const criticalGaps = Object.values(gaps).flat().filter(g => g.severity === 'CRITICAL').length;
  const highGaps = Object.values(gaps).flat().filter(g => g.severity === 'HIGH').length;
  const mediumGaps = Object.values(gaps).flat().filter(g => g.severity === 'MEDIUM').length;
  const lowGaps = Object.values(gaps).flat().filter(g => g.severity === 'LOW').length;
  
  return {
    version: '1.0.0',
    generated_utc: new Date().toISOString(),
    summary: {
      total_gaps: totalGaps,
      by_severity: {
        critical: criticalGaps,
        high: highGaps,
        medium: mediumGaps,
        low: lowGaps
      },
      by_category: Object.fromEntries(
        Object.entries(gaps).map(([category, items]) => [category, items.length])
      ),
      has_gaps: totalGaps > 0,
      system_readiness: calculateSystemReadiness(gaps)
    },
    gaps: gaps,
    recommendations: generateRecommendations(gaps)
  };
}

function calculateSystemReadiness(gaps) {
  const criticalCount = Object.values(gaps).flat().filter(g => g.severity === 'CRITICAL').length;
  const highCount = Object.values(gaps).flat().filter(g => g.severity === 'HIGH').length;
  
  if (criticalCount > 0) return 'NOT_READY';
  if (highCount > 5) return 'MAJOR_GAPS';
  if (highCount > 0) return 'MINOR_GAPS';
  return 'READY';
}

function generateRecommendations(gaps) {
  const recommendations = [];
  
  const criticalGaps = Object.values(gaps).flat().filter(g => g.severity === 'CRITICAL');
  if (criticalGaps.length > 0) {
    recommendations.push({
      priority: 'IMMEDIATE',
      action: 'Address critical gaps before any production deployment',
      items: criticalGaps.map(g => g.category)
    });
  }
  
  const hashGaps = gaps.integrity.filter(g => g.category === 'HASH_VIOLATIONS');
  if (hashGaps.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      action: 'Fix hash integrity violations to restore governance',
      command: 'npm run spec-hash:seal'
    });
  }
  
  const implementationGaps = gaps.implementation.filter(g => g.severity === 'CRITICAL' || g.severity === 'HIGH');
  if (implementationGaps.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      action: 'Complete critical service implementations',
      focus: 'signer, chain, collector services'
    });
  }
  
  return recommendations;
}

async function checkFileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

function printGapSummary(report) {
  console.log('\n=== GAP ANALYSIS SUMMARY ===');
  console.log(`Total gaps found: ${report.summary.total_gaps}`);
  console.log(`System readiness: ${report.summary.system_readiness}`);
  console.log('\nBy severity:');
  console.log(`  Critical: ${report.summary.by_severity.critical}`);
  console.log(`  High: ${report.summary.by_severity.high}`);
  console.log(`  Medium: ${report.summary.by_severity.medium}`);
  console.log(`  Low: ${report.summary.by_severity.low}`);
  
  console.log('\nBy category:');
  Object.entries(report.summary.by_category).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`);
  });
  
  if (report.recommendations.length > 0) {
    console.log('\nTop recommendations:');
    report.recommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`  ${i + 1}. [${rec.priority}] ${rec.action}`);
    });
  }
  
  console.log(`\n=== ANSWER: ${report.summary.has_gaps ? 'YES, SIGNIFICANT GAPS EXIST' : 'NO CRITICAL GAPS FOUND'} ===`);
}

main().catch(e => {
  console.error('[gap-analysis] ERROR:', e);
  process.exit(1);
});