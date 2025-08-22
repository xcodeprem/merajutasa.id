---
id: DEC-20250813-03
title: Disclaimers Presence Enforcement Activation (Phase 2 Trigger)
date: 2025-08-13T00:00:00Z
class: CIC-A
status: draft
supersedes: []
depends_on:
  - DEC-20250812-02
  - DEC-20250812-03
  - DEC-20250812-04
scope:
  - Escalate DISC-PRES-001 (required disclaimer missing) from WARN→ERROR once activation gates satisfied.
  - Enable presence_enforcement=true in content/disclaimers/config.yml after dry-run stability window.
  - Maintain other disclaimer rule severities unchanged (drift, phrase, duplication) in this phase.
non_removal_assertion: "Tidak menghapus strategi sebelumnya; hanya mengaktifkan enforcement presence."
activation_criteria:  # All MUST be true (single evaluation window immediately prior to switch)
  - code: A1
    metric: missingIds_total
    threshold: "< 5"
    source: artifacts/disclaimers-lint.json#summary.metrics.missingIds
  - code: A2
    metric: DISC-PRES-001_errors_dry_run
    threshold: 0
    source: artifacts/disclaimers-lint.json#summary.metrics.ruleCounts[DISC-PRES-001]
  - code: A3
    metric: DISC-PHRASE-009_banned_phrase_proximity
    threshold: "<= 1"
    source: artifacts/disclaimers-lint.json
  - code: A4
    metric: DISC-TEXT-003_drift_errors
    threshold: "<= 2"
    source: artifacts/disclaimers-lint.json
  - code: A5
    metric: hype_lint_high_findings
    threshold: "<= 3"
    source: artifacts/hype-lint.json
  - code: A6
    metric: evidence_freshness_consecutive_pass_days
    threshold: ">= 7"
    source: artifacts/evidence-freshness-report.json
decision:
  status: pending_activation
  description: "Activate ERROR enforcement for missing required disclaimers (DISC-PRES-001) after dry-run proves stability & criteria gates pass."
rationale:
  - Presence omissions silently degrade fairness/privacy narrative (risk of user misinterpretation).
  - Advisory period produced acceptable coverage & low drift noise; escalation reduces residual risk.
  - Evidence & hype stability precondition ensures simultaneous signal noise minimized.
risk_assessment:
  risks:
    - id: R-DISC-01
      risk: Undetected unscanned pages produce false confidence.
      mitigation: Expand extraction coverage audit before switch; add metric missingIds_total trend.
    - id: R-DISC-02
      risk: Developer friction spike post-switch.
      mitigation: 48h dry-run dengan panduan PR; quick fix snippets.
    - id: R-DISC-03
      risk: Banned phrase + presence simultaneous failures overwhelm remediation.
      mitigation: Gate requires low banned phrase proximity count (A3) before activation.
rollback_plan:
  trigger: "> 2 DISC-PRES-001 new errors on distinct PRs within 48h post-activation"
  action: Revert presence_enforcement=true → false via emergency patch referencing this DEC & add item to Known Debt register.
implementation_actions:
  - Merge this DEC (hash sealed) status=draft.
  - Enable presence_enforcement_dry_run=true (non-blocking) collect metrics ≥48h.
  - Governance review metrics vs activation_criteria; record snapshot artifact.
  - Flip presence_enforcement=true; remove dry_run flag.
  - Monitor 72h; if stable set status=adopted via successor DEC atau status update protocol.
metrics_tracking:
  - name: disclaimer_missing_rate
    definition: missingIds_total / total_required_bindings.
  - name: drift_error_count
    definition: DISC-TEXT-003 errors per 24h window.
  - name: banned_phrase_proximity_count
    definition: Count DISC-PHRASE-009 occurrences near disclaimers.
review_plan:
  date_scheduled: 2025-08-20
  success_criteria:
    - disclaimer_missing_rate < 2% first 72h.
    - drift_error_count <= 2.
    - No rollback trigger fired.
fallback:
  - If disclaimer_missing_rate >= 5% any 24h window post-activation: initiate targeted remediation sprint (no immediate disable).
  - If drift_error_count > 4 sustained 48h: open refinement DEC to adjust similarity threshold or override process.
signoff:
  governance_chair: "PENDING"
  data_lead: "PENDING"
  ethics_representative: "PENDING"
  product_owner: "PENDING"
hash_of_decision_document: "8bf0f05cfa58004cac4decbc30639a10093a3dc7af1e63157b5e5c11e7dbee88"  # will be canonicalized by tooling
integrity_manifest_pointer: "docs/integrity/spec-hash-manifest-v1.json#files[path=docs/governance/dec/DEC-20250813-03-disclaimers-presence-enforcement.md]"
append_only_notice: "File immutable; changes require successor DEC referencing this id."
---

Summary: Adopt ERROR enforcement for missing required disclaimers after gated stability; no other disclaimer rule severities changed.
