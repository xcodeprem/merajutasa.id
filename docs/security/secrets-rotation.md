# Secrets and Key Rotation Runbook

This runbook defines how secrets are handled, how encryption keys are managed using envelope encryption, the rotation schedule, and how to run a dev rotation test that produces evidence artifacts.

## Scope and sources of secrets

- Development
  - Environment variables (.env.local) and Node process env; no hardcoded secrets in code.
  - Local KMS mock for envelope encryption to exercise flows and produce artifacts.
- CI/CD
  - GitHub Actions Encrypted Secrets and OpenID Connect for cloud access.
  - No secrets printed in logs; artifacts contain no plaintext secrets.
- Production (planned)
  - Cloud KMS (AWS KMS / GCP KMS / Azure Key Vault) for Key Encryption Keys (KEK).
  - Application Data Encryption Keys (DEK) are generated per use/tenant/domain and are wrapped by KEK.

## Envelope encryption (design)

- KEK (Key Encryption Key)
  - Held by KMS; used only to wrap/unwrap DEKs.
  - Rotated on a longer cadence (e.g., 180–365 days) or on compromise.
- DEK (Data Encryption Key)
  - Random 256-bit key used with AES-256-GCM for data encryption.
  - Rotated frequently (e.g., every 90 days) or on scope change.
- Storage
  - Only wrapped DEKs are persisted along with metadata (algorithms, iv, tag, ids).
  - Plaintext DEKs are used in-memory only.

## Rotation policy (defaults)

- DEK rotation: every 90 days or on-demand after a security event.
- KEK rotation: every 180–365 days; wrap existing DEKs with the new KEK during a migration window.
- Emergency rotation: immediate regeneration of KEK and DEKs; re-wrap existing DEKs and re-encrypt sensitive blobs if required.

## Dev rotation test (evidence-producing)

A local test simulates KMS and envelope encryption, then writes deterministic evidence to `artifacts/`:

- artifacts/secrets-rotation-evidence.json — high-level summary (PASS/FAIL flags, ids, timestamps, algorithms)
- artifacts/secrets-rotation-keystore.json — wrapped DEK entries and sample ciphertext metadata (no plaintext)
- artifacts/dev-kek.json — local KEK material for mock KMS (dev only; never commit KEK material for real envs)

Run:

- npm run secrets:rotation:test

Expected output:

- PASS indicators for unwrap/decrypt with old DEK and re-encrypt with new DEK.
- No plaintext secrets appear in artifacts.

## Operational steps (prod outline)

1) Prepare new KEK in cloud KMS; obtain key ID and grant least-privileged usage to the rotation job.
2) Generate new DEKs per data domain; wrap with new KEK; store wrapped DEKs with metadata.
3) Update application to fetch the latest DEK by version/id; deploy.
4) Optionally re-encrypt existing data lazily on read or via background migration.
5) Revoke old DEK access after migration window; schedule KEK key material deactivation per KMS policy.

## Rollback

- Keep prior KEK active during a controlled window; wrapped DEKs include `kek_id` so the app can unwrap with either KEK.
- If rotation fails, switch `active_dek_id` pointer back to prior DEK id; investigate and retry.

## Audit and evidence

- Persist rotation evidence artifacts with stable JSON ordering.
- Do not store plaintext secrets in any evidence; include only ids, algorithms, timestamps, and success booleans.

---

Notes

- This repo includes a dev-only KMS mock for demos and tests; production must use a managed KMS.
- Respect governed immutability: artifacts are append-only; do not mutate historical evidence.
