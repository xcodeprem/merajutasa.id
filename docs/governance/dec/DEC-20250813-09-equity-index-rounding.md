---
id: DEC-20250813-09
title: Equity Index Rounding Precision (2 Decimal Truncation Standard)
date: 2025-08-13T16:12:00Z
class: CIC-B
status: draft
supersedes: []
depends_on:
  - DEC-20250812-04  # DB-04 decimals:2 ratified baseline
governance_tags: [fairness, metrics]
related_principles: [GP5, GP6, GP8]
related_files:
  - docs/governance/dec/DEC-20250812-04-governance-baseline-thresholds.md
  - tools/fairness-sim.js
decision_summary: >
  Menetapkan standard final rounding/truncation equity_index ke 2 decimal places (round half-up) sebelum persist & publikasi untuk konsistensi & menghindari false precision.
context: >
  Baseline DEC mencatat decimals:2 namun implement detail (round vs truncate) perlu eksplisit guna mencegah drift & mismatch audit manual.
decision:
  equity_index_precision:
    decimals: 2
    method: round_half_up
    negative_handling: clamp_min_0  # guard; formula seharusnya >=0
    formatting_locale: en-US
rationale:
  - Audit readability (±0.01 resolusi cukup untuk tren awal).
  - Meminimalkan representational noise antar snapshot.
  - Half-up konsisten dengan ekspektasi non-bank domain.
scope:
  - Output snapshot JSON field equity_index.
out_of_scope:
  - Internal high precision intermediate calculations.
traceability_matrix:
  - parameter: numeric_sampling_truncation_decimals
    source: DB-04
    status: unchanged (reinforced)
metrics_observation_only:
  - name: rounding_diff_max
    definition: "Max |raw_equity_index - rounded_equity_index| selama 30 hari"
    target: < 0.005
risk_assessment:
  risks:
    - id: R-EQ-ROUND-01
      risk: Perbedaan manual reviewer memakai truncate bukan half-up.
      mitigation: Dok dokumentasi & unit test sample table.
implementation_actions:
  - Tambah util rounding di fairness-sim & snapshot script.
  - Unit test 10 sample raw values membandingkan expected.
  - Update methodology snippet menjelaskan precision.
review_plan:
  date_scheduled: 2025-09-15
  success_criteria:
    - Semua snapshot baru field equity_index dua decimal.
    - rounding_diff_max tercatat <0.005.
public_communication: "Equity index ditampilkan dengan 2 desimal untuk konsistensi; perhitungan internal memakai presisi lebih tinggi."
implications:
  - Perbandingan antar hari lebih stabil.
explicit_non_changes:
  - Tidak mengubah rumus equity index (1 - Gini). 
non_removal_assertion: "Tidak menghapus strategi fairness; hanya menentukan representasi output."
references:
  - fairness methodology (snapshot formula)
signoff:
  governance_chair: PENDING
  data_lead: PENDING
  ethics_representative: PENDING
hash_of_decision_document: "0485aec829b32e77a144d085a0b388c8fc5b74620dfe978874702df7723da698"
integrity_manifest_pointer: <ADD_ON_SEAL>
append_only_notice: "Immutable; successor DEC required for changes."
supersede_policy: none
hash_canonicalization_note: "Hash placeholder digunakan saat hashing."
---

Draft DEC specifying equity index rounding implementation standard.
