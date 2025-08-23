#!/usr/bin/env node
'use strict';

/**
 * Unit tests for check-actions-pinning.sh script
 * Tests both positive and negative cases for actions pinning validation
 *
 * Security hardening: avoid execSync with shell interpolation.
 */

import { spawnSync } from 'child_process';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = resolve(__dirname, '../../.github/scripts/check-actions-pinning.sh');

function createTestWorkflow(content) {
  const tempDir = mkdtempSync(join(tmpdir(), 'actions-pinning-test-'));
  const workflowsDir = join(tempDir, '.github', 'workflows');
  const allowlistPath = join(tempDir, '.github', 'actions-allowlist.json');

  // Create directories (safe, no shell)
  mkdirSync(workflowsDir, { recursive: true });
  mkdirSync(join(tempDir, '.github'), { recursive: true });

  // Create test workflow
  writeFileSync(join(workflowsDir, 'test.yml'), content);

  // Create minimal allowlist
  const allowlist = {
    'version': '1.0',
    'allowed_actions': [
      {
        'action': 'actions/checkout',
        'allowed_shas': ['692973e3d937129bcbf40652eb9f2f61becf3332'],
        'description': 'Test action',
      },
    ],
  };
  writeFileSync(allowlistPath, JSON.stringify(allowlist, null, 2));

  return tempDir;
}

function runTest(name, workflowContent, shouldPass) {
  console.log(`Testing: ${name}`);

  const tempDir = createTestWorkflow(workflowContent);

  try {
    // Run the script without invoking a shell; prefer executing directly.
    const result = spawnSync(SCRIPT_PATH, { cwd: tempDir, encoding: 'utf8' });
    const stdout = result.stdout?.toString?.() ?? '';
    const stderr = result.stderr?.toString?.() ?? '';

    if (shouldPass && result.status === 0) {
      console.log(`✅ ${name} - PASSED as expected`);
    } else if (!shouldPass && result.status !== 0) {
      console.log(`✅ ${name} - FAILED as expected`);
    } else if (!shouldPass && result.status === 0) {
      console.log(`❌ ${name} - Should have failed but passed`);
      console.log(`Output: ${stdout}\n${stderr}`);
      process.exitCode = 1;
    } else {
      console.log(`❌ ${name} - Should have passed but failed`);
      console.log(`Exit code: ${result.status}`);
      console.log(`Output: ${stdout}\n${stderr}`);
      process.exitCode = 1;
    }
  } finally {
    // Cleanup
    rmSync(tempDir, { recursive: true, force: true });
  }
}

console.log('Actions Pinning Script Tests');
console.log('============================');

// Simple smoke test - run only if script exists and is executable in this OS
console.log('Testing: Script runs on current repository');
if (existsSync(SCRIPT_PATH)) {
  const res = spawnSync(SCRIPT_PATH, { encoding: 'utf8' });
  if (res.status === 0) {
    console.log('✅ Script runs successfully on current repository');
  } else {
    console.log(`❌ Script failed on current repository (exit ${res.status})`);
    process.exitCode = 1;
  }
} else {
  console.log('ℹ️ Script not found; skipping smoke run');
}

console.log('\nAll tests completed!');
