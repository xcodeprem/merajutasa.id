---
id: GUIDANCE-DEC-STYLE-V2
title: DEC Authoring Style Guide v2 (Unified YAML-Only)
date: 2025-08-13T15:25:00Z
status: adopted
class: guidance
supersedes: [GUIDANCE-DOC-DEC-STYLE-V1]
depends_on: []
hash_of_decision_document: "a62354e51d7e71ab71dbed854fbf3cc67a89e234252602060642386d49b403ad"
governance_tags: [style, governance]
decision_summary: >
  Menetapkan format unified YAML-only untuk semua DEC baru (tanpa markdown heading) guna stabilkan hashing & parsing deterministik.
context: >
  Variasi campuran (front-matter + heading) menambah noise hash dan kompleksitas tooling.
specification:
  format: unified_v2
  section_keys_order:
    - id
    - title
    - date
    - class
    - status
    - supersedes
    - depends_on
    - governance_tags
    - related_principles
    - related_files
    - decision_summary
    - context
    - decision
    - rationale
    - scope
    - out_of_scope
    - traceability_matrix
    - metrics | metrics_observation_only
    - risk_assessment
    - implementation_actions
    - review_plan
    - public_communication
    - implications
    - explicit_non_changes
    - non_removal_assertion
    - references
    - signoff
    - hash_of_decision_document
    - integrity_manifest_pointer
    - append_only_notice
    - supersede_policy
    - hash_canonicalization_note
indentation: 2
tabs_allowed: false
placeholder_hash: <PENDING_HASH>
canonicalization:
  algorithm: SHA256
  steps:
    - Replace hash_of_decision_document value with <PENDING_HASH>
    - Normalize line endings (LF)
    - Trim trailing whitespace
    - Hash full bytes
migration:
  legacy_v1_policy: immutable_in_place
  new_dec_policy: must_use_v2
  retro_migration: allowed_only_via_successor_dec
rationale:
  - Kurangi hash churn lintas commit editorial.
  - Simplify parser (YAML -> JSON) tanpa heuristik heading.
  - Mempercepat audit diff (kunci stabil).
implementation_actions:
  - Tandai style guide v1 status superseded.
  - Terapkan format ke DEC-20250813-05..07.
  - Update manifest setelah sealing.
review_plan:
  date_scheduled: 2025-10-01
  success_criteria:
    - 100% DEC baru gunakan unified_v2
    - Parser canonical stable (no order drift)
references:
  - GUIDANCE-DOC-DEC-STYLE-V1
  - DEC-20250813-05
  - DEC-20250813-06
  - DEC-20250813-07
signoff:
  governance_chair: "SIGNED <Farid>"
  documentation_steward: "SIGNED <Farid>"
hash_canonicalization_note: "Hash field diganti placeholder saat perhitungan canonical."
append_only_notice: "Guidance additive; perubahan besar di v3."
---
Unified DEC style guide v2 (YAML-only) – ready for sealing.



