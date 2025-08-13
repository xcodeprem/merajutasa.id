# Equity Snapshot Pseudocode (Draft)

Goal: Deterministic daily snapshot with equity_index (1 - Gini) and bucket counts.

```pseudo
input: events (verified credential interactions, hero interactions), period=24h
params: decimals=2 (round half up), anomaly_delta_threshold=0.03

function compute_equity_snapshot(events):
  buckets = aggregate_by_unit(events)  # map unit -> exposure_count
  total = sum(buckets.values())
  if total == 0: return empty_snapshot()
  # Compute distribution vector p_i = count/total sorted ascending
  v = sort([count for count in buckets])
  n = len(v)
  cumulative = 0
  lorenz_area = 0
  for i, count in enumerate(v):
    prev_cum = cumulative
    cumulative += count
    # trapezoid area between points (i/n, prev_cum/total) -> ((i+1)/n, cumulative/total)
    lorenz_area += ( (prev_cum/total) + (cumulative/total) ) / 2 * (1/n)
  gini = 1 - 2 * lorenz_area
  equity_index_raw = 1 - gini
  equity_index = round_half_up(equity_index_raw, 2)
  timestamp = now_iso8601()
  # anomaly detection (delta vs previous snapshot equity_index)
  prev = load_previous_equity_index()
  anomaly = false
  if prev != null and abs(equity_index_raw - prev.raw) > 0.03:
    anomaly = true
    log_anomaly(prev.raw, equity_index_raw)
  return {
    "timestamp": timestamp,
    "equity_index": equity_index,
    "equity_index_raw": equity_index_raw,
    "units": buckets,
    "anomaly": anomaly
  }
```

Notes:

- Maintain raw value for internal audit (not rounded) but publish 2-decimal field.
- Use stable sorting & float normalization to avoid hash drift.
