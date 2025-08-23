#!/usr/bin/env node
/**
 * privacy-tools.test.js
 * Test for privacy and PII scanning tools
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
  console.log('[test] privacy-tools starting...');

  // Test 1: PII scan should run successfully
  const piiResult = await runTool('tools/pii-scan.js', ['--sarif']);
  assert(piiResult.code === 0, `PII scan failed with code ${piiResult.code}: ${piiResult.stderr}`);

  // Test 2: PII metrics should generate
  const metricsResult = await runTool('tools/pii-metrics.js');
  assert(metricsResult.code === 0, `PII metrics failed with code ${metricsResult.code}: ${metricsResult.stderr}`);
  assert(metricsResult.stdout.includes('precision='), 'Should output precision metrics');

  // Test 3: Privacy asserts should run
  const assertsResult = await runTool('tools/privacy-asserts.js');
  assert(assertsResult.code === 0, `Privacy asserts failed with code ${assertsResult.code}: ${assertsResult.stderr}`);

  // Test 4: Check PII scan SARIF output exists
  const sarifExists = await fs.access('artifacts/pii-scan-report.sarif.json').then(() => true).catch(() => false);
  assert(sarifExists, 'PII scan SARIF report should be created');

  // Test 5: Validate SARIF structure
  const sarifRaw = await fs.readFile('artifacts/pii-scan-report.sarif.json', 'utf8');
  const sarif = JSON.parse(sarifRaw);
  assert(sarif.version === '2.1.0', 'SARIF should be version 2.1.0');
  assert(Array.isArray(sarif.runs), 'SARIF should have runs array');

  console.log('[test] privacy-tools OK');
}

main().catch(e => {
  console.error('[test] privacy-tools FAILED:', e.message);
  process.exit(1);
});
