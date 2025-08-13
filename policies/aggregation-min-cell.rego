package policies.aggregation

# DENY publish/report when any cell (after suppression filters) has count < threshold.

import data.params.aggregation as agg

deny[msg] {
  threshold := agg.min_cell_threshold
  some cell
  input.cells[cell].count < threshold
  msg := sprintf("aggregation.min_cell_threshold violation: cell=%v count=%v < %v", [cell, input.cells[cell].count, threshold])
}

# Allow explicit override only if tagged by governance DEC id in input.override_dec
allow_override {
  input.override_dec == "DEC-20250812-04"
}

deny[msg] {
  input.override_dec != ""
  input.override_dec != "DEC-20250812-04"
  msg := sprintf("Invalid override DEC id %v for min_cell_threshold", [input.override_dec])
}
