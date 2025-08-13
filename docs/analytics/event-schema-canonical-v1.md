# MerajutASA – Public Tier Event Schema Canonical Specification (v1.0)

Status: Draft for Ratification (CIC-A for instrumentation; CIC-E if semantic meaning of core fields changes)  
Prepared: 2025-08-12  
Related Docs: Master Spec v2.0 (Sections 21, 27, 37), Integrity & Fairness Specs, Hysteresis Options Decision Pack  
NON-DESTRUCTIVE: Dokumen ini MENAMBAHKAN detail; tidak menghapus strategi atau definisi sebelumnya.

> Tujuan  
Menyediakan skema formal, kontrak semantik, versioning, lint rules, dan contoh implementasi untuk seluruh event publik (landing & multi-page), termasuk hero constellation, equity, trust audit, feedback, terminology adoption, dll. Memastikan:  

- Konsistensi: setiap event memiliki struktur inti identik.  
- Privasi: tidak ada PII, tidak ada data anak, tidak ada fingerprinting agresif.  
- Observability: mendukung analitik KPI & fairness governance tanpa melanggar prinsip non-ranking.  
- Evolvabilitas: versioning & extension path jelas; backward compatibility dijaga.  

---

## 1. PRINCIPLES MAPPING

| Principle | Event Schema Refleksi |
|-----------|-----------------------|
| GP1 Privacy-by-Architecture | Tidak menyertakan user agent fingerprint detail; sesi ephemeral; no PII fields. |
| GP2 Executable Governance | Schema version & governanceAction id optional untuk event policy changes. |
| GP5 Transparency | Publik dapat melihat definisi event (dokumentasi ini) – bukan black box. |
| GP6 Outcome Honesty | Tidak ada event yang mengimplikasikan performa kualitas (misal “top_unit_click”). |
| GP9 Non-Ranking Fairness | Under-served events menandai interaksi, bukan ranking order. |
| GP10 Observability | Complete metadata & integrityHash (internal) memungkinkan audit pipeline. |

---

## 2. SCOPE & NON-SCOPE

IN-SCOPE:

- Public UX interactions (landing hero, cards, navigation, equity, trust, registry, terminology, feedback form).
- Hysteresis internal event bridging (enter/exit under-served) – flagged internal group subset.
- Schema for event ingestion: `v1`.
- Validation JSON Schema + semantic rules + prohibited fields.

OUT-OF-SCOPE:

- Authenticated dashboards (future doc).
- Backend internal metrics (ETL runtime, DB latency).
- PII capture (strictly prohibited).
- Real-time chat (not in product scope).

---

## 3. CORE SCHEMA OVERVIEW

Root required fields (all events): <!-- hype-lint-ignore-line -->

| Field | Type | Req | Description |
|-------|------|-----|-------------|
| schema_version | string | Yes | Semantic version of event schema (major.minor, e.g. "1.0") |
| event_name | string | Yes | Canonical snake_case identifier |
| event_id | string (UUIDv4) | Yes | Unique per emission |
| occurred_at | string (ISO 8601 UTC) | Yes | Event timestamp (client or server normalized) |
| received_at | string (ISO 8601 UTC) | Yes | Ingestion timestamp (server) |
| session_id | string (UUIDv4) | Yes | Ephemeral session reference |
| user_type | string | Yes | "public_anonymous" |
| page | string | Yes | Logical page slug (e.g. "landing","equity","trust","unit_profile") |
| referrer | string | Optional | URL or internal slug; sanitized |
| user_agent_class | string | Optional | Simplified: "desktop","mobile","tablet","bot_suspect" |
| locale | string | Optional | "id-ID" default; future i18n |
| meta | object | Optional | Event-specific attributes |
| integrity | object | Yes | Hash & pipeline context (internal only fields allowed) |
| privacy | object | Yes | Flags confirming scrub operations |
| sampling | object | Optional | If partial sampling applied |
| source | string | Yes | "web_public" (channel identifier) |

Notes: Additional root-level keys beyond allowed must be rejected (strict mode). <!-- hype-lint-ignore-line -->

---

## 4. EVENT NAME TAXONOMY (CURRENT SET v1.0)

Category: Landing / Hero

- pub_landing_impression
- pub_hero_card_impression
- pub_hero_card_cta_click
- pub_hero_card_focus
- pub_hero_pill_click
- pub_hero_rotator_change
- pub_hero_metric_hover

Category: Navigation & Discovery

- pub_nav_link_click
- pub_registry_filter_used
- pub_registry_unit_view
- pub_unit_profile_view

Category: Equity & Fairness

- pub_equity_view
- pub_equity_bucket_info_open
- pub_equity_under_served_click
- pub_equity_trend_tooltip_open
(Internal fairness events – not public ingestion; flagged separately)
- sys_fairness_under_served_enter
- sys_fairness_under_served_exit

Category: Trust & Governance

- pub_trust_view
- pub_trust_metric_tooltip_open
- pub_hash_verify_click
- pub_credential_copy
- pub_governance_section_view

Category: Terminology Transition

- pub_terminology_page_view
- pub_terminology_banner_click
- pub_terminology_glossary_term_expand

Category: Media & Digest

- pub_media_digest_view
- pub_media_citation_copy

Category: Feedback & Participation

- pub_feedback_form_open
- pub_feedback_submit
- pub_feedback_block_pii (sanitized; no raw snippet)
- pub_feedback_category_select

Category: Error & Edge Displays

- pub_error_equity_no_data
- pub_error_registry_fetch
- pub_placeholder_snapshot_loading

Category: Performance / Resilience (optional lightweight)

- pub_perf_lcp_bucket
- pub_perf_first_input_delay_bucket

(Non-user facing internal instrumentation prefixes `sys_` reserved.)

---

## 5. META FIELDS BY EVENT

Each event may specify meta object keys. Required meta keys per event:

| event_name | Required meta keys | Optional meta keys | Constraints |
|------------|--------------------|--------------------|-------------|
| pub_hero_card_impression | card_id | classification (for equity card), adoption_stage (terminology), position_index | card_id ∈ {C1..C7} |
| pub_hero_card_cta_click | card_id | classification | Same card_id domain |
| pub_hero_pill_click | pill_id |  | pill_id ∈ {registry,equity,credential,method,terminology,feedback} |
| pub_hero_rotator_change | rot_index | previous_index | rot_index integer ≥0 |
| pub_registry_filter_used | filters_applied (object) | result_count | Each filter key enumerated |
| pub_registry_unit_view | unit_id | verification_status | unit_id UUID pattern |
| pub_unit_profile_view | unit_id | verification_status |  |
| pub_equity_view | snapshot_id | equity_index, bucket_low, bucket_mid, bucket_high | equity_index 0..1 float(2dp) |
| pub_equity_bucket_info_open | bucket_name | bucket_count | bucket_name ∈ {low,mid,high} |
| pub_equity_under_served_click | unit_id | entry_reason (severe/consecutive), ratio | ratio 0..1 |
| pub_trust_metric_tooltip_open | metric_id |  | metric_id ∈ {coverage,verified_percent,equity_index,incident_free_days} |
| pub_hash_verify_click | result | attempt_latency_ms | result ∈ {pass,fail,error} |
| pub_credential_copy | unit_id |  |  |
| pub_media_digest_view | digest_month | equity_index, coverage_percent | digest_month YYYY-MM |
| pub_feedback_form_open |  | prior_interactions_count |  |
| pub_feedback_submit | category | contains_pii (bool), length | category enumerated |
| pub_feedback_block_pii | pattern_type |  | pattern_type enumerated (NIK,name,freeform) |
| pub_terminology_page_view | stage | adoption_percent | stage enumerated |
| pub_terminology_banner_click | stage |  |  |
| pub_terminology_glossary_term_expand | term_id | stage | term_id slug |
| pub_error_equity_no_data |  | snapshot_id |  |
| pub_perf_lcp_bucket | bucket | value_ms | bucket enumerated |
| sys_fairness_under_served_enter | unit_id, reason | ratio | internal only |
| sys_fairness_under_served_exit | unit_id | ratio | internal only |

---

## 6. CORE FIELD SPECS

### 6.1 session_id

- UUIDv4; rotated when browser storage cleared; lifetime max 24h; no cross-site correlation.
- If user blocks storage, fallback ephemeral random; still conform to UUID format.

### 6.2 user_type

- Always `public_anonymous` for current scope.
- Future reserved: `internal_observer`, `governance_audit` (NOT to be confused with authentication).

### 6.3 integrity object

| Field | Type | Description |
|-------|------|-------------|
| pipeline_hash | string | Hash of canonical schema file version currently enforced |
| event_hash | string | `sha256` of normalized event payload minus integrity, proof fields |
| chain_anchor | string (optional future) | ID if event hashed into chain batch |
| schema_version_ack | string | Mirrors schema_version for redundancy |

### 6.4 privacy object

| Field | Type | Description |
|-------|------|-------------|
| pii_scan_performed | boolean | Always true for events with free text (feedback) else false |
| pii_detected | boolean | Only true for block event (pub_feedback_block_pii) else false |
| raw_payload_scrubbed | boolean | Should always be true after ingestion pipeline normalization |

### 6.5 sampling object (optional)

| Field | Type | Description |
|-------|------|-------------|
| rate | number (0..1) | Effective sampling fraction |
| reason | string | E.g., "performance_reduction" |
| deterministic_key | string | Hash key base if deterministic sampling applied |

---

## 7. JSON SCHEMA (DRAFT 2020-12)

```json
{
  "$id": "https://schema.merajutasa.id/events/public-event-v1.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "PublicEventV1",
  "type": "object",
  "required": [
    "schema_version","event_name","event_id","occurred_at","received_at",
    "session_id","user_type","page","source","integrity","privacy"
  ],
  "additionalProperties": false,
  "properties": {
    "schema_version": { "type":"string", "pattern":"^1\\.0(\\.\\d+)?$" },
    "event_name": {
      "type":"string",
      "pattern":"^(pub|sys)_[a-z0-9_]+$"
    },
    "event_id": { "type":"string","pattern":"^[0-9a-fA-F-]{36}$" },
    "occurred_at": { "type":"string","format":"date-time" },
    "received_at": { "type":"string","format":"date-time" },
    "session_id": { "type":"string","pattern":"^[0-9a-fA-F-]{36}$" },
    "user_type": { "type":"string","enum":["public_anonymous","internal_observer","governance_audit"] },
    "page": { "type":"string","pattern":"^(landing|registry|unit_profile|equity|trust|media_digest|terminology|feedback|governance|about|faq)$" },
    "referrer": { "type":"string","maxLength":512 },
    "user_agent_class": { "type":"string","enum":["desktop","mobile","tablet","bot_suspect"] },
    "locale": { "type":"string","pattern":"^[a-z]{2}-[A-Z]{2}$","default":"id-ID" },
    "meta": { "type":"object","additionalProperties": true },
    "integrity": {
      "type":"object",
      "required":["pipeline_hash","event_hash","schema_version_ack"],
      "properties":{
        "pipeline_hash":{"type":"string","pattern":"^[a-f0-9]{16,64}$"},
        "event_hash":{"type":"string","pattern":"^[a-f0-9]{64}$"},
        "chain_anchor":{"type":"string"},
        "schema_version_ack":{"type":"string","pattern":"^1\\.0(\\.\\d+)?$"}
      },
      "additionalProperties": false
    },
    "privacy": {
      "type":"object",
      "required":["pii_scan_performed","pii_detected","raw_payload_scrubbed"],
      "properties":{
        "pii_scan_performed":{"type":"boolean"},
        "pii_detected":{"type":"boolean"},
        "raw_payload_scrubbed":{"type":"boolean"}
      },
      "additionalProperties": false
    },
    "sampling": {
      "type":"object",
      "required":["rate","reason"],
      "properties":{
        "rate":{"type":"number","minimum":0,"maximum":1},
        "reason":{"type":"string"},
        "deterministic_key":{"type":"string"}
      },
      "additionalProperties": false
    },
    "source": { "type":"string","enum":["web_public"] }
  }
}
```

---

## 8. META SUB-SCHEMAS (PER EVENT) – INFORMATIVE

We DO NOT enforce full meta polymorphism in single JSON Schema (complex). Instead: second-tier validator selects sub-schema based on `event_name`.

Example (pub_hero_card_cta_click meta):

```json
{
  "$id":"https://schema.merajutasa.id/events/meta/pub_hero_card_cta_click.json",
  "type":"object",
  "required":["card_id"],
  "properties":{
    "card_id":{"type":"string","pattern":"^C[1-7]$"},
    "classification":{"type":"string","enum":["Healthy","Monitoring","Imbalance"]},
    "position_index":{"type":"integer","minimum":0,"maximum":6}
  },
  "additionalProperties": false
}
```

---

## 9. EVENT VERSIONING & RENUMBERING

- schema_version covers structural base (1.0.x patch for additive meta field optional).
- Adding new event_name: patch release 1.0.x.
- Removing event_name: minor release (1.1.0) + deprecation notice 30 days prior (not expected early).
- Changing semantics (meaning) of existing event: MINOR at least; require governance DEC entry.
- Changing mandatory meta keys: MINOR bump.

---

## 10. PRIVACY & ETHICS GUARDRAILS

| Rule | Enforcement |
|------|------------|
| No PII in meta.* | PII scanner run post-serialization dev side & ingestion pipeline |
| No freeform text except feedback-related events | meta objects for other events restrict to enumerated values |
| session_id rotates ≤24h, not reused cross-device | Client library TTL enforcement |
| No user fingerprint composition | user_agent_class coarse only, not raw UA string logged |
| Under-served ratio truncated ≤2 decimals | Avoid micro-tracking & gaming |
| unit_id allowed but no direct mapping to sensitive internal IDs beyond stable public URN | Pre-mapped safe identifier |

---

## 11. GOVERNANCE & CHANGE CONTROL

| Change Scenario | Class | Steps |
|-----------------|-------|-------|
| Add hero event | CIC-A | Update taxonomy + update docs + patch version |
| Add fairness internal sys_* | CIC-A (internal) | Mark internal only; exclude from public analytics deck |
| Modify threshold events (e.g., restructure under-served) | CIC-E | Provide methodology note |
| Add new metric event referencing new metric | CIC-E | Ethics evaluation if fairness related |
| Deprecate event | CIC-D | Deprecation note + fallback mapping |

---

## 12. INTEGRITY HASH COMPUTATION (event_hash)

1. Remove `integrity.event_hash` from object before hashing.
2. Stable key sort (JCS).
3. Hash algorithm: SHA-256; hex lower-case.
4. pipeline_hash is hash of concatenated schema_version + sorted event_name list + commit hash of schema file.

Rationale: tamper detection & schema drift spotting.

---

## 13. EXAMPLES

### 13.1 Hero Card CTA Click

```json
{
  "schema_version":"1.0",
  "event_name":"pub_hero_card_cta_click",
  "event_id":"9e9f2c6e-4b1b-4fd0-8201-9d9c9a7117ea",
  "occurred_at":"2025-08-12T03:02:11Z",
  "received_at":"2025-08-12T03:02:11Z",
  "session_id":"84f0de2b-92b6-4b9c-a8f2-c2a5a2e37cb3",
  "user_type":"public_anonymous",
  "page":"landing",
  "referrer":"",
  "user_agent_class":"desktop",
  "locale":"id-ID",
  "meta":{
    "card_id":"C2",
    "classification":"Monitoring",
    "position_index":1
  },
  "integrity":{
    "pipeline_hash":"a98b33c9d4e5f1aa",
    "event_hash":"7f7d8ee2a8b0461d9cb5339b5dcbf72f503d3f8590b3edcccf1e8955e224aa54",
    "schema_version_ack":"1.0"
  },
  "privacy":{
    "pii_scan_performed":false,
    "pii_detected":false,
    "raw_payload_scrubbed":true
  },
  "source":"web_public"
}
```

### 13.2 Equity Under-Served Click

```json
{
  "schema_version":"1.0",
  "event_name":"pub_equity_under_served_click",
  "event_id":"3dd94113-d9dd-435f-8656-a400e75f6f0b",
  "occurred_at":"2025-08-12T03:11:55Z",
  "received_at":"2025-08-12T03:11:55Z",
  "session_id":"889ed1dd-4b60-43ce-bd35-34765dd90e31",
  "user_type":"public_anonymous",
  "page":"equity",
  "meta":{
    "unit_id":"urn:merajutasa:org:8b7d6d3d-7e91-4923-9e02-cc0d8acfe021",
    "entry_reason":"consecutive",
    "ratio":0.57
  },
  "integrity":{
    "pipeline_hash":"a98b33c9d4e5f1aa",
    "event_hash":"5c5aae2d3787256c14d3c998b3d6c52fb3f5989e4d9e1038ec88eb0e2b5d9474",
    "schema_version_ack":"1.0"
  },
  "privacy":{
    "pii_scan_performed":false,
    "pii_detected":false,
    "raw_payload_scrubbed":true
  },
  "source":"web_public"
}
```

### 13.3 Feedback Submit (PII Clean)

```json
{
  "schema_version":"1.0",
  "event_name":"pub_feedback_submit",
  "event_id":"7d9f6f0a-4a5f-4d3e-9b32-e2c58064ed51",
  "occurred_at":"2025-08-12T03:20:32Z",
  "received_at":"2025-08-12T03:20:32Z",
  "session_id":"4f9eecdd-6bf4-4d0f-9d71-3509a46bf7ff",
  "user_type":"public_anonymous",
  "page":"feedback",
  "meta":{
    "category":"governance",
    "contains_pii":false,
    "length":182
  },
  "integrity":{
    "pipeline_hash":"a98b33c9d4e5f1aa",
    "event_hash":"0a94e4f57a9a6afce959e47038fdbcfe30f4c985c4d1b8f9e7ff85480a4c2ce1",
    "schema_version_ack":"1.0"
  },
  "privacy":{
    "pii_scan_performed":true,
    "pii_detected":false,
    "raw_payload_scrubbed":true
  },
  "source":"web_public"
}
```

### 13.4 Feedback Block PII

```json
{
  "schema_version":"1.0",
  "event_name":"pub_feedback_block_pii",
  "event_id":"fa7bd8d2-2b1c-4ebc-a5c2-5cb7b695b1c2",
  "occurred_at":"2025-08-12T03:21:10Z",
  "received_at":"2025-08-12T03:21:10Z",
  "session_id":"4f9eecdd-6bf4-4d0f-9d71-3509a46bf7ff",
  "user_type":"public_anonymous",
  "page":"feedback",
  "meta":{
    "pattern_type":"NIK"
  },
  "integrity":{
    "pipeline_hash":"a98b33c9d4e5f1aa",
    "event_hash":"41b702f1c6ab2a8e6d07b8b5d7d562d4be46e0e929414516725e2153fde2c8ab",
    "schema_version_ack":"1.0"
  },
  "privacy":{
    "pii_scan_performed":true,
    "pii_detected":true,
    "raw_payload_scrubbed":true
  },
  "source":"web_public"
}
```

---

## 14. DERIVED METRICS FORMULAS

| Derived Metric | Formula | Notes |
|----------------|---------|-------|
| Landing→Registry CTR | count(pub_landing_impression where same session) / count(pub_hero_pill_click pill_id=registry) (or reversed depending def) | Decide numerator denominator stable early |
| Hero Module Interaction Coverage | sessions with ≥1 (pub_hero_card_cta_click OR pub_hero_pill_click) / total landing sessions | KPI added v2 |
| Under-Served Engagement Rate | pub_equity_under_served_click / pub_equity_view | Interpret fairness activation |
| Credential Verify Attempt Rate | pub_hash_verify_click / pub_trust_view | Skeptic conversion |
| Feedback Submission Rate | pub_feedback_submit / unique sessions | Participation |
| Tooltip Engagement Rate (Trust) | pub_trust_metric_tooltip_open / pub_trust_view | Depth of comprehension |
| PII Block Rate | pub_feedback_block_pii / (pub_feedback_submit + pub_feedback_block_pii) | Privacy risk monitoring |
| Under-Served Churn Rate | re-entries (sys_fairness_under_served_enter after exit) / distinct units flagged | Stability |

---

## 15. VALIDATION LOGIC (SERVER PIPELINE)

Pseudosteps:

1. Parse JSON; reject if unknown top-level key.
2. Validate against base schema.
3. Look up event-specific meta schema; validate meta; if fail → log & reject (soft or hard configurable).
4. Run PII scan on meta freeform if present (only feedback events).
5. Compute event_hash; compare absent or mismatch (should be absent at ingestion, pipeline sets).
6. Attach integrity.event_hash & pipeline_hash.
7. Persist; produce internal metrics (latency).
8. (Optional future) Batch anchor selected events into hash chain (anchor group: fairness entry/exit + verify attempts counts).

---

## 16. LINT & CI (DEVELOPER CLIENT LIBRARY)

Client library test:

- Prevent sending event if meta missing required key.
- Enforce sampling logic centrally (avoid per-event developer hacks).
- Rate limiting: no more than X hero_card_impression events per card per session (X=1).
- Guarantee layering: all events include page & session_id automatically; no manual override.

---

## 17. PROHIBITED / RESERVED FIELDS

| Field | Status | Reason |
|-------|--------|-------|
| user_ip | Prohibited | Privacy |
| full_user_agent | Prohibited | Fingerprinting |
| email, phone, name | Prohibited | PII |
| click_coordinates | Prohibited | Unnecessary precision |
| screen_resolution | Prohibited | Fingerprinting additive |
| referrer_full_raw | Prohibited | Sensitive leakage |

Lint rejects presence anywhere in payload.

---

## 18. SAMPLING POLICY

Phase 0–90 days: NO sampling (rate=1).  
Post baseline: heavy events (impressions) may adopt deterministic 0.5 sampling with hashed session_id modulo bucket -> STILL preserve comparability.  
If sampling introduced: derived metrics referencing denominator MUST embed sampling correction (divide by sampling rate).

---

## 19. SECURITY & TAMPER RESISTANCE

| Threat | Mitigation |
|--------|-----------|
| Replay injection | event_id uniqueness + DB constraint |
| Payload tamper | event_hash + pipeline_hash monitoring |
| Spoofed event_name | Allowlist matching pattern set |
| Mass spam (feedback) | Rate limit per session + server threshold |
| PII leakage attempt in meta | PII scanner + reject + block event_name if repeated abuse |

---

## 20. PERFORMANCE TARGETS (INGESTION)

| Metric | Target |
|--------|--------|
| p95 ingestion latency | <250ms |
| p99 validation step | <60ms |
| Data loss (dropped events) | <0.5% (transient network) |
| Schema mismatches | <1% (should approach 0) |

Monitoring: daily discrepancy report.

---

## 21. GOVERNANCE HOOKS (MAPPING)

| Governance Decision | Field Impact | Logging |
|---------------------|-------------|---------|
| Add fairness metric event | new event_name | DEC entry + schema patch |
| Modify classification boundaries (equity) | classification meta values | DEC entry & methodology update |
| Introduce sampling | sampling.rate presence | DEC entry & public note |
| Add internal chain anchoring | integrity.chain_anchor new usage | DEC entry (transparency) |

---

## 22. DEPRECATION PROCESS

Steps:

1. Mark event deprecated in taxonomy table (vNext doc).
2. Emit warning log on server when receiving old event.
3. After grace (e.g., 30d), reject (410 code equivalently).
4. Provide mapping (if replacement) with transformation formula.

No deprecations allowed first 60 days unless severe misdesign.

---

## 23. ANALYTICS DASHBOARD FIELD MAPPING

| Dashboard Section | Primary Events |
|-------------------|---------------|
| Funnel | pub_landing_impression, pub_hero_pill_click (registry/equity), pub_registry_unit_view |
| Fairness Activation | pub_equity_under_served_click, sys_fairness_under_served_enter/exit |
| Trust Depth | pub_hash_verify_click, pub_credential_copy |
| Participation | pub_feedback_submit, pub_feedback_block_pii |
| Terminology | pub_terminology_page_view, pub_terminology_banner_click |
| Stability | pub_error_equity_no_data, pub_placeholder_snapshot_loading |

---

## 24. EVENT NAMING GUIDELINES

Pattern: `<scope>_<domain>_<action>[_<detail>]`

- scope: pub (public user) / sys (system fairness internal) / perf (if separate later)
- domain: hero, equity, trust, registry, feedback, terminology
- action: click / view / submit / impression / verify / copy / open
- detail: optional clarifier

Prohibited:

- Past tense (“clicked”)
- Marketing adjectives (“amazing”)
- Ranking labels (“top_unit”)

---

## 25. QUALITY ASSURANCE CHECKLIST (PRE-LAUNCH)

| Check | Description |
|-------|-------------|
| Schema validation passes for 20 sample events | Random event set |
| No prohibited fields in payload inspection | Query last 24h events |
| Hash recomputation deterministic | 100% match across re-hash run |
| PII scanner false negative test | Inject test strings; all blocked |
| Hero card impression dedup works | Only 1 impression per card per session |
| Under-served event ratio within expected cardinality | <= number_of_active_under_served units |

---

## 26. RISK REGISTER (EVENT-SPECIFIC)

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| Schema drift unversioned | Misinterpret KPIs | Low | pipeline_hash compare |
| High cardinality meta injection | Storage bloat | Medium | Whitelist meta keys; extra keys cause reject |
| PII leakage via unit name (if name includes personal data) | Privacy breach | Low | Credential issuance policy forbids PII inside name |
| Over instrumentation (performance cost) | LCP degrade | Medium | Audit events weight & consider sampling after baseline |
| Misclassification fairness event meaning | Analytical error | Medium | Document entryReason & stable semantics |

---

## 27. EXTENSION PATH (FUTURE)

| Potential Event | Condition | Risk |
|-----------------|-----------|------|
| pub_support_action_click | Support page live | Must avoid donation push semantics |
| pub_governance_policy_doc_view | Detailed policy page available | Might inflate 'consumption' metrics meaning |
| pub_revocation_notice_view | Revocation UI live | Ensure not misread as penalty ranking |

All additions follow naming guidelines & attach meta fields enumerated (no free text).

---

## 28. OPEN DECISIONS (TO RATIFY)

| Decision | Options | Recommendation | Owner |
|----------|---------|---------------|-------|
| Introduce `classification` meta for equity card impression? | yes/no | Yes (public aggregated classification only) | Governance |
| Include `ratio` precise vs truncated 2 decimals? | full/truncated | Truncated 2 (privacy & fairness) | Data Lead |
| Sampling start threshold (impressions) | after baseline / immediate | After 30d baseline | Product |
| Persist chain_anchor early? | yes/no | Defer until chain events stable | Engineering |
| Accept exit events under-served as public? | yes/no | Keep internal (sys_*) | Governance |

---

## 29. ACCEPTANCE CRITERIA (IMPLEMENTATION)

- [ ] All event names present & documented.
- [ ] Base schema enforced; unknown keys rejected.
- [ ] Meta sub-schema validation operational for ≥80% events (hero, equity, feedback, trust).
- [ ] event_hash generated & verifiable via re-hash script.
- [ ] pipeline_hash matches repository commit reference (documented).
- [ ] PII scanner integrated; test suite passes (no false negative in test set).
- [ ] Logging pipeline exports anomaly count daily (schema mismatch rate).
- [ ] Dashboard ingestion can derive at least 6 KPI metrics.
- [ ] Governance DEC entry referencing adoption created.

---

## 30. CHANGE LOG (LOCAL FOR THIS DOC)

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2025-08-12 | Initial canonical schema & taxonomy |

---

## 31. SUMMARY

Event Schema v1.0 memberikan fondasi observability yang selaras dengan etos: verifiability tanpa ekses data, fairness tanpa ranking, dan privasi terjaga. Event architecture ini siap dipakai menutup gap “instrumentation blindness” yang diidentifikasi dalam Master Spec, sebelum aktivasi baseline KPI dalam 30 hari pertama.

---

## 32. NEXT ACTIONS

| Action | Owner |
|--------|-------|
| Ratify open decisions (Section 28) | Governance |
| Publish schema JSON to canonical URL | Engineering |
| Implement client lib auto-population (page, session, user_type) | Engineering |
| Build server ingestion validator + meta dispatch | Engineering |
| Add test vectors & hash verification script | DevOps |
| Setup initial dashboard queries | Analytics |
| Add DEC entry for instrumentation adoption | Governance |

---

## 33. APPENDIX – META SUB-SCHEMA INDEX (REFERENCE)

| Event | Sub-Schema ID |
|-------|---------------|
| pub_hero_card_cta_click | meta/pub_hero_card_cta_click.json |
| pub_equity_under_served_click | meta/pub_equity_under_served_click.json |
| pub_feedback_submit | meta/pub_feedback_submit.json |
| pub_hash_verify_click | meta/pub_hash_verify_click.json |
| pub_trust_metric_tooltip_open | meta/pub_trust_metric_tooltip_open.json |
| pub_terminology_page_view | meta/pub_terminology_page_view.json |
| (others incremental) | ... |

---

## 34. APPENDIX – HASH RE-COMPUTE SCRIPT OUTLINE (INFORMATIVE)

Steps:

- Input JSON event
- Remove integrity.event_hash
- Canonicalize (JCS)
- SHA-256 digest → hex
- Compare to integrity.event_hash

Return PASS/FAIL.

---

## 35. APPENDIX – PROHIBITED META KEYS REGEX

```
(ip|email|e[-]?mail|phone|tel|address|lat|lng|geo|ua|string|cookie|fingerprint|sessionSecret|auth|token|child(Name|DOB|Birth)|rank|rating|score)
```

Case-insensitive; deny ingestion.

---

## 36. FINAL DECISION PROMPT

Silakan konfirmasi / modifikasi parameter keputusan (Section 28).
Contoh format:
`KEPUTUSAN: Setujui classification truncated 2dp, sampling after 30d baseline, sys under-served exit internal.`

Setelah konfirmasi:

1. AI update Master Spec (delta instrumentation).
2. AI buat template DEC log entry.
3. AI susun test checklist file.

(End of Event Schema Canonical Specification v1.0)
