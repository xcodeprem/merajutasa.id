---
id: DEC-20250812-03
title: Activation of principles.reference Lint & Hash Sealing Enforcement Phase 1
date: 2025-08-12T06:22:10Z
class: CIC-A
status: adopted
supersedes: []
depends_on:
  - DEC-20250812-02
scope:
  - Activate lint: principles.reference
  - Enforce Section 37 (Principles Impact Matrix) completeness in PRs
  - Tie hash sealing workflow to manifest spec-hash-manifest-v1.json
  - Escalation path from WARN → DENY for missing / inconsistent principle impact declarations
related_files:
  - docs/governance/lint-principles-reference-spec-v1.md
  - .github/pull_request_template.md
  - docs/integrity/spec-hash-manifest-v1.json
  - docs/principles/GP1-GP10-index.md
related_principles: [GP1, GP2, GP3, GP4, GP5, GP6, GP7, GP8, GP9, GP10]
decision_summary: >
  Mengaktifkan lint principles.reference sebagai guard wajib agar setiap PR yang
  berpotensi memengaruhi prinsip GP1–GP10 secara eksplisit mendeklarasikan dampak & mitigasi
  melalui Section 37 (Principles Impact Matrix) dalam PR template. Menyegel baseline hash
  file governance & fairness dengan mekanisme manifest sehingga drift diam dapat terdeteksi dini.
rationale:
  - Mengurangi risiko “silent erosion” prinsip karena perubahan incremental tanpa deklarasi.
  - Menutup gap integritas sebelum implementasi lanjutan (scripts automation).
  - Meningkatkan auditability: lint mengaitkan heuristik diff → deklarasi eksplisit.
out_of_scope:
  - Penetapan anomaly fairness delta threshold (akan menjadi DEC terpisah).
  - Aktivasi hype.language lint (future DEC).
enforcement_model:
  phases:
    - phase: Phase 0 (Immediate)
      window_hours: 0
      behavior: Lint aktif (WARN untuk PR existing yang belum punya Section 37).
    - phase: Phase 1 (After 48h)
      behavior: ERROR (blok merge) jika pelanggaran kode PRIN-REF-001..009.
    - phase: Phase 2 (After 7d)
      behavior: ERROR plus requirement evidence bundle artifact presence (cross-check Section 27).
fail_conditions:
  - Missing Section 37 table.
  - Heuristic indicates impacted principle but matrix says No (PRIN-REF-002).
  - Impact=Yes tanpa mitigasi (PRIN-REF-003).
  - New ranking-like token & GP9 not Yes (PRIN-REF-004).
  - Parameter fairness change & GP9 not Yes (PRIN-REF-006).
  - PII pattern change & GP1 not Yes (PRIN-REF-009).
hash_sealing:
  requirements:
    - spec-hash-manifest-v1.json must have no <PENDING_HASH> for governance & fairness
      files before Phase 1 escalation.
    - If hash change detected on file with next_change_requires_dec=true and no new DEC
      referencing it → CI FAIL (policy: spec.hash.enforce).
  integration_points:
    - tools/spec-hash-diff.js
    - tools/no-silent-drift.js
    - principles.reference lint consumes manifest to confirm canonical file set.
metrics:
  initial_targets:
    - missing_matrix_rate: 0% by end of Phase 1
    - false_negative_principle_detection: <5%
    - added_field_without_principle_flag incidents: 0
review_plan:
  date_scheduled: 2025-08-19
  success_criteria:
    - All PRs touching fairness/privacy/integrity domains include Section 37 with at least one “Yes” if justified.
    - No unreferenced hash changes.
fallback:
  - If false positive rate >15%, downgrade PRIN-REF-002,004 to WARN pending refinement.
implementation_actions:
  - Append Adoption Addendum to lint-principles-reference-spec-v1.md (no deletion).
  - Update manifest entry dec_ref for lint spec: DEC-20250812-03.
  - Add manifest entry for this DEC file (immutable).
  - CI pipeline: insert new stage after spec-hash-diff & before policy-as-code OPA.
risks:
  - Overblocking due to heuristic noise (mitigation: review heuristics after 7d).
  - Developer friction initial adoption (mitigation: 48h WARN phase).
  - Manifest lag (mitigation: enforce hash fill pre-escalation).
non_removal_assertion:
  - Tidak ada strategi sebelumnya dihapus; seluruh langkah bersifat additive (lint activation + hash sealing).
signoff:
  governance_chair: "SIGNED <Farid>"
  data_lead: "SIGNED <Farid>"
  ethics_representative: "SIGNED <Farid>"
  product_owner: "SIGNED <Farid>"
hash_of_decision_document: "a4e90575f4c26aa8b2497b93ad0eb03f90788d66e4f06836f1039cf3072efe9e"  # sealed SHA256
integrity_manifest_pointer: "docs/integrity/spec-hash-manifest-v1.json#files[path=docs/governance/dec/DEC-20250812-03-principles-reference-activation.md]"
supersede_policy: "Future refinements (thresholds / additional rules) require new DEC referencing this id."
append_only_notice: "This DEC file is immutable; changes require a successor DEC."
---
Activation DEC for principles.reference lint. No prior governance strategy removed.
