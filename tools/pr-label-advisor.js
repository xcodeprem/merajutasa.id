#!/usr/bin/env node
/**
 * pr-label-advisor.js
 * Reads governance artifacts and recommends PR labels (written to artifacts/pr-label-recommendations.json).
 * This does NOT apply labels (no GitHub API), only suggests.
 */
import { promises as fs } from 'fs';

async function safe(p){ try { return JSON.parse(await fs.readFile(p,'utf8')); } catch { return null; } }

function add(set,label){ if(label) set.add(label); }

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const spec = await safe('artifacts/spec-hash-diff.json');
  const hype = await safe('artifacts/hype-lint.json');
  const disc = await safe('artifacts/disclaimers-lint.json');
  const freshness = await safe('artifacts/evidence-freshness-report.json');
  const param = await safe('artifacts/param-integrity-matrix.json');
  const set = new Set();

  if(spec){
    if(spec.violations && spec.violations.length>0) add(set,'integrity:hash-violation'); else add(set,'integrity:clean');
  }
  if(hype){
    if(hype.max_severity==='HIGH') add(set,'advisory:hype');
    if((hype.severity_counts?.HIGH||0)===0) add(set,'hype:contained');
  }
  if(disc){
    if(disc.status==='ERROR') add(set,'advisory:disclaimers'); else add(set,'disclaimers:clean');
  }
  if(freshness){
    const stale = freshness.summary?.stale||0;
    const missing = freshness.summary?.missing||0;
    if(stale>0) add(set,'evidence:stale');
    if(missing>0) add(set,'evidence:missing');
    if(stale===0 && missing===0) add(set,'evidence:fresh');
  }
  if(param){
    if((param.mismatches||0)>0) add(set,'params:drift'); else add(set,'params:aligned');
  }

  const labels = [...set];
  const rec = { generated_utc: new Date().toISOString(), labels };
  await fs.writeFile('artifacts/pr-label-recommendations.json', JSON.stringify(rec,null,2));
  console.log('[pr-label-advisor] Recommended labels:', labels.join(', '));
}

main().catch(e=>{ console.error('pr-label-advisor error', e); process.exit(2); });
