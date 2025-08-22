# Security Policy Inventory – Zero‑Trust Controls Mapping

Purpose

- Provide a concise inventory of zero‑trust security controls and map them to Phase 2 Week 6 compliance/security components.
- Ensure there are no “unknown” cells; each control/component pair is marked Implemented, Partial, Planned, or N/A.

Scope and sources

- Control domains covered: Authentication (authN), Authorization (authZ), Rate limiting, Input validation (incl. schema validation and sanitization).
- Components included reflect Week 6 compliance/security scope and adjacent services:
  - API Gateway
  - Collector (events pipeline)
  - Chain (append‑only ledger)
  - Signer (Ed25519)
  - Compliance Automation
  - Compliance Orchestrator
  - Audit System
  - Privacy Rights Management
  - Security Hardening (infra/policies)
  - Equity UI v2 (public UI)
  - Observability & Performance
  - High Availability (HA) / Service Mesh
- References: phase‑2 Week 6 docs (delivery and team guides), infrastructure security/enhanced, and existing repo scripts.

Status legend

- Implemented: Present and enforced by code/config with evidence.
- Partial: Exists but limited in scope or needs extension.
- Planned: Accepted gap with near‑term plan to implement.
- N/A: Not applicable to the component’s trust boundary/function.

## Controls ➜ Components matrix

| Control \\ Component | API Gateway | Collector | Chain | Signer | Compliance Automation | Compliance Orchestrator | Audit System | Privacy Rights | Security Hardening | Equity UI v2 | Observability & Perf | HA / Service Mesh |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Authentication (authN) | Planned (gateway token/mTLS) | Planned | Planned | Planned | N/A (internal batch) | N/A (coordination only) | N/A (log sink) | Partial (requester identity verification) | N/A | Planned (end‑user login) | N/A | Planned (mesh/mTLS) |
| Authorization (authZ) | Planned (route RBAC) | Planned (ingest role) | Planned (append role) | Planned (sign role) | N/A | N/A | N/A | Partial (scope‑limited actions) | N/A | Planned (role‑based UI features) | N/A | Planned (service‑to‑service RBAC) |
| Rate limiting | Planned (per‑IP/per‑token) | Planned (ingest throttles) | Planned | Planned | N/A | N/A | N/A | Planned (subject request throttles) | N/A | Partial (client‑side only; advisory) | N/A | Planned (global & per‑route) |
| Input validation | Partial (header/path pass‑through) | Implemented (schema + PII redaction) | Partial (canonical content checks) | Partial (payload type/size) | Partial (config validation) | Partial (pipeline args) | Implemented (structured audit events) | Implemented (identity/data fields) | N/A | Partial (client‑side validation) | N/A | N/A |

Notes (evidence pointers)

- Collector: Validates events per `schemas/events/public-event-v1.json`, computes `integrity.event_hash`, redacts PII; taxonomy enforced via `docs/analytics/event-schema-canonical-v1.md`.
- Security Hardening (infra): Security scan scripts present (see `infrastructure/security/enhanced/security-hardening.js` via repo scripts); zero‑trust elements like pinning, headers, baseline hardening are handled at infra level, not per‑component controls above.
- UI: Validation exists client‑side; server‑side enforcement should live behind API Gateway/Collector.

## Gaps and remediation plan

Near‑term priorities (PR gating via Security Policy Gate is active; artifacts from CodeQL/Gitleaks/OSV/SBOM/Semgrep feed the gate):

1) API Gateway
   - authN: Introduce mTLS or JWT validation at gateway. Status: Planned → Target: Partial in 1 sprint.
   - authZ: Define route‑level RBAC. Status: Planned → Target: Partial.
   - rate limiting: Enable per‑route and per‑token quotas. Status: Planned → Target: Partial.

2) Collector
   - authN/authZ: Require signed tokens or keyed client access for ingest. Status: Planned → Target: Partial.
   - rate limiting: Apply per‑source throttles. Status: Planned → Target: Partial.

3) Chain & Signer
   - authN/authZ: Restrict append/sign endpoints to trusted callers; consider mTLS. Status: Planned → Target: Partial.
   - rate limiting: Basic throttles on append/sign. Status: Planned → Target: Partial.

4) Privacy Rights
   - authN/authZ: Strong requester identity proofing and scope checks. Status: Partial → Target: Implemented.

5) UI v2
   - authN/authZ: Add login + role enforcement in API‑backed flows. Status: Planned → Target: Partial.

Dependencies and alignment

- Align allowlist/exception handling with ADR-0006.
- Keep CI gates (CodeQL, Gitleaks, OSV, SBOM, Semgrep, Policy Gate) as Required checks in branch protection.
- Validate via existing scripts: `npm run compliance:orchestrator`, `npm run compliance:audit`, `npm run security:scan`, `npm run privacy:rights`, `npm run governance:verify`, `npm run spec-hash:verify`, `npm run param:integrity`, `npm run week6:status`, `npm run sla:status`, `npm run observability:start`, `npm run docker:status`, `npm run k8s:status`, `npm run ha:system-health`.

## Success criteria statement

- Matrix above contains no “unknown” statuses. Each control/component is tagged as Implemented, Partial, Planned, or N/A.
- Gaps are explicitly listed with a near‑term target state.

## Change log (governance note)

- New governed doc: docs/security/policy-inventory.md. If manifest requires DEC linkage for future changes, add DEC and reference it here.
