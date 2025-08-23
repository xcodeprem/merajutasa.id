#!/usr/bin/env node
/**
 * agent-trend-summary.js
 * Aggregates per-day agent action logs (agent-action-log-YYYYMMDD.json) into a trend summary.
 * Output: artifacts/agent-trend-summary.json
 */
import { promises as fs } from 'fs';
import path from 'path';

async function safeRead(p){ try { return JSON.parse(await fs.readFile(p,'utf8')); } catch { return null; } }

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const files = (await fs.readdir('artifacts')).filter(f=>/^agent-action-log-\d{8}\.json$/.test(f));
  const days = [];
  for (const f of files){
    const day = f.match(/(\d{8})/)[1];
    const arr = await safeRead(path.join('artifacts',f)) || [];
    const counts = arr.reduce((acc,e)=>{ acc.total++; acc[e.status]=(acc[e.status]||0)+1; return acc; }, { total:0 });
    days.push({ day, actions: counts, steps: [...new Set(arr.filter(a=>a.action==='step').map(a=>a.step))] });
  }
  days.sort((a,b)=>a.day.localeCompare(b.day));
  const aggregate = {
    generated_utc: new Date().toISOString(),
    days,
    totals: days.reduce((acc,d)=>{ acc.total += d.actions.total||0; acc.OK += d.actions.OK||0; acc.ADVISORY += d.actions.ADVISORY||0; acc.ERROR += d.actions.ERROR||0; return acc; }, { total:0, OK:0, ADVISORY:0, ERROR:0 }),
  };
  await fs.writeFile('artifacts/agent-trend-summary.json', JSON.stringify(aggregate,null,2));
  console.log('[agent-trend-summary] Wrote artifacts/agent-trend-summary.json');
}
main().catch(e=>{ console.error('agent-trend-summary error', e); process.exit(2); });
