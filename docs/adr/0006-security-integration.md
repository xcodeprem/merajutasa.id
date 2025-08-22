# ADR-0006: Security Configuration for Compliance Integration

## Context

New compliance components require repository-level security controls (SAST, SCA, secrets hygiene, SBOM, CI hardening).

## Decision

- Adopt baseline controls:
  - CodeQL (SAST) for primary languages
  - Dependabot for dependency hygiene
  - Secret scanning via Gitleaks (CI) + GitHub native
  - SBOM (Syft) as build artifact
  - Optional: Semgrep (policy-as-code rules)
- CI gates:
  - Block merge on High/Critical findings (configurable)
  - Exception via documented allowlist + CODEOWNERS approval

## Consequences

- Improved security posture with auditable evidence (workflows + artifacts).

## Acceptance Criteria

- Required workflows exist and run on PR.
- Required status checks configured on default branch.
