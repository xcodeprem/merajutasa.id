## Copilot instructions for merajutasa.id

Purpose: fast onboarding for AI agents in this governance/integrity repo. Prefer existing npm scripts and deterministic JSON outputs.

Big picture
- Governed docs live in `docs/**`, anchored by `docs/integrity/spec-hash-manifest-v1.json` (hashes, `mutable_policy`, `next_change_requires_dec`). DEC files in `docs/governance/dec/**` are immutable. Evidence is written to `artifacts/` and published to Pages.

Core services (local)
- Signer 4601: `npm run service:signer` → GET `/pubkey`, POST `/sign { payload }` → `{ canonical, hash_sha256, signature }`.
- Chain 4602: `npm run service:chain` → POST `/append { canonical, signature, publicKeyPem }` (idempotent by content hash); persists `artifacts/chain.ndjson/json/head.json`.
- Collector 4603: `npm run service:collector` → POST `/ingest`; validates `schemas/events/public-event-v1.json`, computes `integrity.event_hash`, redacts feedback PII, enforces taxonomy from `docs/analytics/event-schema-canonical-v1.md`.

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

Key artifacts
- `artifacts/spec-hash-diff.json`, `param-integrity-matrix.json`, `disclaimers-lint.json`, `privacy-asserts.json`, `policy-aggregation-threshold.json`, `no-silent-drift-report.json`, `governance-verify-summary.json`.
