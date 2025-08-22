# Incident Response Playbook (IR v1)

Purpose: Standardize incident response (IR) for consistent, auditable handling across detection, triage, containment, eradication, recovery, and post‑incident review.

Scope: Applies to production and pre‑prod environments; includes security, privacy, availability incidents and suspected breaches.

## Roles and RACI

- Incident Commander (IC): accountable; leads response, status comms, decision log.
- Security Lead: responsible; triage, containment strategy, forensics coordination.
- SRE/Platform: responsible; infra actions, failover, performance stabilization.
- Product Owner: consulted; business impact, user comms draft, prioritization.
- Legal/Privacy: consulted; breach assessment, notification obligations.
- Comms/PR: consulted; external messaging if applicable.
- Data Protection Officer (DPO): informed; privacy incidents and DSR implications.

RACI quick map

- Detect/Triage: Security Lead (R), IC (A), SRE (C), Product (I)
- Contain/Eradicate: Security Lead (R), SRE (R), IC (A)
- Recover/Validate: SRE (R), IC (A), Product (C), Security (C)
- Post‑mortem/Actions: IC (A), Security (R), Product (C), SRE (C)

## SLAs and Targets

- MTTD target (P1 security): ≤ 15 min from first observable signal.
- MTTR target (P1 security): ≤ 4 hours to service restoration; ≤ 24h to full eradication.
- Initial user comms (if user-impacting): ≤ 60 min from IC declaration.

## Severity and Classification

- Sev‑1: Active exploit or major outage; customer data at risk/confirmed exposure.
- Sev‑2: Elevated risk or partial outage; suspicious activity requiring containment.
- Sev‑3: Low risk anomaly; no customer impact.

## Escalation Triggers

- Any alert matching HIGH/CRITICAL security telemetry severity.
- Unauthorized key use, chain integrity drop < 95%, auth failure spike, PII exfil attempts.
- Repeated service down alerts or SLA breach across two consecutive intervals.

## End‑to‑End Flow

1) Detect

- Sources: standardized security telemetry, alerting (intelligent-alerting), SLA breaches, external reports.
- Evidence: attach alert payloads, dashboards snapshot, logs excerpt to case.

1) Triage

- Validate signal quality; confirm scope/systems; classify severity.
- Create Incident Ticket (INC‑YYYYMMDD‑NN); start decision log.

1) Containment

- Short‑term: revoke credentials, block IPs, scale to isolate, feature flag disable.
- Long‑term: patch, rotate keys (KEK/DEK), hotfix.

1) Eradication

- Remove malicious artifacts, backdoor check, harden configs (PSS, seccomp, AppArmor).

1) Recovery

- Restore services, verify chain integrity >= 99%, error rate < 1%, CPU/Memory < 80%.
- Run governance:verify and privacy:asserts where relevant.

1) Post‑Incident Review

- Within 5 business days; produce blameless post‑mortem with 5 Whys and action items.
- Link to DEC if policy or parameter changes required (spec‑hash rules).

## Evidence & Retention

- Evidence bundle per incident under `artifacts/audit/incidents/INC-YYYYMMDD-NN/`
  - alert-rules.json, alerts-fired.json, dashboards-snapshot.json (from observability)
  - logs.ndjson (security and audit logs), chain-head.json, chain.json excerpt
  - privacy-requests (if applicable), secrets-rotation-evidence.json (if rotated)
  - decision-log.md, timeline.md, postmortem.md, remediation-plan.md
- Retention: 1 year for P1/P2 security incidents; 6 months for Sev‑3.
- Access: least privilege; privacy redactions applied to PII.

## Communications

- Internal updates: every 30–60 min during Sev‑1/2, then daily until close.
- External comms: coordinated via Legal/Comms; templates in `docs/playbooks/`.

## Tabletop Test Procedure

- Prepare: pick a recent alert set; freeze prod impact; assign roles.
- Execute: simulate auth_failed_spike + chain_integrity_low; walk through containment and rotation.
- Validate: ensure evidence folder populated, SLA status PASS after recovery, governance artifacts present.
- PASS criteria: all steps executed, artifacts present, decisions logged, action items tracked.

## Mappings to Controls

- ISO 27001 A.16 Incident Management; A.12.4 Logging & Monitoring.
- SOC 2 CC7.2 Incident Response; CC6.x Change/Access; AOC mapping maintained in `docs/compliance/evidence-map.md`.
- NIST 800-61 Rev.2 Computer Security Incident Handling Guide.
