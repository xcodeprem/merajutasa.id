#!/usr/bin/env node
/** Real perf check via Lighthouse against local equity UI */
import { promises as fs } from 'fs';
import lighthouse from 'lighthouse';
import { launch as launchChrome } from 'chrome-launcher';

const PORT = Number(process.env.EQUITY_PORT || 4620);
const URL = `http://127.0.0.1:${PORT}/`;
const BUDGETS = { perf_score_min: 0.6, lcp_ms: 2500, tbt_ms: 300, cls_max: 0.8 };

async function runLighthouse(url){
  const chrome = await launchChrome({ chromeFlags: ['--headless=new','--no-sandbox','--disable-gpu'] });
  const options = { logLevel: 'error', output: 'json', onlyCategories: ['performance','seo','best-practices'], port: chrome.port };
  try {
    const runnerResult = await lighthouse(url, options);
    return { chrome, runnerResult };
  } catch (e){
    await chrome.kill(); throw e;
  }
}

async function main(){
  const { chrome, runnerResult } = await runLighthouse(URL);
  const lhr = runnerResult.lhr;
  const audits = lhr.audits || {};
  const actual = {
    perf_score: lhr.categories?.performance?.score ?? 0,
    lcp_ms: audits['largest-contentful-paint']?.numericValue ?? null,
    tbt_ms: audits['total-blocking-time']?.numericValue ?? null,
    cls: audits['cumulative-layout-shift']?.numericValue ?? null
  };
  const violations = [];
  if (actual.perf_score < BUDGETS.perf_score_min) violations.push({ code:'PERF_SCORE', actual: actual.perf_score, budget: BUDGETS.perf_score_min });
  if (actual.lcp_ms != null && actual.lcp_ms > BUDGETS.lcp_ms) violations.push({ code:'LCP', actual: actual.lcp_ms, budget:BUDGETS.lcp_ms });
  if (actual.tbt_ms != null && actual.tbt_ms > BUDGETS.tbt_ms) violations.push({ code:'TBT', actual: actual.tbt_ms, budget:BUDGETS.tbt_ms });
  if (actual.cls != null && actual.cls > BUDGETS.cls_max) violations.push({ code:'CLS', actual: actual.cls, budget:BUDGETS.cls_max });
  await fs.mkdir('artifacts',{recursive:true});
  await fs.writeFile('artifacts/perf-budget-report.json', JSON.stringify({ url: URL, budgets: BUDGETS, actual, categories: lhr.categories }, null, 2));
  await chrome.kill();
  if (violations.length){ console.error('[perf-budget] FAIL', violations); process.exit(1); }
  console.log('[perf-budget] PASS');
}

main().catch(e=>{ console.error('[perf-budget] error', e); process.exit(2); });
