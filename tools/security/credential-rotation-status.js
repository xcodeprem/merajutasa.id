#!/usr/bin/env node
/**
 * Credential Rotation Status Reporter
 * Provides comprehensive status reporting for credential rotation system
 */

import fs from 'fs/promises';
import path from 'path';
import { addMetadata, stableStringify } from '../lib/json-stable.js';

const ARTIFACTS_DIR = 'artifacts';
const ROTATION_LOG_FILE = path.join(ARTIFACTS_DIR, 'credential-rotation-log.ndjson');

/**
 * Generate comprehensive credential rotation status report
 */
async function main() {
  try {
    console.log('[rotation-status] Generating credential rotation status report...');

    // Check if this is a status-only request
    const statusOnly = process.argv.includes('--status-only');

    // Analyze rotation log history
    const logAnalysis = await analyzeRotationLogs();

    // Check current protection status
    const protectionStatus = await checkProtectionStatus();

    // Generate comprehensive status report
    const statusReport = await generateStatusReport(logAnalysis, protectionStatus);

    if (statusOnly) {
      // Just display current status
      displayQuickStatus(statusReport);
    } else {
      // Save full report to artifacts
      await saveStatusReport(statusReport);
      console.log(`[rotation-status] Status report saved: ${path.join(ARTIFACTS_DIR, 'credential-rotation-status.json')}`);
    }

  } catch (error) {
    console.error('[rotation-status] Failed to generate status report:', error.message);
    process.exit(1);
  }
}

/**
 * Analyze rotation log history for patterns and compliance
 */
async function analyzeRotationLogs() {
  console.log('[rotation-status] Analyzing rotation log history...');

  const logAnalysis = {
    log_exists: false,
    total_entries: 0,
    recent_activity: [],
    rotation_events: 0,
    emergency_rotations: 0,
    preventive_checks: 0,
    last_rotation: null,
    compliance_status: 'UNKNOWN',
  };

  try {
    const logContent = await fs.readFile(ROTATION_LOG_FILE, 'utf8');
    logAnalysis.log_exists = true;

    const lines = logContent.trim().split('\n').filter(line => line.length > 0);
    logAnalysis.total_entries = lines.length;

    // Analyze each log entry
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);

        // Categorize by event type
        switch (entry.event_type) {
        case 'EMERGENCY_ROTATION_INITIATED':
          logAnalysis.emergency_rotations++;
          logAnalysis.last_rotation = entry.timestamp;
          break;
        case 'PREVENTIVE_ROTATION_CHECK':
          logAnalysis.preventive_checks++;
          break;
        case 'ROTATION_WORKFLOW_COMPLETED':
          logAnalysis.rotation_events++;
          if (entry.status === 'CRITICAL') {
            logAnalysis.last_rotation = entry.timestamp;
          }
          break;
        }

        // Keep recent activity (last 5 entries)
        if (logAnalysis.recent_activity.length < 5) {
          logAnalysis.recent_activity.push({
            timestamp: entry.timestamp,
            event_type: entry.event_type,
            status: entry.status || 'INFO',
          });
        }

      } catch (parseError) {
        console.warn('[rotation-status] Invalid log entry found:', parseError.message);
      }
    }

    // Determine compliance status
    if (logAnalysis.emergency_rotations === 0 && logAnalysis.preventive_checks > 0) {
      logAnalysis.compliance_status = 'COMPLIANT';
    } else if (logAnalysis.emergency_rotations > 0) {
      logAnalysis.compliance_status = 'INCIDENT_RESPONSE_REQUIRED';
    } else {
      logAnalysis.compliance_status = 'NEEDS_ASSESSMENT';
    }

  } catch (error) {
    console.warn('[rotation-status] Could not read rotation log:', error.message);
  }

  return logAnalysis;
}

/**
 * Check current protection status
 */
async function checkProtectionStatus() {
  console.log('[rotation-status] Checking current protection status...');

  const protectionStatus = {
    secret_scanning: 'UNKNOWN',
    pre_commit_hooks: 'UNKNOWN',
    gitignore_protection: 'UNKNOWN',
    rotation_tools: 'UNKNOWN',
    last_scan: null,
  };

  // Check if latest rotation report exists
  try {
    const reportPath = path.join(ARTIFACTS_DIR, 'credential-rotation-report.json');
    const reportContent = await fs.readFile(reportPath, 'utf8');
    const report = JSON.parse(reportContent);

    protectionStatus.secret_scanning = report.protection_status?.secret_scanning || 'UNKNOWN';
    protectionStatus.pre_commit_hooks = report.protection_status?.pre_commit_hooks || 'UNKNOWN';
    protectionStatus.gitignore_protection = report.protection_status?.gitignore_patterns || 'UNKNOWN';
    protectionStatus.rotation_tools = report.protection_status?.rotation_logging || 'UNKNOWN';
    protectionStatus.last_scan = report.timestamp;

  } catch (error) {
    console.warn('[rotation-status] Could not read latest rotation report:', error.message);
  }

  // Check if gitleaks is available
  try {
    await fs.access('/tmp/gitleaks');
    protectionStatus.gitleaks_available = true;
  } catch {
    protectionStatus.gitleaks_available = false;
  }

  // Check if pre-commit hook exists
  try {
    await fs.access('.husky/pre-commit');
    protectionStatus.pre_commit_hook_exists = true;
  } catch {
    protectionStatus.pre_commit_hook_exists = false;
  }

  // Check if .gitignore has secret patterns
  try {
    const gitignoreContent = await fs.readFile('.gitignore', 'utf8');
    protectionStatus.gitignore_has_secret_patterns = gitignoreContent.includes('*.key') ||
                                                    gitignoreContent.includes('*.pem') ||
                                                    gitignoreContent.includes('secret');
  } catch {
    protectionStatus.gitignore_has_secret_patterns = false;
  }

  return protectionStatus;
}

/**
 * Generate comprehensive status report
 */
async function generateStatusReport(logAnalysis, protectionStatus) {
  const timestamp = new Date().toISOString();

  // Determine overall system health
  let overallHealth = 'HEALTHY';
  const healthIssues = [];

  if (logAnalysis.emergency_rotations > 0) {
    overallHealth = 'NEEDS_ATTENTION';
    healthIssues.push('Emergency rotations detected in history');
  }

  if (protectionStatus.secret_scanning !== 'ACTIVE') {
    overallHealth = 'DEGRADED';
    healthIssues.push('Secret scanning not fully active');
  }

  if (!protectionStatus.pre_commit_hook_exists) {
    overallHealth = 'DEGRADED';
    healthIssues.push('Pre-commit hooks not found');
  }

  if (!protectionStatus.gitignore_has_secret_patterns) {
    overallHealth = 'CRITICAL';
    healthIssues.push('Gitignore missing secret protection patterns');
  }

  // Generate recommendations
  const recommendations = [];

  if (logAnalysis.preventive_checks === 0) {
    recommendations.push('Run regular preventive rotation checks');
  }

  if (!protectionStatus.gitleaks_available) {
    recommendations.push('Install gitleaks for comprehensive secret scanning');
  }

  if (logAnalysis.emergency_rotations > 0) {
    recommendations.push('Review emergency rotation procedures and improve prevention');
  }

  if (overallHealth === 'HEALTHY') {
    recommendations.push('Continue current rotation schedule and monitoring');
  }

  return addMetadata({
    status_report: 'credential_rotation_system',
    timestamp,
    overall_health: overallHealth,
    health_issues: healthIssues,
    log_analysis: logAnalysis,
    protection_status: protectionStatus,
    recommendations,
    compliance: {
      rotation_policy_enforced: logAnalysis.compliance_status === 'COMPLIANT',
      audit_trail_maintained: logAnalysis.log_exists,
      emergency_procedures_ready: protectionStatus.rotation_tools === 'ACTIVE',
      secret_detection_active: protectionStatus.secret_scanning === 'ACTIVE',
    },
    next_actions: recommendations.slice(0, 3), // Top 3 recommendations
  }, { category: 'security', name: 'rotation-status-report' });
}

/**
 * Display quick status overview
 */
function displayQuickStatus(statusReport) {
  console.log('\n🔄 CREDENTIAL ROTATION STATUS');
  console.log('═'.repeat(50));
  console.log(`Overall Health: ${getHealthEmoji(statusReport.overall_health)} ${statusReport.overall_health}`);
  console.log(`Last Activity: ${statusReport.log_analysis.recent_activity[0]?.timestamp || 'Never'}`);
  console.log(`Total Log Entries: ${statusReport.log_analysis.total_entries}`);
  console.log(`Emergency Rotations: ${statusReport.log_analysis.emergency_rotations}`);
  console.log(`Preventive Checks: ${statusReport.log_analysis.preventive_checks}`);

  console.log('\n🛡️ PROTECTION STATUS');
  console.log('─'.repeat(30));
  console.log(`Secret Scanning: ${getStatusEmoji(statusReport.protection_status.secret_scanning)} ${statusReport.protection_status.secret_scanning}`);
  console.log(`Pre-commit Hooks: ${getStatusEmoji(statusReport.protection_status.pre_commit_hooks)} ${statusReport.protection_status.pre_commit_hooks}`);
  console.log(`Gitignore Protection: ${statusReport.protection_status.gitignore_has_secret_patterns ? '✅' : '❌'} ${statusReport.protection_status.gitignore_has_secret_patterns ? 'Active' : 'Missing'}`);

  if (statusReport.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS');
    console.log('─'.repeat(20));
    statusReport.recommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
  }

  console.log('');
}

/**
 * Save comprehensive status report
 */
async function saveStatusReport(statusReport) {
  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
  await fs.writeFile(
    path.join(ARTIFACTS_DIR, 'credential-rotation-status.json'),
    stableStringify(statusReport, null, 2),
  );
}

/**
 * Get health emoji for display
 */
function getHealthEmoji(health) {
  switch (health) {
  case 'HEALTHY': return '✅';
  case 'DEGRADED': return '⚠️';
  case 'NEEDS_ATTENTION': return '🔶';
  case 'CRITICAL': return '🔴';
  default: return '❓';
  }
}

/**
 * Get status emoji for display
 */
function getStatusEmoji(status) {
  switch (status) {
  case 'ACTIVE': return '✅';
  case 'INACTIVE': return '❌';
  case 'DEGRADED': return '⚠️';
  default: return '❓';
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('[rotation-status] Fatal error:', error);
    process.exit(1);
  });
}

export { main as runRotationStatus };
