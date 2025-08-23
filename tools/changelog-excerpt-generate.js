#!/usr/bin/env node
/**
 * changelog-excerpt-generate.js
 * Generates a transparency changelog excerpt draft from recent artifacts.
 * Outputs to artifacts/changelog-excerpt-draft.md and artifacts/changelog-excerpt.json
 */
import { promises as fs } from 'fs';

async function safeJson(p){ try { return JSON.parse(await fs.readFile(p,'utf8')); } catch { return null; } }

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const [specHash, principles, pii, disclaimers, fairnessSim] = await Promise.all([
    safeJson('artifacts/spec-hash-diff.json'),
    safeJson('artifacts/principles-impact-report.json'),
    safeJson('artifacts/pii-scan-report.json'),
    safeJson('artifacts/disclaimers-lint.json'),
    safeJson('artifacts/fairness-sim-report.json'),
  ]);
  const [terms, trend] = await Promise.all([
    safeJson('artifacts/terminology-adoption.json'),
    safeJson('artifacts/terminology-adoption-trend.json'),
  ]);
  const summary = {
    ts: new Date().toISOString(),
    files_changed: specHash?.summary?.changed ?? 0,
    dec_impacts: principles?.summary?.impacted_principles ?? [],
    pii_high_risk_hits: pii?.summary?.highRiskHits ?? 0,
    disclaimers_status: disclaimers?.status ?? 'unknown',
    fairness_scenarios: fairnessSim?.summary?.total ?? fairnessSim?.scenarios?.length ?? 0,
    stage2_terminology: terms ? {
      dec_ref: 'DEC-20250817-09',
      adoption_percent: terms.adoptionPercent,
      suggestions_count: Array.isArray(terms.suggestions) ? terms.suggestions.length : 0,
      trend_entries: trend?.entries_count ?? 0,
    } : null,
  };
  const lines = [
    '# Transparency – Changelog Excerpt (Draft)',
    '',
    `Time: ${summary.ts}`,
    '',
    `- Spec hash changes: ${summary.files_changed}`,
    `- Principles impacted: ${Array.isArray(summary.dec_impacts)? summary.dec_impacts.join(', ') : 'n/a'}`,
    `- PII high-risk hits: ${summary.pii_high_risk_hits}`,
    `- Disclaimers lint status: ${summary.disclaimers_status}`,
    `- Fairness scenarios covered: ${summary.fairness_scenarios}`,
    '',
    '## Stage 2 Terminology Transition',
    '',
    terms ? `- DEC: DEC-20250817-09 — adoption ${terms.adoptionPercent}% (suggestions: ${(terms.suggestions||[]).length}, trend entries: ${trend?.entries_count ?? 0})` : '- DEC: DEC-20250817-09 — adoption n/a',
    'This is an automatically generated draft. See artifacts JSON for details.',
  ];
  await fs.writeFile('artifacts/changelog-excerpt-draft.md', lines.join('\n'));
  await fs.writeFile('artifacts/changelog-excerpt.json', JSON.stringify(summary,null,2));
}

main().catch(e=>{ console.error('[changelog-excerpt-generate] error', e); process.exit(2); });
