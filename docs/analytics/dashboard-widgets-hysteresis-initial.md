# Analytics Widgets Specification – Hysteresis (Initial Post DEC-20250812-02)

## Data Sources

- Events: sys_fairness_under_served_enter, sys_fairness_under_served_exit
- Snapshot table: equity_snapshots (ratios)
- State table: hysteresis_states (current + audit fields)

## Widgets

1. Active Under‑Served Count
   query: count(distinct unit_id) where current_state='ACTIVE' (exclude STALLED counted separately)
2. New Entries (24h)
   query: count(*) from sys_fairness_under_served_enter where occurred_at >= now-24h
3. Entry Reason Split
   query: severe_count vs consecutive_count (stacked bar)
4. Average Borderline Entry Delay
   delay = first_active_snapshot_index - first_raw_flag_snapshot_index for entryReason=consecutive
5. Churn Rate (30d rolling)
   churn = re_entries(last 30d) / distinct_units_active(last 30d)
6. Stalled Units
   count(current_state='STALLED')
7. Persistence Distribution
   histogram(flag_duration_snapshots) buckets: 1,2,3-4,5-7,8+
8. Exit Recovery Strength
   distribution of r_exit ratio (how far above 0.65)
9. Anomaly Correlation
   count(anomalies affecting active units) / count(active units)
10. Under‑Served Coverage %
   active_under_served_count / total_units

## Alert Thresholds

- churnRate > 0.25 → raise MEDIUM alert
- stalledUnits / activeUnderServed > 0.30 → review support intervention
- severeEntries share > 0.40 persist 7d → structural shortage investigation

End of widget spec.
