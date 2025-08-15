# Verify CLI (Draft → Usable Now)

This guide helps you verify signatures and chain continuity locally using the built-in signer and chain services.

## Prerequisites

- Node.js 18+ (LTS recommended)
- Windows PowerShell (this repo's scripts are PowerShell-friendly)

## Quick Start (happy path)

- Start signer and chain services, append a signed entry, and validate end-to-end:
  - Run: npm run chain:append
  - This writes artifacts under artifacts/, including chain-append-latest.json

- Generate test vectors for manual verification:
  - Run: npm run verify:cli
  - Inspect artifacts/test-vectors.json for canonical payload, SHA-256, and signature

## Manual Verification Steps

If you prefer step-by-step checks:

- Start signer service (terminal 1):
  - npm run service:signer
  - Endpoints:
    - GET /pubkeys returns the active and previous public keys
    - POST /sign signs canonical JSON deterministically (sorted keys)

- Start chain service (terminal 2):
  - npm run service:chain

- Append a signed payload:
  - Run: npm run chain:append (or call endpoints manually)

- Verify signature (optional advanced):
  - POST /verify on the signer with canonical and signature from artifacts
  - Expected: { verified: true }

- Verify chain continuity:
  - Open artifacts/chain-append-latest.json and confirm:
    - seq increments by 1
    - prevHash equals prior entry's contentHash
    - Recompute SHA-256 over canonical JSON to match contentHash

## Troubleshooting

- Port in use: set env SIGNER_PORT or CHAIN_PORT before running scripts
- Signature invalid: ensure you used the exact canonical string when verifying
- Hash mismatch: remove volatile fields, ensure LF endings, and sorted keys

> This draft will evolve into a full, platform-specific guide once signer/chain reach H0 readiness.
