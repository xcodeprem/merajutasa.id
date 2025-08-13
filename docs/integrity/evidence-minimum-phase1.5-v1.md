# Phase 1.5 Evidence Minimum Set (v1.0 Draft)

Status: Draft (Pre-Ratification)  
Purpose: Mendefinisikan himpunan minimal artefak evidence yang WAJIB tersedia & segar untuk menyatakan kesiapan Phase 1.5 ("Evidence Depth & Privacy"). Set ini menjadi dasar gating sebelum eskalasi ke Phase 2 (full enforcement & signing).

Scope: Hanya artefak yang sudah ada / feasible Wave 1.5. Artefak lanjutan (revocation impact, advanced anomaly, credential signing) dievaluasi di Phase 2+.

## 1. Daftar Artefak Minimum

| ID | Artifact | File (Expected Path) | Purpose (Ringkas) | Minimal Content / Fields | Freshness (Max Age) | Gating Rule (PASS) | WARN Criteria | FAIL Criteria |
|----|----------|----------------------|-------------------|--------------------------|--------------------|-------------------|---------------|---------------|
| A1 | Spec Hash Diff | `artifacts/spec-hash-diff.json` | Bukti tidak ada drift file governed | `summary.violation_count` numeric; list `violations[]` | 24h | `violation_count=0` OR only single allowed advisory mismatch per policy (config DEC) | Single allowed advisory mismatch (e.g. hysteresis-config) | >1 violation OR any `PLACEHOLDER_AFTER_SEAL` |
| A2 | Param Integrity Matrix | `artifacts/param-integrity-matrix.json` | Sinkronisasi parameter Option F | `status`, `mismatches`, per-param rows | 24h | `status=PASS` AND `mismatches=0` | `status=PASS` but mismatches>0 (temporary accepted) | `status=FAIL` |
| A3 | Principles Impact Report | `artifacts/principles-impact-report.json` | Trace perubahan ke GP1–GP10 | `version>=2`, `entries[]` non-empty, each entry has `principles[]`, `confidence` | 24h | ≥1 entry OR explicit `no_change:true` flag; no parse errors | Empty entries (no_change flag missing) | Missing file / malformed JSON |
| A4 | Hype Lint Report | `artifacts/hype-lint.json` | Kontrol bahasa ranking / over-claim | `total_hits`, `severity_counts`, `max_severity` | 24h | `max_severity!='HIGH'` AND `severity_counts.HIGH=0` | `max_severity='HIGH'` but total HIGH <= baseline exception (<=3) | HIGH > baseline OR file missing |
| A5 | Disclaimers Lint Report | `artifacts/disclaimers-lint.json` | Presence + Drift D1–D7 | `summary.errors`, `summary.warnings`, `ruleCounts` | 24h | No `DISC-TEXT-003` ERROR; no `DISC-PRES-001` ERROR when presence_enforcement=false | Presence warnings allowed | Any drift error or banned phrase error after activation DEC |
| A6 | PII Scan Summary | `artifacts/pii-scan-report.json` | Deteksi kategori PII (regres) | `status`, `summary.highRiskHits`, `findings[]` | 24h | `highRiskHits=0` AND status in (PASS, ADVISORY) | `highRiskHits=0` but status=ADVISORY (non-critical categories present) | `highRiskHits>0` |
| A7 | Fairness Sim Scenario List | `artifacts/fairness-sim-scenarios.json` | Bukti cakupan skenario hysteresis Option F | `version`, `scenarios[]` with id, description, expected_outcome | 7d | ≥10 baseline scenarios; coverage tag present | 5–9 scenarios | <5 scenarios / file missing |
| A8 | No-Silent-Drift Aggregator | `artifacts/no-silent-drift-report.json` | Ringkas status lint utama | `components{}`, `status`, `timestamp_utc` | 24h | `status` in (PASS, ADVISORY) with no components=FAIL | One component ADVISORY | Any component FAIL |

Freshness dihitung relatif terhadap timestamp file system atau field `timestamp_utc` internal (jika ada). Tool orchestrator akan memeriksa age.

## 2. Hash & Integrity Expectations

* Semua file A1–A6, A8 diserialisasi deterministik (JSON sorted property natural engine order acceptable).  
* Setelah definisi ini diratifikasi: tambah entri manifest untuk file definisi ini (append-only).  
* Fairness sim scenario file (A7) boleh berkembang (append scenarios) asalkan tidak menghapus atau mengubah ID lama (append-only semantics).

## 3. Gating Pseudocode

```js
function phase15Gate(e){
  // e: object w/ loaded artifacts
  assert(age(e.spec) <= 24h && age(e.param) <= 24h /* etc */);
  if (e.spec.summary.violation_count > 1) FAIL('spec violations');
  if (e.param.status !== 'PASS' && e.param.mismatches > 0) FAIL('param mismatch');
  if (e.hype.max_severity === 'HIGH' && e.hype.severity_counts.HIGH > 0) FAIL('hype high');
  if (hasDriftErrors(e.disclaimers)) FAIL('disclaimer drift');
  if (e.pii.summary.highRiskHits > 0) FAIL('PII high risk');
  if (!meetsScenarioCount(e.sim, 10)) WARN('fairness sim low coverage');
  if (anyComponentFail(e.driftAgg.components)) FAIL('aggregated fail');
  return PASS;
}
```

## 4. Rationale

| Principle | Mapping |
|-----------|---------|
| GP1 Privacy | A6 ensures no high-risk leaks |
| GP2 Transparansi | A1, A3, A5 open evidence |
| GP5 Robustness | Multi-artifact redundancy (A1 + A2 + A8) |
| GP6 Anti-Hype | A4 + constraint in A5 |
| GP7 Governed Evolution | Append-only & hash gating |
| GP9 Fairness Stability | A7 simulation coverage |
| GP10 Data Consistency | Aggregator & param integrity alignment |

## 5. Open Items / Deferred

| Item | Deferred To | Note |
|------|-------------|------|
| Signed evidence bundle | Phase 2 | Needs key mgmt DEC |
| Revocation impact model | Phase 2 | Depends credential lifecycle design |
| Terminology Stage 2 lint | Phase 2 | Needs trigger DEC |
| Anomaly event coverage metrics | Phase 2 | Requires instrumentation harness |

## 6. Activation Steps

1. Finalize thresholds (baseline HIGH hype = 0).  
2. Append this file to hash manifest (integrity_class: `evidence-policy`, mutable_policy: append-only, next_change_requires_dec: true).  
3. Implement aggregator gating logic referencing table (update `no-silent-drift.js`).  
4. Add fairness sim scenario generator stub producing A7.  
5. Governance issues DEC referencing adoption of Phase 1.5 evidence set.  

## 7. Change Control

| Change Type | Requires DEC? | Reason |
|-------------|---------------|--------|
| Relax PASS condition (e.g., allow hype HIGH) | Yes | Lowers guard |
| Tighten PASS (e.g., require scenario ≥15) | Optional (log) | Increases rigor |
| Add new mandatory artifact | Yes | Expands scope |
| Rename artifact path | Yes | Traceability impact |

---
End of Phase 1.5 Evidence Minimum Set Definition (v1.0 Draft)
