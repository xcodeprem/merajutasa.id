## 1) Ringkasan
Menyelesaikan gap kritikal di Week 6: Security Hardening & Compliance Orchestrator belum lengkap (imports/integ), skrip npm tidak tertata, health checks belum terpadu, dan referensi dokumentasi/CI perlu pembaruan.

## 2) Ruang Lingkup (Scope)
- Security Hardening (imports, dependency wiring, run targets)
- Compliance Orchestrator (cross-component integration + scripts)
- package.json scripts (validasi, konsolidasi, penghapusan obsolete)
- Unified infrastructure health checks (lintas 35+ komponen)
- Documentation index (Week 6 + metrik terbaru)
- CI/CD workflows (menjalankan tes Week 6 & gating yang relevan)
- Env/config vars untuk komponen baru
- Dependency mapping antar-komponen (graf & urutan startup)

## 3) Deliverables
- Security Hardening berjalan (EXIT=0) dan menghasilkan laporan audit
- Compliance Orchestrator berjalan end-to-end (with --generate-report)
- Scripts npm tersusun, obsolete dihapus, deskripsi diperjelas
- Health-check terpadu (per komponen + agregasi) dengan output deterministik di `artifacts/`
- Docs Week 6 diperbarui dengan status & tautan
- CI workflows memanggil checks baru dan lulus

## 4) Acceptance Criteria (ceklist)
- [ ] `npm run security:scan` PASS; artifact audit terbaru tertulis di `artifacts/audit/*.ndjson`
- [ ] `npm run compliance:orchestrator` PASS; `artifacts/compliance/assessments/*.json` terisi
- [ ] `npm run compliance:automation -- --generate-report` menghasilkan ringkasan compliance
- [ ] `npm run test:week6` PASS; `artifacts/week6-component-*.json` non-null
- [ ] `npm run observability:health-check` PASS; ringkasan status komponen terisi
- [ ] `npm run api-gateway:status` PASS; endpoint status OK
- [ ] `npm run performance:health-check` PASS; laporan tersimpan
- [ ] `.github/workflows/*` yang terkait Week 6 memanggil tes & menyimpan artifacts
- [ ] `docs/implementation/README.md` berisi referensi Week 6 terbaru + metrik
- [ ] Tidak ada skrip `npm run` yang 404/unknown (audit 500+ scripts)

## 5) Task Breakdown
- Security
  - [ ] Perbaiki imports di `infrastructure/security/enhanced/security-hardening.js`
  - [ ] Review dependency graph dan required modules; tambahkan yang hilang
  - [ ] Jalankan dan stabilkan hasil `security:scan`; dokumentasikan output penting
- Compliance
  - [ ] Lengkapi integrasi di `infrastructure/compliance/compliance-orchestrator.js`
  - [ ] Tambah/benahi scripts: `compliance:orchestrator`, `compliance:automation`
  - [ ] Pastikan assessment JSON ditulis ke `artifacts/compliance/assessments/`
- Scripts & CI
  - [ ] Audit 206+ scripts di `package.json`: hapus obsolete, tambah missing, perbaiki deskripsi
  - [ ] Update workflows CI agar menjalankan Week 6 checks dan menyimpan artifacts
  - [ ] Tambahkan run summaries ke `artifacts/*` (stabil, JSON deterministik)
- Health & Docs
  - [ ] Implement unified health checks untuk komponen inti (HA, observability, API gateway, performance)
  - [ ] Perbarui `docs/implementation/README.md` (Week 6 coverage & metrik)
  - [ ] Tambahkan dependency graph/startup order (doc singkat + file SVG/PNG opsional)
- Env/Config
  - [ ] Daftarkan env vars baru (README atau docs/config) dan contoh `.env.example`

## 6) Risiko & Mitigasi
- Cross-component integration may increase CI duration → use a smoke test subset and concise artifacts
- Large script changes risk regression → conduct gradual audits and save validation reports
- Security scan may be noisy → focus on blocking failures, document whitelists/justifications in artifacts

## 7) Dependencies
- Observability stack minimal up untuk health checks
- Path relatif dan scripts yang dirujuk oleh workflows aktif

## 8) Out of Scope (saat ini)
- Perubahan besar arsitektur (microservice boundaries)
- Perombakan policy gating beyond yang sudah ada di tools/policy

## 9) Verification & Artifacts (wajib)
- artifacts/audit/*.ndjson (security)
- artifacts/compliance/assessments/*.json (compliance)
- artifacts/week6-component-*.json (tests)
- artifacts/*-health*.json (health aggregates)
- Update ringkas di `artifacts/compliance-health-report.json` / `component-health-matrix.json`

## 10) Referensi
- Attachment analisis: [INFRASTRUCTURE-UPDATE-ANALYSIS-V1.md]
- Roadmap: [roadmap-next-phase-v2.md]
- Docs relevan: `docs/phase-2/PHASE-2-WEEK-6-DELIVERY-DOCUMENTATION.md`, `docs/implementation/README.md`
