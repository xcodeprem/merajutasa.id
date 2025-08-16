---
id: DEC-20250813-04
title: Editorial Normalization & Disclaimers Whitelist Alignment (Batch 1)
date: 2025-08-13T00:00:00Z
class: CIC-C
status: adopted-pending-hash
supersedes: []
depends_on: [DEC-20250812-02, DEC-20250812-03, DEC-20250813-03]
spec_reference:
  - docs/governance/disclaimers-lint-spec-v1.md
  - docs/integrity/credential-schema-final-v1.md
  - README.md
  - docs/faq/faq-fairness-hysteresis-update.md
  - docs/fairness/hysteresis-public-methodology-fragment-v1.md
related_principles: [GP1, GP5, GP6, GP7, GP9]
impacted_components: [disclaimers_lint, credential_schema, fairness_public_narrative, faq, readme]
hash_of_decision_document: "e6f4abe53178c6dcac31b9fba5b53c6f822f36f949fce8b6df934007af9770bd" # sealed SHA256 canonical
non_removal_assertion: "Tidak menghapus strategi atau parameter; hanya normalisasi teks & whitelist anti false-positive."
append_only_notice: "File immutable setelah hash seal; perubahan baru memerlukan DEC penerus."
change_batch:
  rationale: >-
    Menggabungkan penyesuaian redaksional kecil (penambahan blok disclaimer, klarifikasi anti-ranking,
    dan whitelist konteks negasi) yang diperlukan untuk menurunkan false positive lint tanpa mengubah arti kebijakan.
  files:
    - path: README.md
      change: Add canonical disclaimer embedding & clarify non-ranking guidance (negated phrasing preserved)
      semantic_change: false
    - path: docs/faq/faq-fairness-hysteresis-update.md
      change: Normalize question phrasing & embed disclaimers block
      semantic_change: false
    - path: docs/integrity/credential-schema-final-v1.md
      change: Add negative-context wording (no ranking penalty) + disclaimer block alignment
      semantic_change: false
    - path: docs/fairness/hysteresis-public-methodology-fragment-v1.md
      change: Embed canonical D1 block (presence)
      semantic_change: false
    - path: docs/governance/disclaimers-lint-spec-v1.md
      change: Reflect whitelist mechanism & safe-context attribute note
      semantic_change: false
    - path: docs/transparency/changelog-excerpt-phase1.5.md
      change: Add disclaimer block
      semantic_change: false
    - path: docs/governance/policy-index-v1.md
      change: Reference activation & presence enforcement update
      semantic_change: false
    - path: content/disclaimers/config.yml
      change: Introduce banned_phrase_safe_contexts list
      semantic_change: false
risk_assessment:
  risks:
    - id: R-EDIT-01
      risk: Editorial batching hides unintended semantic drift
      mitigation: Line diff review + similarity lint (D1) PASS
    - id: R-EDIT-02
      risk: Whitelist too broad enabling real claim slip-through
      mitigation: Contextual regex narrow (negation / explanation only) + future audit
verification:
  lint_artifacts_checked: [artifacts/disclaimers-lint.json]
  result: PASS (0 errors; warnings expected scope/duplicate)
review_plan:
  date_scheduled: 2025-08-20
  focus: Ensure no regression in banned phrase detection precision
signoff:
  governance_chair: "<PENDING>"
  ethics_representative: "<PENDING>"
  product_owner: "<PENDING>"
  engineering_lead: "<PENDING>"
integrity_manifest_pointer: "docs/integrity/spec-hash-manifest-v1.json#files[id=DEC-20250813-04-text-normalization-disclaimers-whitelist]"
---

This DEC documents purely editorial + lint whitelist alignment updates. No thresholds, parameters, or governance constraints were altered.
