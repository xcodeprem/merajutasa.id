# Delta: Master Spec v2.0 – §27 Event Schema Alignment with Canonical v1.0

DEC Reference: DEC-20250813-06 (Consolidated governed editorial/whitelist alignment; no semantic runtime change)
Date: 2025-08-14
Status: Editorial Clarification (Non-destructive)

Summary

- Align the wording and field list in §27 “Event Schema Canonical Overview (Anchor)” with the canonical Event Schema v1.0.
- Replace outdated references to event_version and meta.* sub-objects with the current contract: root-level schema_version, integrity, privacy objects.
- Clarify mandatory fields list to avoid drift across documents; this delta does not change any runtime behavior or analytics meaning.

Changes (Documentation Only)

- §27 mandatory fields revised from:
  event_name, event_version, occurred_at, meta.integrity.event_hash, meta.client.app_version, meta.privacy.redaction_status
  to the canonical set:
  schema_version, event_name, event_id, occurred_at, received_at, session_id, user_type, page, source, integrity (object), privacy (object)
- Note added: integrity.event_hash is set server-side; client libraries MUST NOT pre-fill it. privacy flags indicate scanner status and scrub confirmation; no raw PII is persisted.
- Cross-reference added to docs/analytics/event-schema-canonical-v1.md (Sections 3, 6, 7, 15) for full definitions and JSON Schema ID.

Rationale

- Prevents dual truth between Master Spec and the canonical schema document.
- Keeps governance hooks (pipeline_hash, event_hash) consistent with §31 Integrity Chain.
- No change to event meaning, taxonomy, or analytics; strictly editorial alignment.

Acceptance

- Merge of this delta updates the anchor text for §27 without modifying the base Master Spec file (delta-files policy preserved).
- No CI behavior change expected.

---

(End of Delta)
