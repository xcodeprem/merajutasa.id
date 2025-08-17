#!/usr/bin/env node
/**
 * changelog-presence-check.js (Gate 2 - H2-J1)
 * Checks for changelog route presence - non-blocking if empty, but route presence enforced
 */
import { promises as fs } from 'fs';

async function main() {
  await fs.mkdir('artifacts', { recursive: true });
  
  const checks = [];
  
  // Check 1: Changelog excerpt draft exists
  try {
    const draft = await fs.readFile('artifacts/changelog-excerpt-draft.md', 'utf8');
    checks.push({
      check: 'changelog_draft_exists',
      status: 'PASS',
      size: draft.length,
      content_preview: draft.substring(0, 100) + (draft.length > 100 ? '...' : '')
    });
  } catch {
    checks.push({
      check: 'changelog_draft_exists',
      status: 'FAIL',
      error: 'changelog-excerpt-draft.md not found'
    });
  }
  
  // Check 2: Changelog JSON exists
  try {
    const json = await fs.readFile('artifacts/changelog-excerpt.json', 'utf8');
    const parsed = JSON.parse(json);
    checks.push({
      check: 'changelog_json_exists',
      status: 'PASS',
      data: parsed
    });
  } catch {
    checks.push({
      check: 'changelog_json_exists',
      status: 'FAIL',
      error: 'changelog-excerpt.json not found or invalid'
    });
  }
  
  // Check 3: Generator script exists and is executable
  try {
    await fs.access('tools/changelog-excerpt-generate.js');
    checks.push({
      check: 'changelog_generator_exists',
      status: 'PASS'
    });
  } catch {
    checks.push({
      check: 'changelog_generator_exists',
      status: 'FAIL',
      error: 'changelog generator script not found'
    });
  }
  
  // Check 4: Pages workflow includes changelog route
  try {
    const workflow = await fs.readFile('.github/workflows/pages.yml', 'utf8');
    const hasChangelogRoute = workflow.includes('changelog.html') || workflow.includes('/changelog');
    checks.push({
      check: 'pages_workflow_includes_changelog',
      status: hasChangelogRoute ? 'PASS' : 'FAIL',
      details: hasChangelogRoute ? 'changelog route found in pages workflow' : 'changelog route not found'
    });
  } catch {
    checks.push({
      check: 'pages_workflow_includes_changelog',
      status: 'FAIL',
      error: 'pages workflow not accessible'
    });
  }
  
  // Check 5: Built artifact exists (strengthens presence verification)
  try {
    await fs.access('dist/changelog.html');
    checks.push({
      check: 'changelog_built_artifact_exists',
      status: 'PASS',
      details: 'built changelog.html found in dist/'
    });
  } catch {
    checks.push({
      check: 'changelog_built_artifact_exists',
      status: 'ADVISORY',
      details: 'built artifact not found (acceptable if pages not yet built)'
    });
  }
  
  const report = {
    version: '1.0.0',
    generated_utc: new Date().toISOString(),
    checks,
    summary: {
      total: checks.length,
      passed: checks.filter(c => c.status === 'PASS').length,
      failed: checks.filter(c => c.status === 'FAIL').length
    }
  };
  
  await fs.writeFile('artifacts/changelog-presence-check.json', JSON.stringify(report, null, 2));
  
  const criticalFails = checks.filter(c => 
    c.status === 'FAIL' && 
    (c.check === 'changelog_generator_exists' || c.check === 'pages_workflow_includes_changelog')
  );
  
  if (criticalFails.length > 0) {
    console.error('[changelog-presence] CRITICAL FAIL:', criticalFails.map(c => c.check).join(', '));
    process.exit(1);
  }
  
  const nonCriticalFails = checks.filter(c => 
    (c.status === 'FAIL' || c.status === 'ADVISORY') && !criticalFails.includes(c)
  );
  if (nonCriticalFails.length > 0) {
    const advisoryItems = nonCriticalFails.filter(c => c.status === 'ADVISORY');
    const failItems = nonCriticalFails.filter(c => c.status === 'FAIL');
    
    if (advisoryItems.length > 0) {
      console.warn('[changelog-presence] ADVISORY:', advisoryItems.map(c => c.check).join(', '), '(non-blocking)');
    }
    if (failItems.length > 0) {
      console.warn('[changelog-presence] NON-CRITICAL FAIL:', failItems.map(c => c.check).join(', '), '(non-blocking)');
    }
  }
  
  console.log(`[changelog-presence] PASS (${report.summary.passed}/${report.summary.total} checks passed)`);
}

main().catch(e => {
  console.error('[changelog-presence] error', e);
  process.exit(2);
});