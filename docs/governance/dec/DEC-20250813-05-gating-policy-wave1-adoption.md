---
<!-- markdownlint-disable MD041 MD007 MD032 -->
id: DEC-20250813-05
title: Wave 1 Gating Policy & Engine Core Governance Adoption
date: 2025-08-13T12:05:00Z
class: CIC-C
status: adopted
supersedes: []
depends_on:
   - DEC-20250812-02
   - DEC-20250812-04
governance_tags: [gating, fairness, integrity]
related_principles: [GP1, GP2, GP5, GP6, GP7, GP9]
related_files:
   - docs/integrity/gating-policy-v1.json
   - tools/fairness/engine-core.js
   - tools/no-silent-drift.js
   - artifacts/no-silent-drift-report.json
   - artifacts/hype-lint.json
decision_summary: >
   Mengadopsi Wave 1 gating fairness & integrity: menetapkan policy JSON & core engine governed + verifikasi otomatis (spec hash, param lock,
   unit fairness, hype HIGH=0, PII critical=0) untuk mencegah drift tanpa audit.
context: >
   Wave 1 menambahkan gating policy JSON & ekstraksi core hysteresis engine; keduanya perlu governance agar perubahan threshold / logic tersign-off.
decision:
   - Classify gating policy file governed (append-only; threshold change => DEC baru referensi id ini).
   - Link fairness engine-core extraction ke governance chain (DEC-20250812-02 + DEC ini).
   - Tambah pipeline checks: param lock hash, fairness unit, spec hash=0 violation, hype HIGH=0, PII critical=0.
   - Introduce governed change scan script (scan dec_ref untuk file governed).
rationale:
   - Kurangi risiko silent drift thresholds & logic.
   - Bentuk baseline stabil sebelum Wave 2 gates.
   - Perkuat audit trail lintas artefak.
scope:
   - Policy classification & threshold binding
   - Engine core governance linkage
   - Governed change scan
   - Enforcement hash + unit + hype + PII gates
out_of_scope:
   - Medium hype segmentation (transitional DEC lain)
   - Freshness / principles impact gating
   - Privacy pattern expansion
traceability_matrix:
   - artifact: spec-hash-diff.json
      source: spec-hash-diff.js
      metrics: [violations]
   - artifact: param-integrity-matrix.json
      source: param-integrity.js
      metrics: [param_integrity_status]
   - artifact: hype-lint.json
      source: hype-lint.js
      metrics: [hype_high]
   - artifact: fairness-engine-unit-tests.json
      source: jest (future)
      metrics: [fail_count]
   - artifact: no-silent-drift-report.json
      source: no-silent-drift.js
      metrics: [summary]
metrics:
   baselines:
      spec_hash_violations: 0
      param_integrity_status: PASS
      hype_high: 9
      hype_medium: 116
      fairness_unit_fail: 0
   targets_wave1:
      spec_hash_violations: 0
      param_integrity_status: PASS
      hype_high: 0
      fairness_unit_fail: 0
risk_assessment:
   - id: R-GATE-01
      risk: Threshold tweak tanpa DEC
      mitigation: Manifest + governed scan gate
   - id: R-GATE-02
      risk: CI latency
      mitigation: Parallel artifact generation & cache
   - id: R-GATE-03
      risk: Hype false negative
      mitigation: Transitional segmentation DEC
   - id: R-GATE-04
      risk: Over-reliance manual review
      mitigation: Aggregated evidence gate
implementation_actions:
   - Update manifest dec_ref untuk policy & engine-core
   - Urutan CI: param lock → unit → spec-hash → hype lint → aggregator
   - Timestamp thresholds di gating-policy-v1.json
   - Publikasi daftar artefak di decision log index
review_plan:
   date_scheduled: 2025-09-05
   success_criteria:
      - Zero spec hash violations 14d
      - No unit fairness fail
      - Rencana reduksi hype medium terdokumentasi
   fallback: Refinement param diff granularity
public_communication: "Baseline gating fairness & integrity aktif; semua perubahan threshold/core logic wajib DEC & lulus bukti otomatis."
implications:
   - PR mengubah policy atau engine-core butuh DEC baru
   - Manifest diperbarui memasukkan referensi ini
   - Landasan Wave 2 escalations
non_removal_assertion:
   - Tidak ada strategi sebelumnya dihapus (additive)
signoff:
   governance_chair: "SIGNED <Farid>"
   data_lead: "SIGNED <Farid>"
   ethics_representative: "SIGNED <Farid>"
   product_owner: "SIGNED <Farid>"
hash_of_decision_document: "3a1531d53017473182648eaecb7b00ebba451e7487f591d141c12493b8651ae4"
integrity_manifest_pointer: "docs/integrity/spec-hash-manifest-v1.json#files[path=docs/governance/dec/DEC-20250813-05-gating-policy-wave1-adoption.md]"
append_only_notice: "Expanded; treat immutable pasca hash."
supersede_policy: "Threshold/gate baru memerlukan successor DEC."
hash_canonicalization_note: "Nilai hash ini diganti placeholder saat canonicalization."
---
Adoption DEC for Wave 1 gating (YAML unified v2 format, normalized indentation).

