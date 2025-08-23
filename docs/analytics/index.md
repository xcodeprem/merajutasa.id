# Analytics & Event Schema Index

Status: Canonical Index v1.0  
Purpose: Comprehensive index for event schema, validation, and analytics pipeline  
Last Updated: 2025-08-23

> **Analytics Framework Hub**  
> This document provides centralized navigation and overview of MerajutASA.id's event tracking, schema validation, and analytics infrastructure. Covers schema specifications, validation processes, pipeline integrity, and observability workflows.

---

## 📋 Event Schema Overview

### Current Schema Version: 1.0

- **Schema File**: [`schemas/events/public-event-v1.json`](../../schemas/events/public-event-v1.json)
- **Specification**: [`event-schema-canonical-v1.md`](event-schema-canonical-v1.md)
- **Taxonomy**: [`schemas/events/event-taxonomy-v1.json`](../../schemas/events/event-taxonomy-v1.json)
- **Pipeline Hash**: [`artifacts/event-pipeline-hash.json`](../../artifacts/event-pipeline-hash.json)

### Schema Validation & Compliance

The event schema enforces:

- **Privacy-by-design**: No PII, fingerprinting, or ranking data
- **Structural consistency**: Required fields for all events
- **Semantic validation**: Event name patterns and metadata rules
- **Integrity verification**: Event hashing and pipeline validation

---

## 🎯 Event Taxonomy

### Public Events (pub_*)

#### Landing & Navigation

- `pub_landing_impression` - Landing page view
- `pub_nav_link_click` - Navigation link interactions

#### Hero Section

- `pub_hero_card_impression` - Hero card displays
- `pub_hero_card_cta_click` - Hero CTA interactions
- `pub_hero_card_focus` - Hero card focus events
- `pub_hero_metric_hover` - Metric hover tooltips
- `pub_hero_pill_click` - Pill/tag selections
- `pub_hero_rotator_change` - Hero content rotation

#### Registry & Unit Profiles

- `pub_registry_unit_view` - Registry unit views
- `pub_registry_filter_used` - Search/filter usage
- `pub_unit_profile_view` - Individual unit profile views

#### Equity & Fairness

- `pub_equity_view` - Equity dashboard views
- `pub_equity_under_served_click` - Under-served indicator clicks
- `pub_equity_bucket_info_open` - Equity bucket information
- `pub_equity_trend_tooltip_open` - Equity trend details

#### Trust & Transparency

- `pub_trust_view` - Trust dashboard views  
- `pub_trust_metric_tooltip_open` - Trust metric details
- `pub_hash_verify_click` - Hash verification actions
- `pub_credential_copy` - Credential copying events

#### Feedback & Engagement

- `pub_feedback_form_open` - Feedback form opens
- `pub_feedback_category_select` - Feedback category selections
- `pub_feedback_submit` - Feedback submissions
- `pub_feedback_block_pii` - PII detection/blocking

#### Terminology & Documentation

- `pub_terminology_page_view` - Terminology page views
- `pub_terminology_banner_click` - Terminology banner clicks
- `pub_terminology_glossary_term_expand` - Glossary interactions

#### Media & Content

- `pub_media_digest_view` - Media digest views
- `pub_media_citation_copy` - Citation copying

#### Performance Monitoring

- `pub_perf_lcp_bucket` - Largest Contentful Paint buckets
- `pub_perf_first_input_delay_bucket` - First Input Delay buckets

#### Error Tracking

- `pub_error_equity_no_data` - Equity data unavailable
- `pub_error_registry_fetch` - Registry fetch failures

### System Events (sys_*)

#### Fairness Engine

- `sys_fairness_under_served_enter` - Under-served status entry
- `sys_fairness_under_served_exit` - Under-served status exit

---

## 🔍 Validation & Pipeline

### Event Validation Process

1. **Schema Validation**: Events validated against [`public-event-v1.json`](../../schemas/events/public-event-v1.json)
2. **Meta Validation**: Event-specific metadata validation
3. **PII Scanning**: Prohibited metadata detection and redaction
4. **Hash Generation**: Integrity hash computation for each event
5. **Pipeline Verification**: Pipeline hash validation ensures consistency

### Collector Service

**Endpoints**:

- `POST /ingest` - Single event ingestion
- `POST /ingest-batch` - Batch event processing (NDJSON/JSON array)
- `GET /stats` - Event statistics by type
- `GET /health` - Service health status

**Service Details**:

- **Port**: 4603 (configurable via `COLLECTOR_PORT`)
- **Schema**: Draft 2020-12 JSON Schema validation
- **Storage**: Events stored in [`artifacts/ingested-events.ndjson`](../../artifacts/ingested-events.ndjson)
- **Start Command**: `npm run service:collector`

### Pipeline Integrity

The pipeline hash in [`artifacts/event-pipeline-hash.json`](../../artifacts/event-pipeline-hash.json) combines:

- Schema version (currently "1.0")
- Event name list (36 events total)
- Schema document hash

This ensures pipeline consistency and detects schema drift.

---

## 📊 Validation Reports & Artifacts

### Core Validation Reports

- **[Event Pipeline Hash](../../artifacts/event-pipeline-hash.json)** - Pipeline integrity and event inventory
- **[Event Validation Report](../../artifacts/event-validate-report.json)** - Schema validation results  
- **[Collector Integration Report](../../artifacts/collector-integration-report.json)** - Collector service testing
- **[Event Meta Validation](../../artifacts/event-meta-validate.json)** - Metadata validation results

### Sampling & Collection

- **[Ingested Events](../../artifacts/ingested-events.ndjson)** - Raw event storage (NDJSON format)
- **[Seed Events Report](../../artifacts/seed-events-report.json)** - Test event seeding results
- **[Query Seeds](../../artifacts/query-seeds.json)** - Event query validation

### Privacy & Compliance

- **[PII Scan Report](../../artifacts/pii-scan-report.json)** - Privacy scanning results
- **[PII Metrics](../../artifacts/pii-metrics.json)** - Privacy metrics summary
- **[Privacy Asserts](../../artifacts/privacy-asserts.json)** - Privacy validation assertions

---

## 🛠️ Schema Versioning & Changes

### Version 1.0.0 (Current)

- **Released**: 2025-08-12
- **Status**: Draft for Ratification
- **Changes**: Initial canonical schema & taxonomy
- **Event Count**: 36 events (34 pub_, 2 sys_)

### Change Management Process

| Change Type | Process | Version Impact |
|-------------|---------|----------------|
| Add new event | CIC-A + docs update | Patch (1.0.x) |
| Modify event semantics | CIC-E + governance DEC | Minor (1.1.0) |
| Remove event | Minor + 30-day deprecation | Minor (1.1.0) |
| Schema structure changes | Major process | Major (2.0.0) |

---

## 🔧 Testing & Integration

### Event Processing Tests

Run the full event processing test suite:

```bash
npm run test:services         # Service integration tests
npm run events:validate       # Event validation tests  
npm run collector:smoke       # Collector functionality tests
```

### Collector Integration Testing

Test the collector service:

```bash
npm run service:collector     # Start collector service
npm run test:collector        # Run collector integration tests
```

### Event Pipeline Validation

Verify the event pipeline:

```bash
npm run events:pipeline:hash  # Generate pipeline hash
npm run event:validate        # Validate event samples
npm run governance:verify     # Full governance verification
```

---

## 📈 Analytics & Observability

### Dashboard Integration

- **[Dashboard Widgets](dashboard-widgets-hysteresis-initial.md)** - Initial dashboard specifications
- **[Media Digest](media-digest.md)** - Media analytics framework

### KPI & Metrics

The event schema supports:

- **Fairness monitoring** via equity and under-served events
- **User experience tracking** through hero and navigation events
- **Performance monitoring** via Core Web Vitals events
- **Trust verification** through hash verification events
- **Feedback analysis** via categorized feedback events

### Governance Integration

Events integrate with governance through:

- **Integrity verification**: Event hashes anchor to chain
- **Privacy compliance**: PII scanning and redaction
- **Schema governance**: DEC process for semantic changes
- **Audit trails**: Complete event lineage tracking

---

## 🔗 Related Documentation

### Schema & Standards

- **[Event Schema Canonical v1.0](event-schema-canonical-v1.md)** - Complete schema specification
- **[Schemas Overview](../schemas/README.md)** - Data validation schemas  
- **[Data Dictionary](../data/README.md)** - Data definitions & retention

### Infrastructure & Services

- **[Services Overview](../infrastructure/README.md)** - Service architecture
- **[Testing & Validation](../tests/README.md)** - Testing framework
- **[Privacy & PII Protection](../privacy/README.md)** - Privacy implementation

### Governance & Process

- **[Integrity Management](../integrity/README.md)** - Hash verification & signing
- **[Governance Process](../governance/README.md)** - Decision processes (DEC)
- **[Fairness Systems](../fairness/README.md)** - Equity monitoring

---

*This index follows the canonical documentation structure and is governed by the spec-hash integrity manifest. For schema changes, follow the CIC-A/CIC-E governance process.*
