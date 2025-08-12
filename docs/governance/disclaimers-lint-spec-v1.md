# MerajutASA – Disclaimers Presence & Integrity Lint Specification (v1.0)
Status: Draft for Ratification (CIC-A on implementation; CIC-D for copy edits; CIC-E if semantic scope of required pages changes)  
Prepared: 2025-08-12  
Related Master Spec Sections:  
- Master Spec v2.0: Sections 13 (Hero), 27 (Events), 35 (Ethical Content Assurance), 49 (Disclaimer Library), 28 (Lint & Governance Automation)  
- Integrity Credential Schema v1.0 (credential-level disclaimersRef)  
- Hysteresis Options Decision Pack (methodology narrative)  
NON-DESTRUCTIVE: Dokumen ini MENAMBAHKAN detail; tidak menghapus strategi terdahulu. Semua ID disclaimers (D1–D7) tetap sama sebagaimana didefinisikan sebelumnya.

> TUJUAN  
Menetapkan standar otomatis (lint + policy-as-code) untuk memastikan setiap halaman, komponen, dan artefak publik yang diwajibkan menampilkan, merujuk, atau mengikat disclaimers menengah (D1–D7) secara konsisten, tidak hilang karena refactor UI, dan tidak terjadi drift terminologi / framing yang melemahkan integritas naratif non-ranking, privacy-by-architecture, serta anti-hype.

---

## 1. SINGKATAN & TERMINOLOGI

| Istilah | Definisi |
|---------|----------|
| Disclaimer | Pernyataan singkat normative (D1–D7) dengan ID tetap, dikelola central. |
| Presence | Keberadaan teks (atau marker token) yang dapat dirender di runtime untuk user. |
| Binding | Relasi antara page/component dengan daftar disclaimers wajibnya yang tercatat di config. |
| Drift | Perbedaan substantif >10% kata (token-level) dari master copy per ID tanpa governance DEC. |
| Shadow Copy | Salinan disclaimer ditulis ulang manual tanpa token ID (melanggar aturan). |
| Injection Window | Fase build di mana sistem lint memverifikasi mapping sebelum deploy. |
| CIC Class | Classification of change as per governance (CIC-A/B/C/D/E). |
| Hash Manifest | File JSON berisi hash konten disclaimers master & mapping per release. |

---

## 2. DAFTAR DISLAIMERS (REFERENSI TETAP – TIDAK DIUBAH)

| ID | Text (Canonical) | Purpose |
|----|------------------|---------|
| D1 | “Equity Index & daftar under‑served bukan ranking kualitas—hanya sinyal pemerataan.” | Anti-ranking fairness clarity |
| D2 | “Tidak ada data pribadi anak dikumpulkan / ditampilkan.” | Privacy assurance |
| D3 | “Credential = status verifikasi; bukan skor performa.” | Integrity vs performance |
| D4 | “Kutip angka digest wajib menyertakan tanggal & konteks.” | Responsible citation |
| D5 | “Hash excerpt hanya metadata perubahan; tidak memuat konten sensitif.” | Audit transparency boundary |
| D6 | “Terminologi dalam fase transisi terbuka; adopsi dipantau publik.” | Transition legitimacy |
| D7 | “Kartu menampilkan agregat publik—bukan akses ke data internal.” | Prevent scope misinterpretation |

(Canonical text disimpan di file master disclaimers: `content/disclaimers/master.json` – lihat Section 5.)

---

## 3. KEBUTUHAN PRESENSI (MAPPING WAJIB)

| Page / Component | Required IDs | Rationale |
|------------------|-------------|-----------|
| Landing Hero (disclaimer block) | D1, D2, D3, D5 (D7 optional if confusion flagged) | Menjamin orientasi awal |
| Equity Page (main) | D1, D2 | Fairness + privacy |
| Equity Under‑Served Section | D1 | Anti-ranking emphasis |
| Trust Page (top) | D2, D3, D5 | Privacy + credential + hash scope |
| Trust Page (methodology/hysteresis subsection) | D1 | Clarify fairness logic |
| Governance Page | D5 (metadata boundaries) | Scope of chain excerpt |
| Terminology Page | D6, D2 | Transition + privacy reinforcement |
| Terminology Banner (if Stage 1/2) | D6 | Stage explanation |
| Feedback Page | D2 | Privacy reassurance |
| Credential Viewer Modal | D2, D3 | Prevent misinterpretation credential |
| Hash Excerpt Module | D5 | Metadata only |
| Hero Cards (Equity Card Tooltip) | D1 (short form) | Inline fairness |
| Hero Cards (Credential Card Footer) | D3 | Clarify non-performance |
| Hero Cards (Any card w/ aggregate values) | D7 (if not in global block) | Aggregation scope |
| Media Digest Page | D4, D1, D2 | Citation context + fairness + privacy |
| About / FAQ (data section) | D2, D1 | Privacy + fairness |
| API / Verification Docs (public) | D5, D3 | Boundaries of proof |
| Changelog Excerpt Page (Phase 1.5) | D5 | Metadata semantics |
| Under‑Served Method Explainer (FAQ) | D1 | Non-ranking reaffirmation |

---

## 4. LINT RULE SET (ID → RULE CODE)

| Rule Code | Description | Failure Level |
|-----------|-------------|---------------|
| DISC-PRES-001 | Missing required disclaimer ID for a page/component | ERROR |
| DISC-PRES-002 | Found shadow copy variant w/out ID token | ERROR |
| DISC-TEXT-003 | Canonical disclaimer text drift >10% tokens w/out DEC ref | ERROR |
| DISC-ORDER-004 | Disclaimer block reorder causing grouping semantics lost (privacy disclaimers must not be after promotional text) | WARN |
| DISC-DUPL-005 | Duplicate disclaimer ID rendered twice in same scope | WARN |
| DISC-SCOPE-006 | Disclaimer appears where not mapped (e.g., D3 inside equity bucket list) | WARN |
| DISC-VERSION-007 | Hash manifest mismatch vs master.json | ERROR |
| DISC-TRACE-008 | A page declares disclaimers but config not referencing central file | ERROR |
| DISC-PHRASE-009 | Banned phrase implying ranking appears near fairness disclaimers (“peringkat”, “top”, “paling unggul”) | ERROR |
| DISC-HTML-010 | Disclaimer text wrapped in interactive element (link) except allowed citation anchor | WARN |
| DISC-LOCALE-011 | Localized variant present before Stage 2 i18n readiness | WARN (upgrade to ERROR once i18n live) |

---

## 5. MASTER DISCLAIMER FILE (FORMAT)

File: `content/disclaimers/master.json`

```json
{
  "version": "1.0.0",
  "updated": "2025-08-12T03:30:00Z",
  "hash": "a3d7b92a4f1c6d54...",
  "disclaimers": [
    { "id":"D1", "text":"Equity Index & daftar under‑served bukan ranking kualitas—hanya sinyal pemerataan." },
    { "id":"D2", "text":"Tidak ada data pribadi anak dikumpulkan / ditampilkan." },
    { "id":"D3", "text":"Credential = status verifikasi; bukan skor performa." },
    { "id":"D4", "text":"Kutip angka digest wajib menyertakan tanggal & konteks." },
    { "id":"D5", "text":"Hash excerpt hanya metadata perubahan; tidak memuat konten sensitif." },
    { "id":"D6", "text":"Terminologi dalam fase transisi terbuka; adopsi dipantau publik." },
    { "id":"D7", "text":"Kartu menampilkan agregat publik—bukan akses ke data internal." }
  ]
}
```

Hash = sha256 canonical (sorted keys) of disclaimers array; updated only when text changes (DEC needed).

---

## 6. PAGE → DISCLAIMER CONFIG (BINDING FILE)

File: `content/disclaimers/bindings.json`

```json
{
  "schema_version":"1.0",
  "pages":[
    {"page":"landing","ids":["D1","D2","D3","D5"]},
    {"page":"equity","ids":["D1","D2"]},
    {"page":"equity_under_served_section","ids":["D1"]},
    {"page":"trust","ids":["D2","D3","D5"]},
    {"page":"trust_hysteresis","ids":["D1"]},
    {"page":"governance","ids":["D5"]},
    {"page":"terminology","ids":["D6","D2"]},
    {"page":"terminology_banner","ids":["D6"]},
    {"page":"feedback","ids":["D2"]},
    {"page":"credential_viewer","ids":["D2","D3"]},
    {"page":"hash_excerpt_module","ids":["D5"]},
    {"page":"media_digest","ids":["D4","D1","D2"]},
    {"page":"about_faq_data","ids":["D2","D1"]},
    {"page":"api_verification_docs","ids":["D5","D3"]},
    {"page":"changelog_excerpt","ids":["D5"]}
  ],
  "components":[
    {"component":"hero_equity_card_tooltip","ids":["D1"]},
    {"component":"hero_credential_card_footer","ids":["D3"]},
    {"component":"hero_aggregate_card","optional_ids":["D7"]}
  ]
}
```

`optional_ids` may appear conditionally (e.g., if user confusion threshold triggered). Lint warns if optional recommended but missing after a governance trigger flag file present.

---

## 7. CANONICAL RENDERING GUIDELINES

| Aspect | Guideline |
|--------|----------|
| Typography | Uniform small font size (≤ .65rem) but legible contrast AA |
| Grouping | Equity / fairness disclaimers placed before metric readouts |
| Ordering | Privacy (D2) must appear in hero block set; fairness (D1) cannot be omitted if equity data visible |
| Interactivity | Only disclaimers referencing an external doc (e.g., methodology) may include a link from part of text (wrap minimal phrase) |
| Persistence | Disclaimers must be visible without hover for core pages (landing, equity, trust) |
| Duplication Avoidance | If hero block already shows D2, equity page MAY repeat D2 (allowed), but duplication on same viewport (stack) should be collapsed (lint warns but not error) |

---

## 8. DIFF & DRIFT DETECTION

Procedure:
1. Compute token set (simple whitespace tokenization, case-insensitive) of master vs deployed variant.
2. Calculate Jaccard similarity = |Intersection| / |Union|.
3. If similarity < 0.90 AND no DEC ID reference near variant (e.g., data-attr dec-ref=DEC-YYYYMMDD-XX) → FAIL (DISC-TEXT-003).
4. If similarity >=0.90 but punctuation differences only → PASS (cosmetic).
5. Track drift stats telemetry: count drifting attempts blocked.

---

## 9. SHADOW COPY DETECTION HEURISTICS

A shadow copy suspected when:
- The page contains tokens from canonical disclaimers (≥60% overlap) but no disclaimer ID marker attribute (e.g., `data-disclaimer-id="D1"`).
- Lint identifies variant >2 disclaimers referencing fairness/verification words but absent IDs.

Heuristic regex for disclaimers vocabulary clusters:
- Fairness cluster: `(under.?served|pemerataan|ranking|kualitas)`
- Privacy cluster: `(data pribadi|PII|anak|identitas)`
- Credential cluster: `(credential|verifikasi|status)`
If cluster tokens present but no ID attribute → error DISC-PRES-002.

---

## 10. BANNED PHRASE LIST (RELATED TO DISCLAIMER CONTEXT) – TIED TO RULE DISC-PHRASE-009

```
(terbaik|paling unggul|peringkat|ranking|top\\s?\\d+|juara|skor kinerja|nilai kinerja|pemenang)
```
Case-insensitive. If appears in a block containing disclaimers D1/D3 or within 200 chars, error out (avoid coupling fairness disclaimers with competitive marketing semantics).

---

## 11. LINT PIPELINE FLOW

1. Load master.json & bindings.json.
2. Verify master hash inside pipeline vs stored expected (commit baseline).
3. Parse project templates / built HTML (headless compile).
4. Extract disclaimers: search for `[data-disclaimer-id]`.
5. Map occurrences to pages/components.
6. Validate presence vs bindings.json.
7. Run drift detection (compare text).
8. Scan for shadow copies.
9. Check banned phrase proximity.
10. Output structured report JSON:
   ```json
   {
     "summary":{"errors":2,"warnings":1},
     "violations":[
       {"code":"DISC-PRES-001","page":"equity","missing":["D2"]},
       {"code":"DISC-TEXT-003","id":"D1","similarity":0.77},
       {"code":"DISC-DUPL-005","page":"landing","id":"D3","count":2}
     ]
   }
   ```
11. Fail build if errors >0. Warnings pass but logged.

---

## 12. CONFIGURATION (OVERRIDES / PHASE FLAGS)

File: `content/disclaimers/config.yml`

```yaml
version: 1
enforce_banned_phrase: true
min_similarity: 0.90
allow_duplicate_ids_in_viewport: false
enable_optional_id_D7: false
governance_trigger:
  confusion_under_served_rank: false
  privacy_question_spike: false
phase:
  i18n: false
  revocation_ui: false
```

Adjustments require DEC entry if they reduce strictness (e.g., lowering `min_similarity`).

---

## 13. GIT HOOK / CI INTEGRATION

- Pre-commit hook (optional) warns quickly (fast HTML diff scan).
- CI job `lint:disclaimers` (blocking) runs after build & before deploy.
- On fail emits artifact `disclaimer-lint-report.json` + human-readable markdown summary appended as comment in PR (if GitHub Action).

PR comment format (example):
```
Disclaimers Lint Report:
Errors (2):
- DISC-PRES-001: Missing D2 on page equity
- DISC-TEXT-003: D1 drift similarity 0.78 < 0.90 (No DEC reference)
Warnings (1):
- DISC-DUPL-005: D3 appears twice on landing
```

---

## 14. EVENT INSTRUMENTATION (OPTIONAL TELEMETRY)

Emit event `sys_disclaimer_lint_result` (internal only) with meta:
- build_id
- errors_count
- warnings_count
- drift_ids[]
- missing_ids[]
- timestamp

WHY: Governance can monitor frequency of near-miss or recurrent omissions (risk indicator of process fragility).

---

## 15. GOVERNANCE MAPPING

| Change | CIC Class | Notes |
|--------|----------|-------|
| Adding new disclaimer ID (D8) | CIC-C (content) + Privacy/Ethics review | Must append to master.json, update hash |
| Changing text of existing disclaimer | CIC-E (semantic) | Requires DEC & version bump |
| Removing disclaimer ID | CIC-E | Only via formal deprecation & public log |
| Adjusting presence mapping (add page requirement) | CIC-C | Transparent methodology update |
| Lowering similarity threshold | CIC-E (weakens guard) | Justify risk acceptance |
| Relaxing banned phrase rule | CIC-E | Ethic oversight |

---

## 16. TEST CASE MATRIX

| ID | Scenario | Input Setup | Expected |
|----|----------|-------------|----------|
| TC01 | All required disclaimers present | landing includes D1 D2 D3 D5 | Pass |
| TC02 | Missing D2 on equity page | remove data-disclaimer-id="D2" | DISC-PRES-001 error |
| TC03 | Drift D1 (rewrite synonyms) | Modify text: “Equity & daftar under served bukan peringkat kualitas melainkan indikator” | Similarity 0.72 → DISC-TEXT-003 |
| TC04 | Shadow copy | Remove ID attributes but keep text similar | DISC-PRES-002 |
| TC05 | Banned phrase near fairness | Add “peringkat” near D1 | DISC-PHRASE-009 |
| TC06 | Duplicate ID | D3 appears twice | DISC-DUPL-005 warn |
| TC07 | Optional D7 flagged confusion toggle ON w/out D7 | config enable_optional_id_D7 true; D7 absent card group | WARN escalate? (Setting) |
| TC08 | Master hash mismatch | tamper master.json w/out version bump | DISC-VERSION-007 |
| TC09 | Order violation | Privacy D2 placed after promotional marketing block flagged | DISC-ORDER-004 warn |
| TC10 | Locale early | Provide localized D1 variant while i18n=false | DISC-LOCALE-011 warn |

---

## 17. SIMILARITY ALGORITHM DETAIL

- Tokenization: Lowercase, strip punctuation except hyphens & percent sign.
- Stopword retention (do NOT remove) to catch subtle drift (e.g., removing “bukan ranking” reduces meaning).
- Similarity function: Jaccard on token multiset OR improved Szymkiewicz–Simpson (overlap coefficient).
- We use: OverlapCoefficient = |Intersection| / min(|A|,|B|). Reason: penalizes omission stronger.
- Threshold = 0.90 (Overlap coefficient).
- Rationale: Encourages minimal micro-edits; any major omission demands DEC.

---

## 18. SECURITY & PRIVACY ANGLE

Disclaimers themselves are non-sensitive; however:
- Lint prevents injection of promotional / manipulative language near fairness disclaimers (reduces reputational risk).
- Ensures privacy promise (D2) not accidentally omitted when new layout created (critical trust anchor).

---

## 19. FAILURE MODES & MITIGATIONS

| Failure Mode | Impact | Mitigation |
|--------------|--------|------------|
| False negative (missed missing disclaimer) | User misinterpretation | Strict mapping config + regression tests |
| Excess false positives (overly strict similarity) | Developer friction | Allow DEC override token attribute `data-dec-approved="DEC-20250812-02"` |
| Banned phrase legitimate context (FAQ explaining “ranking”) | Incorrect block | Allow attribute `data-phrase-context="disclaimer-explanation"` triggers bypass for that node |
| Multi-language future cause drift errors | Noise | When i18n active, store per-locale canonical variant & adjust similarity |
| Build performance overhead | Slower pipeline | Cache AST parse; diff only changed templates |

---

## 20. INTEGRATION WITH OTHER LINTS

Sequence order recommended:
1. Copy / banned lexicon lint (hype)
2. Terminology adoption lint
3. Disclaimers lint (depends on stable text)
4. Policy-as-code page gating
Chaining ensures disclaimers lint uses final microcopy stage.

---

## 21. EXTENSION – FUTURE (NOT MVP)

| Idea | Description | Risk |
|------|-------------|------|
| Visual Consistency Lint | Check font-size/contrast tokens apply | Complexity with design tokens |
| Screenshot Diff Bot | Visual presence snapshot in PR | Flaky render changes |
| Machine Translated Drift Checker | Ensure localization not semantic drift | Requires language QA dataset |

---

## 22. OPERATIONAL RUNBOOK (ON FAIL)

When CI fails:
1. Developer reads PR comment & artifact.
2. For DISC-TEXT-003 (drift): Either revert to canonical OR open governance DEC referencing reason for change.
3. For missing disclaimers: Re-add component snippet referencing master ID.
4. For banned phrase: Replace or justify educational context with attribute (if allowed).
5. Re-run local lint (script `npm run lint:disclaimers`).
6. Merge only when all ERROR level resolved.

Escalation:
- If 3 sequential PRs attempt to remove same disclaimer (D1/D2) → trigger governance alert (potential pattern).

---

## 23. SAMPLE RENDER SNIPPET (HTML REFERENCE)

```html
<div class="disclaimer-block">
  <p data-disclaimer-id="D1">Equity Index & daftar under‑served bukan ranking kualitas—hanya sinyal pemerataan.</p>
  <p data-disclaimer-id="D2">Tidak ada data pribadi anak dikumpulkan / ditampilkan.</p>
  <p data-disclaimer-id="D3">Credential = status verifikasi; bukan skor performa.</p>
  <p data-disclaimer-id="D5">Hash excerpt hanya metadata perubahan; tidak memuat konten sensitif.</p>
</div>
```

Note: DO NOT inline manual synonyms. Use canonical copy central import if using templating.

---

## 24. PSEUDOCODE LINT IMPLEMENTATION (INFORMATIVE)

```
load master = parse(master.json)
compute masterMap[id] = text
load bindings = parse(bindings.json)

extracted = extractDisclaimersFromBuild(buildDir) # returns list {page, id, text, nodePath}

# Presence check
for page in bindings.pages:
  required = set(page.ids)
  present = set(id where extracted.page == page.page)
  missing = required - present
  if missing not empty: error DISC-PRES-001

# Drift check
for ex in extracted:
  canonical = masterMap[ex.id]
  similarity = overlapCoefficient(tokens(canonical), tokens(ex.text))
  if similarity < MIN_SIM and not decOverride(ex.nodePath):
     error DISC-TEXT-003

# Shadow copy
for page in allPages:
  clusters = findDisclaimerLikeBlocks(page.html)
  for cluster in clusters:
    if no data-disclaimer-id attr and cluster.similarToAny(master) > SHADOW_THRESHOLD:
       error DISC-PRES-002

# Banned phrases
scanForBannedPhrasesNearDisclaimers()

# Output JSON report
```

---

## 25. METRICS (INTERNAL OBSERVABILITY)

| Metric Name | Definition | Use |
|-------------|------------|-----|
| disclaimer_missing_count | # missing disclaimers per build | Stability indicator |
| disclaimer_drift_attempts | # drift errors per week | Editorial risk |
| disclaimer_shadow_copy_attempts | # shadow copies blocked | Governance vigilance |
| banned_phrase_near_disclaimer | Occurrences per week | Hype drift early warning |

Add to weekly governance dashboard.

---

## 26. ACCEPTANCE CRITERIA (IMPLEMENTATION)

- [ ] master.json & bindings.json exist & hashed.
- [ ] Lint script exits non-zero on any ERROR rule code.
- [ ] Test cases TC01–TC05 automated.
- [ ] Banned phrase detection works with Indonesian diacritics & case-insensitivity.
- [ ] dev docs show remediation steps.
- [ ] Governance DEC entry for adoption recorded.
- [ ] No disclaimers missing on production build dry run.
- [ ] Report artifact stored: `artifacts/disclaimers-lint/report.json`.

---

## 27. GOVERNANCE DECISION CHECKLIST (TO RATIFY)

| Item | Decision | Owner |
|------|----------|-------|
| min_similarity 0.90 confirm | Accept / Adjust | Governance |
| initial thresholds (banned phrase enforced) | Enforce from day 1 | Governance |
| optional D7 hero aggregate enable? | Off by default | Product |
| disclaimers repeated across pages (D2 both hero & trust) allowed? | Yes (no penalty) | Governance |
| tokenization method (OverlapCoefficient) | Approve | Data Lead |

---

## 28. RISK ASSESSMENT

| Risk | Likelihood | Impact | Overall | Mitigation |
|------|------------|--------|---------|-----------|
| Over-restrict (blocking benign edits) | Medium | Medium | Medium | DEC override tagging |
| Under-detect paraphrased drift | Low | High | Medium | OverlapCoefficient threshold high |
| Developer bypass (inline disable) misused | Low | High | Medium | Audit overrides & DEC references |
| Performance slow build | Low | Low | Low | AST caching |
| Local vs CI mismatch | Medium | Medium | Medium | Provide shared script & container env |

---

## 29. FUTURE EVOLUTION PATH

| Milestone | Enhancement |
|-----------|-------------|
| v1.1 | Multi-locale variant registry (English context) |
| v1.2 | Visual diff screenshot enforcement |
| v1.3 | Semantic embedding drift (cosine) secondary check |
| v2.0 | Policy integration: disclaimers dynamic A/B clarity tests (governance controlled) |

---

## 30. SUMMARY ONE-LINER

“Disclaimers lint memastikan bahwa setiap klaim fairness, privacy, dan integrity tetap eksplisit, tidak tergeser oleh refactor, dan bebas dari kontaminasi bahasa ranking atau hype.”

---

## 31. NEXT ACTIONS

| Action | Owner |
|--------|-------|
| Ratify min_similarity & optional D7 policy | Governance |
| Implement lint script + hook | Engineering |
| Add test fixtures (TC01–TC10) | Engineering |
| Integrate into CI pipeline gating | DevOps |
| Create DEC entry for adoption | Governance |
| Add metrics integration for disclaimer_missing_count | Analytics |
| Document override protocol | UX Writer / Governance |

---

## 32. DECISION PROMPT

Silakan balas format:
`KEPUTUSAN: min_similarity=0.90, optional_D7=off, banned_phrase=enforced`
atau modifikasi param yang diinginkan.

Setelah keputusan:
1. AI append delta ke Master Spec (Lint section).
2. AI buat skeleton lint script pseudocode lebih lengkap (on request).
3. AI siapkan template DEC log entry.

---

## 33. APPENDIX – SAMPLE FAILURE OUTPUT (JSON)

```json
{
  "summary":{"errors":2,"warnings":1},
  "errors":[
    {
      "code":"DISC-PRES-001",
      "page":"equity",
      "missing":["D2"],
      "message":"Missing required disclaimers: D2"
    },
    {
      "code":"DISC-TEXT-003",
      "id":"D1",
      "similarity":0.78,
      "message":"Disclaimer D1 drift beyond allowed threshold 0.90."
    }
  ],
  "warnings":[
    {
      "code":"DISC-DUPL-005",
      "page":"landing",
      "id":"D3",
      "count":2,
      "message":"Duplicate disclaimer D3 appears 2 times."
    }
  ]
}
```

---

## 34. APPENDIX – SAMPLE MARKDOWN REPORT (AUTO-GENERATED)

```
# Disclaimers Lint Report

Date: 2025-08-12T03:45:00Z
Commit: a1b2c3d

Errors (2):
- [DISC-PRES-001] equity missing: D2
- [DISC-TEXT-003] D1 similarity=0.78 (<0.90)

Warnings (1):
- [DISC-DUPL-005] landing duplicate D3 x2

Next Steps:
1. Re-insert D2 into equity template.
2. Restore canonical text for D1 or create DEC override.

Build BLOCKED.
```

---

## 35. ACKNOWLEDGEMENT

Spec ini memanfaatkan fondasi GP1–GP10 dan menutup celah identifikasi sebelumnya (resiko dismissal disclaimers via UI refactor). Tidak ada pengurangan coverage atau prinsip—hanya peningkatan kontrol formal.

---

(End of Disclaimers Presence & Integrity Lint Specification v1.0)