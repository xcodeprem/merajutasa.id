/**
 * disclaimers-lint (heuristic v2.1 config externalized + additional rule scaffolds + SARIF output)
 * Loads master + bindings + config (YAML), performs presence (optionally downgraded), drift, shadow copy,
 * banned phrase proximity, duplication, scope, version mismatch, locale preflight.
 * HTML / ordering / interactive wrap checks are stubbed until real HTML assets exist.
 * Output: artifacts/disclaimers-lint.json (+ optional SARIF if --sarif)
 */
import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';
import yamlPkg from 'yaml';
const { load: yamlLoad } = yamlPkg;
import { sha256, tokenize, overlapCoefficient } from './lib/disclaimers-util.js';

const MASTER_PATH = 'content/disclaimers/master.json';
const BINDINGS_PATH = 'content/disclaimers/bindings.json';
const CONFIG_PATH = 'content/disclaimers/config.yml';

function parseCLI(){
  const args = process.argv.slice(2);
  return {
    sarif: args.includes('--sarif'),
    debug: args.includes('--debug')
  };
}
async function safeReadJSON(p){ try { return JSON.parse(await fs.readFile(p,'utf8')); } catch { return null; } }
async function safeReadText(p){ try { return await fs.readFile(p,'utf8'); } catch { return null; } }
async function loadConfig(){
  const raw = await safeReadText(CONFIG_PATH);
  if(!raw) return {};
  try { return yamlLoad(raw) || {}; } catch { return {}; }
}
async function collectCandidatePages(){ const files = await glob('README.md'); const more = await glob('docs/**/*.md'); return [...files,...more]; }
// Improved page/component name inference (reduces false duplicate aggregation into 'landing').
// Uses full relative path (lowercased) and filename heuristics. Order is important (more specific first).
function mapPageName(file){
  const lower = file.toLowerCase();
  const base = path.basename(lower);
  if(lower.includes('equity-under') || lower.includes('under_served')) return 'equity_under_served_section';
  if(base.includes('equity')) return 'equity';
  if(lower.includes('trust') && lower.includes('hysteresis')) return 'trust_hysteresis';
  if(base.includes('trust')) return 'trust';
  if(lower.includes('terminology') && lower.includes('banner')) return 'terminology_banner';
  if(base.includes('terminology')) return 'terminology';
  if(lower.includes('api') && lower.includes('verification')) return 'api_verification_docs';
  if(lower.includes('hash-excerpt') || lower.includes('hash_excerpt')) return 'hash_excerpt_module';
  if(base.includes('changelog')) return 'changelog_excerpt';
  if(lower.includes('media-digest') || lower.includes('media_digest')) return 'media_digest';
  if(base.includes('faq')) return 'about_faq_data';
  if(base.includes('credential')) return 'credential_viewer';
  if(lower.includes('feedback')) return 'feedback';
  if(lower.includes('governance')) return 'governance';
  return 'landing';
}

async function main(){
  const cli = parseCLI();
  await fs.mkdir('artifacts',{recursive:true});
  const master = await safeReadJSON(MASTER_PATH);
  const bindings = await safeReadJSON(BINDINGS_PATH);
  const cfg = await loadConfig();
  if(!master || !bindings){
    await fs.writeFile('artifacts/disclaimers-lint.json', JSON.stringify({status:'ERROR', error:'MASTER_OR_BINDINGS_MISSING'},null,2));
    process.exit(1);
  }
  const canonicalArray = master.disclaimers||[]; const canonicalMap = Object.fromEntries(canonicalArray.map(d=>[d.id,d.text]));
  const computedHash = sha256(JSON.stringify(canonicalArray));
  const versionMismatch = master.hash && master.hash !== '<PENDING_COMPUTE>' && master.hash !== computedHash;
  const candidateFiles = await collectCandidatePages();
  const rawExtracted = []; // capture ALL occurrences for duplication & ordering analysis
  const idPattern = /D[1-7]/;
  const MIN_TOKENS_LINE = 5;
  const MIN_SIM = cfg.min_similarity ?? 0.90;
  const NOISE_SIM = cfg.noise_similarity ?? 0.15;
  const BANNED_RE = new RegExp(cfg.banned_phrase_pattern || '(terbaik|paling unggul|peringkat|ranking|top\\s?\\d+|juara|skor kinerja|nilai kinerja|pemenang)','i');
  const seenLinePerPageIdFile = new Set();
  for(const f of candidateFiles){
    if(/disclaimers-lint-spec-v1\.md$/i.test(f)) continue; // skip reference spec from extraction noise
    let txt; try{ txt = await fs.readFile(f,'utf8'); } catch { continue; }
    txt.split(/\r?\n/).forEach(line=>{
      const trimmed = line.trim();
      if(!trimmed) return;
      // Skip markdown table rows to reduce duplicate noise from reference tables
      if(trimmed.startsWith('|')) return;
      const tokens = tokenize(trimmed);
      if(tokens.length < MIN_TOKENS_LINE) return; // ignore very short lines (noise)
      const idMatch = line.match(idPattern);
    Object.entries(canonicalMap).forEach(([id,text])=>{
        if(trimmed.includes(text.slice(0,20)) || (idMatch && trimmed.includes(id))){
          // Improve similarity accuracy: if HTML tag with data-disclaimer-id present, strip tags for similarity purposes
          let normalized = trimmed;
          if(/data-disclaimer-id=/.test(trimmed)){
            normalized = trimmed.replace(/<[^>]+>/g,'').trim();
          }
      const pageName = mapPageName(f);
      const dupeKey = pageName+'|'+id+'|'+f;
      if(seenLinePerPageIdFile.has(dupeKey)) return; // suppress further duplicates in same file
      seenLinePerPageIdFile.add(dupeKey);
      rawExtracted.push({ page: pageName, id, text: normalized, sourceFile: f, orderIndex: rawExtracted.length });
        }
      });
    });
  }
  // Deduplicate by page+id keeping the line with highest similarity (best representation)
  const bestPerKey = new Map();
  rawExtracted.forEach(e=>{
    const canon = canonicalMap[e.id]; if(!canon) return;
    const sim = overlapCoefficient(tokenize(canon), tokenize(e.text));
    const key = e.page+':'+e.id;
    const prev = bestPerKey.get(key);
    if(!prev || sim > prev.sim) bestPerKey.set(key, { ...e, sim });
  });
  const extracted = [...bestPerKey.values()];
  const errors=[]; const warnings=[]; const metrics={missingIds:0, drift:0, shadow:0, bannedNear:0, duplicates:0, scope:0, locale:0};
  // Presence
  const pageBindingMap = new Map(bindings.pages.map(p=>[p.page,p]));
  bindings.pages.forEach(p=>{ const present=new Set(extracted.filter(e=>e.page===p.page).map(e=>e.id)); const missing=(p.ids||[]).filter(r=>!present.has(r)); if(missing.length){ const issue={code:'DISC-PRES-001', page:p.page, missing}; metrics.missingIds+=missing.length; if(cfg.presence_enforcement===false){ warnings.push({...issue, severity:'WARNING', note:'Presence enforcement disabled (bootstrap phase)'});} else { errors.push({...issue, severity:'ERROR'});} }});
  // Drift (only if some similarity >0 but < threshold)
  extracted.forEach(e=>{ if(e.sim === undefined) return; if(e.sim > 0 && e.sim < MIN_SIM){ const entry = {code:'DISC-TEXT-003', id:e.id, page:e.page, similarity:+e.sim.toFixed(2)}; if(e.sim < NOISE_SIM){ warnings.push({...entry, severity:'WARNING', note:`Below noise threshold (<${NOISE_SIM}) likely spurious match`}); } else { errors.push({...entry, severity:'ERROR'}); metrics.drift++; } }});
  // Shadow copy (dedupe by hash of line)
  const fairnessCluster=/(under.?served|pemerataan|ranking|kualitas)/i;
  const shadowSeen = new Set();
  for(const f of candidateFiles){ let txt; try{ txt=await fs.readFile(f,'utf8'); } catch { continue; } txt.split(/\r?\n/).forEach(line=>{ const trimmed=line.trim(); if(!trimmed) return; if(fairnessCluster.test(trimmed) && !/D[1-7]/.test(trimmed)){ for(const d of canonicalArray){ const sim=overlapCoefficient(tokenize(d.text), tokenize(trimmed)); if(sim>=0.6){ const h=sha256(trimmed); if(!shadowSeen.has(h)){ errors.push({code:'DISC-PRES-002', similarity:+sim.toFixed(2), severity:'ERROR'}); shadowSeen.add(h); metrics.shadow++; } break; } } }}); }
  // Banned phrase proximity
  if(cfg.enforce_banned_phrase !== false){
    for (const f of candidateFiles){ 
      if(/disclaimers-lint-spec-v1\.md$/i.test(f)) continue; // exclude spec
      let txt; try { txt = await fs.readFile(f,'utf8'); } catch { continue; } 
      if (!extracted.some(e=>e.sourceFile===f && (e.id==='D1'||e.id==='D3'))) continue; 
      const sanitized = txt.split(/\r?\n/)
        .filter(l=>!/data-disclaimer-id=/.test(l))
        .filter(l=>!/^\s*-\s+.*(ranking|peringkat|terbaik|paling unggul)/i.test(l)) // skip example bullet lines
        .join('\\n');
      const negationRemoved = sanitized.replace(/bukan\s+(ranking|peringkat)/gi,'');
      if (BANNED_RE.test(negationRemoved)) { errors.push({code:'DISC-PHRASE-009', file:f, severity:'ERROR'}); metrics.bannedNear++; } 
    }
  }
  // Duplicates (DISC-DUPL-005)
  const dupCounts = {};
  rawExtracted.forEach(r=>{ if(/disclaimers-lint-spec-v1\.md$/i.test(r.sourceFile)) return; const key=r.page+':'+r.id; dupCounts[key]=(dupCounts[key]||0)+1; });
  Object.entries(dupCounts).forEach(([k,count])=>{ if(count>1){ const [page,id]=k.split(':'); const related=rawExtracted.filter(r=>r.page===page && r.id===id); const distinctFiles=new Set(related.map(r=>r.sourceFile)); if(distinctFiles.size>1 || count>2){ warnings.push({code:'DISC-DUPL-005', page, id, count, severity:'WARNING'}); metrics.duplicates++; } }});
  // Scope (DISC-SCOPE-006) & TRACE-008
  if(cfg.scope_checks?.enable !== false){
    extracted.forEach(e=>{
      const binding = pageBindingMap.get(e.page);
      if(!binding){ errors.push({code:'DISC-TRACE-008', page:e.page, id:e.id, severity:'ERROR', note:'Page not declared in bindings config'}); return; }
      const allowed = new Set([...(binding.ids||[]), ...((binding.optional_ids)||[])]);
      if(!allowed.has(e.id)) { warnings.push({code:'DISC-SCOPE-006', page:e.page, id:e.id, severity:'WARNING'}); metrics.scope++; }
    });
  }
  // Locale rule (DISC-LOCALE-011) pre-i18n
  if(cfg.phase?.i18n === false){
    rawExtracted.forEach(r=>{ if(/\b(english|en:)\b/i.test(r.text) && /D[1-7]/.test(r.text)){ warnings.push({code:'DISC-LOCALE-011', id:r.id, page:r.page, severity:'WARNING'}); metrics.locale++; } });
  }
  // Ordering rule (DISC-ORDER-004) – warn if disclaimer order deviates from canonical subsequence when enabled
  if(cfg.ordering?.enforce){
    const canonicalOrder = cfg.ordering.canonical_order || [];
    const orderIdx = Object.fromEntries(canonicalOrder.map((id,i)=>[id,i]));
    const byPage = extracted.reduce((acc,e)=>{ (acc[e.page]=acc[e.page]||[]).push(e); return acc; },{});
    Object.entries(byPage).forEach(([page,list])=>{
      const seq = list.sort((a,b)=>a.orderIndex-b.orderIndex).map(e=>e.id);
      const filteredSeq = seq.filter(id=>canonicalOrder.includes(id));
      let last=-1; let outOfOrder=false;
      for(const id of filteredSeq){ const idx = orderIdx[id]; if(idx<last){ outOfOrder=true; break; } last=idx; }
      if(outOfOrder){ warnings.push({code:'DISC-ORDER-004', page, severity:'WARNING'}); }
    });
  }
  if(versionMismatch){ errors.push({code:'DISC-VERSION-007', severity:'ERROR'}); }
  const allIssues=[...errors,...warnings];
  const ruleCounts = allIssues.reduce((acc,i)=>{ acc[i.code]=(acc[i.code]||0)+1; return acc; },{});
  const presenceEnforced = cfg.presence_enforcement !== false; // enforce unless explicitly false
  const report={ version:3, status: errors.length?'ERROR':'PASS', summary:{ errors:errors.length, warnings:warnings.length, metrics, versionMismatch, computed_hash: computedHash, ruleCounts, presence_enforcement: presenceEnforced }, errors, warnings, config_effective:{ min_similarity:MIN_SIM, noise_similarity:NOISE_SIM } };
  await fs.writeFile('artifacts/disclaimers-lint.json', JSON.stringify(report,null,2));
  if(cli.sarif){
    const sarif = { version:'2.1.0', $schema:'https://json.schemastore.org/sarif-2.1.0.json', runs:[{ tool:{ driver:{ name:'disclaimers-lint', informationUri:'https://example.local/disclaimers-lint', rules:[] }}, results:[...errors,...warnings].map(v=>({ ruleId:v.code, level: v.severity==='ERROR'?'error':'warning', message:{ text:`${v.code} ${v.page?('page='+v.page+' '):''}${v.id?('id='+v.id+' '):''}`.trim() }, locations: v.sourceFile ? [{ physicalLocation:{ artifactLocation:{ uri:v.sourceFile }}}] : [] })) }] };
    await fs.writeFile('artifacts/disclaimers-lint.sarif.json', JSON.stringify(sarif,null,2));
  }
  if(errors.length) process.exitCode=1;
  // Bootstrap allowance: if environment sets DISC_BOOTSTRAP=1 downgrade exit (keep artifact for aggregation)
  if(process.env.DISC_BOOTSTRAP==='1' && process.exitCode===1){
    console.error('[disclaimers-lint] Bootstrap mode active (DISC_BOOTSTRAP=1) – suppressing non-zero exit.');
    process.exitCode=0;
  }
}
main().catch(e=>{ console.error('disclaimers-lint error', e); process.exit(2); });
