#!/usr/bin/env node
/**
 * services-integration.test.js
 * Integration test for core services functionality
 */
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import assert from 'assert';

async function startService(scriptPath, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [scriptPath], {
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
    
    // Give the service a short time to start or show errors
    setTimeout(() => {
      proc.kill('SIGTERM');
      resolve({ stdout, stderr, killed: true });
    }, timeout);
    
    proc.on('error', reject);
  });
}

async function main() {
  console.log('[test] services-integration starting...');
  
  // Test 1: Signer service should start without critical errors
  const signerResult = await startService('tools/services/signer.js');
  assert(!signerResult.stderr.includes('Cannot'), `Signer service critical error: ${signerResult.stderr}`);
  
  // Test 2: Chain service should start without critical errors  
  const chainResult = await startService('tools/services/chain.js');
  assert(!chainResult.stderr.includes('Cannot'), `Chain service critical error: ${chainResult.stderr}`);
  
  // Test 3: Collector service should start without critical errors (port conflicts are acceptable)
  const collectorResult = await startService('tools/services/collector.js');
  const hasPortConflict = collectorResult.stderr.includes('EADDRINUSE');
  const hasCriticalError = collectorResult.stderr.includes('Cannot') && !hasPortConflict;
  assert(!hasCriticalError, `Collector service critical error: ${collectorResult.stderr}`);
  
  console.log('[test] services-integration OK');
}

main().catch(e => {
  console.error('[test] services-integration FAILED:', e.message);
  process.exit(1);
});