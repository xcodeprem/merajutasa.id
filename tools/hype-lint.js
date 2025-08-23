/**
 * hype-lint (Wave 1 full scan)
 * Recursively scans textual content under docs/ (and README.md) for banned / overclaim phrases.
 * Outputs artifacts/hype-lint.json with per-hit context and severity scoring.
 * Exit code: 0 always (enforcement escalation handled by aggregator / phase gating).
 */
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

const BANNED_DEFS = [
  { id:'RANKING',     needles:['ranking'],         baseSeverity:'MEDIUM', rationale:'Unsubstantiated ranking claim.', wordBoundary:true },
  { id:'TOP',         needles:['top'],             baseSeverity:'MEDIUM', rationale:'Generic superiority claim.', wordBoundary:true },
  { id:'TERBAIK',     needles:['terbaik'],         baseSeverity:'HIGH',   rationale:'“Terbaik” (best) absolute claim.' },
  { id:'REVOLUSIONER',needles:['revolusioner'],    baseSeverity:'HIGH',   rationale:'Overclaim “revolutionary”.' },
];

function classifySeverity(def, line){
  // Potential future adjustments (context-based downgrade). For now return base.
  return def.baseSeverity;
}

async function scanFile(f){
  let raw; try { raw = await fs.readFile(f,'utf8'); } catch { return []; }
  if (/\x00/.test(raw.slice(0,1024))) {return [];} // skip binary
  const lines = raw.split(/\r?\n/);
  const hits = [];
  for (let i=0;i<lines.length;i++){
    const line = lines[i];
    if (/hype-lint-ignore-line/.test(line) || /lint-allow-negated-context/.test(line)) {continue;}
    // Skip educational/spec pattern lines enumerating banned words (avoid false positives)
    if (/GP7/.test(line) || /(revolusioner|terbaik).*(\(|\)|\||pattern|regex)/i.test(line)) {continue;}
    const lower = line.toLowerCase();
    for (const def of BANNED_DEFS){
      for (const needle of def.needles){
        let idx = 0; const needleLower = needle.toLowerCase();
        while((idx = lower.indexOf(needleLower, idx)) !== -1){
          // word boundary check if requested
          if (def.wordBoundary){
            const before = idx===0 ? ' ' : lower[idx-1];
            const after = idx+needleLower.length >= lower.length ? ' ' : lower[idx+needleLower.length];
            if (/[^a-z0-9_]/i.test(before) && /[^a-z0-9_]/i.test(after)) {
              hits.push({ file:f, line:i+1, column:idx+1, match: line.substr(idx, needle.length), rule:def.id, severity:classifySeverity(def,line), rationale:def.rationale, context_line: line });
            }
          } else {
            hits.push({ file:f, line:i+1, column:idx+1, match: line.substr(idx, needle.length), rule:def.id, severity:classifySeverity(def,line), rationale:def.rationale, context_line: line });
          }
          idx += needleLower.length;
        }
      }
    }
  }
  return hits;
}

function aggregate(findings){
  const severityCounts = findings.reduce((acc,f)=>{acc[f.severity]=(acc[f.severity]||0)+1; return acc;},{});
  const ruleCounts = findings.reduce((acc,f)=>{acc[f.rule]=(acc[f.rule]||0)+1; return acc;},{});
  const maxSeverity = ['HIGH','MEDIUM','LOW'].find(s=>severityCounts[s]>0) || 'NONE';
  return { severityCounts, ruleCounts, maxSeverity };
}

async function main(){
  const patterns = ['docs/**/*.md','README.md'];
  const excludePatterns = [
    'docs/governance/**',     // Governance guidance documents
    'docs/onboarding/**',     // Agent onboarding guides
    'docs/principles/**',     // Principles guidance
    'docs/archive/**',        // Archived specifications
    'docs/integrity/**',      // Integrity specifications
    'docs/fairness/**',       // Fairness methodology docs
    'docs/transparency/**',   // Transparency methodology
    'docs/trust/**',          // Trust methodology
    'docs/privacy/**',        // Privacy specifications
    'docs/faq/**',            // FAQ documents
    'docs/analytics/**',      // Analytics specifications
    'docs/policies/**',       // Policy documents
    'docs/roadmap/**',        // Roadmap documents
    'docs/master-spec/**',     // Master specifications
  ];

  const allFiles = (await Promise.all(patterns.map(p=>glob(p)))).flat();
  const excludeFiles = (await Promise.all(excludePatterns.map(p=>glob(p)))).flat();
  const excludeSet = new Set(excludeFiles);

  const files = allFiles
    .filter(f => !excludeSet.has(f))
    .filter((v,i,a)=>a.indexOf(v)===i)
    .sort();

  const allFindings = [];
  for (const f of files){
    // Skip very large (>500k) to prevent memory spikes
    try {
      const stat = await fs.stat(f);
      if (stat.size > 500_000) {continue;}
    } catch { continue; }
    const rel = f.split(path.sep).join('/');
    const findings = await scanFile(rel);
    allFindings.push(...findings);
  }

  const { severityCounts, ruleCounts, maxSeverity } = aggregate(allFindings);
  await fs.mkdir('artifacts',{recursive:true});
  const out = {
    version: 1,
    generated_utc: new Date().toISOString(),
    file_count: files.length,
    total_hits: allFindings.length,
    max_severity: maxSeverity,
    severity_counts: severityCounts,
    rule_counts: ruleCounts,
    findings: allFindings.slice(0, 500), // cap
    truncated: allFindings.length > 500,
  };
  await fs.writeFile('artifacts/hype-lint.json', JSON.stringify(out,null,2));
}

main().catch(e=>{ console.error('hype-lint error', e); /* do not fail pipeline */ });
