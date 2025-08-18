#!/usr/bin/env node
/**
 * gap-analysis-enhanced.js
 * Enhanced comprehensive gap analysis tool implementing 15-category framework
 * Based on industry best practices from Kubernetes, CNCF, Apache Foundation
 */
import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import { createHash } from 'crypto';

// Enhanced 15-category framework with weights and criticality
const ENHANCED_GAP_CATEGORIES = {
  // Existing categories
  integrity: { weight: 1.0, criticality: 'HIGH' },
  implementation: { weight: 0.9, criticality: 'HIGH' },
  services: { weight: 0.8, criticality: 'MEDIUM' },
  documentation: { weight: 0.6, criticality: 'MEDIUM' },
  testing: { weight: 0.7, criticality: 'MEDIUM' },
  configuration: { weight: 0.6, criticality: 'MEDIUM' },
  
  // New enhanced categories
  security: { weight: 1.0, criticality: 'CRITICAL' },
  performance: { weight: 0.8, criticality: 'HIGH' },
  observability: { weight: 0.8, criticality: 'HIGH' },
  deployment: { weight: 0.8, criticality: 'HIGH' },
  compliance: { weight: 0.7, criticality: 'MEDIUM' },
  business_continuity: { weight: 0.8, criticality: 'HIGH' },
  developer_experience: { weight: 0.5, criticality: 'MEDIUM' },
  api_integration: { weight: 0.8, criticality: 'HIGH' },
  data_governance: { weight: 0.8, criticality: 'HIGH' }
};

// Enhanced detection patterns for security gaps
const SECURITY_GAP_PATTERNS = {
  missing_tls: ['http://', 'ssl: false', 'secure: false'],
  hardcoded_secrets: ['password:', 'token:', 'key:', 'secret:', 'api_key'],
  missing_validation: ['req.body.', 'req.query.', 'req.params.'],
  crypto_issues: ['md5', 'sha1', 'crypto.createHash(\'md5\')', 'crypto.createHash(\'sha1\')'],
  auth_missing: ['no auth', 'skip auth', 'bypass auth'],
  sql_injection: ['query.*+.*req', 'WHERE.*+.*req', 'SELECT.*+.*req']
};

// Performance gap detection patterns
const PERFORMANCE_GAP_PATTERNS = {
  synchronous_calls: ['fs.readFileSync', 'execSync'],
  missing_caching: ['no-cache', 'no-store'],
  database_issues: ['SELECT \\*', 'N+1', 'for.*await.*query'],
  memory_leaks: ['global\\.', 'process\\.env'],
  blocking_operations: ['while.*true', 'setInterval.*0']
};

// Observability gap detection patterns
const OBSERVABILITY_GAP_PATTERNS = {
  no_metrics: ['no metrics', 'no monitoring'],
  no_logging: ['no logs', 'console.log.*error'],
  no_tracing: ['no trace', 'no span'],
  no_alerts: ['no alert', 'no notification']
};

async function main() {
  console.log('[enhanced-gap-analysis] Starting comprehensive 15-category gap analysis...');
  
  const gaps = {};
  
  // Initialize all categories
  Object.keys(ENHANCED_GAP_CATEGORIES).forEach(category => {
    gaps[category] = [];
  });

  // Run all gap analysis categories
  await analyzeSecurityGaps(gaps);
  await analyzePerformanceGaps(gaps);
  await analyzeObservabilityGaps(gaps);
  await analyzeDeploymentGaps(gaps);
  await analyzeComplianceGaps(gaps);
  await analyzeBusinessContinuityGaps(gaps);
  await analyzeDeveloperExperienceGaps(gaps);
  await analyzeApiIntegrationGaps(gaps);
  await analyzeDataGovernanceGaps(gaps);
  
  // Run existing gap analysis
  await runExistingGapAnalysis(gaps);
  
  // Generate comprehensive enhanced report
  const report = await generateEnhancedReport(gaps);
  
  await fs.writeFile('artifacts/gap-analysis-enhanced.json', JSON.stringify(report, null, 2));
  console.log('[enhanced-gap-analysis] Enhanced report written to artifacts/gap-analysis-enhanced.json');
  
  // Print enhanced summary
  printEnhancedSummary(report);
}

async function analyzeSecurityGaps(gaps) {
  console.log('[enhanced-gap-analysis] Analyzing security gaps...');
  
  // Check for basic security implementations
  const securityFiles = [
    'tools/security',
    'tools/auth',
    'config/tls',
    'config/ssl',
    '.env.example'
  ];
  
  let missingSecurityFiles = 0;
  for (const file of securityFiles) {
    if (!await checkFileExists(file)) {
      missingSecurityFiles++;
    }
  }
  
  if (missingSecurityFiles > 0) {
    gaps.security.push({
      category: 'MISSING_SECURITY_INFRASTRUCTURE',
      severity: 'CRITICAL',
      count: missingSecurityFiles,
      missing_files: securityFiles.filter(async f => !await checkFileExists(f)),
      description: 'Basic security infrastructure missing',
      impact: 'System vulnerable to attacks, no authentication/authorization',
      recommendation: 'Implement comprehensive security framework',
      industry_reference: 'OWASP Top 10, Kubernetes RBAC'
    });
  }
  
  // Check service files for security patterns
  const serviceFiles = await glob('tools/services/*.js');
  for (const service of serviceFiles) {
    try {
      const content = await fs.readFile(service, 'utf8');
      const serviceName = service.split('/').pop();
      
      const securityIssues = [];
      
      // Check for hardcoded secrets
      if (SECURITY_GAP_PATTERNS.hardcoded_secrets.some(pattern => content.includes(pattern))) {
        securityIssues.push('Potential hardcoded secrets');
      }
      
      // Check for HTTP usage instead of HTTPS
      if (SECURITY_GAP_PATTERNS.missing_tls.some(pattern => content.includes(pattern))) {
        securityIssues.push('HTTP usage detected, HTTPS required');
      }
      
      // Check for missing input validation
      if (SECURITY_GAP_PATTERNS.missing_validation.some(pattern => content.match(new RegExp(pattern)))) {
        securityIssues.push('Missing input validation');
      }
      
      if (securityIssues.length > 0) {
        gaps.security.push({
          category: 'SERVICE_SECURITY_ISSUES',
          severity: 'HIGH',
          service: serviceName,
          issues: securityIssues,
          description: 'Security vulnerabilities in service implementation',
          impact: 'Service vulnerable to attacks',
          recommendation: 'Implement security best practices',
          industry_reference: 'OWASP Secure Coding Practices'
        });
      }
    } catch (e) {
      // Service file read error handled elsewhere
    }
  }
  
  // Check for authentication/authorization
  const hasAuth = await checkFileExists('tools/auth') || await checkFileExists('middleware/auth');
  if (!hasAuth) {
    gaps.security.push({
      category: 'MISSING_AUTHENTICATION',
      severity: 'CRITICAL',
      description: 'No authentication/authorization framework found',
      impact: 'Unrestricted access to all system functions',
      recommendation: 'Implement RBAC, OAuth2, or similar auth framework',
      industry_reference: 'Kubernetes RBAC, OAuth2 best practices'
    });
  }
}

async function analyzePerformanceGaps(gaps) {
  console.log('[enhanced-gap-analysis] Analyzing performance gaps...');
  
  // Check for performance testing
  const hasPerfTests = await checkFileExists('tools/tests/performance') || 
                      await checkFileExists('tools/perf-budget-smoke.js');
  
  if (!hasPerfTests) {
    gaps.performance.push({
      category: 'MISSING_PERFORMANCE_TESTING',
      severity: 'HIGH',
      description: 'No performance testing framework found',
      impact: 'Unknown system performance characteristics',
      recommendation: 'Implement load testing, performance budgets',
      industry_reference: 'Web Vitals, k6 load testing, Apache Bench'
    });
  }
  
  // Check service files for performance anti-patterns
  const serviceFiles = await glob('tools/services/*.js');
  for (const service of serviceFiles) {
    try {
      const content = await fs.readFile(service, 'utf8');
      const serviceName = service.split('/').pop();
      
      const perfIssues = [];
      
      // Check for synchronous operations
      if (PERFORMANCE_GAP_PATTERNS.synchronous_calls.some(pattern => content.includes(pattern))) {
        perfIssues.push('Synchronous file operations detected');
      }
      
      // Check for missing caching
      if (!content.includes('cache') && !content.includes('Cache-Control')) {
        perfIssues.push('No caching implementation');
      }
      
      if (perfIssues.length > 0) {
        gaps.performance.push({
          category: 'SERVICE_PERFORMANCE_ISSUES',
          severity: 'MEDIUM',
          service: serviceName,
          issues: perfIssues,
          description: 'Performance anti-patterns detected',
          impact: 'Potential latency and scalability issues',
          recommendation: 'Implement async operations, caching strategies',
          industry_reference: 'Node.js performance best practices'
        });
      }
    } catch (e) {
      // Service file read error handled elsewhere
    }
  }
  
  // Check for database optimization
  const hasDbOptimization = await checkFileExists('config/database') ||
                            await checkFileExists('tools/db-optimize.js');
  
  if (!hasDbOptimization) {
    gaps.performance.push({
      category: 'MISSING_DATABASE_OPTIMIZATION',
      severity: 'MEDIUM',
      description: 'No database optimization configuration found',
      impact: 'Potential database performance bottlenecks',
      recommendation: 'Implement connection pooling, query optimization',
      industry_reference: 'Database performance tuning best practices'
    });
  }
}

async function analyzeObservabilityGaps(gaps) {
  console.log('[enhanced-gap-analysis] Analyzing observability gaps...');
  
  // Check for monitoring infrastructure
  const hasMonitoring = await checkFileExists('config/monitoring') ||
                       await checkFileExists('tools/monitoring') ||
                       await checkFileExists('docker-compose.monitoring.yml');
  
  if (!hasMonitoring) {
    gaps.observability.push({
      category: 'MISSING_MONITORING_INFRASTRUCTURE',
      severity: 'CRITICAL',
      description: 'No monitoring infrastructure configuration found',
      impact: 'No visibility into system health and performance',
      recommendation: 'Implement Prometheus, Grafana, or similar monitoring stack',
      industry_reference: 'CNCF observability landscape, Prometheus best practices'
    });
  }
  
  // Check for logging framework
  const hasStructuredLogging = await checkFileExists('config/logging') ||
                              await checkFileExists('tools/logger.js');
  
  if (!hasStructuredLogging) {
    gaps.observability.push({
      category: 'MISSING_STRUCTURED_LOGGING',
      severity: 'HIGH',
      description: 'No structured logging framework found',
      impact: 'Difficult to debug issues and track system behavior',
      recommendation: 'Implement structured logging with correlation IDs',
      industry_reference: 'ELK Stack, structured logging best practices'
    });
  }
  
  // Check for distributed tracing
  const hasTracing = await checkFileExists('config/tracing') ||
                    await checkFileExists('tools/tracing');
  
  if (!hasTracing) {
    gaps.observability.push({
      category: 'MISSING_DISTRIBUTED_TRACING',
      severity: 'HIGH',
      description: 'No distributed tracing implementation found',
      impact: 'Cannot trace requests across services',
      recommendation: 'Implement OpenTelemetry or Jaeger tracing',
      industry_reference: 'OpenTelemetry standard, distributed tracing patterns'
    });
  }
  
  // Check for alerting
  const hasAlerting = await checkFileExists('config/alerts') ||
                     await checkFileExists('tools/alerts');
  
  if (!hasAlerting) {
    gaps.observability.push({
      category: 'MISSING_ALERTING_SYSTEM',
      severity: 'HIGH',
      description: 'No alerting system configuration found',
      impact: 'Cannot be notified of system issues',
      recommendation: 'Implement alerting rules and notification channels',
      industry_reference: 'Prometheus AlertManager, PagerDuty integration'
    });
  }
}

async function analyzeDeploymentGaps(gaps) {
  console.log('[enhanced-gap-analysis] Analyzing deployment gaps...');
  
  // Check for containerization
  const hasContainers = await checkFileExists('Dockerfile') ||
                       await checkFileExists('docker-compose.yml');
  
  if (!hasContainers) {
    gaps.deployment.push({
      category: 'MISSING_CONTAINERIZATION',
      severity: 'HIGH',
      description: 'No containerization configuration found',
      impact: 'Cannot deploy consistently across environments',
      recommendation: 'Create Dockerfile and container orchestration config',
      industry_reference: 'Docker best practices, Kubernetes deployment'
    });
  }
  
  // Check for infrastructure as code
  const hasIaC = await checkFileExists('terraform') ||
                await checkFileExists('cloudformation') ||
                await checkFileExists('k8s') ||
                await checkFileExists('kubernetes');
  
  if (!hasIaC) {
    gaps.deployment.push({
      category: 'MISSING_INFRASTRUCTURE_AS_CODE',
      severity: 'HIGH',
      description: 'No infrastructure as code configuration found',
      impact: 'Manual infrastructure management, deployment inconsistencies',
      recommendation: 'Implement Terraform, Kubernetes manifests, or similar IaC',
      industry_reference: 'Terraform best practices, GitOps patterns'
    });
  }
  
  // Check for CI/CD enhancements
  const ciFiles = await glob('.github/workflows/*.yml');
  let hasComprehensiveCI = false;
  
  for (const ciFile of ciFiles) {
    const content = await fs.readFile(ciFile, 'utf8');
    if (content.includes('deploy') && content.includes('test') && content.includes('build')) {
      hasComprehensiveCI = true;
      break;
    }
  }
  
  if (!hasComprehensiveCI) {
    gaps.deployment.push({
      category: 'INCOMPLETE_CI_CD_PIPELINE',
      severity: 'MEDIUM',
      description: 'CI/CD pipeline missing comprehensive deployment automation',
      impact: 'Manual deployment processes, deployment errors',
      recommendation: 'Enhance CI/CD with automated testing, building, and deployment',
      industry_reference: 'GitOps workflows, GitHub Actions best practices'
    });
  }
}

async function analyzeComplianceGaps(gaps) {
  console.log('[enhanced-gap-analysis] Analyzing compliance gaps...');
  
  // Check for compliance documentation
  const complianceFiles = [
    'docs/compliance',
    'docs/legal',
    'docs/privacy/gdpr.md',
    'docs/security/soc2.md'
  ];
  
  let missingComplianceFiles = 0;
  for (const file of complianceFiles) {
    if (!await checkFileExists(file)) {
      missingComplianceFiles++;
    }
  }
  
  if (missingComplianceFiles > 0) {
    gaps.compliance.push({
      category: 'MISSING_COMPLIANCE_DOCUMENTATION',
      severity: 'MEDIUM',
      count: missingComplianceFiles,
      description: 'Compliance documentation incomplete',
      impact: 'Cannot demonstrate regulatory compliance',
      recommendation: 'Create GDPR, SOC2, ISO27001 compliance documentation',
      industry_reference: 'GDPR Article 30, SOC2 Trust Principles'
    });
  }
  
  // Check for audit trail capabilities
  const hasAuditTrail = await checkFileExists('tools/audit') ||
                       await checkFileExists('tools/audit-replay.js');
  
  if (!hasAuditTrail) {
    gaps.compliance.push({
      category: 'MISSING_AUDIT_TRAIL',
      severity: 'HIGH',
      description: 'No comprehensive audit trail system found',
      impact: 'Cannot provide audit evidence for compliance',
      recommendation: 'Implement comprehensive audit logging and replay',
      industry_reference: 'SOC2 audit requirements, compliance logging'
    });
  }
}

async function analyzeBusinessContinuityGaps(gaps) {
  console.log('[enhanced-gap-analysis] Analyzing business continuity gaps...');
  
  // Check for backup procedures
  const hasBackup = await checkFileExists('tools/backup') ||
                   await checkFileExists('scripts/backup.sh');
  
  if (!hasBackup) {
    gaps.business_continuity.push({
      category: 'MISSING_BACKUP_PROCEDURES',
      severity: 'CRITICAL',
      description: 'No automated backup procedures found',
      impact: 'Data loss risk, no recovery capability',
      recommendation: 'Implement automated backup and recovery procedures',
      industry_reference: 'SRE backup best practices, 3-2-1 backup rule'
    });
  }
  
  // Check for disaster recovery
  const hasDR = await checkFileExists('docs/disaster-recovery') ||
               await checkFileExists('docs/business-continuity');
  
  if (!hasDR) {
    gaps.business_continuity.push({
      category: 'MISSING_DISASTER_RECOVERY_PLAN',
      severity: 'HIGH',
      description: 'No disaster recovery plan found',
      impact: 'Extended downtime during disasters',
      recommendation: 'Create comprehensive disaster recovery procedures',
      industry_reference: 'SRE disaster recovery, business continuity planning'
    });
  }
  
  // Check for high availability configuration
  const hasHA = await checkFileExists('config/ha') ||
               await checkFileExists('k8s/ha') ||
               await checkFileExists('terraform/ha');
  
  if (!hasHA) {
    gaps.business_continuity.push({
      category: 'MISSING_HIGH_AVAILABILITY',
      severity: 'HIGH',
      description: 'No high availability configuration found',
      impact: 'Single point of failure, service interruptions',
      recommendation: 'Implement load balancing, redundancy, failover',
      industry_reference: 'SRE high availability patterns, 99.9% uptime targets'
    });
  }
}

async function analyzeDeveloperExperienceGaps(gaps) {
  console.log('[enhanced-gap-analysis] Analyzing developer experience gaps...');
  
  // Check for development environment setup
  const hasDevSetup = await checkFileExists('docs/development.md') ||
                     await checkFileExists('scripts/setup-dev.sh') ||
                     await checkFileExists('.devcontainer');
  
  if (!hasDevSetup) {
    gaps.developer_experience.push({
      category: 'MISSING_DEV_ENVIRONMENT_SETUP',
      severity: 'MEDIUM',
      description: 'No automated development environment setup',
      impact: 'Slow developer onboarding, environment inconsistencies',
      recommendation: 'Create automated dev setup scripts or devcontainers',
      industry_reference: 'Development containers, platform engineering'
    });
  }
  
  // Check for code quality tools
  const hasCodeQuality = await checkFileExists('.eslintrc') ||
                        await checkFileExists('.husky') ||
                        await checkFileExists('tools/lint');
  
  if (!hasCodeQuality) {
    gaps.developer_experience.push({
      category: 'MISSING_CODE_QUALITY_TOOLS',
      severity: 'MEDIUM',
      description: 'Limited code quality automation',
      impact: 'Inconsistent code quality, manual reviews',
      recommendation: 'Implement ESLint, Prettier, pre-commit hooks',
      industry_reference: 'Code quality best practices, automated linting'
    });
  }
}

async function analyzeApiIntegrationGaps(gaps) {
  console.log('[enhanced-gap-analysis] Analyzing API integration gaps...');
  
  // Check for API documentation
  const hasApiDocs = await checkFileExists('docs/api/openapi.yml') ||
                    await checkFileExists('docs/api/swagger.yml') ||
                    await checkFileExists('api-docs');
  
  if (!hasApiDocs) {
    gaps.api_integration.push({
      category: 'MISSING_API_DOCUMENTATION',
      severity: 'HIGH',
      description: 'No OpenAPI/Swagger documentation found',
      impact: 'Difficult API integration, unclear interface contracts',
      recommendation: 'Create comprehensive OpenAPI specifications',
      industry_reference: 'OpenAPI 3.0 specification, API design best practices'
    });
  }
  
  // Check for API versioning
  const serviceFiles = await glob('tools/services/*.js');
  let hasApiVersioning = false;
  
  for (const service of serviceFiles) {
    try {
      const content = await fs.readFile(service, 'utf8');
      if (content.includes('/v1/') || content.includes('/api/v') || content.includes('version')) {
        hasApiVersioning = true;
        break;
      }
    } catch (e) {
      // Service file read error handled elsewhere
    }
  }
  
  if (!hasApiVersioning) {
    gaps.api_integration.push({
      category: 'MISSING_API_VERSIONING',
      severity: 'MEDIUM',
      description: 'No API versioning strategy found',
      impact: 'Breaking changes affect all clients',
      recommendation: 'Implement semantic API versioning',
      industry_reference: 'REST API versioning best practices'
    });
  }
  
  // Check for integration testing
  const hasIntegrationTests = await checkFileExists('tools/tests/integration') ||
                             await checkFileExists('tools/tests/api');
  
  if (!hasIntegrationTests) {
    gaps.api_integration.push({
      category: 'MISSING_INTEGRATION_TESTING',
      severity: 'MEDIUM',
      description: 'No API integration testing found',
      impact: 'API contract breakages not detected',
      recommendation: 'Implement API contract testing, integration test suite',
      industry_reference: 'API testing best practices, contract testing'
    });
  }
}

async function analyzeDataGovernanceGaps(gaps) {
  console.log('[enhanced-gap-analysis] Analyzing data governance gaps...');
  
  // Check for data validation
  const hasDataValidation = await checkFileExists('schemas') ||
                           await checkFileExists('tools/schema-validate.js');
  
  if (!hasDataValidation) {
    gaps.data_governance.push({
      category: 'MISSING_DATA_VALIDATION',
      severity: 'HIGH',
      description: 'Limited data validation framework',
      impact: 'Data quality issues, invalid data processing',
      recommendation: 'Implement comprehensive schema validation',
      industry_reference: 'JSON Schema, data quality frameworks'
    });
  }
  
  // Check for data privacy controls
  const hasPrivacyControls = await checkFileExists('tools/privacy') ||
                            await checkFileExists('tools/pii-scan.js');
  
  if (!hasPrivacyControls) {
    gaps.data_governance.push({
      category: 'MISSING_PRIVACY_CONTROLS',
      severity: 'HIGH',
      description: 'Limited data privacy controls',
      impact: 'GDPR compliance risk, data privacy violations',
      recommendation: 'Implement data anonymization, consent management',
      industry_reference: 'GDPR privacy by design, data anonymization'
    });
  }
  
  // Check for data lifecycle management
  const hasDataLifecycle = await checkFileExists('docs/data-retention') ||
                          await checkFileExists('tools/data-cleanup');
  
  if (!hasDataLifecycle) {
    gaps.data_governance.push({
      category: 'MISSING_DATA_LIFECYCLE_MANAGEMENT',
      severity: 'MEDIUM',
      description: 'No data lifecycle management found',
      impact: 'Data accumulation, compliance issues',
      recommendation: 'Implement data retention policies, automated cleanup',
      industry_reference: 'Data governance best practices, GDPR retention'
    });
  }
}

async function runExistingGapAnalysis(gaps) {
  console.log('[enhanced-gap-analysis] Running existing gap analysis...');
  
  try {
    // Import and run existing gap analysis logic
    const { execSync } = await import('child_process');
    execSync('node tools/gap-analysis.js', { stdio: 'pipe' });
    
    // Read existing results and merge
    const existingReport = JSON.parse(await fs.readFile('artifacts/gap-analysis-report.json', 'utf8'));
    
    // Merge existing gaps into enhanced framework
    Object.entries(existingReport.gaps).forEach(([category, categoryGaps]) => {
      if (gaps[category]) {
        gaps[category] = gaps[category].concat(categoryGaps);
      }
    });
  } catch (e) {
    console.log('[enhanced-gap-analysis] Could not run existing gap analysis:', e.message);
  }
}

async function generateEnhancedReport(gaps) {
  const totalGaps = Object.values(gaps).reduce((sum, category) => sum + category.length, 0);
  const criticalGaps = Object.values(gaps).flat().filter(g => g.severity === 'CRITICAL').length;
  const highGaps = Object.values(gaps).flat().filter(g => g.severity === 'HIGH').length;
  const mediumGaps = Object.values(gaps).flat().filter(g => g.severity === 'MEDIUM').length;
  const lowGaps = Object.values(gaps).flat().filter(g => g.severity === 'LOW').length;
  
  // Calculate weighted maturity score
  const maxScore = Object.keys(ENHANCED_GAP_CATEGORIES).length * 100;
  let currentScore = 0;
  
  Object.entries(gaps).forEach(([category, categoryGaps]) => {
    const categoryConfig = ENHANCED_GAP_CATEGORIES[category];
    if (categoryConfig) {
      const categoryScore = Math.max(0, 100 - (categoryGaps.length * 20));
      currentScore += categoryScore * categoryConfig.weight;
    }
  });
  
  const maturityScore = Math.round((currentScore / maxScore) * 100);
  
  return {
    version: '2.0.0-enhanced',
    framework: '15-category-comprehensive',
    generated_utc: new Date().toISOString(),
    summary: {
      total_gaps: totalGaps,
      maturity_score: maturityScore,
      maturity_level: getMaturityLevel(maturityScore),
      by_severity: {
        critical: criticalGaps,
        high: highGaps,
        medium: mediumGaps,
        low: lowGaps
      },
      by_category: Object.fromEntries(
        Object.entries(gaps).map(([category, items]) => [category, items.length])
      ),
      category_weights: ENHANCED_GAP_CATEGORIES,
      has_gaps: totalGaps > 0,
      system_readiness: calculateEnhancedReadiness(gaps, maturityScore),
      industry_alignment: calculateIndustryAlignment(gaps)
    },
    gaps: gaps,
    recommendations: generateEnhancedRecommendations(gaps),
    industry_benchmarks: generateIndustryBenchmarks(gaps),
    implementation_roadmap: generateImplementationRoadmap(gaps)
  };
}

function getMaturityLevel(score) {
  if (score >= 90) return 'EXEMPLARY';
  if (score >= 80) return 'ADVANCED';
  if (score >= 70) return 'INTERMEDIATE';
  if (score >= 60) return 'BASIC';
  return 'INITIAL';
}

function calculateEnhancedReadiness(gaps, maturityScore) {
  const criticalCount = Object.values(gaps).flat().filter(g => g.severity === 'CRITICAL').length;
  const highCount = Object.values(gaps).flat().filter(g => g.severity === 'HIGH').length;
  
  if (criticalCount > 0) return 'NOT_READY';
  if (maturityScore < 60) return 'MAJOR_GAPS';
  if (highCount > 5) return 'MINOR_GAPS';
  if (maturityScore >= 90) return 'PRODUCTION_READY';
  return 'DEVELOPMENT_READY';
}

function calculateIndustryAlignment(gaps) {
  const alignments = {};
  
  // Kubernetes alignment
  const k8sGaps = ['security', 'deployment', 'observability', 'api_integration'].reduce((sum, cat) => 
    sum + gaps[cat]?.length || 0, 0);
  alignments.kubernetes = Math.max(0, 100 - (k8sGaps * 10));
  
  // CNCF alignment
  const cncfGaps = ['observability', 'security', 'deployment'].reduce((sum, cat) => 
    sum + gaps[cat]?.length || 0, 0);
  alignments.cncf = Math.max(0, 100 - (cncfGaps * 15));
  
  // Apache Foundation alignment
  const apacheGaps = ['documentation', 'compliance', 'developer_experience'].reduce((sum, cat) => 
    sum + gaps[cat]?.length || 0, 0);
  alignments.apache_foundation = Math.max(0, 100 - (apacheGaps * 10));
  
  return alignments;
}

function generateEnhancedRecommendations(gaps) {
  const recommendations = [];
  
  // Critical recommendations
  const criticalGaps = Object.values(gaps).flat().filter(g => g.severity === 'CRITICAL');
  if (criticalGaps.length > 0) {
    recommendations.push({
      priority: 'IMMEDIATE',
      timeline: '1-2 weeks',
      action: 'Address critical security and infrastructure gaps',
      items: criticalGaps.map(g => g.category),
      industry_reference: 'Security-first development, infrastructure foundations'
    });
  }
  
  // High priority recommendations
  const highSecurityGaps = gaps.security?.filter(g => g.severity === 'HIGH') || [];
  const highObservabilityGaps = gaps.observability?.filter(g => g.severity === 'HIGH') || [];
  
  if (highSecurityGaps.length > 0 || highObservabilityGaps.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      timeline: '3-4 weeks',
      action: 'Implement production-ready security and observability',
      focus: 'Authentication, monitoring, alerting, logging',
      industry_reference: 'OWASP security, CNCF observability'
    });
  }
  
  // Performance and deployment
  const perfDeploymentGaps = (gaps.performance?.length || 0) + (gaps.deployment?.length || 0);
  if (perfDeploymentGaps > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      timeline: '4-6 weeks',
      action: 'Optimize performance and deployment automation',
      focus: 'CI/CD, containerization, performance testing',
      industry_reference: 'GitOps, Kubernetes deployment patterns'
    });
  }
  
  return recommendations;
}

function generateIndustryBenchmarks(gaps) {
  return {
    kubernetes_governance: {
      score: Math.max(0, 100 - ((gaps.security?.length || 0) + (gaps.deployment?.length || 0)) * 10),
      reference: 'Kubernetes governance model, RBAC, policy enforcement'
    },
    cncf_observability: {
      score: Math.max(0, 100 - (gaps.observability?.length || 0) * 15),
      reference: 'Prometheus, Grafana, OpenTelemetry standards'
    },
    apache_transparency: {
      score: Math.max(0, 100 - ((gaps.documentation?.length || 0) + (gaps.compliance?.length || 0)) * 12),
      reference: 'Apache Foundation transparency, decision making'
    },
    enterprise_security: {
      score: Math.max(0, 100 - (gaps.security?.length || 0) * 20),
      reference: 'Enterprise security frameworks, zero-trust architecture'
    }
  };
}

function generateImplementationRoadmap(gaps) {
  const phases = [];
  
  const criticalGaps = Object.values(gaps).flat().filter(g => g.severity === 'CRITICAL').length;
  if (criticalGaps > 0) {
    phases.push({
      phase: 'Phase 1: Critical Infrastructure',
      timeline: 'Weeks 1-2',
      priority: 'CRITICAL',
      focus: 'Security foundation, backup systems, authentication',
      deliverables: ['Authentication framework', 'TLS/SSL configuration', 'Backup procedures']
    });
  }
  
  const highGaps = Object.values(gaps).flat().filter(g => g.severity === 'HIGH').length;
  if (highGaps > 0) {
    phases.push({
      phase: 'Phase 2: Production Readiness',
      timeline: 'Weeks 3-6',
      priority: 'HIGH',
      focus: 'Monitoring, deployment automation, API documentation',
      deliverables: ['Monitoring stack', 'CI/CD pipeline', 'API specifications']
    });
  }
  
  const mediumGaps = Object.values(gaps).flat().filter(g => g.severity === 'MEDIUM').length;
  if (mediumGaps > 0) {
    phases.push({
      phase: 'Phase 3: Enhancement & Optimization',
      timeline: 'Weeks 7-12',
      priority: 'MEDIUM',
      focus: 'Performance optimization, compliance, developer experience',
      deliverables: ['Performance testing', 'Compliance documentation', 'Developer tools']
    });
  }
  
  return phases;
}

async function checkFileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

function printEnhancedSummary(report) {
  console.log('\n=== ENHANCED GAP ANALYSIS SUMMARY ===');
  console.log(`Framework: ${report.framework}`);
  console.log(`Total gaps found: ${report.summary.total_gaps}`);
  console.log(`Maturity score: ${report.summary.maturity_score}/100 (${report.summary.maturity_level})`);
  console.log(`System readiness: ${report.summary.system_readiness}`);
  
  console.log('\nBy severity:');
  console.log(`  Critical: ${report.summary.by_severity.critical}`);
  console.log(`  High: ${report.summary.by_severity.high}`);
  console.log(`  Medium: ${report.summary.by_severity.medium}`);
  console.log(`  Low: ${report.summary.by_severity.low}`);
  
  console.log('\nBy enhanced categories:');
  Object.entries(report.summary.by_category).forEach(([category, count]) => {
    const config = ENHANCED_GAP_CATEGORIES[category];
    console.log(`  ${category}: ${count} (${config?.criticality})`);
  });
  
  console.log('\nIndustry alignment scores:');
  Object.entries(report.summary.industry_alignment).forEach(([industry, score]) => {
    console.log(`  ${industry}: ${score}%`);
  });
  
  if (report.recommendations.length > 0) {
    console.log('\nTop recommendations:');
    report.recommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`  ${i + 1}. [${rec.priority}] ${rec.action} (${rec.timeline})`);
    });
  }
  
  console.log(`\n=== ENHANCED ANSWER: ${report.summary.has_gaps ? 'SIGNIFICANT GAPS EXIST' : 'MINIMAL GAPS FOUND'} ===`);
  console.log(`Maturity Level: ${report.summary.maturity_level}`);
  console.log(`Industry Readiness: ${report.summary.system_readiness}`);
}

main().catch(e => {
  console.error('[enhanced-gap-analysis] ERROR:', e);
  process.exit(1);
});