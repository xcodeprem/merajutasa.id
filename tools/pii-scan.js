/**
 * pii-scan.js (v1.1) - heuristic PII category detector reading markdown & text files.
 * Extends coverage per docs/privacy/pii-pattern-library-v1.md with normalization & more categories.
 * Output: artifacts/pii-scan-report.json and optional SARIF.
 */
import { promises as fs } from 'fs';
import { glob } from 'glob';
import { createHash } from 'crypto';

const CONFIG_PATH = 'tools/config/privacy-policy.json';

// Province codes subset for NIK validation (library §5)
const VALID_NIK_PREFIX = new Set(['11','12','13','14','15','16','17','18','19','21','31','32','33','34','35','36','51','52','53','61','62','63','64','65','71','72','73','74','75','76','81','82','91','92','94','95']);

const CATEGORY_PATTERNS = [
  { code:'IDN_NIK', re:/\b\d{16}\b/g, action:'BLOCK', post:(m)=> VALID_NIK_PREFIX.has(m.slice(0,2)) ? { code:'IDN_NIK', val:m } : { code:'GENERIC_16DIGIT', val:m } },
  { code:'IDN_NKK', re:/\b\d{16}\b/g, action:'BLOCK', post:(m)=> (!VALID_NIK_PREFIX.has(m.slice(0,2)) ? { code:'IDN_NKK', val:m } : null) },
  { code:'EDU_NISN', re:/\b\d{10}\b/gi, action:'BLOCK' },
  { code:'CONTACT_EMAIL', re:/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi, action:'REDACT' },
  { code:'CONTACT_PHONE', re:/\b(?:\+62|62|0)8[1-9][0-9]{6,10}\b/gi, action:'REDACT' },
  { code:'ADDRESS_STREET', re:/(\b(Jl\.?|Jalan)\s+[A-Za-z0-9]+(?:\s+[A-Za-z0-9]+){0,4}(?:\s*No\.?\s*\d+)?\b|\bRT\s*\d{1,3}\/RW\s*\d{1,3}\b)/gi, action:'MASK' },
  { code:'DOB', re:/\b(0?[1-9]|[12][0-9]|3[01])([\/-])(0?[1-9]|1[0-2])\2(19|20)\d{2}\b/gi, action:'REDACT' },
  { code:'BANK_ACCOUNT', re:/\b(?:bank|rek|rekening)\b.{0,40}\b\d{10,16}\b/gi, action:'BLOCK' },
  { code:'PLATE_ID', re:/\b[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}\b/g, action:'WARN' },
  { code:'CHILD_NAME_AGE', re:/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*\(\s*(\d{1,2})\s*(th|tahun)\s*\)/g, action:'BLOCK' },
  { code:'GEO_FINE', re:/\b(-?\d{1,2}\.\d{4,}),\s*(-?\d{1,3}\.\d{4,})\b/g, action:'BLOCK' },
  { code:'GOV_ID_DOC', re:/(KTP|SIM|Paspor)\s*(No\.?|Nomor)?\s*\d{8,}/gi, action:'BLOCK' },
  { code:'EMAIL_IN_NAME', re:/[A-Za-z0-9]{5,}@/g, action:'REDACT' }
];

function sha256(str){ return createHash('sha256').update(str).digest('hex'); }
async function safeReadJSON(p){ try { return JSON.parse(await fs.readFile(p,'utf8')); } catch { return null; } }
function maskSample(value, salt, truncate){ return value.slice(0, truncate) + '…#' + sha256(salt+value).slice(0,8); }

function normalizeUnicode(s){
  try { s = s.normalize('NFKC'); } catch {}
  s = s.replace(/[\u200B-\u200D\uFEFF\u2060]/g,''); // zero-width
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,''); // control
  s = s.replace(/\r\n?/g,'\n'); // newlines
  return s;
}

function parseCLI(){ const args=process.argv.slice(2); return { sarif: args.includes('--sarif') }; }
async function main(){
  const cli = parseCLI();
  await fs.mkdir('artifacts',{recursive:true});
  const cfg = await safeReadJSON(CONFIG_PATH) || { multi_category_block_threshold:2, hash_salt:'salt', sample_truncate_chars:6 };
  const files = await glob('docs/**/*.md');
  const categoryCounts = {}; const findings = [];
  for (const f of files){
    let txt; try { txt = await fs.readFile(f,'utf8'); } catch { continue; }
    const norm = normalizeUnicode(txt);
    const presentCategories = new Set();
    CATEGORY_PATTERNS.forEach(p=>{
      const matches = [...norm.matchAll(p.re)] || [];
      if (matches.length){
        // Optional post-classification
        const processed = p.post ? matches.map(m=>p.post(m[0])).filter(Boolean) : null;
        if (processed && processed.length){
          processed.forEach(pp=>{
            presentCategories.add(pp.code);
            categoryCounts[pp.code] = (categoryCounts[pp.code]||0) + 1;
            findings.push({ file:f, category:pp.code, action:p.action, sample: maskSample(pp.val, cfg.hash_salt, cfg.sample_truncate_chars) });
          });
        } else {
          presentCategories.add(p.code);
          categoryCounts[p.code] = (categoryCounts[p.code]||0) + matches.length;
          matches.slice(0,5).forEach(m=>{ findings.push({ file:f, category:p.code, action:p.action, sample: maskSample(m[0], cfg.hash_salt, cfg.sample_truncate_chars) }); });
        }
      }
    });
    if (presentCategories.size >= cfg.multi_category_block_threshold){
      findings.push({ file:f, code:'MULTI_CATEGORY_ESCALATION', categories:[...presentCategories], threshold: cfg.multi_category_block_threshold });
    }
  }
  const distinctCategories = Object.keys(categoryCounts).length;
  const highRisk = ['IDN_NIK','IDN_NKK','BANK_ACCOUNT','GOV_ID_DOC','CHILD_NAME_AGE','GEO_FINE'];
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
