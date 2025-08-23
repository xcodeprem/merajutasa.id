#!/usr/bin/env node
/**
 * comprehensive-secret-protection.test.js
 * Comprehensive test suite for secret protection and sanitization tools
 * Validates git-filter-repo, BFG, scanning, and emergency response workflows
 */

import { promises as fs } from 'fs';
import { spawnSync } from 'child_process';
import { stableStringify } from '../lib/json-stable.js';

const TEST_REPO_DIR = '/tmp/test-secret-protection';
const ARTIFACTS_DIR = 'artifacts';

/**
 * Setup test repository with known secrets
 */
async function setupTestRepository() {
  console.log('[secret-protection-test] Setting up test repository...');
  
  // Clean and create test directory
  await fs.rm(TEST_REPO_DIR, { recursive: true, force: true });
  await fs.mkdir(TEST_REPO_DIR, { recursive: true });
  
  // Initialize git repo
  spawnSync('git', ['init'], { cwd: TEST_REPO_DIR, encoding: 'utf8' });
  spawnSync('git', ['config', 'user.email', 'test@example.com'], { cwd: TEST_REPO_DIR });
  spawnSync('git', ['config', 'user.name', 'Test User'], { cwd: TEST_REPO_DIR });
  
  // Create files with secrets
  const secretFiles = {
    '.env': `
API_KEY=sk-1234567890abcdef
DATABASE_PASSWORD=super_secret_password_123
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuvwxyz
`,
    'config/database.yml': `
production:
  password: production_database_password_secret
  api_key: prod-api-key-12345
`,
    'private.key': `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
-----END PRIVATE KEY-----`,
    'README.md': `
# Test Repository
This is a test repository.
No secrets here: password=not_a_real_secret
`,
    'src/config.js': `
const config = {
  apiKey: 'fake-api-key-for-testing',
  secretToken: 'tok_1234567890abcdef'
};
`
  };
  
  // Write files and commit each one
  for (const [filename, content] of Object.entries(secretFiles)) {
    const filepath = `${TEST_REPO_DIR}/${filename}`;
    await fs.mkdir(filepath.substring(0, filepath.lastIndexOf('/')), { recursive: true });
    await fs.writeFile(filepath, content.trim());
    
    spawnSync('git', ['add', filename], { cwd: TEST_REPO_DIR });
    spawnSync('git', ['commit', '-m', `Add ${filename}`], { cwd: TEST_REPO_DIR });
  }
  
  return {
    path: TEST_REPO_DIR,
    secrets_count: 5, // Expected number of files with secrets
    total_commits: Object.keys(secretFiles).length
  };
}

/**
 * Test secret scanning capabilities
 */
async function testSecretScanning(testRepo) {
  console.log('[secret-protection-test] Testing secret scanning...');
  
  const results = {
    gitleaks: null,
    history_scan: null
  };
  
  // Test gitleaks on test repository
  const gitleaksResult = spawnSync('gitleaks', [
    'detect',
    '--source', testRepo.path,
    '--config', '.gitleaks.toml',
    '--report-format', 'json',
    '--report-path', '/tmp/test-gitleaks-report.json',
    '--verbose'
  ], {
    encoding: 'utf8',
    timeout: 60000
  });
  
  let gitleaksFindings = 0;
  try {
    const reportContent = await fs.readFile('/tmp/test-gitleaks-report.json', 'utf8');
    const findings = JSON.parse(reportContent);
    gitleaksFindings = findings.length;
  } catch (error) {
    // No findings
  }
  
  results.gitleaks = {
    exit_code: gitleaksResult.status,
    findings_count: gitleaksFindings,
    detected_secrets: gitleaksFindings > 0,
    status: gitleaksFindings > 0 ? 'SECRETS_FOUND' : 'CLEAN'
  };
  
  // Test history scanning script
  try {
    const historyResult = spawnSync('node', [
      'tools/security/history-secret-scan.js'
    ], {
      cwd: testRepo.path,
      encoding: 'utf8',
      timeout: 120000
    });
    
    results.history_scan = {
      exit_code: historyResult.status,
      stdout: historyResult.stdout,
      stderr: historyResult.stderr,
      status: historyResult.status === 0 ? 'SUCCESS' : 'FAILED'
    };
  } catch (error) {
    results.history_scan = {
      status: 'ERROR',
      error: error.message
    };
  }
  
  return results;
}

/**
 * Test sanitization tools installation
 */
async function testToolsInstallation() {
  console.log('[secret-protection-test] Testing tools installation...');
  
  const installResult = spawnSync('node', [
    'tools/security/install-sanitization-tools.js'
  ], {
    encoding: 'utf8',
    timeout: 300000
  });
  
  let installReport = null;
  try {
    const reportContent = await fs.readFile('artifacts/sanitization-tools-install.json', 'utf8');
    installReport = JSON.parse(reportContent);
  } catch (error) {
    // Installation report not found
  }
  
  return {
    exit_code: installResult.status,
    stdout: installResult.stdout,
    stderr: installResult.stderr,
    status: installResult.status === 0 ? 'SUCCESS' : 'FAILED',
    report: installReport
  };
}

/**
 * Test git history sanitization
 */
async function testHistorySanitization(testRepo) {
  console.log('[secret-protection-test] Testing git history sanitization...');
  
  // Copy test repo for sanitization test
  const sanitizeRepoPath = '/tmp/test-sanitize-repo';
  await fs.rm(sanitizeRepoPath, { recursive: true, force: true });
  
  const copyResult = spawnSync('cp', ['-r', testRepo.path, sanitizeRepoPath], {
    encoding: 'utf8'
  });
  
  if (copyResult.status !== 0) {
    return {
      status: 'FAILED',
      error: 'Could not copy test repository for sanitization'
    };
  }
  
  // Run sanitization
  const sanitizeResult = spawnSync('node', [
    'tools/security/git-history-sanitizer.js'
  ], {
    cwd: sanitizeRepoPath,
    encoding: 'utf8',
    timeout: 300000
  });
  
  // Check if sanitization report was generated
  let sanitizeReport = null;
  try {
    const reportContent = await fs.readFile(`${sanitizeRepoPath}/artifacts/git-history-sanitization-report.json`, 'utf8');
    sanitizeReport = JSON.parse(reportContent);
  } catch (error) {
    // Sanitization report not found
  }
  
  // Run post-sanitization scan to verify
  const postScanResult = spawnSync('gitleaks', [
    'detect',
    '--source', sanitizeRepoPath,
    '--config', '.gitleaks.toml',
    '--report-format', 'json',
    '--report-path', '/tmp/post-sanitize-scan.json'
  ], {
    encoding: 'utf8',
    timeout: 60000
  });
  
  let postScanFindings = 0;
  try {
    const scanContent = await fs.readFile('/tmp/post-sanitize-scan.json', 'utf8');
    const findings = JSON.parse(scanContent);
    postScanFindings = findings.length;
  } catch (error) {
    // No findings
  }
  
  return {
    exit_code: sanitizeResult.status,
    stdout: sanitizeResult.stdout,
    stderr: sanitizeResult.stderr,
    status: sanitizeResult.status === 0 ? 'SUCCESS' : 'FAILED',
    report: sanitizeReport,
    post_sanitization: {
      scan_exit_code: postScanResult.status,
      remaining_secrets: postScanFindings,
      clean: postScanFindings === 0
    }
  };
}

/**
 * Test pre-commit protection
 */
async function testPreCommitProtection(testRepo) {
  console.log('[secret-protection-test] Testing pre-commit protection...');
  
  // Try to commit a file with secrets
  const secretFile = `${testRepo.path}/new-secret.env`;
  await fs.writeFile(secretFile, 'SECRET_API_KEY=sk-test123456789\nPASSWORD=secret123');
  
  spawnSync('git', ['add', 'new-secret.env'], { cwd: testRepo.path });
  
  const commitResult = spawnSync('git', ['commit', '-m', 'Add secret file'], {
    cwd: testRepo.path,
    encoding: 'utf8'
  });
  
  // Check if commit was blocked
  const commitBlocked = commitResult.status !== 0;
  
  return {
    secret_file_created: true,
    commit_attempted: true,
    commit_blocked: commitBlocked,
    exit_code: commitResult.status,
    output: commitResult.stdout + commitResult.stderr,
    status: commitBlocked ? 'PROTECTION_ACTIVE' : 'PROTECTION_FAILED'
  };
}

/**
 * Test emergency response workflow
 */
async function testEmergencyResponse() {
  console.log('[secret-protection-test] Testing emergency response workflow...');
  
  const startTime = Date.now();
  
  // Simulate emergency response: scan + sanitize
  const emergencySteps = [];
  
  // Step 1: Immediate scan
  const scanStart = Date.now();
  const emergencyScanResult = spawnSync('node', [
    'tools/security/secret-scan-report.js'
  ], {
    encoding: 'utf8',
    timeout: 60000
  });
  const scanDuration = Date.now() - scanStart;
  
  emergencySteps.push({
    step: 'emergency_scan',
    duration_ms: scanDuration,
    exit_code: emergencyScanResult.status,
    status: emergencyScanResult.status === 0 ? 'SUCCESS' : 'FAILED'
  });
  
  // Step 2: Tools check
  const toolsStart = Date.now();
  const toolsCheckResult = spawnSync('node', [
    'tools/security/install-sanitization-tools.js'
  ], {
    encoding: 'utf8',
    timeout: 120000
  });
  const toolsDuration = Date.now() - toolsStart;
  
  emergencySteps.push({
    step: 'tools_verification',
    duration_ms: toolsDuration,
    exit_code: toolsCheckResult.status,
    status: toolsCheckResult.status === 0 ? 'SUCCESS' : 'FAILED'
  });
  
  const totalDuration = Date.now() - startTime;
  const twoHoursMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  
  return {
    total_duration_ms: totalDuration,
    total_duration_minutes: Math.round(totalDuration / 60000),
    under_two_hours: totalDuration < twoHoursMs,
    steps: emergencySteps,
    status: totalDuration < twoHoursMs ? 'SLA_MET' : 'SLA_EXCEEDED'
  };
}

/**
 * Generate comprehensive test report
 */
async function generateTestReport(testRepo, scanning, installation, sanitization, preCommit, emergency) {
  const report = {
    test_type: 'comprehensive_secret_protection_validation',
    timestamp: new Date().toISOString(),
    status: 'UNKNOWN',
    test_repository: testRepo,
    test_results: {
      secret_scanning: scanning,
      tools_installation: installation,
      history_sanitization: sanitization,
      pre_commit_protection: preCommit,
      emergency_response: emergency
    },
    summary: {},
    compliance: {},
    recommendations: []
  };
  
  // Calculate pass/fail for each test
  const tests = {
    secret_scanning: scanning.gitleaks.detected_secrets && scanning.history_scan?.status === 'SUCCESS',
    tools_installation: installation.status === 'SUCCESS',
    history_sanitization: sanitization.status === 'SUCCESS' && sanitization.post_sanitization?.clean,
    pre_commit_protection: preCommit.status === 'PROTECTION_ACTIVE',
    emergency_response: emergency.status === 'SLA_MET'
  };
  
  const passedTests = Object.values(tests).filter(Boolean).length;
  const totalTests = Object.keys(tests).length;
  
  // Determine overall status
  if (passedTests === totalTests) {
    report.status = 'ALL_TESTS_PASSED';
    report.summary = {
      message: 'All secret protection tests passed successfully',
      passed_tests: passedTests,
      total_tests: totalTests,
      success_rate: '100%'
    };
  } else if (passedTests >= totalTests * 0.8) {
    report.status = 'MOSTLY_PASSED';
    report.summary = {
      message: `${passedTests}/${totalTests} tests passed - minor issues detected`,
      passed_tests: passedTests,
      total_tests: totalTests,
      success_rate: Math.round((passedTests / totalTests) * 100) + '%'
    };
  } else {
    report.status = 'SIGNIFICANT_FAILURES';
    report.summary = {
      message: `Only ${passedTests}/${totalTests} tests passed - major issues detected`,
      passed_tests: passedTests,
      total_tests: totalTests,
      success_rate: Math.round((passedTests / totalTests) * 100) + '%'
    };
  }
  
  // Add compliance metrics
  report.compliance = {
    secret_detection_working: tests.secret_scanning,
    sanitization_tools_available: tests.tools_installation,
    history_cleaning_functional: tests.history_sanitization,
    pre_commit_hooks_active: tests.pre_commit_protection,
    emergency_response_under_2h: tests.emergency_response,
    overall_compliance: passedTests >= 4, // Require at least 4/5 tests to pass
    zero_secrets_after_sanitization: sanitization.post_sanitization?.clean || false
  };
  
  // Add recommendations for failed tests
  if (!tests.secret_scanning) {
    report.recommendations.push('Secret scanning is not detecting test secrets - check gitleaks configuration');
  }
  if (!tests.tools_installation) {
    report.recommendations.push('Sanitization tools installation failed - check system dependencies');
  }
  if (!tests.history_sanitization) {
    report.recommendations.push('History sanitization failed or incomplete - verify tool functionality');
  }
  if (!tests.pre_commit_protection) {
    report.recommendations.push('Pre-commit hooks are not blocking secret commits - install and configure hooks');
  }
  if (!tests.emergency_response) {
    report.recommendations.push('Emergency response time exceeds 2-hour SLA - optimize workflow');
  }
  
  // Write report
  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
  await fs.writeFile(
    `${ARTIFACTS_DIR}/comprehensive-secret-protection-test.json`,
    stableStringify(report, null, 2)
  );
  
  return report;
}

/**
 * Cleanup test environment
 */
async function cleanup() {
  try {
    await fs.rm(TEST_REPO_DIR, { recursive: true, force: true });
    await fs.rm('/tmp/test-sanitize-repo', { recursive: true, force: true });
    await fs.rm('/tmp/test-gitleaks-report.json', { force: true });
    await fs.rm('/tmp/post-sanitize-scan.json', { force: true });
  } catch (error) {
    console.warn('[secret-protection-test] Cleanup warning:', error.message);
  }
}

/**
 * Main test function
 */
async function main() {
  try {
    console.log('[secret-protection-test] Starting comprehensive secret protection test suite...');
    
    // Setup test environment
    const testRepo = await setupTestRepository();
    console.log(`[secret-protection-test] Test repository created with ${testRepo.secrets_count} secret files`);
    
    // Run all tests
    const scanning = await testSecretScanning(testRepo);
    const installation = await testToolsInstallation();
    const sanitization = await testHistorySanitization(testRepo);
    const preCommit = await testPreCommitProtection(testRepo);
    const emergency = await testEmergencyResponse();
    
    // Generate comprehensive report
    const report = await generateTestReport(testRepo, scanning, installation, sanitization, preCommit, emergency);
    
    console.log(`[secret-protection-test] Test suite complete. Status: ${report.status}`);
    console.log(`[secret-protection-test] ${report.summary.message}`);
    
    if (report.recommendations.length > 0) {
      console.log('[secret-protection-test] Recommendations:');
      report.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
    
    // Exit with appropriate code
    if (report.status === 'SIGNIFICANT_FAILURES') {
      console.error('[secret-protection-test] Significant test failures detected');
      process.exit(1);
    } else if (report.status === 'MOSTLY_PASSED') {
      console.warn('[secret-protection-test] Some tests failed - review required');
      // Don't exit with error for mostly passed
    } else {
      console.log('[secret-protection-test] All tests passed successfully');
    }
    
  } catch (error) {
    console.error('[secret-protection-test] Test suite error:', error.message);
    
    const errorReport = {
      test_type: 'comprehensive_secret_protection_validation',
      timestamp: new Date().toISOString(),
      status: 'ERROR',
      error: error.message
    };
    
    await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
    await fs.writeFile(
      `${ARTIFACTS_DIR}/comprehensive-secret-protection-test.json`,
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

export { main as runSecretProtectionTests };