---
id: DEC-20250813-02
title: Signature Pipeline Adoption (Phased Ed25519 Evidence Signing)
date: 2025-08-13T00:00:00Z
class: CIC-E
status: draft
related_requirements: [4.4]
hash_of_decision_document: "0ca785fe0c26e8053b644cc0c582abb461c851e7aafb621d5d6364729db66ff0"
spec_reference:
  - docs/governance/signature-pipeline-plan-v1.md
  - artifacts/evidence-bundle.json
phases:
  - phase: S0
    label: Plan
    criteria: Design doc merged & DEC draft present
  - phase: S1
    label: Dry Run
    criteria: Key pair generated; signatures file produced; verify script PASS
  - phase: S2
    label: Enforced Core
    criteria: Sign A1,A2,A8; governance:verify fails on mismatch
  - phase: S3
    label: Full Evidence
    criteria: All Phase 1.5 artifacts signed; lints + sim included
  - phase: S4
    label: Chain Extension
    criteria: Credential/event signing integrated
rationale:
  - Extend integrity beyond static hash manifest.
  - Prevent silent tampering / omission of evidence artifacts.
  - Phased rollout reduces operational & key risk.
risks:
  - key_compromise
  - improper_rotation
  - signing_tool_bug
mitigations:
  - rotation_DEC_template
  - dual_sign_window
  - deterministic_canonicalization_tests
activation_conditions:
  - Phase1.5 evidence completeness (A1–A8 present & validated)
  - evidence-bundle.json generated (stable bundle hash)
non_goals:
  - multi-sig quorum (initial)
  - HSM custody (initial)
actions_next:
  - Implement keygen & sign scripts (feature flag)
  - Append manifest entries for plan & DEC
  - Produce initial advisory signatures
review_plan:
  review_window_days: 7
  adoption_target: 2025-08-20
signoff:
  governance_chair: "PENDING"
  integrity_lead: "PENDING"
integrity_manifest_pointer: "docs/integrity/spec-hash-manifest-v1.json#files[id=DEC-20250813-02-signature-pipeline-adoption]"
---

Draft DEC. Any modification post-adoption requires new DEC superseding this id.
