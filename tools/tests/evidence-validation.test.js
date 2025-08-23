#!/usr/bin/env node
/**
 * evidence-validation.test.js
 * Test for evidence validation and bundling tools
 */
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import assert from 'assert';

async function runTool(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [scriptPath, ...args], {
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
  console.log('[test] evidence-validation starting...');

  // Test 1: Evidence validation should run
  const validateResult = await runTool('tools/validate-evidence.js');
  assert(validateResult.code === 0, `Evidence validation failed with code ${validateResult.code}: ${validateResult.stderr}`);

  // Test 2: Evidence bundling should work
  const bundleResult = await runTool('tools/evidence-bundle.js');
  assert(bundleResult.code === 0, `Evidence bundling failed with code ${bundleResult.code}: ${bundleResult.stderr}`);

  // Test 3: Evidence collision test should pass
  const collisionResult = await runTool('tools/evidence-collision-test.js');
  assert(collisionResult.code === 0, `Evidence collision test failed with code ${collisionResult.code}: ${collisionResult.stderr}`);
  assert(collisionResult.stdout.includes('OK'), 'Evidence collision test should pass');

  // Test 4: Evidence freshness check should run
  const freshnessResult = await runTool('tools/evidence-freshness.js');
  assert(freshnessResult.code === 0, `Evidence freshness failed with code ${freshnessResult.code}: ${freshnessResult.stderr}`);

  // Test 5: Check that evidence collision report exists
  const reportExists = await fs.access('artifacts/evidence-collision-test.json').then(() => true).catch(() => false);
  assert(reportExists, 'Evidence collision test report should be created');

  // Test 6: Validate collision report structure
  const reportRaw = await fs.readFile('artifacts/evidence-collision-test.json', 'utf8');
  const report = JSON.parse(reportRaw);
  assert(typeof report.prefix_length === 'number', 'Report should have prefix_length');
  assert(typeof report.artifact_hashes === 'number', 'Report should have artifact_hashes count');
  assert(Array.isArray(report.collisions), 'Report should have collisions array');

  console.log('[test] evidence-validation OK');
}

main().catch(e => {
  console.error('[test] evidence-validation FAILED:', e.message);
  process.exit(1);
});
