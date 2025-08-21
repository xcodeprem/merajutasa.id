## Copilot instructions for merajutasa.id

Purpose: fast onboarding for AI agents in this governance/integrity repo. Prefer existing npm scripts and deterministic JSON outputs.

Big picture

- Governed docs live in `docs/**`, anchored by `docs/integrity/spec-hash-manifest-v1.json` (hashes, `mutable_policy`, `next_change_requires_dec`). DEC files in `docs/governance/dec/**` are immutable. Evidence is written to `artifacts/` and published to Pages.

Core services (local)

- Signer 4601: `npm run service:signer` → GET `/pubkey`, POST `/sign { payload }` → `{ canonical, hash_sha256, signature }`.
- Chain 4602: `npm run service:chain` → POST `/append { canonical, signature, publicKeyPem }` (idempotent by content hash); persists `artifacts/chain.ndjson`, `artifacts/chain.json`, `artifacts/chain-head.json`.
- Collector 4603: `npm run service:collector` → POST `/ingest` (and `/ingest-batch`); validates `schemas/events/public-event-v1.json`, computes `integrity.event_hash`, redacts feedback PII, enforces taxonomy from `docs/analytics/event-schema-canonical-v1.md`.

Governance pipeline (code-derived)

- `npm run governance:verify` executes ordered steps (critical unless noted):
 1) spec-hash-diff (strict or auto-seal allowlist), 2) param-integrity, 3) param-lock, 4) fairness unit tests,
 5) security-patterns-smoke (advisory but gated via `tools/policy/policy.json` HIGH>0), 6) hype-lint (advisory),
 7) disclaimers-lint (critical), 8) privacy tools (scan/metrics/asserts), 9) dec-lint (critical), 10) principles-impact (advisory),
 11) event validate/collector tests (advisory), 12) policy aggregation enforce (critical) using `artifacts/aggregation-cells-allow.json`,
 13) evidence-freshness (advisory), 14) evidence-collision (critical), 15) fairness-sim/metrics (advisory),
 16) no-silent-drift (critical), 17) governed-change-scan (critical), then aggregation to `artifacts/governance-verify-summary.json`.

Spec-hash rules

- Modes: `verify|seal-first|accept`. DEC files are hashed canonically (ignores `hash_of_decision_document` during compute) and backfilled on `seal-first`/`accept`.
- Auto-seal: if violations are only hash mismatches on allowlisted paths, governance will auto-accept via `docs/integrity/auto-seal-allowlist.json` (defaults include `README.md`).

Param integrity

- Compares `docs/fairness/hysteresis-config-v1.yml` and DEC matrix `docs/governance/dec/DEC-20250812-04-governance-baseline-thresholds.md` against code constants.
- Key params checked: `T_exit`, `T_enter_standard/major`, `cooldown_snapshots_after_exit`, `stalled_window_snapshots`, `anomaly_delta_threshold_equity_ratio`, plus DEC-only items (evidence hash length, revocation codes/count, terminology trigger). Any mismatch/missing → hard fail.

Disclaimers lint

- Reads `content/disclaimers/{master.json,bindings.json,config.yml}`; enforces presence per page bindings, detects drift/duplication, and banned-phrase proximity with safe-context whitelist from config. Outputs `artifacts/disclaimers-lint.json` (SARIF optional).

Conventions

- Deterministic JSON only: use `tools/lib/json-stable.js` (`stableStringify`, `addMetadata`). Respect manifest `mutable_policy` (append-only vs immutable). If `next_change_requires_dec=true`, add a DEC and link via `dec_ref` or delta file.

Extras

- If signer/chain are up, governance optionally signs a summary of `spec-hash-diff.json` and appends to the chain (writes `artifacts/chain-append-latest.json`).

PR/CI

- Workflows: `.github/workflows/ci-guard.yml`, `h1-guard.yml`, `pages.yml`. Use PR template `.github/PULL_REQUEST_TEMPLATE/workflow.md`. Labels: `npm run pr:labels`.

Run quickly

- Install/tests: `npm ci`; `npm run lint`; `npm run test:governance` (or `npm run governance:verify`). Demo: `npm run chain:append`.

See also onboarding: `docs/onboarding/agent-bootstrap-manifest.md`, `agent-role-policy-v1.md`, `agent-guardrails-v1.md`.

Environment toggles

- `DISC_BOOTSTRAP=1` downgrades disclaimers-lint exit (still writes artifact).
- `SPEC_HASH_SARIF=1` emits SARIF for spec-hash diff. `POLICY_CELLS_PATH` can override cells file for policy aggregation enforce.
 	- Windows PowerShell note: set env vars per-session via `$env:SIGNER_PORT=4605; $env:CHAIN_PORT=4606; $env:COLLECTOR_PORT=4607`.

Key artifacts

- `artifacts/spec-hash-diff.json`, `param-integrity-matrix.json`, `disclaimers-lint.json`, `privacy-asserts.json`, `policy-aggregation-threshold.json`, `no-silent-drift-report.json`, `governance-verify-summary.json`.

Health endpoints

- Signer: GET `/pubkey`, `/pubkeys`
- Chain: GET `/health`, `/head`, `/chain`
- Collector: GET `/health`, `/stats`

Service ports (override via env)

- `SIGNER_PORT=4601`, `CHAIN_PORT=4602`, `COLLECTOR_PORT=4603`

Artifacts map (common outputs)

- Chain: `artifacts/chain.json`, `artifacts/chain.ndjson`, `artifacts/chain-head.json`
- Events: `artifacts/ingested-events.ndjson`, pipeline hash: `artifacts/event-pipeline-hash.json`
- Compliance Week 6: assessments in `artifacts/compliance/assessments/*.json`, audit trail in `artifacts/audit/*.ndjson`
- Week 6 tests: `artifacts/week6-component-{imports,contracts,smoke}-test.json`
- Phase trackers/status: `artifacts/phase*-*.json`

Quick start recipes

- Core trio smoke:
 1) Append via signer→chain: `npm run chain:append`
 2) Start collector then ingest: run `npm run service:collector` (separate shell), then `npm run collector:smoke`
- Governance E2E: `npm run governance:verify` → check `artifacts/governance-verify-summary.json`
- Policy aggregation enforce: `npm run policy:aggregation:enforce:allow` (deny variant available)

Phase 2 Week 6 – Compliance & Security flows

- Orchestrator: `npm run compliance:orchestrator`
- Audit System: `npm run audit:start` → run flows → `npm run audit:report` → `npm run audit:flush` (optional)
- Compliance Automation: `npm run compliance:automation` (add `--generate-report` to emit assessments)
- Privacy Rights: `npm run privacy:rights` (flags: `--process-request`, `--generate-report`)
- Security Hardening: `npm run security:scan` (or `npm run security:threats`)

Observability, performance, HA, API gateway

- Observability: `npm run observability:start`; health: `npm run observability:health-check`; metrics/tracing/alerting/anomaly/dashboards via respective `*:start`
- Performance: `npm run performance:start`; health/report: `npm run performance:health-check` / `npm run performance:report`
- HA: `npm run ha:start-all` (or individual status scripts); DR/multi-region helpers available
- API Gateway: `npm run api-gateway:start`; status: `npm run api-gateway:status`; metrics: `npm run api-gateway:metrics`

Reverse proxy

- Reverse proxy: `npm run infra:generate-certs` then `npm run infra:nginx` (requires Bash/WSL or Git Bash on Windows; `infra:nginx` uses `$(pwd)` and POSIX quoting)

Public UI (equity-ui-v2)

- From repo root: `npm run equity-ui-v2:install` → `npm run equity-ui-v2:dev` (or `:build`/`:preview`); smoke: `npm run test:equity-ui-smoke`

Troubleshooting

- If ports busy, stop prior jobs or override `*_PORT` envs
- If `security:scan` fails, inspect output from `infrastructure/security/enhanced/security-hardening.js` and recent `artifacts/audit/*.ndjson`
- If collector rejects events (UNKNOWN_EVENT), ensure schema doc whitelist and `artifacts/event-pipeline-hash.json` exist; run `npm run events:pipeline:hash`
- Observability logs module is optional; if `logs:start` isn’t available, proceed with metrics/tracing/alerting/anomaly/dashboards

First 5 minutes (agent runbook)

1) Verify governance: run lint + `governance:verify`; check `artifacts/governance-verify-summary.json`
2) Core trio smoke: run `chain:append` (signer+chain) and `collector:smoke` (collector)
3) Week 6 smoke: run `test:week6` and inspect `artifacts/week6-component-*.json`
4) Health sweep: `observability:health-check`, `api-gateway:status`, `performance:health-check`, `ha:system-health`
5) If anything fails, see “Quick diagnosis” below

Which script to run when

- Need hashes/spec integrity? → `governance:verify`, `spec-hash:verify|seal`
- Validate disclaimers/privacy? → `lint:disclaimers`, `privacy:scan|metrics|asserts`
- Exercise Week 6 flows? → `compliance:orchestrator`, `audit:*`, `compliance:automation`, `privacy:rights`, `security:scan`
- Troubleshoot event pipeline? → `events:pipeline:hash`, `events:validate`, `collector:reliability`, `test:collector`
- API layer checks? → `api-gateway:status|metrics`, `service-mesh:health|topology`
- HA/resilience checks? → `ha:start-all`, `ha:*status`, `week5:demo`

Minimal request payload shapes (contracts)

- Signer POST /sign
 	- Input: `{ payload: object|string }`
 	- Output: `{ canonical: string, hash_sha256: string, signature: base64, alg: "Ed25519" }`
- Chain POST /append
 	- Input: `{ canonical: string, signature: base64, publicKeyPem: string }`
 	- Output: `{ seq, prevHash, contentHash, signature, canonical, ts }` (idempotent on contentHash)
- Collector POST /ingest
 	- Input: `{ event: { event_name, occurred_at, received_at, meta?, ... } }` (defaults auto-filled; `integrity.event_hash` computed)
 	- Output: `{ status: 'INGESTED', event_hash, prohibited_meta: boolean, meta_valid: boolean }`
 	- Schema: `schemas/events/public-event-v1.json`; whitelist driven by `docs/analytics/event-schema-canonical-v1.md`
- Collector POST /ingest-batch
 	- Input: NDJSON (one JSON per line) or a JSON array of events
 	- Output: `{ status: 'BATCH_DONE', ingested: number, errors: number }`
 	- Notes: Unknown events yield `UNKNOWN_EVENT` on single ingest; batched mode counts such lines as errors.

Common failure quick diagnosis

- Governance fail → Read `artifacts/*-report.json` referenced in the summary; check DEC refs and `docs/integrity/spec-hash-manifest-v1.json`
- Unknown event (collector) → Ensure `artifacts/event-pipeline-hash.json` exists or rerun `events:pipeline:hash`; confirm event name in schema doc
- Security scan exit!=0 → Inspect `infrastructure/security/enhanced/security-hardening.js` output and recent `artifacts/audit/*.ndjson`
- Ports in use → Stop prior shells/background jobs or set `SIGNER_PORT/CHAIN_PORT/COLLECTOR_PORT`
- UI dev errors → Run `equity-ui-v2:install`; then `equity-ui-v2:dev` (Node 18+). Use `test:equity-ui-smoke` for a quick check

Quality gates quick run

- Lint/docs: `npm run lint`
- Governance core: `npm run governance:verify`
- Services/integration: `npm run test:services`
- Infrastructure (incl. Week 6): `npm run test:infrastructure` or `npm run test:week6`

Agent behavior quick checklist

- Prefer repo scripts over ad-hoc commands; write deterministic JSON to `artifacts/`
- Respect governed files’ `mutable_policy` and DEC immutability
- Avoid editing DEC files; create new DEC for semantic changes and link via `dec_ref`
- Sanitize PII and ensure disclaimers presence per `content/disclaimers/*`
- Add small evidence and status artifacts for actions; keep outputs stable and minimal
