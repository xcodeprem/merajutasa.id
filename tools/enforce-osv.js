import fs from 'fs/promises';
import path from 'path';

function sevRank(s) { return { LOW:1, MODERATE:2, MEDIUM:2, HIGH:3, CRITICAL:4 }[String(s).toUpperCase()] || 0; }

async function loadJson(p) {
  try { const s = await fs.readFile(p, 'utf8'); return JSON.parse(s); } catch { return null; }
}

async function main() {
  const policy = await loadJson(path.join('tools','policy','scanner-policy.json'));
  if (!policy) throw new Error('Missing tools/policy/scanner-policy.json');
  const inputPath = process.env.OSV_RESULTS || 'osv-results.json';
  const results = await loadJson(inputPath) || {};
  const allow = new Set(policy.osv?.allowlist_ids || []);
  const failSev = new Set((policy.severity_fail||[]).map(s=>String(s).toUpperCase()));

  const findings = [];
  // Support both native osv-scanner JSON and GitHub SARIF-like structures
  const vulns = results.vulnerabilities || results.results || [];
  const list = Array.isArray(vulns) ? vulns : [];
  for (const v of list) {
    // v.id or v.vulnerability.id depending on format
    const id = v.id || v.vulnerability?.id || v.vuln || v.aliases?.[0];
    const severity = (v.severity?.[0]?.type || v.severity?.[0]?.score || v.ecosystem_specific?.severity || v.database_specific?.severity || v.severity || '');
    const sev = String(severity).toUpperCase().includes('CRITICAL') ? 'CRITICAL'
              : String(severity).toUpperCase().includes('HIGH') ? 'HIGH'
              : String(severity).toUpperCase().includes('MEDIUM') ? 'MEDIUM'
              : String(severity).toUpperCase().includes('MODERATE') ? 'MEDIUM'
              : String(severity).toUpperCase().includes('LOW') ? 'LOW' : 'UNKNOWN';
    if (!id) continue;
    const allowed = allow.has(id);
    findings.push({ id, severity: sev, allowed });
  }

  const violating = findings.filter(f => !f.allowed && failSev.has(f.severity));
  const summary = {
    tool: 'osv',
    policy: { severity_fail: [...failSev] },
    totals: {
      all: findings.length,
      bySeverity: findings.reduce((acc,f)=>{acc[f.severity]=(acc[f.severity]||0)+1;return acc;},{}),
      allowed: findings.filter(f=>f.allowed).length,
      violating: violating.length
    },
    violating,
    timestamp: new Date().toISOString()
  };
  await fs.mkdir('artifacts', { recursive: true });
  await fs.writeFile(path.join('artifacts','sca-osv-enforce-summary.json'), JSON.stringify(summary, null, 2));
  if (violating.length > 0) {
    console.error(`OSV enforcement failed: ${violating.length} High/Critical findings`);
    process.exit(1);
  }
  console.log('OSV enforcement passed');
}

main().catch(e => { console.error('enforce-osv error:', e.message); process.exit(1); });
