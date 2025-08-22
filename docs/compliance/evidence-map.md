# Compliance Evidence Map (v1)

Purpose: Provide a clear map from controls to concrete evidence artifacts, retention, and owners.

Scope: SOC 2 (Security, Availability, Confidentiality), ISO 27001 core clauses (selected), and privacy touchpoints.

## Control → Evidence → Location → Retention → Owner

- SOC2 CC7.2: Incident Response
  - Evidence: `docs/security/incident-response.md`, incident postmortems, decision logs
  - Location: `artifacts/audit/incidents/*`
  - Retention: 1y (Sev‑1/2), 6m (Sev‑3)
  - Owner: Security Lead, IC

- SOC2 CC6.x: Access/Change
  - Evidence: RBAC policy, API gateway authZ logs, change approvals (DEC links)
  - Location: `infrastructure/api-gateway/*`, `artifacts/equity-decision-log.json`, `docs/governance/dec/*`
  - Retention: 1y
  - Owner: Platform/Security

- SOC2 A1: Monitoring controls
  - Evidence: observability alert rules, alerts fired snapshots, dashboards snapshots
  - Location: `artifacts/observability-alert-rules.json`, `artifacts/observability-alerts-fired.json`, `artifacts/dashboards-snapshot.json`
  - Retention: 1y
  - Owner: Platform

- ISO 27001 A.12.4: Logging & Monitoring
  - Evidence: standardized security telemetry schema, log aggregation outputs
  - Location: `infrastructure/observability/common/security-telemetry-schema.js`, `artifacts/logs/*`
  - Retention: 90d unless legal hold
  - Owner: Security/Platform

- ISO 27001 A.10: Cryptographic controls
  - Evidence: KEK/DEK rotation proof, schema validation, rotation runbook
  - Location: `artifacts/secrets-rotation-evidence.json`, `docs/security/secrets-rotation.md`
  - Retention: 1y
  - Owner: Security

- ISO 27001 A.17 / SOC2 A1: Business continuity & Availability
  - Evidence: HA system health, policy drift, backup logs
  - Location: `artifacts/ha-system-health.json`, `artifacts/ha-policy-drift-report.json`, `artifacts/backups/*`
  - Retention: 1y
  - Owner: Platform/SRE

- Privacy (DSR & Audit)
  - Evidence: DSR flow logs and reports; audit trail
  - Location: `artifacts/privacy/requests/*.json`, `artifacts/audit/*.ndjson`
  - Retention: per privacy policy (≥ 1y recommended)
  - Owner: Privacy/DPO

## Evidence Integrity & Linking

- All JSON artifacts are deterministic using stable stringify utilities where applicable.
- Link incidents and DECs via `dec_ref` in governance to prevent silent drift.
- Use `artifacts/next-steps/*` for post‑incident action tracking.

## Tabletop Validation

- Run `npm run observability:validate` to generate alert rules and fired snapshots.
- Create a mock incident folder `artifacts/audit/incidents/INC-YYYYMMDD-01/` and copy relevant artifacts.
- Verify evidence completeness against this map (PASS when all referenced items present).
