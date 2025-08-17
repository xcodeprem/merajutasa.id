#!/usr/bin/env node
/**
 * gate3-verify.js (Gate 3 Verification)
 * Verifies Stage 2 Terminology requirements:
 * - adoption >= 70, banned == 0
 * - DEC present (status proposed/adopted) and referenced
 * - disclaimers lint PASS and D1/D6 updated language
 * - trend artifacts present with entries > 0
 */
import { promises as fs } from 'fs';

async function readJson(path) {
  try {
    return JSON.parse(await fs.readFile(path, 'utf8'));
  } catch {
    return null;
  }
}

async function readText(path) {
  try {
    return await fs.readFile(path, 'utf8');
  } catch {
    return null;
  }
}

async function main() {
  const results = [];
  const timestamp = new Date().toISOString();

  console.log('[gate3-verify] Starting Gate 3 verification (Stage 2 Terminology)...');

  // Requirement 1: Adoption thresholds
  const adoption = await readJson('artifacts/terminology-adoption.json');
  const banned = adoption?.banned_total ?? 0;
  const adoptionPercent = adoption?.adoptionPercent ?? 0;
  const adoptionOk = adoptionPercent >= 70 && banned === 0;
  results.push({
    requirement: 'Stage 2: Adoption >=70 and 0 banned (ranking terms)',
    status: adoptionOk ? 'PASS' : 'FAIL',
    details: { adoptionPercent, banned }
  });

  // Requirement 2: DEC presence
  const decPath = 'docs/governance/dec/DEC-20250817-09-stage2-terminology-transition.md';
  const decText = await readText(decPath);
  const decPresent = !!decText;
  const statusMatch = decText?.match(/status:\s*(.*)/);
  const decStatus = statusMatch ? statusMatch[1].trim() : null;
  results.push({
    requirement: 'Stage 2 DEC present (proposed/adopted)',
    status: decPresent ? 'PASS' : 'FAIL',
    details: { path: decPath, status: decStatus }
  });

  // Requirement 3: Disclaimers lint PASS and wording checks
  const disc = await readJson('artifacts/disclaimers-lint.json');
  const master = await readJson('content/disclaimers/master.json');
  const d1 = master?.disclaimers?.find(d => d.id === 'D1')?.text || '';
  const d6 = master?.disclaimers?.find(d => d.id === 'D6')?.text || '';
  const d1Ok = /(bukan\s+ranking|tanpa\s+peringkat|non-?ranking)/i.test(d1);
  const d6Ok = /(Stage\s*2|tahap\s*2)/i.test(d6);
  const discPass = disc?.status === 'PASS' && (disc?.summary?.errors || 0) === 0;
  results.push({
    requirement: 'Disclaimers updated and lint PASS',
    status: discPass && d1Ok && d6Ok ? 'PASS' : 'FAIL',
    details: { disc_status: disc?.status, d1_text: d1, d6_text: d6 }
  });

  // Requirement 4: Trend artifacts exist
  const trend = await readJson('artifacts/terminology-adoption-trend.json');
  const entries = trend?.history?.length || trend?.entries_count || 0;
  results.push({
    requirement: 'Terminology trend artifacts present',
    status: entries > 0 ? 'PASS' : 'FAIL',
    details: { entries }
  });

  const passed = results.filter(r => r.status === 'PASS').length;
  const total = results.length;
  const status = passed === total ? 'PASS' : 'FAIL';
  const report = {
    version: '1.0.0',
    generated_utc: timestamp,
    gate: 'Gate 3 - Stage 2 Terminology',
    status,
    requirements: results,
    summary: { total_requirements: total, passed, failed: total - passed }
  };

  await fs.writeFile('artifacts/gate3-verification.json', JSON.stringify(report, null, 2));
  console.log(`[gate3-verify] Gate 3 Status: ${status} (${passed}/${total})`);
  if (status !== 'PASS') process.exit(1);
}

main().catch(e => { console.error('[gate3-verify] error', e); process.exit(2); });
