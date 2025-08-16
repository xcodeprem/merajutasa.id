/**
 * Aggregates multiple checks (hash drift, parameter mismatch, disclaimers presence)
 * Outputs artifacts/no-silent-drift-report.json used to populate Section 36 in PR template.
 */
import { promises as fs } from 'fs';
import crypto from 'crypto';
async function safeReadJSON(p){ try { return JSON.parse(await fs.readFile(p,'utf8')); } catch { return null; } }
function overallStatus(parts){
  if (parts.some(p=>p==='FAIL')) return 'FAIL';
  if (parts.some(p=>p==='MISMATCH'||p==='ADVISORY')) return 'ADVISORY';
  return 'PASS';
}
async function main() {
  await fs.mkdir('artifacts',{recursive:true});
  const spec = await safeReadJSON('artifacts/spec-hash-diff.json');
  const params = await safeReadJSON('artifacts/param-integrity-matrix.json');
  const hype = await safeReadJSON('artifacts/hype-lint.json');
  const disclaimers = await safeReadJSON('artifacts/disclaimers-lint.json');
  const principles = await safeReadJSON('artifacts/principles-impact-report.json');
  const pii = await safeReadJSON('artifacts/pii-scan-report.json'); // may not exist yet (stub future)
  const freshness = await safeReadJSON('artifacts/evidence-freshness-report.json');

  let specStatus = 'ADVISORY';
  if (spec){
    if (!spec.violations || spec.violations.length===0) specStatus='PASS';
    else {
      // Wave 0 downgrade rule: single HASH_MISMATCH_DEC_REQUIRED on hysteresis-config -> ADVISORY
      const onlyMismatchConfig = spec.violations.length===1 && spec.violations[0].code==='HASH_MISMATCH_DEC_REQUIRED' && /hysteresis-config-v1.yml/.test(spec.violations[0].path);
      specStatus = onlyMismatchConfig ? 'ADVISORY' : 'FAIL';
    }
  }
  const paramStatus = params ? params.status : 'ADVISORY';
  let hypeStatus = 'ADVISORY';
  if (hype){
    if (hype.total_hits===0) hypeStatus='PASS';
    else if (hype.max_severity==='HIGH') hypeStatus='ADVISORY'; // Phase 0 keep advisory; future Phase 1 escalate to FAIL
  }
  const discStatus = disclaimers ? (disclaimers.status === 'ERROR' ? 'ADVISORY' : 'PASS_STUB') : 'ADVISORY'; // Phase: downgrade until DEC activation
  const principlesArray = Array.isArray(principles) ? principles : (principles?.principles || []);
  const principlesStatus = principlesArray.length>0 ? 'PASS_STUB' : 'ADVISORY';
  // PII status heuristic: if file missing -> ADVISORY; if present and has critical >0 -> ADVISORY (Phase 0), else PASS
  let piiStatus = 'ADVISORY';
  if (pii){
    const critical = pii.summary?.critical_matches ?? 0;
    piiStatus = critical>0 ? 'ADVISORY' : 'PASS_STUB';
  }

  // Load gating policy
  let gatingPolicy=null; let thresholds=null;
  try {
    gatingPolicy = JSON.parse(await fs.readFile('docs/integrity/gating-policy-v1.json','utf8'));
    thresholds = gatingPolicy.thresholds || {};
  } catch {
    thresholds = {};
  }
  // Derived required artifacts list
  const evidenceRequired = Array.isArray(thresholds.evidence_minimum_artifacts) ? thresholds.evidence_minimum_artifacts : [];

  const freshnessStatus = freshness ? (freshness.summary?.overall_status || 'UNKNOWN') : 'MISSING';
  const hypeHigh = hype?.severity_counts?.HIGH || 0;
  const hypeMedium = hype?.severity_counts?.MEDIUM || 0;
  const discErrors = disclaimers?.summary?.errors || 0;
  const discEnforced = disclaimers?.summary?.presence_enforcement === true;
  const specViolations = spec?.violations?.length || 0;
  const paramStatusPass = params?.status === (thresholds.param_integrity_status || 'PASS');
  const piiCritical = pii?.summary?.critical_matches || 0;
  // Fairness unit test artifact presence & status
  let fairnessUnitStatus=null; let fairnessUnitFailCount=null;
  try {
    const fut = JSON.parse(await fs.readFile('artifacts/fairness-engine-unit-tests.json','utf8'));
    fairnessUnitFailCount = fut.summary?.fail || 0;
    fairnessUnitStatus = (fut.summary?.fail===0) ? 'PASS' : 'FAIL';
  } catch {/* not present */}
  // Hash fairness config to confirm lock (param lock script will emit artifact; fallback inline)
  let configHash=null;
  try { const raw = await fs.readFile('docs/fairness/hysteresis-config-v1.yml'); configHash = crypto.createHash('sha256').update(raw).digest('hex'); } catch {}

  const gateChecks = [
    { id:'SPEC_HASH', passed: specViolations <= (thresholds.spec_hash_violation_count ?? 0), detail:{ violations:specViolations, allowed:thresholds.spec_hash_violation_count ?? 0 } },
    { id:'PARAM_INTEGRITY', passed: paramStatusPass, detail:{ status:params?.status, required:thresholds.param_integrity_status } },
  { id:'HYPE_HIGH', passed: hypeHigh <= (thresholds.hype_high_max ?? 0), detail:{ high:hypeHigh, max:thresholds.hype_high_max ?? 0 } },
  ...(thresholds.hype_medium_max !== undefined ? [{ id:'HYPE_MEDIUM', passed: hypeMedium <= thresholds.hype_medium_max, detail:{ medium:hypeMedium, max:thresholds.hype_medium_max } }] : []),
    { id:'DISCLAIMERS_PRESENCE', passed: !discEnforced || discErrors <= (thresholds.disclaimers_errors_allowed ?? 0), detail:{ enforced:discEnforced, errors:discErrors, allowed:thresholds.disclaimers_errors_allowed ?? 0 } },
    { id:'PII_CRITICAL', passed: piiCritical <= (thresholds.pii_critical_max ?? 0), detail:{ critical:piiCritical, max:thresholds.pii_critical_max ?? 0 } },
    { id:'FAIRNESS_UNIT', passed: !thresholds.fairness_engine_required || fairnessUnitStatus==='PASS', detail:{ required:thresholds.fairness_engine_required, status:fairnessUnitStatus, failCount:fairnessUnitFailCount } },
  { id:'EVIDENCE_MINIMUM', passed: (await Promise.all(evidenceRequired.map(async p=>{ try { await fs.access(p); return true; } catch { return false; } }))).every(v=>v), detail:{ requiredCount:evidenceRequired.length } }
  ];
  if (thresholds.freshness_required_status){
    gateChecks.push({ id:'FRESHNESS', passed: freshnessStatus === thresholds.freshness_required_status, detail:{ status:freshnessStatus, required:thresholds.freshness_required_status } });
  }
  if (thresholds.principles_required){
    const principlesPresent = principlesArray.length>0;
    gateChecks.push({ id:'PRINCIPLES_IMPACT', passed: principlesPresent, detail:{ present:principlesPresent } });
  }
  const gateStatus = gateChecks.every(c=>c.passed) ? 'PASS' : 'FAIL';

  const report = {
    timestamp_utc: new Date().toISOString(),
    components: {
      spec_hash: specStatus,
      params: paramStatus,
      hype: hypeStatus,
      disclaimers: discStatus,
      principles: principlesStatus,
      pii: piiStatus,
      freshness: freshnessStatus
    },
    summary: {
      hype_hits: hype?.total_hits ?? 0,
      hype_max_severity: hype?.max_severity ?? null,
      hype_high: hype?.severity_counts?.HIGH ?? 0,
      hype_medium: hype?.severity_counts?.MEDIUM ?? 0,
  hype_rule_counts: hype?.rule_counts || {},
  hype_medium_max_allowed: thresholds.hype_medium_max ?? null,
      param_mismatches: params?.mismatches ?? 0,
  principles_entries: principlesArray.length,
      pii_critical: pii?.summary?.critical_matches ?? 0,
      pii_total: pii?.summary?.total_matches ?? 0,
      disclaimers_errors: disclaimers?.summary?.errors ?? 0,
      disclaimers_warnings: disclaimers?.summary?.warnings ?? 0,
      disclaimers_rule_counts: disclaimers?.summary?.ruleCounts || {},
      gate_status: gateStatus,
      gate_checks: gateChecks,
  thresholds,
  gating_policy_version: gatingPolicy?.version || null
    },
    gating: { version:'1.0', status: gateStatus, checks: gateChecks }
  };
  report.status = overallStatus(Object.values(report.components));
  await fs.writeFile('artifacts/no-silent-drift-report.json', JSON.stringify(report,null,2));
  
  // Gate enforcement: exit with error code if gate status is FAIL
  if (gateStatus === 'FAIL') {
    console.error('[no-silent-drift] GATE FAIL - preventing merge');
    process.exit(1);
  }
}
main().catch(e=>{ console.error('no-silent-drift error', e); process.exit(2); });
