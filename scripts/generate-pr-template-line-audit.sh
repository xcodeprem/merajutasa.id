#!/usr/bin/env bash
# Generates a timestamped audit file capturing the PR template line count & simple hash.
set -euo pipefail

TEMPLATE=".github/pull_request_template.md"
if [ ! -f "$TEMPLATE" ]; then
  echo "ERROR: PR template not found at $TEMPLATE" >&2
  exit 1
fi

TS=$(date -u +"%Y-%m-%dT%H%M%SZ")
LINES=$(wc -l < "$TEMPLATE" | tr -d ' ')
SHA=$(sha256sum "$TEMPLATE" | awk '{print $1}')

OUT="docs/governance/audit/pr-template-line-audit-${TS}-posthash.md"
mkdir -p docs/governance/audit

cat > "$OUT" <<EOF
# PR Template Line Audit (Post Hash Seal)
Timestamp (UTC): ${TS}
File: ${TEMPLATE}
Total Lines: ${LINES}
SHA256: ${SHA}

Non-Removal Assertion: Jika jumlah baris berubah tanpa DEC yang sah, anggap drift & investigasi.

EOF

echo "[generate-pr-template-line-audit] Wrote $OUT"