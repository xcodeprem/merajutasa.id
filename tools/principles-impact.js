/**
 * principles-impact.js (Wave 0 -> Wave 1 heuristic expansion)
 * Heuristically infers which GP1..GP10 principles are impacted by current repository content / recent changes.
 * Sources:
 *  - Regex pattern mapping per principle (lexical triggers)
 *  - File domain categories (privacy, fairness, governance, etc.)
 *  - Optional git diff (HEAD~1) to mark changed files (best-effort; non-fatal if unavailable)
 * Output: artifacts/principles-impact-report.json
 */
import { promises as fs } from 'fs';
import { glob } from 'glob';
import { spawnSync } from 'child_process';

const PRINCIPLES = [ 'GP1','GP2','GP3','GP4','GP5','GP6','GP7','GP8','GP9','GP10' ];

// Regex triggers (case-insensitive) capturing indicative terminology.
// These are intentionally conservative; later iterations can be tuned with precision / recall metrics.
const PRINCIPLE_PATTERNS = {
  GP1: [ /privacy/i, /pii/i, /data minimization/i, /hash(ing)?/i, /redact/i ],
  GP2: [ /safety/i, /harm/i, /abuse/i ],
  GP3: [ /transparenc/i, /explain/i, /trace/i, /audit trail/i ],
  GP4: [ /accountab/i, /governance/i, /dec\-/i ],
  GP5: [ /robust/i, /anomaly/i, /cooldown/i, /stalled/i, /hysteresis/i ],
  GP6: [ /outcome honesty/i, /misinterpret/i, /non-?ranking/i ],
  GP7: [ /hype/i, /revolusioner/i, /terbaik/i, /unggul/i, /super(ior)?/i, /top\b/i ],
  GP8: [ /portabil/i, /interoperab/i, /extensib/i ],
  GP9: [ /non-?ranking/i, /under-?served/i, /equity index/i, /fairness/i ],
  GP10:[ /ethic/i, /ethical/i, /bias/i, /inclusion/i, /governance ethics/i ]
};

function categorizeDomain(file){
  if (file.startsWith('docs/privacy')) return 'privacy';
  if (file.startsWith('docs/fairness')) return 'fairness';
  if (file.startsWith('docs/governance')) return 'governance';
  if (file.startsWith('docs/integrity')) return 'integrity';
  if (file.startsWith('docs/analytics')) return 'analytics';
  if (file.startsWith('docs/onboarding')) return 'onboarding';
  if (file.startsWith('docs/principles')) return 'principles';
  return 'other';
}

function getChangedFiles(){
  try {
    const res = spawnSync('git',['diff','--name-only','HEAD~1'], { encoding: 'utf8' });
    if (res.status !== 0) return new Set();
    return new Set(res.stdout.split(/\r?\n/).filter(Boolean));
  } catch { return new Set(); }
}

function confidenceFromCount(count, domainCount){
  if (count === 0) return 0;
  if (count === 1) return 0.35 + (domainCount>1?0.05:0);
  if (count <=3) return 0.55 + (domainCount>1?0.05:0);
  if (count <=6) return 0.75 + (domainCount>1?0.05:0);
  return 0.9;
}

async function collectEvidence(){
  const files = [ 'README.md', ...(await glob('docs/**/*.md')) ];
  const changed = getChangedFiles();
  const principleEvidence = Object.fromEntries(PRINCIPLES.map(p=>[p,[]]));

  for (const file of files){
    let text;
    try { text = await fs.readFile(file,'utf8'); } catch { continue; }
    const lines = text.split(/\r?\n/);
    lines.forEach((line,idx)=>{
      PRINCIPLES.forEach(p=>{
        const pats = PRINCIPLE_PATTERNS[p];
        pats.forEach(re=>{
          if (re.test(line)){
            principleEvidence[p].push({
              file,
              line: idx+1,
              snippet: line.trim().slice(0,200),
              pattern: re.source,
              changed: changed.has(file) || false,
              domain: categorizeDomain(file)
            });
          }
        });
      });
    });
  }
  return principleEvidence;
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const evidence = await collectEvidence();
  const principles = PRINCIPLES.map(p=>{
    const ev = evidence[p];
    const domains = [...new Set(ev.map(e=>e.domain))];
    const count = ev.length;
    const confidence = confidenceFromCount(count, domains.length);
    const inferredImpact = count>0;
    // Trim evidence list for artifact brevity (retain first 12, note total)
    const MAX_SHOW = 12;
    const shown = ev.slice(0,MAX_SHOW);
    return {
      principle: p,
      match_count: count,
      domains,
      inferredImpact,
      confidence: Number(confidence.toFixed(2)),
      evidence_sample: shown,
      evidence_truncated: count>MAX_SHOW
    };
  });
  const impacted = principles.filter(p=>p.inferredImpact).length;
  const avgConfidence = principles.reduce((a,p)=>a+p.confidence,0)/principles.length;
  const summary = {
    total_principles: principles.length,
    impacted,
    average_confidence: Number(avgConfidence.toFixed(2)),
    max_confidence: Math.max(...principles.map(p=>p.confidence))
  };
  const report = { version: 2, generated_utc: new Date().toISOString(), principles, summary };
  await fs.writeFile('artifacts/principles-impact-report.json', JSON.stringify(report,null,2));
}
main().catch(e=>{ console.error('principles-impact error', e); process.exit(2); });
