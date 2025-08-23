#!/usr/bin/env node
/**
 * dec-lint.test.js
 * Test for DEC (Decision) document linting
 */
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import assert from 'assert';

async function runDecLint() {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['tools/dec-lint.js'], {
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
  console.log('[test] dec-lint starting...');

  // Test 1: DEC lint should pass (governance verification passed, so this should too)
  const result = await runDecLint();
  assert(result.code === 0, `dec-lint failed with code ${result.code}: ${result.stderr}`);

  // Test 2: Should report file and violation counts
  assert(result.stdout.includes('files='), 'Should report number of files processed');
  assert(result.stdout.includes('violations='), 'Should report violation count');

  // Test 3: Check that lint report artifact is created
  const reportExists = await fs.access('artifacts/dec-lint.json').then(() => true).catch(() => false);
  assert(reportExists, 'dec-lint.json should be created');

  // Test 4: Validate report structure
  const reportRaw = await fs.readFile('artifacts/dec-lint.json', 'utf8');
  const report = JSON.parse(reportRaw);
  assert(Array.isArray(report.results), 'Report should have results array');
  assert(typeof report.summary === 'object', 'Report should have summary object');

  // Test 5: Should have processed DEC files
  assert(report.results.length > 0, 'Should have processed at least some DEC files');

  // Test 6: Validate file structure
  if (report.results.length > 0) {
    const file = report.results[0];
    assert(typeof file.file === 'string', 'File should have file name');
    assert(Array.isArray(file.violations), 'File should have violations array');
  }

  console.log('[test] dec-lint OK');
}

main().catch(e => {
  console.error('[test] dec-lint FAILED:', e.message);
  process.exit(1);
});
