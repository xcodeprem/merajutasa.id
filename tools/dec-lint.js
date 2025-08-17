#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'yaml';
import crypto from 'crypto';
import { stableStringify, addMetadata } from './lib/json-stable.js';

const DEC_DIR = 'docs/governance/dec';
const OUT = 'artifacts/dec-lint.json';
const REQUIRED_KEYS = ['id','title','date','class','status'];
const HASH_REQUIRED_STATUSES = new Set(['adopted','adopted-pending-hash']);

function sha256(t){ return crypto.createHash('sha256').update(t,'utf8').digest('hex'); }
async function list(){ try{ const all=await fs.readdir(DEC_DIR); return all.filter(f=>f.endsWith('.md')).sort(); }catch{ return []; } }
function fm(raw){ const m=/^---([\s\S]*?)---/m.exec(raw); if(!m) return {raw:null,block:null}; return {raw:m[1],block:m[0]}; }
function tabIssues(block){ if(!block) return []; return block.split(/\r?\n/).map((l,i)=>/\t/.test(l)?{line:i+1,excerpt:l.replace(/\t/g,'→')}:null).filter(Boolean); }
function checkOrder(front){ const lines=front.split(/\r?\n/).filter(l=>l.trim() && !l.trim().startsWith('#')); const seen=[]; for(const l of lines){ const m=/^([A-Za-z0-9_]+):/.exec(l.trim()); if(!m) continue; const k=m[1]; if(REQUIRED_KEYS.includes(k)) seen.push(k); if(seen.length===REQUIRED_KEYS.length) break; } const prefix=REQUIRED_KEYS.slice(0,seen.length); return { ok: JSON.stringify(seen)===JSON.stringify(prefix), seen }; }
function hashCheck(status, parsed){ const v=parsed.hash_of_decision_document; if(!HASH_REQUIRED_STATUSES.has(status)){ if(v==null) return null; } if(v==null) return {code:'DL4_HASH_FORMAT',detail:'hash_of_decision_document missing'}; if(!/^"?[0-9a-f]{64}"?$/.test(String(v)) && String(v)!=='<PENDING_HASH>' && String(v) !== '"<PENDING_HASH>"') return {code:'DL4_HASH_FORMAT',detail:`bad hash value ${v}`}; return null; }
async function lint(file){ const full=path.join(DEC_DIR,file); let raw=''; try{ raw=await fs.readFile(full,'utf8'); }catch{ return {file,violations:[{code:'DL5_PARSE_ERROR',message:'unreadable file'}],warnings:[],id:null,hash:null}; }
  const {raw:front,block}=fm(raw); const violations=[]; const warnings=[]; if(!front){ violations.push({code:'DL5_PARSE_ERROR',message:'missing front matter'}); return {file,violations,warnings,id:null,hash:sha256(raw)}; }
  tabIssues(block).forEach(t=>violations.push({code:'DL3_TAB_INDENT',line:t.line,excerpt:t.excerpt}));
  const normalized=front.replace(/\t/g,'  '); let parsed={}; let parseErr=null; try{ parsed=yaml.parse(normalized)||{}; }catch(e){ parseErr=e.code||e.message; violations.push({code:'DL5_PARSE_ERROR',message:parseErr}); }
  REQUIRED_KEYS.forEach(k=>{ if(parsed[k]==null) violations.push({code:'DL1_MISSING_KEY',key:k}); });
  if(!parseErr){ const ord=checkOrder(front); if(!ord.ok) violations.push({code:'DL2_ORDER_VIOLATION',seen:ord.seen}); }
  const status=String(parsed.status||'').trim(); const h=hashCheck(status,parsed); if(h) violations.push(h);
  if(parsed.class==='guidance' && /adopted|draft/.test(status)) warnings.push({code:'DL7_CLASS_STATUS_MISMATCH',detail:'guidance doc carries decision status'});
  return { file, id: parsed.id||null, hash: sha256(raw), violations, warnings };
}
async function main(){ await fs.mkdir('artifacts',{recursive:true}); const files=await list(); const results=await Promise.all(files.map(lint)); const idSet=new Map(); results.forEach(r=>{ if(r.id){ if(idSet.has(r.id)) r.violations.push({code:'DL6_DUPLICATE_ID',detail:`duplicate with ${idSet.get(r.id)}`}); else idSet.set(r.id,r.file); } }); const violations=results.flatMap(r=>r.violations.map(v=>({file:r.file,...v}))); const warnings=results.flatMap(r=>r.warnings.map(v=>({file:r.file,...v}))); const codeCounts = violations.reduce((a,v)=>{a[v.code]=(a[v.code]||0)+1;return a;},{}); const warningCounts = warnings.reduce((a,v)=>{a[v.code]=(a[v.code]||0)+1;return a;},{}); const summary={ files:results.length, violation_count:violations.length, warning_count:warnings.length, codes:codeCounts, warning_codes:warningCounts }; const resultWithMetadata = addMetadata({version:1,summary,results,violations,warnings}, { generator: 'dec-lint.js' }); await fs.writeFile(OUT, stableStringify(resultWithMetadata)); console.log(`[dec-lint] files=${results.length} violations=${violations.length} warnings=${warnings.length}`); if(violations.length) process.exit(30); }
main().catch(e=>{ console.error('dec-lint error',e); process.exit(2); });
