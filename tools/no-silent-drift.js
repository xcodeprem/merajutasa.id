/**
 * Aggregates multiple checks (hash drift, parameter mismatch, disclaimers presence)
 * Outputs artifacts/no-silent-drift-report.json used to populate Section 36 in PR template.
 */
import { promises as fs } from 'fs';
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
  const discStatus = disclaimers ? disclaimers.status : 'ADVISORY';
  const principlesStatus = Array.isArray(principles) ? 'PASS_STUB' : 'ADVISORY';
  // PII status heuristic: if file missing -> ADVISORY; if present and has critical >0 -> ADVISORY (Phase 0), else PASS
  let piiStatus = 'ADVISORY';
  if (pii){
    const critical = pii.summary?.critical_matches ?? 0;
    piiStatus = critical>0 ? 'ADVISORY' : 'PASS_STUB';
  }

  const report = {
    timestamp_utc: new Date().toISOString(),
    components: {
      spec_hash: specStatus,
      params: paramStatus,
      hype: hypeStatus,
      disclaimers: discStatus,
      principles: principlesStatus,
      pii: piiStatus
    },
    summary: {
      hype_hits: hype?.total_hits ?? 0,
      hype_max_severity: hype?.max_severity ?? null,
      hype_high: hype?.severity_counts?.HIGH ?? 0,
      hype_medium: hype?.severity_counts?.MEDIUM ?? 0,
      hype_rule_counts: hype?.rule_counts || {},
  param_mismatches: params?.mismatches ?? 0,
  principles_entries: Array.isArray(principles) ? principles.length : 0,
  pii_critical: pii?.summary?.critical_matches ?? 0,
  pii_total: pii?.summary?.total_matches ?? 0
    }
  };
  report.status = overallStatus(Object.values(report.components));
  await fs.writeFile('artifacts/no-silent-drift-report.json', JSON.stringify(report,null,2));
}
main().catch(e=>{ console.error('no-silent-drift error', e); process.exit(2); });
