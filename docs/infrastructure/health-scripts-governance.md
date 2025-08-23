# Health Scripts Governance: Categories & Usage

This document standardizes how to run health checks across infrastructure and how outputs are governed.

Scope

- Scripts: tools/integrated-health-check.js, tools/infra/health-check-all.js, tools/infra/health-bundle.js
- Artifacts: artifacts/integrated-health-check-report.json, artifacts/infra-health-*.json, artifacts/infra-health-bundle.json

Categories

- observability, performance, api-gateway, high-availability, compliance, security, monitoring, integrations, dependencies

Usage

- npm run health:check → integrated health report (deterministic JSON)
- npm run infra:health:all → category health details/summary/matrix
- npm run infra:health:<category> → single category (see categories list)
- npm run infra:health:bundle → full bundle that combines integrated + categories

Determinism & Governance

- All JSON artifacts are written via tools/lib/json-stable.js stableStringify + addMetadata
- No secrets or PII are emitted; metrics are coarse and bounded
- Files in artifacts/ are considered evidence; CI can diff against baselines

Exit Behavior

- Category checks use fail-soft by default: artifacts are produced even if components fail
- Security scan is handled fail-soft to avoid flaky CI breaks; status remains visible in summary

CI Integration

- Add npm run test:infrastructure (already present) which invokes infra:health:all
- Include infra:health:bundle in nightly to track trends end-to-end
