#!/usr/bin/env node
/**
 * workflow-quality-checks.test.js
 * Test for workflow quality checks (ESLint, Prettier, TypeScript)
 */
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import assert from 'assert';
import path from 'path';

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', data => {
      stdout += data.toString();
    });

    proc.stderr.on('data', data => {
      stderr += data.toString();
    });

    proc.on('close', code => {
      resolve({ code, stdout, stderr });
    });

    proc.on('error', reject);
  });
}

async function main() {
  console.log('[test] workflow-quality-checks starting...');

  // Test 1: ESLint configuration exists and can run
  const eslintConfigExists = await fs
    .access('eslint.config.js')
    .then(() => true)
    .catch(() => false);
  assert(eslintConfigExists, 'ESLint configuration should exist');

  // Test 2: Prettier configuration exists
  const prettierConfigExists = await fs
    .access('.prettierrc.json')
    .then(() => true)
    .catch(() => false);
  assert(prettierConfigExists, 'Prettier configuration should exist');

  // Test 3: TypeScript configuration exists
  const tsConfigExists = await fs
    .access('tsconfig.json')
    .then(() => true)
    .catch(() => false);
  assert(tsConfigExists, 'TypeScript configuration should exist');

  // Test 4: ESLint can run without crashing
  const eslintResult = await runCommand('npm', ['run', 'lint:js:ci']);
  assert(eslintResult.code === 0, 'ESLint CI script should not fail');

  // Test 5: Prettier check can run
  const prettierResult = await runCommand('npm', ['run', 'format:check:ci']);
  assert(prettierResult.code === 0, 'Prettier CI script should not fail');

  // Test 6: TypeScript check can run
  const typecheckResult = await runCommand('npm', ['run', 'typecheck']);
  assert(typecheckResult.code === 0, 'TypeScript check should pass');

  // Test 7: Package.json scripts exist
  const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
  const requiredScripts = [
    'lint:js',
    'lint:js:fix',
    'lint:js:ci',
    'format',
    'format:check',
    'format:check:ci',
    'typecheck',
  ];

  for (const script of requiredScripts) {
    assert(
      packageJson.scripts && packageJson.scripts[script],
      `Script '${script}' should exist in package.json`
    );
  }

  // Test 8: DevDependencies are installed
  const requiredDeps = ['eslint', 'prettier', 'typescript', '@eslint/js', 'globals'];
  for (const dep of requiredDeps) {
    assert(
      packageJson.devDependencies && packageJson.devDependencies[dep],
      `DevDependency '${dep}' should be installed`
    );
  }

  // Test 9: Workflow file contains quality checks
  const workflowPath = '.github/workflows/node-lts-matrix.yml';
  const workflowExists = await fs
    .access(workflowPath)
    .then(() => true)
    .catch(() => false);
  assert(workflowExists, 'Node LTS workflow should exist');

  const workflowContent = await fs.readFile(workflowPath, 'utf8');
  assert(
    workflowContent.includes('lint:js:ci'),
    'Workflow should include ESLint CI check'
  );
  assert(
    workflowContent.includes('format:check:ci'),
    'Workflow should include Prettier check'
  );
  assert(workflowContent.includes('typecheck'), 'Workflow should include TypeScript check');

  console.log('[test] workflow-quality-checks OK');
}

main().catch(e => {
  console.error('[test] workflow-quality-checks FAILED:', e.message);
  process.exit(1);
});