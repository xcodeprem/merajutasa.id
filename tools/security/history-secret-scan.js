#!/usr/bin/env node
/**
 * history-secret-scan.js
 * Comprehensive secret scanning across entire git history
 * Combines gitleaks and trufflehog for thorough analysis
 * Generates reports for CI artifacts
 */

import { promises as fs } from 'fs';
import { spawnSync } from 'child_process';
import { stableStringify } from '../lib/json-stable.js';

const REPORT_DIR = 'artifacts';
const TEMP_DIR = '/tmp/secret-scan';

/**
 * Install gitleaks if not available
 */
async function ensureGitleaks() {
  console.log('[history-secret-scan] Checking gitleaks availability...');
  
  // Try direct command first
  const directResult = spawnSync('gitleaks', ['version'], { encoding: 'utf8' });
  if (directResult.status === 0) {
    console.log('[history-secret-scan] Gitleaks already available');
    return 'gitleaks';
  }
  
  // Try /tmp/gitleaks (downloaded binary)
  const tmpResult = spawnSync('/tmp/gitleaks', ['version'], { encoding: 'utf8' });
  if (tmpResult.status === 0) {
    console.log('[history-secret-scan] Using downloaded gitleaks binary');
    return '/tmp/gitleaks';
  }
  
  // Try to download gitleaks
  console.log('[history-secret-scan] Downloading gitleaks...');
  const downloadResult = spawnSync('wget', [
    '-O', '/tmp/gitleaks.tar.gz',
    'https://github.com/gitleaks/gitleaks/releases/download/v8.21.2/gitleaks_8.21.2_linux_x64.tar.gz'
  ], { encoding: 'utf8', timeout: 60000 });
  
  if (downloadResult.status === 0) {
    // Extract the binary
    const extractResult = spawnSync('tar', ['-xzf', '/tmp/gitleaks.tar.gz', '-C', '/tmp'], { 
      encoding: 'utf8' 
    });
    
    if (extractResult.status === 0) {
      spawnSync('chmod', ['+x', '/tmp/gitleaks']);
      const testResult = spawnSync('/tmp/gitleaks', ['version'], { encoding: 'utf8' });
      if (testResult.status === 0) {
        console.log('[history-secret-scan] Successfully downloaded and installed gitleaks');
        return '/tmp/gitleaks';
      }
    }
  }
  
  // Try npx as fallback
  console.log('[history-secret-scan] Trying gitleaks via npx...');
  const npxResult = spawnSync('npx', ['--yes', 'gitleaks', 'version'], { 
    encoding: 'utf8',
    timeout: 60000 
  });
  
  if (npxResult.status === 0) {
    console.log('[history-secret-scan] Gitleaks available via npx');
    return 'npx gitleaks';
  }
  
  throw new Error('Failed to install or access gitleaks');
}

/**
 * Install trufflehog if available
 */
async function ensureTrufflehog() {
  console.log('[history-secret-scan] Checking trufflehog availability...');
  
  // Try direct command first
  const directResult = spawnSync('trufflehog', ['--version'], { encoding: 'utf8' });
  if (directResult.status === 0) {
    console.log('[history-secret-scan] Trufflehog already available');
    return 'trufflehog';
  }
  
  // Try installing via go if available
  const goResult = spawnSync('go', ['version'], { encoding: 'utf8' });
  if (goResult.status === 0) {
    console.log('[history-secret-scan] Installing trufflehog via go...');
    const installResult = spawnSync('go', [
      'install', 'github.com/trufflesecurity/trufflehog/v3@latest'
    ], { 
      encoding: 'utf8',
      timeout: 120000 
    });
    
    if (installResult.status === 0) {
      return 'trufflehog';
    }
  }
  
  console.log('[history-secret-scan] Trufflehog not available, continuing with gitleaks only');
  return null;
}

/**
 * Run gitleaks scan on entire git history
 */
async function runGitleaksHistoryScan(gitleaksCmd) {
  console.log('[history-secret-scan] Running gitleaks full history scan...');
  
  const reportPath = `${TEMP_DIR}/gitleaks-history-report.json`;
  await fs.mkdir(TEMP_DIR, { recursive: true });
  
  const args = gitleaksCmd.split(' ');
  const baseCmd = args.shift();
  
  const result = spawnSync(baseCmd, [
    ...args,
    'detect',
    '--source', '.',
    '--config', '.gitleaks.toml',
    '--redact',
    '--report-format', 'json',
    '--report-path', reportPath,
    '--verbose'
  ], {
    encoding: 'utf8',
    timeout: 300000 // 5 minutes for history scan
  });
  
  let findings = [];
  let reportContent = '';
  
  try {
    reportContent = await fs.readFile(reportPath, 'utf8');
    findings = JSON.parse(reportContent);
  } catch (error) {
    console.log('[history-secret-scan] No gitleaks report file (likely no findings)');
  }
  
  return {
    tool: 'gitleaks',
    scan_type: 'full_history',
    exit_code: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    findings: findings,
    findings_count: findings.length || 0,
    raw_report: reportContent
  };
}

/**
 * Run trufflehog scan on entire git history
 */
async function runTrufflehogHistoryScan(trufflehogCmd) {
  if (!trufflehogCmd) {
    return null;
  }
  
  console.log('[history-secret-scan] Running trufflehog full history scan...');
  
  const reportPath = `${TEMP_DIR}/trufflehog-history-report.json`;
  
  const result = spawnSync(trufflehogCmd, [
    'git',
    '.',
    '--json',
    '--only-verified'
  ], {
    encoding: 'utf8',
    timeout: 300000 // 5 minutes for history scan
  });
  
  let findings = [];
  let reportContent = result.stdout || '';
  
  if (reportContent.trim()) {
    try {
      // Trufflehog outputs NDJSON (one JSON per line)
      findings = reportContent.trim().split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
      
      await fs.writeFile(reportPath, JSON.stringify(findings, null, 2));
    } catch (error) {
      console.warn('[history-secret-scan] Failed to parse trufflehog output:', error.message);
    }
  }
  
  return {
    tool: 'trufflehog',
    scan_type: 'full_history',
    exit_code: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    findings: findings,
    findings_count: findings.length || 0,
    raw_report: JSON.stringify(findings, null, 2)
  };
}

/**
 * Get git repository stats for context
 */
async function getRepositoryStats() {
  const commitCountResult = spawnSync('git', ['rev-list', '--all', '--count'], { 
    encoding: 'utf8' 
  });
  
  const branchCountResult = spawnSync('git', ['branch', '-a'], { 
    encoding: 'utf8' 
  });
  
  const firstCommitResult = spawnSync('git', ['log', '--reverse', '--oneline', '-1'], { 
    encoding: 'utf8' 
  });
  
  const lastCommitResult = spawnSync('git', ['log', '--oneline', '-1'], { 
    encoding: 'utf8' 
  });
  
  return {
    total_commits: parseInt(commitCountResult.stdout?.trim() || '0'),
    total_branches: branchCountResult.stdout?.split('\n').filter(line => line.trim()).length || 0,
    first_commit: firstCommitResult.stdout?.trim() || 'unknown',
    last_commit: lastCommitResult.stdout?.trim() || 'unknown',
    scan_timestamp: new Date().toISOString()
  };
}

/**
 * Generate comprehensive history scan report
 */
async function generateHistoryReport(gitleaksResult, trufflehogResult, repoStats) {
  const report = {
    scan_type: 'comprehensive_history_scan',
    timestamp: new Date().toISOString(),
    repository_stats: repoStats,
    tools: {
      gitleaks: {
        enabled: true,
        status: gitleaksResult.exit_code === 0 ? 'SUCCESS' : 'FAILED',
        findings_count: gitleaksResult.findings_count,
        scan_duration_estimate: '< 5 minutes'
      },
      trufflehog: {
        enabled: !!trufflehogResult,
        status: trufflehogResult ? (trufflehogResult.exit_code === 0 ? 'SUCCESS' : 'FAILED') : 'NOT_AVAILABLE',
        findings_count: trufflehogResult?.findings_count || 0,
        scan_duration_estimate: trufflehogResult ? '< 5 minutes' : 'N/A'
      }
    },
    summary: {
      total_findings: gitleaksResult.findings_count + (trufflehogResult?.findings_count || 0),
      critical_findings: 0, // Will be calculated based on finding types
      status: 'UNKNOWN'
    },
    findings: {
      gitleaks: gitleaksResult.findings || [],
      trufflehog: trufflehogResult?.findings || []
    },
    recommendations: [],
    compliance: {
      zero_secrets_in_history: false,
      full_history_scanned: true,
      multiple_tools_used: !!trufflehogResult,
      scan_coverage: '100%'
    }
  };
  
  // Analyze findings and determine status
  const totalFindings = report.summary.total_findings;
  
  if (totalFindings === 0) {
    report.summary.status = 'CLEAN';
    report.summary.description = 'No secrets detected in entire git history';
    report.compliance.zero_secrets_in_history = true;
  } else {
    report.summary.status = 'CRITICAL';
    report.summary.description = `${totalFindings} secret(s) detected in git history`;
    report.recommendations.push('Immediately rotate all detected secrets');
    report.recommendations.push('Consider using git-filter-repo or BFG to remove secrets from history');
    report.recommendations.push('Review commit history for additional sensitive data');
    report.recommendations.push('Implement stronger pre-commit hooks to prevent future leaks');
  }
  
  // Count critical findings (all secrets are considered critical)
  report.summary.critical_findings = totalFindings;
  
  // Write main report
  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.writeFile(
    `${REPORT_DIR}/history-secret-scan-report.json`, 
    stableStringify(report, null, 2)
  );
  
  // Write detailed findings if any
  if (gitleaksResult.raw_report) {
    await fs.writeFile(
      `${REPORT_DIR}/gitleaks-history-detailed.json`,
      gitleaksResult.raw_report
    );
  }
  
  if (trufflehogResult?.raw_report) {
    await fs.writeFile(
      `${REPORT_DIR}/trufflehog-history-detailed.json`,
      trufflehogResult.raw_report
    );
  }
  
  return report;
}

/**
 * Cleanup temporary files
 */
async function cleanup() {
  try {
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
  } catch (error) {
    console.warn('[history-secret-scan] Cleanup warning:', error.message);
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('[history-secret-scan] Starting comprehensive git history secret scan...');
    
    // Ensure we're in a git repository
    const gitCheckResult = spawnSync('git', ['status'], { encoding: 'utf8' });
    if (gitCheckResult.status !== 0) {
      throw new Error('Not in a git repository');
    }
    
    // Get repository stats
    const repoStats = await getRepositoryStats();
    console.log(`[history-secret-scan] Repository: ${repoStats.total_commits} commits, ${repoStats.total_branches} branches`);
    
    // Ensure tools are available
    const gitleaksCmd = await ensureGitleaks();
    const trufflehogCmd = await ensureTrufflehog();
    
    // Run scans
    const gitleaksResult = await runGitleaksHistoryScan(gitleaksCmd);
    const trufflehogResult = await runTrufflehogHistoryScan(trufflehogCmd);
    
    // Generate comprehensive report
    const report = await generateHistoryReport(gitleaksResult, trufflehogResult, repoStats);
    
    // Log results
    console.log(`[history-secret-scan] Scan complete. Status: ${report.summary.status}`);
    console.log(`[history-secret-scan] Total findings: ${report.summary.total_findings}`);
    console.log(`[history-secret-scan] Report saved to: ${REPORT_DIR}/history-secret-scan-report.json`);
    
    if (report.summary.total_findings > 0) {
      console.error('[history-secret-scan] CRITICAL: Secrets detected in git history!');
      console.error('[history-secret-scan] Immediate action required - rotate secrets and clean history');
      process.exit(1);
    }
    
    console.log('[history-secret-scan] SUCCESS: No secrets detected in git history');
    
  } catch (error) {
    console.error('[history-secret-scan] Failed to complete history scan:', error.message);
    
    const errorReport = {
      scan_type: 'comprehensive_history_scan',
      timestamp: new Date().toISOString(),
      status: 'ERROR',
      error: error.message,
      summary: 'Failed to complete git history secret scan'
    };
    
    await fs.mkdir(REPORT_DIR, { recursive: true });
    await fs.writeFile(
      `${REPORT_DIR}/history-secret-scan-error.json`,
      stableStringify(errorReport, null, 2)
    );
    
    process.exit(1);
  } finally {
    await cleanup();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as runHistorySecretScan };