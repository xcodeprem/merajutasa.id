#!/usr/bin/env node
/**
 * events-processing.test.js  
 * Test for event processing and validation tools
 */
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import assert from 'assert';

async function runTool(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [scriptPath, ...args], {
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
  console.log('[test] events-processing starting...');
  
  // Test 1: Event meta validation should run
  const metaResult = await runTool('tools/event-meta-validate.js');
  assert(metaResult.code === 0, `Event meta validation failed with code ${metaResult.code}: ${metaResult.stderr}`);
  
  // Test 2: Event validation should work if sample file exists
  const sampleExists = await fs.access('data/events-sample.ndjson').then(() => true).catch(() => false);
  if (sampleExists) {
    const validateResult = await runTool('tools/event-validate.js', ['--file', 'data/events-sample.ndjson', '--rehash']);
    assert(validateResult.code === 0, `Event validation failed with code ${validateResult.code}: ${validateResult.stderr}`);
  }
  
  // Test 3: Event pipeline hash should work
  const pipelineResult = await runTool('tools/event-pipeline-hash.js');
  assert(pipelineResult.code === 0, `Event pipeline hash failed with code ${pipelineResult.code}: ${pipelineResult.stderr}`);
  
  // Test 4: Event anchor chain should run
  const anchorResult = await runTool('tools/event-anchor-chain.js');
  assert(anchorResult.code === 0, `Event anchor chain failed with code ${anchorResult.code}: ${anchorResult.stderr}`);
  
  console.log('[test] events-processing OK');
}

main().catch(e => {
  console.error('[test] events-processing FAILED:', e.message);
  process.exit(1);
});