---
id: DEC-20250812-04
title: Ratifikasi Baseline Ambang & Parameter Governance Tertunda (Consolidated Threshold Ratification)
date: 2025-08-12T08:30:00Z
class: CIC-B
status: adopted
supersedes: []
depends_on:
  - DEC-20250812-02
  - DEC-20250812-03
scope:
  - Menetapkan nilai final untuk ambang & parameter lint/privasi/evidence yang masih <PENDING_DECISION>.
  - Mengurangi risiko "parameter drift" sebelum Phase 1.5 Evidence Activation.
  - Menyediakan basis referensi eksplisit untuk tooling (param-integrity, disclaimers-lint, PII scan, evidence bundle renderer, terminology-scan).
spec_reference:
  - docs/fairness/hysteresis-config-v1.yml
  - docs/governance/disclaimers-lint-spec-v1.md
  - docs/privacy/pii-pattern-library-v1.md
  - docs/integrity/credential-schema-final-v1.md
  - docs/analytics/event-schema-canonical-v1.md
  - docs/principles/GP1-GP10-index.md
related_principles: [GP1, GP5, GP6, GP7, GP8, GP9, GP10]
impacted_components: [lint_suite, param_integrity_checker, pii_scanner, evidence_bundle, terminology_scan, fairness_engine]
hash_of_decision_document: "6b9d779ec986b189777ef0c7a0ac5fa23b1c38534c52a6dd6dc8b2b70a497f0e"  # sealed SHA256
decision_blocks:
  - id: DB-01
    topic: Multi-Category PII Block Threshold
    decision: 2
    rationale: Mempercepat blok kasus tinggi sensitivitas (≥2 kategori PII berbeda) tanpa menunggu manual triage.
    enforcement: immediate
    tool_integration: pii-scan (fail jika detection_count_distinct_categories >= 2 pada satu payload tanpa redaction)
    locked_by_dec: true
  - id: DB-02
    topic: Evidence Hash Display Length
    decision: 16  # hex chars (8 bytes)
    rationale: Cukup untuk pembeda ringkas di UI; hash penuh tetap ada di artifact JSON.
    enforcement: Phase 1 (post seal)
    tool_integration: evidence-bundle renderer (truncate display only)
    locked_by_dec: true
    full_hash_retention: true   # Hash penuh tetap ada di artifact JSON untuk verifikasi.
  - id: DB-03
    topic: Optional Disclaimer D7 Default
    decision: off
    rationale: Menghindari over-noise sebelum pengukuran kebutuhan; akan diaktifkan jika false negative disclaimers lint < target.
    review_after_days: 30
    locked_by_dec: true
    disclaimers_lint_rule_override:
      rule_codes_suppressed: ["DISC-PRES-D7-OPTIONAL"]
      rationale: D7 tidak diwajibkan hingga bukti kebutuhan jelas.
  - id: DB-04
    topic: Sampling & Classification Truncation
    decision: { decimals: 2 }
    rationale: Konsistensi pelaporan & menghindari misleading precision >2; eksplisit decimals=2 integer.
    enforcement: immediate
    tool_integration: pii-scan, principles-impact metrics, fairness-sim stats
    locked_by_dec: true
  - id: DB-05
    topic: Anomaly Delta Threshold (Equity Ratio)
    decision: 0.03
    rationale: Sudah dipakai di config; ratifikasi eksplisit untuk menghapus status tentative.
    enforcement: immediate (already active)
    review_after_days: 45
    locked_by_dec: true
  - id: DB-06
    topic: Terminology Stage 2 Trigger
    decision:
      thresholds:
        per_pr_distinct_flagged_terms: 5
        cumulative_new_flagged_terms_7d: 12
      logic_operator: OR
      activation: Stage2 (successor DEC)
    rationale: Menyeimbangkan deteksi terminologi baru tanpa over-block; Stage 2 = enforcement hard fail pada istilah non-whitelist.
    evaluation_metrics:
      - name: distinct_terms_per_pr
        definition: "Jumlah istilah baru (tidak dalam whitelist) berbeda pada 1 PR."
      - name: cumulative_new_flagged_terms_7d
        definition: "Total istilah baru unik (non-whitelist) yang muncul dalam rentang sliding 7 hari."
      - name: false_positive_rate_flagged_terms
        definition: "FP / (FP + TP) dimana FP = istilah ditandai namun dikonfirmasi bukan istilah terlarang."
    preconditions:
      - hash_baseline_sealed=true
      - false_positive_rate_flagged_terms < 0.10
    trigger_formula_human_readable: ">5 distinct_terms_per_pr OR cumulative_new_flagged_terms_7d > 12"
    actions_on_trigger:
      - create_successor_dec: true
      - escalate_stage: "Stage 2"
      - enforcement_mode_future: hard_fail_non_whitelisted_term
    locked_by_dec: true
  - id: DB-07
    topic: Revocation Reason Codes (Initial Set)
    decision: ["USER_REQUEST", "COMPROMISED", "POLICY_VIOLATION", "DATA_SUPERSEDED", "INTEGRITY_ERROR"]
    rationale: Menyediakan enumerasi awal agar evidence & schema tests dapat menggunakan referensi konsisten sebelum sistem revocation penuh.
    future_extension_requires_dec: true
    tool_integration: revocation-impact, credential validator (placeholder check)
    locked_by_dec: true
  - id: DB-08
    topic: Minimum Cell Aggregation Threshold (Fairness Analytics)
    decision: 20
    rationale: Mengurangi risiko identifiability & variance tinggi; angka praktis untuk stabilitas awal.
    review_after_days: 60
    impact: Affects analytics widget & potential suppression logic (future implementation)
    locked_by_dec: true
parameters_matrix:
  columns: [parameter, value, source_decision_block, prior_status, enforcement_phase]
  rows:
    - [multi_category_block_threshold, 2, DB-01, pending, immediate]
    - [evidence_hash_display_len, 16, DB-02, recommendation_only, Phase 1]
    - [disclaimer_D7_default, off, DB-03, pending, immediate]
    - [numeric_sampling_truncation_decimals, 2, DB-04, unspecified, immediate]
    - [anomaly_delta_threshold_equity_ratio, 0.03, DB-05, provisional, immediate]
    - [terminology_stage2_trigger_formula, "5 distinct OR 12 cumulative/7d", DB-06, undefined, pre-trigger]
    - [revocation_reason_codes, "USER_REQUEST|COMPROMISED|POLICY_VIOLATION|DATA_SUPERSEDED|INTEGRITY_ERROR", DB-07, none, future]
    - [min_cell_aggregation_threshold, 20, DB-08, undefined, immediate]
implementation_actions:
  - Update param-integrity tool menambahkan semua parameter di parameters_matrix.
  - Tambah revocation reason codes ke credential schema test vectors (non-breaking, comment-only until revocation DEC active).
  - Tambah konfigurasi truncation & hash display length ke config integritas pusat.
  - Implement terminology-scan menghitung distinct & cumulative flagged term metrics.
  - PII scanner enforce multi_category_block_threshold=2 (fail mode) & output block rationale.
  - analytics fairness komponen: dokumentasikan min_cell_aggregation_threshold=20 (belum ada suppression logic → TODO Phase 1.5).
metrics_and_targets:
  - pii_multi_category_false_block_rate_target: <5%
  - terminology_stage2_false_positive_rate_target: <10%
  - evidence_hash_display_collision_probability_note: "8-byte prefix collision probability negligible for current artifact volume (<10^-9)."
risk_assessment:
  risks:
    - id: R-THR-01
      risk: Threshold 20 terlalu tinggi untuk beberapa segmen → data delay.
      mitigation: Monitor suppressed segment count; revisit if >8% segments suppressed.
    - id: R-THR-02
      risk: Terminology trigger formula memicu terlalu cepat karena spike sementara.
      mitigation: 7d smoothing window & manual review sebelum successor DEC.
    - id: R-THR-03
      risk: Multi-category block menunda analisa root cause cepat.
      mitigation: Provide redacted preview token counts agar investigasi masih mungkin.
review_plan:
  date_scheduled: 2025-09-11
  success_criteria:
    - All parameters appear in param-integrity matrix with MATCH status.
    - No PR merges with missing parameter coverage after 7d.
    - PII multi-category block events audited 100% (low volume expected).
fallback:
  - Revert multi_category_block_threshold → 3 jika false_block_rate >10% dalam 14d.
  - Increase min_cell_aggregation_threshold review cadence jika suppressed >15% segments.
auditability:
  logging_requirements:
    - param-integrity logs previous vs current value & DEC id.
    - pii-scan logs categories_detected & action decision path.
    - terminology-scan logs distinct_count, cumulative_7d_count, stage_trigger_evaluated.
definitions:
  class_codes:
    CIC-A: "Critical Immediate Control – Activation / Enforcement Primary"
    CIC-B: "Control Baseline – Parameter & Threshold Ratification supporting primary controls"
    CIC-C: "Control Change – Subsequent refinements or minor adjustments"
  formulas:
    false_positive_rate_flagged_terms: "FP / (FP + TP)"
    stage2_trigger: 
      expression: "> per_pr_distinct_flagged_terms_threshold OR > cumulative_new_flagged_terms_7d_threshold"
      parameters:
        per_pr_distinct_flagged_terms_threshold: 5
        cumulative_new_flagged_terms_7d_threshold: 12
      notes: "Evaluated post-hash-seal; both metrics computed over canonical diff tokenization excluding whitelist."
  locked_by_dec_definition: "Parameter hanya dapat berubah melalui DEC penerus yang mereferensikan ID ini."
  full_hash_retention_definition: "Walau tampilan memotong hash (prefix), hash penuh tetap disimpan untuk verifikasi integritas."
  disclaimers_lint_rule_override_definition: "Sementara menonaktifkan atau menandai opsional bagian lint sampai kondisi aktivasi tercapai."
  decimals_truncation_definition: "Output numeric di-round half-up ke N=2 decimals sebelum persist/artifact agar konsisten & mencegah overprecision." 
signoff:
  governance_chair: "SIGNED <Farid>"
  data_lead: "SIGNED <Farid>"
  ethics_representative: "SIGNED <Farid>"
  product_owner: "SIGNED <Farid>"
integrity_manifest_pointer: "docs/integrity/spec-hash-manifest-v1.json#files[path=docs/governance/dec/DEC-20250812-04-governance-baseline-thresholds.md]"
append_only_notice: "File immutable; perubahan memerlukan DEC penerus."
---

Adopted DEC: baseline thresholds & governance parameters kini final; hash akan disegel melalui proses manifest (<PENDING_HASH> akan diganti oleh tooling seal-first).
