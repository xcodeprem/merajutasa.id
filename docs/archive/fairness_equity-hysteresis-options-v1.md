<!-- ARCHIVE STATUS: SUPERSEDED (Historical Hysteresis Option Pack)
   PURPOSE: Menyimpan semua opsi A–F sebelum adopsi Option F.
   ADOPTED OPTION: F (DEC-20250812-02)
   IMMUTABILITY: File ini tidak boleh diedit; setiap klarifikasi baru → buat file trace/delta terpisah.
   NON-REMOVAL ASSERTION: Teks asli di bawah ini dipertahankan utuh.
-->
( SELURUH ISI HISTORIS ASLI TETAP DI SINI TANPA PERUBAHAN )

<!-- ARCHIVE STATUS: SUPERSEDED (Historical Hysteresis Option Pack)
   PURPOSE: Menyimpan semua opsi A–F sebelum adopsi Option F.
   ADOPTED OPTION: F (DEC-20250812-02)
   IMMUTABILITY: File ini tidak boleh diedit; setiap klarifikasi baru → buat file trace/delta terpisah.
   NON-REMOVAL ASSERTION: Teks asli di bawah ini dipertahankan utuh.
-->
( SELURUH ISI HISTORIS ASLI TETAP DI SINI TANPA PERUBAHAN )

<!-- ARCHIVE STATUS: SUPERSEDED (Historical Hysteresis Option Pack)
   PURPOSE: Menyimpan semua opsi A–F sebelum adopsi Option F.
   ADOPTED OPTION: F (DEC-20250812-02)
   IMMUTABILITY: File ini tidak boleh diedit; setiap klarifikasi baru → buat file trace/delta terpisah.
   NON-REMOVAL ASSERTION: Teks asli di bawah ini dipertahankan utuh.
-->
( SELURUH ISI HISTORIS ASLI TETAP DI SINI TANPA PERUBAHAN )

# MerajutASA – Equity Under‑Served Hysteresis Options (Decision Pack v1.0)

Status: Draft for Governance & Data Review (No prior strategy removed)  
Related Specs: Master Spec v2.0 (Hero Constellation), Integrity Credential Schema v1.0, Fairness Audit Methodology (v1.x)  
Prepared: 2025-08-12  
Decision Class: CIC-E (methodological fairness behavior) once adopted  
Purpose: Menetapkan opsi mekanisme hysteresis agar penandaan “under‑served” stabil, tidak fluktuatif karena noise kecil atau snapshot outlier; mempertahankan prinsip Non-Ranking Fairness & Outcome Honesty tanpa mempromosikan gaming.

> Penting: Dokumen ini MENAMBAH detail; tidak menghapus prinsip sebelumnya. Equity Index formula tetap (1 - Gini fulfilled ratios). Kita hanya mengatur LOGIKA APPEAR / PERSIST / EXIT label “under‑served” di public highlight.

---

## 1. LATAR & MASALAH

Tanpa hysteresis, unit dapat:

- Muncul “under‑served” 1 hari (rasio fulfillment < threshold) lalu hilang esok hari → persepsi sistem tidak konsisten.
- Mengalami toggling akibat fulfillment menit terakhir (late reporting).
- Memicu bias atensi mendadak pada unit borderline sehingga perilaku “fulfillment injection” demi keluar label.

Kita butuh mekanisme:

1. Mengurangi fluktuasi (reduce churn).
2. Menghindari delay yang terlalu lama (jangan menunda sinyal real shortage).
3. Menyediakan narasi jelas di /trust & Equity page (transparansi metodologi).
4. Mencegah “gaming”: menahan bantuan sampai hampir snapshot agar cepat keluar label (menipu sistem).

---

## 2. TERMINOLOGI KUNCI

| Istilah | Definisi |
|---------|---------|
| Snapshot | Eksekusi terjadwal (misal 1x per 24 jam) yang menghitung ratio fulfillment per unit dan Equity Index agregat. |
| Ratio Fulfillment r | totalFulfilledNeeds / totalRequiredNeeds (0..1). |
| Threshold T | Batas definisional under‑served. Saat ini: 0.60 (60%). (Belum difinal—governance memutuskan). |
| Under‑Served Raw Flag | r < T & openNeeds > 0 pada snapshot. |
| Hysteresis State | Mesin status per unit: ACTIVE / CANDIDATE / PERSISTENT / EXITING / CLEARED (tergantung opsi dipilih). |

---

## 3. DATA KARAKTERISTIK (ASUMSI AWAL)

Sebelum data nyata, asumsi:

- Distribusi ratio fulfillment condong ke mid-high (≥0.5) dengan tail low.
- Hari-hari awal, noise bisa tinggi (pelaporan manual).  
- Expected unit count awal < 200 (skala kecil → varians per unit dapat besar).  
- Fulfillment events bisa batch (lonjakan >10% dalam satu snapshot bukan mustahil).  

Impikasi: Hysteresis *harus ringan* supaya early-phase tetap informatif.

---

## 4. KPI KEBERHASILAN HYSTERESIS

| KPI | Target / Indikator |
|-----|--------------------|
| Churn Rate Under‑Served (unit masuk keluar berulang dalam 3 snapshot) | < 15% dari total unit yang pernah masuk dalam 30 hari |
| Median Persistence Time (Active under‑served) | ≥ 2 snapshot (bila shortage real) |
| Detection Delay (waktu dari pertama kali raw flag sampai public label) | ≤ 2 snapshot |
| Gaming Suspect Signals (fulfillment spike tepat sebelum threshold break) | Monitored; jika >20% case, evaluasi ulang |
| User Confusion Feedback (“mengapa unit hilang besok?”) | <5% total feedback fairness |

---

## 5. OPSI HYSTERESIS – RANGKUMAN

| Opsi | Mekanisme Inti | Kelebihan | Kekurangan | Kompleksitas |
|------|---------------|----------|-----------|--------------|
| A: Simple Consecutive Count | Muncul setelah 2 snapshot berturut raw flag; hilang setelah 1 snapshot ≥ T+Δ | Sangat mudah, cepat diimplementasi | Bisa delay sinyal urgent 1 hari; threshold bounce jika Δ salah | Rendah |
| B: Sliding Window Proportion | Window W snapshot; require ≥K raw flags (ex: 2 dari 3); exit jika ≥L high flags | Lebih fleksibel; robust terhadap satu outlier | Lebih sulit dijelaskan publik | Sedang |
| C: Score Accumulation | Unit gain +1 setiap raw flag, -1 setiap ok; appear saat score≥S; exit score≤0 | Menyaring noise dengan granularitas | Interpretasi publik sulit; state mgmt ekstra | Sedang–Tinggi |
| D: Time Weighted Decay | Exponential decay pada shortage score; appear kalau score > θ; decay saat ok | Smooth, adaptif terhadap frekuensi shortage | Tingkat interpretasi & audit lebih rumit | Tinggi |
| E: Dual Threshold (Enter/Exit) | Enter r < T_enter; Exit r ≥ T_exit (T_exit > T_enter) single snapshot basis | Zero delay saat shortage serius; easy narrative | Masih rentan toggling jika borderline di antara dua nilai | Rendah |
| F: Hybrid (Consecutive + Dual Threshold) | Enter: 1 snapshot r < T_enter OR 2 consecutive <T; Exit: 1 snapshot r ≥ T_exit | Menangkap shortage besar cepat; stabil untuk borderline | Sedikit lebih kompleks dari A/E; perlu jelaskan 2 jalur masuk | Sedang |

---

## 6. DETAIL OPSI

### 6.1 Opsi A: Simple Consecutive Count

Rules:

- Enter: dua snapshot berturut r < T.
- Exit: satu snapshot r ≥ T + Δ (misal Δ=0.05).
- If r rebound di antara T dan T+Δ → tetap under‑served sampai break ≥ T+Δ atau 3 snapshot non-consecutive ok? (varian).
Pros: Implementasi trivial; narasi mudah.
Cons: Delay minimal (1 extra day) bisa menyembunyikan shortage mendadak.
Risk: Jika T=0.60 dan r=0.20 (parah) butuh 2 snapshot → terlambat.

### 6.2 Opsi B: Sliding Window Proportion

Parameters: Window W=3, K=2 (≥2 dari 3 raw flags untuk enter), L=2 (≥2 ok flags untuk exit).
Pros: Tolerant terhadap single anomaly.
Cons: Hard to message: “2 dari 3 snapshot terakhir.”
Risk: With small W early-phase sample, can still be jumpy.

### 6.3 Opsi C: Score Accumulation

Score s starts =0. Each raw flag s+=1, each ok s-=1 (min 0). Enter when s≥2; exit when s=0.
Pros: Smooth; handles intermittent shortage.
Cons: Harder for public comprehension; more internal complexity.
Risk: Extended time to appear if alternating.

### 6.4 Opsi D: Time Weighted Decay

ShortageScore(t) = α * ShortageScore(t-1) + (raw_flag?1:0). Threshold θ (e.g., 1.5).
Pros: Very smooth; filters noise.
Cons: Completely opaque to public w/out math explanation.
Risk: Perceived black-box (contradicts transparency ethos GP5).

### 6.5 Opsi E: Dual Threshold (Schmitt Trigger style)

Parameters: T_enter = 0.60, T_exit = 0.65.
Enter: r < 0.60 (immediate).
Exit: r ≥ 0.65.
Pros: Familiar hysteresis; no delay for severe shortage.
Cons: Borderline units (0.59 ↔ 0.61) still toggle if improvement not large enough.
Risk: If improvements incremental (0.59→0.61), unit stays flagged maybe too long (is that acceptable? Possibly encourages sustained improvement).

### 6.6 Opsi F: Hybrid (Recommended Candidate)

Parameters:

- T_enter_major = 0.50 (severe shortage immediate).
- T_enter_standard = 0.60 (need 2 consecutive to avoid noise).
- T_exit = 0.65 (single snapshot).
Enter Rules:

1. If r < 0.50 at snapshot S → under‑served immediately (severity override).
2. Else if r < 0.60 two snapshots berturut (S-1, S) → under‑served.
Exit Rule:

- If r ≥ 0.65 at snapshot Sx → exit immediately.
Persistence:
- If improvement r in [0.60,0.649] → still under‑served (needs solid recovery).
Edge Recovery Grace:
- If after 5 snapshots flagged r never <0.55 lagi tapi juga belum ≥0.65, trigger “Stalled Recovery” note internally (no UI ranking).
Pros:
- Fast detection for severe cases.
- Borderline smoothing for mild cases.
- Narrative still explainable.
Cons:
- Slightly more complex to explain than A/E alone.
Rationale alignment:
- Balances urgency vs noise filtering; matches non-ranking fairness (no incentive to micro-optimize borderline increments).

---

## 7. PERBANDINGAN NUMERIK (SIMULASI SINGKAT)

Simulated ratio sequence r(t) for a borderline unit:
`0.58, 0.59, 0.57, 0.61, 0.59, 0.62, 0.66`

| Snapshot | Raw Flag (<0.60) | A (Enter?) | E (Dual) | F (Hybrid) |
|----------|------------------|-----------|----------|------------|
| 1 0.58 | Yes | No (need 2) | Yes (enter immediate) | No (1st below 0.60; not <0.50) |
| 2 0.59 | Yes | Enter (2) | Already in | Enter (2 consecutive) |
| 3 0.57 | Yes | Stay | Stay | Stay |
| 4 0.61 | No | Exit? r≥0.65? No; A exit requires ≥0.65+Δ? Not yet | Stay (needs 0.65) | Stay (needs 0.65) |
| 5 0.59 | Yes | Stay under (new sequence?) | Stay | Stay (still <0.60 resets count) |
| 6 0.62 | No | Stay | Stay | Stay |
| 7 0.66 | No | Exit (≥0.65) | Exit | Exit |

Observation:

- Opsi E triggers earlier labeling (possible false early label if noise).
- Opsi A delays initial detection (maybe appropriate for borderline).
- Opsi F similar to A for mild, but urgent path for severe shortage (not shown here).

Severe shortage sequence: `0.43, 0.44, 0.46, 0.55, 0.57, 0.61, 0.66`

| Snapshot | r | A | E | F |
|----------|---|---|---|---|
| 1 0.43 | Need 2 (delay) | Enter | Enter (immediate; <0.50) |
| 2 0.44 | Enter now | Stay | Stay |
=> F and E both immediate; A slower. F still advantage borderline smoothing.

---

## 8. METRIK EVALUASI PASCA IMPLEMENTASI

| Metric | Formula | Insight |
|--------|---------|---------|
| Entry Delay (borderline) | avg(firstFlaggedSnapshot - firstRawFlag) | Responsiveness mild shortage |
| Entry Delay (severe <0.50) | same | Should be 0 for F/E |
| False Positive Proxy | % units flagged once then exit next snapshot w/out recovery > T_exit | Stability |
| Persistence Duration | median flagged snapshots | Ensure not under 1 (churn) |
| Recovery Solidness | % exits where r≥T_exit (vs borderline exit hack) | Robust recovery |
| Re-Entry Rate | flagged units re-enter within 3 snapshots exit | Over-filter vs under-filter |

Baseline targets (initial):

- Severe entry delay = 0.
- Borderline entry delay ≤1.
- False positive proxy <15%.
- Re-entry rate <25% (first 30d; adjust later).

---

## 9. RISIKO PER OPSI & MITIGASI

| Opsi | Risiko Utama | Dampak | Mitigasi |
|------|--------------|--------|----------|
| A | Delay severe shortage | Medium | Not acceptable untuk r<0.5 |
| B | Narasi rumit | Medium | Visual explanation (window graphic) – overhead |
| C | Opaqueness score | High | Must publish scoring formula (complex) |
| D | Black box persepsi | High | Perlu doc math & interactive; melanggar simplicity |
| E | Toggling borderline 0.59↔0.61 | Medium | Add Δ buffer or escalate to hybrid |
| F | Komunikasi dua jalur masuk | Low | Infografik masuk/keluar sederhana di /trust |

---

## 10. REKOMENDASI (AI)

Pilih Opsi F (Hybrid):

- Menjaga prinsip fairness + outcome honesty
- Memberikan jalur cepat untuk shortage serius (etika)
- Meminimalkan noise borderline
- Masih dapat dijelaskan: “Masuk cepat jika <50%, atau jika 2 hari berturut-turut di bawah 60%. Keluar bila sudah ≥65%.”

Parameter awal (dapat disesuaikan setelah 30 hari):

- T_enter_major = 0.50
- T_enter_standard = 0.60 (2 consecutive)
- T_exit = 0.65
- Grace “Stalled Recovery” note trigger: 5 consecutive flagged dengan r berada di [0.55,0.649]

---

## 11. VARIASI PARAMETER & SENSITIVITAS

| Scenario | Effect if T_enter_major ↑ (0.52) | Effect if T_exit ↑ (0.67) | Effect if T_enter_standard 2→3 consecutive |
|----------|----------------------------------|---------------------------|-------------------------------------------|
| Severe detection | Slight delay for 0.51–0.519 | N/A | Unaffected |
| Recovery speed | N/A | Slower exit => longer flagged | Slower entry borderline (less false positives) |
| False positives | Decrease (less immediate triggers) | Unchanged | Decrease borderline toggling |
| User perception | Might question a 0.51 shortage unflagged | Might perceive “stuck” label | Possible confusion “Why need 3 days?” |

Recommendation: Keep earliest thresholds (0.50 / 0.60 / 0.65) first 60 days; revisit after data volume > 6 snapshots.

---

## 12. IMPLEMENTATION STATE MACHINE (OPSI F)

States:

- NONE (not under-served)
- CANDIDATE (1st snapshot <0.60 but ≥0.50)
- ACTIVE (flagged)
- STALLED (ACTIVE more than 5 snapshots without crossing 0.65 but improved ≥0.55)
- EXIT_PENDING (optional transitional; r between 0.60–0.649 after ACTIVE – remain ACTIVE effectively)
- CLEARED (after exit; 1 snapshot cooldown to avoid immediate re-entry if r dips just below threshold once)

Transitions (summary):

1. NONE → ACTIVE if r <0.50 (severe)
2. NONE → CANDIDATE if 0.50 ≤ r <0.60
3. CANDIDATE → ACTIVE if second consecutive snapshot 0.50 ≤ r <0.60
4. ACTIVE → CLEARED if r ≥0.65
5. ACTIVE → STALLED if flaggedSnapshots ≥5 AND min(r in last 5) ≥0.55 AND max(r) <0.65
6. STALLED → CLEARED if r ≥0.65
7. CLEARED → CANDIDATE if (r <0.60 and >=0.50) after cooldown (1 snapshot)
8. CLEARED → ACTIVE if r <0.50 (severe bypass)

Justification STALLED: internal analytics annotation only; not a separate public label to avoid cognitive load. Public just sees “Under‑Served” until exit.

---

## 13. PSEUDO-ALGORITMA (INFORMATIF)

(Not code library; conceptual)

```
for each unit:
  update rolling history (last N snapshots)
  r = latest_ratio
  if severely_low(r): # r < 0.50
     state = ACTIVE
     mark entryReason = "severe"
  else if state == NONE:
     if isBorderlineLow(r): # 0.50 <= r < 0.60
         state = CANDIDATE
  else if state == CANDIDATE:
     if isBorderlineLow(r) and prevWasBorderlineLow():
         state = ACTIVE
     elif r >= 0.60:
         state = NONE
  else if state == ACTIVE or state == STALLED:
     if r >= 0.65:
         state = CLEARED
         set cooldown flag
     else:
         if flaggedSnapshots >=5 and minLast5 >=0.55 and maxLast5 <0.65:
            state = STALLED  # internal
  else if state == CLEARED:
     if cooldownExpired():
        if severely_low(r): state = ACTIVE
        elif isBorderlineLow(r): state = CANDIDATE
```

---

## 14. PUBLISHABLE METHODOLOGY NARASI (SINGKAT)

“Unit ditandai ‘under‑served’ jika kekurangan pemenuhan kebutuhan terbukti stabil:
(a) Turun drastis (rasio <50%) akan tampil segera, atau
(b) Dua snapshot berturut-turut di bawah 60%.
Keluar dari daftar setelah mencapai ≥65% pada satu snapshot.
Ini mencegah fluktuasi jangka sangat pendek menyesatkan publik dan memastikan fokus pada kesenjangan yang konsisten, bukan sekadar perubahan sesaat.”

---

## 15. ALTERNATIF NARASI (VARIAN)

| Tone | Versi |
|------|-------|
| Plain | “Masuk cepat bila sangat rendah (<50%), atau bila dua hari berturut di bawah 60%. Keluar bila pemenuhan mencapai ≥65%.” |
| Slight Educational | “Kami menggunakan ambang sebanding dengan ‘buffer’ agar bantuan dialokasikan pada kekurangan nyata, bukan lonjakan sesaat.” |
| Governance Emphasis | “Ambang ganda dan bukti berturut dipakai untuk integritas: cepat mengangkat kasus parah, hati‑hati pada borderline.” |

---

## 16. ANALISIS RISIKO OPERATIONAL

| Risiko | Contoh | Mitigasi |
|--------|--------|----------|
| Data Incomplete Day | Snapshot gagal → false stability | Mark snapshot invalid; hysteresis ignore that day |
| Backfill Late Data | Retroactive need updates merusak history | Lock window after snapshot; future changes appear in next cycle only |
| Gaming by Holding Fulfillment | Menunda fulfill agar tetap disorot & akses resource | Monitor pattern: improvement spikes day before exit; Flag >X occurrences |
| Over-Persistence | Unit sulit keluar (r stagnan 0.63) | Provide internal alert after n=7 flagged w/out crossing exit; consider targeted outreach |
| Threshold Miscalibration | Too many units flagged ( >40% ) | Governance threshold review trigger if flagged proportion > target over 2 consecutive windows |

---

## 17. GOVERNANCE HOOKS

| Trigger | Action |
|---------|--------|
| Flagged proportion > 45% 2x berturut | Review T_enter_standard ↑ (e.g. 0.60→0.58?) or exit threshold adjust |
| Severe entries > 20% all flagged units | Investigate systemic shortage pattern |
| Average entry delay > 1 snapshot severe | Adjust T_enter_major upward (loosen severity definition) |
| Public confusion feedback >5% | Publish methodology explainer micro infographic |

---

## 18. DATA FIELDS TAMBAHAN (INTERNAL STORAGE)

Store per unit (not public):

- consecutiveBelow60
- lastBelow60SnapshotIndex
- flaggedSinceSnapshotIndex
- flagEntryReason (“severe” | “consecutive”)
- lastExitSnapshotIndex
- stalledFlag (bool)
- cooldownUntilSnapshotIndex

Justification: Minimizing public complexity while enabling audit.

---

## 19. EVALUASI 30 HARI (POST-LAUNCH)

Checklist:

- [ ] Compute churn rate.
- [ ] Compare severe vs borderline entries.
- [ ] Assess distribution of recovery distances (how many just cross 0.65 vs overshoot).
- [ ] Investigate any suspicious improvement patterns near exit threshold.
- [ ] Feedback taxonomy: extract fairness confusion cluster.

If multiple metrics out of bounds, propose parameter revision pack (Patch governance decision DEC-XXXX).

---

## 20. MIGRASI DARI TANPA HYSTERESIS → DENGAN

If early internal soft launch started without hysteresis:

1. Mark “baseline window start” snapshot (S0).
2. Recompute last K snapshots to seed state without altering historical public feed (internal only).
3. Publish change log: “Mulai tanggal X penerapan hysteresis fairness untuk stabilitas penandaan.”

No retro rewrite of public prior lists (transparency).

---

## 21. PERBANDINGAN DENGAN PRINCIPLES

| Principle | Hysteresis F Align? | Catatan |
|-----------|---------------------|---------|
| Privacy (GP1) | Yes | All logic aggregated; no new data fields public. |
| Transparency (GP5) | Yes (narrative needed) | Provide plain explanation + FAQ update. |
| Non-Ranking Fairness (GP9) | Yes | Only classification presence/absence; no ordering. |
| Outcome Honesty (GP6) | Yes | Avoid spurious toggles → honest persistent shortages. |
| Observability (GP10) | Yes | Potential to log entryReason + snapshot indices in internal chain for audit (optional). |

---

## 22. DECISION MATRIX (FORMAL)

| Criterion | Weight | A | E | F |
|-----------|--------|---|---|---|
| Clarity to Public | 0.25 | 0.9 (simple) | 0.85 | 0.80 |
| Responsiveness Severe | 0.20 | 0.4 | 1.0 | 1.0 |
| Noise Suppression Borderline | 0.20 | 0.7 | 0.55 | 0.85 |
| Implementation Simplicity | 0.15 | 1.0 | 0.95 | 0.80 |
| Anti-Gaming Potential | 0.10 | 0.6 | 0.6 | 0.75 |
| Scalability Future | 0.10 | 0.7 | 0.75 | 0.85 |
| Weighted Score | 1.00 | 0.72 | 0.80 | 0.88 |

Result: F highest weighted.

---

## 23. OPEN DECISIONS (NEEDED TO RATIFY)

| Decision | Options | Recommendation | Owner |
|----------|---------|---------------|-------|
| Adopt Option | A / E / F / postpone | F (Hybrid) | Governance |
| Thresholds final | Enter 0.6 / 0.58 / 0.62; Severe 0.50 / 0.48 / none | 0.60 / 0.50 | Governance |
| Exit threshold | 0.64 / 0.65 / 0.66 | 0.65 | Governance |
| Stalled Recovery window | 5 / 6 / disable | 5 | Data Lead |
| Cooldown length (after exit) | 0 / 1 / 2 snapshots | 1 | Governance |
| Public STALLED label? | Yes / No | No (internal only) | Governance |
| Publish entryReason? | Yes / No | Optional internal; public no | Governance |

---

## 24. IMPLEMENTATION ACCEPTANCE CRITERIA

- [ ] State machine code implemented with unit tests (≥90% transitions).
- [ ] Parameter values stored in config file hashed & referenced in methodology version.
- [ ] Public copy updated (/equity + /trust) with final narrative.
- [ ] Event instrumentation logs entryReason (internal analytics) without exposing sensitive data.
- [ ] Backfill script seeding initial states passes dry run on synthetic dataset.
- [ ] Governance DEC entry created referencing chosen Option & parameters.
- [ ] Equity highlight only displays units with state ACTIVE (not CANDIDATE).
- [ ] Delta note appears in change log (phase 1.5) once live.

---

## 25. RISK & MITIGATION (SPESIFIK OPSI F)

| Risk | Scenario | Mitigation |
|------|----------|-----------|
| Under-detection borderline | Unit fluctuates 0.59/0.61 missing immediate label | Delay intentional; monitor consecutive borderline dataset |
| Over-persistence | Unit stuck 0.62 for many days flagged | Stalled detection triggers internal review outreach |
| Parameter fishing | Adjusting thresholds frequently reduces trust | Formal change window (monthly) & decision log hashing |
| Severe misclassification if data missing | Snapshot missing sets r=0 artificially | Require snapshot validity flag; ignore invalid snapshot in state progression |

---

## 26. EXTENSION IDEAS (FUTURE, NOT FOR MVP)

| Idea | Description | Risk | Gate |
|------|-------------|------|------|
| Recovery Momentum Metric | Track slope of r increases | Adds complexity | Data maturity |
| Multi-Dimensional Shortage Tag | Combine r with reporting timeliness | Potential quasi-ranking | Ethics review |
| Weighted Needs Criticality | Weight certain needs categories higher | Complexity & bias risk | Needs risk taxonomy & governance |
| Probabilistic Hysteresis | Confidence intervals on r | Opaqueness | Only if reporting noise high |

---

## 27. AUDIT LOG INTEGRATION (OPTIONAL ENHANCEMENT)

Record chain event when:

- Unit enters ACTIVE (type=UNDER_SERVED_ENTER, reason=“severe”/“consecutive”).
- Unit exits (type=UNDER_SERVED_EXIT).
Fields: credId or orgId, snapshotId, reason, prevState, newState.
Benefits: External auditors can reconstruct fairness label timeline.

---

## 28. PUBLIC FAQ ADDITIONS (DRAFT)

Q: Mengapa unit tidak langsung muncul sebagai under‑served padahal kemarin di bawah 60%?
A: Sistem menunggu dua snapshot berturut kecuali rasio sangat rendah (<50%). Ini menghindari fluktuasi sesaat.

Q: Mengapa unit tetap ditandai padahal sudah naik sedikit?
A: Untuk memastikan perbaikan solid, perlu mencapai ≥65% agar keluar label.

Q: Apakah angka ini menilai kualitas layanan?
A: Tidak. Ini hanya sinyal pemerataan pemenuhan kebutuhan, bukan penilaian perawatan.

---

## 29. TIMELINE IMPLEMENTASI (REALISTIS)

| Minggu | Deliverable |
|--------|-------------|
| 1 | Parameter final & decision log; implement state machine; synthetic tests |
| 2 | Integration with snapshot job; instrumentation events; update /trust copy |
| 3 | Backfill seeding; pilot internal; gather pilot metrics |
| 4 | Public activation; monitor churn & feedback |
| 5 | Parameter review checkpoint (if anomalies) |

---

## 30. SUMMARY (ONE-LINER)

“Hybrid hysteresis menjaga deteksi cepat kasus berat sambil mengurangi noise borderline, memastikan penandaan under‑served memandu pemerataan nyata bukan fluktuasi sesaat.”

---

## 31. NEXT ACTIONS (IF APPROVED)

| Action | Owner |
|--------|-------|
| Ratify Option F & thresholds | Governance |
| Update methodology doc version + hash | Documentation |
| Implement state machine & tests | Engineering |
| Add instrumentation (entryReason internal) | Analytics |
| Publish FAQ & equity page copy update | UX Writer |
| Create DEC entry (CIC-E) | Governance |
| Schedule 30-day review | PM/Data |

---

## 32. APPENDIX – THRESHOLD SENSITIVITY MINI TABLE

| % Units Raw Below 0.60 | Pred. % ACTIVE (Option F) | Notes |
|------------------------|---------------------------|-------|
| 10% raw (<0.60) | ≈6–8% flagged (some borderline need 2 consecutive) | Acceptable highlight density |
| 20% raw | ≈13–16% flagged | Monitor fairness messaging |
| 30% raw | ≈21–24% flagged | Consider threshold re-evaluation if persistent |
| >40% raw | >28% flagged | Trigger governance review (structural issue) |

---

## 33. APPENDIX – SAMPLE INTERNAL METRIC DASHBOARD FIELDS

| Field | Description |
|-------|-------------|
| activeUnderServedCount | # units ACTIVE |
| newSevereEntries | # entries for reason severe in last snapshot |
| borderlineCandidateCount | # currently in CANDIDATE |
| avgFlagDuration | Mean snapshots flagged |
| stalledCount | # units STALLED |
| reEntryRate30d | (# re-entries within 30d) / (# distinct flagged) |

---

## 34. APPENDIX – PSEUDO TEST CASES

| Case ID | Sequence (r) | Expected State Evolution |
|---------|--------------|--------------------------|
| TC1 Severe Immediate | 0.48 → 0.47 → 0.55 → 0.66 | ACTIVE snapshot1; remain; EXIT snapshot4 |
| TC2 Borderline Entry | 0.58 → 0.59 → 0.57 → 0.62 → 0.66 | NONE→CANDIDATE→ACTIVE→ACTIVE→CLEARED |
| TC3 False Start | 0.58 → 0.61 | NONE→CANDIDATE→NONE |
| TC4 Stalled Recovery | 0.53 → 0.54 → 0.56 → 0.57 → 0.58 → 0.62 | ACTIVE entire; after 5 flagged & min≥0.55 set STALLED; remains ACTIVE; still needs ≥0.65 to exit |
| TC5 Re-Entry Cooldown | (Exit at r=0.66) then 0.59 | CLEARED (cooldown) → after cooldown CANDIDATE |
| TC6 Immediate Severe After Exit | EXIT at r=0.66 then 0.49 | CLEARED→ACTIVE (severity bypass) |

---

## 35. ACKNOWLEDGEMENT

Semua struktur di sini mematuhi strategi terdahulu: fairness non-ranking, privacy, transparency, avoidance of algorithmic opacity. Tidak ada penghapusan jalur lama—hanya elaborasi.

---

## 36. DECISION PROMPT

Silakan pilih:

- Opsi A / E / F
- Jika F, konfirmasi parameter: T_enter_major=0.50, T_enter_standard=0.60 (2 consecutive), T_exit=0.65, cooldown=1, stalledWindow=5.

Balas format:
`KEPUTUSAN: Opsi F, parameter disetujui / (atau modifikasi)`

AI kemudian akan:

1. Integrasi parameter ke Master Spec (append delta).
2. Siapkan template DEC log.
3. Susun copy final /trust & /equity bagian hysteresis.

(End of Hysteresis Options Decision Pack v1.0)
