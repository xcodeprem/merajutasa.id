# Agent knowledge baseline (2025-08-14)

Purpose: capture core principles, parameters, services, data shapes, and policy gates found in this repo so future work aligns with governance and avoids drift. This document is additive and does not change any prior spec or plan.

## Principles (GP1–GP10) anchors

- GP1 Privacy-by-Architecture: PII minimization, redaction, and blocks; see `docs/privacy/pii-pattern-library-v1.md`, runtime scanner `tools/pii-scan.js` and collector feedback redaction.
- GP2 Executable Governance: DEC-driven control and policy-as-code; see `docs/governance/dec/*`, lint/policy tools, and `docs/integrity/spec-hash-manifest-v1.json`.
- GP3 Data Minimization: Canonical event schema with prohibited fields; default meta minimized; see `docs/analytics/event-schema-canonical-v1.md` + `tools/services/collector.js`.
- GP4 Verifiability & Integrity: Ed25519 signer, hash chain, spec-hash sealing; see `tools/services/signer.js`, `tools/services/chain.js`, `tools/spec-hash-diff.js`.
- GP5 Transparency: Public methodology snippet and disclaimers presence; see `docs/transparency/methodology-snippet-h0.md` and disclaimers lint spec.
- GP6 Outcome Honesty: Non‑ranking fairness framing; enforce via disclaimers and hype lint.
- GP7 Anti‑Hype & Plain Language: Banned lexicon scanning; see `tools/hype-lint.js`.
- GP8 Participation & Feedback Respect: Feedback acceptance with redaction/blocking; see `tools/feedback-smoke.js`, collector redaction paths.
- GP9 Non‑Ranking Fairness: Hysteresis Option F thresholds; equity index = 1 − Gini; see fairness tools under `tools/fairness/*`.
- GP10 Observability & Auditability: Canonical events, seeds, and dashboards baseline; see `tools/seed-events.js`, `tools/query-seeds.js`.

## Governance & DEC anchors (selection)

- DEC‑20250812‑02: Hysteresis Option F adoption (parameters governed).
- DEC‑20250812‑04: Governance baseline thresholds (PII, evidence hash UI length, terminology trigger, min aggregation, rounding).
- DEC‑20250813‑05/06/07/08/09/10: Gating policy Wave 1, consolidated governed edits, hype thresholds, evidence hash display length (16), equity rounding (2 decimals half‑up), feedback categories canonical.
- Disclaimers Lint Spec v1.0: presence, drift, scope, banned‑phrase rules with safe‑context whitelist.

## Services and ports

- Signer (Ed25519) — port 4601: endpoints /pubkey, /pubkeys, /sign, /verify, /rotate; stable canonical JSON; in‑memory keys persisted to `.integrity/keys.json`.
- Chain (Hash Chain) — port 4602: endpoints /append, /chain, /head, /verify, /reload; persists entries to `artifacts/chain.json`; prevHash continuity required.
- Collector (Events) — port 4603: endpoints /ingest, /ingest-batch, /stats, /health; Ajv (2020‑12) validation, event_name allowlist from `docs/analytics/event-schema-canonical-v1.md`, computes `integrity.event_hash`, redacts email/phone in feedback‑like payloads, blocks unknown event names when whitelist present. Storage: `artifacts/ingested-events.ndjson`.

## Fairness model

- Hysteresis Option F (config): `docs/fairness/hysteresis-config-v1.yml` with: T_enter_major=0.50, T_enter_standard=0.60 (consecutive=2), T_exit=0.65, cooldown=1 snapshot, stalled_window=5, anomaly_delta_threshold_equity_ratio=0.03. Policy lock key `hysteresis.params.lock` (warn‑then‑fail escalation).
- Equity index: computed as 1 − Gini on bucket counts; rounding: 2 decimals, half‑up per DEC‑20250813‑09; see `tools/fairness/rounding-util.js`, `tools/fairness/generate-equity-snapshots.js`.

## PII/privacy enforcement

- Categories include: IDN_NIK (16‑digit with valid province prefixes) BLOCK; NKK (contextual) BLOCK; EMAIL/PHONE REDACT; ADDRESS MASK; DOB REDACT; BANK ACCOUNT BLOCK; GOV_ID_DOC BLOCK; CHILD_NAME_AGE BLOCK; GEO_FINE BLOCK; PLATE_ID WARN. Multi‑category escalation threshold default=2 (advisory).
- Collector redaction: masks email/phone in `meta.text`/`meta.message` for feedback‑like payloads; prohibited meta terms scanner.

## Policies and gates

- Aggregation minimum cell threshold: advisory verify + hard‑enforce gate; default threshold 20; outputs `artifacts/policy-aggregation-threshold.json`.
- Disclaimers Lint: presence (ERROR), drift threshold min_similarity=0.90, shadow copy detection, banned phrase proximity with safe contexts; SARIF output optional; config in `content/disclaimers/config.yml` (when present).
- Param Integrity Matrix: compares YAML config, DEC values, and code constants; any MISMATCH/MISSING => hard fail; outputs `artifacts/param-integrity-matrix.json`.
- Hype Lint: non‑blocking advisory findings (Wave 1); outputs `artifacts/hype-lint.json`.
- DEC Lint, No‑Silent‑Drift, Policy Index Verify, Governed Change Scan: enforce governed changes and traceability.
- Governance orchestrator: `tools/governance-verify.js` runs critical/advisory steps and aggregates into `artifacts/governance-verify-summary.json`.

## Event taxonomy & seeds

- Canonical events: defined in `docs/analytics/event-schema-canonical-v1.md` and baked into collector’s whitelist (pipeline hash includes version + names + schema hash).
- Seeds: `tools/seed-events.js` posts `pub_landing_impression` and `pub_hero_card_cta_click`, then runs `tools/query-seeds.js` to write `artifacts/query-seeds.json`.

## Integrity artifacts & verification flows

- Spec Hash Manifest: `docs/integrity/spec-hash-manifest-v1.json` governs file hashes, integrity classes, mutable policies.
- Spec Hash Diff: `tools/spec-hash-diff.js` verify/seal; summary can be signed and anchored to chain (optional in orchestrator).
- Evidence: validate/bundle/freshness/collision tests under `tools/evidence-*.js`.

## Scripts (npm)

- Governance: `npm run governance:verify` (full orchestrator).
- Services: `npm run service:signer`, `service:chain`, `service:collector`.
- Privacy: `npm run privacy:scan`, `privacy:metrics`.
- Fairness: `npm run fairness:generate-snapshots`, `test:fairness-unit`, `fairness:sim`, `fairness:metrics`.
- Policy: `npm run policy:aggregation:verify`, `policy:aggregation:enforce:allow|deny`.
- Events: `npm run events:seed`, `queries:seeds`, `events:validate`.
- Integrity: `npm run spec-hash:verify|seal`, `evidence:validate|bundle|collision`, `param:integrity`.
- Verify CLI (draft): `npm run verify:cli` writes `artifacts/test-vectors.json` and requires the signer service running on 4601.

## Known gaps and notes (H0 scope check)

- Disclaimers master/config bindings files may be absent; the lint tool expects `content/disclaimers/{master.json,bindings.json,config.yml}`.
- `verify:cli` fails if signer service isn’t running; start `npm run service:signer` first.
- Orchestrator includes advisory steps (hype‑lint, events validate, feedback smoke); critical failures stop the run.
- H1/H2 items (dashboard, adoption scanner, perf/a11y CI, anomaly watcher) are planned and out of H0.

(End)
