# Verify CLI Documentation (Draft)

Scope: Manual steps to verify credential signature & chain continuity.

## 1. Prerequisites

- Node.js LTS
- Download public key (Ed25519) from `/keys/current.json`.

## 2. Verify Single Credential

```bash
node scripts/verify-credential.js --file credential.json --pubkey keys/current.json
```

Expected: Output `signature_valid: true`.

## 3. Verify Chain Sequence

```bash
node scripts/verify-chain.js --chain chain.json --pubkey keys/current.json
```

Checks:

- Sequential `seq` integers.
- Each `prevHash` matches prior `contentHash`.
- Each signature verifies.

## 4. Recompute Content Hash

Algorithm: SHA-256 over canonical JSON (sorted keys, UTF-8, LF line endings).

## 5. Troubleshooting

- Mismatch prevHash: likely out-of-order append.
- Signature invalid: ensure correct key version.
- Hash mismatch: re-run canonicalization (remove volatile fields, sort keys).

## 6. Next

- Provide script examples (bash, powershell) once tooling stabilized.

> Draft; finalize after signer & chain MVP live.
