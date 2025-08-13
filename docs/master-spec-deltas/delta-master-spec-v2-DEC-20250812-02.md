# Master Spec Delta – Adoption of Hysteresis Option F (DEC-20250812-02)

This delta file APPENDS to Master Spec v2.0. No prior strategy removed.

## Section Impacted: Fairness & Equity (Sections 14, 30, 42 in Master Spec)

### Added Canonical Parameters

- T_enter_major = 0.50
- T_enter_standard = 0.60 (requires 2 consecutive snapshots)
- T_exit = 0.65
- Cooldown after exit = 1 snapshot
- Stalled recovery detection window = 5 snapshots with ratios all in [0.55, <0.65]
- Entry reasons tracked internally: severe | consecutive

### Narrative Update (Public)

“Under‑served: <50% immediate; atau dua snapshot berturut di bawah 60%; keluar pada ≥65%.”

### Event Instrumentation

sys_fairness_under_served_enter / sys_fairness_under_served_exit now authoritative for churn, persistence, anomaly context.

### Risk Register Addendum

- PUB-R12: Parameter drift without DEC – mitigated by hysteresis.params.lock policy.

### Lint / Policy Updates

- New policy: hysteresis.params.lock (warning then fail after 2 mismatches).
- Disclaimers mapping unchanged; D1 still mandatory on equity exposures.

### Analytics KPI Clarification

Under-Served Churn Rate uses sys_fairness events anchored to DEC-20250812-02 methodology; pre-DEC events (if any) excluded from trend baseline.

### Audit Traceability

Hash of hysteresis-config-v1.yml stored; DEC file lists this hash for reproducible parameter verification.

End of delta (append-only).
