# Spec-hash repair plan (2025-08-22)

Context

- governance:verify and spec-hash:verify currently fail due to many hash mismatches across governed files.
- Auto-sealed allowlisted README via spec-hash accept; violations reduced but DEC and governed-doc drifts remain.
- See artifacts/spec-hash-diff.json and artifacts/spec-hash-summary.json for the latest details.

What to do next

1) Decision files (immutable)
   - For DEC files under docs/governance/dec/** showing DEC_CANONICAL_HASH_MISMATCH or DEC_INTERNAL_HASH_DIFFERS:
     - Do NOT edit old DEC documents. Restore their content to the version whose hash matches the manifest.
     - If changes are truly needed, create a new DEC describing amendments; the original DEC remains unchanged.

2) Non-DEC governed files with next_change_requires_dec=true
   - Draft a new DEC to approve the current content state and enumerate the affected paths.
   - Update the manifest by accepting the new hashes for those specific paths and add dec_ref linking to the new DEC id.

3) Allowlist already handled
   - README.md was auto-sealed per allowlist. No further action needed for that file.

4) Placeholders
   - None detected. If any appear later, run seal-first to backfill placeholders (DEC field will be backfilled as needed).

5) Re-run checks and publish evidence
   - Re-run governance:verify and spec-hash:verify; ensure artifacts/spec-hash-diff.json shows zero violations.
   - Keep SPEC_HASH_SARIF=1 if SARIF output is useful for code scanning ingestion (artifacts/spec-hash-diff.sarif.json).

Notes

- DEC immutability: never mutate prior DEC files; prefer a new DEC and revert accidental edits to historical DEC.
- Keep changes deterministic; only update manifest hashes for explicitly approved paths.
