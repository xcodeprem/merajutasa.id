# Hysteresis State Machine (Concrete After DEC-20250812-02)

DEC Reference: DEC-20250812-02  
Do NOT remove previous conceptual descriptions; this file concretizes transitions with adopted parameters.

## States

- NONE
- CANDIDATE
- ACTIVE
- STALLED (internal only)
- CLEARED

## Parameters (bound)

T_enter_major = 0.50  
T_enter_standard = 0.60 (2 consecutive)  
T_exit = 0.65  
cooldown = 1 snapshot  
stalled_window = 5 snapshots  
stalled_min_ratio = 0.55  
stalled_max_ratio_below_exit = 0.65  

## Transitions

| From | Condition | To | Notes |
|------|-----------|----|------|
| NONE | r < 0.50 | ACTIVE | entryReason=severe |
| NONE | 0.50 ≤ r < 0.60 | CANDIDATE | borderline start |
| CANDIDATE | 0.50 ≤ r < 0.60 AND prev snapshot also in that range | ACTIVE | entryReason=consecutive |
| CANDIDATE | r ≥ 0.60 | NONE | abort candidate (noise) |
| ACTIVE | r ≥ 0.65 | CLEARED | exit; start cooldown |
| ACTIVE | flaggedSnapshots >=5 AND all last 5 ratios in [0.55, <0.65] | STALLED | internal |
| STALLED | r ≥ 0.65 | CLEARED | exit |
| CLEARED | cooldownExpired AND r < 0.50 | ACTIVE | severe bypass |
| CLEARED | cooldownExpired AND 0.50 ≤ r < 0.60 | CANDIDATE | normal path |
| CLEARED | cooldown not expired | CLEARED | hold |

## Pseudocode (Bound)

```python
def update_state(unit, r, history):
    st = unit.state
    if st == 'NONE':
        if r < 0.50:
            return ACTIVE('severe')
        if 0.50 <= r < 0.60:
            return CANDIDATE()
        return NONE
    if st == 'CANDIDATE':
        if 0.50 <= r < 0.60 and history[-2] in range_50_60(history):
            return ACTIVE('consecutive')
        if r >= 0.60:
            return NONE
        return CANDIDATE
    if st in ['ACTIVE','STALLED']:
        if r >= 0.65:
            return CLEARED(start_cooldown=1)
        window = last_n_ratios(history,5)
        if len(window)==5 and min(window) >= 0.55 and max(window) < 0.65:
            return STALLED
        return st
    if st == 'CLEARED':
        if not cooldown_expired(unit): return CLEARED
        if r < 0.50: return ACTIVE('severe')
        if 0.50 <= r < 0.60: return CANDIDATE
        return CLEARED
```

## Instrumentation Mapping

| Transition Emitted | Event |
|--------------------|-------|
| NONE→ACTIVE | sys_fairness_under_served_enter |
| CANDIDATE→ACTIVE | sys_fairness_under_served_enter |
| ACTIVE→CLEARED | sys_fairness_under_served_exit |
| STALLED→CLEARED | sys_fairness_under_served_exit |

STALLED enter optional (internal log only).

## Policy-as-Code Lock

File hysteresis-config-v1.yml hashed; pipeline compares live code constants. Divergence >2 consecutive builds ⇒ fail (CIC-E guard).

Audit fields persisted internal per unit:

- entry_reason
- first_active_snapshot_id
- last_state_change_snapshot_id
- active_duration_snapshots
- stalled_flag
- last_exit_snapshot_id

End of machine spec (do not delete; append future param changes with new DEC references).
