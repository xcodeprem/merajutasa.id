# Governance toolchain overview (Wave 1)

This repository enforces integrity and governance through a set of scripts and evidence artifacts.

- Canonical hashing and sealing
  - spec-hash manifest: `docs/integrity/spec-hash-manifest-v1.json`
  - Canonicalization for DEC: replace `hash_of_decision_document` 64-hex with "<CANON>" before SHA-256
  - Commands:
    - Verify: `npm run spec-hash:verify`
    - Reseal (DEC canonical + non-DEC): `node tools/spec-hash-diff.js --mode=accept`

- Linters and tests
  - DEC linter (critical): `node tools/dec-lint.js`
  - Disclaimers/hype (advisory): `node tools/disclaimers-lint.js`, `node tools/hype-lint.js`
  - Unit tests (fairness + canonical hash): `npm run test:governance`

- Governance orchestrator
  - `npm run governance:verify` runs critical and advisory steps, writes `artifacts/governance-verify-summary.json`
  - Optional signer/chain step appends a signed summary of `spec-hash-diff.json` when services are running.

- Evidence bundle & validation
  - Evidence artifacts under `artifacts/`
  - Validate against JSON Schemas: `npm run evidence:validate`

- PII and terminology hygiene
  - PII scan: `tools/pii-scan.js` with config at `tools/config/privacy-policy.json`
  - Terminology scan inventory: `tools/terminology-scan.js`

Notes:

- Wave 1 gating enforces zero spec-hash violations, param integrity, collision tests, and DEC lint.
- Evidence collision uses 16-char display prefix as per DEC-20250813-08.
