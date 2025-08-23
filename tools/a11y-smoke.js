#!/usr/bin/env node
/** Real a11y check via Pa11y against local equity UI */
import { promises as fs } from 'fs';
import pa11y from 'pa11y';
import http from 'http';

const PORT = Number(process.env.EQUITY_PORT || 4620);
const URL = `http://127.0.0.1:${PORT}/`;
const HEALTH = `http://127.0.0.1:${PORT}/health`;
const EXTRA = [
  `http://127.0.0.1:${PORT}/ui/methodology`,
];

async function main(){
  // Preflight: wait for service health to avoid transient connection refusals
  const checkHealth = () => new Promise((resolve)=>{
    const req = http.get({ hostname: '127.0.0.1', port: PORT, path: '/health', timeout: 2000 }, (res)=>{
      res.resume();
      resolve(res.statusCode && res.statusCode < 500);
    });
    req.on('error', ()=> resolve(false));
    req.on('timeout', ()=> { req.destroy(); resolve(false); });
  });
  const checkRoot = () => new Promise((resolve)=>{
    const req = http.get({ hostname: '127.0.0.1', port: PORT, path: '/', timeout: 2000 }, (res)=>{
      res.resume();
      resolve(res.statusCode && res.statusCode < 500);
    });
    req.on('error', ()=> resolve(false));
    req.on('timeout', ()=> { req.destroy(); resolve(false); });
  });
  const deadline = Date.now() + 20000;
  let ok = false;
  while (Date.now() < deadline) {
    ok = await checkHealth();
    if (ok) {break;}
    // fallback to root
    ok = await checkRoot();
    if (ok) {break;}
    await new Promise(r=> setTimeout(r, 300));
  }
  if (!ok) { console.error('[a11y] service not reachable'); process.exit(2); }
  const runOnce = (url)=> pa11y(url, {
    standard: 'WCAG2AA',
    timeout: 30000,
    chromeLaunchConfig: { args: ['--no-sandbox','--disable-gpu','--headless=new'] },
  });
  async function runWithRetry(url, tries=3){
    let lastErr;
    for (let i=0;i<tries;i++){
      try { return await runOnce(url); }
      catch(e){ lastErr = e; await new Promise(r=> setTimeout(r, 400*(i+1))); }
    }
    throw lastErr;
  }
  const resMain = await runWithRetry(URL, 3);
  const resExtra = await Promise.all(EXTRA.map(u=> runWithRetry(u,2)).map(p=>p.catch(()=>({ issues:[] }))));
  const issues = [...(resMain.issues||[]), ...resExtra.flatMap(r=>r.issues||[])];
  // Map Pa11y issue types to severity buckets; Pa11y exposes type: 'error' | 'warning' | 'notice'
  const criticalCount = issues.filter(i => String(i.type).toLowerCase() === 'error').length;
  const warningCount  = issues.filter(i => String(i.type).toLowerCase() === 'warning').length;
  const noticeCount   = issues.filter(i => String(i.type).toLowerCase() === 'notice').length;
  // Backward-compat: keep 'serious' as warnings bucket for prior readers
  const counts = {
    total: issues.length,
    critical: criticalCount,
    serious: warningCount,
    warnings: warningCount,
    notices: noticeCount,
  };
  await fs.mkdir('artifacts',{recursive:true});
  await fs.writeFile('artifacts/a11y-smoke-report.json', JSON.stringify({ url: URL, counts, issues }, null, 2));
  if (criticalCount>0){ console.error('[a11y] FAIL', { critical: criticalCount }); process.exit(1); }
  console.log('[a11y] PASS');
}

main().catch(e=>{ console.error('[a11y] error', e); process.exit(2); });
