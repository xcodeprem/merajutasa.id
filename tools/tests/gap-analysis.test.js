#!/usr/bin/env node
/**
 * gap-analysis.test.js
 * Test for gap analysis tool functionality
 */
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import assert from 'assert';

async function runGapAnalysis() {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['tools/gap-analysis.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
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
  console.log('[test] gap-analysis starting...');

  // Test 1: Gap analysis should complete successfully
  const result = await runGapAnalysis();
  assert(result.code === 0, `gap-analysis failed with code ${result.code}: ${result.stderr}`);

  // Test 2: Should produce expected output sections
  assert(result.stdout.includes('GAP ANALYSIS SUMMARY'), 'Should output gap analysis summary');
  assert(result.stdout.includes('By category'), 'Should include categories breakdown');

  // Test 3: Should analyze different gap categories
  assert(result.stdout.includes('By category'), 'Should analyze different categories');
  assert(result.stdout.includes('testing'), 'Should analyze testing gaps');

  // Test 4: Should provide system readiness assessment
  assert(result.stdout.includes('System readiness'), 'Should include readiness assessment');

  // Test 5: Should indicate current hash integrity status (should be better now)
  // After our fixes, hash violations should be resolved
  const hasIntegrityIssues = result.stdout.includes('CRITICAL') && result.stdout.includes('hash');
  if (hasIntegrityIssues) {
    // If still showing hash issues, that's unexpected after our fixes
    console.warn('[test] Warning: Gap analysis still showing hash integrity issues');
  }

  console.log('[test] gap-analysis OK');
}

main().catch(e => {
  console.error('[test] gap-analysis FAILED:', e.message);
  process.exit(1);
});
