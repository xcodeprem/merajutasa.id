# Infra Health Triage Runbook

Purpose: Provide a fast path to diagnose failures across 35+ components using deterministic artifacts.

Inputs

- artifacts/integrated-health-check-report.json (overall summary + recommendations)
- artifacts/infra-health-*-summary.json (category summaries)
- artifacts/infra-health-bundle.json (optional: nightly bundle)

Status Mapping

- healthy → proceed
- warning → review configuration and metrics
- degraded → performance/partial outage; prioritize investigation
- critical/FAILED → immediate action; see component-specific steps

Dependency Order (startup)

1) fileSystem
2) signer, chain, collector
3) auditSystem, logAggregation
4) securityHardening, privacyRights, complianceAutomation
5) complianceOrchestrator, observability
6) haOrchestrator, apiGateway, performance

Common Triage Steps

- Core services down (signer/chain/collector): restart services; check ports 4601/4602/4603
- Security scan failed: inspect infrastructure/security/enhanced/security-hardening.js output; proceed if fail-soft
- API gateway degraded: verify service mesh health and core services
- Observability warnings: run npm run observability:validate to seed signals

Artifacts to Attach in Incidents

- integrated-health-check-report.json
- relevant infra-health-<category>-summary.json and -details.json
- service-specific logs (k8s: kubectl logs; docker: docker:logs script)

Remediation Recommendations

- For each critical component in recommendations list, perform bounce + config validation
- For degraded components, capture metrics snapshot and compare against baseline
