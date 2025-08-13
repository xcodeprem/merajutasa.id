#!/usr/bin/env node
/**
 * fairness-engine-unit-tests.js
 * Minimal Wave 1 scaffold executing core decide() over UT1–UT3 sequences.
 * UT4–UT6 pending STALLED & cooldown nuanced logic coverage (will report PENDING).
 */
import { promises as fs } from 'fs';
import yaml from 'yaml';
import { decide } from '../fairness/engine-core.js';

const CONFIG_PATH = 'docs/fairness/hysteresis-config-v1.yml';

async function loadParams(){
  const raw = await fs.readFile(CONFIG_PATH,'utf8');
  return yaml.parse(raw).parameters;
}

function runSequence(params, seq){
  let st=null; const events=[]; seq.forEach((r,i)=>{ const res = decide(params, st, r); st={...res,lastRatio:r}; if(res.events.length) res.events.forEach(ev=>events.push({idx:i,ratio:r,...ev})); });
  return { final: st?.state||'NONE', events };
}

function assert(cond, msg){ if(!cond) throw new Error(msg); }

async function main(){
  const p = await loadParams();
  const results=[];
  // UT1 Severe immediate
  try {
    const seq=[0.47,0.53,0.66];
    const r=runSequence(p,seq);
    const enter=r.events.find(e=>e.type==='ENTER');
    assert(enter && enter.reason==='severe','UT1 expected severe ENTER');
    const exit=r.events.find(e=>e.type==='EXIT');
    assert(exit,'UT1 expected EXIT event');
    results.push({id:'UT1',status:'PASS'});
  } catch(e){ results.push({id:'UT1',status:'FAIL',error:e.message}); }
  // UT2 Borderline consecutive
  try {
    const seq=[0.58,0.59,0.61,0.66];
    const r=runSequence(p,seq);
    const enter=r.events.find(e=>e.type==='ENTER');
    assert(enter && enter.reason==='consecutive','UT2 expected consecutive ENTER');
    const exit=r.events.find(e=>e.type==='EXIT');
    assert(exit,'UT2 expected EXIT');
    results.push({id:'UT2',status:'PASS'});
  } catch(e){ results.push({id:'UT2',status:'FAIL',error:e.message}); }
  // UT3 False start borderline
  try {
    const seq=[0.58,0.61];
    const r=runSequence(p,seq);
    const enter=r.events.find(e=>e.type==='ENTER');
    assert(!enter,'UT3 should not ENTER');
    results.push({id:'UT3',status:'PASS'});
  } catch(e){ results.push({id:'UT3',status:'FAIL',error:e.message}); }
  // UT4 Stall detection (remain in ACTIVE then transition to STALLED after stalled_window_snapshots inside band)
  try {
    const window = p.stalled_window_snapshots;
    // Start with severe trigger then ratios inside stall band but below exit
    const seq = [p.T_enter_major - 0.01];
    // push window stall band ratios mid-band
    for (let i=0;i<window;i++) seq.push((p.stalled_min_ratio + p.stalled_max_ratio_below_exit)/2);
    const r = runSequence(p, seq);
    const stallEvt = r.events.find(e=>e.type==='STALL');
    assert(stallEvt, 'UT4 expected STALL event');
    assert(r.final==='STALLED','UT4 final state STALLED');
    results.push({id:'UT4',status:'PASS'});
  } catch(e){ results.push({id:'UT4',status:'FAIL',error:e.message}); }
  // UT5 Stall break without exit (ratio drops further severe -> ACTIVE with STALL_BREAK severe)
  try {
    const window = p.stalled_window_snapshots;
    const bandRatio = (p.stalled_min_ratio + p.stalled_max_ratio_below_exit)/2;
    const seq = [p.T_enter_major - 0.01];
    for (let i=0;i<window;i++) seq.push(bandRatio);
    // now break stall by going deeper severe (still below exit)
    seq.push(p.T_enter_major - 0.02);
    const r = runSequence(p, seq);
    const breakEvt = r.events.find(e=>e.type==='STALL_BREAK');
    assert(breakEvt && breakEvt.reason==='severe','UT5 expected STALL_BREAK severe');
    assert(r.final==='ACTIVE','UT5 final ACTIVE after stall break');
    results.push({id:'UT5',status:'PASS'});
  } catch(e){ results.push({id:'UT5',status:'FAIL',error:e.message}); }
  // UT6 Exit from STALLED (ratio >= T_exit) and cooldown prevents immediate CANDIDATE
  try {
    const window = p.stalled_window_snapshots;
    const bandRatio = (p.stalled_min_ratio + p.stalled_max_ratio_below_exit)/2;
    const seq = [p.T_enter_major - 0.01];
    for (let i=0;i<window;i++) seq.push(bandRatio);
    // now exit by going above T_exit
    seq.push(p.T_exit + 0.01);
    // then borderline ratio which should NOT create CANDIDATE due to cooldown
    seq.push((p.T_enter_standard + p.T_enter_major)/2);
    const r = runSequence(p, seq);
    const exitEvt = r.events.find(e=>e.type==='EXIT');
    assert(exitEvt,'UT6 expected EXIT');
    assert(r.final==='CLEARED','UT6 should remain CLEARED (cooldown)');
    results.push({id:'UT6',status:'PASS'});
  } catch(e){ results.push({id:'UT6',status:'FAIL',error:e.message}); }
  const summary={ total:results.length, pass:results.filter(r=>r.status==='PASS').length, fail:results.filter(r=>r.status==='FAIL').length, pending:results.filter(r=>r.status==='PENDING').length };
  const report={ version:1, generated_utc:new Date().toISOString(), summary, results };
  await fs.mkdir('artifacts',{recursive:true});
  await fs.writeFile('artifacts/fairness-engine-unit-tests.json', JSON.stringify(report,null,2));
  if(summary.fail>0){ console.error('[fairness-unit-tests] FAIL'); process.exit(1); }
  console.log('[fairness-unit-tests] PASS', JSON.stringify(summary));
}
main().catch(e=>{ console.error('fairness-unit-tests error', e); process.exit(2); });
