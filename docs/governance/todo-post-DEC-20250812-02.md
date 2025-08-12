# Post-Decision Action List – Hysteresis Adoption (DEC-20250812-02)

## Immediate (Day 0–2)
- [ ] Commit hysteresis-config-v1.yml with computed hash (update DEC file hash_of_decision_document).
- [ ] Implement state machine code referencing config (no hard-coded constants).
- [ ] Add policy-as-code rule hysteresis.params.lock (warn mode).
- [ ] Update /equity & /trust pages with public methodology fragment (link to fairness/hysteresis-public-methodology-fragment-v1.md).
- [ ] Add sys_fairness_under_served_enter / exit events to collector allowlist & meta validator.

## Short Term (Day 3–7)
- [ ] Seed historical states from last N snapshots (internal only; mark seeding-range).
- [ ] Build dashboard widgets: activeUnderServedCount, newSevereEntries, churnRate, stalledCount.
- [ ] Add anomaly watch hooking threshold delta=0.03 (pending DEC-ANOM; if not adopted, mark “provisional”).

## Metrics to Start Capturing
- entry_reason distribution (severe vs consecutive).
- average entry delay borderline.
- proportion stalled units vs total active.

## Documentation
- [ ] Link delta file in Master Spec index.
- [ ] Append decision mention in roadmap (H0-B2 complete → moves to H1-B1 integration).
- [ ] Add FAQ entries (already drafted in hysteresis options pack; ensure deployed).

## Governance
- [ ] Schedule 30-day review meeting (calendar invite).
- [ ] Prepare review template (auto pull metrics + narrative).
- [ ] Add DEC reference to risk dashboard config.

End of action list.