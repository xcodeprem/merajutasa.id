---
id: DEC-20250813-10
title: Canonical Feedback Categories Adoption (Governance/Improvement/Fairness/Other)
date: 2025-08-13T16:14:00Z
class: CIC-B
status: draft
supersedes: []
depends_on: []
governance_tags: [feedback, taxonomy, privacy]
related_principles: [GP2, GP5, GP7, GP9]
related_files:
  - docs/roadmap/roadmap-master-v1.md
  - tools/observability-metrics.js
decision_summary: >
  Mengadopsi set kanonik 4 kategori feedback: governance, improvement, fairness, other — untuk konsistensi agregasi & analisa awal.
context: >
  Roadmap H0/H1 memerlukan storage schema & heuristik kategorisasi awal. Tanpa DEC eksplisit, risiko drift label & sulit trace KPI.
decision:
  categories:
    - governance
    - improvement
    - fairness
    - other
  storage_field: feedback_submissions.categories[]
  multi_select_allowed: true
  empty_category_policy: assign_other
  pii_interaction: categories unaffected by redaction
rationale:
  - Minimal namun mencakup spektrum fairness & operasional.
  - Memudahkan roll-up & anomaly detection kategori.
  - Menghindari over-fitting awal sebelum volume bukti cukup.
scope:
  - Backend schema & ingestion pipeline mapping.
out_of_scope:
  - Sentiment scoring (future).
traceability_matrix:
  - parameter: feedback_categories_canonical
    status: adopted
metrics_observation_only:
  - name: category_distribution_entropy
    definition: "Shannon entropy distrib kategori 30d"
    target: monitor_only
risk_assessment:
  risks:
    - id: R-FEED-01
      risk: Kategori "other" mendominasi >60% → sinyal granular rendah.
      mitigation: Tambah subcategory DEC lanjutan jika persist 30d.
implementation_actions:
  - Update DB migration tambah enum validation list.
  - Heuristik keyword mapping commit (docs). 
  - Unit test ingestion multi-category & fallback other.
review_plan:
  date_scheduled: 2025-09-05
  success_criteria:
    - ≥70% submissions terklasifikasi bukan hanya other setelah 30d.
public_communication: "Kami mengelompokkan feedback ke 4 kategori untuk respons lebih cepat & transparan."
implications:
  - Konsistensi laporan agregat.
explicit_non_changes:
  - Tidak memperkenalkan ranking pada feedback.
non_removal_assertion: "Tidak menghapus strategi sebelumnya; hanya menetapkan kategori dasar."
references:
  - roadmap deliverable H0-G1, H1-G1
signoff:
  governance_chair: PENDING
  product_owner: PENDING
  privacy_lead: PENDING
hash_of_decision_document: <PENDING_HASH>
integrity_manifest_pointer: <ADD_ON_SEAL>
append_only_notice: "Immutable; perubahan perlu DEC penerus."
supersede_policy: none
hash_canonicalization_note: "Placeholder digunakan saat hashing."
---

Draft DEC adopting canonical feedback category taxonomy.
