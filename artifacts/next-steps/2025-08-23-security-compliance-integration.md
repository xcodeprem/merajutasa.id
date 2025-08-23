# Next steps: Security + Compliance integration (2025-08-23)

- Governance spec-hash violations present (68) — consider seal-first on allowlist or add DEC refs, then re-run governance:verify.
- API Gateway status failed due to ESM import of ajv on Node v22 — pin Node >=18 <=20 in local env or add dynamic import fallback.
- Audit CLI subcommands return code 1 when idle; use orchestrator --generate-report to produce unified reports.
- Observability started (fallback mode) — dashboards on :3000; consider installing optional deps to improve signals.
- Service Mesh health artifact written at artifacts/service-mesh-health.json; standardize filename for drift checker.
- Run week6:integration-test for a compact compliance+security+privacy flow.
