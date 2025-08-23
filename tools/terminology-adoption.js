#!/usr/bin/env node
import { promises as fs } from 'fs';
import { glob } from 'glob';

function countOccurrences(text, terms){
  let total=0; const samples={};
  for (const t of terms){
    const rx = new RegExp(`\b${t.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&')}\b`,'gi');
    const matches = text.match(rx) || [];
    total += matches.length;
    if (matches.length && !samples[t]) {samples[t] = matches.slice(0,3).map(m=>m);}
  }
  return { total, samples };
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const mapping = JSON.parse(await fs.readFile('docs/principles/terminology-mapping.json','utf8'));
  // Optional extended dictionary with explicit old->new pairs
  let dictPairs = [];
  try {
    const dict = JSON.parse(await fs.readFile('docs/principles/terminology-dictionary.json','utf8'));
    if (Array.isArray(dict.pairs)) {dictPairs = dict.pairs;}
  } catch {}
  const files = await glob('{docs,README.md}/**/*.md', { nodir:true, strict:false });
  let oldTotal=0, newTotal=0; const fileBreakdown=[]; let bannedHits=0; const suggestions=[];
  // Build a unified set of old terms = mapping.old_terms ∪ dictionary.pairs[].old
  const dictOld = dictPairs.map(p=> p.old).filter(Boolean);
  const unifiedOld = Array.from(new Set([...(mapping.old_terms||[]), ...dictOld]));
  for (const f of files){
    let txt=''; try { txt = await fs.readFile(f,'utf8'); } catch {}
    const { total: oldCount } = countOccurrences(txt, unifiedOld);
    const { total: newCount } = countOccurrences(txt, mapping.new_terms);
    oldTotal += oldCount; newTotal += newCount;
    bannedHits += oldCount;
    // Build suggestions per dictionary pairs
    const fileSuggestions = [];
    for (const p of dictPairs){
      const rx = new RegExp(`\\b${p.old.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&')}\\b`,'gi');
      const m = txt.match(rx) || [];
      if (m.length){ fileSuggestions.push({ old: p.old, new: p.new, count: m.length }); }
    }
    if (fileSuggestions.length){ suggestions.push({ file: f, suggestions: fileSuggestions }); }
    fileBreakdown.push({ file: f, oldCount, newCount });
  }
  const adoptionPercent = (newTotal + oldTotal) ? +( (newTotal / (newTotal + oldTotal)) * 100 ).toFixed(2) : 100;
  const report = { version:'1.0.0', generated_utc: new Date().toISOString(), old_total: oldTotal, new_total: newTotal, adoptionPercent, files: fileBreakdown, suggestions };
  await fs.writeFile('artifacts/terminology-adoption.json', JSON.stringify(report,null,2));
  const threshold = Number(process.env.ADOPTION_MIN || '0');
  const bannedMax = Number(process.env.BANNED_MAX || '0');
  const violations = [];
  if (threshold && adoptionPercent < threshold) {violations.push({ code:'ADOPTION_LOW', threshold, actual: adoptionPercent });}
  if (bannedMax>=0 && oldTotal > bannedMax) {violations.push({ code:'BANNED_TERMS', max: bannedMax, actual: oldTotal });}
  if (violations.length){
    await fs.writeFile('artifacts/terminology-violations.json', JSON.stringify({ violations },null,2));
    console.error('[terminology-adoption] FAIL', violations);
    process.exit(1);
  }
  console.log(`[terminology-adoption] PASS adoption=${adoptionPercent}% old=${oldTotal} new=${newTotal}`);
}

main().catch(e=>{ console.error('terminology-adoption error', e); process.exit(2); });
