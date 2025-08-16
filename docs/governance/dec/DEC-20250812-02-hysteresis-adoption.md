---
id: DEC-20250812-02
title: Adoption of Under‑Served Hysteresis Option F (Hybrid) Parameters
date: 2025-08-12T04:25:29Z
class: CIC-E
status: adopted
supersedes: []
depends_on: []  # Baseline fairness decision; root for later activation & threshold DECs
spec_reference:
  - docs/fairness/hysteresis-config-v1.yml
  - docs/fairness/hysteresis-state-machine-transitions.md
  - docs/fairness/hysteresis-public-methodology-fragment-v1.md
  - docs/roadmap/roadmap-master-v1.md
related_principles: [GP1, GP5, GP6, GP9, GP10]
impacted_components: [equity_snapshot_job, hysteresis_state_machine, equity_page, trust_page_methodology, hero_equity_card, analytics_events(sys_fairness_*), risk_dashboard]
hash_of_decision_document: "009825b624cca02c93e2ad500bafcdebf3ffc3adbf5a98c7cdbbde5334a79e38"   # sealed SHA256
non_removal_assertion: "Tidak menghapus strategi sebelumnya; hanya memilih Option F parameter set."
append_only_notice: "File immutable; perubahan memerlukan DEC penerus referensi id ini."
decision:
  option: F
  description: Hybrid hysteresis with severe immediate trigger and consecutive borderline confirmation, plus elevated exit threshold and cooldown.
parameters:
  T_enter_major: 0.50
  T_enter_standard: 0.60
  consecutive_required_standard: 2
  T_exit: 0.65
  cooldown_snapshots_after_exit: 1
  stalled_window_snapshots: 5
  stalled_min_ratio: 0.55
  stalled_max_ratio_below_exit: 0.65
  entry_reasons: ["severe","consecutive"]
  anomaly_delta_threshold_equity_ratio: 0.03
justification:
  - Immediate visibility for severe shortages (ethical urgency).
  - Noise suppression for borderline cases (stability & outcome honesty).
  - Clear public narrative (“<50% immediate; or two days <60%; exit at ≥65%”).
  - Minimizes gaming incentives around minor fluctuations.
evaluation_criteria:
  first_30d_metrics:
    severe_entry_delay_expected: 0
    borderline_entry_delay_mean_target: <=1 snapshot
    churn_rate_target: < 15%
    false_positive_proxy_target: < 15%
    re_entry_rate_target: < 25%
  review_after_days: 30
  review_possible_adjustments: [T_enter_standard, T_exit, stalled_window_snapshots]
risk_assessment:
  risks:
    - id: R-HYST-01
      risk: Over-persistence for units oscillating 0.62–0.64
      mitigation: Stalled state internal alert after 5 snapshots; targeted follow-up
    - id: R-HYST-02
      risk: Under-detection borderline (single-day dips)
      mitigation: Transparent FAQ + monitoring single isolated dips
    - id: R-HYST-03
      risk: Public misinterpretation as ranking
      mitigation: Disclaimer D1 presence + non-ranking FAQ entry
dependencies:
  - Equity snapshot daily job implementation
  - Event schema ingestion of sys_fairness_under_served_enter/exit
  - Disclaimers lint ensuring D1 present on affected pages/components
change_log:
  - 2025-08-12: Adopt Option F parameters (initial)
governance_votes:
  method: unanimous_vote
  result: approved
  voters: ["GovernanceChair","DataLead","EthicsRep","ProductOwner"]
implementation_actions:
  - Implement state machine with defined transitions & parameters.
  - Instrument sys_fairness_under_served_enter/exit events (internal).
  - Update /equity & /trust methodology narrative (replace “decision pending”).
  - Add parameters to config: config/fairness/hysteresis.yml.
  - Add policy-as-code hysteresis.params.lock (warn if divergence).
  - Seed initial states (if pre-snapshots exist) without rewriting history.
public_communication:
  summary: "Label 'under‑served' now uses hybrid stability rules: <50% immediate; otherwise needs two consecutive snapshots <60%; exit on ≥65%."
review_plan:
  date_scheduled: 2025-09-11
  success_conditions: metrics meet targets (see evaluation_criteria)
  fallback: revert to dual-threshold (Option E) if churn >25% OR detection delay severe >0
signoff:
  governance_chair: "SIGNED <Farid>"
  data_lead: "SIGNED <Farid>"
  ethics_representative: "SIGNED <Farid>"
  product_owner: "SIGNED <Farid>"
integrity_manifest_pointer: "docs/integrity/spec-hash-manifest-v1.json#files[id=DEC-20250812-02-hysteresis-adoption]"
---

This decision file is append-only. Any modification requires a new DEC referencing this id (supersede chain). No prior strategy removed.
