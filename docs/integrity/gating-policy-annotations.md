# Gating Policy Annotations (Wave 1)

This note maps `docs/integrity/gating-policy-v1.json` fields to their governance decisions and evidence sources.

- thresholds.spec_hash_violation_count = 0
  - DEC: DEC-20250813-05 (Wave 1 gating)
  - Evidence: artifacts/spec-hash-diff.json (violations length)
- thresholds.param_integrity_status = "PASS"
  - DEC: DEC-20250813-05
  - Evidence: artifacts/param-integrity-matrix.json (status)
- thresholds.hype_high_max = 0
  - DEC: DEC-20250813-07 (post-sunset; ratified Evidence Minimum)
  - Evidence: artifacts/hype-lint.json (severity_counts.HIGH)
- thresholds.hype_medium_max = 120
  - DEC: Transitional segmentation (companion DEC; advisory tuning)
  - Evidence: artifacts/hype-lint.json (severity_counts.MEDIUM)
- thresholds.disclaimers_errors_allowed = 0
  - DEC: Disclaimers activation (pending)
  - Evidence: artifacts/disclaimers-lint.json (summary.errors)
- thresholds.pii_critical_max = 0
  - DEC: DEC-20250813-05
  - Evidence: artifacts/pii-scan-report.json (summary.critical_matches)
- thresholds.fairness_engine_required = true
  - DEC: DEC-20250812-02 (adopt hysteresis) + DEC-20250813-05
  - Evidence: artifacts/fairness-engine-unit-tests.json (summary.fail == 0)
- thresholds.freshness_required_status = "PASS"
  - DEC: DEC-20250813-05
  - Evidence: artifacts/evidence-freshness-report.json (summary.overall_status)
- thresholds.principles_required = true
  - DEC: DEC-20250812-03 (principles reference activation)
  - Evidence: artifacts/principles-impact-report.json (has entries or no_change)
- thresholds.evidence_minimum_artifacts
  - DEC: Phase 1.5 evidence set adoption (pending ratification)
  - Evidence: Presence checks for listed files (A1–A7), aggregated by no-silent-drift

- thresholds.spec_hash_violation_count = 0
  - DEC: DEC-20250813-05 (Wave 1 gating)
  - Evidence: artifacts/spec-hash-diff.json (violations length)
- thresholds.param_integrity_status = "PASS"
  - DEC: DEC-20250813-05
  - Evidence: artifacts/param-integrity-matrix.json (status)
- thresholds.hype_high_max = 0
  - DEC: DEC-20250813-07 (post-sunset; ratified Evidence Minimum)
  - Evidence: artifacts/hype-lint.json (severity_counts.HIGH)
- thresholds.hype_medium_max = 120
  - DEC: Transitional segmentation (companion DEC; advisory tuning)
  - Evidence: artifacts/hype-lint.json (severity_counts.MEDIUM)
- thresholds.disclaimers_errors_allowed = 0
  - DEC: Disclaimers activation (pending)
  - Evidence: artifacts/disclaimers-lint.json (summary.errors)
- thresholds.pii_critical_max = 0
  - DEC: DEC-20250813-05
  - Evidence: artifacts/pii-scan-report.json (summary.critical_matches)
- thresholds.fairness_engine_required = true
  - DEC: DEC-20250812-02 (adopt hysteresis) + DEC-20250813-05
  - Evidence: artifacts/fairness-engine-unit-tests.json (summary.fail == 0)
- thresholds.freshness_required_status = "PASS"
  - DEC: DEC-20250813-05
  - Evidence: artifacts/evidence-freshness-report.json (summary.overall_status)
- thresholds.principles_required = true
  - DEC: DEC-20250812-03 (principles reference activation)
  - Evidence: artifacts/principles-impact-report.json (has entries or no_change)
- thresholds.evidence_minimum_artifacts
  - DEC: Phase 1.5 evidence set adoption (pending ratification)
  - Evidence: Presence checks for listed files (A1–A7), aggregated by no-silent-drift

Notes:

- **A8 (No-Silent-Drift) Aggregator Enforcement**: The `no-silent-drift` aggregator runs in all CI workflows and prevents merges when gate status is FAIL. See `artifacts/no-silent-drift-report.json` for detailed gate check results.
- No-Silent-Drift aggregator composes component statuses and gate checks; see `artifacts/no-silent-drift-report.json`.
- Post-sunset: hype_high_max updated to 0 per DEC-20250813-07 ratification.
- **CI Gate Enforcement**: All workflows (ci-guard, pages, h1-guard) run the A8 aggregator to ensure consistent gating across CI entrypoints.
