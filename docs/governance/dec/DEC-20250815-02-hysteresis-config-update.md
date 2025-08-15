---
id: DEC-20250815-02
title: Hysteresis Config Hash Adoption
date: 2025-08-15T00:00:00Z
class: CIC-C
status: draft
supersedes: []
depends_on:
  - DEC-20250812-02
scope:
  - Adopt updated docs/fairness/hysteresis-config-v1.yml content and seal its new hash in the integrity manifest.
non_removal_assertion: "Tidak menghapus keputusan sebelumnya; hanya menyelaraskan hash dengan konten terkini."
---

Summary

Mengadopsi konten terkini dari `docs/fairness/hysteresis-config-v1.yml` dan merekam hash barunya di `docs/integrity/spec-hash-manifest-v1.json` di bawah referensi DEC ini.

Context

- Problem: Hysteresis config berubah sejak hash terakhir disegel; verifikasi manifest menandai mismatch yang memerlukan DEC.
- Evidence: Lihat berkas `docs/fairness/hysteresis-config-v1.yml` (penyesuaian/klarifikasi parameter).

Options

1. Adopt current (dipilih)

- Pros: Selaraskan manifest dengan keadaan repo; bersihkan kegagalan verifikasi dengan jejak governance.
- Cons: Perlu pengakuan governance.

1. Revert

- Pros: Tidak perlu update governance.
- Cons: Menghapus suntingan terkini.

Decision

- Chosen: adopt-current
- Rationale: Perubahan bersifat disengaja dan selaras dengan governance roadmap; adopsi mempertahankan keterlacakan yang akurat.
- Principles alignment: [GP1, GP2]

Policy changes

- ID: fairness.hysteresis.params.lock — Terima konten/parameter terkini dan catat hash baru di integrity manifest.

Implementation

- Owner: governance
- Milestones:
  - [ ] Update manifest hash untuk `docs/fairness/hysteresis-config-v1.yml` (di bawah DEC ini)
  - [ ] Jalankan verifikasi spec-hash sampai PASS

Audit

- Trace artifact: `docs/fairness/hysteresis-config-v1.yml`
- Checksum: `sha256:488e520591f6d68c6f56814d53bcae525816e2d9814549132262afa781f589ed`
- Review window: 30 hari

Integrity

- integrity_manifest_pointer: "docs/integrity/spec-hash-manifest-v1.json#files[path=docs/fairness/hysteresis-config-v1.yml]"
- append_only_notice: "File immutable; perubahan memerlukan DEC penerus."

Notes

- N/A
