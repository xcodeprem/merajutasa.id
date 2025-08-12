# MerajutASA – Progress Recap (Latest)  
Timestamp: 2025-08-12T03:59:01Z  
Scope: Menggabungkan rekap sebelumnya + penambahan dokumen baru (Credential Schema v1.0, Hysteresis Options Pack v1.0, Event Schema Canonical v1.0, Disclaimers Lint Spec v1.0, PII Pattern Library v1.0).  
Catatan: Tidak ada strategi / prinsip yang dihapus. Semua penambahan = elaborasi atas rencana yang telah disepakati.

---

## 1. RINGKASAN CEPAT (EXECUTIVE SNAPSHOT)

| Layer | Status Singkat | Delta Terbaru |
|-------|---------------|---------------|
| Strategi & Prinsip | Solid (final baseline) | Tidak berubah |
| IA & Narasi Publik | Stabil | Konsisten dengan Hero Constellation |
| Hero Constellation UI | Dummy siap + grammar cards terkunci | Tidak ada perubahan sejak refine |
| Integrity Primitives | DESAIN SIAP (credential schema final) | Credential Schema v1.0 selesai |
| Fairness Hysteresis | DESAIN SIAP (butuh keputusan adopsi Opsi F) | Hysteresis Options Pack selesai |
| Instrumentation | DESAIN SIAP (schema event final) | Event Schema v1.0 selesai |
| Governance Linting | Disclaimers lint spec selesai (siap implement) | Baru ditambahkan |
| Privacy Shield | PII pattern library final (v1.0) | Baru ditambahkan |
| Policy-as-Code (aggregation, disclaimers presence) | Belum dikerjakan (hanya definisi awal) | No change |
| Revocation Pipeline | Placeholder di schema (revocation object) | Menunggu implementasi |
| Feedback Pipeline | Skema tindakan + PII sanitasi siap (design) | PII scanner spec bantu readiness |
| Terminology Adoption Scanner | Belum ada script; definisi metrik jelas | No change |
| Performance / A11y Hardening | Belum dijalankan | No change |
| Analytics Dashboard | Belum implement query | Menunggu event collector |
| Change / Decision Logging | Format siap; DEC entries belum dibuat | Perlu eksekusi |

---

## 2. APA YANG SUDAH DILAKUKAN (DONE – DESIGN / SPEC COMPLETE)

Kategori di bawah = “Design Final & Siap Implement” (bisa langsung masuk ke coding tanpa perlu diskusi tambahan kecuali ratifikasi formal):

1. Master Spec v2.0 (Hero Constellation) – konsolidasi A–D + governance, fairness, disclaimers library, event mapping.
2. Integrity Credential Schema v1.0 – JSON-LD, JSON Schema, canonicalization, revocation placeholder, lint & policy hooks.
3. Hysteresis Options Decision Pack v1.0 – Opsi A/E/F; rekomendasi F (Hybrid) + parameter baseline (0.50 / 0.60 / 0.65).
4. Event Schema Canonical v1.0 – Struktur top-level, taxonomy event, meta sub-schema strategy, integrity hashing, governance change control.
5. Disclaimers Presence & Integrity Lint Spec v1.0 – Mapping halaman → ID D1–D7, drift detection, similarity threshold 0.90, banned phrase net.
6. PII Pattern Library & Detection Framework v1.0 – Kategori, regex, decision tree, redaction strategy, hashing salts, metrics.
7. Governance & risk articulation di bagian-bagian pendukung (risk register fairness, privacy threat model).
8. UI hero refined dummy code (landing) diterima (baseline preference locked).
9. Backlog structured ownership (AI vs ANDA) + RACI ringkas.
10. Delegation model + quick-win packs teridentifikasi.

Status “Design Final” berarti: definisi, aturan, enumerasi, acceptance criteria, change policy, & risk mitigation sudah eksplisit.

---

## 3. APA YANG BELUM DILAKUKAN (MASIH KONSEP / BELUM KODE)

| Domain | Gap Utama | Dampak Jika Dibiarkan |
|--------|-----------|-----------------------|
| Signing Service (credential) | Belum ada service & key management | “Trust theater” (UI tanpa kriptografi) |
| Hash Chain Append & Verify API | Belum diimplementasi (hanya excerpt dummy) | Auditability eksternal tertunda |
| Event Collector / Validator | Belum ada endpoint & pipeline hash | Hilang baseline perilaku 30 hari pertama |
| Policy-as-Code (OPA / Rego) | Belum enforce min aggregation threshold / disclaimers presence | Risk field leakage & disclaimers drift |
| Hysteresis Engine | Belum diimplementasikan state machine & snapshot integration | Under-served toggle noise (ketidakstabilan persepsi) |
| Equity Snapshot Job | Belum ada scheduler / persistence tabel | Metric equity statis (dummy) |
| Feedback Backend | Belum menyimpan redacted feedback & aggregator | Partisipasi tidak dapat diukur valid |
| PII Scanner (runtime) | Belum ada modul produksi / test harness | Risiko PII leak di feedback |
| Disclaimers Lint Tool | Belum di-run di CI | Disclaimers bisa hilang saat refactor |
| Terminology Adoption Scanner | Belum script scanning | Stage gating tak terukur tepat |
| Revocation Endpoint & List | Placeholder saja | Revocation transparency nol saat insiden |
| A11y & Performance Budgets | Belum pipeline metrics LCP/CLS | Potensi performa turun tanpa deteksi |
| Analytics Dashboard | Query & materialized views belum | Data raw tanpa insight |
| Governance Decision Log Automation | Belum template DEC populating CI | Traceability manual & rentan lupa |
| Hash/Signature Test Vectors | Belum final (credential hash placeholder) | Regression tests tak bisa dikunci |

---

## 4. APA YANG SEHARUSNYA DILAKUKAN (PRIORITIZED EXECUTION ORDER)

Fokus 30 hari = Hardening Trust & Fairness (tidak melompat ke fitur sekunder).

### 4.1 Urutan Eksekusi Teknis (Blok Paling Kritis Lebih Dulu)

1. Integrity Core
   - Implement Ed25519 signing service (stateless API wrapping libsodium).
   - Canonicalization + content hash test vectors.
   - Hash Chain microservice: append endpoint + verify endpoint (sig + prevHash).
2. Fairness Core
   - Equity snapshot job (daily) + schema (org_ratio_snapshots, equity_summary).
   - Implement Hysteresis Option F state machine + internal instrumentation (sys_fairness_* events).
3. Governance & Guardrails
   - Disclaimers lint tool (CI blocking) + disclaimers hash manifest.
   - PII scanner runtime (feedback submission path) + redaction.
   - Event collector (ingestion + validation + event_hash injection).
4. Policy & Lint Expansion
   - Policy-as-code for min cell threshold (deny publish) & disclaimers presence confirm (CI).
   - Terminology adoption scanner (percentage, commit to master spec).
5. Observability & Analytics
   - Baseline dashboards (KPI definitions already set).
   - Anomaly detection stub (equity ratio sudden delta).
6. Transparency Hardening
   - Publish verify CLI docs & examples.
   - Add methodology equity/hysteresis section live (with chosen parameters).
7. Performance & A11y
   - Pre-render hero + set LCP budget enforcement.
   - A11y audit script (axe) gating.
8. Feedback Lifecycle
   - Storage schema (feedback_submissions sanitized), monthly roll-up task.
9. Revocation Preparation
   - Empty revocation list endpoint + update credential viewer to show “0 revoked”.

### 4.2 7-Day Focus (Actionable)
| Day | Milestone |
|-----|-----------|
| 1 | Ratify decisions: Hysteresis Option F parameters + Credential schema open decisions |
| 2 | Implement signing service (MVP) + commit test vector |
| 3 | Hash chain append + verify endpoints (memory / file log) |
| 4 | Event collector skeleton + hero events ingestion |
| 5 | Disclaimers lint integrated CI + failing test demo |
| 6 | PII scanner integrated feedback route (BLOCK + REDACT flows) |
| 7 | Equity snapshot job (manual run) + stub hysteresis transitions (logging only) |

### 4.3 30-Day Outcomes
| Outcome | Description |
|---------|-------------|
| Credential issuance end-to-end verifiable | CLI verify returns valid |
| Equity + Under-served stable labeling | Hysteresis states persist |
| Analytics baseline collected | ≥80% core events ingested |
| Privacy shield active | PII block & redaction rates visible |
| Governance logs hashed | DEC entries referencing schema & hysteresis adoption |
| Lint gates enforced | Disclaimers & hype prevention functioning |

---

## 5. RAG STATUS (UPDATED)

Legend: G = Good (design + not risky), A = Amber (design done, implement pending), R = Red (no implementation & high risk), B = Blue (completed & ratified later).

| Domain | Status | Comment (Delta) |
|--------|--------|-----------------|
| Strategic Narrative | G | Stabil |
| Principles & Guardrails | G | Tidak berubah |
| Hero UI (Dummy) | G | Kode dummy tersedia |
| Credential Schema | B | Spec final (menunggu ratifikasi) |
| Signing Service | R | Belum mulai |
| Hash Chain | R | Belum mulai |
| Hysteresis Spec | B | Pack siap; menunggu keputusan “KEPUTUSAN: Opsi F” |
| Hysteresis Implementation | R | Belum mulai |
| Equity Snapshot Job | R | Belum mulai |
| Event Schema | B | Final (v1.0) |
| Event Collector | R | Kosong |
| Disclaimers Lint Spec | B | Final |
| Disclaimers Lint Tool | R | Belum implement |
| PII Pattern Library | B | Final |
| PII Scanner Runtime | R | Belum implement |
| Policy-as-Code Threshold | R | Belum |
| Terminology Scanner | R | Belum |
| Feedback Backend | R | Belum |
| Revocation Placeholder | A | Schema ready; endpoint kosong |
| Verify CLI Doc | A | Belum ditulis (siap on-demand) |
| A11y Audit Pipeline | A | Belum buat script |
| Performance Budget Enforce | A | Target belum di CI |
| Dashboard KPIs | R | Belum query |
| Governance DEC Entries | R | Belum dibuat |
| Risk Monitoring (anomaly watchers) | R | Belum |
| Change Log Public Page (phase 1.5) | A | Scheduled nanti |

---

## 6. PERGESERAN SEJAK REKAP TERAKHIR

| Elemen | Sebelumnya | Sekarang | Dampak |
|--------|------------|----------|--------|
| Credential Schema | Draft idea | Spesifikasi final lengkap | Siap implement signer |
| Hysteresis | Konsep umum | Opsi komparatif + rekomendasi F | Menunggu ratifikasi cepat |
| Event Schema | Outline | Canonical doc v1.0 | Backend dapat langsung code |
| Disclaimers Lint | High-level guard | Spes lengkap aturan & algoritma | Bisa gating deploy |
| PII Detection | Konsep kategori | Library regex + actions + metrics | Feedback privacy bisa diterapkan |
| Backlog Prioritization | Umum | Terikat per track + hari | Mempercepat alignment implementasi |

---

## 7. GAP & RISIKO PRIORITAS (TOP 6)

| Risiko | Mengapa Penting | Mitigasi Segera |
|--------|-----------------|-----------------|
| Trust Theater (no cryptographic proofs) | Bisa merusak persepsi integritas launching | Implement signer + chain sebelum kampanye publik |
| Fluktuasi Under-served (tanpa hysteresis) | Menurunkan kredibilitas fairness | Ratify & implement Option F |
| PII Leakage pada Feedback | Pelanggaran privasi + reputasi | PII scanner + redaction hari pertama |
| Missing Disclaimers saat Refactor | Hilangnya guardrails etis | Pasang lint disclaimers |
| Blindness Instrumentation | Tidak bisa ukur baseline perilaku user awal | Event collector minimal ASAP |
| Policy Gate Absent | Potensi bocor field sensitif ke publik | OPA rule min cell threshold + disclaimers gate |

---

## 8. DIRECT ACTION LIST (TOP 15 – URUT EKSEKUSI)

1. KEPUTUSAN: Hysteresis Option F + parameter (konfirmasi).
2. KEPUTUSAN: Credential schema open decisions (expiration timing, evidence hash length).
3. Buat DEC entries (hero adoption, credential schema ratification, hysteresis adoption).
4. Signer MVP (Ed25519) + test vector file.
5. Canonical hash chain minimal (append, list, verify).
6. Equity snapshot script + storage table definisi.
7. Hysteresis state machine implement (log only) → refine → publish.
8. Event collector + validation (base schema + a few meta sub-schemas).
9. Disclaimers lint CI (fail scenario demo).
10. PII scanner integration + redaction + block events emission.
11. Policy-as-code rule (aggregation min cell threshold).
12. Terminology adoption scanner (regex term audit).
13. CLI verify doc (developer usage).
14. Basic analytics queries (hero interaction coverage, feedback submission rate).
15. Performance pre-render + LCP budget gating.

---

## 9. KEPUTUSAN YANG MENUNGGU (BLOCKERS)

| ID | Keputusan | Dampak Jika Tertunda |
|----|-----------|----------------------|
| DEC-HYST-01 | Opsi hysteresis final | Equity label noisy |
| DEC-CRED-02 | Evidence hash display length | UI implement berat mundur |
| DEC-CRED-03 | Expiration adoption timing | Revocation planning delay |
| DEC-POLICY-04 | Min cell threshold numeric | Policy-as-code pending |
| DEC-LINT-05 | min_similarity disclaimers (0.90) | Lint tuning tidak jalan |
| DEC-PII-06 | multi_category_block_threshold (2) | Escalation logic uncertain |
| DEC-EVT-07 | classification meta truncation 2dp | Event pipeline finalize meta |
| DEC-D7-08 | Optional D7 hero usage default | UI conditional logic |

---

## 10. METRIK YANG AKAN MULAI DIPANTAU (SETELAH IMPLEMENT)

| Metric | Sumber Event / Log | Target Awal |
|--------|--------------------|-------------|
| Hero Module Interaction Coverage | event landing + hero cta | ≥35% |
| Credential Verify Attempt Rate | pub_hash_verify_click / trust view | ≥10% skeptics awal |
| Under-served Churn Rate | sys_fairness enter/exit | <15% |
| PII Block Rate | feedback block events | <20% (indikasi edukasi cukup) |
| Disclaimers Drift Attempts | lint logs | 0 (error) |
| Equity Anomaly Alerts | snapshot delta >3% | Tercatat & dijelaskan |
| Feedback Submission Rate | submit / sessions | Benchmark baseline |
| Terminology Adoption Progress | scanner output | +X% per 30 hari (belum target final) |

---

## 11. DEPENDENSI SILANG (CRITICAL PATH)

```
Signer + Chain --> (Credential verify CLI, Trust page credibility)
Equity Snapshot --> (Hysteresis engine) --> (Stable under-served UI)
Event Collector --> (Analytics KPIs, Fairness activation measurement)
PII Scanner --> (Feedback pipeline) --> (Participation metrics valid)
Disclaimers Lint --> (UI refactors safe) --> (Governance confidence)
Policy-as-Code --> (Publication gating) --> (Metric authenticity)
```

---

## 12. STATUS DETAIL PER TRACK

### Track A – Integrity
- Credential schema final (OK).
- Pending: signer, chain, test vector, CLI doc.
- Risk: Launch before cryptographic readiness (jangan).

### Track B – Fairness
- Hysteresis design finished; pending DEC.
- Equity snapshot job & data persistence absent.
- Under-served UI currently dummy; risk toggling noise.

### Track C – Governance & Policy
- Lint disclaimers spec ready; implementation pending.
- Policy-as-code scripts (aggregation threshold) belum.
- Decision log automation belum (need file template + script).

### Track D – Instrumentation & Analytics
- Event schema ready.
- Collector & validator missing.
- No pipeline hash instrumentation yet (integrity object still conceptual).

### Track E – Privacy & Security
- PII pattern library final; runtime scanner missing.
- Hash salt rotation strategy defined; not implemented.
- No privacy dashboard yet (to visualize block vs redact).

### Track F – Content & Terminology
- Disclaimers canonical stable.
- Terminology adoption field appears in credential (optional) but scanner not implemented → cannot auto-update adoptionPercent.

### Track G – Participation
- Feedback form (front-end) part of dummy but backend not capturing sanitized data.
- Category taxonomy (governance, fairness, improvement) not yet coded.

### Track H – Performance & A11y
- Budgets defined conceptually.
- Need actual measurement harness + threshold enforcement.

### Track I – Revocation Future
- Placeholder fields; no list endpoint.
- No revocation reason code finalization.

---

## 13. PERUBAHAN RAG (LIST VIEW)

| Domain | Prev | Now | Why |
|--------|------|-----|-----|
| Credential Schema | A | B | Final doc created |
| Event Schema | A | B | Canonical spec done |
| Hysteresis Design | A | B | Decision pack done |
| Disclaimers Lint Spec | N/A | B | Baru |
| PII Pattern Library | N/A | B | Baru |

(B = “Blueprint Final / Ready for Implementation”)

---

## 14. REKOMENDASI URGEN LANGSUNG (NEXT 3 KOMANDO YANG ANDA BISA KIRIM KE AI)

1. “KEPUTUSAN: Opsi F hysteresis parameter disetujui (0.50 / 0.60 / 0.65, cooldown 1, stalled 5).”
2. “MINTA: Template DEC credential schema & hysteresis & event schema.”
3. “LANJUTKAN: Verify CLI doc” (untuk percepat integritas publik).

---

## 15. CHECKLIST HARLAN (HARI INI)

[ ] Konfirmasi hysteresis Option F  
[ ] Konfirmasi credential evidence hash display length (16 chars)  
[ ] Buat DEC entries (hero v2 sudah boleh)  
[ ] Mulai implement signer skeleton  
[ ] Mulai collector endpoint minimal (validasi + event_hash)  

---

## 16. RESUME SINGKAT (SATU KALIMAT)

“Kita sudah memformalkan semua pilar desain (credential, fairness hysteresis, instrumentation, disclaimers, PII) dan sekarang bottleneck utama adalah eksekusi integritas kriptografis, pipeline fairness stabil, serta guardrail lint & privacy scanner sebelum baseline perilaku pertama hilang.”

---

## 17. APA YANG DIBUTUHKAN DARI ANDA SEKARANG

| Area | Input Anda |
|------|------------|
| Hysteresis | Pilih Opsi F & parameter final |
| Credential | Putuskan evidence hash display (16 vs 24), expiration timing (tunda vs immediate) |
| Policy Threshold | Nilai min cell aggregation (misal 5) |
| Disclaimers Optional D7 | Default off atau on? (disarankan off sampai confusion sinyal) |
| PII Config | Confirm multi_category_block_threshold = 2 |
| Event Meta | Classification equity truncated 2 dp disetujui? |
| Governance Logging | Format DEC file naming (e.g., DEC-YYYYMMDD-XX.md) |

---

## 18. SIAP DILAKUKAN OLEH AI SETELAH KEPUTUSAN

| Paket | Output |
|-------|--------|
| DEC Templates | 3 file markdown (credential schema, hysteresis, event schema) |
| Verify CLI Doc | petunjuk langkah verifikasi + contoh hash mismatch |
| Policy-as-Code Draft | Rego snippet min cell threshold & disclaimers presence |
| Equity Snapshot Pseudocode | Cron job loop + DB schema definisi |
| Signer Service Interface | Endpoint contract + error codes |

Perintah contoh:  
- “LANJUTKAN: DEC templates”  
- “LANJUTKAN: Verify CLI doc”  
- “LANJUTKAN: Policy-as-code min cell threshold”  

---

## 19. PENUTUP

Semua jalur tetap konsisten dengan GP1–GP10. Tidak ada penurunan komitmen terhadap non-ranking fairness & privacy. Fokus sekarang = menghapus jurang antara blueprint dan trust primitives nyata. Kecepatan implementasi 2 minggu pertama akan menentukan kredibilitas eksternal jangka panjang.

(End of Progress Recap – Latest)