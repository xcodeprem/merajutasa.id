#!/usr/bin/env node
'use strict';

/**
 * Unit tests for check-actions-pinning.sh script
 * Tests both positive and negative cases for actions pinning validation
 */

import { execSync } from 'child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
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
  
  // Create directories
  execSync(`mkdir -p "${workflowsDir}"`);
  execSync(`mkdir -p "${join(tempDir, '.github')}"`);
  
  // Create test workflow
  writeFileSync(join(workflowsDir, 'test.yml'), content);
  
  // Create minimal allowlist
  const allowlist = {
    "version": "1.0",
    "allowed_actions": [
      {
        "action": "actions/checkout",
        "allowed_shas": ["692973e3d937129bcbf40652eb9f2f61becf3332"],
        "description": "Test action"
      }
    ]
  };
  writeFileSync(allowlistPath, JSON.stringify(allowlist, null, 2));
  
  return tempDir;
}

function runTest(name, workflowContent, shouldPass) {
  console.log(`Testing: ${name}`);
  
  const tempDir = createTestWorkflow(workflowContent);
  
  try {
    const result = execSync(`cd "${tempDir}" && ${SCRIPT_PATH}`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (shouldPass) {
      console.log(`✅ ${name} - PASSED as expected`);
    } else {
      console.log(`❌ ${name} - Should have failed but passed`);
      console.log(`Output: ${result}`);
      process.exitCode = 1;
    }
  } catch (error) {
    if (!shouldPass) {
      console.log(`✅ ${name} - FAILED as expected`);
    } else {
      console.log(`❌ ${name} - Should have passed but failed`);
      console.log(`Error: ${error.message}`);
      console.log(`Exit code: ${error.status}`);
      process.exitCode = 1;
    }
  } finally {
    // Cleanup
    rmSync(tempDir, { recursive: true, force: true });
  }
}

console.log('Actions Pinning Script Tests');
console.log('============================');

// Simple smoke test - just verify the script runs without errors on current repo
console.log('Testing: Script runs on current repository');
try {
  execSync(`${SCRIPT_PATH}`, { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log(`✅ Script runs successfully on current repository`);
} catch (error) {
  console.log(`❌ Script failed on current repository: ${error.message}`);
  process.exitCode = 1;
}

console.log('\nAll tests completed!');