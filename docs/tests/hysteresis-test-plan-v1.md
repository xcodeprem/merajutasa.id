# Hysteresis Test Plan (Post DEC-20250812-02)

## Objectives
Validate correctness, stability, and auditability of Option F parameters & state transitions.

## Test Categories
1. Unit Tests (state transition)
2. Integration Tests (snapshot ingestion -> state updates -> events)
3. Data Consistency (state table vs emitted events)
4. Performance (state update latency)
5. Edge Cases (invalid snapshot, backfill)
6. Audit Reconstruction

## Key Unit Test Cases
| ID | Scenario | Sequence (r) | Expected Entry Reason | Exit Snapshot | Notes |
|----|----------|--------------|-----------------------|---------------|-------|
| UT1 | Severe immediate | 0.47,0.53,0.66 | severe | 3 | Immediate entry |
| UT2 | Borderline consecutive | 0.58,0.59,0.61,0.66 | consecutive | 4 | Delay =1 |
| UT3 | False start borderline | 0.58,0.61 | none | n/a | Never ACTIVE |
| UT4 | Stalled detection | 0.54,0.56,0.57,0.58,0.59,0.60,0.61,0.64 | consecutive | none (till >0.65) | STALLED after 5th flagged snapshot |
| UT5 | Cooldown bypass severe | ACTIVE exit (0.66), then 0.49 | severe re-entry | immediate | cooldown ignored for severe |
| UT6 | Cooldown borderline again | ACTIVE exit (0.67), then 0.58,0.59 | consecutive | after second 0.59 if cooldown expired | |

## Integration Assertions
- Every ACTIVE entry has corresponding enter event with correct entry_reason.
- Each exit event has matching prior active state and ratio ≥0.65.
- No duplicate ACTIVE without intervening exit.

## Data Consistency Queries
```sql
-- Orphan enter events
SELECT unit_id FROM enter_events e
LEFT JOIN states s ON e.unit_id=s.unit_id
WHERE e.timestamp > s.last_exit_timestamp AND s.current_state!='ACTIVE';

-- Missing exit
SELECT unit_id FROM states
WHERE current_state!='ACTIVE'
AND last_exit_snapshot_id IS NULL
AND first_active_snapshot_id IS NOT NULL;
```

## Performance Target
- p95 state update batch (N units <=200): < 150ms.

## Audit Reconstruction
Procedure: replay snapshot series & compare reconstructed events vs stored events; mismatch tolerance = 0.

## Failure Handling
- Snapshot invalid flag -> skip update; log reason.
- Divergent parameters vs config -> warn; after 2 builds fail CI.

End of test plan.