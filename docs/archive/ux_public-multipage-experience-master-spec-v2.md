<!-- ARCHIVE STATUS: HISTORICAL UX MULTIPAGE SPEC
	ORIGIN: Konsolidasi preferensi Anda atas public_landing_dummy_preview dan variasi sebelumnya.
	CURRENT CANONICAL SOURCES: master-spec-v2.0.md (§30, §35, §49), methodology fragment, disclaimers-lint-spec-v1.md, dashboard-widgets-hysteresis-initial.md
	IMMUTABILITY: Jangan edit file ini. Evolusi baru → file baru (misal ux_public-multipage-experience-master-spec-v3.md) atau delta terpisah.
	NON-REMOVAL ASSERTION: Teks asli dipertahankan.
-->
( SELURUH ISI HISTORIS ASLI TETAP DI SINI TANPA PERUBAHAN )

<!-- ARCHIVE STATUS: HISTORICAL UX MULTIPAGE SPEC
	ORIGIN: Konsolidasi preferensi Anda atas public_landing_dummy_preview dan variasi sebelumnya.
	CURRENT CANONICAL SOURCES: master-spec-v2.0.md (§30, §35, §49), methodology fragment, disclaimers-lint-spec-v1.md, dashboard-widgets-hysteresis-initial.md
	IMMUTABILITY: Jangan edit file ini. Evolusi baru → file baru (misal ux_public-multipage-experience-master-spec-v3.md) atau delta terpisah.
	NON-REMOVAL ASSERTION: Teks asli dipertahankan.
-->
( SELURUH ISI HISTORIS ASLI TETAP DI SINI TANPA PERUBAHAN )

<!-- ARCHIVE STATUS: HISTORICAL UX MULTIPAGE SPEC
	ORIGIN: Konsolidasi preferensi Anda atas public_landing_dummy_preview dan variasi sebelumnya.
	CURRENT CANONICAL SOURCES: master-spec-v2.0.md (§30, §35, §49), methodology fragment, disclaimers-lint-spec-v1.md, dashboard-widgets-hysteresis-initial.md
	IMMUTABILITY: Jangan edit file ini. Evolusi baru → file baru (misal ux_public-multipage-experience-master-spec-v3.md) atau delta terpisah.
	NON-REMOVAL ASSERTION: Teks asli dipertahankan.
-->
( SELURUH ISI HISTORIS ASLI TETAP DI SINI TANPA PERUBAHAN )

# MerajutASA — Public Multi‑Page Experience Master Specification (v2.0 “Hero Constellation”)  

Status: Draft for Core Alignment → Then Governance Notation (Decision Log Entry Pending)  
Owner: Product • UX • Governance • Data • Ethics  
Last Updated: 2025-08-12  
Supersedes / Consolidates:  

- v1.0 Public Multi‑Page Experience Comprehensive Specification  
- v1.1 Extension (Sections 36–57)  
- Sully-inspired Narrative Alignment (UI Grammar Adaptation)  
- Visual Identity & Interaction System (Extracts relevant public multi-page portions)  
- Site Map & Userflow (Option A)  
- Wireframe Text Specs (Option B)  
- Event Tracking & Analytics Dictionary (Option C)  
- Visual Identity Multi‑Page Extensions (Option D)  
- Landing “public_landing_dummy_preview” refined layout & card grammar (PREFERRED BASELINE)  

> CRITICAL NOTE: Tidak ada strategi, prinsip, atau rencana terdahulu yang dihapus. Semua elemen sebelumnya dipreservasi; perubahan hanya berupa PENAMBAHAN, PENYATUAN, REFINEMENT hero & card mechanics sesuai preferensi terbaru. Setiap perbedaan dari versi sebelumnya diberi tag [DELTA v2].  

---

## 0. EXECUTIVE SYNTHESIS (WHY v2.0)

v1.x memetakan arsitektur publik multi-halaman, fairness & integrity instrumentation, serta extended governance risk posture. Feedback terbaru: preferensi kuat terhadap prototipe hero “constellation modular cards” (public_landing_dummy_preview refined). v2.0:

1. Mengikat hero baru sebagai “Integrity & Equity Constellation” layer tanpa memunculkan feature bloat / hype.  
2. Memformalkan “Capability Cards Grid” sebagai representasi rails (credential, equity, under‑served, hash excerpt, governance, terminology adoption, feedback pulse) menggantikan cluster floating acak; mematuhi batas ≤7 modul.  
3. Menyelaraskan narrative grammar Sully-style secara etis (tanpa overclaim) → “Scene 1: Hero Density / Scene 2: Audit Deepen / Scene 3: Composition”.  
4. Menyatukan Option A–D plus semua ekstensi (Sections 1–59 sebelumnya) ke dalam satu MASTER SPEC yang berisi: strategi, IA, UX flows, visual tokens, instrumentation, risk, fairness auditing, hero grammar, gating, governance, evaluation, future expansions.  
5. Menambahkan Delta Mapping (versus v1.1) agar governance dapat cepat memverifikasi tidak ada penghapusan kesengajaan.  

---

## 1. FOUNDATIONAL PRINCIPLES (UNCHANGED + REASSERTED)

| Code | Principle | Immutable Rationale | UX Manifestation |
|------|-----------|--------------------|------------------|
| GP1 | Privacy-by-Architecture | Melindungi martabat anak; menghindari extraction risk | Tidak ada child PII; disclaimers wajib, aggregated only |
| GP2 | Executable Governance | Trust = verifiability, bukan klaim naratif | Hash excerpt + credential verify instructions |
| GP3 | Federated Mindset | Cegah platform lock-in; integrity portability | Credential JSON-LD minimal; portable verify semantics |
| GP4 | Integrity Before Scale | Skala tanpa rails = amplifikasi risiko | Delay features (family guidance, sandbox) |
| GP5 | Transparency as Feature | Minim interpretasi liar | Hero foot disclaimers + trust methodology |
| GP6 | Outcome Honesty | Hindari metric theatrics | No ranking, no growth superlatives |
| GP7 | Transition-Aligned | Terminologi = perubahan budaya bertahap | Stage 1 dual-term progress bar |
| GP8 | Differential Exposure (MSP1) | Stakeholder-lens tanpa data overshare | L0–L4 only publik |
| GP9 | Non-Ranking Fairness | Resource fairness ≠ performance race | Buckets + under‑served criteria; no ordered scoreboard |
| GP10| Observability (MSP8) | External audit possible | Hash chain excerpt & verify CLI snippet |

_No deletions from earlier principle list — mapping preserved._  

---

## 2. SCOPE & NON-SCOPE (STABLE)

| In-Scope (Public Tier) | Out-of-Scope (Deferred / Rejected) |
|------------------------|------------------------------------|
| Multi-page public IA (landing, registry, equity, trust, terminology, feedback, media digest, governance, about) | Predictive scoring, donation monetization UI, case-level data, direct child sponsorship, geo micro-maps (sub-city) |
| Hero integrity constellation | Story feed emotional appeals |
| Under-served fairness surfacing | Unit ranking leaderboard |
| Credential viewer & verify guidance | Per-unit comparison matrix |
| Terminology adoption reporting | Real-time chat agent persona |

---

## 3. USER SEGMENTS (UNCHANGED BASELINE)

(See v1.0 Section 3) – All personas retained. Add explicit “Internal Observer (IO)” for internal QA navigation (no UI difference; instrumentation flagged user_type override in restricted contexts).

---

## 4. INFORMATION ARCHITECTURE (NO REMOVAL)

Same sitemap from v1.0 + added note:

[DELTA v2] Hero now anchors quick exploration hub replacing earlier idea of possible conversational affordance.

```
/
├─ /about
├─ /terminology
├─ /registry
│   └─ /u/{slug}
├─ /equity
├─ /trust
├─ /media-digest
├─ /faq
├─ /feedback
├─ /support          (phase 1.5)
├─ /governance
├─ /changelog        (phase 1.5)
├─ /community-action (phase 2)
├─ /family           (placeholder)
├─ /research         (overview placeholder)
└─ /transition       (expanded narrative; phase 1.5)
```

---

## 5. PAGE INVENTORY & PRIORITIZATION (UNCHANGED CONTENT + HERO DELTA NOTED)

No removal; hero redesign impacts “Landing” only (component composition shift, not scope shift).  

---

## 6. GLOBAL NAV MODEL (UNCHANGED)

Added [DELTA v2]: Exploration hub now lives inside hero (not separate hub page); ensures first navigation action within ethical rails.

---

## 7. CROSS-PAGE PATTERNS (ADDITIVE)

Existing patterns preserved. Added:

| Pattern | Description | Integrity Safeguard |
|---------|-------------|---------------------|
| Integrity Constellation Cards | 7 fixed modules represent rails; fade-in sequential | Enforced cap & disclaimers inside cards |
| Hub Pill Navigation | Pill actions instead of search/chat | Avoid chat illusion & scope misexpectation |
| Semantic Gradient Restraint | Soft gradient + audit grain | Visual identity = authenticity, not spectacle |

---

## 8. DETAILED PAGE SPECS (UNCHANGED STRUCTURE)

Landing spec updated to reflect new hero (Section 13 of this v2). All other pages identical to v1.0 except cross-links referencing new hero structure.

---

## 9. WIREFRAME TEXT SPECS (ORIGINAL + REVISED HERO)

Original Landing wireframe retained (archive) + Revised Hero v2 appended.  
(See Section 13 for new canonical hero depiction).  

---

## 10. PRIMARY USERFLOWS (UNCHANGED PATHS, IMPACT: ENTRY)

Flow A–F remain. [DELTA v2]: Step “Scan hero snapshot” now includes potential quick inspection of a capability card (no detail pop-ups at MVP; deeper actions route to pages).

---

## 11. DECISION POINT MATRIX (NO REMOVAL)

Added Row:

| Decision | Risk | Mitigation | Page |
|----------|------|------------|------|
| Misread constellation as “feature overload” | Cognitive overload | Cap 7 cards + microcopy clarity + uniform height | Landing |

---

## 12. COMPONENT LIBRARY (UPDATED CARDS DEFINITIONS)

Added “CardGrid (Integrity Constellation)” component; each card inherits disclaimers and normative tone rule set (see Section 28 Lint expansions).  

---

## 13. HERO CONSTELLATION (NEW CANONICAL SPEC) [DELTA v2]

### 13.1 Narrative Grammar

Scene 1: Constellation emerges (cards fade & slight elevation).  
Scene 2 (optional future animation path): Focal zoom per card (progressive educational highlight) — deferred for accessibility review.  
Scene 3: Cards settle into grid (static; reduces motion after initial reveal).  

### 13.2 Cards Inventory (Immutable Set v2)

| ID | Name | Data Field Sources | Disclaimers | CTA Target |
|----|------|-------------------|-------------|-----------|
| C1 | Integrity Credential | Sample attested org (mock baseline) | Credential ≠ ranking | /trust#credential |
| C2 | Equity Index | Snapshot equity aggregated | Non-ranking fairness signal | /equity |
| C3 | Under-Served Monitor | List derived from threshold <0.6 & open needs >0 | Not quality judgement | /equity#under-served |
| C4 | Hash Excerpt | Latest 3–5 chain entries | Metadata only | /trust#hash |
| C5 | Governance Snapshot | Latest decision log teaser | Not full log | /governance |
| C6 | Terminology Adoption | Current stage + adoption % | Transitional, not enforcement | /terminology |
| C7 | Feedback Pulse | Count + actionable ratio placeholder | Aggregated, no raw messages | /feedback |

### 13.3 Layout Rules

- Grid min 230px card width; auto-fit; maintain vertical rhythm (16–20px gutters).
- Uniform card min-height to avoid priority illusions.
- No ranking ordering — order is logical pipeline: Integrity→Fairness→Fairness Action→Audit→Governance→Transition→Participation.

### 13.4 Motion Constraints

- Single entrance animation (duration < 600ms). No infinite loops.
- Reduced motion preference triggers static immediate layout (WCAG respect).
- No numeric count-up animations (GP6).

### 13.5 Accessibility

- Each card: `<article>` with `aria-label`.
- Gauge (Equity) includes textual numeric fallback, classification label.
- Live region for rotator text (polite). Rotator change interval 4s minimum.

### 13.6 Content Tone Table (Enforced)

| Element | Must Include | Must Avoid |
|---------|--------------|------------|
| Credential Card | Hash truncated, issuer DID | Value adjectives (“premium credential”) |
| Equity Card | Classification (Healthy/Monitoring/Imbalance) | “Top” or “best” |
| Under-Served | Criteria mention | “Critical emergency” (unless verified event) |
| Terminology | Stage & percent | Shaming phrasing |
| Feedback | Month context | “Speak now or lose chance” urgency framing |

---

## 14. EQUITY PRESENTATION (NO CHANGE IN LOGIC)

Re-stated to ensure no drift after hero addition. Under-served extraction formula unchanged. Hysteresis threshold evaluation remains Phase 2 investigation.

---

## 15. TRUST & METHODOLOGY PAGE (UNCHANGED; CROSS-REFER HERO)

Add anchor references: The hero constellation’s C1–C5 cards each hyperlink to a relevant subsection.

---

## 16. MEDIA DIGEST (UNCHANGED FUNCTION)

Hero redesign does not alter digest semantics. Ensure digest page explains snapshot relationship to hero summaries.

---

## 17. TERMINOLOGY PAGE & ADOPTION (UNCHANGED)

Hero shows adoption percent; page remains canonical source. Stage transition triggers: adoption ≥70% + governance vote.

---

## 18. FAQ (UNCHANGED)

Add entry: “Mengapa ada beberapa kartu di halaman awal?” → “Kartu mewakili modul integritas & pemerataan — bukan daftar fitur komersial.”

---

## 19. FEEDBACK PAGE (UNCHANGED INPUT / SCHEMA)

Consider future instrumentation for distinguishing hero-sourced vs nav-sourced feedback (meta.referrer_section) (Backlog ID: UX-FDBK-SRC-TAG).

---

## 20. GOVERNANCE & POLICY PAGE (UNCHANGED SCOPE)

Add optional section “Hero Module Provenance” listing last decision IDs for any hero metric methodology change.

---

## 21. SUPPORT (PHASE 1.5) (UNCHANGED)

No hero dependency.

---

## 22. CHANGELOG EXCERPT (PHASE 1.5) — UNCHANGED

Will allow linking from card “Hash Excerpt” into more detailed changelog excerpt.

---

## 23. FAMILY PLACEHOLDER (UNCHANGED)

Hero does not show family module to avoid early expectation overreach.

---

## 24. RESEARCH OVERVIEW (UNCHANGED)

No visible hero integration.

---

## 25. WIREFRAME ARCHIVE (PRESERVATION)

Old hero wireframe retained internally for historical governance; not surfaced externally. No removal.

---

## 26. METRICS & KPI (UNCHANGED; HERO IMPACT)

Add metric: Hero Module Interaction Coverage = (# sessions with at least one card CTA click) / (landing sessions). Target initial ≥35% (non-inflated).

---

## 27. EVENT TRACKING (EXTENDS v1 LIST) [DELTA v2]

Append new events (prefix consistent):

| Event | Description | meta fields |
|-------|-------------|-------------|
| pub_hero_card_impression | Single card enters viewport | card_id |
| pub_hero_card_cta_click | Card footer / CTA clicked | card_id |
| pub_hero_card_focus | Keyboard focus event | card_id |
| pub_hero_pill_click | Exploration hub pill action | pill_id |
| pub_hero_rotator_change | Subline cycle | rot_index |
| pub_hero_metric_hover | Hover snapshot metric | metric_id |

Existing events remain; no renaming (backwards compatibility).

---

## 28. LINT & GOVERNANCE AUTOMATION (EXTENDED) [DELTA v2]

Add new lint categories:

| Lint Rule | Scope | Violation Example |
|-----------|-------|-------------------|
| hero.card.count.max7 | Build pipeline | Adding 8th card without governance |
| hero.card.hype.language | Card copy | “Revolutionary fairness engine” |
| hero.metric.precision | Equity index decimals ≤2 | 0.71234 |
| hero.disclaimer.presence | Landing page | Missing disclaimers block |
| hero.order.pipeline | Card order mutated | Equity before Credential |

Action: Failing lint blocks deploy (CIC-D content change if only copy; CIC-B if metric representation change).

---

## 29. SULLY-STYLE ADAPTATION TRACEABILITY (REINFORCEMENT)

Mapping kept for audit (from earlier alignment doc). No new external patterns added.

---

## 30. FAIRNESS AUDIT METHODOLOGY (UNCHANGED)

Hero does not change fairness calculation. Added check: Card ordering does not bias perception of fairness vs governance (audit note each quarter).

---

## 31. PRIVACY THREAT MODEL (UNCHANGED TABLE + NEW SURFACE)

New surface: “Hero Composite” – Risk of inferred institutional ranking by visual proximity. Mitigation: uniform card size & non-sorted order; disclaimers.

---

## 32. GOVERNANCE & ACCOUNTABILITY (ENRICHED)

Add requirement: Decision Log entry for hero structural changes (Card addition/removal, order change, semantics). Class mapping:

| Change Type | CIC Class |
|-------------|-----------|
| Add Card (new dataset) | CIC-B (exposure) |
| Remove Card | CIC-D (content) + note rationale |
| Card order modification | CIC-D (narrative) |
| Method underlying metric changed (e.g., Equity calc) | CIC-E (method) |

---

## 33. INTERNATIONALIZATION (UNCHANGED STRATEGY)

Ensure card labels use key-based translation from the outset for future multi-language expansion; fallback plain Indonesian.

---

## 34. PERFORMANCE & RESILIENCE (UPDATED BUDGET FOR HERO)

Budget adds hero card grid cost:

| Page | Additional Hero Payload Budget | Notes |
|------|-------------------------------|-------|
| Landing | + ≤40KB (cards static JSON stub) | Consider pre-rendering snapshot partial |

Fallback: If metric fetch fails, show placeholder “Perlu data” gracefully per card.

---

## 35. ETHICAL CONTENT ASSURANCE (INCLUDES HERO)

Hero copy review enters same workflow, plus test: “Can a naive reader think we store personal child data?” → If yes at >20% sample, revise copy.

---

## 36. DEPRECATION & ALTERATION POLICY (APPLIES TO CARDS)

Add Table:

| Card | Deprecation Trigger | Replacement Path |
|------|---------------------|------------------|
| Feedback Pulse | If participation metric misused as gamification | Shift to discrete “Feedback Link” + monthly summary page |
| Governance Snapshot | If decision excerpt volume clutter | Move inside /governance; card replaced by “Integrity Pipeline” summary |
| Under-Served Monitor | If fairness misinterpretation > threshold | Replace with “Fairness Overview” card (bucket counts only) |

---

## 37. EVALUATION FRAMEWORK (UNCHANGED + HERO METRICS)

Added hero-specific comprehension survey item (internal cohort): “Apakah kartu mewakili fitur internal privat?” Expected “Tidak / modul publik agregat.” Accuracy target ≥80%.

---

## 38. RISK REGISTER (ADDED ENTRIES)

| ID | Risk | Impact | Prob | Mitigation | Status |
|----|------|--------|------|------------|--------|
| PUB-R9 | User interprets card order as priority ranking | Medium | Low | Document fixed canonical order; disclaimers | Monitoring |
| PUB-R10 | Increased bounce if hero perceived as dense | Medium | Low | Reduction to 7 balanced cards; readability test | Baseline needed |
| PUB-R11 | Cosmetic drift (cards start showing marketing adjectives) | Trust erosion | Medium | Lint + editorial gating | Active control |

All previous risks retained.

---

## 39. QA CHECKLIST (EXTENDED FOR HERO)

Added hero-specific items:

| Check | Pass Condition |
|-------|----------------|
| Card count = 7 | Yes |
| Each card has aria-label | Programmatic check |
| Disclaimers present & visible w/o scroll to 900px height | Visual test |
| Equity gauge accessible fallback | Text numeric visible |
| Reduced motion disables animations | No transform/opacity transitions |
| Color contrast card text ≥ 4.5:1 | Automated scan |

Original QA items preserved.

---

## 40. BACKLOG SEEDS (APPENDED)

New issues (prefix UX/HERO):

| ID | Title | Class |
|----|-------|-------|
| UX-HERO-01 | Implement integrity constellation card grid (static content pass) | CIC-D |
| UX-HERO-02 | Add lint rule: hero.card.count.max7 | CIC-D |
| UX-HERO-03 | Add event instrumentation for hero_card_impression | CIC-A |
| UX-HERO-04 | Build accessibility automated scan for card semantics | CIC-A |
| UX-HERO-05 | Add governance snapshot dynamic data feed adapter | CIC-B |
| UX-HERO-06 | Implement under-served threshold hysteresis (future) | CIC-E |
| UX-HERO-07 | Build disclaimers presence integration test | CIC-A |
| UX-HERO-08 | Add translation key scaffolding for card labels | CIC-A |

(Original backlog items retained unmodified.)

---

## 41. ROLLOUT PLAN (ADJUSTED ORDER) [DELTA v2]

| Week | Deliverable (Updated) | Notes |
|------|-----------------------|-------|
| 1 | Hero constellation static + snapshot metrics | Replace earlier hero prototype |
| 2 | Registry & Unit Profile | As per baseline |
| 3 | Equity page & Under-served logic | Integrates hero card deep link |
| 4 | Trust & Methodology + Hash excerpt | Hero link stable |
| 5 | Feedback form & Terminology page | Adoption baseline attaches to hero |
| 6 | Media Digest & About | Digest references hero metrics |
| 7 | Governance page excerpt | Card snapshot fully linked |
| 8 | Instrumentation + fairness audit dry run | Hero events validation |
| 9 | A11y & performance hardening | Motion reduced compliance |
| 10 | Soft launch cohort review | Collect hero comprehension metrics |

Original milestone mapping not removed—this row REPLACES earlier Week 1 item describing old hero.

---

## 42. SUCCESS / FAILURE SCENARIOS (ADD HERO-SPECIFIC)

| Scenario | Signal | Action |
|----------|--------|--------|
| Hero confusion (low CTA usage) | Hero Module Interaction Coverage <25% | Add micro contextual “Setiap kartu = modul publik agregat” note |
| Overfocus on single card (e.g. Equity 70% of clicks) | Card click distribution Gini >0.55 | Evaluate layout emphasis; maybe reposition slightly |
| High misinterpretation (“ranking” feedback) | ≥5% ranking confusion | Add persistent “Non-Ranking Fairness” badge near equity & under-served |

Existing scenarios preserved.

---

## 43. FUTURE HERO EVOLUTION (GUARDED ROADMAP)

| Phase | Potential Enhancement | Gate Condition | Risk |
|-------|-----------------------|----------------|------|
| 1.5 | Card detail hover popover (method snippet) | A11y pass + comprehension stable | Cognitive overload |
| 2 | Dynamic fairness shift badge (trend arrow) | Equity variance stable | Over-interpretation of minor deltas |
| 2 | Credential revocation badge addition | Revocation subsystem live | Confusing without education |
| 3 | Community action micro-card (ethical guidance summary) | Support page matured & audited | Scope creep into activism feed |

---

## 44. ALIGNMENT MATRIX (v2 HERO VS STRATEGY)

| Strategic Pillar | Hero Card(s) Manifestation | Notes |
|------------------|----------------------------|-------|
| Integrity | Credential, Hash, Governance | Multi-angle verifiability |
| Equity | Equity Index, Under-Served | Non-ranking emphasis |
| Privacy | Omission of any personal data card | Reinforces minimization |
| Transition | Terminology adoption card | Stage visibility |
| Participation | Feedback Pulse | Participatory legitimacy |
| Governance | Governance snapshot + link | Policy observable |

---

## 45. DIFF LOG (v1.1 → v2 SUMMARY)

| Category | v1.1 | v2 Delta |
|----------|------|----------|
| Hero Structure | Mixed hero + snapshot + potential previous floating cluster | Unified 7-card constellated grid, no floating random positions |
| Events | No hero_card_* events | Added hero_card_impression, hero_card_cta_click, etc. |
| Lint | Generic disclaimers & terminology | Added hero- specific structural / hype / order rules |
| Risk Register | Up to PUB-R8 | Added PUB-R9–R11 |
| QA | No hero-specific checks | Card count, accessibility, motion fallback |
| Rollout Week 1 | Simple hero snapshot | Constellation integration deliverable |
| Governance Hooks | Generic metric change classes | Card order & addition explicit CIC mapping |
| Documentation | Separate Sully adaptation doc | Incorporated into master spec core |

_No removals — replaced or appended only._

---

## 46. GOVERNANCE ACTION REQUIRED (FOR RATIFICATION)

| Item | Required Action | Artifact |
|------|-----------------|----------|
| Card Inventory Approval | Ethics + Governance Board review (scope alignment) | This spec Section 13 |
| Event Additions | Data / Privacy review (no new PII risk) | Section 27 |
| Lint Rules Activation | DevOps integrate into CI | Section 28 |
| Decision Log Entry | Create DEC ID referencing v2 adoption | Governance |
| Public Changelog Note | Add note: “Hero integrity constellation introduced” | /changelog (phase 1.5 placeholder) |

---

## 47. OPEN QUESTIONS (CARRIED + NEW HERO)

| Q | Status | Owner | Deadline |
|---|--------|-------|----------|
| Q1 Partner logo inclusion? | Pending (from v1) | Governance | Pre-launch |
| Q2 Under-served partial mask? | Re-eval (still likely no) | Product | +10d |
| Q3 Equity label phrasing alternate? | In progress | UX Writer | +4d |
| Q4 Hysteresis criteria? | Deferred Phase 2 | Data Lead | Snapshot #5 |
| Q5 Feedback inline modal? | Phase 1.5 test | Product | After soft launch |
| Q6 Add real-time incident-free counter? | Needs risk review | Governance | +14d |
| Q7 Revocation viewer placeholder card? | Not before subsystem ready | Product | Gate revocation design |
| Q8 Visual density test: small screens? | Accessibility test planned | UX | +7d |
| Q9 Multi-language token readiness? | Post Stage 1 terminologi | Comms | Stage 2 trigger |
| Q10 Add “What We Don’t Do” micro label on hero? | Under review | Governance | +5d |

(All prior open questions from earlier spec remain; numbering aggregated, not reset.)

---

## 48. EXIT CRITERIA (UPDATED WITH HERO) [DELTA v2]

Add to original list:

- Hero card grid passes a11y scan (contrast & focus).
- hero.card.count.max7 lint passes.
- ≥1 internal test session: comprehension correct responses ≥80%.
- All hero events appear in analytics pipeline sample.

Original exit criteria remain.

---

## 49. MASTER DISCLAIMER LIBRARY (UNCHANGED, REINDEXED)

| ID | Text | Placement |
|----|------|-----------|
| D1 | Equity signals bukan ranking kualitas. | Equity page, hero equity card, under-served card |
| D2 | Tidak ada data pribadi anak dikumpulkan/ditampilkan. | Hero disclaimer block, trust page |
| D3 | Credential = status verifikasi; bukan skor performa. | Credential card / trust |
| D4 | Context note wajib saat mengutip digest angka. | Media digest |
| D5 | Hash excerpt hanya metadata perubahan. | Hash card / trust |
| D6 | Terminologi dalam fase transisi terbuka. | Terminology card/page |
| D7 [NEW] | Kartu ini menampilkan agregat publik — bukan akses internal. | Optional mini tooltip (if confusion) |

---

## 50. SUMMARY STATEMENT (v2 INTEGRITY)

Hero constellation bukan “fitur baru” melainkan “visual coherence layer” yang menampilkan rails & sinyal inti secara ringkas, mengurangi friksi skeptisisme awal dan memandu pengguna ke jalur audit & fairness tanpa memicu perilaku kompetitif atau rasa sensasional. Semua prinsip & rencana terdahulu berdiri utuh; v2 hanyalah reorganisasi semantik yang lebih kuat atas fondasi tersebut.

> “Jika visual tidak menambah verifiability, ia wajib mundur.” — Governing Ethos Unchanged

---

## 51. NEXT 7-DAY ACTION SNAPSHOT

| Day Bucket | Action | Owner |
|------------|--------|-------|
| D+1 | Decision log entry draft | Governance |
| D+2 | Copy finalization hero microcopy (lint run) | UX Writer |
| D+3 | Implement hero events instrumentation | Frontend + Analytics |
| D+4 | A11y audit (contrast, focus, reduced motion) | A11y Champion |
| D+5 | Data snapshot validation (equity & coverage) | Data Lead |
| D+6 | Governance sign-off meeting (short agenda) | Governance Chair |
| D+7 | Pre-launch internal comprehension test | UX Research |

---

## 52. APPENDICES (EXCERPTS; FULL TEXT IN PRIOR MERGED SECTIONS)  

(All prior appendices A–M from v1.0 retained; hero-specific appendices not replacing them.)

### Appendix H (Instrumentation) [Extended]

Add sample payload keys for hero events:  
`meta: { page:"landing", card_id:"C2", classification:"Monitoring" }`

### Appendix K (Lint Rules) [Extended]

Add rule snippet referencing hero order & hype detection (conceptual pseudocode only; implementation in CIC pipeline — unchanged principle).

_All other appendices unchanged — no deletion._

---

## 53. VERSIONING & CHANGE LOG (INTERNAL)

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2025-08-11 | Initial consolidated spec (A–D integration) |
| 1.1 | 2025-08-11 | Advanced extensions (Sections 36–57) |
| 2.0 | 2025-08-12 | Hero constellation adoption, card grammar formalized, events & lint expansion, no removal of prior strategies |

---

## 54. ACKNOWLEDGEMENTS

- User Preference Feedback (Landing UI) integrated without strategy erosion.
- Governance & Ethics advisory for ensuring hero pattern does not create implicit ranking semantics.
- Data Lead confirmation that equity & under-served metrics remain unaffected by presentation layer.

---

## 55. CONTINUITY SAFEGUARD

Reminder: Any future attempt to simplify this spec must not excise risk, governance, or fairness audit sections. Consolidation allowed; removal requires explicit Ethics Board vote (CIC-B/E depending on data exposure ramifications).

---

(End of Master Specification v2.0 “Hero Constellation”)

If additional elaboration or deeper expansion (e.g., full narrative script, hero copy A/B matrix, or extended fairness hysteresis design) is needed, request “CONTINUE v2 — TOPIC <name>” and it will be appended without overwriting prior content.  
