---
id: GUIDANCE-DEC-STYLE-V3
title: DEC Authoring Style Guide v3 (Markdown Canonical with Front Matter)
date: 2025-08-15T12:00:00Z
class: guidance
status: published
supersedes: [GUIDANCE-DEC-STYLE-V2]
depends_on: []
governance_tags: [style, governance]
decision_summary: >
  Menetapkan Markdown (.md) sebagai format kanonik untuk semua DEC baru, dengan front matter YAML sebagai metadata dan isi terstruktur heading.
canonicalization:
  algorithm: SHA256
  front_matter_keys_order:
    - id
    - title
    - date
    - class
    - status
    - supersedes
    - depends_on
    - governance_tags
    - decision_summary
  body_sections_order:
    - Summary
    - Context
    - Options
    - Decision
    - Policy changes
    - Implementation
    - Audit
    - Integrity
    - Notes
  hashing_steps:
    - Replace any explicit hash fields with <PENDING_HASH> in source before hashing
    - Normalize line endings to LF
    - Trim trailing whitespace
    - Hash full bytes of the file
migration:
  from_v2_yaml:
    approach: "Tambahkan file .md baru yang merepresentasikan keputusan yang sama; tautkan di YAML lama bila masih ada; YAML boleh dihapus setelah MD aktif."
    dec_id_preservation: "ID DEC tetap sama."
    generator: "Gunakan tools/dec-template-create.cjs (default .md)."
rationale:
  - Konsisten dengan konvensi repo lainnya (docs berbasis MD) dan memudahkan pembacaan manusia.
  - Front matter menjaga determinisme metadata; isi berheading mudah dilint & diindeks.
  - Mengurangi kebingungan antara .yml vs .md serta meminimalkan friction tooling.
implementation_actions:
  - Gunakan pola nama: `DEC-YYYYMMDD-XX.md`.
  - Gunakan template: `docs/governance/dec/templates/DEC-template-v1.md`.
  - Generator: `npm run dec:new` (default menghasilkan .md).
  - Jika sebelumnya ada file .yml untuk DEC yang sama, hapus setelah MD tersedia dan referensi diperbarui.
review_plan:
  date_scheduled: 2025-10-01
  success_criteria:
    - 100% DEC baru menggunakan .md dengan front matter.
    - Tidak ada lint error struktural pada DEC baru.
append_only_notice: "Guidance additive; style perubahan besar selanjutnya di v4."
---

DEC Style Guide v3 ini menetapkan MD sebagai sumber kanonik. Contoh struktur:

```markdown
---
id: DEC-YYYYMMDD-XX
title: Decision title
date: 2025-01-01T00:00:00Z
class: CIC-C
status: draft
supersedes: []
depends_on: []
---

Summary

Ringkasan satu kalimat.

Context

- Problem: ...
- Evidence: ...

Options

1. Option A

- Pros: ...
- Cons: ...

1. Option B

- Pros: ...
- Cons: ...

Decision

- Chosen: option-a
- Rationale: ...
- Principles alignment: [GP1, GP2]

Policy changes

- ID: policy-id-or-path — ...

Implementation

- Owner: ...
- Milestones:
  - [ ] M1
  - [ ] M2

Audit

- Trace artifact: path/to/file
- Checksum: sha256:...
- Review window: 30 days

Integrity

- integrity_manifest_pointer: "docs/integrity/spec-hash-manifest-v1.json#files[path=<path>]"
- append_only_notice: "File immutable; perubahan memerlukan DEC penerus."

Notes

- N/A
```
