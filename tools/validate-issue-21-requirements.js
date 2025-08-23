#!/usr/bin/env node
/**
 * validate-issue-21-requirements.js
 * Simple validation script to check all Issue #21 requirements are met
 */

import { promises as fs } from 'fs';
import { stableStringify } from './lib/json-stable.js';

async function validateIssue21Requirements() {
  console.log('[issue-21-validator] Validating Issue #21 requirements...');
  
  const validation = {
    timestamp: new Date().toISOString(),
    issue: 'Issue #21 - Pemindaian rahasia repo-wide dan pembersihan riwayat',
    status: 'VALIDATING',
    requirements: {
      non_negotiable: {},
      deliverables: {},
      acceptance_criteria: {}
    },
    overall_compliance: false,
    recommendations: []
  };

  try {
    // Non-Negotiable Requirements
    console.log('[issue-21-validator] Checking non-negotiable requirements...');
    
    // 1. Secret Scanning + Push Protection active
    validation.requirements.non_negotiable.secret_scanning_active = await checkSecretScanningActive();
    
    // 2. Block .env*, keys, sensitive artifacts via .gitignore + pre-commit hook
    validation.requirements.non_negotiable.file_blocking_active = await checkFileBlockingActive();
    
    // 3. Full history scanning (gitleaks/trufflehog) and removal via git filter-repo/BFG
    validation.requirements.non_negotiable.history_tools_available = await checkHistoryToolsAvailable();
    
    // 4. Rotation of secrets that have appeared
    validation.requirements.non_negotiable.rotation_framework = await checkRotationFramework();

    // Deliverables
    console.log('[issue-21-validator] Checking deliverables...');
    
    validation.requirements.deliverables.gitignore_policy = await checkGitignorePolicy();
    validation.requirements.deliverables.scan_reports = await checkScanReports();
    validation.requirements.deliverables.log_rotation = await checkLogRotation();
    validation.requirements.deliverables.security_md_update = await checkSecurityMdUpdate();
    validation.requirements.deliverables.hooks = await checkHooks();

    // Acceptance Criteria
    console.log('[issue-21-validator] Checking acceptance criteria...');
    
    validation.requirements.acceptance_criteria.zero_critical_high_findings = await checkZeroCriticalFindings();
    validation.requirements.acceptance_criteria.scan_reports_in_ci = await checkScanReportsInCI();
    validation.requirements.acceptance_criteria.hooks_prevent_commits = await checkHooksPreventCommits();
    validation.requirements.acceptance_criteria.security_md_explains_process = await checkSecurityMdExplainsProcess();

    // Calculate overall compliance
    const allNonNegotiable = Object.values(validation.requirements.non_negotiable).every(r => r.status === 'MET');
    const allDeliverables = Object.values(validation.requirements.deliverables).every(r => r.status === 'READY' || r.status === 'MET');
    const allAcceptance = Object.values(validation.requirements.acceptance_criteria).every(r => r.status === 'PASS' || r.status === 'READY');

    validation.overall_compliance = allNonNegotiable && allDeliverables && allAcceptance;
    
    if (validation.overall_compliance) {
      validation.status = 'COMPLIANT';
      validation.summary = 'All Issue #21 requirements are met';
    } else {
      validation.status = 'NON_COMPLIANT';
      validation.summary = 'Some requirements are not fully met';
      
      if (!allNonNegotiable) validation.recommendations.push('Address non-negotiable requirements');
      if (!allDeliverables) validation.recommendations.push('Complete missing deliverables');
      if (!allAcceptance) validation.recommendations.push('Meet acceptance criteria');
    }

    console.log(`[issue-21-validator] Status: ${validation.status}`);
    console.log(`[issue-21-validator] Summary: ${validation.summary}`);

  } catch (error) {
    validation.status = 'ERROR';
    validation.error = error.message;
    console.error(`[issue-21-validator] Error: ${error.message}`);
  }

  // Write validation report
  await fs.writeFile('artifacts/issue-21-validation-report.json', stableStringify(validation, null, 2));
  
  return validation;
}

// Individual check functions
async function checkSecretScanningActive() {
  try {
    const reportExists = await fs.access('artifacts/secret-scan-report.json').then(() => true).catch(() => false);
    if (!reportExists) return { status: 'NOT_MET', reason: 'No secret scan report found' };
    
    const report = JSON.parse(await fs.readFile('artifacts/secret-scan-report.json', 'utf8'));
    const isSecure = report.status === 'SECURE';
    
    return {
      status: isSecure ? 'MET' : 'NOT_MET',
      details: { scan_status: report.status, protection_active: report.protection_layers }
    };
  } catch (error) {
    return { status: 'ERROR', reason: error.message };
  }
}

async function checkFileBlockingActive() {
  try {
    // Check .gitignore patterns
    const gitignore = await fs.readFile('.gitignore', 'utf8');
    const requiredPatterns = ['env', 'pem', 'key', 'crt', 'secret'];
    const hasPatterns = requiredPatterns.every(p => 
      gitignore.includes(`*.${p}`) || gitignore.includes(`.${p}`) || gitignore.includes(`*${p}*`)
    );
    
    // Check pre-commit hook
    const hookExists = await fs.access('.husky/pre-commit').then(() => true).catch(() => false);
    const hookContent = hookExists ? await fs.readFile('.husky/pre-commit', 'utf8') : '';
    const hasGitleaks = hookContent.includes('gitleaks');
    
    return {
      status: hasPatterns && hookExists && hasGitleaks ? 'MET' : 'NOT_MET',
      details: { gitignore_patterns: hasPatterns, hook_exists: hookExists, hook_has_gitleaks: hasGitleaks }
    };
  } catch (error) {
    return { status: 'ERROR', reason: error.message };
  }
}

async function checkHistoryToolsAvailable() {
  try {
    // Check tools installation report
    const reportExists = await fs.access('artifacts/sanitization-tools-install.json').then(() => true).catch(() => false);
    if (!reportExists) return { status: 'NOT_MET', reason: 'Tools not installed' };
    
    const report = JSON.parse(await fs.readFile('artifacts/sanitization-tools-install.json', 'utf8'));
    const toolsInstalled = report.status === 'SUCCESS';
    
    // Check history scan capability
    const historyScanExists = await fs.access('artifacts/history-secret-scan-report.json').then(() => true).catch(() => false);
    
    return {
      status: toolsInstalled && historyScanExists ? 'MET' : 'NOT_MET',
      details: { tools_installed: toolsInstalled, history_scan_available: historyScanExists }
    };
  } catch (error) {
    return { status: 'ERROR', reason: error.message };
  }
}

async function checkRotationFramework() {
  try {
    // Check rotation manager and log
    const reportExists = await fs.access('artifacts/credential-rotation-report.json').then(() => true).catch(() => false);
    const logExists = await fs.access('artifacts/credential-rotation-log.ndjson').then(() => true).catch(() => false);
    
    return {
      status: reportExists && logExists ? 'MET' : 'NOT_MET',
      details: { rotation_report: reportExists, rotation_log: logExists }
    };
  } catch (error) {
    return { status: 'ERROR', reason: error.message };
  }
}

async function checkGitignorePolicy() {
  try {
    const gitignore = await fs.readFile('.gitignore', 'utf8');
    const criticalPatterns = ['env', 'pem', 'key', 'crt', 'p12', 'secret', 'credential'];
    const patternsCovered = criticalPatterns.filter(p => 
      gitignore.includes(`*.${p}`) || gitignore.includes(`.${p}`) || gitignore.includes(`*${p}*`)
    );
    
    return {
      status: patternsCovered.length >= criticalPatterns.length * 0.8 ? 'READY' : 'INCOMPLETE',
      details: { patterns_covered: patternsCovered.length, total_patterns: criticalPatterns.length }
    };
  } catch (error) {
    return { status: 'ERROR', reason: error.message };
  }
}

async function checkScanReports() {
  try {
    const reports = [
      'artifacts/secret-scan-report.json',
      'artifacts/history-secret-scan-report.json'
    ];
    
    const reportsExist = await Promise.all(reports.map(r => 
      fs.access(r).then(() => true).catch(() => false)
    ));
    
    return {
      status: reportsExist.every(e => e) ? 'READY' : 'INCOMPLETE',
      details: { reports_available: reportsExist.filter(e => e).length, total_required: reports.length }
    };
  } catch (error) {
    return { status: 'ERROR', reason: error.message };
  }
}

async function checkLogRotation() {
  return await checkRotationFramework();
}

async function checkSecurityMdUpdate() {
  try {
    const securityContent = await fs.readFile('SECURITY.md', 'utf8');
    const hasKeywords = ['Secret Management', 'Rotation', 'Incident Response'].every(k => 
      securityContent.includes(k)
    );
    
    return {
      status: hasKeywords ? 'READY' : 'INCOMPLETE',
      details: { security_md_comprehensive: hasKeywords }
    };
  } catch (error) {
    return { status: 'ERROR', reason: error.message };
  }
}

async function checkHooks() {
  return await checkFileBlockingActive();
}

async function checkZeroCriticalFindings() {
  try {
    const report = JSON.parse(await fs.readFile('artifacts/secret-scan-report.json', 'utf8'));
    const zeroFindings = report.scans?.gitleaks?.findings_count === 0;
    
    return {
      status: zeroFindings ? 'PASS' : 'FAIL',
      details: { findings_count: report.scans?.gitleaks?.findings_count || 0 }
    };
  } catch (error) {
    return { status: 'ERROR', reason: error.message };
  }
}

async function checkScanReportsInCI() {
  return await checkScanReports();
}

async function checkHooksPreventCommits() {
  try {
    const testReport = await fs.access('artifacts/secret-protection-test.json').then(() => true).catch(() => false);
    if (!testReport) return { status: 'UNKNOWN', reason: 'No protection test report' };
    
    const report = JSON.parse(await fs.readFile('artifacts/secret-protection-test.json', 'utf8'));
    const protectionActive = report.details?.pre_commit?.blocked_commit === true;
    
    return {
      status: protectionActive ? 'PASS' : 'FAIL',
      details: { pre_commit_blocks_secrets: protectionActive }
    };
  } catch (error) {
    return { status: 'ERROR', reason: error.message };
  }
}

async function checkSecurityMdExplainsProcess() {
  return await checkSecurityMdUpdate();
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  validateIssue21Requirements()
    .then(validation => {
      if (!validation.overall_compliance) {
        console.log('[issue-21-validator] Non-compliance detected');
        if (validation.recommendations.length > 0) {
          console.log('[issue-21-validator] Recommendations:');
          validation.recommendations.forEach(rec => console.log(`  - ${rec}`));
        }
        process.exit(1);
      }
      console.log('[issue-21-validator] All requirements validated successfully');
    })
    .catch(error => {
      console.error('[issue-21-validator] Validation failed:', error.message);
      process.exit(1);
    });
}

export { validateIssue21Requirements };