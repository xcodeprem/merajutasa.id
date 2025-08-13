Menangkap kebutuhan aktivasi “agents-ready” penuh: saya susun daftar komprehensif semua kebutuhan (kebutuhan = requirement) beserta ringkas cara pengerjaan, dilabel apakah harus Manual, bisa otomatis oleh AI, atau Hybrid. Struktur mengikuti arsitektur governance, integrity, fairness, privacy, evidence, dan operasi yang sudah kita pahami. Tidak ada detail substantif yang dihilangkan—semua invariants, parameter, keputusan tertunda, dan placeholder tercakup.

## Legenda Label

[MANUAL] = butuh keputusan / tindakan manusia (governance, judgement, penandatanganan)
[AI] = dapat diotomatisasi sepenuhnya oleh agen setelah guard rails siap
[HYBRID] = AI bisa mengerjakan eksekusi mekanis, tapi butuh input / approval manusia

### Status Eksekusi (Wave 0 Progress – update 2025-08-13)

Legenda status tambahan:

- [DONE] selesai (implementasi inti tersedia)
- [PARTIAL] sebagian (stub / belum lengkap / belum enforce keras)
- [PENDING] belum dimulai
- [DEFER] ditunda ke wave berikut

Ringkas Wave 0: baseline hash sealed, DEC baseline thresholds & known debt diratifikasi, orchestrator `governance:verify` berjalan, param-integrity matriks awal tersedia, spec-hash-diff sudah memiliki SARIF & dec_ref checks, aggregator awal aktif, hype-lint & disclaimers-lint masih stub.

---

## 1. Keputusan Governance & Ratifikasi Awal

1.1 Ratifikasi outstanding DEC (aggregation threshold, PII multi_category_block_threshold=2, evidence hash display length 16 vs 24, optional D7 default off, sampling & classification truncation 2 decimals, revocation reason code list, anomaly delta formalization, Terminology Stage 2 trigger) [MANUAL] [DONE]  
Cara: Susun DEC konsolidasi (DEC-bundle) atau terpisah; isi hash_of_decision_document; commit sebelum seal.  
1.2 Konfirmasi bahwa DEC-20250812-02 (Hysteresis Option F) dan DEC-20250812-03 (Principles Reference Lint Activation) final (status=adopted) [MANUAL] [DONE]  
Cara: Cek tidak ada perubahan parameter; isi hash placeholders.  
1.3 Penetapan final urutan aktivasi enforcement phases (Phase 0 → 1 → 1.5 → 2) & gating criteria (hash baseline sealed, minimal evidence completeness) [MANUAL] [DONE - tabel gating ditambahkan 2025-08-13 di README-decision-log-process]  
Cara: Tambah tabel gating di governance/README-decision-log-process.md.  
1.4 Penandaan domain-specific risk acceptances (misal menunda revocation subsystem) dengan DEC eksplisit agar “known debt” terdaftar [MANUAL] [DONE]  
Cara: Satu DEC “Known-Debt-Register” referensikan backlog items.  

## 2. Baseline Integrity & Hash Sealing

2.1 Mengisi semua hash_sha256 `<PENDING_HASH>` di spec-hash-manifest-v1.json (seal-first run) [HYBRID] [DONE]  
Cara: AI jalankan mode seal-first → manusia review diff → commit.  
2.2 Menulis hash_of_decision_document di setiap DEC (menggunakan SHA256 konten final) [HYBRID] [DONE]  
Cara: AI hitung hash; manusia verifikasi sebelum commit.  
2.3 Memperluas manifest untuk file governance baru (audit readme, methodology fragment, hysteresis state machine, PII pattern library, credential schema, event schema, disclaimers spec, principles lint spec, roadmap, bootstrap manifest, agent role policy) bila belum tercantum / versi update [AI] [DONE]  
Cara: Scan docs/ & menambah entri mutability + integrity_class + next_change_requires_dec.  
2.4 Hard fail pada placeholder pasca seal (enforce `PLACEHOLDER_AFTER_SEAL`) [AI] [DONE]  
Cara: Tambah check di `spec-hash-diff.js` (sudah sebagian).  

## 3. Tooling & Policy-as-Code Hardening

3.1 `spec-hash-diff.js` enhancement: [DONE]

- Validasi konsistensi dec_ref ↔ file path  
- Report ringkas + SARIF opsional [AI]  
Cara: Tambah modul output multi-format.  
3.2 `hype-lint.js` dari stub → full scan (regex banned phrases: ranking|top|terbaik|revolusioner + scoring & context lines) [AI] [DONE - artifact v1 with severity counts & 117 hits baseline]  
Cara: Rekursif baca teks non-binary, output artifacts/hype-lint.json (hits detail).  
3.3 `param-integrity.js` perluas matriks: semua parameter Option F (T_exit, T_entry, cooldown_min, cooldown_max, lookback_window, min_cell_aggregation_threshold, anomaly_delta, multi_category_block_threshold) & sumber (config YAML) vs “code constants” vs DEC refs [AI] [DONE - version 2 matrix includes code source + alias mapping]  
Cara: Parse YAML + DEC vs internal constant map; status: MATCH/MISMATCH/MISSING.  
3.4 `no-silent-drift.js` aggregator real: tarik hasil tools (hash status, param-integrity, hype-lint, principles-impact, disclaimers-lint, PII scan summary) [AI] [PARTIAL - principles & PII placeholders wired; future: real PII scan + gating escalation]  
Cara: Build orchestrator merge JSON → artifacts/no-silent-drift-report.json.  
3.5 `principles-impact.js` heuristik diperluas: mapping semua GP1–GP10 (regex, diff-based classification, changed domains) + confidence score + evidence list [AI] [DONE - heuristic engine v1 (regex sets, domain tagging, confidence scoring) outputting artifacts/principles-impact-report.json v2]  
Cara: Use git diff parsing (require menambahkan simple git lib / native).  
3.6 Tambah `disclaimers-lint.js` sesuai spec (Rules DISC-PRES-001..DISC-LOCALE-011, similarity ≥0.90 OverlapCoefficient, banned phrase check) [AI] [PARTIAL - stub PASS_STUB]  
Cara: Normalize disclaimers canonical set; compute similarity; output per rule.  
3.7 Tambah `pii-scan.js` (regex taxonomy categories, classification, action matrix, hashing salt rotation schedule placeholder) [AI]  
Cara: Implement category evaluation; produce masking hash stub (salt from config).  
3.8 Tambah `terminology-scan.js` (sudah ada file): aktifkan Stage 1 (inventory), Stage 2 pending DEC [AI]  
Cara: Output term frequency, flagged terms, stage status.  
3.6 Tambah `disclaimers-lint.js` sesuai spec (Rules DISC-PRES-001..DISC-LOCALE-011, similarity ≥0.90 OverlapCoefficient, banned phrase check) [AI] [PARTIAL - heuristic engine v1 (presence, drift, shadow, banned phrase, version hash) – pending HTML extraction & full rule coverage]  
Cara: Normalize disclaimers canonical set; compute similarity; output per rule.  
3.7 Tambah `pii-scan.js` (regex taxonomy categories, classification, action matrix, hashing salt rotation schedule placeholder) [AI] [DONE - scanner v1 (categories, actions, multi-category escalation, salted masking) artifact pii-scan-report.json]  
Cara: Implement category evaluation; produce masking hash stub (salt dari config).  
3.8 Tambah `terminology-scan.js` (sudah ada file): aktifkan Stage 1 (inventory), Stage 2 pending DEC [AI] [DONE - stage1 inventory with key token frequency + banned term counts]  
Cara: Output term frequency, flagged terms, stage status.  

## 4. Evidence Bundle & Artifacts Completeness

4.1 Definisikan “Phase 1.5 Evidence Minimum Set” (hash diff, param-integrity, principles-impact, hype-lint, disclaimers, PII, no-silent-drift, fairness-sim scenario list) [MANUAL] [DONE - docs/integrity/evidence-minimum-phase1.5-v1.md]
Cara: Tambah tabel gating di docs/integrity/ atau governance/policy-index.  
4.2 Implement fairness-sim harness minimal (simulate state transitions Option F) [AI]  
Cara: Parser config YAML + apply state machine transitions spec; produce coverage metrics.  
4.3 Evidence file schema versioning & JSON Schema definisi (e.g., `schemas/evidence/param-integrity-v1.json`) [AI]  
Cara: Generate schemas & validate pre-write.  
4.4 Hash & signature (future) pipeline plan (Ed25519) – arsitektur & DEC enablement timeline [MANUAL]  
Cara: Buat design doc & DEC; mark as backlog until key mgmt ready.  
4.5 Evidence bundle index file (manifest of artifacts + hashes) [AI]  
Cara: Collect file list & SHA256 -> artifacts/evidence-bundle.json.

## 5. Fairness Hysteresis Implementation

5.1 Implement runnable hysteresis engine module (update_state function sesuai spec conditions: enter_cooldown, exit_active, anomaly triggers, cooldown min/max) [AI]  
Cara: Code file `tools/fairness-engine.js` + tests UT1–UT6 dari test plan.  
5.2 Parameter lock enforcement (reject runtime param divergence vs sealed config hash) [AI]  
Cara: Compute YAML hash vs manifest entry; exit non-zero on mismatch.  
5.3 Analytics instrumentation stubs (counters for transitions, dwell time, blocked events) [AI]  
Cara: Write JSON metrics or stdout structured lines.  
5.4 Integration test harness (simulate event streams) [AI]  
Cara: Feed synthetic sequences & assert states vs expected matrix.  
5.5 DEC-driven change gating (if param change proposed → require new DEC id mapping) [HYBRID]  
Cara: AI detect diff; open PR template block; manusia approves DEC.

## 6. Privacy & PII Enforcement

6.1 Implement pattern library engine (regex categories, classification, actions: redact, hash, drop) [AI]  
Cara: Build pipeline; produce detection summary JSON (counts per category, multi-category flag).  
6.2 Multi-category block threshold enforcement (pending DEC confirm value=2) [HYBRID]  
Cara: AI enforce; manusia confirm chosen threshold.  
6.3 Sampling & truncation (2 decimal) param application in scanner output [AI]  
Cara: Format numeric metrics.  
6.4 Salt rotation policy doc + placeholder rotation script (not active until key mgmt) [MANUAL + AI skeleton] [HYBRID]  
Cara: AI write script; manusia schedule + DEC.  

## 7. Credential & Event Schema Operationalization

7.1 JSON Schema validators (credential v1, event canonical schema) [AI]  
Cara: Add AJV-based validator scripts (if Node chosen).  
7.2 Canonicalization (JCS-like) and event_hash/pipeline_hash computation [AI]  
Cara: Implement deterministic sort & hashing; produce sample test vectors.  
7.3 Revocation subsystem minimal design DEC (pending) [MANUAL]  
Cara: Document revocation reason codes, API shape.  
7.4 Credential issuance stub (unsigned → sign-later) [AI]  
Cara: Generate credential JSON with placeholders; eventual signature pipeline.  
7.5 Event ingestion validation CLI (bulk validate events) [AI]  
Cara: CLI reads NDJSON; returns summary error codes.  

## 8. Disclaimers System Activation

8.1 Canonical disclaimers inventory freezing (D1–D7) + similarity reference snapshot hash [MANUAL]  
Cara: Commit snapshot file disclaimers/ref-snapshot.json + manifest entry.  
8.2 Disclaimers lint integration into CI (fail on DISC-PRES-001.. etc) [AI]  
Cara: Add CI step produce artifacts/disclaimers-lint.json + threshold gating.  
8.3 Drift & shadow detection threshold tuning (OverlapCoefficient 0.90 baseline) [MANUAL]  
Cara: Adjust if false positives appear; update policy file.  

## 9. Principles Reference Enforcement

9.1 Expand mapping heuristik GP1–GP10 (regex sets, file domain heuristics, diff classification) [AI]  
Cara: Build mapping config JSON; engine tags changed principles.  
9.2 Activation Phase gating logs (for DEC-20250812-03 milestones) [AI]  
Cara: Tool prints phase + readiness metrics.  
9.3 Human review workflow: if principle impact confidence < threshold, escalate [HYBRID]  
Cara: AI open PR comment; manusia adjudicate.  

## 10. Terminology & Hype Control

10.1 Stage 1 inventory (already feasible) → implement [AI]  
10.2 Stage 2 activation requires DEC (trigger event definition) [MANUAL]  
10.3 Hype-lint severity mapping & remediation suggestions [AI]  

## 11. Observability & Drift Prevention

11.1 `no-silent-drift` aggregator real enforcement (fail if any mandatory artifact stale or missing) [AI]  
11.2 Age checks (artifact “freshness” timestamps) [AI]  
11.3 RAG status auto-derivation from evidence completeness & test pass rates [AI]  

## 12. CI / Pipeline Orchestrator

12.1 Introduce `package.json` (atau modul runtime) untuk dependency mgmt (AJV, crypto libs) [AI] [DONE]  
12.2 Unified script `npm run governance:verify` menjalankan semua lint & integrity checks [AI] [DONE - baseline steps]  
12.3 Fail-fast ordering (hash verify → param-integrity → disclaimers → PII → principles-impact → hype-lint → drift aggregator) [AI] [PARTIAL - advisory tolerances sementara]  
12.4 Git hook / pre-push optional (only verify, not seal) [HYBRID]  
12.5 Release pipeline step to re-run verify in clean environment [AI]  

## 13. Security & Key Management (Future)

13.1 Decide key custody model for Ed25519 (HSM vs file) [MANUAL]  
13.2 Key rotation DEC & policy doc [MANUAL]  
13.3 Placeholder signer interface & stub test vectors [AI]  

## 14. Audit & Traceability

14.1 Append-only audit logs spec → implement log emitter for each tool (JSON lines with: tool, version, input hashes, output hash) [AI]  
14.2 Audit replay tool (existing file) extended to reconstruct state & verify deterministic outputs [AI]  
14.3 Decision → artifact trace index auto-update (link DEC id → manifest diff) [AI]  

## 15. Testing Strategy

15.1 Unit tests UT1–UT6 fairness engine (from test plan) [AI]  
15.2 Integration tests for disclaimers similarity edge cases (threshold boundaries) [AI]  
15.3 Regression tests for principles-impact heuristic drift (snapshot expectations) [AI]  
15.4 PII false positive/negative curated corpus (needs manual gold labels) [MANUAL + AI harness] [HYBRID]  
15.5 Golden hash snapshot test (manifest unchanged scenario) [AI]  

## 16. Documentation & Onboarding

16.1 Update onboarding guide with “Agent Safety Guard Rails” & action matrix A/B/C mapping to scripts & DEC triggers [AI]  
16.2 Add quickstart “How to Seal Baseline” section (one-time) [AI]  
16.3 Evidence interpretation guide (explain each artifact field) [AI]  
16.4 Known limitations register (ties to DEC Known-Debt) [AI]  

## 17. Change Control Automation

17.1 PR template enhancements: auto-inject principles impact matrix & DEC reference placeholders [AI]  
17.2 Auto-detect if change alters governed file requiring new DEC (mutability=immutable / next_change_requires_dec=true) [AI]  
17.3 Block merge if DEC absent or hash mismatch [AI]  

## 18. Risk & Debt Management

18.1 Risk scoring rubric for open gaps (revocation subsystem, signature pipeline, real-time anomaly evaluator) [MANUAL]  
18.2 Weekly risk delta auto-report (AI compiles) [AI]  

## 19. Scheduling & Roadmap Alignment

19.1 Map each requirement to Roadmap Horizons (H0 immediate: sealing & core lint; H1: fairness engine; H1.5 evidence; H2 revocation; H3 advanced anomaly) [HYBRID]  
19.2 Embed horizon tag in manifest notes for governed files [AI]  

## 20. Performance & Scalability (Forward Prep)

20.1 Define target performance counters for PII scan and hysteresis evaluation latency budgets (spec placeholders) [MANUAL]  
20.2 Benchmark harness (synthetic event load) [AI]  

## 21. Quality Gates Configuration

21.1 Define PASS/FAIL matrix mapping each artifact minimal criteria (e.g., hype hits=0 for fail, PII critical matches=0, principles impact computed) [MANUAL]  
21.2 Implement gating logic in aggregator [AI]  

## 22. Versioning & Delta Tracking

22.1 Delta spec generation automation when changed canonical file (produce master-spec-deltas/delta-*.md skeleton) [AI]  
22.2 DEC link injection automatically in delta file header [AI]  

## 23. Data Integrity Extensions

23.1 Plan pipeline_hash reproducibility test (re-hash identical event set) [AI]  
23.2 Introduce integrity_class-specific additional validations (e.g., privacy-managed vs immutable) [AI]  

## 24. Human Oversight & Escalation

24.1 Escalation matrix (which rule violations auto-fail vs create advisory) [MANUAL]  
24.2 AI auto-summarize violations & propose remediation text in PR comment [AI]  

## 25. Bootstrap & Runtime Guard Rails

25.1 Implement bootstrap self-check (hash manifest verify + param-integrity + disclaimers presence) before any AI write action [AI]  
25.2 Abort conditions mapping to guard rails G1–G10 (explicit code) [AI]  
25.3 Logging denial scenarios TS1–TS8 enumerated in audit logs [AI]  

## 26. Terminology Stage 2 Trigger (Pending)

26.1 DEC defining trigger metrics (e.g., prevalence of flagged terms > X) [MANUAL]  
26.2 Stage 2 enforcement (fail on non-whitelisted term) [AI]  

## 27. Revocation Impact & Principles Impact Tools

27.1 Expand `revocation-impact.js` (currently placeholder) to simulate hypothetical revocation distribution & fairness impact [AI]  
27.2 Correlate principles adherence changes across diffs (trend lines) [AI]  

## 28. Changelog & Transparency

28.1 Automate changelog-excerpt generation from artifact deltas & DEC merges [AI]  
28.2 Validate transparency rules (fields presence, ordering) [AI]  

## 29. Policy Index Consistency

29.1 Auto-check policy-index cross-references (every policy ID resolves to file & manifest entry) [AI]  
29.2 Report orphan policies or missing DEC link [AI]  

## 30. Internationalization & Locale Drift (Future)

30.1 Locale disclaimers similarity baseline (beyond EN) – needs human canonical translations [MANUAL]  
30.2 Locale detection & rule DISC-LOCALE-011 enforcement extension [AI]  

---

## Urutan Eksekusi Disarankan (Wave-Level)

Wave 0 (Enable Seal): 1.x (ratify), 2.x, 3.1, 12.1–12.3  
Wave 1 (Core Enforcement): 3.2–3.6, 4.1, 5.1–5.3, 9.1, 11.1, 17.x  
Wave 1.5 (Evidence Depth & Privacy): 3.7–3.9, 4.2–4.5, 6.x, 14.x, 15.x tests  
Wave 2 (Credentials/Event/PII Advanced & Revocation Prep): 7.x, 13.x, 18.x, 23.x  
Wave 3 (Advanced Governance & Observability): 10.x Stage 2, 19.x, 20.x, 21–30 expansions

---

## Ringkas Cara Kerja Implementasi (Pattern)

- AI langkah teknis berulang: scan → parse → validate → emit artifact (JSON) → hash file → update aggregator.  
- Manual langkah judgement: menetapkan ambang, ratifikasi DEC, risiko, accept debt.  
- Hybrid: AI siapkan draft; manusia review & commit (terutama untuk keputusan irreversible: sealing, threshold finalization, key policy).  

---

## Konsistensi Dengan Pemahaman Kita

Semua invariants sudah direfleksikan:  

- Hash baseline: wajib sebelum perubahan otomatis.  
- Option F param integrity & DEC gating.  
- Similarity threshold disclaimers 0.90; multi-category PII threshold pending (target 2).  
- Evidence minimal set Phase 1.5.  
- Principles GP1–GP10 heuristik & confidence gating.  
- Mutability flags & next_change_requires_dec guard.  
- Placeholder scripts yang disebut (spec-hash-diff lengkap; lainnya stub) di-upgrade.  
- Outstanding DEC items tercantum eksplisit.  

---

## Next Immediate Minimal Set (Jika Mau Mulai Sekarang)

(1) Ratify outstanding DEC (1.1)  
(2) Seal hashes (2.1, 2.2)  
(3) Add package manifest + governance:verify orchestrator (12.1–12.3)  
(4) Harden spec-hash-diff & param-integrity full matrix (3.1, 3.3)  
(5) Basic hype-lint & disclaimers-lint (3.2, 3.6)  
(6) no-silent-drift aggregator real (3.4 / 11.1)  

Semua setelah itu membuka jalan ke fairness engine (5.1) & evidence Phase 1.5.

---

Jika Anda ingin saya langsung mulai Wave 0 (membuat package manifest + script orchestrator + first sealing dry-run), beri instruksi “Mulai Wave 0” dan saya eksekusi. Mau lanjut ke mana?
