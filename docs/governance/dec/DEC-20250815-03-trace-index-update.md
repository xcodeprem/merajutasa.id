---
id: DEC-20250815-03
title: Trace Index Hash Adoption
date: 2025-08-15T00:00:00Z
class: CIC-C
status: draft
supersedes: []
depends_on: []
scope:
  - Adopt updated docs/governance/trace/archive-trace-index-v1.md content and seal its new hash in the integrity manifest.
non_removal_assertion: "Tidak menghapus keputusan sebelumnya; hanya menyelaraskan hash dengan konten terkini."
---

Summary

Mengadopsi konten terkini dari `docs/governance/trace/archive-trace-index-v1.md` dan merekam hash barunya di `docs/integrity/spec-hash-manifest-v1.json` di bawah referensi DEC ini.

Context

- Problem: Trace index berubah sejak hash terakhir disegel; verifikasi manifest menandai mismatch yang memerlukan DEC.
- Evidence: Lihat berkas `docs/governance/trace/archive-trace-index-v1.md` (pembaharuan pemetaan arsip).

Options

1. Adopt current (dipilih)

- Pros: Selaraskan manifest dengan keadaan repo; bersihkan kegagalan verifikasi dengan jejak governance.
- Cons: Perlu pengakuan governance.

1. Revert

- Pros: Tidak perlu update governance.
- Cons: Menghapus suntingan terkini.

Decision

- Chosen: adopt-current
- Rationale: Perubahan editorial/organisasional dan meningkatkan keterlacakan; adopsi sesuai.
- Principles alignment: [GP1, GP2]

Policy changes

- ID: governance.trace.index — Terima konten terkini dan catat hash baru di integrity manifest.

Implementation

- Owner: governance
- Milestones:
  - [ ] Update manifest hash untuk `docs/governance/trace/archive-trace-index-v1.md` (di bawah DEC ini)
  - [ ] Jalankan verifikasi spec-hash sampai PASS

Audit

- Trace artifact: `docs/governance/trace/archive-trace-index-v1.md`
- Checksum: `sha256:f03a7e5d2e96427d87a85b17b334b4a3e918f8d3893a88dd83f0ffcc0b976d41`
- Review window: 30 hari

Integrity

- integrity_manifest_pointer: "docs/integrity/spec-hash-manifest-v1.json#files[path=docs/governance/trace/archive-trace-index-v1.md]"
- append_only_notice: "File immutable; perubahan memerlukan DEC penerus."

Notes

- N/A
