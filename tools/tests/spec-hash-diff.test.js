#!/usr/bin/env node
/**
 * spec-hash-diff.test.js
 * Unit test for spec-hash-diff functionality including modes and validation
 */
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import assert from 'assert';

async function runSpecHashDiff(mode = 'verify', additionalArgs = []) {
  return new Promise((resolve, reject) => {
    const args = ['tools/spec-hash-diff.js', `--mode=${mode}`, ...additionalArgs];
    const proc = spawn('node', args, {
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

async function readJSONArtifact(filename) {
  try {
    const raw = await fs.readFile(`artifacts/${filename}`, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('[test] spec-hash-diff starting...');

  // Test 1: Verify mode should pass (after hash fixes)
  const verifyResult = await runSpecHashDiff('verify');
  assert(verifyResult.code === 0, `Verify mode should pass after hash fixes, got code ${verifyResult.code}`);
  assert(verifyResult.stdout.includes('violations=0'), 'Should have no violations after fixes');

  // Test 2: Report-only mode should work
  const reportResult = await runSpecHashDiff('report-only');
  assert(reportResult.code === 0, 'Report-only mode should always succeed');

  // Test 3: Check artifacts are created
  const report = await readJSONArtifact('spec-hash-diff.json');
  assert(report !== null, 'spec-hash-diff.json should be created');
  assert(typeof report.summary === 'object', 'Report should have summary section');
  assert(Array.isArray(report.violations), 'Report should have violations array');

  // Test 4: Summary file should exist
  const summary = await readJSONArtifact('spec-hash-summary.json');
  assert(summary !== null, 'spec-hash-summary.json should be created');
  assert(typeof summary.violation_count === 'number', 'Summary should have violation_count');

  // Test 5: Check validation output format
  assert(verifyResult.stdout.includes('[spec-hash-diff] START mode=verify'), 'Should log start message');
  assert(verifyResult.stdout.includes('Summary:'), 'Should output summary');

  console.log('[test] spec-hash-diff OK');
}

main().catch(e => {
  console.error('[test] spec-hash-diff FAILED:', e.message);
  process.exit(1);
});
