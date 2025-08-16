#!/usr/bin/env node
/**
 * governance-verify.test.js
 * Integration test for governance verification pipeline
 */
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import assert from 'assert';

async function runGovernanceVerify() {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['tools/governance-verify.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
    
    proc.on('error', reject);
  });
}

async function main() {
  console.log('[test] governance-verify starting...');
  
  // Test 1: Governance verification should pass (after hash fixes)
  const result = await runGovernanceVerify();
  assert(result.code === 0, `Governance verification failed with code ${result.code}: ${result.stderr}`);
  
  // Test 2: Verify summary artifacts are created
  const summaryExists = await fs.access('artifacts/governance-verify-summary.json').then(() => true).catch(() => false);
  assert(summaryExists, 'governance-verify-summary.json should be created');
  
  // Test 3: Check that critical steps completed
  assert(result.stdout.includes('spec-hash-diff'), 'Should run spec-hash-diff step');
  assert(result.stdout.includes('param-integrity'), 'Should run param-integrity step');
  assert(result.stdout.includes('Completed'), 'Should complete successfully');
  
  console.log('[test] governance-verify OK');
}

main().catch(e => {
  console.error('[test] governance-verify FAILED:', e.message);
  process.exit(1);
});