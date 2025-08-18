---
id: DEC-20250813-07
title: Hype Threshold Transition (Segmentation & Hard Gate Alignment)
date: 2025-08-13T14:00:00Z
class: CIC-C
status: adopted
supersedes: []
depends_on:
   - DEC-20250813-05
   - DEC-20250813-04
governance_tags: [hype, thresholds, fairness]
related_principles: [GP1, GP2, GP6, GP7, GP9]
related_files:
   - artifacts/hype-lint.json
   - tools/hype-lint.js
   - docs/integrity/gating-policy-v1.json
decision_summary: >
   Standarkan transisi pengukuran hype: pisah HIGH (hard gate=0) vs MEDIUM (observational) untuk fokus mitigasi & kurangi noise.
context: >
   Volume medium tinggi menyebabkan noise bila di-hard gate serentak; high sedikit namun sinyal kuat -> segmentasi.
decision:
   - "Definisikan hype_high (hard=0) & hype_medium (observational). Baseline: high=0-9, medium=116."
   - "Wave 1: gate hanya high; medium dicatat untuk baseline & perencanaan reduksi."
   - "Update gating policy untuk field segmentasi tanpa ubah fairness lainnya."
   - "Hipotesis: zero high mempercepat deteksi regresi."
rationale:
   - Hindari false urgency.
   - Prioritaskan high-impact terms.
   - Menyiapkan target reduksi medium bertahap.
metrics:
   baselines:
      hype_high: 9
      hype_medium: 116
      directive_usage_lines: 0
   day0_post_directive:
      hype_high: 1
      hype_medium: 101
      directive_usage_lines: 12
   targets_review:
      hype_high: 0
      hype_medium: 80
      directive_usage_lines: 25
   stretch:
      hype_high: 0
      hype_medium: 40
      directive_usage_lines: 20
risk_assessment:
  - item:
     id: R-HYPE-01
     risk: Directive misuse hides real hype
     mitigation: Sample audit & cap density
  - item:
     id: R-HYPE-02
     risk: Medium stagnates >100
     mitigation: Expand lexical patterns; tighten post-review
  - item:
     id: R-HYPE-03
     risk: False positives remain HIGH
     mitigation: Negated-context heuristics
  - item:
     id: R-HYPE-04
     risk: Threshold tightening delayed
     mitigation: Time-bound review date & successor requirement
implementation_actions:
   - Update gating-policy (hype_high_max & hype_medium tracking fields)
   - Modify hype-lint.js directives parsing
   - Extend no-silent-drift.js aggregator high vs medium
   - Add telemetry column directive usage
   - Prepare successor DEC template
review_plan:
   date_scheduled: 2025-09-05
   focus: Sustain 0 high & target medium reduction
public_communication: "Segmentasi hype aktif: HIGH wajib 0 (blocking), MEDIUM dilacak (observational)."
references:
   - DEC-20250813-05
   - Gating policy JSON
   - Hype lint tool
hash_of_decision_document: "578782e6bc0c71a62eea7b1c905deb3fd0e77fa54fe3510a8ad5d198a34541a2"
hash_canonicalization_note: "Nilai hash digantikan placeholder saat canonical compute."
append_only_notice: "Immutable setelah hash terpasang."
signoff:
   governance_chair: "SIGNED <Farid>"
   data_lead: "SIGNED <Farid>"
   ethics_representative: "SIGNED <Farid>"
   product_owner: "SIGNED <Farid>"
---
Hype segmentation transition (YAML unified v2 format).
