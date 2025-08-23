# EPIC #83 Narratives (Issue -> sub-issue -> sub-sub-issue)

Tanggal: 2025-08-23

Semua persyaratan di sini bersifat non-negotiable. Narasi dirancang agar langsung dapat ditempel ke masing-masing Issue.

---

## Issue 1: Proteksi rahasia dan sanitasi riwayat git

- Context: Repo TIDAK boleh menyimpan rahasia. Kebocoran 1 kunci = insiden.
- Problem: Potensi ekspos rahasia melalui commit lama/artefak.
- Non-Negotiable Requirements:
  
  - HARUS aktif Secret Scanning + Push Protection (repo-level).
  - HARUS blok `.env*`, kunci (`*.pem`, `*.key`, `*.crt`), dan artefak sensitif via `.gitignore` + pre-commit hook.
  - HARUS pemindaian riwayat penuh (gitleaks/trufflehog) dan penghapusan via git filter-repo/BFG.
  - HARUS rotasi semua rahasia yang pernah muncul.

- Deliverables: Policy .gitignore, laporan scan, log rotasi, SECURITY.md update, hooks.
- Acceptance Criteria:
  
  - [ ] 0 temuan critical/high di secret scan.
  - [ ] Laporan scan di artifact CI; riwayat bersih.
  - [ ] Hooks mencegah commit rahasia.
  - [ ] SECURITY.md menjelaskan proses insiden dan rotasi.

- DoD: Proteksi aktif, scan terjadwal, dan audit berkala terbukti.
- Test Plan: Simulasi commit rahasia (ditolak), jalankan scan pada PR, verifikasi false-negative.
- Perf/Reliability: NA.
- Observability: Alert push-protection dan secret scan di PR.
- Docs: README (kebijakan rahasia), SECURITY.md (SLA rotasi).
- Rollout/Backout: Rollout langsung; backout tidak diperlukan.
- Dependencies: Hak admin repo.
- Risks/Mitigations: False positives → whitelist pattern terkontrol.
- Metrics: 0 kebocoran; MTTR rotasi < 2 jam.

---

## Issue 2: Standarisasi CI/CD di GitHub Actions (build, lint, test, security)

- Context: CI adalah gate tunggal kualitas.
- Problem: Tanpa gate, regresi masuk ke main.
- Non-Negotiable:
  
  - HARUS workflows untuk build (Node LTS matrix + cache).
  - HARUS lint/typecheck/test/coverage dengan ambang minimum.
  - HARUS CodeQL, Dependabot, secret scan di PR.
  - HARUS branch protection dengan required checks dan 1+ review.

- Deliverables: YAML workflows, badge status, konfigurasi branch protection.
- Acceptance:
  
  - [ ] Semua PR menunjukkan checks lulus.
  - [ ] Coverage >= 80% (menuju 90%+).
  - [ ] 0 critical/high dari CodeQL di PR.

- DoD: PR tanpa checks otomatis ditolak.
- Test Plan: PR dummy gagal lint/test untuk memverifikasi gate.
- Perf: CI runtime < 10 m (dengan cache).
- Observability: Upload artefak, anotasi lint/test pada PR.
- Docs: CONTRIBUTING.md (alur CI), README badges.
- Rollout: Bertahap; aktifkan proteksi setelah green.
- Dependencies: Issue 1.
- Risks: Flaky tests → retry policy dan stabilisasi.
- Metrics: Lead time turun, kegagalan di main = 0.

---

## Issue 3: Supply chain hardening

- Context: Ancaman melalui dependency dan pipeline.
- Problem: Tag bergerak dan visibilitas dependency rendah.
- Non-Negotiable:
  
  - HARUS pin Actions ke commit SHA.
  - HARUS SBOM per build dan disimpan.
  - HARUS cosign signing + SLSA provenance.
  - HARUS OSSF Scorecard.

- Deliverables: Updated workflow, SBOM artifacts, policy signing.
- Acceptance:
  
  - [ ] Semua steps Actions pakai SHA.
  - [ ] SBOM tersedia pada setiap run.
  - [ ] Image/artefak bertanda tangan tervalidasi.

- DoD: Scorecard rating meningkat.
- Test Plan: Verifikasi signature dan provenance; fail jika tidak valid.
- Perf: Overhead build < 10%.
- Observability: Audit log supply chain.
- Docs: README (cara verifikasi artefak).
- Dependencies: Issue 2.
- Metrics: SLSA level sesuai target; Scorecard >7.

---

## Issue 4: Governance repo (LICENSE, CODEOWNERS, CONTRIBUTING, CoC)

- Context: Tata kelola mempercepat dan mengamankan kolaborasi.
- Problem: Ketidakjelasan hak pakai dan ownership.
- Non-Negotiable:
  
  - HARUS LICENSE (MIT/Apache-2.0).
  - HARUS CODEOWNERS per domain.
  - HARUS CONTRIBUTING dan CoC.
  - HARUS templates Issue/PR.

- Deliverables: File governance di root/.github.
- Acceptance:
  
  - [ ] File tersedia dan terpakai di PR/Issue.
  - [ ] CODEOWNERS memicu reviewers otomatis.

- DoD: Review otomatis berjalan.
- Test Plan: PR untuk area berbeda → owner sesuai.
- Docs: README badge lisensi.
- Metrics: Waktu review turun, kepatuhan meningkat.

---

## Issue 5: Kualitas kode JS/TS

- Context: Type safety dan konsistensi gaya wajib.
- Problem: Inkonsistensi memunculkan bug.
- Non-Negotiable:
  
  - HARUS ESLint + Prettier tanpa konflik.
  - HARUS TypeScript strict + incremental + d.ts.
  - HARUS husky + lint-staged blokir commit bermasalah.
  - HARUS scripts standar (lint, format, typecheck, test, audit).

- Deliverables: Konfigurasi linter/tsconfig, hooks, scripts.
- Acceptance:
  
  - [ ] Lint/typecheck lulus pada PR.
  - [ ] Hooks mencegah commit gagal.

- DoD: Zero lint errors di main.
- Test Plan: Commit pelanggaran → ditolak.
- Metrics: Penurunan defect density.

---

## Issue 6: Strategi testing menyeluruh

- Context: Testing berlapis mencegah regresi.
- Problem: Celah kualitas tanpa tes memadai.
- Non-Negotiable:
  
  - HARUS unit, integration, E2E untuk alur utama.
  - HARUS coverage threshold dan pelaporan.

- Deliverables: Suite tests + laporan.
- Acceptance:
  
  - [ ] Coverage >= 80% (menuju 90%+).
  - [ ] Test mencakup happy/edge/negative path.

- DoD: PR menambahkan uji terhadap perubahan.
- Test Plan: Tambahkan uji kontrak API dan UI kritikal.
- Metrics: MTTR bug turun, escape defect ~0.

---

## Issue 7: Dokumentasi & arsitektur

- Context: Kecepatan onboarding dan operasi.
- Problem: Kurangnya dokumentasi operasional/arsitektur.
- Non-Negotiable:
  
  - HARUS README operasional.
  - HARUS ADRs untuk keputusan kunci.
  - HARUS diagram komponen/dependensi/data flow.
  - HARUS runbook insiden dan rilis/rollback.

- Deliverables: README, ADRs, diagram, runbook.
- Acceptance:
  
  - [ ] Semua dokumen ada dan akurat.

- DoD: Onboarding < 1 hari.
- Metrics: Waktu onboarding turun 50%+.

---

## Issue 8: IaC & Policy (Terraform + OPA)

- Context: Infrastruktur harus dapat di-audit dan direproduksi.
- Problem: Drift dan konfigurasi tak terkontrol.
- Non-Negotiable:
  
  - HARUS remote state + locking per env.
  - HARUS CI terraform fmt/init/validate/plan (PR) & apply (protected).
  - HARUS policy-as-code gate (OPA/Conftest).
  - HARUS IaC scanning (tfsec/Checkov).
  - HARUS drift detection terjadwal.

- Deliverables: Pipelines, policies, laporan keamanan.
- Acceptance:
  
  - [ ] Plan wajib lulus policy sebelum merge.
  - [ ] Scan 0 critical/high.

- DoD: Apply hanya lewat pipeline terlindungi.
- Metrics: Drift = 0; MTTR perubahan < 1h.

---

## Issue 9: Kontainerisasi & rilis

- Context: Build reproducible dan rilis otomatis.
- Problem: Inkonsistensi lingkungan.
- Non-Negotiable:
  
  - HARUS Dockerfile multi-stage, user non-root, healthcheck.
  - HARUS build multi-arch + push ke GHCR (semver).
  - HARUS lampirkan SBOM dan attestation.
  - HARUS release-please untuk notes/tagging.

- Deliverables: Dockerfile, workflows, release notes.
- Acceptance:
  
  - [ ] Image lulus scan dan signature valid.

- DoD: Rilis otomatis on tag.
- Metrics: Waktu rilis < 10 menit.

---

## Issue 10: Environments & rahasia

- Context: Pemisahan env dan kontrol akses rilis wajib.
- Non-Negotiable:
  
  - HARUS GitHub Environments dev/stg/prod + required reviewers.
  - HARUS rahasia hanya via Secrets; non-rahasia via env config.
  - HARUS dokumentasi konfigurasi per env.

- Deliverables: Environments, policies, docs config.
- Acceptance:
  
  - [ ] PR ke prod butuh approval environment.

- DoD: Audit trail lengkap.
- Metrics: 0 insiden konfigurasi.

---

## Issue 11: Observability

- Context: Tanpa observability, reliabilitas tidak terjamin.
- Non-Negotiable:
  
  - HARUS logging JSON + trace-id.
  - HARUS OpenTelemetry tracing.
  - HARUS metrics + dashboard + alert.
  - HARUS error tracking.

- Deliverables: Config log/trace/metrics, dashboard, alert.
- Acceptance:
  
  - [ ] Alert untuk error rate/latency/availability aktif.

- DoD: MTTR < 30 menit.
- Metrics: Coverage tracing > 80% jalur kritikal.

---

## Issue 12: Kontrak API & gateway

- Context: Kontrak jelas mencegah integrasi rapuh.
- Non-Negotiable:
  
  - HARUS OpenAPI untuk semua layanan.
  - HARUS contract testing di CI.
  - HARUS standar authN/Z, rate limiting, observability.

- Deliverables: Spesifikasi OpenAPI, tests, gateway policy.
- Acceptance:
  
  - [ ] PR yang ubah API menyertakan OpenAPI diff + migrasi.

- DoD: 0 breaking tanpa migrasi.
- Metrics: Error 4xx/5xx turun.

---

## Issue 13: Kinerja & ketahanan

- Context: Validasi performa dan ketahanan sebelum produksi.
- Non-Negotiable:
  
  - HARUS load test (k6/Gatling) dengan SLA jelas.
  - HARUS performance budgets di CI.
  - HARUS latihan rollback dan verifikasi RTO/RPO.

- Deliverables: Skenario k6, laporan, script rollback.
- Acceptance:
  
  - [ ] p95/p99 sesuai target, error rate < budget.

- DoD: Run beban terjadwal + hasil tersimpan.
- Metrics: SLA dipenuhi konsisten.

---

## Issue 14: Audit keamanan & threat modeling

- Context: Keamanan proses berulang, bukan event.
- Non-Negotiable:
  
  - HARUS siklus triwulan SCA/SAST/DAST.
  - HARUS threat modeling (STRIDE) per domain.
  - HARUS SECURITY.md (pelaporan, SLA perbaikan).

- Deliverables: Laporan audit, model ancaman, update doc.
- Acceptance:
  
  - [ ] 0 critical terbuka > 7 hari.

- DoD: Jadwal rutin di CI/kalender.
- Metrics: Mean risk level turun.

---

## Issue 15: Manajemen data (backup/restore, retensi, privasi)

- Context: Data adalah aset; kehilangan tidak dapat diterima.
- Non-Negotiable:
  
  - HARUS backup terjadwal dan uji restore berkala.
  - HARUS kebijakan retensi dan penghapusan aman.
  - HARUS enkripsi in-transit dan at-rest tervalidasi.

- Deliverables: Jadwal backup, skrip/infra, laporan drill.
- Acceptance:
  
  - [ ] Uji restore sukses (RTO/RPO terpenuhi).

- DoD: Monitoring backup dan alert failure.
- Metrics: Keberhasilan backup 100%; RPO=0..X sesuai kebijakan.

---
