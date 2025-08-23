#!/usr/bin/env node
/**
 * param-integrity.test.js
 * Test for parameter integrity validation system
 */
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import assert from 'assert';

async function runParamIntegrity() {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['tools/param-integrity.js'], {
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
  console.log('[test] param-integrity starting...');

  // Test 1: Parameter integrity should pass
  const result = await runParamIntegrity();
  assert(result.code === 0, `param-integrity failed with code ${result.code}: ${result.stderr}`);

  // Test 2: Verify matrix artifact is created
  const matrixExists = await fs.access('artifacts/param-integrity-matrix.json').then(() => true).catch(() => false);
  assert(matrixExists, 'param-integrity-matrix.json should be created');

  // Test 3: Read and validate matrix structure
  const matrixRaw = await fs.readFile('artifacts/param-integrity-matrix.json', 'utf8');
  const matrix = JSON.parse(matrixRaw);
  assert(Array.isArray(matrix.rows), 'Matrix should have rows array');
  assert(typeof matrix.summary_counts === 'object', 'Matrix should have summary_counts object');

  // Test 4: Check that we have expected parameter coverage
  assert(matrix.rows.length > 0, 'Should have at least some parameters tracked');

  // Test 5: Verify parameter format
  if (matrix.rows.length > 0) {
    const param = matrix.rows[0];
    assert(typeof param.parameter === 'string', 'Parameter should have parameter name');
    assert(typeof param.values === 'object', 'Parameter should have values object');
  }

  console.log('[test] param-integrity OK');
}

main().catch(e => {
  console.error('[test] param-integrity FAILED:', e.message);
  process.exit(1);
});
