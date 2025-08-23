import fs from 'fs/promises';
import path from 'path';

async function loadJson(p){ try{ return JSON.parse(await fs.readFile(p,'utf8')); } catch{ return null; } }

function extractFindings(obj){
  const findings = [];
  if(!obj) {return findings;}
  const res = obj.Results || obj.results || [];
  for(const r of res){
    for(const v of (r.Vulnerabilities||[])){
      findings.push({ id: v.VulnerabilityID, severity: (v.Severity||'').toUpperCase(), pkg: v.PkgName, target: r.Target });
    }
  }
  return findings;
}

async function main(){
  const policy = await loadJson(path.join('tools','policy','scanner-policy.json'));
  if(!policy) {throw new Error('Missing tools/policy/scanner-policy.json');}
  const allow = new Set(policy.trivy?.allowlist_cves || []);
  const failSev = new Set((policy.trivy?.severity_fail || policy.severity_fail || ['HIGH','CRITICAL']).map(s=>String(s).toUpperCase()));
  const fsReport = await loadJson('trivy-fs.json');
  const imgReport = await loadJson('trivy-image.json');
  const findings = [...extractFindings(fsReport), ...extractFindings(imgReport)].map(f=>({ ...f, allowed: allow.has(f.id) }));
  const violating = findings.filter(f=>!f.allowed && failSev.has(f.severity));
  const summary = {
    tool: 'trivy',
    policy: { severity_fail: [...failSev] },
    totals: {
      all: findings.length,
      bySeverity: findings.reduce((acc,f)=>{acc[f.severity]=(acc[f.severity]||0)+1;return acc;},{}),
      allowed: findings.filter(f=>f.allowed).length,
      violating: violating.length,
    },
    violating,
    timestamp: new Date().toISOString(),
  };
  await fs.mkdir('artifacts', { recursive: true });
  await fs.writeFile(path.join('artifacts','container-trivy-enforce-summary.json'), JSON.stringify(summary,null,2));
  if(violating.length>0){
    console.error(`Trivy enforcement failed: ${violating.length} High/Critical findings`);
    process.exit(1);
  }
  console.log('Trivy enforcement passed');
}

main().catch(e=>{ console.error('trivy-enforce error:', e.message); process.exit(1); });
