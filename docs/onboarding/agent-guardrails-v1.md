# Agent Guardrails v1 (Bootstrap Readiness)

status: draft
scope: repository automation agents (hash maintenance, evidence generation, advisory remediation)
anchor_manifest_path: docs/integrity/spec-hash-manifest-v1.json
parent_policies: agent-role-policy-v1.md, evidence-minimum-phase1.5-v1.md, policy-index-v1.md

## 1. Purpose

Menetapkan batas eksplisit untuk aktivasi awal agen otomatis sehingga integritas (hash ledger), fairness (non‑ranking), privacy (PII minimization), dan anti-hype tetap terjaga saat sebagian kontrol masih dalam fase bootstrap (misal disclaimers lint presence enforcement belum ON penuh).

## 2. Operational Scope (Allowed Actions)

Agen boleh melakukan aksi berikut secara otomatis tanpa DEC baru selama aturan dipatuhi:

- Generate / refresh evidence artifacts: `spec-hash-diff.json`, `governance-verify-summary.json`, `evidence-freshness.json`, `hype-lint.json`, `principles-impact.json`, `param-integrity.json`, `no-silent-drift.json`.
- Update manifest hashes HANYA ketika (a) file berubah dan (b) `next_change_requires_dec=false` ATAU perubahan adalah strictly append-only sesuai `mutable_policy` dan tidak mengubah konten historis.
- Append bagian baru ke file dengan `mutable_policy=append-only` (tidak menghapus / memodifikasi baris lama).
- Membuat file audit / recap baru bertimestamp (status recap, audit capture) tanpa mengubah file recap lama.
- Menandai PR dengan label advisory (misal `evidence:stale`, `hash:mismatch`) berdasar hasil alat bukti.

## 3. Forbidden / Escalation Required Actions

Memerlukan DEC baru atau manual maintainer review:

| Code | Aksi | Alasan | Escalation |
|------|------|--------|------------|
| G1 | Mengubah konten file `immutable` | Melanggar integritas sejarah | DEC referensi atau revert |
| G2 | Mengedit baris existing pada file `append-only` | Risiko rewrite narasi / trace | Manual review + commit message annotate |
| G3 | Menambahkan parameter fairness baru tanpa DEC | Parameter governance | New DEC referencing hysteresis adoption |
| G4 | Mengaktifkan enforcement disclaimers lint (presence_enforcement=true) | Perlu DEC aktivasi | DEC khusus setelah baseline coverage |
| G5 | Menghapus temuan hype lint tanpa perubahan konten underlying | Trust theater | Manual justification comment |
| G6 | Memasukkan istilah ranking/hype baru | Pelanggaran GP6/GP7 | Block PR + alert |
| G7 | Menambah field schema (credential/event) | Spec version bump & DEC | DEC + semver update |
| G8 | Mengubah config hysteresis | Impact fairness output | DEC referencing Option F history |
| G9 | Menyentuh file `decision` yang sudah sealed | Governance tampering | Hard deny |
| G10 | Menulis hash manifest entry yang tidak cocok dengan konten file | Hash poisoning | Block + alert |
| G11 | Mengubah agent-role-policy tanpa DEC | Mengubah batas mandat | DEC |
| G12 | Mengurangi bukti minimal (evidence-minimum) | Governance weakening | DEC |

## 4. Advisory Tolerances (Bootstrap Window)

Selama bootstrap, beberapa pelanggaran diperlakukan sebagai advisory (tidak memblok) namun dilabeli:

| Signal | Condition | Label | Escalation Clock |
|--------|-----------|-------|------------------|
| disclaimers-lint ERROR | errors>0 | `disc:advisory` | 30 hari atau saat coverage >=80% |
| hype-lint HIGH <=9 dan stabil | max_severity=HIGH & HIGH<=baseline(9) | `hype:within-baseline` | Re-evaluate mingguan |
| evidence freshness borderline | stale<=2 & missing=0 | `evidence:refresh-soon` | 24h |

## 5. Integrity Safeguards

- Double-hash check: Agen wajib recompute hash sebelum menulis manifest; mismatch post-write → revert + alert.
- Idempotent writes: Tidak commit jika konten target identik.
- Append-only validator: Diff parser memastikan hanya tambahan baris di akhir (atau section baru) untuk file append-only.
- Hash race avoidance: Pull latest main sebelum melakukan manifest update; re-run diff; abort jika divergen.

## 6. Logging & Transparency

Setiap aksi agen menghasilkan log ringkas (JSON) `artifacts/agent-action-log-<date>.json` berisi: timestamp, action_type, target_path, hash_before, hash_after, policy_checklist(pass/fail). File ini append-only & hashed via manifest bila stabil.

## 7. Failsafe & Rollback

Trigger rollback otomatis jika: (a) spec-hash-diff menunjukkan >0 violations pasca commit agen, (b) governance-verify summary berubah dari PASS ke FAIL pada kategori non-advisory, (c) evidence freshness overall != PASS.
Rollback = revert commit + file `artifacts/rollback-<timestamp>.txt` ringkas root cause.

## 8. Activation Criteria for Stricter Mode

Stricter mode (Phase 2) dapat diaktifkan (presence_enforcement=true untuk disclaimers, hype-lint HIGH=0 requirement) setelah:

- 0 hash violations selama 14 hari berturut.
- Disclaimers coverage missingIds <5 (lihat metrics summary).
- Hype-lint HIGH findings <=3 konsisten 7 hari.
- Evidence freshness PASS 95% hari (≤5% transient staleness).
Agen tidak boleh mengaktifkan sendiri; memerlukan DEC.

## 9. Security & Secret Handling

Agen tidak menulis atau menampilkan secrets; environment var whitelist: `DISC_BOOTSTRAP`, `CI`, `GIT_SHA`. Semua lainnya diblok (fail-fast).

## 10. Monitoring Hooks

- Daily scheduled run: governance-verify + freshness + param-integrity.
- Weekly trend summary (counts of violations) → appended ke `artifacts/agent-trend-summary.json`.

## 11. Change Control for This File

`agent-guardrails-v1.md` adalah append-only sampai ratifikasi DEC; perubahan struktural memerlukan DEC yang menambahkan `dec_ref` di manifest.

## 12. Next Steps (Non-Automatable yet)

- Formal disclaimers coverage instrumentation (UI extraction) sebelum enforcement uplift.
- PII scanner integration artifact hashing.
- Signature pipeline implementation (S0→S1) setelah adoption DEC finalize.

END.
