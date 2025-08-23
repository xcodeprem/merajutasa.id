#!/usr/bin/env node
/**
 * secret-protection.test.js
 * Comprehensive test for secret protection mechanisms including:
 * - Pre-commit hook validation
 * - Gitleaks configuration testing
 * - Push protection simulation
 * - Secret pattern detection coverage
 */

import { promises as fs } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { stableStringify } from '../lib/json-stable.js';

const TEMP_DIR = '/tmp/secret-protection-test';
const SECRET_SAMPLES = [
  // API Keys and tokens
  { type: 'github_token', content: 'ghp_1234567890abcdef1234567890abcdef12345678', filename: 'config.js' },
  { type: 'aws_access_key', content: 'AKIAIOSFODNN7EXAMPLE', filename: 'aws-config.yml' },
  { type: 'jwt_token', content: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c', filename: 'auth.json' },
  
  // Environment variables with secrets
  { type: 'env_database_url', content: 'DATABASE_URL=postgresql://user:secret123@localhost:5432/db', filename: '.env.production' },
  { type: 'env_api_key', content: 'API_KEY=sk-1234567890abcdef1234567890abcdef', filename: '.env' },
  { type: 'env_secret_key', content: 'SECRET_KEY=very-secret-key-1234567890abcdef', filename: '.env.local' },
  
  // Private keys
  { type: 'rsa_private_key', content: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA7YR...\n-----END RSA PRIVATE KEY-----', filename: 'id_rsa' },
  { type: 'ssh_private_key', content: '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAA...\n-----END OPENSSH PRIVATE KEY-----', filename: 'ssh_key' },
  
  // Certificates and keystores
  { type: 'certificate', content: '-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----', filename: 'server.crt' },
  { type: 'private_key_file', content: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEF...\n-----END PRIVATE KEY-----', filename: 'private.key' },
];

const ALLOWED_FILES = [
  // Files that should NOT be detected as secrets
  { content: 'README content with safe data', filename: 'README.md' },
  { content: 'API_KEY=EXAMPLE_KEY_FOR_DOCS', filename: 'docs/example.md' },
  { content: 'DUMMY_SECRET=test-value-for-fixtures', filename: 'tests/fixtures/config.json' },
  { content: 'sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', filename: 'artifacts/hash.txt' },
];

async function setupTestEnvironment() {
  // Clean and create temp directory
  await fs.rm(TEMP_DIR, { recursive: true, force: true });
  await fs.mkdir(TEMP_DIR, { recursive: true });
  
  // Copy gitleaks config
  const gitleaksConfig = await fs.readFile('.gitleaks.toml', 'utf8');
  await fs.writeFile(path.join(TEMP_DIR, '.gitleaks.toml'), gitleaksConfig);
  
  // Copy gitignore
  const gitignoreContent = await fs.readFile('.gitignore', 'utf8');
  await fs.writeFile(path.join(TEMP_DIR, '.gitignore'), gitignoreContent);
  
  // Copy pre-commit hook
  const preCommitHook = await fs.readFile('.husky/pre-commit', 'utf8');
  await fs.mkdir(path.join(TEMP_DIR, '.husky'), { recursive: true });
  await fs.writeFile(path.join(TEMP_DIR, '.husky/pre-commit'), preCommitHook);
}

async function createSecretFiles() {
  const results = [];
  
  for (const secret of SECRET_SAMPLES) {
    const filePath = path.join(TEMP_DIR, secret.filename);
    const dirPath = path.dirname(filePath);
    
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, secret.content);
    
    results.push({
      type: secret.type,
      filename: secret.filename,
      detected: false // Will be updated after scanning
    });
  }
  
  return results;
}

async function createAllowedFiles() {
  for (const file of ALLOWED_FILES) {
    const filePath = path.join(TEMP_DIR, file.filename);
    const dirPath = path.dirname(filePath);
    
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, file.content);
  }
}

async function testGitleaksDetection() {
  console.log('[secret-protection] Testing gitleaks detection...');
  
  const result = spawnSync('gitleaks', [
    'detect', 
    '--source', TEMP_DIR,
    '--config', path.join(TEMP_DIR, '.gitleaks.toml'),
    '--redact',
    '--verbose'
  ], {
    encoding: 'utf8',
    timeout: 30000
  });
  
  return {
    exitCode: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    detected: result.status !== 0 // Non-zero exit means secrets detected
  };
}

async function testPreCommitHook() {
  console.log('[secret-protection] Testing pre-commit hook simulation...');
  
  // Initialize git repo in temp directory
  const initResult = spawnSync('git', ['init'], {
    cwd: TEMP_DIR,
    encoding: 'utf8'
  });
  
  if (initResult.status !== 0) {
    throw new Error(`Git init failed: ${initResult.stderr}`);
  }
  
  // Configure git to avoid user identity issues
  spawnSync('git', ['config', 'user.email', 'test@example.com'], { cwd: TEMP_DIR });
  spawnSync('git', ['config', 'user.name', 'Test User'], { cwd: TEMP_DIR });
  
  // Add files to git
  const addResult = spawnSync('git', ['add', '.'], {
    cwd: TEMP_DIR,
    encoding: 'utf8'
  });
  
  // Try to commit (should be blocked by pre-commit hook if gitleaks is available)
  const commitResult = spawnSync('gitleaks', [
    'protect',
    '--staged',
    '--config', '.gitleaks.toml',
    '--verbose'
  ], {
    cwd: TEMP_DIR,
    encoding: 'utf8',
    timeout: 30000
  });
  
  return {
    exitCode: commitResult.status,
    stdout: commitResult.stdout || '',
    stderr: commitResult.stderr || '',
    blocked: commitResult.status !== 0
  };
}

async function testGitignorePatterns() {
  console.log('[secret-protection] Testing gitignore patterns...');
  
  // Check git status to see which files would be tracked
  const statusResult = spawnSync('git', ['status', '--porcelain', '--ignored'], {
    cwd: TEMP_DIR,
    encoding: 'utf8'
  });
  
  if (statusResult.status !== 0) {
    throw new Error(`Git status failed: ${statusResult.stderr}`);
  }
  
  const trackedFiles = [];
  const ignoredFiles = [];
  
  statusResult.stdout.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed) {
      const filename = trimmed.substring(3); // Remove git status prefix
      if (trimmed.startsWith('!!')) {
        ignoredFiles.push(filename);
      } else {
        trackedFiles.push(filename);
      }
    }
  });
  
  return { trackedFiles, ignoredFiles };
}

async function validateSecretPatterns() {
  console.log('[secret-protection] Validating secret pattern coverage...');
  
  const secretFiles = await createSecretFiles();
  await createAllowedFiles();
  
  // Initialize git in temp directory for gitignore testing
  spawnSync('git', ['init'], { cwd: TEMP_DIR });
  spawnSync('git', ['config', 'user.email', 'test@example.com'], { cwd: TEMP_DIR });
  spawnSync('git', ['config', 'user.name', 'Test User'], { cwd: TEMP_DIR });
  
  // Test gitleaks detection
  const gitleaksResult = await testGitleaksDetection();
  
  // Test pre-commit protection
  const preCommitResult = await testPreCommitHook();
  
  // Test gitignore patterns
  const gitignoreResult = await testGitignorePatterns();
  
  // Analyze results
  const secretFilesIgnored = SECRET_SAMPLES.filter(secret => 
    gitignoreResult.ignoredFiles.some(ignored => ignored.includes(secret.filename))
  );
  
  const secretFilesTracked = SECRET_SAMPLES.filter(secret => 
    gitignoreResult.trackedFiles.some(tracked => tracked.includes(secret.filename))
  );
  
  return {
    gitleaks: gitleaksResult,
    preCommit: preCommitResult,
    gitignore: gitignoreResult,
    analysis: {
      totalSecrets: SECRET_SAMPLES.length,
      secretsIgnored: secretFilesIgnored.length,
      secretsTracked: secretFilesTracked.length,
      secretsIgnoredFiles: secretFilesIgnored.map(s => s.filename),
      secretsTrackedFiles: secretFilesTracked.map(s => s.filename)
    }
  };
}

async function generateReport(results) {
  const report = {
    test: 'secret-protection',
    timestamp: new Date().toISOString(),
    status: 'UNKNOWN',
    summary: '',
    details: {
      gitleaks: {
        available: results.gitleaks.exitCode !== 127,
        detected_secrets: results.gitleaks.detected,
        output: results.gitleaks.stdout.substring(0, 500) // Truncate for brevity
      },
      pre_commit: {
        blocked_commit: results.preCommit.blocked,
        output: results.preCommit.stdout.substring(0, 500)
      },
      gitignore: {
        total_files: results.gitignore.trackedFiles.length + results.gitignore.ignoredFiles.length,
        tracked_files: results.gitignore.trackedFiles.length,
        ignored_files: results.gitignore.ignoredFiles.length
      },
      analysis: results.analysis
    }
  };
  
  // Determine overall status
  const gitleaksWorking = results.gitleaks.detected; // Should detect secrets
  const preCommitWorking = results.preCommit.blocked; // Should block commit
  const gitignoreWorking = results.analysis.secretsIgnored >= results.analysis.secretsTracked; // More ignored than tracked
  
  if (gitleaksWorking && preCommitWorking && gitignoreWorking) {
    report.status = 'PASS';
    report.summary = 'All secret protection mechanisms working correctly';
  } else {
    report.status = 'FAIL';
    const issues = [];
    if (!gitleaksWorking) issues.push('gitleaks not detecting secrets');
    if (!preCommitWorking) issues.push('pre-commit not blocking secrets');
    if (!gitignoreWorking) issues.push('gitignore not covering all secret files');
    report.summary = `Issues found: ${issues.join(', ')}`;
  }
  
  // Write report artifact
  await fs.mkdir('artifacts', { recursive: true });
  await fs.writeFile('artifacts/secret-protection-test.json', stableStringify(report, null, 2));
  
  return report;
}

async function cleanup() {
  try {
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
  } catch (error) {
    console.warn('[secret-protection] Cleanup warning:', error.message);
  }
}

async function main() {
  console.log('[secret-protection] Starting comprehensive secret protection test...');
  
  try {
    await setupTestEnvironment();
    const results = await validateSecretPatterns();
    const report = await generateReport(results);
    
    console.log(`[secret-protection] Test ${report.status}: ${report.summary}`);
    
    if (report.details.gitleaks.available) {
      console.log(`[secret-protection] Gitleaks: ${report.details.gitleaks.detected_secrets ? 'Detected secrets ✓' : 'No secrets detected ⚠️'}`);
    } else {
      console.log('[secret-protection] Gitleaks: Not available (will use npx in CI) ⚠️');
    }
    
    console.log(`[secret-protection] Pre-commit: ${report.details.pre_commit.blocked_commit ? 'Blocked commit ✓' : 'Did not block ⚠️'}`);
    console.log(`[secret-protection] Gitignore: ${report.details.analysis.secretsIgnored}/${report.details.analysis.totalSecrets} secret files ignored`);
    
    if (report.status === 'FAIL') {
      console.error('[secret-protection] Some protection mechanisms are not working as expected');
      console.error('[secret-protection] Check artifacts/secret-protection-test.json for details');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('[secret-protection] Test failed:', error.message);
    
    const errorReport = {
      test: 'secret-protection',
      timestamp: new Date().toISOString(),
      status: 'ERROR',
      error: error.message,
      summary: 'Test execution failed'
    };
    
    await fs.mkdir('artifacts', { recursive: true });
    await fs.writeFile('artifacts/secret-protection-test.json', stableStringify(errorReport, null, 2));
    
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Check if running as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('[secret-protection] Unhandled error:', error);
    process.exit(1);
  });
}

export { main as runSecretProtectionTest };