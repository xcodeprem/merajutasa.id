---
id: DEC-20250813-01
title: Known Debt & Deferred Controls Register (Initial Compilation)
date: 2025-08-13T00:00:00Z
class: CIC-D   # Governance Debt / Deferred Control Classification
status: adopted
supersedes: []
depends_on:
  - DEC-20250812-02
  - DEC-20250812-03
  - DEC-20250812-04
scope:
  - Mendokumentasikan eksplisit semua kontrol / subsistem governance, fairness, privacy, integrity yang DISENGAJA ditunda atau dalam mode placeholder sehingga risiko & hutang (debt) dapat diaudit.
  - Menetapkan kode risiko, mitigasi sementara, dan kriteria pemicu aktivasi.
non_removal_assertion: "Dokumen ini tidak menghapus strategi; hanya menandai penundaan terkelola (managed deferral)."
hash_of_decision_document: "3bef87356b11ab86b5e87f62dd50bcf1dfe2da5c6a560534c6b8d22e603b4ef9"  # Diisi saat seal-first baseline hash sebelum Phase 1 transisi.
related_principles: [GP1, GP4, GP5, GP6, GP7, GP8, GP9, GP10]
related_files:
  - docs/governance/README-decision-log-process.md
  - docs/integrity/spec-hash-manifest-v1.json
  - docs/privacy/pii-pattern-library-v1.md
  - docs/analytics/event-schema-canonical-v1.md
  - docs/integrity/credential-schema-final-v1.md
  - docs/governance/disclaimers-lint-spec-v1.md
  - docs/onboarding/agent-bootstrap-manifest.md
risk_register:
  - code: RISK-DEBT-REVOCATION-SUBSYSTEM
    domain: credential
    description: Revocation subsystem (lifecycle events, reason code audit trail) belum diimplementasikan; hanya reason code list (DB-07 DEC-20250812-04).
    rationale: Fokus awal pada baseline fairness & principles enforcement.
    current_state: reason_codes_enum_only
    mitigation_interim: Reason codes enumerated; impact scope documented; no issuance of revocable credentials yet.
    activation_trigger: New DEC (Revocation Design) + Phase ≥2 stable for 30d.
    target_phase: 2
    review_date: 2025-09-25
  - code: RISK-DEBT-SIGNATURE-PIPELINE
    domain: integrity
    description: Ed25519 signing / key custody belum aktif; artifact integrity rely on SHA256 only.
    rationale: Key management & secure storage not ready.
    current_state: hashing_only
    mitigation_interim: Hash manifest sealing + immutability policies.
    activation_trigger: Key custody DEC + HSM / secure vault readiness.
    target_phase: 2
    review_date: 2025-09-30
  - code: RISK-DEBT-TERMINOLOGY-STAGE2
    domain: transparency
    description: Stage 2 hard fail terminology enforcement ditunda (DB-06 preconditions belum dipenuhi).
    rationale: Perlu data false positive rate <10% & hash baseline stabil.
    current_state: inventory_only
    mitigation_interim: Stage 1 inventory artifacts + manual review.
    activation_trigger: Successor DEC once metrics satisfied (distinct & cumulative thresholds breach + FP rate acceptable).
    target_phase: 2
    review_date: 2025-09-20
  - code: RISK-DEBT-DISCLAIMER-D7-OPTIONAL
    domain: transparency
    description: Disclaimer D7 default off (DB-03) untuk menghindari over-noise.
    rationale: Menunggu bukti kebutuhan / false negative metrics.
    current_state: optional_suppressed
    mitigation_interim: Lint tracks presence for other disclaimers; logs D7 absence.
    activation_trigger: Evidence DEC enabling D7 after evaluation window.
    target_phase: 1.5
    review_date: 2025-09-11
  - code: RISK-DEBT-PII-SCANNER-ENFORCEMENT
    domain: privacy
    description: PII scanner full action matrix (redact/hash/drop) belum aktif; multi-category block enforcement deferred to Phase 1.5.
    rationale: Perlu tuning false positive & category taxonomy validation.
    current_state: spec_only_no_runtime
    mitigation_interim: Pattern library locked in manifest; manual code review for PII surfaces.
    activation_trigger: Implementation of pii-scan.js + DEC threshold (already ratified DB-01) instrumentation proving stability.
    target_phase: 1.5
    review_date: 2025-09-18
  - code: RISK-DEBT-FAIRNESS-ENGINE-RUNTIME
    domain: fairness
    description: Hysteresis engine runtime modul belum diimplementasikan (config & DEC only).
    rationale: Intentional sequencing; ensure parameters sealed first.
    current_state: config_only
    mitigation_interim: Manual reasoning; no live classification outputting user-visible signals.
    activation_trigger: Implementation fairness-engine.js + passing UT1–UT6.
    target_phase: 1
    review_date: 2025-08-25
  - code: RISK-DEBT-EVIDENCE-BUNDLE-COMPLETENESS
    domain: integrity
    description: Full evidence bundle (Phase 2 set) belum lengkap (PII, observability, revocation impact missing).
    rationale: Gradual layering to avoid noise.
    current_state: partial_minimal
    mitigation_interim: Minimal Evidence Set gating before expansion.
    activation_trigger: All missing artifact scripts implemented & producing non-empty schema-compliant JSON.
    target_phase: 2
    review_date: 2025-09-15
  - code: RISK-DEBT-OBSERVABILITY-METRICS-NULL
    domain: observability
    description: Metrics ingestion_success_24h_pct & event_lag_p95_ms stubbed null.
    rationale: Data pipeline instrumentation not priority pre-seal.
    current_state: placeholders
    mitigation_interim: No gating reliant on these metrics before Phase 2.
    activation_trigger: observability-metrics.js implementation writing real sampled values.
    target_phase: 1.5
    review_date: 2025-09-05
  - code: RISK-DEBT-ANOMALY-REALTIME-DETECTOR
    domain: fairness
    description: Real-time anomaly detection (beyond static delta threshold) belum tersedia.
    rationale: Baseline threshold (0.03) suffices early.
    current_state: threshold_only
    mitigation_interim: Manual review of daily equity ratios; param-integrity highlights drift.
    activation_trigger: fairness-sim + anomaly module design DEC.
    target_phase: 2
    review_date: 2025-10-01
  - code: RISK-DEBT-NO-SILENT-DRIFT-AGGREGATOR-STUB
    domain: governance
    description: no-silent-drift aggregator belum mengkonsolidasikan semua artifact.
    rationale: Iterative build; avoid premature complexity.
    current_state: stub_only
    mitigation_interim: Manual cross-check of individual artifacts.
    activation_trigger: Implementation of aggregator reading all required JSON outputs.
    target_phase: 1
    review_date: 2025-08-28
  - code: RISK-DEBT-REVOCATION-IMPACT-PLACEHOLDER
    domain: credential
    description: revocation-impact.js tidak melakukan simulasi; placeholder output.
    rationale: Dependent on revocation subsystem design.
    current_state: placeholder
    mitigation_interim: Document potential fairness impact qualitatively in future DEC.
    activation_trigger: Revocation subsystem design DEC + simulation harness.
    target_phase: 2
    review_date: 2025-09-30
metrics_tracking:
  - name: open_debt_count
    definition: Jumlah entri risk_register dengan current_state != "resolved".
    target: downward trend each review cycle.
  - name: overdue_debt_count
    definition: Risk items dengan review_date < today dan belum updated.
    target: 0
review_plan:
  cadence: biweekly
  first_formal_review: 2025-08-27
  success_criteria:
    - No overdue_debt_count
    - At least 2 items transitioned state (stub → implemented or config_only → runtime) by first review
fallback:
  - If >30% items overdue at any review, require escalation DEC with remediation plan.
signoff:
  governance_chair: "SIGNED <Farid>"
  data_lead: "SIGNED <Farid>"
  ethics_representative: "SIGNED <Farid>"
  product_owner: "SIGNED <Farid>"
integrity_manifest_pointer: "docs/integrity/spec-hash-manifest-v1.json#files[path=docs/governance/dec/DEC-20250813-01-known-debt-register.md]"
append_only_notice: "File immutable; perubahan memerlukan DEC penerus atau addendum terpisah referensi id ini."
---

Adopted DEC mencatat semua deferred control & known debt awal. Tidak ada strategi dihapus; semua entri adalah penandaan transparan.
