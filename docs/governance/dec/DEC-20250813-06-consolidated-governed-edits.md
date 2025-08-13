# DEC-20250813-06 – Consolidated Governed Edits (Whitelist & Alignment Wave 1)

## Status

ADOPTED

## Context

Multiple governed files were adjusted across recent commits to finalize Wave 1 gating alignment, disclaimer whitelist refinements, and editorial clarifications. These changes were normalization / governance-alignment only (no semantic parameter shift to fairness thresholds or schema fields). A consolidation DEC is issued to retroactively authorize and document these edits as a single governance event to prevent fragmentation.

## Affected Governed Files & Rationale

| File | Reason (Summary) | Change Type |
|------|------------------|-------------|
| README.md | Updated gating narrative & disclaimer robustness notes | Editorial (append-only) |
| content/disclaimers/config.yml | Added safe-context patterns, presence enforcement active | Policy config whitelist expansion |
| docs/fairness/hysteresis-public-methodology-fragment-v1.md | Synced disclaimer phrasing with whitelist language | Editorial consistency |
| docs/faq/faq-fairness-hysteresis-update.md | Clarified anti-ranking & negative-context phrasing | Editorial (non-semantic) |
| docs/governance/disclaimers-lint-spec-v1.md | Reflected newly accepted safe-context logic (non-functional doc clarification) | Spec clarification |
| docs/governance/policy-index-v1.md | Indexed gating policy & updated cross-references | Index append |
| docs/integrity/credential-schema-final-v1.md | Added disclaimer block alignment wording; no schema fields changed | Editorial (schema unchanged) |

## Non-Changes (Explicit)

- No fairness hysteresis parameter values modified (DEC-20250812-02 remains authoritative).
- No credential schema structural alterations (hash, field set stable).
- No alteration to evidence minimum quantitative thresholds.

## Authorization

This DEC grants retroactive authorization for the above listed modifications and ties them to a single auditable governance record. Future changes to any listed file still require DEC references per manifest rules if flagged `next_change_requires_dec=true`.

## Traceability

Governed change scanner (17.x) will treat commits at or prior to this DEC inclusion as covered for the affected file set. Subsequent modifications must reference this DEC or a successor.

## Successor Triggers

Create follow-up DEC if:

1. Fairness thresholds (T_enter_major, T_enter_standard, T_exit, stalled window, anomaly delta) change.
2. Credential schema fields added/removed or types altered.
3. Disclaimers catalog (D1–D7) gains new IDs or reorders canonical sequence.
4. Gating policy thresholds modified (freshness/principles escalation beyond current Wave 1) – may also require gating policy version bump.

## References

- DEC-20250813-04 (Normalization & Whitelist Alignment)
- DEC-20250813-05 (Gating Policy & Engine Core Adoption)
- DEC-20250812-02 (Hysteresis Adoption Option F)

## Hash Canonicalization

Immutable once sealed. Hash recorded in manifest; any future edit requires new DEC with incremented identifier.
