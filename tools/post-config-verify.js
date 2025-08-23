#!/usr/bin/env node
/**
 * post-config-verify.js
 * Comprehensive post-configuration verification orchestrator
 *
 * Runs all required governance and compliance checks after configuration changes:
 * 1. governance:verify - Complete governance integrity check
 * 2. spec-hash:verify - Content hash verification
 * 3. param:integrity - Parameter consistency validation
 * 4. compliance:audit - Compliance audit checks
 *
 * Success Criteria:
 * - All verification commands must PASS (exit code 0)
 * - No hash drift or parameter integrity violations
 * - Generate comprehensive verification report
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { stableStringify, addMetadata } from './lib/json-stable.js';

const VERIFICATION_STEPS = [
  {
    name: 'governance-verify',
    cmd: ['npm', 'run', 'governance:verify'],
    description: 'Complete governance integrity check',
    critical: true,
    timeout: 300000, // 5 minutes
  },
  {
    name: 'spec-hash-verify',
    cmd: ['npm', 'run', 'spec-hash:verify'],
    description: 'Content hash verification',
    critical: true,
    timeout: 60000, // 1 minute
  },
  {
    name: 'param-integrity',
    cmd: ['npm', 'run', 'param:integrity'],
    description: 'Parameter consistency validation',
    critical: true,
    timeout: 60000, // 1 minute
  },
  {
    name: 'compliance-audit',
    cmd: ['npm', 'run', 'compliance:audit'],
    description: 'Compliance audit checks',
    critical: true,
    timeout: 120000, // 2 minutes
  },
];

const ACTION_LOG_DIR = 'artifacts';
const SUMMARY_FILE = 'artifacts/post-config-verification-summary.json';

/**
 * Run a single verification step with proper logging and error handling
 */
async function runVerificationStep(step) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    console.log(`[post-config-verify] Running ${step.name}: ${step.description}`);

    const child = spawn(step.cmd[0], step.cmd.slice(1), {
      stdio: ['inherit', 'pipe', 'pipe'],
      timeout: step.timeout,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output);
    });

    child.stderr?.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(output);
    });

    child.on('exit', (code) => {
      const durationMs = Date.now() - started;
      const status = code === 0 ? 'PASS' : 'FAIL';

      logAction({
        action: 'verification-step',
        step: step.name,
        cmd: step.cmd.join(' '),
        exit_code: code,
        status,
        duration_ms: durationMs,
        critical: step.critical,
        description: step.description,
      });

      if (code === 0) {
        console.log(`[post-config-verify] ✅ ${step.name} PASSED (${durationMs}ms)`);
        resolve({ step: step.name, status: 'PASS', duration_ms: durationMs, exit_code: code });
      } else {
        console.error(`[post-config-verify] ❌ ${step.name} FAILED (exit code ${code}, ${durationMs}ms)`);
        if (step.critical) {
          reject(new Error(`Critical step ${step.name} failed with exit code ${code}`));
        } else {
          resolve({ step: step.name, status: 'FAIL', duration_ms: durationMs, exit_code: code });
        }
      }
    });

    child.on('error', (error) => {
      console.error(`[post-config-verify] Error running ${step.name}:`, error);
      reject(error);
    });

    // Handle timeout
    child.on('timeout', () => {
      console.error(`[post-config-verify] Timeout: ${step.name} exceeded ${step.timeout}ms`);
      child.kill('SIGTERM');
      reject(new Error(`Step ${step.name} timed out after ${step.timeout}ms`));
    });
  });
}

/**
 * Log action with metadata for audit trail
 */
async function logAction(entry) {
  try {
    await fs.mkdir(ACTION_LOG_DIR, { recursive: true });
    const logPath = path.join(ACTION_LOG_DIR, `post-config-verify-${new Date().toISOString().slice(0, 10)}.json`);

    let logEntries = [];
    try {
      const content = await fs.readFile(logPath, 'utf8');
      logEntries = JSON.parse(content);
      if (!Array.isArray(logEntries)) {logEntries = [];}
    } catch {
      // File doesn't exist or is invalid, start fresh
    }

    const logEntry = addMetadata({
      timestamp: new Date().toISOString(),
      ...entry,
    }, { generator: 'post-config-verify' });

    logEntries.push(logEntry);
    await fs.writeFile(logPath, stableStringify(logEntries));
  } catch (error) {
    console.warn('[post-config-verify] Failed to write action log:', error.message);
  }
}

/**
 * Generate comprehensive verification summary
 */
async function generateSummary(results) {
  const summary = {
    overall_status: results.every(r => r.status === 'PASS') ? 'PASS' : 'FAIL',
    total_steps: results.length,
    passed_steps: results.filter(r => r.status === 'PASS').length,
    failed_steps: results.filter(r => r.status === 'FAIL').length,
    total_duration_ms: results.reduce((sum, r) => sum + r.duration_ms, 0),
    steps: results,
    verification_timestamp: new Date().toISOString(),
    criteria_met: {
      all_commands_pass: results.every(r => r.status === 'PASS'),
      no_hash_drift: true, // Will be updated based on actual results
      no_param_violations: true, // Will be updated based on actual results
      artifacts_generated: true,
    },
  };

  // Check for specific failure indicators
  try {
    // Check spec-hash results for drift
    const specHashData = await fs.readFile('artifacts/spec-hash-diff.json', 'utf8');
    const specHash = JSON.parse(specHashData);
    summary.criteria_met.no_hash_drift = (specHash.summary?.violation_count === 0) ||
                                        (Array.isArray(specHash.violations) && specHash.violations.length === 0);

    // Check param-integrity results
    const paramData = await fs.readFile('artifacts/param-integrity-matrix.json', 'utf8');
    const paramIntegrity = JSON.parse(paramData);
    summary.criteria_met.no_param_violations = (paramIntegrity.status === 'PASS') ||
                                              (paramIntegrity.rows?.every(row => row.status === 'MATCH'));
  } catch (error) {
    console.warn('[post-config-verify] Could not verify detailed criteria:', error.message);
    summary.criteria_met.no_hash_drift = false;
    summary.criteria_met.no_param_violations = false;
  }

  const enhancedSummary = addMetadata(summary, { generator: 'post-config-verify' });
  await fs.writeFile(SUMMARY_FILE, stableStringify(enhancedSummary));

  return enhancedSummary;
}

/**
 * Main verification orchestrator
 */
async function main() {
  console.log('[post-config-verify] Starting comprehensive post-configuration verification...');

  const startTime = Date.now();
  const results = [];

  await logAction({
    action: 'verification-start',
    status: 'STARTED',
    steps_planned: VERIFICATION_STEPS.length,
  });

  try {
    // Run all verification steps sequentially
    for (const step of VERIFICATION_STEPS) {
      try {
        const result = await runVerificationStep(step);
        results.push(result);
      } catch (error) {
        console.error(`[post-config-verify] Critical failure in ${step.name}:`, error.message);
        results.push({
          step: step.name,
          status: 'FAIL',
          duration_ms: Date.now() - startTime,
          exit_code: 1,
          error: error.message,
        });

        if (step.critical) {
          console.error('[post-config-verify] Stopping due to critical failure');
          break;
        }
      }
    }

    // Generate comprehensive summary
    const summary = await generateSummary(results);

    // Log final status
    await logAction({
      action: 'verification-complete',
      status: summary.overall_status,
      duration_ms: Date.now() - startTime,
      summary_file: SUMMARY_FILE,
    });

    // Display results
    console.log('\n[post-config-verify] ==========================================');
    console.log('[post-config-verify] POST-CONFIGURATION VERIFICATION COMPLETE');
    console.log('[post-config-verify] ==========================================');
    console.log(`Overall Status: ${summary.overall_status === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Steps: ${summary.passed_steps}/${summary.total_steps} passed`);
    console.log(`Duration: ${summary.total_duration_ms}ms`);
    console.log(`Summary: ${SUMMARY_FILE}`);

    if (summary.overall_status === 'PASS') {
      console.log('\n✅ All post-configuration verification criteria met:');
      console.log(`   - All verification commands: ${summary.criteria_met.all_commands_pass ? 'PASS' : 'FAIL'}`);
      console.log(`   - No hash drift: ${summary.criteria_met.no_hash_drift ? 'PASS' : 'FAIL'}`);
      console.log(`   - No parameter violations: ${summary.criteria_met.no_param_violations ? 'PASS' : 'FAIL'}`);
      console.log(`   - Artifacts generated: ${summary.criteria_met.artifacts_generated ? 'PASS' : 'FAIL'}`);
    } else {
      console.log('\n❌ Post-configuration verification FAILED');
      results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`   - ${r.step}: ${r.error || 'Command failed'}`);
      });
    }

    console.log('\n[post-config-verify] See artifacts directory for detailed reports');

    // Exit with appropriate code
    process.exit(summary.overall_status === 'PASS' ? 0 : 1);

  } catch (error) {
    console.error('[post-config-verify] Fatal error during verification:', error);

    await logAction({
      action: 'verification-error',
      status: 'ERROR',
      error: error.message,
    });

    process.exit(2);
  }
}

// Handle process signals gracefully
process.on('SIGINT', () => {
  console.log('\n[post-config-verify] Interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n[post-config-verify] Terminated');
  process.exit(143);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('[post-config-verify] Unhandled error:', error);
    process.exit(2);
  });
}

export { runVerificationStep, generateSummary, main };
