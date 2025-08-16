# Phase Tracker PR automation (ops)

This workflow generates `artifacts/phase-tracker.json` and, when it changes, opens a pull request instead of pushing directly to `main` (to respect branch protections).

- Auth behavior:
  - If a repository secret named `PHASE_TRACKER_TOKEN` is present, the workflow uses it to create/update the branch `chore/phase-tracker` and open/update a PR.
  - If the secret is missing, the workflow completes successfully but skips the PR step (no failure, no push). This keeps CI green under restricted tokens.

## Required secret (recommended)

- Name: `PHASE_TRACKER_TOKEN`
- Type: Fine-grained Personal Access Token (PAT) scoped to this repository only.
- Minimum permissions:
  - Contents: Read and Write
  - Pull requests: Read and Write

Setup: Repository Settings → Security → Secrets and variables → Actions → New repository secret → add `PHASE_TRACKER_TOKEN` with the PAT value.

Security notes:

- Prefer a Fine-grained PAT with the least privileges and repository scoping.
- Rotate regularly and revoke if leaked; store only as a GitHub Actions secret.

### Troubleshooting

- Symptom: Logs show `Permission denied to github-actions[bot]` or `GITHUB_TOKEN: contents=read` and PR creation fails.
  - Cause: Org/repo policy restricts the default `GITHUB_TOKEN` from pushing branches.
  - Fix: Add `PHASE_TRACKER_TOKEN` as above. The workflow already avoids using persisted default credentials.

- Symptom: PR step is marked `skipped` in the job steps.
  - Cause: `PHASE_TRACKER_TOKEN` not configured.
  - Expected: Workflow remains green; no PR is created.

### Notes

- The workflow uploads the generated artifact for visibility even when PR creation is skipped.
- Branch name convention: `chore/phase-tracker`.
