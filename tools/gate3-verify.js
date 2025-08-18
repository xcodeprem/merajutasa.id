#!/usr/bin/env node

// Gate 3 — Stage 2 Terminology Verification
// Check if Stage 2 requirements are met

import { spawn } from 'node:child_process';
import { readFile } from 'fs/promises';

async function runCommand(cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      env: { ...process.env, ...env },
      stdio: ['inherit', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => stdout += data.toString());
    proc.stderr.on('data', (data) => stderr += data.toString());
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}

async function checkDisclaimersUpdated() {
  console.log('[gate3-verify] Checking disclaimers updated...');
  try {
    // Check disclaimers-lint status
    const disclaimersLint = JSON.parse(await readFile('artifacts/disclaimers-lint.json', 'utf8'));
    const lintStatus = disclaimersLint.status === 'PASS';
    
    // Check D1 text reflects Stage 2 terminology
    const disclaimers = JSON.parse(await readFile('content/disclaimers/master.json', 'utf8'));
    const d1Text = disclaimers.disclaimers.find(d => d.id === 'D1')?.text || '';
    const d1HasStage2 = d1Text.includes('tanpa peringkat') || d1Text.includes('bukan ranking');
    
    // Check D6 text reflects Stage 2 terminology
    const d6Text = disclaimers.disclaimers.find(d => d.id === 'D6')?.text || '';
    const d6HasStage2 = d6Text.includes('Stage 2');
    
    return {
      status: lintStatus && d1HasStage2 && d6HasStage2 ? 'PASS' : 'FAIL',
      requirement: 'Disclaimers updated for Stage 2',
      details: {
        disclaimers_lint_status: disclaimersLint.status,
        d1_stage2_terminology: d1HasStage2,
        d6_stage2_terminology: d6HasStage2,
        errors_count: disclaimersLint.summary?.errors || 0
      }
    };
  } catch (error) {
    return {
      status: 'FAIL',
      requirement: 'Disclaimers updated for Stage 2',
      error: error.message
    };
  }
}

async function checkTerminologyAdoption() {
  console.log('[gate3-verify] Checking Stage 2 terminology adoption...');
  try {
    await runCommand('node', ['tools/terminology-adoption.js'], {
      ADOPTION_MIN: '70',
      BANNED_MAX: '0'
    });
    
    const adoption = JSON.parse(await readFile('artifacts/terminology-adoption.json', 'utf8'));
    const adoptionPercent = adoption.adoptionPercent;
    const oldTotal = adoption.old_total;
    
    console.log(`[gate3-verify]   Adoption: ${adoptionPercent}% (required: ≥70%)`);
    console.log(`[gate3-verify]   Banned terms: ${oldTotal} (required: 0)`);
    
    return {
      status: adoptionPercent >= 70 && oldTotal === 0 ? 'PASS' : 'FAIL',
      adoptionPercent,
      oldTotal,
      requirement: 'Stage 2 Terminology Adoption (≥70%, banned=0)'
    };
  } catch (error) {
    return {
      status: 'FAIL',
      error: error.message,
      requirement: 'Stage 2 Terminology Adoption (≥70%, banned=0)'
    };
  }
}

async function checkDECReference() {
  console.log('[gate3-verify] Checking DEC reference...');
  try {
    const decExists = await readFile('docs/governance/dec/DEC-20250817-09-stage2-terminology-transition.md', 'utf8');
    const hasStage2 = decExists.includes('Stage 2');
    
    return {
      status: hasStage2 ? 'PASS' : 'FAIL',
      requirement: 'DEC Stage 2 Transition present',
      details: hasStage2 ? 'DEC-20250817-09 exists and references Stage 2' : 'Missing Stage 2 reference'
    };
  } catch (error) {
    return {
      status: 'FAIL',
      requirement: 'DEC Stage 2 Transition present',
      error: error.message
    };
  }
}

async function checkTrendArtifacts() {
  console.log('[gate3-verify] Checking terminology trend artifacts...');
  try {
    await runCommand('node', ['tools/terminology-adoption-trend.js']);
    
    const trend = JSON.parse(await readFile('artifacts/terminology-adoption-trend.json', 'utf8'));
    const entriesCount = trend.history?.length || 0;
    
    return {
      status: entriesCount > 0 ? 'PASS' : 'FAIL',
      requirement: 'Terminology trend artifacts updated',
      details: `${entriesCount} trend entries`
    };
  } catch (error) {
    return {
      status: 'FAIL',
      requirement: 'Terminology trend artifacts updated',
      error: error.message
    };
  }
}

async function main() {
  console.log('[gate3-verify] Starting Gate 3 — Stage 2 Terminology verification...\n');
  
  const results = [];
  
  // Check Stage 2 requirements
  results.push(await checkTerminologyAdoption());
  results.push(await checkDECReference());
  results.push(await checkDisclaimersUpdated());
  results.push(await checkTrendArtifacts());
  
  console.log('\n[gate3-verify] Gate 3 Results:');
  
  let passCount = 0;
  for (const result of results) {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`  ${icon} ${result.requirement}: ${result.status}`);
    if (result.details) console.log(`     ${result.details}`);
    if (result.error) console.log(`     Error: ${result.error}`);
    if (result.status === 'PASS') passCount++;
  }
  
  const overallStatus = passCount === results.length ? 'PASS' : 'FAIL';
  console.log(`\n[gate3-verify] Gate 3 Status: ${overallStatus}`);
  console.log(`[gate3-verify] Requirements: ${passCount}/${results.length} PASSED`);
  
  if (overallStatus === 'PASS') {
    console.log('\n🎉 Gate 3 — Stage 2 Terminology PASSED - Ready for closure');
  } else {
    console.log(`\n❌ Gate 3 — Stage 2 Terminology FAILED - ${results.length - passCount} requirements need attention`);
  }
  
  process.exit(overallStatus === 'PASS' ? 0 : 1);
}

main().catch(console.error);
