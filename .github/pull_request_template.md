# PULL REQUEST (Non-Negotiable Enterprise Standard)

Semua poin di bawah ini WAJIB dipenuhi. PR yang tidak memenuhi akan ditolak tanpa pengecualian.

## Ringkasan
- Tujuan PR (spesifik, tidak ambigu):
- Issue rujukan: Closes #<id> (wajib jika ada)
- Jenis perubahan: [ ] Feature [ ] Fix [ ] Security [ ] Docs [ ] Infra/CI [ ] Refactor [ ] Performance [ ] Test-only

## Bukti Pemenuhan Standar

### 1) Keamanan & Supply Chain
- [ ] Tidak ada rahasia di kode/commit/artefak; semua variabel sensitif via GitHub Secrets
- [ ] Semua GitHub Actions dipin ke commit SHA (tidak ke tag bergerak)
- [ ] CodeQL lulus tanpa critical/high
- [ ] Dependabot tidak melaporkan critical/high terbuka terkait perubahan ini
- [ ] SBOM dihasilkan (Syft/CycloneDX) dan diunggah sebagai artifact
- [ ] Lisensi file/komponen dipatuhi; file LICENSE konsisten

### 2) Kualitas Kode & Testing
- [ ] ESLint/Prettier/typecheck lulus
- [ ] Unit tests ditambahkan/diperbarui dan lulus
- [ ] Integration tests sesuai kontrak API ditambahkan/diperbarui dan lulus
- [ ] E2E tests (bila relevan) ditambahkan/diperbarui dan lulus
- [ ] Coverage tidak menurun; tetap >= ambang minimum

### 3) Performa & Reliabilitas
- [ ] Performance budgets dipenuhi (cantumkan angka p95/p99 di bawah)
- [ ] Load/soak test lulus bila relevan
- [ ] Strategi retry/backoff/circuit breaker (jika jaringan) ditetapkan
- [ ] Backward compatibility dijaga atau migrasi disediakan

### 4) Observability
- [ ] Logging terstruktur (JSON) dengan trace/span-id
- [ ] Tracing OpenTelemetry meng-cover jalur kritikal
- [ ] Metrics, dashboard, dan alert ditambahkan/diperbarui
- [ ] Error tracking diintegrasikan (DSN via env)

### 5) Dokumentasi & Operasional
- [ ] README/ADR/Docs diperbarui
- [ ] Runbook rilis/rollback tersedia dan teruji
- [ ] Perubahan konfigurasi didokumentasikan per-environment
- [ ] Breaking changes dicatat jelas (lihat bagian khusus)

## Detail Teknis
- Arsitektur dan keputusan kunci:
- Skema data/API yang berubah (sertakan OpenAPI diff jika ada):
- Dampak kompatibilitas dan rencana migrasi:

## Hasil Uji (tautkan artefak CI)
- Laporan test:
- Laporan coverage:
- Laporan beban/kinerja:
- SBOM/provenance:

## Breaking Changes
- [ ] Tidak ada
- Jika ada, jelaskan dampak dan prosedur migrasi/rollback:

## Checklist Admin
- [ ] Branch up-to-date dengan target
- [ ] Semua status checks lulus
- [ ] Minimal 1 reviewer menyetujui (atau sesuai policy)
# Pull Request Template – MerajutASA

(Template ini disusun BERDASARKAN seluruh spesifikasi & keputusan yang sudah terdokumentasi: Master Spec v2.0, Credential Schema v1.0, Hysteresis Decision (DEC-20250812-02), Event Schema v1.0, Disclaimers Lint Spec v1.0, PII Pattern Library v1.0, Roadmap Master v1.0, Progress Recaps, dan semua prinsip GP1–GP10. Template INI TIDAK menggantikan dokumen manapun dan TIDAK menghapus strategi sebelumnya. Gunakan untuk memastikan setiap perubahan selaras dengan guardrail dan governance. Setiap bagian WAJIB dipertimbangkan; kosongkan hanya bila benar‑benar tidak relevan dan jelaskan mengapa.)

> AUTOMATION & AGENT NOTES  
>
> - Bagian dengan marker `<!-- AUTO:... -->` diisi otomatis oleh pipeline (CI bot / governance agent).  
> - Jangan hapus marker; jika konten manual berbeda dari hasil otomatis, CI akan FAIL.  
> - File ini APPEND-ONLY untuk penambahan struktur. Perubahan format eksisting memerlukan DEC.  
> - Script yang mengisi:  
>   - spec hash diff: `tools/spec-hash-diff.js` → Section 26  
>   - evidence bundle collector: `tools/evidence-bundle.js` → Section 27  
>   - parameter integrity scan: `tools/param-integrity.js` → Section 28  
>   - terminology adoption scanner: `tools/terminology-scan.js` → Section 29  
>   - observability sampler: `tools/observability-metrics.js` → Section 30  
>   - fairness churn/anomaly simulator: `tools/fairness-sim.js` → Section 31  
>   - revocation impact checker: `tools/revocation-impact.js` → Section 32  
>   - data minimization classifier: `tools/data-field-classifier.js` → Section 33  
>   - hype lexicon lint: `tools/hype-lint.js` → Section 34  
>   - audit replay validator: `tools/audit-replay.js` → Section 35  
>   - final drift checklist aggregator: `tools/no-silent-drift.js` → Section 36  

---

## 1. RINGKASAN

(Deskripsi singkat perubahan. Jelaskan apa yang ditambahkan / diubah / diperbaiki tanpa marketing hype.)

- Tujuan utama:
- Komponen utama yang terpengaruh:
- Apakah ini mengikuti backlog / roadmap item? (Referensi ID atau daftar)
- Apakah ini memerlukan DEC baru? (Ya/Tidak – jika Ya, isi Section 12)

## 2. JENIS PERUBAHAN

(Tandai minimal satu, boleh lebih)

- [ ] Fitur baru (pengembangan sesuai roadmap)
- [ ] Perubahan integritas (signer / chain / credential)
- [ ] Perubahan fairness (equity snapshot / hysteresis / under‑served logic)
- [ ] Instrumentation / Event schema update
- [ ] Policy-as-code / Lint / Governance automation
- [ ] Perbaikan bug
- [ ] Dokumentasi saja
- [ ] Performa / A11y
- [ ] Keamanan / Privasi (PII)
- [ ] Refactor internal (tanpa perubahan perilaku eksternal)
- [ ] Lainnya (jelaskan):

## 3. REFERENSI DOKUMEN / SPESIFIKASI

(Cantumkan path relatif – jangan hapus referensi sebelumnya)

- [ ] Master Spec v2.0 (bagian terkait: …)
- [ ] Credential Schema v1.0 (docs/integrity/credential-schema-final-v1.md)
- [ ] Hysteresis DEC (docs/governance/dec/DEC-20250812-02-hysteresis-adoption.md)
- [ ] Event Schema v1.0 (docs/analytics/event-schema-canonical-v1.md)
- [ ] Disclaimers Lint Spec (docs/governance/disclaimers-lint-spec-v1.md)
- [ ] PII Pattern Library (docs/privacy/pii-pattern-library-v1.md)
- [ ] Roadmap Master (docs/roadmap/roadmap-master-v1.md)
- [ ] Delta Master Spec terbaru (jika relevan): …
- [ ] Lainnya (sebutkan):

## 4. INTEGRITY IMPACT (CREDENTIAL / HASH CHAIN / SIGNATURE)

- Apakah credential schema disentuh? (Ya/Tidak)
  - Jika Ya: Perubahan bersifat optional field / required / breaking? (Butuh DEC?)
- Apakah menambah / mengubah logic canonicalization atau hashing?
- Apakah menambah chain event tipe baru (CREDENTIAL_ISSUED, UNDER_SERVED_ENTER, DEC_REFERENCE, dll)?
- Test vector baru dibuat? (path)
- Bukti verifikasi manual (ringkas):

## 5. FAIRNESS / HYSTERESIS IMPACT

- Menyentuh parameter hysteresis? (Jika Ya → harus sama dengan config atau sertakan alasan divergensi)
  - Diff vs docs/fairness/hysteresis-config-v1.yml: (tempel atau “no diff”)
- Mengubah sumber data equity snapshot / formula? (Jika Ya, jelaskan & potensi bias)
- Mengubah logika entry_reason atau event sys_fairness_*?
- Pengaruh ke churn / detection delay (estimasi):

## 6. PRIVACY / PII & DATA MINIMIZATION

- Menambah input text bebas baru? Apakah scanner PII diterapkan?
- Kategori PII baru diperlukan? (Jika Ya → memerlukan DEC untuk pattern library patch)
- Risiko false positive / negative yang diidentifikasi:
- Apakah ada potensi data anak / identifier sensitif masuk? Jelaskan mitigasi.

## 7. DISCLAIMER & COPY GUARDRAILS

- Apakah menambah halaman baru yang memerlukan disclaimers (D1–D7)?
- Lint disclaimers lulus lokal? (tempel ringkasan hasil)
- Ada perubahan teks canonical disclaimers? (Jika Ya → DEC)
- Banned phrase check (ranking/top dsb) lulus? (Ya/Tidak + bukti lint)

## 8. POLICY-AS-CODE & LINT STATUS

| Policy / Lint | Status | Catatan | Artifact Path |
|---------------|--------|---------|---------------|
| aggregation.min_cell_threshold |  |  |  |
| disclaimers.presence |  |  |  |
| credential.field.prohibited |  |  |  |
| hysteresis.params.lock |  |  |  |
| terminology.usage.threshold |  |  |  |
| equity.delta.anomaly (observational) |  |  |  |
| hype.language (jika aktif) |  |  |  |
| PII pattern config load |  |  |  |

## 9. EVENT SCHEMA & INSTRUMENTATION

- Menambah event_name baru? (Daftar)
- Mengubah meta schema existing event? (Butuh patch version)
- Apakah event collector validation diperbarui?
- Apakah sampling / pipeline_hash berubah?
- Apakah integrity.event_hash reproduksi diuji (script output)?

## 10. TEST & QUALITY

- [ ] Unit tests (credential / signer / chain)
- [ ] Unit tests (hysteresis transitions)
- [ ] Integration tests (equity snapshot + state machine)
- [ ] PII detection tests (kategori baru / existing)
- [ ] Lint tests (disclaimers / terminology / hype)
- [ ] Performance budget p75 LCP tidak naik >5% (evidence)
- [ ] A11y scan (axe/pa11y) tanpa critical
- [ ] Chain continuity tests (prevHash mismatch negative test)
- [ ] Rehash verification script PASS
- [ ] Manual verification (CLI) PASS
Coverage (%): …

## 11. RISK ASSESSMENT

| Risk | Likelihood | Impact | Mitigasi | Residual |
|------|------------|--------|----------|----------|
|  |  |  |  |  |

## 12. DECISIONS (BARU ATAU DI-UPDATE)

- DEC yang diusulkan: (ID placeholder DEC-YYYYMMDD-XX)
- Jenis (CIC-A/B/C/D/E):
- Dokumen spesifikasi / patch dilampirkan? (path)
- Hash file spesifikasi (sementara, isi setelah commit):
- Ringkasan alasan & dampak:
- Perubahan apa yang TIDAK dilakukan (menegaskan non-removal strategi):

## 13. ROLLBACK PLAN

1. …
2. …
3. …
Chain events annotate? (Ya/Tidak)

## 14. POST-MERGE ACTIONS

| Action | Owner | Deadline | Status |
|--------|-------|----------|--------|
| Update DEC hash references |  |  |  |
| Publish methodology fragment update |  |  |  |
| Seed new config to staging/prod |  |  |  |
| Run backfill script / reindex |  |  |  |
| Dashboard panel update |  |  |  |
| Add changelog excerpt entry (if H2+) |  |  |  |

## 15. OBSERVABILITY CHECKLIST

- Ingestion success (last 24h %):
- Event lag p95 (ms):
- Alerts needed / updated:

## 16. SECURITY REVIEW (Jika Relevan)

- Key material touched? (#keys-n):
- New API surface:
- Input validation evidence:
- DOS/spam mitigation:

## 17. PERFORMANCE & A11Y NOTES

| Aspect | Result | Baseline | Evidence |
|--------|--------|----------|----------|
| p75 LCP delta |  |  |  |
| Bundle size delta (KB) |  |  |  |
| Accessibility new issues |  |  |  |
| CPU / Memory regression |  |  |  |

## 18. FAIRNESS & USER COMPREHENSION COPY

- FAQ update? (path)
- Disclaimers reposition? (lint evidence)
- Micro-infographic needed? (Y/N)

## 19. DATA SCHEMA / STORAGE MIGRATIONS

| Table | Change | Backward-Compatible? | Migration Script Path |
|-------|--------|----------------------|-----------------------|
|  |  |  |  |
Rollback strategy:

## 20. CONFIG / PARAMETER DIFF

Tempel diff (hysteresis-config-v1.yml / patterns.yml / performance budgets).
Per parameter status (unchanged / changed / DEC):

## 21. LOG/AUDIT ARTIFACTS

- Chain events sample:
- New event payload + event_hash:
- Redacted feedback sample:

## 22. TIDAK MENGHAPUS STRATEGI (CONFIRMATION)

Saya menyatakan PR ini:

- [ ] Tidak menghapus atau mengurangi prinsip GP1–GP10.
- [ ] Tidak menghilangkan disclaimers wajib.
- [ ] Tidak memperkenalkan ranking / skor kompetitif.
- [ ] Tidak menambah PII anak.
- [ ] Menjaga konsistensi narasi fairness & privacy.

## 23. SCREENSHOTS / EVIDENCE

(Opsional UI / logs)

## 24. REVIU DIBUTUHKAN

- [ ] Integrity (Signer / Chain)
- [ ] Fairness / Data
- [ ] Privacy / PII
- [ ] Governance / Policy
- [ ] Instrumentation / Analytics
- [ ] UX / Content
- [ ] Performance / A11y
- [ ] Security

## 25. CATATAN TAMBAHAN

(Asumsi / constraint)

---

# EXTENSION (APPEND-ONLY) – AUTOMATED EVIDENCE & DRIFT GUARDS

## 26. SPEC HASH INTEGRITY (NEW – DO NOT REMOVE)

| Spec File | Old Hash | New Hash | Expected Version Bump | DEC Ref | Status |
|-----------|----------|----------|-----------------------|---------|--------|
<!-- AUTO:SPEC_HASH_ROWS -->
Script Output: <!-- AUTO:SPEC_HASH_ARTIFACT -->

## 27. EVIDENCE BUNDLE (NEW)

Checklist (path file harus ada):

- [ ] disclaimers-lint-report.json <!-- AUTO:EVIDENCE:DISCLAIMERS -->
- [ ] event-schema-validation-report.json <!-- AUTO:EVIDENCE:EVENT_SCHEMA -->
- [ ] pii-scan-test-summary.json <!-- AUTO:EVIDENCE:PII -->
- [ ] hysteresis-transition-test-report.json <!-- AUTO:EVIDENCE:HYSTERESIS -->
- [ ] chain-continuity-check.txt <!-- AUTO:EVIDENCE:CHAIN -->
- [ ] credential-verify-cli-output.txt <!-- AUTO:EVIDENCE:VERIFY -->
- [ ] performance-lcp-report.json <!-- AUTO:EVIDENCE:PERF -->
- [ ] accessibility-scan-report.json <!-- AUTO:EVIDENCE:A11Y -->
If any missing, justify:

## 28. PARAMETER INTEGRITY MATRIX (NEW)

| Domain | Parameter | Config Value | Code Detected | Match? | Action |
|--------|-----------|--------------|---------------|--------|--------|
<!-- AUTO:PARAM_MATRIX -->

## 29. TERMINOLOGY ADOPTION IMPACT (NEW)

- Token lama ditambah? …
- Token baru ditambah? …
- adoptionPercent Before → After: <!-- AUTO:TERM_ADOPTION_DIFF -->
- Recalc script output: <!-- AUTO:TERM_ADOPTION_ARTIFACT -->
- Regression? (Y/N) (If Y > threshold DEC required)

## 30. SAMPLING & OBSERVABILITY (NEW)

| Item | Old | New | DEC Required? | Notes |
|------|-----|-----|---------------|-------|
<!-- AUTO:OBS_SAMPLING -->
Ingestion success 24h: <!-- AUTO:OBS_INGEST_PCT -->%  
Event lag p95: <!-- AUTO:OBS_LAG_P95 --> ms  
pipeline_hash diff: <!-- AUTO:PIPELINE_HASH_DIFF -->

## 31. FAIRNESS ANOMALY & CHURN SIMULATION (NEW)

- Simulation dataset: <!-- AUTO:FAIR_SIM_DATA -->
- Projected churn: <!-- AUTO:FAIR_SIM_CHURN -->
- Borderline detection delay avg: <!-- AUTO:FAIR_SIM_DELAY -->
- Adjustment suggested: <!-- AUTO:FAIR_SIM_ADJ -->

## 32. REVOCATION LIFECYCLE CONSIDERATION (NEW)

- UI/endpoint change: …
- Reason code addition: …
- Confirm no ranking semantics added: [ ]

## 33. DATA MINIMIZATION & FIELD CLASSIFICATION (NEW)

| Field | Level (L0–L4) | Sensitive? | Justification | Alt Considered |
|-------|---------------|------------|--------------|----------------|
<!-- AUTO:DATA_FIELDS -->

## 34. EXTERNAL NARRATIVE & ANTI-HYPE AUDIT (NEW)

Hype lint hits: <!-- AUTO:HYPE_HITS -->  
Banned phrase scan: <!-- AUTO:HYPE_BANNED_STATUS -->  
Overrides w/ DEC: <!-- AUTO:HYPE_OVERRIDES -->

## 35. AUDIT REPLAY CAPABILITY (NEW)

- Chain replay: <!-- AUTO:AUDIT_REPLAY -->
- Under-served timeline reconstruction: <!-- AUTO:AUDIT_TIMELINE -->
- Event→State mismatch count: <!-- AUTO:AUDIT_MISMATCH -->

## 36. “NO SILENT DRIFT” FINAL CHECKLIST (NEW)

- [ ] Semua spec hash perubahan ada DEC <!-- AUTO:NO_DRIFT_SPEC -->
- [ ] Tidak ada parameter mismatch hysteresis / PII / policy <!-- AUTO:NO_DRIFT_PARAMS -->
- [ ] Tidak ada field credential baru tanpa schema patch <!-- AUTO:NO_DRIFT_SCHEMA -->
- [ ] Semua event schema mod punya version bump rationale <!-- AUTO:NO_DRIFT_EVENT -->
- [ ] Tidak ada disclaimers hilang / drift <!-- AUTO:NO_DRIFT_DISC -->
- [ ] Tidak ada ranking-like terminology <!-- AUTO:NO_DRIFT_RANK -->
- [ ] PII patterns baru diuji FP rate & terdokumentasi <!-- AUTO:NO_DRIFT_PII -->

---

### QUICK SELF CHECK BEFORE SUBMIT (RESTATE)

- Sudah jalankan semua lint (Y/N)
- Semua test PASS (Y/N)
- Rehash & signature verify PASS (Y/N)
- Parameter fairness & PII sesuai config (Y/N)
- Tidak ada drift disclaimers (Y/N)

Jika N pada salah satu → tangguhkan merge sampai resolved atau DEC.

---

## 37. PRINCIPLES IMPACT MATRIX (AUTO + MANUAL)

Penjelasan:

- Baris di bawah akan dihasilkan otomatis oleh tools/principles-impact.js.
- Anda (author) WAJIB memverifikasi kolom Declared & Mitigation jika heuristic menandai (Inferred=TRUE).
- Jangan menulis manual di antara marker; tambahkan klarifikasi di bawah marker “SUMMARY” atau di Section 25 / 22 bila perlu.

| Principle | Inferred (Heuristic) | Declared (Author) | Alignment | Mitigation / Notes |
|-----------|----------------------|-------------------|----------|--------------------|
<!-- AUTO:PRINCIPLES_MATRIX_ROWS -->

Summary / Additional Manual Notes:
<!-- AUTO:PRINCIPLES_MATRIX_SUMMARY -->

If any Alignment = DIVERGE → Jelaskan mitigasi jelas (policy link / lint / DEC plan) sebelum merge.

---

### APPENDIX A: AUTOMATION LEGEND (REFERENCE – DO NOT MODIFY ABOVE)

| Marker | Source Script | Output Type | Phase Available | Failure Condition |
|--------|---------------|------------|-----------------|------------------|
| AUTO:SPEC_HASH_ROWS | spec-hash-diff.js | Table rows (file hash diff) | Post-seal | Hash changed tanpa DEC |
| AUTO:SPEC_HASH_ARTIFACT | spec-hash-diff.js | JSON artifact name | Post-seal | Missing artifact |
| AUTO:EVIDENCE:* | evidence-bundle.js | Checklist ticks | Phase 1+ | Missing critical artifact |
| AUTO:PARAM_MATRIX | param-integrity.js | Table rows (parameter comparisons) | Phase 1 | Mismatch w/out DEC |
| AUTO:TERM_ADOPTION_DIFF | terminology-scan.js | Percentage delta | Phase 1 | Adoption regression |
| AUTO:TERM_ADOPTION_ARTIFACT | terminology-scan.js | JSON path | Phase 1 | Missing artifact |
| AUTO:OBS_SAMPLING / OBS_INGEST_PCT / OBS_LAG_P95 | observability-metrics.js | Metrics numeric | Phase 1 | Null / sentinel -1 |
| AUTO:FAIR_SIM_* | fairness-sim.js | Simulation metrics | Phase 1 | Churn spike > threshold |
| AUTO:DATA_FIELDS | data-field-classifier.js | Table classification | Phase 1 | Unjustified sensitive field |
| AUTO:HYPE_* | hype-lint.js | Count / status | Phase 1 | Banned terms present |
| AUTO:AUDIT_* | audit-replay.js | Replay summary | Phase 2 | Mismatch chain/state |
| AUTO:NO_DRIFT_* | no-silent-drift.js | Checklist results | Phase 2 | Any drift flag |
| AUTO:PRINCIPLES_MATRIX_ROWS | principles-impact.js | Principle rows | Phase 0 | Undeclared impacted principle |
| AUTO:PRINCIPLES_MATRIX_SUMMARY | principles-impact.js | Summary text | Phase 0 | Summary empty while rows flagged |

Legend Status (Policy/Lint):

- PASS = Compliant & artifact produced
- WARN = Non-blocking issue (Phase 0 / early Phase 1)
- FAIL = Block merge (policy gating)
- N/A = Tidak relevan PR ini
- TBD = Belum dihitung (jelaskan pada Section 25)

Alignment (Principles):

- MATCH = Declared set principle(s) sama dengan heuristik
- DIVERGE = Heuristik mendeteksi tambahan / mismatch (butuh mitigasi)

---

### APPENDIX B: POLICY CODE REFERENCE (PLACEHOLDER)

| Policy Code | Domain | Active Phase | DEC Required on Change | Notes |
|-------------|--------|-------------|------------------------|-------|
| hysteresis.params.lock | Fairness | Phase 0 | Yes | Parameter fairness Option F |
| principles.reference | Governance | Phase 0 (WARN) | Yes | Escalates 48h→ERROR |
| disclaimers.presence | Narrative | (Planned) | Yes | Menunggu DISC-DEC |
| equity.delta.anomaly | Analytics | (Planned) | Yes | Lock anomaly delta (0.03) |
| credential.field.prohibited | Schema | (Planned) | Yes | Disallow risky mutable fields |
| aggregation.min_cell_threshold | Privacy | (Planned) | Yes | Prevent small group leakage |
| terminology.usage.threshold | Adoption | (Planned) | No (DEC escalate) | Track new term adoption |
| hype.language | Narrative | (Planned) | No (config) | Banned lexicon gating |
| pii.patterns.lock | Privacy | (Planned) | Yes | Append vs modify distinction |
| evidence.completeness | Governance | (Phase 2) | Yes | Merge block if below threshold |

(Baris baru hanya ditambahkan, tidak mengganti.)

---

### APPENDIX C: POST-SEAL PLACEHOLDER JUSTIFICATION (FILL IF ANY AUTO SECTION EMPTY)

Jika setelah Phase 1 dimulai ada marker AUTO masih kosong:

- Sebutkan marker:
- Alasan belum terisi:
- ETA implementasi:
- Apakah mitigasi sementara ada? (Y/N)

---

### EOF TEMPLATE SENTINEL
<!-- DO NOT REMOVE: EOF_PR_TEMPLATE_V1_SENTINEL -->