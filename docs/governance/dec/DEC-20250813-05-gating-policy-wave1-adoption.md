# DEC-20250813-05 – Wave 1 Gating Policy & Engine Core Governance Adoption

## Status

ADOPTED

## Context

Wave 1 introduces operational gating for fairness & integrity controls. A formal gating policy JSON (`docs/integrity/gating-policy-v1.json`) and extraction of the fairness hysteresis state machine core (`tools/fairness/engine-core.js`) were added. These artifacts require governance so that future threshold or logic drift is explicitly authorized.

## Decision

1. `docs/integrity/gating-policy-v1.json` is now a governed file (append-only, next_change_requires_dec=true). Any threshold change (even tightening) must reference this DEC or a successor DEC.
2. `tools/fairness/engine-core.js` is governed under the original hysteresis adoption DEC (DEC-20250812-02) plus this DEC for the extraction & stall/cooldown instrumentation logic. Future semantic changes (transition conditions, event emission types) require a new DEC referencing both DEC-20250812-02 and this DEC.
3. Governance verification pipeline updated to:
   - Enforce param lock hash check before gating aggregation.
   - Treat unit test failures for fairness engine as CRITICAL.
   - Load gating thresholds dynamically (zero spec hash violations, param integrity PASS, hype HIGH = 0, PII critical = 0, fairness unit PASS).
4. Added governed change scan script for 17.x change control to require DEC references when governed files mutate.

## Rationale

Centralizing thresholds & engine logic under explicit governance reduces silent drift risk (11.1) and creates auditable traceability for fairness enforcement (5.1–5.3) before expanding automation scope in subsequent waves.

## Implications

- PRs modifying gating policy or engine-core require a new DEC referencing this decision prior to merge.
- Spec hash manifest updated with entries for both files including this DEC reference.
- Future Wave 2 may elevate additional advisory checks (freshness aging, principles impact) to blocking using version bump of gating policy.

## References

- DEC-20250812-02 (Hysteresis Adoption)
- DEC-20250812-04 (Governance Baseline Thresholds)
- Fairness Engine Unit Tests (artifacts/fairness-engine-unit-tests.json)

## Hash Canonicalization Note

Immutable once sealed; any edit requires new DEC file with incremented identifier.
