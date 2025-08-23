#!/usr/bin/env node
/**
 * phase1-status.js
 * Phase 1 Implementation Status Checker and Demo Script
 * Validates all Phase 1 infrastructure components and provides usage examples
 */

import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Phase 1 Implementation Checklist
 */
const PHASE1_CHECKLIST = {
  'Security Foundation': {
    'HTTPS/TLS Configuration': {
      files: ['infrastructure/reverse-proxy/nginx.conf', 'infrastructure/reverse-proxy/generate-certs.sh'],
      status: 'pending',
    },
    'Authentication Middleware': {
      files: ['infrastructure/auth/auth-middleware.js'],
      status: 'pending',
    },
    'Input Validation': {
      files: ['infrastructure/security/input-validator.js'],
      status: 'pending',
    },
    'Rate Limiting': {
      files: ['infrastructure/security/rate-limiter.js'],
      status: 'pending',
    },
  },
  'Observability Stack': {
    'Metrics Collection': {
      files: ['infrastructure/monitoring/metrics-collector.js'],
      status: 'pending',
    },
    'Structured Logging': {
      files: ['infrastructure/monitoring/structured-logger.js'],
      status: 'pending',
    },
    'Service Enhancement': {
      files: ['tools/services/signer-enhanced.js'],
      status: 'pending',
    },
  },
  'Backup & Recovery': {
    'Backup Service': {
      files: ['infrastructure/backup/backup-service.js'],
      status: 'pending',
    },
    'Disaster Recovery': {
      files: ['infrastructure/backup/backup-service.js'],
      status: 'pending',
    },
  },
  'Integration & Testing': {
    'Infrastructure Tests': {
      files: ['tools/tests/infrastructure-integration.test.js'],
      status: 'pending',
    },
    'Enhanced npm Scripts': {
      files: ['package.json'],
      status: 'pending',
    },
  },
};

/**
 * Check if a file exists and get its size
 */
async function checkFile(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      size: stats.size,
      sizeKB: Math.round(stats.size / 1024 * 100) / 100,
    };
  } catch {
    return {
      exists: false,
      size: 0,
      sizeKB: 0,
    };
  }
}

/**
 * Check Phase 1 implementation status
 */
async function checkPhase1Status() {
  console.log('🔍 Checking Phase 1 Implementation Status...\n');

  let totalComponents = 0;
  let completedComponents = 0;
  let totalFiles = 0;
  let implementedFiles = 0;
  let totalSize = 0;

  for (const [category, components] of Object.entries(PHASE1_CHECKLIST)) {
    console.log(`📁 ${category}`);
    console.log('─'.repeat(50));

    for (const [componentName, component] of Object.entries(components)) {
      totalComponents++;
      let componentComplete = true;
      let componentSize = 0;

      console.log(`  🔧 ${componentName}`);

      for (const file of component.files) {
        totalFiles++;
        const fileStatus = await checkFile(file);

        const status = fileStatus.exists ? '✅' : '❌';
        const sizeInfo = fileStatus.exists ? `(${fileStatus.sizeKB} KB)` : '';

        console.log(`    ${status} ${file} ${sizeInfo}`);

        if (fileStatus.exists) {
          implementedFiles++;
          componentSize += fileStatus.size;
          totalSize += fileStatus.size;
        } else {
          componentComplete = false;
        }
      }

      if (componentComplete) {
        completedComponents++;
        PHASE1_CHECKLIST[category][componentName].status = 'completed';
        console.log(`    ✅ Component complete (${Math.round(componentSize / 1024 * 100) / 100} KB)`);
      } else {
        PHASE1_CHECKLIST[category][componentName].status = 'incomplete';
        console.log('    ❌ Component incomplete');
      }

      console.log();
    }
  }

  return {
    totalComponents,
    completedComponents,
    totalFiles,
    implementedFiles,
    totalSize,
    completionPercentage: Math.round((completedComponents / totalComponents) * 100),
  };
}

/**
 * Check npm scripts implementation
 */
async function checkNpmScripts() {
  console.log('📦 Checking npm Scripts Implementation...\n');

  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    const scripts = packageJson.scripts;

    const infraScripts = [
      'infra:nginx',
      'infra:generate-certs',
      'infra:metrics',
      'infra:backup',
      'infra:backup:create',
      'infra:backup:list',
      'infra:start-all',
      'test:infrastructure',
      'gap:enhanced',
    ];

    let implementedScripts = 0;

    for (const script of infraScripts) {
      if (scripts[script]) {
        console.log(`✅ ${script}: ${scripts[script]}`);
        implementedScripts++;
      } else {
        console.log(`❌ ${script}: Not implemented`);
      }
    }

    console.log(`\n📊 Scripts Status: ${implementedScripts}/${infraScripts.length} implemented\n`);

    return {
      total: infraScripts.length,
      implemented: implementedScripts,
    };
  } catch (error) {
    console.error('❌ Failed to check npm scripts:', error.message);
    return { total: 0, implemented: 0 };
  }
}

/**
 * Demonstrate Phase 1 capabilities
 */
async function demonstrateCapabilities() {
  console.log('🎯 Phase 1 Implementation Demonstration\n');

  // Demo 1: Enhanced Gap Analysis
  console.log('📊 Enhanced Gap Analysis:');
  try {
    const { stdout } = await execAsync('node tools/gap-analysis-enhanced.js', { timeout: 30000 });
    console.log('✅ Enhanced gap analysis completed');
    console.log('📄 Results available in artifacts/gap-analysis-enhanced.json\n');
  } catch (error) {
    console.log('❌ Enhanced gap analysis failed:', error.message.substring(0, 100) + '...\n');
  }

  // Demo 2: Backup Service
  console.log('💾 Backup Service Demonstration:');
  try {
    const { default: backupService } = await import('../infrastructure/backup/backup-service.js');
    await backupService.initialize();

    console.log('✅ Backup service initialized');

    const stats = await backupService.getBackupStatistics();
    console.log(`📊 Current backups: ${stats.totalBackups}`);
    console.log(`💾 Total backup size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB\n`);
  } catch (error) {
    console.log('❌ Backup service demo failed:', error.message.substring(0, 100) + '...\n');
  }

  // Demo 3: Infrastructure Tests
  console.log('🧪 Infrastructure Tests:');
  try {
    console.log('💡 To run full infrastructure tests:');
    console.log('   npm run test:infrastructure');
    console.log('📝 Test validates authentication, validation, rate limiting, metrics, logging, and backup\n');
  } catch (error) {
    console.log('❌ Infrastructure tests info failed\n');
  }

  // Demo 4: Usage Examples
  console.log('💡 Usage Examples:');
  console.log('');
  console.log('🔐 Start Enhanced Services:');
  console.log('   npm run infra:start-all    # Start all services with infrastructure');
  console.log('   npm run service:signer     # Original signer service');
  console.log('   node tools/services/signer-enhanced.js  # Enhanced signer with security');
  console.log('');
  console.log('🛡️  Generate SSL Certificates:');
  console.log('   npm run infra:generate-certs  # Generate development certificates');
  console.log('');
  console.log('📊 Monitoring:');
  console.log('   npm run infra:metrics      # Start metrics collector (port 9090)');
  console.log('   curl http://localhost:9090/metrics  # View Prometheus metrics');
  console.log('');
  console.log('💾 Backup Operations:');
  console.log('   npm run infra:backup:create   # Create full system backup');
  console.log('   npm run infra:backup:list     # List all backups');
  console.log('   npm run infra:backup:cleanup  # Clean old backups');
  console.log('');
  console.log('🧪 Testing:');
  console.log('   npm run test:infrastructure   # Run infrastructure integration tests');
  console.log('   npm run gap:enhanced          # Run enhanced gap analysis');
  console.log('');
}

/**
 * Generate implementation report
 */
async function generateImplementationReport(status, scriptStatus) {
  const report = {
    timestamp: new Date().toISOString(),
    phase: 'Phase 1 - Security Foundation & Observability',
    version: '1.0.0',
    status: {
      overall: status.completionPercentage >= 90 ? 'COMPLETED' : status.completionPercentage >= 70 ? 'NEARLY_COMPLETE' : 'IN_PROGRESS',
      completionPercentage: status.completionPercentage,
    },
    implementation: {
      components: {
        total: status.totalComponents,
        completed: status.completedComponents,
        percentage: Math.round((status.completedComponents / status.totalComponents) * 100),
      },
      files: {
        total: status.totalFiles,
        implemented: status.implementedFiles,
        percentage: Math.round((status.implementedFiles / status.totalFiles) * 100),
      },
      scripts: {
        total: scriptStatus.total,
        implemented: scriptStatus.implemented,
        percentage: Math.round((scriptStatus.implemented / scriptStatus.total) * 100),
      },
      codeSize: {
        totalBytes: status.totalSize,
        totalKB: Math.round(status.totalSize / 1024 * 100) / 100,
        totalMB: Math.round(status.totalSize / 1024 / 1024 * 100) / 100,
      },
    },
    checklist: PHASE1_CHECKLIST,
    achievements: [],
    nextSteps: [],
  };

  // Determine achievements
  if (status.completionPercentage >= 100) {
    report.achievements.push('✅ Phase 1 implementation COMPLETED');
    report.achievements.push('✅ All security foundation components implemented');
    report.achievements.push('✅ All observability stack components implemented');
    report.achievements.push('✅ All backup & recovery components implemented');
    report.achievements.push('✅ All integration tests implemented');
  } else if (status.completionPercentage >= 90) {
    report.achievements.push('🎯 Phase 1 implementation NEARLY COMPLETE');
    report.achievements.push('✅ Major infrastructure components implemented');
  } else if (status.completionPercentage >= 50) {
    report.achievements.push('🚧 Phase 1 implementation IN PROGRESS');
    report.achievements.push('✅ Core infrastructure foundation established');
  }

  // Determine next steps
  if (status.completionPercentage < 100) {
    for (const [category, components] of Object.entries(PHASE1_CHECKLIST)) {
      for (const [componentName, component] of Object.entries(components)) {
        if (component.status !== 'completed') {
          report.nextSteps.push(`🔧 Complete ${componentName} in ${category}`);
        }
      }
    }
  } else {
    report.nextSteps.push('🚀 Begin Phase 2: Advanced Monitoring & Scaling');
    report.nextSteps.push('📊 Implement advanced observability features');
    report.nextSteps.push('🏗️  Add Infrastructure as Code (IaC)');
    report.nextSteps.push('☁️  Implement cloud deployment strategies');
  }

  return report;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Phase 1 Implementation Status Report');
  console.log('═'.repeat(60));
  console.log('📅 Generated:', new Date().toISOString());
  console.log('🎯 Phase: Security Foundation & Observability');
  console.log('═'.repeat(60));
  console.log();

  // Check implementation status
  const status = await checkPhase1Status();

  console.log('═'.repeat(60));

  // Check npm scripts
  const scriptStatus = await checkNpmScripts();

  console.log('═'.repeat(60));

  // Generate and display summary
  console.log('📊 IMPLEMENTATION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`🎯 Overall Completion: ${status.completionPercentage}%`);
  console.log(`🔧 Components: ${status.completedComponents}/${status.totalComponents} completed`);
  console.log(`📄 Files: ${status.implementedFiles}/${status.totalFiles} implemented`);
  console.log(`📦 Scripts: ${scriptStatus.implemented}/${scriptStatus.total} implemented`);
  console.log(`💾 Code Size: ${Math.round(status.totalSize / 1024 * 100) / 100} KB`);

  // Status indicator
  if (status.completionPercentage >= 90) {
    console.log('🎉 Status: PHASE 1 NEARLY COMPLETE!');
  } else if (status.completionPercentage >= 70) {
    console.log('🚧 Status: Phase 1 Major Progress');
  } else if (status.completionPercentage >= 50) {
    console.log('🚀 Status: Phase 1 In Progress');
  } else {
    console.log('🏗️  Status: Phase 1 Getting Started');
  }

  console.log();
  console.log('═'.repeat(60));

  // Generate detailed report
  const report = await generateImplementationReport(status, scriptStatus);

  // Save report
  await fs.mkdir('./artifacts', { recursive: true });
  await fs.writeFile('./artifacts/phase1-implementation-report.json', JSON.stringify(report, null, 2));

  console.log('📄 Detailed report saved to: ./artifacts/phase1-implementation-report.json');

  // Demonstrate capabilities
  await demonstrateCapabilities();

  console.log('═'.repeat(60));
  console.log('🎯 Phase 1 Implementation Status Check Complete!');
  console.log('═'.repeat(60));

  return report;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Phase 1 status check failed:', error);
    process.exit(1);
  });
}

export { main as checkPhase1Status, PHASE1_CHECKLIST };
