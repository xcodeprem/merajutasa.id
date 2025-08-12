#!/usr/bin/env bash
# generate-phase-tracker.sh
# Purpose: Produce artifacts/phase-tracker.json reflecting current enforcement phase
# for principles.reference lint (Phase 0/WARN → Phase 1/ERROR → Phase 2/DENY).
#
# Inputs (env or args):
#  DEC_FILE=docs/governance/dec/DEC-20250812-03-principles-reference-activation.md
#  NOW (optional override, RFC3339 UTC). Default: current UTC.
#
# Extraction Assumption:
#  DEC file contains lines like:
#    phase_schedule:
#      phase0_start_utc: 2025-08-12T05:10:00Z
#      phase1_start_utc: 2025-08-14T05:10:00Z
#      phase2_start_utc: 2025-08-19T05:10:00Z
#
# If not present, script attempts to derive:
#  phase0_start = DEC file git commit timestamp
#  phase1_start = phase0_start + 48h
#  phase2_start = phase0_start + 168h  (7 * 24h)
#
# Output:
#  artifacts/phase-tracker.json
#
# Exit codes:
#  0 success
#  1 extraction failure / file missing
#  2 write failure

set -euo pipefail

DEC_FILE="${DEC_FILE:-docs/governance/dec/DEC-20250812-03-principles-reference-activation.md}"
NOW_OVERRIDE="${NOW:-}"

if [ ! -f "$DEC_FILE" ]; then
  echo "ERROR: DEC file not found: $DEC_FILE" >&2
  exit 1
fi

NOW_TS="${NOW_OVERRIDE:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"

# Try to parse explicit schedule
PHASE0=$(grep -E 'phase0_start_utc:' "$DEC_FILE" | awk '{print $2}' || true)
PHASE1=$(grep -E 'phase1_start_utc:' "$DEC_FILE" | awk '{print $2}' || true)
PHASE2=$(grep -E 'phase2_start_utc:' "$DEC_FILE" | awk '{print $2}' || true)

if [ -z "$PHASE0" ]; then
  # Fallback derive from git log (last commit touching DEC file)
  GIT_TS=$(git log -1 --format=%cI -- "$DEC_FILE" 2>/dev/null || true)
  if [ -z "$GIT_TS" ]; then
    echo "ERROR: Cannot derive commit timestamp for $DEC_FILE" >&2
    exit 1
  fi
  PHASE0="$GIT_TS"

  # Use python or date arithmetic for portability
  # Add 48h & 168h
  PHASE1=$(date -u -d "$PHASE0 +48 hours" +%Y-%m-%dT%H:%M:%SZ)
  PHASE2=$(date -u -d "$PHASE0 +168 hours" +%Y-%m-%dT%H:%M:%SZ)
fi

# Determine current phase
ts_to_epoch() {
  date -u -d "$1" +%s
}

NOW_E=$(ts_to_epoch "$NOW_TS")
P0_E=$(ts_to_epoch "$PHASE0")
P1_E=$(ts_to_epoch "$PHASE1")
P2_E=$(ts_to_epoch "$PHASE2")

CURRENT_PHASE=""
if [ "$NOW_E" -lt "$P1_E" ]; then
  CURRENT_PHASE="PHASE_0_WARN"
elif [ "$NOW_E" -lt "$P2_E" ]; then
  CURRENT_PHASE="PHASE_1_ERROR"
else
  CURRENT_PHASE="PHASE_2_DENY"
fi

secs_until() {
  local target="$1"
  local tgt_e
  tgt_e=$(ts_to_epoch "$target")
  if [ "$tgt_e" -le "$NOW_E" ]; then
    echo 0
  else
    echo $((tgt_e - NOW_E))
  fi
}

UNTIL_P1=$(secs_until "$PHASE1")
UNTIL_P2=$(secs_until "$PHASE2")

mkdir -p artifacts

cat > artifacts/phase-tracker.json <<EOF
{
  "generated_utc": "$NOW_TS",
  "dec_file": "$DEC_FILE",
  "phase0_start_utc": "$PHASE0",
  "phase1_start_utc": "$PHASE1",
  "phase2_start_utc": "$PHASE2",
  "current_phase": "$CURRENT_PHASE",
  "seconds_until_phase1": $UNTIL_P1,
  "seconds_until_phase2": $UNTIL_P2,
  "policy": {
    "phase0": "WARN (informational only)",
    "phase1": "ERROR (blocks merges unless override)",
    "phase2": "DENY (strict block)"
  },
  "notes": "Derived schedule if not explicitly defined; adjust DEC with explicit phase*_start_utc fields to override derivation."
}
EOF

echo "[phase-tracker] Generated artifacts/phase-tracker.json (phase=$CURRENT_PHASE)"