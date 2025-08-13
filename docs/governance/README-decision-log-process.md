# Decision Log Process (Excerpt – Updated for DEC-20250812-02)

This update APPENDS process rules to include hysteresis parameter locking.

## Parameter Lock Rule

Any runtime constants governing fairness classification (hysteresis-config-v1.yml) MUST match deployed code. Divergence:

1. Build 1: Warning (recorded)
2. Build 2 consecutive: CI FAIL (policy hysteresis.params.lock)

## DEC Cross-Hashing

- Each DEC file must include hash_of_decision_document (computed post-merge) and optional config hash if a config file is associated.
- Chain Event (future): type=DEC_REFERENCE stores (dec_id, config_hash).

## Mapping Table (Current)

| DEC ID | Domain | Status |
|--------|--------|--------|
| DEC-20250812-02 | Hysteresis Option F Adoption | adopted |
| DEC-20250813-01 | Known Debt & Deferred Controls Register | adopted |

(Add future DEC entries; do not remove historical rows.)

End of appended process.

---

## Enforcement Phases Activation & Gating (Appended 2025-08-13 for Requirement 1.3)

This section DEFINES the canonical activation order and gating criteria for governance enforcement controls. It is append-only; future changes require a successor DEC (or explicit DEC addendum) referencing this section.

### Phase Overview

| Phase | Label | Primary Focus | Lint Severity (principles.reference) | Evidence Requirement Level | Terminology Stage | Privacy / PII | Notes |
|-------|-------|---------------|--------------------------------------|----------------------------|------------------|---------------|-------|
| 0 | Bootstrap | Hash sealing prep & awareness | WARN only | None (artifacts optional) | Stage 1 inventory (passive) | PII engine inactive | Immediately after DEC-20250812-03 merge |
| 1 | Core Enforcement | Integrity lock + principles lint | ERROR (fail PR on PRIN-REF codes) | Minimal (hash + param-integrity present) | Stage 1 | PII engine dry-run (no fail) | Triggered once hash baseline sealed |
| 1.5 | Evidence Expansion | Evidence completeness & drift detection | ERROR | Minimal Evidence Set (see below) required | Stage 1 | PII engine active (block multi-category) | Bridge before advanced/privacy full gating |
| 2 | Full Governance | All guard rails enforced | ERROR + composite gating | Full Evidence Bundle mandatory | Stage 1 (Stage 2 pending separate DEC) | PII enforcement + thresholds | Precondition for any Stage 2 terminology activation |

### Minimal Evidence Set (Phase 1.5 Gate)

Artifacts which MUST exist (content may include null metrics, but schema must be valid):

1. artifacts/spec-hash-diff.json
2. artifacts/param-integrity-matrix.json
3. artifacts/principles-impact-report.json
4. artifacts/hype-lint.json
5. artifacts/disclaimers-lint.json (may be stub until D7 activation)
6. artifacts/no-silent-drift-report.json (aggregates prior artifacts)
7. artifacts/fairness-sim-report.json (scenario list + placeholder metrics)

Absence of ANY required artifact in Phase ≥1.5 => CI FAIL (code: EVIDENCE_INCOMPLETE).

### Full Evidence Bundle (Phase 2 Gate Superset)

Minimal Evidence Set PLUS:

- artifacts/pii-scan-test-summary.json
- artifacts/observability-metrics.json
- artifacts/revocation-impact.json (placeholder acceptable until revocation DEC)
- artifacts/evidence-bundle.json (index: filename, sha256, generated_timestamp)

### Gating Criteria & Transitions

| From → To | Gate ID | Criteria (ALL unless noted) | Evaluation Source / Tool | Failure Code(s) | Rationale |
|-----------|---------|-----------------------------|--------------------------|-----------------|-----------|
| Phase 0 → Phase 1 | G-HASH-SEAL | spec-hash-manifest-v1.json has 0 `<PENDING_HASH>` entries for integrity_class in [decision, config, public-methodology, spec-detail, lint-spec, privacy-spec, onboarding-spec, policy-index] | spec-hash-diff (verify mode) | PLACEHOLDER_AFTER_SEAL | Ensure canonical baseline fixed before strict lint |
|  | G-PARAM-LOCK | All Option F parameters MATCH (param-integrity matrix: no `match=false`) | param-integrity.js | PARAM_DRIFT | Prevent starting enforcement on unstable baseline |
| Phase 1 → Phase 1.5 | G-EVID-MIN | Minimal Evidence Set present (fresh within 24h) | no-silent-drift aggregator | EVIDENCE_INCOMPLETE | Ensure audit trail breadth before deeper gating |
|  | G-LINT-STABILITY | missing_matrix_rate = 0% over rolling 7 days | principles-impact + governance stats | PRIN_REF_MATRIX_MISSING | Demonstrates adoption compliance |
| Phase 1.5 → Phase 2 | G-EVID-FULL | Full Evidence Bundle present & complete | evidence-bundle index | EVIDENCE_INCOMPLETE | Broader assurance before final phase |
|  | G-PRIVACY-ACTIVE | PII multi-category blocking active & threshold=2 enforced logs present | pii-scan summary | PII_BLOCK_INACTIVE | Privacy guard operational |
|  | G-DRIFT-CLEAN | no-silent-drift finds no ERROR severity entries last 3 consecutive runs | no-silent-drift-report.json | DRIFT_UNRESOLVED | Stability prior to full governance |

### Phase Enforcement Additions

| Phase | New Enforcement Dimensions Introduced |
|-------|---------------------------------------|
| 0 | None (awareness only) |
| 1 | principles.reference error gating; hash drift fail on governed files |
| 1.5 | Evidence completeness gating; basic PII block; disclaimers presence checks |
| 2 | Composite drift gating, PII multi-category hard fail, hype-lint severity thresholds, aggregation threshold enforcement, readiness for terminology Stage 2 (pending DEC) |

### Derived Metrics & Threshold Anchors

- missing_matrix_rate target: 0% by end of Phase 1 (DEC-20250812-03 reference)
- false_negative_principle_detection provisional tolerance: <5% (monitor; not gating until Phase 2)
- evidence_completeness_score = (#present_required / #required) – must equal 1.0 at Phase 1.5 gate
- artifact_freshness_hours <= 24 for each Minimal Evidence artifact at gate evaluation

### Evaluation Cadence

- Gate checks execute on each CI run of main branch nightly + per PR merge attempt.
- A gate transition occurs only on main branch after 2 consecutive passing evaluations (debounce) to avoid flapping.

### Logging & Codes (New)

| Code | Description |
|------|-------------|
| GATE_PENDING | Gate criteria not yet satisfied (non-blocking pre-target) |
| GATE_BLOCKED | Criteria failed within expected activation window (blocking) |
| DRIFT_UNRESOLVED | Drift artifact unresolved across required window |
| PII_BLOCK_INACTIVE | Multi-category threshold not enforced when required |

### Backoff / Rollback Policy

- If after entering a Phase, two consecutive CI runs produce EVIDENCE_INCOMPLETE or PARAM_DRIFT, system may auto-recommend rollback one phase (manual DEC confirmation required; no silent downgrade).

### Stage 2 (Terminology) Placeholder

Stage 2 activation (hard fail on non-whitelisted terms) REQUIRES successor DEC referencing DEC-20250812-04 DB-06 and attesting:

1. false_positive_rate_flagged_terms < 10%
2. At least 14 consecutive days with G-DRIFT-CLEAN passing.
Until then, Stage remains 1 (inventory only) through Phase 2.

---
End of enforcement phases activation & gating appendix (2025-08-13).
