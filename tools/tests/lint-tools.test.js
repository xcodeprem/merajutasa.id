#!/usr/bin/env node
/**
 * lint-tools.test.js
 * Test for various linting tools
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
  console.log('[test] lint-tools starting...');

  // Test 1: Disclaimers lint should run
  const disclaimersResult = await runTool('tools/disclaimers-lint.js');
  assert(disclaimersResult.code === 0, `Disclaimers lint failed with code ${disclaimersResult.code}: ${disclaimersResult.stderr}`);

  // Test 2: Hype lint should run (advisory)
  const hypeResult = await runTool('tools/hype-lint.js');
  // Hype lint might have warnings but should not fail critically
  assert(hypeResult.code === 0 || hypeResult.code === 1, `Hype lint unexpected failure: ${hypeResult.stderr}`);

  // Test 3: Check disclaimers lint report
  const disclaimersReportExists = await fs.access('artifacts/disclaimers-lint.json').then(() => true).catch(() => false);
  assert(disclaimersReportExists, 'Disclaimers lint report should be created');

  // Test 4: Check hype lint report
  const hypeReportExists = await fs.access('artifacts/hype-lint.json').then(() => true).catch(() => false);
  assert(hypeReportExists, 'Hype lint report should be created');

  // Test 5: Validate disclaimers report structure
  const disclaimersRaw = await fs.readFile('artifacts/disclaimers-lint.json', 'utf8');
  const disclaimers = JSON.parse(disclaimersRaw);
  assert(Array.isArray(disclaimers.errors), 'Disclaimers report should have errors array');
  assert(Array.isArray(disclaimers.warnings), 'Disclaimers report should have warnings array');
  assert(typeof disclaimers.summary === 'object', 'Disclaimers report should have summary');

  console.log('[test] lint-tools OK');
}

main().catch(e => {
  console.error('[test] lint-tools FAILED:', e.message);
  process.exit(1);
});
