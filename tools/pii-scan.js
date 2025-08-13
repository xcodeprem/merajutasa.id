/**
 * pii-scan.js (v1) - heuristic PII category detector reading markdown & text files.
 * Uses subset taxonomy from docs/privacy/pii-pattern-library-v1.md.
 * Output: artifacts/pii-scan-report.json
 */
import { promises as fs } from 'fs';
import { glob } from 'glob';
import { createHash } from 'crypto';

const CONFIG_PATH = 'tools/config/privacy-policy.json';

const CATEGORY_PATTERNS = [
  { code:'IDN_NIK', re:/\b(1[1-9]|[2-9][0-9])\d{14}\b/g, action:'BLOCK' },
  { code:'CONTACT_EMAIL', re:/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi, action:'REDACT' },
  { code:'CONTACT_PHONE', re:/(?:\+62|62|0)8[1-9][0-9]{7,10}\b/g, action:'REDACT' },
  { code:'DOB', re:/\b(0?[1-9]|[12][0-9]|3[01])([\/-])(0?[1-9]|1[0-2])\2(19|20)\d{2}\b/g, action:'REDACT' },
  { code:'BANK_ACCOUNT', re:/\b(?:bank|rek|rekening)[^\n]{0,40}?\b\d{10,16}\b/gi, action:'BLOCK' },
  { code:'PLATE_ID', re:/\b[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}\b/g, action:'WARN' },
  { code:'GOV_ID_DOC', re:/(KTP|SIM|Paspor)\s*(No\.?|Nomor)?\s*\d{8,}/gi, action:'BLOCK' }
];

function sha256(str){ return createHash('sha256').update(str).digest('hex'); }
async function safeReadJSON(p){ try { return JSON.parse(await fs.readFile(p,'utf8')); } catch { return null; } }
function maskSample(value, salt, truncate){ return value.slice(0, truncate) + '…#' + sha256(salt+value).slice(0,8); }

function parseCLI(){ const args=process.argv.slice(2); return { sarif: args.includes('--sarif') }; }
async function main(){
  const cli = parseCLI();
  await fs.mkdir('artifacts',{recursive:true});
  const cfg = await safeReadJSON(CONFIG_PATH) || { multi_category_block_threshold:2, hash_salt:'salt', sample_truncate_chars:6 };
  const files = await glob('docs/**/*.md');
  const categoryCounts = {}; const findings = [];
  for (const f of files){
    let txt; try { txt = await fs.readFile(f,'utf8'); } catch { continue; }
    const presentCategories = new Set();
    CATEGORY_PATTERNS.forEach(p=>{
      const matches = [...txt.matchAll(p.re)] || [];
      if (matches.length){
        presentCategories.add(p.code);
        categoryCounts[p.code] = (categoryCounts[p.code]||0) + matches.length;
        matches.slice(0,5).forEach(m=>{ findings.push({ file:f, category:p.code, action:p.action, sample: maskSample(m[0], cfg.hash_salt, cfg.sample_truncate_chars) }); });
      }
    });
    if (presentCategories.size >= cfg.multi_category_block_threshold){
      findings.push({ file:f, code:'MULTI_CATEGORY_ESCALATION', categories:[...presentCategories], threshold: cfg.multi_category_block_threshold });
    }
  }
  const distinctCategories = Object.keys(categoryCounts).length;
  const highRisk = ['IDN_NIK','BANK_ACCOUNT','GOV_ID_DOC'];
  const highRiskHits = highRisk.reduce((a,c)=>a+(categoryCounts[c]||0),0);
  const status = highRiskHits>0 ? 'ADVISORY' : 'PASS';
  const report = { version:1, status, summary:{ distinctCategories, totalFindings: findings.length, categoryCounts, highRiskHits }, findings };
  await fs.writeFile('artifacts/pii-scan-report.json', JSON.stringify(report,null,2));
  if(cli.sarif){
    const sarif = { version:'2.1.0', $schema:'https://json.schemastore.org/sarif-2.1.0.json', runs:[{ tool:{ driver:{ name:'pii-scan', informationUri:'https://example.local/pii-scan', rules:[] }}, results: findings.map(f=>({ ruleId:f.category||f.code, level: (f.action==='BLOCK'?'error': f.action==='WARN'?'warning':'note'), message:{ text:`${f.category||f.code} ${f.file}` }, locations:[{ physicalLocation:{ artifactLocation:{ uri:f.file }}}] })) }] };
    await fs.writeFile('artifacts/pii-scan-report.sarif.json', JSON.stringify(sarif,null,2));
  }
}
main().catch(e=>{ console.error('pii-scan error', e); process.exit(2); });
