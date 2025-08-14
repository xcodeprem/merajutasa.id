# MerajutASA – Roadmap & Milestones Komprehensif (Master Consolidation)

Status: Living Draft (Menunggu Ratifikasi Governance untuk beberapa keputusan parameter)  
Prepared: 2025-08-12  
Scope: Mengkonsolidasikan SEMUA rencana, strategi, spesifikasi, keputusan, dependency, guardrail, lint, fairness, privacy, instrumentation, serta ekspansi jangka panjang.  
Important: Dokumen INI TIDAK MENGHAPUS atau MENGGANTIKAN strategi sebelumnya. Semua referensi (Master Spec v2.0, Credential Schema v1.0, Hysteresis Options Pack v1.0, Event Schema v1.0, Disclaimers Lint v1.0, PII Pattern Library v1.0) tetap berlaku. Ini hanyalah agregasi & orkestrasi eksekusional.

---

## 0. EXECUTIVE OVERVIEW

Roadmap ini memfokuskan 4 horizon waktu:

- Horizon 0 (Hari 0–7): Hardening Fondasi Trust Primitives (signer, chain, snapshot, lint, PII).
- Horizon 1 (Hari 8–30): Stabilitas Fairness & Observability (hysteresis implementasi, instrumentation penuh, equity pipeline).
- Horizon 2 (Hari 31–60): Governance Depth & Transparency Amplification (changelog excerpt, support matrix, anomaly watchers, revocation placeholder UI, a11y/performance enforcement).
- Horizon 3 (Hari 61–90): Maturity & External Audit Readiness (quarterly fairness internal audit snippet, incident banner infra, Stage 2 terminology readiness evaluation).
- Horizon N+ (>90): Federation, revocation lifecycle real, peer attestations, CBOR/compact verification, localization, advanced fairness analytics (variance & hysteresis tuning).

Setiap horizon memetakan:

1) Deliverables
2) Acceptance Criteria
3) Dependencies
4) Risk & Mitigasi
5) Metrics Gating
6) Governance / DEC Entries
7) RACI micro

---

## 1. PRINCIPAL TRACKS (REFERENSI & KONTINUITAS)

| Track | Fokus | Dokumen Referensi | Outcome Inti |
|-------|-------|-------------------|--------------|
| A Integrity | Credential signing, hash chain, verify CLI | Credential Schema v1.0 | Verifiable issuance & chain audit |
| B Fairness | Equity snapshot & hysteresis Option F | Hysteresis Options Pack v1.0 | Stable under-served labeling |
| C Governance & Policy | Lint disclaimers, policy-as-code thresholds, decision logs | Disclaimers Lint v1.0 | Enforcement non-drift |
| D Instrumentation & Analytics | Event ingestion, meta validation, KPI dashboards | Event Schema v1.0 | Observability baseline |
| E Privacy & Security | PII scanner runtime, redaction, hashing salts | PII Pattern Library v1.0 | Feedback risk mitigation |
| F Terminology & Transition | Adoption scanning, stage gating | Master Spec v2.0 Sec Terminology | Transparent transition progress |
| G Participation & Feedback | Feedback pipeline, category taxonomy, roll-ups | Master Spec & PII spec | Actionable aggregated feedback |
| H Performance & Accessibility | Pre-render LCP focus, a11y test harness | Master Spec (Perf/A11y sections) | Inclusive performance integrity |
| I Revocation Futureproof | Revocation list endpoint placeholder & schema wiring | Credential Schema revocation section | Lifecycle transparency readiness |
| J Transparency & Education | Methodology narrative, FAQ expansions, disclaimers presence | Master Spec v2.0 & Disclaimers Lint | User comprehension fairness/trust |
| K Risk & Audit | Anomaly watchers, fairness audit log, chain event mapping | Risk register & fairness methodology | Continuous trust assurance |
| L Federation & Future | DID portability, external attestation, localization, CBOR | Future expansions in Credential spec | Scalability & portability guardrail |
| M Portal Panti | Orientasi produk, ruang lingkup, model data minimal aman, About, rubrik audit | docs/governance/statement-orientasi-portal-panti.md; docs/produk/portal-panti/01-ruang-lingkup-produk.md; docs/produk/portal-panti/02-model-data-minimal-aman.md; docs/public/ABOUT-PORTAL-PANTI.md; docs/audit/00-rubrik-audit-portal-panti.md | Discoverability non-ranking & governance guardrails |

---

## 2. DECISION BACKLOG (NEEDED BEFORE / DURING EXECUTION)

| DEC ID Placeholder | Keputusan | Target Horizon | Critical Path? |
|--------------------|-----------|----------------|----------------|
| DEC-HYST-01 | Adopsi Hysteresis Option F + param (0.50/0.60 consecutive/0.65 exit/cooldown 1/stalled=5) | H0 | YA |
| DEC-CRED-02 | Evidence hash display length (UI) (16 vs 24) | H0 | YA |
| DEC-CRED-03 | Expiration adoption timing (Phase 2 vs immediate) | H1 | YA (affects schema usage) |
| DEC-POLICY-04 | Min cell aggregation threshold (≥5?) | H0 | YA (policy gate) |
| DEC-LINT-05 | Disclaimers similarity min 0.90 confirm | H0 | YA |
| DEC-PII-06 | multi_category_block_threshold = 2 | H0 | YA |
| DEC-EVT-07 | classification equity index truncated 2 dp | H0 | YA |
| DEC-D7-08 | Optional D7 hero toggle default (off) | H0 | Tidak (UI only) |
| DEC-TERM-09 | Stage 2 trigger process (auto script + governance vote) | H2 | YA (transition comms) |
| DEC-REV-10 | Revocation reason codes initial set finalize | H2 | YA |
| DEC-ANOM-11 | Equity anomaly delta threshold (0.03) | H1 | YA |
| DEC-PERF-12 | LCP budget target (e.g. ≤2.2s p75) | H1 | YA |
| DEC-A11Y-13 | A11y compliance baseline (WCAG 2.1 AA) | H1 | YA |
| DEC-FEED-14 | Feedback categories canonical (governance, improvement, fairness, other) | H0 | YA |
| DEC-METRIC-15 | KPI baseline finalization post 14 hari | H1 | Tidak (analysis) |
| DEC-SAMPLE-16 | Event sampling start (after 30d) confirm | H2 | Tidak |
| DEC-LOCALE-17 | Localization pilot language (EN) | H3 | Tidak |
| DEC-CHAIN-18 | Event chain anchoring onset | H2 | YA (observability) |

---

## 3. HORIZON 0 (HARI 0–7) – TRUST PRIMITIVES FOUNDATION

### 3.1 Deliverables

| ID | Deliverable | Description |
|----|-------------|-------------|
| H0-A1 | Ed25519 Signer Service MVP | REST endpoint sign credential canonical JSON (no caching) |
| H0-A2 | Credential Test Vectors | Canonical pre-proof JSON hash + signature sample fixtures |
| H0-A3 | Hash Chain Minimal Service | Append (seq, prevHash, contentHash, signature) + verify endpoint |
| H0-B1 | Equity Snapshot Script (Manual Run) | Computes coverage, verified %, equity index, initial bucket counts |
| H0-B2 | Hysteresis Engine Skeleton | Logging transitions (NONE→CANDIDATE→ACTIVE etc) (no UI yet) |
| H0-C1 | Disclaimers Lint Tool Implementation | CI job enforcing mapping & similarity |
| H0-C2 | Policy-as-Code (Aggregation Threshold) | OPA rule denies publish if cell < threshold |
| H0-D1 | Event Collector Endpoint | Accepts events, schema validation, event_hash injection |
| H0-D2 | Basic Dashboard Query Seeds | Raw counts for landing sessions & hero interactions (query scripts) |
| H0-E1 | PII Scanner Runtime Integration | Feedback endpoint scanning → BLOCK/REDACT/MASK actions |
| H0-E2 | PII Test Corpus & Benchmark | Automated test run (recall/precision metrics) |
| H0-G1 | Feedback Storage Schema | Table design: feedback_submissions (id, categories[], redacted_text, pii_categories[]) |
| H0-J1 | Public Methodology Snippet (Hysteresis pending DEC) | /equity & /trust sections stubbed with “Decision Pending” badge |
| H0-K1 | Governance DEC Entries (credential, hysteresis, events, lint, PII) | Markdown DEC logs hashed |
| H0-H1 | Hero Pre-render + Static Snapshot JSON | SSR output & embed snapshot metrics JSON inline |
| H0-A4 | Verify CLI Doc Draft | Step-by-step verification instructions |

### 3.2 Acceptance Criteria (Key)

- Signer signature verifies via CLI on fixture.
- Chain append enforces prevHash continuity & rejects mismatch.
- Lint job fails on removing D2 from landing (tested).
- PII scanner ≥ target recall high risk (≥0.98).
- Event collector rejects unknown event_name; ingests hero events.
- Equity snapshot output persisted with timestamp; equity index accurate formula (1 - Gini).
- Hysteresis engine logs correct state transitions on synthetic sequences.
- Policy-as-code blocks sample publish violating min cell threshold.
- Feedback submission with phone/email redacted accepted; NIK blocked.

### 3.3 Dependencies

| Deliverable | Depends On | Explanation |
|-------------|-----------|-------------|
| H0-A1 | Credential Schema final | Field canonicalization |
| H0-A2 | H0-A1 | Use signer for fixture |
| H0-A3 | H0-A1 hash canonical procedure | Need contentHash spec |
| H0-B2 | Hysteresis DEC | Parameter finalization |
| H0-C2 | DEC-POLICY-04 | Threshold numeric needed |
| H0-E1 | PII pattern spec | Patterns compiled |
| H0-D2 | H0-D1 | Data source ingestion |
| H0-H1 | Equity snapshot script | Provide initial metrics for hero SSR |

### 3.4 Risks & Mitigasi

| Risk | Mitigasi |
|------|----------|
| Delayed Hysteresis DEC menunda B2 | Fast governance meeting Day 1 |
| FP tinggi PII blocking menurunkan feedback | Tweak config (context requirement) + user guidance |
| Chain service bug causing broken prevHash early | Unit tests: simulate sequence mismatch |
| Lint friction (minor punctuation flagged) | Provide DEC override attribute + doc |
| Snapshot math error memicu distrust | Cross-check equity index with manual small dataset |

### 3.5 KPIs (Early Visibility)

| KPI | Target Day 7 (Indicative) |
|-----|---------------------------|
| Hero Module Interaction Coverage | Measurement only (no target enforcement yet) |
| Feedback Submission Count | Baseline >0 (internal testers) |
| PII Block Rate | <25% on internal synthetic (tune down) |
| Lint Violations Resolved | 100% (no persistent errors) |

### 3.6 RACI (Condensed)

| Deliverable | R | A | C | I |
|-------------|---|---|---|---|
| Signer Service | Engineering | Governance | Security | All |
| Hash Chain | Engineering | Governance | AI | All |
| PII Scanner Integration | Engineering | Privacy Lead | AI | Governance |
| Disclaimers Lint | Engineering | Governance | AI | UX |
| Equity Snapshot Script | Data Eng | Product | AI | Governance |
| Hysteresis Skeleton | Data Eng | Product | AI | Governance |
| Event Collector | Engineering | Product | AI | Analytics |
| Feedback Schema | Engineering | Product | Privacy | Governance |

### 3.7 Governance / DEC

- Issue DEC files: DEC-20250812-01 (Credential Schema), DEC-20250812-02 (Hysteresis Option F), DEC-20250812-03 (Event Schema), DEC-20250812-04 (Disclaimers Lint activation), DEC-20250812-05 (PII Pattern adoption), DEC-20250812-06 (Aggregation threshold).

---

## 4. HORIZON 1 (HARI 8–30) – FAIRNESS & OBSERVABILITY STABILIZATION

### 4.1 Deliverables

| ID | Deliverable | Description |
|----|-------------|-------------|
| H1-A1 | Hash Chain Persistence Hardening (storage backend) | Move from file/memory → durable store w/ indexing |
| H1-A2 | Credential Issuance Pipeline (automated) | Validate → sign → store credential + chain event |
| H1-B1 | Hysteresis Full Integration | Active states drive under-served list UI (pipeline connecting) |
| H1-B2 | Under-Served UI Badge + Explanation Link | Adds context tooltip linking methodology section |
| H1-B3 | Equity Anomaly Detector (delta threshold 0.03) | Logs anomaly events (internal) |
| H1-D1 | Expanded Meta Validators (10+ event types) | Add equity/trust/feedback meta sub-schema validations |
| H1-D2 | KPI Dashboard v1 (Hero, Equity, Feedback, Trust) | Basic aggregated metrics & weekly trend panel |
| H1-E1 | PII Salt Rotation Cron + Stats Logging | Automatic daily key rotation & retention enforcement |
| H1-E2 | Privacy FAQ Published (abridged excerpt) | Public page with simplified PII detection description |
| H1-C1 | Policy-as-Code (Terminology Usage Lint) | Scans content tokens usage & adoption percent updates |
| H1-F1 | Terminology Adoption Scanner Implementation | Recomputes adoptionPercent → persists + surfaces internal |
| H1-G1 | Feedback Categorization Heuristic | Simple keyword & pattern mapping categories (governance, fairness, improvement, other) |
| H1-G2 | Monthly Roll-Up Pipeline (dry run) | Aggregates categories & PII incidence counts |
| H1-H1 | Performance Budget CI (LCP, TTFB, size budgets) | Fails build if thresholds exceeded |
| H1-H2 | Accessibility Automated Test Pass (axe, pa11y) | Reports route coverage + severity gating |
| H1-J1 | Updated /trust & /equity with final hysteresis narrative | Replace “Decision Pending” stub |
| H1-K1 | Chain Event Integrity Monitoring (alert mismatches) | Detect missing seq or hash divergence |
| H1-I1 | Revocation Empty Endpoint Deployed | Returns JSON list [] with schema |
| H1-I2 | Credential Viewer “0 revoked” label | Transparent placeholder |
| H1-L1 | Localization Key Scaffolding & Fallback | Keys present for disclaimers & hero labels |

### 4.2 Acceptance Criteria (Highlights)

- Hysteresis ACTIVE units match simulated state transitions (test dataset).
- KPI dashboard shows non-zero event ingestion for ≥80% canonical events.
- Performance budgets: p75 LCP ≤ defined (DEC-PERF-12), bundle size ≤ budget.
- Accessibility scan: no critical blocking issues (color contrast, focus).
- Adoption scanner calculates percent; matches manual count sample (≥95%).
- Revocation endpoint reachable (200 JSON schema valid).
- Policy-as-code denies commit introducing banned old term count > threshold.

### 4.3 Dependencies

| Deliverable | Depends On |
|-------------|-----------|
| H1-B1 | H0-B2 + snapshot job reliability |
| H1-D1 | Event collector stable |
| H1-C1 | Disclaimers lint & term token dictionary |
| H1-F1 | Terminology list (old/new term mapping) |
| H1-G1 | Feedback backend live |
| H1-H1 | Pre-render & metrics instrumentation |
| H1-K1 | Chain events volume established |
| H1-I2 | Credential schema revocation placeholder final |

### 4.4 Risks & Mitigation

| Risk | Mitigasi |
|------|----------|
| Anomaly detector FPs tinggi (noisy) | Introduce cool-down / min sample size |
| Performance regression from added instrumentation | Lazy load analytics script |
| Accessibility deficits >1 iteration | Create targeted remediation backlog items |
| Adoption scanner miscounts synonyms | Add alias mapping file |
| Feedback category misclassification (keyword naive) | Provide manual recoding option internal |

### 4.5 KPIs (End of H1 Targets)

| KPI | Target |
|-----|--------|
| Hero Module Interaction Coverage | ≥35% |
| Feedback Submission Rate / session | Baseline measured; improvement plan defined |
| Under-Served Churn Rate | <15% |
| Credential Verify Attempt Rate | ≥10% trust page views |
| PII Block Rate | <20% (after tuning) |
| Terminology Adoption Growth | +X% (set baseline; track slope) |
| Disclaimers Drift Attempts | 0 (all blocked) |
| Equity Anomaly Explanations Coverage | 100% anomaly events annotated internally |

---

## 5. HORIZON 2 (HARI 31–60) – GOVERNANCE DEPTH & EXPANSION

### 5.1 Deliverables

| ID | Deliverable | Description |
|----|-------------|-------------|
| H2-A1 | Key Rotation Procedure & Overlap Implementation | Add #keys-2 to DID, test dual verify |
| H2-A2 | Credential Expiration Policy Rollout (if DEC chooses) | Add expirationDate for new credentials |
| H2-B1 | Under-Served Stalled Recovery Internal Alert | Dashboard & email/slack trigger |
| H2-B2 | Fairness Audit Quarterly Template + Dry Run | Reconstruct last 30 days entry/exit timeline |
| H2-C1 | Lint Extension: Hype Language Detection (context near fairness) | Block adjectives marked high risk |
| H2-D1 | Event Sampling Decision & Configuration (impressions) | Introduce sampling if volume high |
| H2-D2 | Chain Anchor for Select Events (optional) | Add equity anomaly & fairness entry events |
| H2-E1 | Advanced PII Pattern (IBAN-like detection - optional) | Evaluate region relevance |
| H2-F1 | Stage 2 Terminology Readiness Assessment | Adoption ≥70%? generate report |
| H2-G1 | Feedback Monthly Automated Report Published (internal) | Markdown with classification metrics |
| H2-H1 | Performance Trend Report (30 day diff) | Budget compliance timeline |
| H2-H2 | Accessibility Manual Audit & External Reviewer | Independent verification sample |
| H2-I1 | Revocation Internal Playbook (simulation) | Simulate revocation event (manual) |
| H2-J1 | Changelog Excerpt Page Live (phase 1.5) | Public diffing metadata |
| H2-K1 | Risk Dashboard (PII block trend, fairness churn, disclaimers drift attempts) | Aggregated observability |
| H2-L1 | Localization Pilot Plan (English; content token verification only) | Non-production test subset |

### 5.2 Acceptance Criteria (Key)

- Key rotation: both keys verify overlapping period; old key removal scheduled.
- Quarterly audit template reconstructs under-served timeline with 100% consistency vs events.
- Stage 2 adoption report produced (even if threshold not met).
- Performance trend: No sustained regression >5% LCP.
- Hype lexicon lint catches seeded test adjectives (“revolutionary fairness engine”) blocking build.

### 5.3 Risks & Mitigation

| Risk | Mitigasi |
|------|----------|
| Key rotation mishandled → broken verify | Staged rollout & test both keys before removal |
| Sampling biases KPI interpretasi | Document weighting & apply expansion factors |
| Over-extension outside core fairness (feature creep) | Governance review gating new card proposals |
| Audit fatigue (documentation overhead) | Automate audit extraction from chain events |

---

## 6. HORIZON 3 (HARI 61–90) – MATURITY & EXTERNAL AUDIT READINESS

### 6.1 Deliverables

| ID | Deliverable | Description |
|----|-------------|-------------|
| H3-A1 | Verify CLI Hardening (multi-platform script + integrity cross-check) | Shell + Node examples |
| H3-A2 | CBOR/Compact Credential Feasibility Study | Performance vs JSON-LD |
| H3-B1 | Hysteresis Parameter Review Report | Data-driven analysis (adjust thresholds?) |
| H3-C1 | Governance Public Summary (DEC index page) | List all decisions & references |
| H3-D1 | Analytical Quality Tests (event mismatch detection) | Cross-check events vs snapshot counts |
| H3-E1 | PII Evasion Pattern Update (homoglyph injection tests) | Add pattern variants |
| H3-F1 | Stage 2 Transition Execution (if threshold met) | Update disclaimers & copy (if approved) |
| H3-G1 | Feedback Impact Classification (Actionability metric) | Internal scoring enhancement |
| H3-H1 | A11y Real User Review (participants with assistive tech) | Qualitative report |
| H3-I1 | Revocation Simulated Event & UI Behavior | Fake revoke + event chain + viewer update |
| H3-J1 | Public Fairness Methodology Evolution Note | Add hysteresis performance summary |
| H3-K1 | Incident Banner Infrastructure (inactive, tested) | Ability to display site-wide notice |
| H3-L1 | Localization PoC (English toggled internal) | Validate disclaimers translation equivalence |

### 6.2 Acceptance Criteria (Key)

- Verify CLI passes cross-platform reproducibility hash tests.
- Hysteresis review: documented churn stats & parameter decision (retain or adjust).
- Incident banner can deploy in <5 min with pre-defined message template.
- Accessibility real user test: No critical blocking; remediation backlog created.

---

## 7. POST-90 DAY (LONGER TERM EVOLUTION)

| Theme | Initiative | Pre-Condition | Risk |
|-------|-----------|---------------|------|
| Federation | Multi-issuer credential attestation | Stable single issuer period done | Complexity trust boundaries |
| Revocation Lifecycle | Live revocation events & viewer delta tracking | Simulated tests stable | Misinterpretation as punishment |
| Advanced Fairness | Variance, interquartile metrics, time-to-recovery stats | Enough historical snapshots | Over-complexity to users |
| Localized UX | Public dual-language (ID/EN) | i18n infrastructure stable | Drift semantics translation |
| Peer Audits | External verifying chain via published snapshots | Chain integrity proven 3 months | Resource overhead |
| Credential Format | CBOR-LD compression | CLI adoption baseline | Tools ecosystem immaturity |
| Public API Access | Rate-limited aggregated metrics API | Governance gating & policy | Abuse risk (scraping misuse) |
| Community Action | Ethical contribution micro guidance | Support page matured | Scope creep activism |
| Automated Revocation Triggers | Policy change detection & risk scoring | Revocation manual stable | False positives reputational risk |

---

## 8. DEPENDENCY GRAPH (SIMPLIFIED)

```text
Credential Schema -> Signer -> Chain -> Verify CLI -> Key Rotation -> Revocation Simulation -> Multi-Issuer
Equity Snapshot -> Hysteresis Engine -> Under-Served UI -> Anomaly Detector -> Quarterly Audit -> Parameter Review
Event Schema -> Event Collector -> KPI Dashboard -> Sampling -> Analytical Quality Tests
Disclaimers Master -> Lint Tool -> Copy Stability -> Localization
PII Patterns -> Runtime Scanner -> Salt Rotation -> Evasion Update
Terminology Scanner -> Adoption Metrics -> Stage 2 Transition
```

---

## 9. RISK REGISTER DELTA (ROADMAP-SPECIFIC AUGMENT)

| ID | Risk | Phase Likely | Impact | Mitigation |
|----|------|--------------|--------|-----------|
| RR-TRUST-01 | Launch trust claims before chain ready | H0 | High | Strict go/no-go checklist |
| RR-FAIR-02 | Hysteresis mis-parameter → high false negatives | H1 | Medium | 30-day review & synthetic tests |
| RR-INST-03 | Event volume > infra capacity (no sampling) | H1 | Medium | Implement sampling after baseline |
| RR-PRIV-04 | PII detection evasion via homoglyph | H3 | Medium | Homoglyph normalization v2 |
| RR-GOV-05 | Decision log omission (manual oversight) | H0–H1 | Medium | Lint scanning for missing DEC reference tags |
| RR-PERF-06 | LCP regression due to new analytics script | H1 | Medium | Async defer + bundle size budget |
| RR-A11Y-07 | Accessibility debt accumulates | H1–H2 | Medium | A11y gating in CI + real user test H3 |
| RR-REV-08 | Revocation introduced prematurely (confusion) | H2 | Medium | Simulated tests & clear disclaimers |
| RR-LOC-09 | Translation semantic drift fairness | H3+ | Medium | Canonical bilingual disclaimers review |
| RR-FED-10 | Multi-issuer fragmentation trust anchor | Post-90 | High | Governance federation policy doc first |

---

## 10. GOVERNANCE & DECISION LOG MANAGEMENT

### 10.1 DEC File Naming

Pattern: `DEC-YYYYMMDD-XX.md`  
Fields:

```yaml
id: DEC-20250812-01
title: Adopt Credential Schema v1.0
class: CIC-C
summary: Formal adoption of credential schema spec cred-schema-v1.0
impacted_components: [credential, signer, chain]
hash_of_spec: <sha256>
vote: unanimous|split (detail)
rationale: ...
```

### 10.2 Automation Idea

- Lint detects new spec file hash difference without DEC referencing commit → FAIL.
- Maintain `dec-index.json` for quick mapping ID → hash & impacted components.
- Chain events include DEC ID for major method changes (type=DEC_REFERENCE).

---

## 11. POLICY-AS-CODE EXPANSIONS (PLANNED)

| Policy | Phase | Description | Enforcement Type |
|--------|-------|-------------|------------------|
| aggregation.min_cell_threshold | H0 | Deny if cell < threshold | Hard deny |
| disclaimers.presence | H0 | Deny build deploy if missing IDs | Hard deny |
| credential.field.prohibited | H0 | Lint for banned fields | Hard deny |
| fairness.hysteresis.params.lock | H1 | Warn if code params differ from DEC | Warning (error if mismatch persists) |
| terminology.usage.threshold | H1 | Warn if adoption < previous 7-day average (no penalty) | Warning |
| equity.delta.anomaly | H1 | Log event if delta > threshold | Observational |
| revocation.add.code | H2 | Deny adding new reason code w/out DEC | Hard deny |
| sampling.policy.change | H2 | Deny enabling sampling w/out DEC | Hard deny |

---

## 12. KEY METRICS & TARGETS MATRIX

| Metric | Definition | Baseline (Expected) | Target Evolution |
|--------|------------|---------------------|------------------|
| Hero Module Interaction Coverage | Sessions with hero CTA / total landing sessions | ~30–35% | ≥40% after UX refinement |
| Under-Served Churn Rate | Re-entry churn | <15% | Maintain |
| Credential Verify Attempt Rate | verify clicks / trust view | 5–10% | ≥12% (indicates engaged skepticism) |
| PII Block Rate | blocked / (blocked+submitted) | <25% | Trend downward (<15%) through UX education |
| Adoption Percent (Terminology) | new-term tokens / total dual-term tokens | 42% start | 70% Stage 2 readiness |
| Fairness Anomaly Coverage | anomalies annotated / anomalies total | 0 initial | 100% by H1 end |
| Disclaimers Drift Attempts | blocked drift attempts build | 0 | Keep 0 |
| Performance p75 LCP | ms | TBD | ≤2.2s sustained |
| Accessibility Violations (critical) | axe critical count per build | Baseline scan | 0 sustained |
| Feedback Actionability Ratio (future) | actionable / total | N/A H0 | Define baseline H2 |

---

## 13. BACKLOG → ROADMAP MAPPING TABLE (TRACEABILITY)

| Backlog ID (Earlier) | Roadmap Deliverable | Phase |
|----------------------|---------------------|-------|
| UX-HERO-01 | Already done (dummy hero) | Pre-H0 |
| UX-HERO-02 | Disclaimers lint ties in (C1) | H0 |
| UX-HERO-03 | Event collector ingestion | H0 |
| UX-HERO-04 | A11y automated scan | H1 |
| UX-HERO-05 | Governance snapshot dynamic feed (GoV card) | H1 |
| UX-HERO-06 | Hysteresis implement (Option F) | H1 |
| UX-HERO-07 | Disclaimers presence integration test | H0 |
| UX-HERO-08 | Translation key scaffolding | H1 |
| Additional: PII scanner | H0-E1 | H0 |
| Policy-as-Code | H0-C2 | H0 |
| Verify CLI doc | H0-A4 | H0 |
| Revocation placeholder UI | H1-I2 | H1 |

---

## 14. RESOURCE & CAPACITY CONSIDERATIONS

| Role | Critical Phase Load | Notes |
|------|---------------------|-------|
| Engineering (Backend) | H0–H1 heavy (Signer, Chain, Snapshot, Collector) | Avoid distraction with future revocation features early |
| Data Engineering | H0–H1 (Snapshot, Hysteresis) | After equity stable → anomaly & audit |
| Privacy Lead | H0 (PII), H1 (Salt rotation), H3 (Evasion update) | Provide test corpus early |
| UX Writer | H0 (Method placeholder), H1 (Hysteresis final copy), H2 (Audit narratives) | Align disclaimers consistency |
| Governance | Day 1 DEC approvals + monthly reviews | Automate DEC index updates |
| Analytics | H0 (Basic queries), H1 (Dashboard), H2 (Risk dashboard) | Ensure pipeline reliability |
| A11y Specialist | H1 (automated scan results), H3 (real user test) | Provide remediation guidelines |

---

## 15. COMMUNICATION PLAN

| Audience | Cadence | Content |
|----------|---------|---------|
| Internal Core Team | Daily async standup | Doing / Blocked / Next (3 bullets) |
| Governance Board | Weekly | DEC statuses, risk changes, fairness anomalies |
| Ethics / Privacy | Bi-weekly | PII metrics, blocked attempts, drift attempts |
| Engineering | Twice weekly sync | Implementation progress & obstacles |
| Stakeholder External (when needed) | Milestone-based | Announce hero & methodology updates post stabilization |
| Post-Launch Users (Public) | Changelog entry (phase 1.5) | Hero constellation introduction, disclaimers reaffirmation |

---

## 16. GO / NO-GO GATES

| Gate | Criteria | Phase |
|------|----------|-------|
| Gate 1 – Public Soft Launch | Signer + chain active, disclaimers lint enforced, PII scanner operational, hysteresis implemented (Option F), event collector reliability >98% ingestion success | End H1 |
| Gate 2 – Expanded Transparency | Changelog excerpt live, anomaly detector stable, adoption scanner operational, accessibility automated pass | Mid H2 |
| Gate 3 – Stage 2 Terminology | Adoption ≥70%, DEC Stage 2 vote, disclaimers updated | H2/H3 |
| Gate 4 – External Audit Prep | Quarterly fairness audit template complete, verify CLI hardened, key rotation executed | H3 |
| Gate 5 – Federation Exploration | All previous gates + revocation simulation passed + incident infra tested | Post H3 |

---

## 17. QUALITY ASSURANCE MATRICES

### 17.1 Regression Test Coverage Targets

| Area | Target Coverage |
|------|-----------------|
| Credential serialization & signature verify | ≥95% logic paths |
| Hysteresis state transitions | ≥90% transitions |
| PII pattern detection | 100% high-risk categories test cases |
| Event schema validation | ≥90% event types with meta schema tests |
| Lint disclaimers | All required scenarios (TC01–TC10) |
| Policy-as-code | All deny cases + at least 2 pass cases per policy |

### 17.2 Negative Testing Examples

| Area | Negative Case | Expected |
|------|---------------|----------|
| Chain Append | Wrong prevHash | Reject 400 |
| Credential Verify | Tampered name field | Signature invalid |
| Hysteresis | Snapshot invalid flagged | Ignored in state update |
| PII | Homoglyph email `user＠domain.com` (fullwidth @) | Normalized & detected |
| Event | Unregistered event_name | Reject + log |
| Lint | D1 text truncated removing “bukan ranking” | Drift error |
| Policy | Aggregation threshold violation (cell=3 <5) | Deny publish |

---

## 18. DOCUMENTATION & TRACEABILITY BINDINGS

| Spec Element | Roadmap Section Reference |
|--------------|---------------------------|
| Credential Schema v1.0 | H0-A1/A2, H1-A2, H2-A1 |
| Hysteresis Options Pack | H0-B2, H1-B1, H3-B1 |
| Event Schema v1.0 | H0-D1/D2, H1-D1, H2-D1 |
| Disclaimers Lint v1.0 | H0-C1, H1-C1 |
| PII Pattern Library v1.0 | H0-E1/E2, H1-E1, H2-E1 |
| Master Spec v2.0 (Hero) | H0-H1 pre-render, cross-phase UI continuity |

---

## 19. CHANGE MANAGEMENT PROCESS

| Step | Action |
|------|--------|
| 1 | Propose spec delta (PR referencing doc & rationale) |
| 2 | Run lint & policy gate (ensures disclaimers & prohibited changes flagged) |
| 3 | Governance review (DEC issuance if accepted) |
| 4 | Merge & tag version (spec version bump & pipeline_hash updated) |
| 5 | Chain anchor DEC event (optional future) |
| 6 | Public methodology note update (if fairness/integrity impacting) |

---

## 20. MONITORING & ALERT THRESHOLDS

| Alert Name | Condition | Severity |
|------------|-----------|----------|
| Missing Snapshot Alert | No equity snapshot >26h | High |
| Event Ingestion Drop | Ingestion success <95% hourly | High |
| Hysteresis State Spike | New ACTIVE entries >2x 7-day avg | Medium |
| PII Block Surge | Block rate >30% day | Medium |
| Lint Drift Attempt | >2 drift errors in single PR | Medium |
| Chain Integrity Mismatch | prevHash mismatch detection | High |
| Performance Regression | p75 LCP > (budget + 15%) 2 days | Medium |
| Accessibility New Critical | new critical issue appears | High |
| Anomaly Unannotated | anomaly event missing annotation >24h | Medium |

---

## 21. SECURITY & PRIVACY SPECIFIC ROADMAP POINTS

| Phase | Focus | Detail |
|-------|-------|--------|
| H0 | Core detection & no raw PII persistence | Implement scanning & hashed storage |
| H1 | Salt rotation & privacy FAQ | Automated rotation + user transparency |
| H2 | Evasion patterns & advanced categories | IBAN-like & homoglyph evaluation |
| H3 | Privacy audit & external readiness | Audit log verifying block decisions |

---

## 22. EDUCATION & USER COMPREHENSION

| Artifact | Phase | Goal |
|----------|-------|------|
| Hysteresis Methodology Explainer | H1 | Clarify non-ranking fairness |
| Privacy FAQ | H1 | Encourage no PII submission |
| Fairness Audit Summary (Internal) | H2 | Prepare external communication shapes |
| Hero Non-Ranking Tooltip (conditional) | H2 | If confusion >5% |

---

## 23. CONTINGENCY PLANS

| Scenario | Contingency |
|----------|-------------|
| Signer Delay >3 days | Shift H0 tasks aside, do not expose credential UI as “Verified” (fallback label “Pending cryptographic activation”) |
| Equity Snapshot Failure Day(s) | Mark snapshot invalid, freeze previous values with disclaimer “Stale” |
| High FP PII ( >10% flagged benign ) | Temporarily relax multi_category_block_threshold from 2→3 & publish internal note |
| Hysteresis Over-Flagging ( >40% units ) | Temporary raise T_enter_standard to 0.58 (DEC quick) & annotate |
| Performance Regression | Defer non-critical scripts (e.g., anomaly inspector UI) until budget regained |

---

## 24. ISSUES & TASK SUGGESTED (TO BE OPENED)

(Sample list – create as GitHub issues mapped to phases; not removing any prior commitments.)

| Phase | Title (Suggested Issue) | Track |
|-------|------------------------|-------|
| H0 | Implement Ed25519 signer service MVP | A |
| H0 | Build credential canonical hash test vector generator | A |
| H0 | Hash chain minimal append & verify endpoints | A |
| H0 | Equity snapshot script initial implementation | B |
| H0 | Hysteresis Option F state machine (logging only) | B |
| H0 | Disclaimers lint CI integration | C |
| H0 | Policy-as-code aggregation threshold OPA rule | C |
| H0 | Event collector base ingestion & validation | D |
| H0 | PII scanner runtime & redaction layer | E |
| H0 | Feedback storage schema + API write path | G |
| H0 | Verify CLI doc draft | A |
| H1 | Hysteresis integration with equity UI | B |
| H1 | KPI dashboard v1 queries | D |
| H1 | Terminology adoption scanner | F |
| H1 | Performance budget CI guard | H |
| H1 | Accessibility automated scan integration | H |
| H1 | Revocation empty endpoint exposure | I |
| H1 | Policy-as-code terminology usage lint rule | C |
| H2 | Key rotation procedure & dual key support | A |
| H2 | Under-served stalled recovery alert | B |
| H2 | Anomaly events chain anchoring | D/K |
| H2 | Changelog excerpt page build | J |
| H2 | Hype lexicon lint extension | C |
| H2 | Risk dashboard aggregation pipeline | K |
| H3 | Verify CLI hardening multi-platform | A |
| H3 | Hysteresis parameter review report | B |
| H3 | Incident banner infrastructure | K |
| H3 | Revocation simulation scenario | I |
| H3 | Fairness methodology evolution public note | J |
| Post-90 | Multi-issuer design proposal | L |
| Post-90 | Federation governance spec | L |

---

## 25. MASTER CHECKLIST (ROLLING)

| Item | Phase Target | Status |
|------|--------------|--------|
| DEC approvals initial (H0 set) | H0 | Pending |
| Signer + chain live | H0 | Pending |
| Equity snapshot + hysteresis implemented | H1 | Pending |
| Event ingestion baseline stable | H1 | Pending |
| Disclaimers lint enforced CI | H0 | Pending |
| PII detection live & metrics | H0 | Pending |
| Policy-as-code min cell threshold gate | H0 | Pending |
| KPI dashboard v1 | H1 | Pending |
| Adoption scanner operational | H1 | Pending |
| Revocation placeholder UI | H1 | Pending |
| Key rotation (dual key) | H2 | Pending |
| Changelog excerpt public | H2 | Pending |
| Fairness audit template | H2 | Pending |
| Verify CLI hardened | H3 | Pending |
| Stage 2 transition (if threshold) | H3 | Pending |

---

## 26. STATUS LABEL DEFINITIONS

| Label | Meaning |
|-------|--------|
| Pending | Belum mulai / menunggu DEC |
| In Progress | Pengerjaan aktif |
| Blocked | Tergantung deliverable lain / keputusan |
| Complete | Acceptance criteria terpenuhi |
| Review | Menunggu governance / QA |
| Deferred | Dipindahkan ke fase selanjutnya dengan alasan dicatat |

---

## 27. VERSIONING (ROADMAP DOC)

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2025-08-12 | Initial aggregated roadmap master |

---

## 28. SUMMARY (ONE SENTENCE)

“Roadmap ini mengorkestrasi konversi blueprint integritas & fairness menjadi sistem verifiable berlapis—dengan trust primitives, hysteresis stabil, lint governance, privasi protektif, instrumentation observability, dan jalur skalabilitas federatif—tanpa menghapus satu pun prinsip atau rencana terdahulu.”

---

## 29. NEXT USER ACTION PROMPTS

Pilih langkah lanjut:

- “KEPUTUSAN: Opsi F hysteresis (0.50/0.60/0.65 cooldown=1 stalled=5) disetujui.”
- “LANJUTKAN: DEC templates”
- “LANJUTKAN: Verify CLI doc”
- “LANJUTKAN: Policy-as-code min cell threshold draft”
- “LANJUTKAN: Equity snapshot pseudocode”

Saya siap melanjutkan tanpa menghapus konteks apapun.

(End of Roadmap & Milestones Master v1.0)

---

## APPENDIX A — Portal Panti Orientation (Verbatim, Non-Redacted)

This appendix embeds the full text of the Portal Panti orientation documents for roadmap traceability. Do not edit here; edit the source docs and re-sync.

### A.1 Pernyataan Orientasi Produk: Portal Panti Asuhan

```markdown
# Pernyataan Orientasi Produk: Portal Panti Asuhan

Tujuan (LEBIH KOMPREHENSIF LAGI)
- Menyediakan direktori publik panti asuhan (contoh: wilayah Bandung) agar pengurus panti mudah ditemukan masyarakat.
- Memfasilitasi transparansi institusional yang aman (info lembaga, dokumen legal publik bila ada, tautan situs panti).
- Menjaga keselamatan dan martabat anak serta kepatuhan privasi.

Non-Tujuan (LEBIH KOMPREHENSIF LAGI)
- Tidak memberi peringkat/penilaian “baik/buruk”.
- Tidak memuat data pribadi anak/pengasuh, foto yang mengidentifikasi anak, atau jadwal anak.
- Tidak mengaitkan profil panti dengan label “under‑served” sebagai klaim perbandingan.

Prinsip Produk (UTAMANYA KEPENTINGAN TERBAIK PENGURUS)
- Kepentingan terbaik anak (UNCRC Pasal 3; UU Perlindungan Anak).
- Privasi by design (UU PDP; GDPR Recital 38 untuk anak sebagai pembanding).
- Akses informasi publik secara proporsional (UU KIP) dengan pengecualian yang dilindungi.
- Aksesibilitas dan keterbacaan (UU 8/2016; WCAG 2.1/2.2).
- Transparansi tanpa hiperbola; bahasa netral dan anti‑stigma.

Audiens Utama
- Pengurus panti asuhan (pemilik profil).
- Masyarakat umum (pencari informasi resmi).
- Komunitas/LSM (pengguna data agregat non‑sensitif).

Hubungan dengan Modul Lain
- Modul “Portal Panti” berdiri terpisah dari modul kebijakan/analitik lain.
- Integrasi lintas modul dilakukan melalui tautan dan ringkasan netral.

Rujukan
- UNCRC (Pasal 2, 3, 16, 17); UU Perlindungan Anak; UU PDP; UU KIP; UU 8/2016; WCAG 2.1/2.2; Perpres 39/2019; Open Data Charter.
```

### A.2 Ruang Lingkup Produk: Portal Panti Asuhan

```markdown
# Ruang Lingkup Produk: Portal Panti Asuhan

## Sasaran

- Visibilitas panti asuhan yang terverifikasi.
- Transparansi institusional yang aman dan mudah dipahami.
- Database internal panti (hanya admin panti yang bisa login, dengan domain terpisah agar aman, atau cara lain yang tidak kompleks namun sangat aman)

## Cakupan (LEBIH KOMPREHENSIF LAGI)

- Wilayah awal: Bandung (dapat diperluas kemudian).
- Entitas: lembaga panti (bukan individu).
- Konten: profil institusi, tautan resmi, dokumen publik (jika ada), status verifikasi dan tanggalnya.

## Batasan (LEBIH KOMPREHENSIF LAGI)

- Tidak menampilkan data/visual yang dapat mengidentifikasi anak.
- Lokasi presisi (alamat/koordinat) hanya opt‑in eksplisit dari pengurus.
- Tidak ada peringkat, skor, atau klaim komparatif antar panti.

## Peran (LEBIH KOMPREHENSIF LAGI)

- Pengurus panti: mendaftar/mengklaim profil, mengelola konten, mengajukan pembaruan.
- Admin verifikasi: memeriksa legitimasi dasar, menyetel status “terverifikasi”.
- Publik/komunitas: menelusuri profil, mengakses informasi resmi, melaporkan konten bermasalah.

## Artefak Publik (LEBIH BAIK LAGI)

- Halaman profil panti (informasi minimal aman).
- Laman “About Portal Panti”.
- Tanda “Terverifikasi” + “Terakhir diverifikasi pada: YYYY‑MM‑DD”.
- Changelog pembaruan profil (ringkas, non‑teknis).

## Rujukan

- UNCRC; UU PDP; UU KIP; UU 8/2016 & WCAG 2.1/2.2.
```

### A.3 Model Data Minimal Aman — Portal Panti

```markdown
# Model Data Minimal Aman — Portal Panti

## 1) Wajib (default aman) (LEBIH KOMPREHENSIF LAGI)

- nama_lembaga (string)
- wilayah_administratif (kecamatan, kota/kabupaten, provinsi)
- status_legal_publik (nomor izin/registrasi bila memang informasi publik)
- kontak_institusional (email resmi, telepon kantor)
- tautan_resmi (website panti, bila ada)
- tanggal_verifikasi (YYYY‑MM‑DD)
- sumber_verifikasi (deskripsi singkat)

## 2) Opsional — Opt‑in eksplisit (LEBIH KOMPREHENSIF LAGI)

- alamat_jalan (string)
- titik_peta_approx (centroid kecamatan/kota; presisi hanya bila disetujui tertulis)
- jam_kunjung (string)
- kanal_donasi_institusi (tautan resmi institusi)
- media_sosial_institusi (tautan)

## 3) Dilarang (tidak disimpan/ditampilkan)

- PII anak/pengasuh (nama, foto identifiable, tanggal lahir, kesehatan, dsb.)
- jadwal_kegiatan_anak
- data_kerentanan/medis
- koordinat_presisi tanpa persetujuan tertulis
- berkas yang menampilkan wajah anak tanpa redaksi

## Metadata & Jejak (LEBIH KOMPREHENSIF LAGI)

- id_profil (UUID)
- dibuat_pada / diubah_pada (timestamp)
- log_perubahan_ringkas (tanggal + field yang berubah)
- status_verifikasi (belum diverifikasi | terverifikasi | kadaluarsa)
- alasan_penolakan (jika ada)

## Pertimbangan Privasi/Akses

- Default granularitas lokasi pada level kecamatan/kota.
- Dokumen legal hanya bila statusnya memang informasi publik.
- Portal hanya menautkan; tidak menyalin konten anak dari situs panti.

## Rujukan

- UU PDP (minimalisasi, purpose limitation), UNCRC Pasal 3/16, UU KIP.
```

### A.4 Tentang Portal Panti (ABOUT)

```markdown
# Tentang Portal Panti

## Apa ini

- Direktori publik panti asuhan yang menampilkan informasi lembaga dan tautan resmi, agar masyarakat mudah menemukan sumber informasi yang tepat.

## Apa yang ditampilkan

- Nama lembaga, wilayah administratif, kontak institusional, tautan resmi, dan status verifikasi beserta tanggalnya.
- Alamat lengkap dan titik peta presisi hanya jika pengurus menyetujuinya.

## Apa yang tidak ditampilkan

- Data pribadi anak/pengasuh, foto yang mengidentifikasi anak, jadwal kegiatan anak, atau informasi sensitif.

## Bagaimana verifikasi dilakukan

- Informasi diperiksa kelengkapannya. Bila tersedia, nomor/legalitas yang bersifat publik ditautkan.
- Tanggal dan sumber verifikasi ditampilkan.

## Bahasa & aksesibilitas

- Konten ditulis sederhana, dapat diakses di perangkat seluler, dan mengikuti pedoman aksesibilitas.

## Catatan penting

- Portal ini bukan sistem peringkat. Tidak ada skor/label membandingkan antar panti.
- Untuk perubahan informasi atau keberatan, pengurus dapat mengajukan pembaruan atau meminta peninjauan.

## Rujukan singkat

- UNCRC (perlindungan anak), UU PDP (privasi), UU KIP (akses informasi), UU 8/2016 & WCAG (aksesibilitas).
```

### A.5 Rubrik Audit Kesesuaian Orientasi — Portal Panti

```markdown
# Rubrik Audit Kesesuaian Orientasi — Portal Panti

## Dimensi Audit

### 1) Struktur & Artefak

- Apakah terdapat dokumen Orientasi, Ruang Lingkup, Model Data, About di docs/?
- Apakah versi/penandaan waktu konsisten?

### 2) Konten & Bahasa

- Apakah tidak ada klaim peringkat/hiperbola?
- Apakah pedoman anti‑stigma diterapkan?

### 3) Aksesibilitas

- Apakah halaman publik mengikuti prinsip WCAG?
- Apakah ada versi low‑bandwidth?

### 4) Tata Kelola & Jejak

- Apakah ada changelog non‑teknis untuk pembaruan profil/halaman?
- Apakah status verifikasi + tanggal ditampilkan?

### 5) Kepatuhan Kerangka

- Rujukan ke UNCRC, UU PDP, UU KIP, UU 8/2016/WCAG, Perpres 39/2019 tercermin dalam dokumen.
```

---

End of Appendix A.
