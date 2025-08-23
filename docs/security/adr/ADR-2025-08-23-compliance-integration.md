# ADR-2025-08-23: Compliance Components Integration into Security Stack

Date: 2025-08-23
Status: Accepted
Deciders: Platform Security, Compliance Engineering
Context: Phase 2 Week 6 completion with new compliance components (audit system, compliance automation, privacy rights) requires hardening and governance wiring across API gateway, service mesh, CI gates, and deployment modes.

## Decision

Integrate the Compliance Orchestrator, Audit System, and Privacy Rights workflows into the security stack with zero‑trust enforcement, cryptographic integrity gates, and CI/automation.

## Changes Implemented

- Zero‑trust enforcement at API Gateway and Service Mesh:
  - API Gateway authN/authZ, rate limit, and input validation are enforced for compliance endpoints.
  - Mesh policies validated via health artifacts; errors fail governance checks.
- Cryptographic integrity gates preserved:
  - Governance verification, spec-hash integrity, and parameter integrity run in CI and locally.
  - Chain anchor optional for spec-hash summary when signer/chain are available.
- Compliance services wired into security automation:
  - compliance:orchestrator and compliance:audit triggered in security verification flows.
  - privacy:rights validated and reports emitted as evidence.
- Deployment parity:
  - Container/K8s/HA baselines validated with infra verification scripts. Failures block via governance gates and CI policies.
- Secret hygiene enhancements:
  - Root Gitleaks config added with safe exclusions and redaction.

## Evidence Artifacts (expected)

- artifacts/governance-verify-summary.json
- artifacts/compliance-orchestration/** (unified reports)
- artifacts/audit/*.ndjson and audit reports
- artifacts/privacy-asserts.json, privacy rights reports
- artifacts/service-mesh-health.json, api-gateway status
- artifacts/container-k8s-verify.json, k8s baseline validation outputs
- artifacts/ha-system-health.json

## Security Impact

- Reduced integration risk via policy-driven checks and artifacts
- Consistent enforcement across environments
- Faster incident triage with unified evidence and telemetry

## Rollback

- Revert ADR and remove the added config files; disable compliance hooks in CI scripts.

## Links

- docs/phase-2/PHASE-2-WEEK-6-DELIVERY-DOCUMENTATION.md
- docs/implementation/security/README.md
- SECURITY.md
