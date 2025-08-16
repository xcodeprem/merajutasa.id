# PII Hash Salt Rotation Policy (Internal Ops)

Status: Active (H1)
Scope: tools/config/privacy-policy.json (hash_salt, previous_salts[], last_rotated_utc)

Overview

- Frequency: Daily at 08:00 UTC (cron) with manual trigger allowed
- Retention: Keep last 14 salts in previous_salts
- Source of truth: privacy-policy.json in repository
- Automation: GitHub Actions workflow `.github/workflows/pii-salt-rotation.yml`


Workflow Behavior

- Rotates hash_salt and updates last_rotated_utc (UTC ISO8601)
- Creates/updates branch `chore/pii-salt-rotation`
- Opens/updates PR to `main`
- Uploads artifact `pii-salt-rotation.json` into the workflow run


Authentication

- Uses `GITHUB_TOKEN` by default
- Falls back to `PAT_ROTATION` (repo secret) for PR creation when org policy blocks GITHUB_TOKEN-initiated PRs
- Recommended PAT scope: Fine-grained, repository-limited; permissions: Contents (Read/Write), Pull requests (Read/Write)


Operational Notes

- Do not commit salts manually—prefer running the rotation workflow (manual dispatch permitted)
- If PR is not created, check workflow summary for guidance (likely missing PAT permissions)
- Keep retention window at 7 unless privacy review approves change


Security Guidance

- Treat salts as sensitive configuration
- Rotate immediately if suspected exposure; verify PR created and merged
- Validate that `previous_salts` does not contain developer placeholders in production


References

- Roadmap H1: Privacy & Security (PII Salt Rotation Cron)
- File: `.github/workflows/pii-salt-rotation.yml`
- File: `tools/config/privacy-policy.json`
