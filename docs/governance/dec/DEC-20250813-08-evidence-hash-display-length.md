---
id: DEC-20250813-08
title: Evidence Hash Display Length Confirmation (UI Prefix Policy)
date: 2025-08-13T16:10:00Z
class: CIC-C
status: draft
supersedes: []
depends_on:
  - DEC-20250812-04   # baseline thresholds DEC containing DB-02 preliminary value
governance_tags: [integrity, ui, evidence]
related_principles: [GP1, GP6, GP7]
related_files:
  - docs/governance/dec/DEC-20250812-04-governance-baseline-thresholds.md
  - tools/evidence-bundle.js
decision_summary: >
  Mengonfirmasi adopsi panjang tampilan hash evidence = 16 hex chars (8 byte prefix) non-breaking, mempertahankan hash penuh untuk verifikasi.
context: >
  DB-02 menetapkan recommendation display_len=16 namun masih labelled Phase 1. DEC ini memindahkan status menjadi adopted policy agar UI & tooling konsisten dan mencegah drift (misal variasi 24 vs 16).
decision:
  display_length_hex: 16
  collision_risk_note: "Collision probability untuk 8-byte prefix << 10^-9 pada volume <1M artifacts."
  full_hash_storage: true
  ui_badge_truncation_indicator: "…"  # appended to prefix for clarity
rationale:
  - 16 hex cukup membedakan secara visual serta ringkas di layout kompak.
  - Menjaga hash penuh memitigasi risiko verifikasi eksternal.
  - Menstandarkan test vector & screenshot bukti.
scope:
  - Hanya mempengaruhi rendering UI & ringkas di report (bukan nilai canonical hashing).
out_of_scope:
  - Perubahan algoritma hashing.
traceability_matrix:
  - parameter: evidence_hash_display_len
    source: DB-02
    previous_status: recommendation_only
    new_status: adopted
    enforcement: immediate
metrics_observation_only:
  - name: evidence_prefix_collision_incident
    definition: "Jumlah insiden dua artifact berbeda berbagi 16-hex prefix yang membingungkan pengguna."
    target: 0
risk_assessment:
  risks:
    - id: R-HASH-UI-01
      risk: Potensi misread pengguna mengira 16 hex = full hash.
      mitigation: Tooltip "Prefix (8 bytes) – full hash tersedia di detail".
implementation_actions:
  - Update evidence-bundle renderer memotong hash hingga 16 chars + '…'.
  - Tambah unit test memastikan prefix length benar & full hash tersimpan.
  - Update dokumentasi verifikasi (CLI) jelaskan perbedaan prefix vs full.
review_plan:
  date_scheduled: 2025-09-01
  success_criteria:
    - 100% tampilan evidence memakai 16 + ellipsis.
    - Tidak ada laporan kebingungan (feedback tag integrity_confusion).
public_communication: "Kami menampilkan hash bukti secara ringkas (16 hex) demi keterbacaan; hash lengkap tetap tersedia untuk verifikasi independen."
implications:
  - Stabilitas snapshot UI.
explicit_non_changes:
  - Tidak mengubah hash komputasi underlying.
non_removal_assertion: "Tidak menghapus keputusan sebelumnya; hanya mengkonfirmasi status display length."
references:
  - DEC-20250812-04
signoff:
  governance_chair: PENDING
  product_owner: PENDING
  security_reviewer: PENDING
hash_of_decision_document: "923da62bad7eebca7ea9df99d1481b043f9d58395cdb1a56f9009390de5dab14"
integrity_manifest_pointer: <ADD_ON_SEAL>
append_only_notice: "Immutable; perubahan butuh DEC penerus."
supersede_policy: none
hash_canonicalization_note: "Hash diganti placeholder saat perhitungan."
---

Draft DEC confirming evidence hash prefix length.
