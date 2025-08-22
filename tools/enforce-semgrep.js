import fs from 'fs/promises';
import path from 'path';

function levelRank(l){return { INFO:1, WARNING:2, ERROR:3 }[String(l).toUpperCase()]||0;}

async function loadJson(p){ try{ return JSON.parse(await fs.readFile(p,'utf8')); } catch{ return null; } }

async function main(){
  const policy = await loadJson(path.join('tools','policy','scanner-policy.json'));
  if(!policy) throw new Error('Missing tools/policy/scanner-policy.json');
  const input = process.env.SEMGREP_RESULTS || 'semgrep-results.sarif.json';
  const raw = await loadJson(input) || {};
  // Semgrep SARIF format
  const runs = raw.runs || [];
  const allow = new Set(policy.semgrep?.allowlist_rules || []);
  const minLevel = String(policy.semgrep?.min_level_to_fail || 'error').toUpperCase();
  const minRank = levelRank(minLevel);
  const findings = [];
  for(const run of runs){
    const tool = run.tool?.driver?.name || 'semgrep';
    const rules = (run.tool?.driver?.rules)||[];
    const ruleMap = new Map(rules.map(r=>[r.id, r]));
    for(const r of run.results||[]){
      const ruleId = r.ruleId; const level = (r.level||ruleMap.get(ruleId)?.defaultConfiguration?.level||'warning').toUpperCase();
      const allowed = allow.has(ruleId);
      findings.push({ ruleId, level, allowed });
    }
  }
  const violating = findings.filter(f=>!f.allowed && levelRank(f.level) >= minRank);
  const summary = {
    tool: 'semgrep',
    policy: { min_level_to_fail: minLevel },
    totals: {
      all: findings.length,
      byLevel: findings.reduce((acc,f)=>{acc[f.level]=(acc[f.level]||0)+1;return acc;},{}),
      allowed: findings.filter(f=>f.allowed).length,
      violating: violating.length
    },
    violating,
    timestamp: new Date().toISOString()
  };
  await fs.mkdir('artifacts', { recursive: true });
  await fs.writeFile(path.join('artifacts','sast-semgrep-enforce-summary.json'), JSON.stringify(summary,null,2));
  if(violating.length>0){
    console.error(`Semgrep enforcement failed: ${violating.length} findings at level >= ${minLevel}`);
    process.exit(1);
  }
  console.log('Semgrep enforcement passed');
}

main().catch(e=>{ console.error('enforce-semgrep error:', e.message); process.exit(1); });
