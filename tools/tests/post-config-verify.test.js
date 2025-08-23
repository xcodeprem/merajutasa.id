#!/usr/bin/env node
/**
 * Test suite for post-config-verify.js
 * Validates that the post-configuration verification script works correctly
 */

import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import assert from 'assert';

/**
 * Run a command and capture its output
 */
function runCommand(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      ...options,
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => stdout += data.toString());
    child.stderr?.on('data', (data) => stderr += data.toString());

    child.on('exit', (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on('error', reject);
  });
}

/**
 * Test that post-config verification runs successfully
 */
async function testPostConfigVerify() {
  console.log('[test] Running post-config verification...');

  const result = await runCommand('npm', ['run', 'post-config:verify']);

  // Verify exit code is 0 (success)
  assert.strictEqual(result.code, 0, `Post-config verification should succeed, got exit code ${result.code}`);

  // Verify expected output patterns
  assert(result.stdout.includes('POST-CONFIGURATION VERIFICATION COMPLETE'),
    'Should display completion message');
  assert(result.stdout.includes('Overall Status: ✅ PASS'),
    'Should show overall PASS status');
  assert(result.stdout.includes('Steps: 4/4 passed'),
    'Should complete all 4 verification steps');

  console.log('[test] Post-config verification output check passed');
}

/**
 * Test that required artifacts are generated
 */
async function testArtifactsGeneration() {
  console.log('[test] Checking artifact generation...');

  // Check summary file exists
  const summaryExists = await fs.access('artifacts/post-config-verification-summary.json')
    .then(() => true)
    .catch(() => false);
  assert(summaryExists, 'Summary file should be generated');

  // Verify summary content
  const summaryContent = await fs.readFile('artifacts/post-config-verification-summary.json', 'utf8');
  const summary = JSON.parse(summaryContent);

  assert.strictEqual(summary.overall_status, 'PASS', 'Overall status should be PASS');
  assert.strictEqual(summary.total_steps, 4, 'Should have 4 verification steps');
  assert.strictEqual(summary.passed_steps, 4, 'All 4 steps should pass');
  assert.strictEqual(summary.failed_steps, 0, 'No steps should fail');

  // Check criteria met
  assert(summary.criteria_met.all_commands_pass, 'All commands should pass');
  assert(summary.criteria_met.no_hash_drift, 'Should have no hash drift');
  assert(summary.criteria_met.no_param_violations, 'Should have no parameter violations');
  assert(summary.criteria_met.artifacts_generated, 'Should have artifacts generated');

  // Check action log file exists
  const today = new Date().toISOString().slice(0, 10);
  const logExists = await fs.access(`artifacts/post-config-verify-${today}.json`)
    .then(() => true)
    .catch(() => false);
  assert(logExists, 'Action log file should be generated');

  console.log('[test] Artifact generation check passed');
}

/**
 * Test that individual verification commands work
 */
async function testIndividualCommands() {
  console.log('[test] Testing individual verification commands...');

  const commands = [
    ['npm', 'run', 'governance:verify'],
    ['npm', 'run', 'spec-hash:verify'],
    ['npm', 'run', 'param:integrity'],
    ['npm', 'run', 'compliance:audit'],
  ];

  for (const [cmd, ...args] of commands) {
    const result = await runCommand(cmd, args);
    assert.strictEqual(result.code, 0, `Command '${cmd} ${args.join(' ')}' should succeed`);
  }

  console.log('[test] Individual commands check passed');
}

/**
 * Test that required step artifacts exist
 */
async function testStepArtifacts() {
  console.log('[test] Checking step-specific artifacts...');

  const requiredArtifacts = [
    'artifacts/governance-verify-summary.json',
    'artifacts/spec-hash-diff.json',
    'artifacts/param-integrity-matrix.json',
  ];

  for (const artifact of requiredArtifacts) {
    const exists = await fs.access(artifact).then(() => true).catch(() => false);
    assert(exists, `Required artifact ${artifact} should exist`);
  }

  console.log('[test] Step artifacts check passed');
}

/**
 * Main test runner
 */
async function main() {
  console.log('[test] Starting post-config verification test suite...');

  try {
    await testIndividualCommands();
    await testPostConfigVerify();
    await testArtifactsGeneration();
    await testStepArtifacts();

    console.log('[test] ✅ All post-config verification tests passed');
    process.exit(0);

  } catch (error) {
    console.error('[test] ❌ Post-config verification test failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { testPostConfigVerify, testArtifactsGeneration, testIndividualCommands, testStepArtifacts };
