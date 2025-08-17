## Copilot instructions for merajutasa.id

Purpose: fast onboarding for AI agents in this governance/integrity repo. Prefer existing scripts and deterministic outputs.

Big picture
- Node.js ESM toolchain that governs docs in `docs/**`, anchored by `docs/integrity/spec-hash-manifest-v1.json` (hashes, `mutable_policy`, `next_change_requires_dec`). DEC files under `docs/governance/dec/**` are immutable. Evidence lives in `artifacts/` and is published to Pages.

Core services (local)
- Signer 4601: `npm run service:signer` → GET `/pubkey`, POST `/sign { payload }` → `{ canonical, hash_sha256, signature }`.
- Chain 4602: `npm run service:chain` → POST `/append { canonical, signature, publicKeyPem }` (idempotent by content hash); persists `artifacts/chain.*`.
- Collector 4603: `npm run service:collector` → POST `/ingest`; validates against `schemas/events/public-event-v1.json`, computes `integrity.event_hash`, redacts basic PII, enforces taxonomy from `docs/analytics/event-schema-canonical-v1.md`.

Workflows
- Install/tests: `npm ci`; `npm run lint`; `npm run test` or `test:governance` / `test:services`.
- Governance checks: `npm run governance:verify`. Spec sealing: `npm run spec-hash:verify` (or first seal: `spec-hash:seal`). Event pipeline hash: `npm run events:pipeline:hash`.
- Quick E2E demo: `npm run chain:append` (PowerShell jobs start signer+chain and append once).

Conventions (repo-specific)
- Deterministic JSON only: use `tools/lib/json-stable.js` (`stableStringify`, `addMetadata`) for new artifacts.
- Mutability: respect manifest `mutable_policy`. Append-only → add new sections only; immutable → create a new file. If `next_change_requires_dec=true`, create a DEC and link via `dec_ref`.

Tests/lints that gate PRs
- `tools/tests/**` cover hash/param/spec/services (e.g., `spec-hash-diff.test.js`, `param-integrity.test.js`, `services-integration.test.js`).
- Lints: `npm run lint:dec`, `npm run lint:disclaimers` (config `content/disclaimers/config.yml`), privacy: `npm run privacy:scan`.

CI/PR
- Workflows: `.github/workflows/ci-guard.yml`, `h1-guard.yml`, `pages.yml`. PR template: `.github/PULL_REQUEST_TEMPLATE/workflow.md`. Labels helper: `npm run pr:labels`.

Examples
- Signing→Chain: see `tools/chain-append-from-signer.js` flow. Events→Collector: appends to `artifacts/ingested-events.ndjson` with computed `event_hash`.

Pitfalls
- Don’t commit volatile logs; only stable, sorted JSON. If `HASH_MISMATCH_DEC_REQUIRED`/`MUTABILITY_VIOLATION` appears, add a DEC or revert—don’t edit immutable content.

See also onboarding: `docs/onboarding/agent-bootstrap-manifest.md`, `agent-role-policy-v1.md`, `agent-guardrails-v1.md`.
