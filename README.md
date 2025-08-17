# MerajutASA Governance

[![CI Guard (H1)](https://github.com/codingxdev0/merajutasa.id/actions/workflows/ci-guard.yml/badge.svg)](https://github.com/codingxdev0/merajutasa.id/actions/workflows/ci-guard.yml)
[![H1 Guard & KPI](https://github.com/codingxdev0/merajutasa.id/actions/workflows/h1-guard.yml/badge.svg)](https://github.com/codingxdev0/merajutasa.id/actions/workflows/h1-guard.yml)
[![Deploy Pages (Dashboard Snapshots)](https://github.com/codingxdev0/merajutasa.id/actions/workflows/pages.yml/badge.svg)](https://github.com/codingxdev0/merajutasa.id/actions/workflows/pages.yml)
[![Changelog Excerpt](https://img.shields.io/badge/changelog-excerpt-blue)](https://codingxdev0.github.io/merajutasa.id/changelog.html)

**Governance & integrity tooling for MerajutASA.id - A comprehensive skill credentialing platform with fairness, transparency, and cryptographic integrity.**

Live dashboard (GitHub Pages): [codingxdev0.github.io/merajutasa.id](https://codingxdev0.github.io/merajutasa.id/)

## Quick Start

### Prerequisites

- Node.js LTS (v18+)
- npm or yarn

### Installation & Verification

```bash
# Clone repository
git clone https://github.com/codingxdev0/merajutasa.id.git
cd merajutasa.id

# Install dependencies
npm install

# Verify governance integrity
npm run governance:verify

# Run test suite
npm run test:all

# Start core services (optional)
npm run service:signer &    # Port 4601
npm run service:chain &     # Port 4602  
npm run service:collector & # Port 4603
```

### Key Commands

```bash
# Governance & Integrity
npm run governance:verify     # Complete governance check
npm run spec-hash:verify     # Hash integrity verification
npm run param:integrity      # Parameter consistency check

# Testing
npm run test:governance      # Core governance tests
npm run test:services       # Service integration tests  
npm run test:all            # Complete test suite

# Evidence & Analysis
npm run evidence:bundle      # Generate evidence bundle
npm run gap-analysis         # Identify system gaps
npm run fairness:sim        # Fairness simulation

# Gate Verification (Roadmap Milestones)
npm run gate:1              # Gate 1 verification (Public Soft Launch)
npm run gate:2              # Gate 2 verification (Expanded Transparency)
```

## Documentation

- **[CLI Verification Guide](docs/integrity/verify-cli-doc-draft.md)** - Manual verification steps
- **[API Documentation](docs/api/README.md)** - Service integration guide  
- **[Governance Overview](docs/governance/)** - Decision processes and policies
- **[Fairness Methodology](docs/fairness/)** - Equity and fairness measures
- **[Roadmap](docs/roadmap/roadmap-master-v1.md)** - Development roadmap

## Architecture

### Core Services

- **Signer Service** (4601) - Ed25519 cryptographic signing
- **Chain Service** (4602) - Hash chain integrity management  
- **Event Collector** (4603) - Event ingestion and validation

### Governance Tools

- **Hash Integrity** - Content drift detection and sealing
- **Parameter Integrity** - Governance parameter consistency
- **DEC Lint** - Decision document validation
- **Evidence Validation** - Artifact integrity verification

### Quality Assurance

- **Test Coverage** - 27 test files covering critical functionality
- **Gap Analysis** - Automated system readiness assessment  
- **Continuous Integration** - Automated governance verification

## Current Status

<!-- STATUS:BEGIN -->

- **A8 (no-silent-drift)**: ADVISORY
- **Spec Hash**: PASS
- **Security Smoke**: PASS
- **Overall Governance**: PASS

*Last updated: 2025-08-16T18:38:20.476Z*

<!-- STATUS:END -->

## Operator docs

- Phase Tracker PR automation: see `docs/governance/phase-tracker-ops.md` for PAT setup and skip behavior.

## GitHub Pages (Dashboard Snapshots)

- Workflow `Deploy Pages (Dashboard Snapshots)` publishes the minimal equity UI and latest JSON artifacts under GitHub Pages.
- Node services do not run on Pages; only read-only JSON + UI.

Permanent links:

- Dashboard: <https://codingxdev0.github.io/merajutasa.id/>
- Snapshots index: <https://codingxdev0.github.io/merajutasa.id/snapshots.html>
- Data JSON (direct):
  - KPI Summary: <https://codingxdev0.github.io/merajutasa.id/data/h1-kpi-summary.json>
  - Weekly Trends: <https://codingxdev0.github.io/merajutasa.id/data/weekly-trends.json>
  - Under-served: <https://codingxdev0.github.io/merajutasa.id/data/under-served.json>
  - Equity Anomalies: <https://codingxdev0.github.io/merajutasa.id/data/equity-anomalies.json>
  - Monthly Feedback Roll-up: <https://codingxdev0.github.io/merajutasa.id/data/feedback-monthly-rollup.json>
  - Revocations (placeholder): <https://codingxdev0.github.io/merajutasa.id/data/revocations.json>
  - Risk Digest (stub): <https://codingxdev0.github.io/merajutasa.id/data/risk-digest.json>

Transparency:

- Changelog Excerpt (draft): <https://codingxdev0.github.io/merajutasa.id/changelog.html>

### Event pipeline_hash (per Spec v1.0)

- Utility: `npm run events:pipeline:hash` writes `artifacts/event-pipeline-hash.json`.
- Definition: SHA-256 of (schema_version + sorted event_name list + schema commit hash).
- Purpose: detect schema drift and taxonomy changes across deployments.
- Canonical events list source (JSON): `schemas/events/event-taxonomy-v1.json` (subset-tested vs doc taxonomy).

### Equity snapshots methodology (note)

- The script `tools/fairness/generate-equity-snapshots.js` is synthetic for demos/tests. In production, snapshot buckets come from 24h aggregation of public events per unit, then equity_index computed as 1 − Gini (see `docs/fairness/equity-snapshot-pseudocode.md`).

## Fairness & Integrity Governance Scaffold (Baseline PRE-SEAL)

STATUS: PRE-HASH SEAL (Hash baseline belum diisi – proses “seal-first” akan menulis hash real & mengunci konten canonical).  
Non-Removal Assertion: README ini akan dikelola append-only; perubahan substansial (narasi fairness, klaim integritas, prinsip) memerlukan DEC baru.

---

## 1. Tujuan Proyek

Menyediakan kerangka (scaffold) governance, fairness, dan integrity untuk sistem penandaan “under‑served” berbasis hysteresis (Option F) yang:

1. Stabil (menghindari volatilitas metrik lewat hysteresis thresholds).
2. Transparan (narasi publik + methodology fragment).
3. Terverifikasi (hash manifest + decision log).
4. Minim trust theater (claim = dapat dipetakan ke bukti / artifact).

---

## 2. Keputusan Formal (DEC Chain)

| DEC ID | Judul | Fungsi | Status |
|--------|-------|--------|--------|
| DEC-20250812-02 | Hysteresis Adoption Option F | Mengunci parameter fairness (T_enter_major=0.50, T_enter_standard=0.60, consecutive_required_standard=2, T_exit=0.65, cooldown=1 snapshot, stalled window 5 (0.55–<0.65), anomaly delta 0.03) | Adopted |
| DEC-20250812-03 | Principles Reference Activation | Mengaktifkan lint principles.reference (Phase 0 WARN → +48h Phase 1 ERROR → +7d Phase 2 DENY) | Adopted |
| (Planned) DISC-DEC | Disclaimers Activation | Mengaktifkan presence rules disclaimers (D1–D7) | Draft Pending |
| (Planned) ANOM-DEC | Anomaly Equity Delta Policy | Mengunci perubahan anomaly_delta_threshold_equity_ratio | Draft Pending |
| (Planned) REVOC-DEC | Credential Revocation Placeholder | Siklus hidup credential & future revocation state | Planned |
| (Planned) TERM-DEC | Terminology Stage Escalation | Mengangkat adopsi terminologi baru ke Stage 2 | Planned |

Catatan: Hash masing-masing DEC akan dimasukkan ke field hash_of_decision_document setelah seal.

---

## 3. Ringkasan Fairness Hysteresis (Option F Final)

Parameter final (tersinkron di 3 tempat: DEC-20250812-02, hysteresis-config-v1.yml, methodology fragment):

- Severe Enter: equity_ratio < 0.50 (1 snapshot)
- Borderline Enter: equity_ratio < 0.60 pada 2 snapshot berturut-turut
- Exit: equity_ratio ≥ 0.65
- Cooldown: 1 snapshot setelah exit sebelum label bisa aktif kembali
- Stalled (internal only): 5 snapshot berturut equity_ratio antara 0.55 dan <0.65 (monitoring)
- Anomaly Delta: Perubahan mendadak ≥ 0.03 equity_ratio memicu flag analitik (bukan label publik)

Tujuan: Mengurangi noise / flapping label “under-served” tanpa mengubah sifat non‑ranking.

---

## 4. Prinsip (GP1–GP10) (Ringkas)

| Kode | Fokus (Ringkas) |
|------|-----------------|
| GP1 | Privasi & Minimasi Data |
| GP2 | Transparansi Metodologi |
| GP3 | Keadilan & Non-Diskriminasi |
| GP4 | Akuntabilitas & Auditability |
| GP5 | Robustness & Resilience |
| GP6 | Anti Misuse / Anti-Hype (Non-Ranking) |
| GP7 | Governed Evolution (Controlled Change) |
| GP8 | Security & Integrity Chain |
| GP9 | Fairness Signal Stability (Hysteresis) |
| GP10 | Data & Event Schema Consistency |

Lint principles.reference memaksa penjelasan dampak (Section 37 PR template).

---

## 5. Disclaimers (D1–D7) (Draft Canonical)

| ID | Tema | Tujuan |
|----|------|--------|
| D1 | Non-Ranking | Menegaskan sistem bukan peringkat kompetitif <!-- hype-lint-ignore-line --> |
| D2 | Keterbatasan Data | Menyatakan potensi keterbatasan & sampling |
| D3 | Interpretasi Terbatas | Mencegah over-claim atas label |
| D4 | Frekuensi Snapshot | Menjelaskan jeda update |
| D5 | Sinyal Bukan Nilai Mutlak | Menegaskan label indikatif |
| D6 | Evolusi Metodologi | Notifikasi potensi perubahan via DEC |
| D7 | Privasi & Agregasi | Menjelaskan agregasi & minimasi identitas |

Aktivasi enforcement menunggu DEC khusus (DISC-DEC).

### Canonical Disclaimer Block (Embed Once Per Core Page Group)

<div data-disclaimer-block="hero_primary">
<p data-disclaimer-id="D1">Equity Index & daftar under‑served bukan ranking kualitas—hanya sinyal pemerataan.</p>
<p data-disclaimer-id="D2">Tidak ada data pribadi anak dikumpulkan / ditampilkan.</p>
<p data-disclaimer-id="D3">Credential = status verifikasi; bukan skor performa.</p>
<p data-disclaimer-id="D5">Hash excerpt hanya metadata perubahan; tidak memuat konten sensitif.</p>
</div>

Catatan: Blok di atas menjadi sumber tunggal untuk hero/landing; halaman lain cukup referensi tanpa menduplikasi baris secara verbatim.

---

## 6. Integritas & Hash Chain

File canonical tercantum di: docs/integrity/spec-hash-manifest-v1.json  
Status sekarang: <PENDING_HASH> placeholders menunggu mode seal-first.  
Pasca seal:

1. Semua hash_sha256 di manifest terisi.
2. Field hash_of_decision_document di tiap DEC cocok 1:1 dengan manifest.
3. Perubahan file kunci (next_change_requires_dec=true) tanpa DEC → build FAIL (HASH_MISMATCH_DEC_REQUIRED).
4. Tidak ada placeholder tersisa (PLACEHOLDER_AFTER_SEAL = FAIL).

---

## 7. Struktur Dokumen Penting

| Domain | File Utama | Peran |
|--------|------------|-------|
| Fairness Config | docs/fairness/hysteresis-config-v1.yml | Parameter runtime |
| Narrative Publik | docs/fairness/hysteresis-public-methodology-fragment-v1.md | Penjelasan mekanisme & disclaimers |
| State Machine | docs/fairness/hysteresis-state-machine-transitions.md | Transisi label |
| Test Plan | docs/tests/hysteresis-test-plan-v1.md | Kasus T01–T10 |
| DEC Hysteresis | docs/governance/dec/DEC-20250812-02-hysteresis-adoption.md | Sumber adopsi final |
| DEC Principles | docs/governance/dec/DEC-20250812-03-principles-reference-activation.md | Enforcement fase |
| Disclaimers Spec | docs/governance/disclaimers-lint-spec-v1.md | Canonical disclaimers & rule codes |
| Manifest | docs/integrity/spec-hash-manifest-v1.json | Anchor hash integritas |
| Credential Schema | docs/integrity/credential-schema-final-v1.md | Struktur credential |
| Event Schema | docs/analytics/event-schema-canonical-v1.md | Event fairness & envelope |
| Archive Options | docs/archive/fairness_equity-hysteresis-options-v1.md | Opsi A–F historis |
| Archive UX | docs/archive/ux_public-multipage-experience-master-spec-v2.md | Spesifikasi multipage historical |
| Trace Index | docs/governance/trace/archive-trace-index-v1.md | Peta archive → canonical |
| PR Template | .github/pull_request_template.md | 37 section governance gating |
| Portal Panti – Orientasi | docs/governance/statement-orientasi-portal-panti.md | Pernyataan orientasi produk |
| Portal Panti – Orientasi Komprehensif | docs/produk/portal-panti/00-orientasi-komprehensif.md | Konsolidasi referensi hukum/standar |
| Portal Panti – Ruang Lingkup | docs/produk/portal-panti/01-ruang-lingkup-produk.md | Ruang lingkup dan batasan |
| Portal Panti – Model Data | docs/produk/portal-panti/02-model-data-minimal-aman.md | Model data minimal aman |
| Portal Panti – About (Publik) | docs/public/ABOUT-PORTAL-PANTI.md | Penjelasan publik non-teknis |
| Portal Panti – Rubrik Audit | docs/audit/00-rubrik-audit-portal-panti.md | Rubrik audit kesesuaian |

---

## 8. Archive & Non-Removal Policy

- Arsip (fairness_equity-hysteresis-options-v1.md, ux_public-multipage-experience-master-spec-v2.md) bersifat immutable.
- Trace index mendokumentasikan mapping parameter & narasi.
- Setiap klarifikasi baru → file baru (append), bukan edit destructive.
- Prinsip: “Tidak menghapus jejak rencana & keputusan.”

---

## 9. Kontribusi & PR Guard

Langkah PR wajib (sekilas):

1. Isi semua section PR template (jangan hapus nomor).
2. Section 37: sebutkan prinsip terdampak & mitigasi.
3. Jangan ubah angka parameter fairness tanpa DEC (akan ditolak).
4. Hindari istilah terlarang (lihat Anti‑Hype).

Anti‑Hype (Contoh Kata Dilarang – akan lint) <!-- lint-allow-negated-context hype-lint-ignore-line -->:

- “ranking”, “peringkat”, “top”, “terbaik”, “no.1”, “paling unggul”, “skor kompetitif” <!-- lint-allow-negated-context hype-lint-ignore-line -->
Gunakan framing “indikator stabil fairness” bukan “peringkat”.

---

## 10. Evidence Bundle (Target Pasca Seal)

Phase 1.5 Evidence Minimum Set didefinisikan di `docs/integrity/evidence-minimum-phase1.5-v1.md`.

| Artifact | File | Phase 1.5 Minimum? | Status (Current) |
|----------|------|-------------------|------------------|
| spec-hash-diff report | artifacts/spec-hash-diff.json | Yes | Active |
| param-integrity matrix | artifacts/param-integrity-matrix.json | Yes | Active |
| principles impact report | artifacts/principles-impact-report.json | Yes | Active |
| hype lint report | artifacts/hype-lint.json | Yes | Active |
| disclaimers lint report | artifacts/disclaimers-lint.json | Yes | Active (bootstrap presence) |
| pii scan summary | artifacts/pii-scan-report.json | Yes | Active |
| fairness sim scenario list | artifacts/fairness-sim-scenarios.json | Yes | Pending (stub) |
| no-silent-drift aggregator | artifacts/no-silent-drift-report.json | Yes | Active (partial gating) |
| observability metrics | artifacts/observability-metrics.json | No (Phase 2) | Pending |
| audit replay | artifacts/audit-replay.json | No (Phase 2) | Stub |

Kriteria PASS/WARN/FAIL rinci & freshness: lihat file definisi Phase 1.5.

---

## 11. Roadmap Milestone (Ringkas)

| Horizon | Sasaran Inti |
|---------|--------------|
| 7 hari | Hash seal, minimal test T01–T05, param-integrity real, bukti awal |
| 30 hari | Disclaimers activation DEC, anomaly DEC, observability non-null, changelog entry |
| 60 hari | Phase 2 readiness, terminologi baseline, revocation placeholder DEC |
| 90 hari | Full evidence gating tiap PR, credential signing demo, matured changelog (≥5 entri) |

Detail lengkap: docs/roadmap/roadmap-master-v1.md

---

## 12. Checklist Seal (Ringkas)

[ ] Manifest final (README entry aktif)  
[ ] Archive banner sudah ada  
[ ] Jalankan seal-first (tools/spec-hash-diff.js)  
[ ] Isi hash_of_decision_document DEC otomatis  
[ ] Verify mode 0 violations  
[ ] Audit snapshot posthash dibuat  
[ ] Changelog pertama diperbarui  
[ ] Simulasi drift memicu FAIL  

---

## 13. Larangan Klaim Peringkat / Ranking <!-- data-phrase-context="disclaimer-explanation" lint-allow-negated-context hype-lint-ignore-line -->

Sistem TIDAK:

- Mengurutkan entitas secara kompetitif.
- Memberi skor performa numerik per entitas untuk publik.
- Mengklaim “terbaik”, “top”, “juara”. <!-- hype-lint-ignore-line -->

Jika butuh membandingkan, gunakan bahasa: “indikator fairness stabil untuk mendeteksi under‑served” bukan “peringkat”.

---

## 14. Permintaan Perubahan (Decision Pack Format)

Ajukan perubahan signifikan dengan struktur:

1. Context
2. Opsi (2–3) + pro/kontra
3. Rekomendasi
4. Dampak jika salah pilih
5. Deadline
↳ Judul: [DEC-PROPOSAL] <topik>  
↳ Balasan keputusan singkat (“Adopsi Opsi B”) memicu file DEC baru.

---

## 15. Pertanyaan Terbuka (Ringkas)

Lihat: (planned) docs/governance/open-questions-v1.md (belum dibuat).  
Daftar gating (sementara):

- Aktivasi disclaimers
- Anomaly DEC
- Parameter drift escalation policy
- Evidence completeness threshold

---

- Tag (opsional): hash-seal-baseline-v1

## 17. Lisensi & Privasi (Placeholder)

- Lisensi: (Tentukan – MIT / Apache-2.0 / Internal Only)  
- Catatan Privasi: Tidak menampung PII mentah dalam repo; regex PII hanya contoh pattern; data nyata dikelola secara eksternal.

---

## 18. Kontak / Escalation

- Governance Owner: (Isi)
- Integrity Maintainer: (Isi)
- Untuk proposal DEC baru: buat issue “[DEC-PROPOSAL] <judul>”
- Insiden integritas (hash mismatch): label issue “integrity-incident” PRIORITY:HIGH

---

## 19. Non-Removal Assertion

Tidak ada penghapusan retrospektif dokumen historis (archive) – hanya append trace / DEC baru. Pelanggaran = investigasi integritas.

---

## 20. Ringkas Eksekutif

Struktur keputusan & parameter fairness sudah solid; tinggal hash seal + evidence gating agar klaim bisa diverifikasi secara kriptografis sebelum enforcement meningkat.

(EOF)

---

Referensi publik: Lihat Methodology Snippet (H0) untuk ringkasan non‑ranking dan privasi → docs/transparency/methodology-snippet-h0.md
