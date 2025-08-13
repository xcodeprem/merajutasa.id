/**
 * terminology-scan.js (Stage 1 inventory)
 * Collects frequency of key governance/fairness/privacy tokens & flags banned ranking/hype terms (Stage 2 pending DEC).
 * Output: artifacts/terminology-scan.json
 */
import { promises as fs } from 'fs';
import { glob } from 'glob';

const KEY_TOKENS = ['fairness','privacy','hysteresis','hash','credential','governance','revocation'];
const BANNED_STAGE2 = /(peringkat|ranking|top\b|terbaik|paling unggul)/gi;

function parseCLI(){ const args=process.argv.slice(2); return { sarif: args.includes('--sarif') }; }
async function main(){
  const cli = parseCLI();
  await fs.mkdir('artifacts',{recursive:true});
  const files = await glob('docs/**/*.md');
  const freq = Object.fromEntries(KEY_TOKENS.map(t=>[t,0]));
  let bannedOccurrences = 0; const bannedSamples = [];
  for (const f of files){
    let txt; try { txt = await fs.readFile(f,'utf8'); } catch { continue; }
    const lower = txt.toLowerCase();
    KEY_TOKENS.forEach(tok=>{ const m = lower.match(new RegExp(`\\b${tok}\\b`,'g')); if (m) freq[tok]+=m.length; });
    const banned = [...txt.matchAll(BANNED_STAGE2)];
    if (banned.length){
      bannedOccurrences += banned.length;
      banned.slice(0,5).forEach(b=>bannedSamples.push({ file:f, term:b[0] }));
    }
  }
  const totalKey = Object.values(freq).reduce((a,b)=>a+b,0);
  const report = { version:1, stage:{ stage1:true, stage2_active:false }, key_token_frequency: freq, totalKey, banned_terms_detected: bannedOccurrences, banned_samples: bannedSamples };
  await fs.writeFile('artifacts/terminology-scan.json', JSON.stringify(report,null,2));
  if(cli.sarif){
    const sarif = { version:'2.1.0', $schema:'https://json.schemastore.org/sarif-2.1.0.json', runs:[{ tool:{ driver:{ name:'terminology-scan', informationUri:'https://example.local/terminology-scan', rules:[] }}, results: bannedSamples.map(s=>({ ruleId:'BANNED_TERM', level:'warning', message:{ text:`${s.term} in ${s.file}` }, locations:[{ physicalLocation:{ artifactLocation:{ uri:s.file }}}] })) }] };
    await fs.writeFile('artifacts/terminology-scan.sarif.json', JSON.stringify(sarif,null,2));
  }
}
main().catch(e=>{ console.error('terminology-scan error', e); process.exit(2); });
