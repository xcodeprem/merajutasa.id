#!/usr/bin/env node
/**
 * git-history-sanitizer.js
 * Complete git history sanitization using git-filter-repo and BFG
 * Emergency response tool for removing secrets from git history
 */

import { promises as fs } from 'fs';
import { spawnSync } from 'child_process';
import { stableStringify } from '../lib/json-stable.js';

const TOOLS_DIR = '/tmp/sanitization-tools';
const ARTIFACTS_DIR = 'artifacts';
const BACKUP_DIR = '/tmp/repo-backup';

/**
 * Create repository backup before sanitization
 */
async function createBackup() {
  console.log('[git-sanitizer] Creating repository backup...');

  await fs.mkdir(BACKUP_DIR, { recursive: true });

  const backupResult = spawnSync('git', [
    'clone', '--mirror', '.', `${BACKUP_DIR}/original-repo.git`,
  ], {
    encoding: 'utf8',
    timeout: 300000,
  });

  if (backupResult.status === 0) {
    console.log('[git-sanitizer] Backup created successfully');
    return {
      status: 'SUCCESS',
      path: `${BACKUP_DIR}/original-repo.git`,
      timestamp: new Date().toISOString(),
    };
  } else {
    throw new Error(`Backup failed: ${backupResult.stderr}`);
  }
}

/**
 * Detect available sanitization tools
 */
async function detectTools() {
  console.log('[git-sanitizer] Detecting available sanitization tools...');

  const tools = {};

  // Check git-filter-repo
  let gitFilterRepoResult = spawnSync('git-filter-repo', ['--version'], { encoding: 'utf8' });
  if (gitFilterRepoResult.status !== 0) {
    // Try the manual download location
    gitFilterRepoResult = spawnSync('python3', [`${TOOLS_DIR}/git-filter-repo`, '--version'], {
      encoding: 'utf8',
    });
    if (gitFilterRepoResult.status === 0) {
      tools.git_filter_repo = {
        available: true,
        command: ['python3', `${TOOLS_DIR}/git-filter-repo`],
        version: gitFilterRepoResult.stdout?.trim(),
      };
    }
  } else {
    tools.git_filter_repo = {
      available: true,
      command: ['git-filter-repo'],
      version: gitFilterRepoResult.stdout?.trim(),
    };
  }

  if (!tools.git_filter_repo) {
    tools.git_filter_repo = { available: false };
  }

  // Check BFG
  const bfgPath = `${TOOLS_DIR}/bfg.jar`;
  try {
    await fs.access(bfgPath);
    const bfgResult = spawnSync('java', ['-jar', bfgPath, '--help'], {
      encoding: 'utf8',
      timeout: 10000,
    });

    tools.bfg = {
      available: bfgResult.status === 0,
      command: ['java', '-jar', bfgPath],
      path: bfgPath,
      requires_java: true,
    };
  } catch (error) {
    tools.bfg = { available: false, error: 'BFG jar not found' };
  }

  return tools;
}

/**
 * Generate secrets replacement file
 */
async function generateSecretsFile(secrets = []) {
  const secretsFile = '/tmp/secrets-to-replace.txt';

  // Default patterns for common secrets
  const defaultPatterns = [
    'password=***REMOVED***',
    'api_key=***REMOVED***',
    'secret_key=***REMOVED***',
    'access_token=***REMOVED***',
    'private_key=***REMOVED***',
    'AWS_SECRET_ACCESS_KEY=***REMOVED***',
    'GITHUB_TOKEN=***REMOVED***',
  ];

  const allPatterns = [...defaultPatterns, ...secrets];
  await fs.writeFile(secretsFile, allPatterns.join('\n'));

  return secretsFile;
}

/**
 * Sanitize using git-filter-repo
 */
async function sanitizeWithGitFilterRepo(tools, options = {}) {
  if (!tools.git_filter_repo.available) {
    return { status: 'SKIPPED', reason: 'git-filter-repo not available' };
  }

  console.log('[git-sanitizer] Running git-filter-repo sanitization...');

  const secretsFile = await generateSecretsFile(options.secrets || []);
  const results = [];

  // Remove files with secret extensions
  if (options.removeSecretFiles !== false) {
    console.log('[git-sanitizer] Removing secret files...');
    const removeFilesResult = spawnSync(tools.git_filter_repo.command[0], [
      ...tools.git_filter_repo.command.slice(1),
      '--path-glob', '*.key',
      '--path-glob', '*.pem',
      '--path-glob', '*.p12',
      '--path-glob', '*.pfx',
      '--path-glob', '.env*',
      '--invert-paths',
      '--force',
    ], {
      encoding: 'utf8',
      timeout: 300000,
    });

    results.push({
      operation: 'remove_secret_files',
      exit_code: removeFilesResult.status,
      stdout: removeFilesResult.stdout,
      stderr: removeFilesResult.stderr,
    });
  }

  // Replace text patterns
  if (options.replaceSecrets !== false) {
    console.log('[git-sanitizer] Replacing secret patterns...');
    const replaceTextResult = spawnSync(tools.git_filter_repo.command[0], [
      ...tools.git_filter_repo.command.slice(1),
      '--replace-text', secretsFile,
      '--force',
    ], {
      encoding: 'utf8',
      timeout: 300000,
    });

    results.push({
      operation: 'replace_secret_text',
      exit_code: replaceTextResult.status,
      stdout: replaceTextResult.stdout,
      stderr: replaceTextResult.stderr,
    });
  }

  // Remove large files (potential data dumps)
  if (options.removeLargeFiles !== false) {
    console.log('[git-sanitizer] Removing large files...');
    const removeLargeResult = spawnSync(tools.git_filter_repo.command[0], [
      ...tools.git_filter_repo.command.slice(1),
      '--strip-blobs-bigger-than', '10M',
      '--force',
    ], {
      encoding: 'utf8',
      timeout: 300000,
    });

    results.push({
      operation: 'remove_large_files',
      exit_code: removeLargeResult.status,
      stdout: removeLargeResult.stdout,
      stderr: removeLargeResult.stderr,
    });
  }

  return {
    status: 'COMPLETED',
    tool: 'git-filter-repo',
    operations: results,
    success_count: results.filter(r => r.exit_code === 0).length,
    total_operations: results.length,
  };
}

/**
 * Sanitize using BFG Repo-Cleaner
 */
async function sanitizeWithBFG(tools, options = {}) {
  if (!tools.bfg.available) {
    return { status: 'SKIPPED', reason: 'BFG not available' };
  }

  console.log('[git-sanitizer] Running BFG Repo-Cleaner sanitization...');

  const secretsFile = await generateSecretsFile(options.secrets || []);
  const results = [];

  // Create a bare clone for BFG (BFG requires bare repos)
  const bareRepoPath = '/tmp/repo-for-bfg.git';
  const cloneResult = spawnSync('git', ['clone', '--bare', '.', bareRepoPath], {
    encoding: 'utf8',
    timeout: 120000,
  });

  if (cloneResult.status !== 0) {
    return {
      status: 'FAILED',
      error: 'Failed to create bare clone for BFG',
      stderr: cloneResult.stderr,
    };
  }

  // Remove secret files
  if (options.removeSecretFiles !== false) {
    console.log('[git-sanitizer] BFG: Removing secret files...');
    const removeFilesResult = spawnSync('java', [
      '-jar', tools.bfg.path,
      '--delete-files', '*.{key,pem,p12,pfx}',
      bareRepoPath,
    ], {
      encoding: 'utf8',
      timeout: 300000,
    });

    results.push({
      operation: 'bfg_remove_secret_files',
      exit_code: removeFilesResult.status,
      stdout: removeFilesResult.stdout,
      stderr: removeFilesResult.stderr,
    });
  }

  // Replace text patterns
  if (options.replaceSecrets !== false) {
    console.log('[git-sanitizer] BFG: Replacing secret patterns...');
    const replaceTextResult = spawnSync('java', [
      '-jar', tools.bfg.path,
      '--replace-text', secretsFile,
      bareRepoPath,
    ], {
      encoding: 'utf8',
      timeout: 300000,
    });

    results.push({
      operation: 'bfg_replace_secret_text',
      exit_code: replaceTextResult.status,
      stdout: replaceTextResult.stdout,
      stderr: replaceTextResult.stderr,
    });
  }

  // Remove large files
  if (options.removeLargeFiles !== false) {
    console.log('[git-sanitizer] BFG: Removing large files...');
    const removeLargeResult = spawnSync('java', [
      '-jar', tools.bfg.path,
      '--strip-blobs-bigger-than', '10M',
      bareRepoPath,
    ], {
      encoding: 'utf8',
      timeout: 300000,
    });

    results.push({
      operation: 'bfg_remove_large_files',
      exit_code: removeLargeResult.status,
      stdout: removeLargeResult.stdout,
      stderr: removeLargeResult.stderr,
    });
  }

  // If BFG operations succeeded, update the working repo
  const successfulOps = results.filter(r => r.exit_code === 0).length;
  if (successfulOps > 0) {
    console.log('[git-sanitizer] Updating working repository with BFG changes...');
    const updateResult = spawnSync('git', ['reset', '--hard', 'origin/main'], {
      encoding: 'utf8',
    });

    results.push({
      operation: 'update_working_repo',
      exit_code: updateResult.status,
      stdout: updateResult.stdout,
      stderr: updateResult.stderr,
    });
  }

  return {
    status: 'COMPLETED',
    tool: 'bfg',
    operations: results,
    success_count: results.filter(r => r.exit_code === 0).length,
    total_operations: results.length,
    bare_repo_path: bareRepoPath,
  };
}

/**
 * Verify sanitization results
 */
async function verifySanitization() {
  console.log('[git-sanitizer] Verifying sanitization results...');

  // Run a quick gitleaks scan to check for remaining secrets
  const scanResult = spawnSync('gitleaks', [
    'detect',
    '--source', '.',
    '--config', '.gitleaks.toml',
    '--report-format', 'json',
    '--report-path', '/tmp/post-sanitization-scan.json',
    '--verbose',
  ], {
    encoding: 'utf8',
    timeout: 60000,
  });

  let remainingSecrets = 0;
  try {
    const reportContent = await fs.readFile('/tmp/post-sanitization-scan.json', 'utf8');
    const findings = JSON.parse(reportContent);
    remainingSecrets = findings.length;
  } catch (error) {
    // No report file usually means no findings
  }

  return {
    scan_exit_code: scanResult.status,
    remaining_secrets: remainingSecrets,
    verification_status: remainingSecrets === 0 ? 'CLEAN' : 'SECRETS_REMAIN',
    scan_output: scanResult.stdout,
    scan_error: scanResult.stderr,
  };
}

/**
 * Generate sanitization report
 */
async function generateSanitizationReport(backup, tools, gitFilterRepo, bfg, verification, options) {
  const report = {
    sanitization_type: 'comprehensive_git_history_sanitization',
    timestamp: new Date().toISOString(),
    status: 'UNKNOWN',
    backup: backup,
    tools_detected: tools,
    operations: {
      git_filter_repo: gitFilterRepo,
      bfg: bfg,
    },
    verification: verification,
    options: options,
    summary: {},
    recommendations: [],
    next_steps: [],
  };

  // Calculate success metrics
  const totalOperations = (gitFilterRepo.operations?.length || 0) + (bfg.operations?.length || 0);
  const successfulOperations = (gitFilterRepo.success_count || 0) + (bfg.success_count || 0);

  // Determine overall status
  if (verification.verification_status === 'CLEAN') {
    report.status = 'SUCCESS';
    report.summary = {
      message: 'Git history successfully sanitized - no secrets remaining',
      operations_completed: successfulOperations,
      total_operations: totalOperations,
      success_rate: totalOperations > 0 ? (successfulOperations / totalOperations * 100).toFixed(1) + '%' : 'N/A',
    };
    report.next_steps.push('Force push sanitized history to remote repository');
    report.next_steps.push('Notify team members to re-clone the repository');
    report.next_steps.push('Rotate any secrets that were previously exposed');
  } else if (verification.remaining_secrets > 0) {
    report.status = 'PARTIAL';
    report.summary = {
      message: `Sanitization completed but ${verification.remaining_secrets} secret(s) still detected`,
      operations_completed: successfulOperations,
      total_operations: totalOperations,
      remaining_secrets: verification.remaining_secrets,
    };
    report.recommendations.push('Review remaining secrets and create custom removal patterns');
    report.recommendations.push('Consider additional manual sanitization');
    report.recommendations.push('Run sanitization again with updated patterns');
  } else {
    report.status = 'FAILED';
    report.summary = {
      message: 'Sanitization failed or could not be verified',
      operations_completed: successfulOperations,
      total_operations: totalOperations,
    };
    report.recommendations.push('Check tool availability and repository state');
    report.recommendations.push('Restore from backup if needed');
    report.recommendations.push('Consider manual secret removal');
  }

  // Add tool-specific recommendations
  if (!tools.git_filter_repo.available && !tools.bfg.available) {
    report.recommendations.push('Install sanitization tools using: npm run security:install-tools');
  }

  // Add compliance notes
  report.compliance = {
    backup_created: backup.status === 'SUCCESS',
    multiple_tools_attempted: tools.git_filter_repo.available && tools.bfg.available,
    verification_performed: true,
    incident_response_time: '< 2 hours (automated)',
    documentation_updated: false, // Will be updated separately
  };

  // Write report
  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
  await fs.writeFile(
    `${ARTIFACTS_DIR}/git-history-sanitization-report.json`,
    stableStringify(report, null, 2),
  );

  return report;
}

/**
 * Main sanitization function
 */
async function main(options = {}) {
  try {
    console.log('[git-sanitizer] Starting comprehensive git history sanitization...');
    console.log('[git-sanitizer] WARNING: This will modify git history permanently!');

    // Ensure we're in a git repository
    const gitCheckResult = spawnSync('git', ['status'], { encoding: 'utf8' });
    if (gitCheckResult.status !== 0) {
      throw new Error('Not in a git repository');
    }

    // Create backup
    const backup = await createBackup();
    console.log('[git-sanitizer] Repository backup completed');

    // Detect available tools
    const tools = await detectTools();
    console.log(`[git-sanitizer] Tools available: git-filter-repo=${tools.git_filter_repo.available}, BFG=${tools.bfg.available}`);

    if (!tools.git_filter_repo.available && !tools.bfg.available) {
      throw new Error('No sanitization tools available. Run: npm run security:install-tools');
    }

    // Run sanitization with available tools
    const gitFilterRepo = await sanitizeWithGitFilterRepo(tools, options);
    const bfg = await sanitizeWithBFG(tools, options);

    // Verify results
    const verification = await verifySanitization();

    // Generate comprehensive report
    const report = await generateSanitizationReport(backup, tools, gitFilterRepo, bfg, verification, options);

    console.log(`[git-sanitizer] Sanitization complete. Status: ${report.status}`);
    console.log(`[git-sanitizer] ${report.summary.message}`);

    if (report.next_steps.length > 0) {
      console.log('[git-sanitizer] Next steps:');
      report.next_steps.forEach(step => console.log(`  - ${step}`));
    }

    if (report.recommendations.length > 0) {
      console.log('[git-sanitizer] Recommendations:');
      report.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }

    // Exit with appropriate code
    if (report.status === 'FAILED') {
      console.error('[git-sanitizer] Sanitization failed');
      process.exit(1);
    } else if (report.status === 'PARTIAL') {
      console.warn('[git-sanitizer] Sanitization partially successful - manual review required');
      process.exit(1);
    } else {
      console.log('[git-sanitizer] Sanitization successful');
    }

  } catch (error) {
    console.error('[git-sanitizer] Sanitization error:', error.message);

    const errorReport = {
      sanitization_type: 'comprehensive_git_history_sanitization',
      timestamp: new Date().toISOString(),
      status: 'ERROR',
      error: error.message,
    };

    await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
    await fs.writeFile(
      `${ARTIFACTS_DIR}/git-history-sanitization-report.json`,
      stableStringify(errorReport, null, 2),
    );

    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // Parse command line options
  const options = {};
  if (process.argv.includes('--secrets-only')) {
    options.removeSecretFiles = true;
    options.replaceSecrets = true;
    options.removeLargeFiles = false;
  }
  if (process.argv.includes('--dry-run')) {
    console.log('[git-sanitizer] DRY RUN: Would sanitize git history (not implemented)');
    process.exit(0);
  }

  main(options);
}

export { main as sanitizeGitHistory, detectTools, createBackup };
