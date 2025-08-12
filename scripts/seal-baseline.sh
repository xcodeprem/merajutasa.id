#!/usr/bin/env bash
# One-time baseline sealing script (run locally or in CI workflow_dispatch before Phase 1).
# Preconditions:
#  - Manifest final & committed with <PENDING_HASH> placeholders
#  - DEC files contain hash_of_decision_document: "<PENDING_HASH>"
#  - Banners for archive files present

set -euo pipefail

echo "[seal-baseline] Step 1: Run seal-first mode"
node tools/spec-hash-diff.js --mode=seal-first

if grep -R "<PENDING_HASH>" docs/integrity/spec-hash-manifest-v1.json >/dev/null 2>&1; then
  echo "ERROR: Some placeholders remain after seal-first (manifest)."
  exit 1
fi

if grep -R "<PENDING_HASH>" docs/governance/dec/ >/dev/null 2>&1; then
  echo "ERROR: Some DEC placeholders remain."
  exit 1
fi

echo "[seal-baseline] Step 2: Create audit snapshot of PR template line count"
./scripts/generate-pr-template-line-audit.sh

echo "[seal-baseline] Step 3: Verify mode"
node tools/spec-hash-diff.js --mode=verify

echo "[seal-baseline] SUCCESS: Baseline sealed."
echo "Commit the following changes:"
echo " - docs/integrity/spec-hash-manifest-v1.json"
echo " - updated DEC files with hash_of_decision_document"
echo " - artifacts/spec-hash-diff.json"
echo " - docs/governance/audit/pr-template-line-audit-<timestamp>-posthash.md"
echo "Then push & (optionally) tag baseline."