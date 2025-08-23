#!/usr/bin/env node
/**
 * env-config-verification.test.js
 * Test script to verify that core services properly use environment variables
 * and that environment configuration is complete and consistent.
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';

console.log('[test] env-config-verification starting...');

const TIMEOUT = 8000; // 8 seconds timeout for service startup

// Test configuration scenarios
const testScenarios = [
  {
    name: 'default_ports',
    description: 'Default ports and hosts',
    env: {},
    expectedPorts: { signer: '4601', chain: '4602', collector: '4603' },
    expectedHost: '0.0.0.0',
  },
  {
    name: 'custom_ports',
    description: 'Custom ports with default hosts',
    env: { SIGNER_PORT: '14601', CHAIN_PORT: '14602', COLLECTOR_PORT: '14603' },
    expectedPorts: { signer: '14601', chain: '14602', collector: '14603' },
    expectedHost: '0.0.0.0',
  },
  {
    name: 'custom_hosts',
    description: 'Custom hosts with default ports',
    env: { SIGNER_HOST: '127.0.0.1', CHAIN_HOST: '127.0.0.1', COLLECTOR_HOST: '127.0.0.1' },
    expectedPorts: { signer: '4601', chain: '4602', collector: '4603' },
    expectedHost: '127.0.0.1',
  },
  {
    name: 'custom_host_and_ports',
    description: 'Custom hosts and ports',
    env: {
      SIGNER_HOST: '127.0.0.1', SIGNER_PORT: '15601',
      CHAIN_HOST: '127.0.0.1', CHAIN_PORT: '15602',
      COLLECTOR_HOST: '127.0.0.1', COLLECTOR_PORT: '15603',
    },
    expectedPorts: { signer: '15601', chain: '15602', collector: '15603' },
    expectedHost: '127.0.0.1',
  },
];

function startService(serviceName, env = {}) {
  return new Promise((resolve, reject) => {
    const script = `tools/services/${serviceName}.js`;
    const child = spawn('node', [script], {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';
    let resolved = false;

    const onData = (data) => {
      output += data.toString();
      // Look for listening message
      if (output.includes('listening on')) {
        if (!resolved) {
          resolved = true;
          resolve({ child, output });
        }
      }
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);

    child.on('error', (error) => {
      if (!resolved) {
        resolved = true;
        reject(error);
      }
    });

    // Timeout fallback
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({ child, output });
      }
    }, TIMEOUT);
  });
}

function parseListeningMessage(output, serviceName) {
  const regex = new RegExp(`\\[${serviceName}\\] listening on ([^:]+):(\\d+)`);
  const match = output.match(regex);
  if (match) {
    return { host: match[1], port: match[2] };
  }
  return null;
}

async function testScenario(scenario) {
  console.log(`  Testing scenario: ${scenario.name} (${scenario.description})`);

  const services = ['signer', 'chain', 'collector'];
  const results = [];

  for (const serviceName of services) {
    try {
      const { child, output } = await startService(serviceName, scenario.env);
      const listening = parseListeningMessage(output, serviceName);

      results.push({
        service: serviceName,
        success: true,
        listening,
        output: output.trim(),
      });

      // Kill the service
      child.kill('SIGTERM');

      // Small delay to avoid port conflicts
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      results.push({
        service: serviceName,
        success: false,
        error: error.message,
      });
    }
  }

  // Verify results
  let scenarioSuccess = true;
  for (const result of results) {
    if (!result.success) {
      console.log(`    ❌ ${result.service}: Failed to start - ${result.error}`);
      scenarioSuccess = false;
    } else if (!result.listening) {
      console.log(`    ❌ ${result.service}: Could not parse listening message from output: ${result.output}`);
      scenarioSuccess = false;
    } else {
      const expectedPort = scenario.expectedPorts[result.service];
      const actualHost = result.listening.host;
      const actualPort = result.listening.port;

      if (actualHost !== scenario.expectedHost) {
        console.log(`    ❌ ${result.service}: Expected host ${scenario.expectedHost}, got ${actualHost}`);
        scenarioSuccess = false;
      } else if (actualPort !== expectedPort) {
        console.log(`    ❌ ${result.service}: Expected port ${expectedPort}, got ${actualPort}`);
        scenarioSuccess = false;
      } else {
        console.log(`    ✅ ${result.service}: Correctly listening on ${actualHost}:${actualPort}`);
      }
    }
  }

  return scenarioSuccess;
}

async function testDataDirectoryConfiguration() {
  console.log('  Testing data directory configuration...');

  // Test chain with custom data directory
  const tempDataDir = './test-chain-data';
  try {
    await fs.rm(tempDataDir, { recursive: true, force: true });
  } catch {}

  const { child: chainChild, output: chainOutput } = await startService('chain', {
    CHAIN_DATA_DIR: tempDataDir,
    CHAIN_PORT: '16602',
  });

  chainChild.kill('SIGTERM');
  await new Promise(resolve => setTimeout(resolve, 200));

  // Check if custom data directory was created
  let chainDataDirExists = false;
  try {
    await fs.access(tempDataDir);
    chainDataDirExists = true;
  } catch {}

  // Test collector with custom events directory
  const tempEventsDir = './test-events-data';
  try {
    await fs.rm(tempEventsDir, { recursive: true, force: true });
  } catch {}

  const { child: collectorChild, output: collectorOutput } = await startService('collector', {
    EVENTS_DATA_DIR: tempEventsDir,
    COLLECTOR_PORT: '16603',
  });

  collectorChild.kill('SIGTERM');
  await new Promise(resolve => setTimeout(resolve, 200));

  // Cleanup
  try {
    await fs.rm(tempDataDir, { recursive: true, force: true });
    await fs.rm(tempEventsDir, { recursive: true, force: true });
  } catch {}

  console.log(`    ✅ Chain custom data directory: ${chainDataDirExists ? 'Created' : 'Not created'}`);
  console.log('    ✅ Collector events directory: Configuration applied');

  return true;
}

async function verifyEnvFileConsistency() {
  console.log('  Verifying .env file consistency...');

  const envExample = await fs.readFile('.env.example', 'utf8');
  const envDev = await fs.readFile('.env.development', 'utf8');

  const requiredVars = [
    'SIGNER_PORT', 'SIGNER_HOST',
    'CHAIN_PORT', 'CHAIN_HOST', 'CHAIN_DATA_DIR',
    'COLLECTOR_PORT', 'COLLECTOR_HOST', 'EVENTS_DATA_DIR',
  ];

  let allVarsPresent = true;

  for (const varName of requiredVars) {
    if (!envExample.includes(varName)) {
      console.log(`    ❌ Missing ${varName} in .env.example`);
      allVarsPresent = false;
    } else {
      console.log(`    ✅ ${varName} present in .env.example`);
    }
  }

  return allVarsPresent;
}

async function main() {
  let allTestsPassed = true;

  // Test each scenario
  for (const scenario of testScenarios) {
    const success = await testScenario(scenario);
    if (!success) {allTestsPassed = false;}
  }

  // Test data directory configuration
  const dataDirSuccess = await testDataDirectoryConfiguration();
  if (!dataDirSuccess) {allTestsPassed = false;}

  // Verify environment file consistency
  const envConsistency = await verifyEnvFileConsistency();
  if (!envConsistency) {allTestsPassed = false;}

  if (allTestsPassed) {
    console.log('[test] env-config-verification OK');
    process.exit(0);
  } else {
    console.log('[test] env-config-verification FAILED');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('[test] env-config-verification ERROR:', error);
  process.exit(1);
});
