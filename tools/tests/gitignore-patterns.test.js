#!/usr/bin/env node
/**
 * gitignore-patterns.test.js
 * Test to validate .gitignore patterns effectively block sensitive files
 * This test creates temporary sensitive files and verifies they are ignored by git
 */

import { promises as fs } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';

const TEMP_DIR = '/tmp/gitignore-test';
const SENSITIVE_PATTERNS = [
  // Environment files
  '.env',
  '.env.development',
  '.env.production',
  '.env.local',
  '.env.staging',

  // Certificate and key files
  'server.pem',
  'private.key',
  'certificate.crt',
  'keystore.p12',
  'app.pfx',
  'trust.keystore',
  'client.jks',
  'id_rsa',
  'id_dsa',
  'id_ecdsa',
  'id_ed25519',

  // Directories
  '.pki/ca.crt',
  '.ssh/id_rsa',
  'secrets/api.key',
  '.credentials/token',

  // Secret files
  'secret.txt',
  'api.secret',
  'auth.token',
  'database.credentials',

  // OS files
  '.DS_Store',

  // Build artifacts
  'dist/bundle.js',
  'build/output.min.js',
  'coverage/report.html',
  'out/compiled.js',
  'release/app.zip',
  'bundle/main.js',
  'compiled/index.js',
  'app.tgz',
  'release.tar.gz',
  'package.zip',
];

async function setupTempFiles() {
  await fs.mkdir(TEMP_DIR, { recursive: true });

  const testFiles = [];

  for (const pattern of SENSITIVE_PATTERNS) {
    const filePath = path.join(TEMP_DIR, pattern);
    const dirPath = path.dirname(filePath);

    // Create directory if needed
    await fs.mkdir(dirPath, { recursive: true });

    // Create file with dummy sensitive content
    await fs.writeFile(filePath, `SENSITIVE_CONTENT_${Date.now()}`);
    testFiles.push(filePath);
  }

  return testFiles;
}

async function testGitIgnorePatterns() {
  console.log('[gitignore-test] Setting up temporary sensitive files...');

  try {
    const testFiles = await setupTempFiles();

    // Copy .gitignore to temp directory
    const gitignorePath = path.join(TEMP_DIR, '.gitignore');
    const originalGitignore = await fs.readFile('.gitignore', 'utf8');
    await fs.writeFile(gitignorePath, originalGitignore);

    // Initialize git repo in temp directory
    const initResult = spawnSync('git', ['init'], {
      cwd: TEMP_DIR,
      encoding: 'utf8',
    });

    if (initResult.status !== 0) {
      throw new Error(`Git init failed: ${initResult.stderr}`);
    }

    // Check which files git would track
    const statusResult = spawnSync('git', ['status', '--porcelain'], {
      cwd: TEMP_DIR,
      encoding: 'utf8',
    });

    if (statusResult.status !== 0) {
      throw new Error(`Git status failed: ${statusResult.stderr}`);
    }

    const trackedFiles = statusResult.stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.substring(3)); // Remove git status prefix

    console.log('[gitignore-test] Files that would be tracked by git:');
    trackedFiles.forEach(file => console.log(`  ${file}`));

    // Validate results
    const violations = [];

    for (const pattern of SENSITIVE_PATTERNS) {
      if (trackedFiles.includes(pattern)) {
        violations.push(pattern);
      }
    }

    if (violations.length > 0) {
      console.error('[gitignore-test] FAIL: Sensitive files not properly ignored:');
      violations.forEach(file => console.error(`  ❌ ${file}`));
      return false;
    } else {
      console.log('[gitignore-test] PASS: All sensitive patterns properly ignored');
      return true;
    }

  } finally {
    // Cleanup
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
  }
}

async function main() {
  console.log('[gitignore-test] Testing .gitignore patterns for sensitive files');

  const success = await testGitIgnorePatterns();

  const report = {
    test: 'gitignore-patterns',
    timestamp: new Date().toISOString(),
    status: success ? 'PASS' : 'FAIL',
    patterns_tested: SENSITIVE_PATTERNS.length,
    summary: success ? 'All sensitive file patterns properly ignored' : 'Some sensitive files not ignored',
  };

  // Write test artifact
  await fs.mkdir('artifacts', { recursive: true });
  await fs.writeFile('artifacts/gitignore-patterns-test.json', JSON.stringify(report, null, 2));

  console.log(`[gitignore-test] Test ${report.status}: ${report.summary}`);

  if (!success) {
    process.exit(1);
  }
}

main().catch(e => {
  console.error('[gitignore-test] Error:', e.message);
  process.exit(1);
});
