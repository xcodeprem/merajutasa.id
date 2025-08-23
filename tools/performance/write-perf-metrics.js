#!/usr/bin/env node
/**
 * Aggregates perf artifacts into a single deterministic artifacts/perf-metrics.json
 * - Reads artifacts/perf-budget-report.json (if exists)
 * - Reads artifacts/frontend-performance/latest-frontend-performance-test.json (if exists)
 * - Emits artifacts/perf-metrics.json with simple PASS/FAIL based on budgets
 */
import { promises as fs } from 'fs';

async function readJSON(p) {
  try {
    return JSON.parse(await fs.readFile(p, 'utf8'));
  } catch {
    return null;
  }
}

function summarize(perfBudget) {
  if (!perfBudget) {return { status: 'UNKNOWN' };}
  const v = [];
  const actual = perfBudget.actual || {};
  const budgets = perfBudget.budgets || {};
  if (
    actual.perf_score != null &&
    budgets.perf_score_min != null &&
    actual.perf_score < budgets.perf_score_min
  )
  {v.push('PERF_SCORE');}
  if (
    actual.lcp_ms != null &&
    budgets.lcp_ms != null &&
    actual.lcp_ms > budgets.lcp_ms
  )
  {v.push('LCP');}
  if (
    actual.tbt_ms != null &&
    budgets.tbt_ms != null &&
    actual.tbt_ms > budgets.tbt_ms
  )
  {v.push('TBT');}
  if (
    actual.cls != null &&
    budgets.cls_max != null &&
    actual.cls > budgets.cls_max
  )
  {v.push('CLS');}
  return {
    status: v.length ? 'FAIL' : 'PASS',
    violations: v,
    actual,
    budgets,
  };
}

async function main() {
  await fs.mkdir('artifacts', { recursive: true });
  const perfBudget = await readJSON('artifacts/perf-budget-report.json');
  const latestLight = await readJSON(
    'artifacts/frontend-performance/latest-frontend-performance-test.json',
  );
  const out = {
    ts: new Date().toISOString(),
    budgets: summarize(perfBudget),
    lightweight: latestLight?.summary
      ? {
        overallGrade: latestLight.summary.overallGrade,
        status: latestLight.summary.status,
        api: {
          successRate: latestLight.api?.summary?.successRate,
          avgResponseTime: latestLight.api?.summary?.avgResponseTime,
        },
        ui: { responseTime: latestLight.ui?.responseTime },
      }
      : null,
  };
  await fs.writeFile(
    'artifacts/perf-metrics.json',
    JSON.stringify(out, null, 2),
  );
  console.log('[perf-metrics] wrote artifacts/perf-metrics.json');
}

main().catch((e) => {
  console.error('[perf-metrics] error', e);
  process.exit(1);
});
