# Policy Index v1.0 (Append-Only)

Status: Draft Initialization (To be sealed after hash manifest fill)  
Purpose: Konsolidasi seluruh policy-as-code & lint guardrail agar traceable ke DEC & prinsip GP1–GP10 tanpa menghapus jejak strategi.

| Policy ID | File / Location | Domain | Enforcement Level | DEC Ref (if any) | Principles | Notes |
|-----------|-----------------|--------|-------------------|------------------|------------|-------|
| aggregation.min_cell_threshold | policy/opa/aggregation.rego (planned) | Equity Aggregation | deny | DEC-20250812-02 (threshold adoption context) | GP2, GP9 | Blocks publish cells < threshold |
| disclaimers.presence | ci/lint/disclaimers.js (planned) | Transparency | deny | DEC-20250812-03 (activation alignment) | GP5, GP6, GP7, GP9 | Ensures D1–D7 in required surfaces |
| credential.field.prohibited | ci/lint/credential-schema.js | Integrity/Privacy | deny | Future DEC | GP1, GP4, GP10 | Guards against unapproved fields |
| hysteresis.params.lock | ci/lint/hysteresis-lock.js | Fairness Governance | warn→deny | DEC-20250812-02 | GP2, GP9 | Compares code constants vs config |
| terminology.usage.threshold | ci/lint/terminology.js | Transition | warn | Future DEC | GP5, GP7 | Monitors adoption slope |
| equity.delta.anomaly | analytics/anomaly-detector.js | Fairness Monitoring | observe | Future DEC (anomaly) | GP9, GP10 | Emits anomaly events |
| principles.reference | ci/lint/principles-reference.js | Governance | deny | DEC-20250812-03 | GP2 (all) | Ensures Section 37 matrix integrity |
| hype.language | ci/lint/hype.js | Copy Ethics | deny | Future DEC | GP5, GP7 | Blocks marketing overclaim |
| pii.patterns.lock | ci/lint/pii-patterns.js | Privacy | warn→deny | Future DEC | GP1, GP3, GP8 | Prevent silent pattern removal |

Hash Manifest Link: docs/integrity/spec-hash-manifest-v1.json

Addendum (Appended after DEC-20250812-03):

- Updated DEC Ref disclaimers.presence to DEC-20250812-03 for activation alignment.
- No prior row removed (immutability preserved).
