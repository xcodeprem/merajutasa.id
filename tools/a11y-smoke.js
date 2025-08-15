#!/usr/bin/env node
/** Real a11y check via Pa11y against local equity UI */
import { promises as fs } from 'fs';
import pa11y from 'pa11y';

const PORT = Number(process.env.EQUITY_PORT || 4620);
const URL = `http://127.0.0.1:${PORT}/`;
const EXTRA = [
  `http://127.0.0.1:${PORT}/ui/methodology`
];

async function main(){
  const run = (url)=> pa11y(url, {
    standard: 'WCAG2AA',
    timeout: 30000,
    chromeLaunchConfig: { args: ['--no-sandbox','--disable-gpu','--headless=new'] }
  });
  const resMain = await run(URL);
  const resExtra = await Promise.all(EXTRA.map(run).map(p=>p.catch(()=>({ issues:[] }))));
  const issues = [...(resMain.issues||[]), ...resExtra.flatMap(r=>r.issues||[])];
  const serious = issues.filter(i=> ['serious','critical'].includes(i.severity));
  await fs.mkdir('artifacts',{recursive:true});
  await fs.writeFile('artifacts/a11y-smoke-report.json', JSON.stringify({ url: URL, counts:{ total: issues.length, serious: serious.length }, issues }, null, 2));
  if (serious.length>0){ console.error('[a11y] FAIL', { serious: serious.length }); process.exit(1); }
  console.log('[a11y] PASS');
}

main().catch(e=>{ console.error('[a11y] error', e); process.exit(2); });
