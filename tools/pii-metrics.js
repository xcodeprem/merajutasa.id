#!/usr/bin/env node
/**
 * pii-metrics.js
 * Computes simple precision/recall for high-risk categories from docs/privacy/corpus.
 * Outputs artifacts/pii-metrics.json
 */
import { promises as fs } from 'fs';
import { spawnSync } from 'child_process';

const CORPUS_DIR = 'docs/privacy/corpus';
const REPORT_PATH = 'artifacts/pii-scan-report.json';
const OUT_PATH = 'artifacts/pii-metrics.json';
const HIGHRISK = new Set(['IDN_NIK','IDN_NKK','BANK_ACCOUNT','GOV_ID_DOC','CHILD_NAME_AGE','GEO_FINE']);

function parseExpectHeader(text){
  const m = text.match(/EXPECT:\s*([^\n]+)/i);
  if(!m) return new Set();
  return new Set(m[1].split(',').map(s=>s.trim()).filter(Boolean));
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  // Run scanner
  spawnSync(process.execPath, ['tools/pii-scan.js','--sarif'], { stdio:'inherit' });
  // Load scan findings
  const report = JSON.parse(await fs.readFile(REPORT_PATH,'utf8'));
  const findings = report.findings || [];
  // Load corpus expectations
  const files = await fs.readdir(CORPUS_DIR);
  const perFile = [];
  for (const f of files){
    const p = `${CORPUS_DIR}/${f}`;
    const content = await fs.readFile(p,'utf8');
    const expected = parseExpectHeader(content);
    const detected = new Set(findings.filter(x=>x.file.replace(/\\/g,'/')===p).map(x=>x.category||x.code));
    // Focus on high-risk categories for recall; precision across all
    const expectedHR = new Set([...expected].filter(c=>HIGHRISK.has(c)));
    const detectedHR = new Set([...detected].filter(c=>HIGHRISK.has(c)));
    const tp = [...detected].filter(c=>expected.has(c)).length;
    const fp = [...detected].filter(c=>!expected.has(c)).length;
    const fn = [...expected].filter(c=>!detected.has(c)).length;
    const tpHR = [...detectedHR].filter(c=>expectedHR.has(c)).length;
    const fpHR = [...detectedHR].filter(c=>!expectedHR.has(c)).length;
    const fnHR = [...expectedHR].filter(c=>!detectedHR.has(c)).length;
    perFile.push({ file:p, expected:[...expected], detected:[...detected], tp, fp, fn, tpHR, fpHR, fnHR });
  }
  const sum = (k)=>perFile.reduce((a,r)=>a+(r[k]||0),0);
  const tp = sum('tp'), fp = sum('fp'), fn = sum('fn');
  const tpHR = sum('tpHR'), fpHR = sum('fpHR'), fnHR = sum('fnHR');
  const precision = tp+fp? tp/(tp+fp):1;
  const recall = tp+fn? tp/(tp+fn):1;
  const precisionHR = tpHR+fpHR? tpHR/(tpHR+fpHR):1;
  const recallHR = tpHR+fnHR? tpHR/(tpHR+fnHR):1;
  const metrics = { version:1, files: perFile.length, precision, recall, precisionHR, recallHR, perFile };
  await fs.writeFile(OUT_PATH, JSON.stringify(metrics,null,2));
  console.log('[pii-metrics] precision=',precision.toFixed(3),'recall=',recall.toFixed(3),'HR_precision=',precisionHR.toFixed(3),'HR_recall=',recallHR.toFixed(3));
}
main().catch(e=>{ console.error('pii-metrics error', e); process.exit(2); });
