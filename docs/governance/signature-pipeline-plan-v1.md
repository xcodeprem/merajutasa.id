---
title: Signature & Hash Pipeline Plan (v1)
status: draft
related_requirement: 4.4
related_dec_draft: DEC-20250813-02-signature-pipeline-adoption
phase_target: Phase 2 (post evidence phase 1.5)
hash_of_decision_document: "d85b586f9cb6c0aad0390089e78bf8572c19384a5a68ebd7481a714a2b63edc8"
---

## Signature & Hash Pipeline Plan (v1)

Status: Draft (Planning – Not Yet Activated)  
Target Phase: Post Phase 1.5 (Evidence completeness) → Phase 2 (Signing Enablement)

## 1. Objectives

Provide cryptographic authenticity & integrity for governance / fairness evidence artifacts so that any published claim (e.g., "evidence bundle hash = X") can be independently verified, and tampering (in-repo or post-publication) is detectable.

## 2. Scope (Initial Activation)

Artifacts to Sign (Phase 2 start):

- evidence-bundle.json (canonical list + per‑artifact hashes)
- spec-hash-diff.json (hash drift report)
- param-integrity-matrix.json
- principles-impact-report.json
- no-silent-drift-report.json (aggregated gating status)

Deferred to later (Phase 2+):

- fairness-sim-* (advisory analytics)
- hype-lint / disclaimers-lint (until enforcement hard fail active)
- pii-scan-report (after privacy review of masking scheme)
- credential issuance artifacts / event batches (separate pipeline)

## 3. Non-Goals (v1)

- Real-time streaming signatures
- Hardware-backed key custody (HSM) – evaluated but optional in v1
- Multi-signer quorum (threshold signatures)
- Post-quantum algorithms (Ed25519 sufficient baseline)

## 4. Threat Model (Condensed)

| Threat | Vector | Control |
|--------|--------|---------|
| Repo tampering after evidence generation | Retroactive artifact edit | Hash manifest + signed evidence-bundle.json (hash chain) |
| Selective artifact omission | Remove one file from bundle | Bundle signature enumerates all required IDs A1–A8 |
| Key exfiltration | Private key leak | Minimal online exposure, rotation DEC, optional passphrase agent |
| Replay of old bundle | Serving stale signed bundle | Timestamp + bundle version + freshness gating |
| Partial regeneration forging | Replace single artifact w/out re-sign | Bundle verification mismatch; aggregator gating FAIL |

## 5. Key Material & Custody Options

Option A: Ephemeral dev key (not acceptable for production) – for dry run only.  
Option B: File-based long‑lived Ed25519 key pair in encrypted form (age / scrypt) – baseline.  
Option C: External signing service (HTTP local) isolating private key – stretch (Phase 2.5).  
Initial Choice: Option B with rotation every 90 days (DEC required) or upon incident.

## 6. Signature Format

Detached JSON signature file per signed artifact OR aggregated signature set. Chosen approach: single aggregated `artifacts/evidence-signatures.json` containing array entries:

```json
{
  "version": 1,
  "generated_utc": "...",
  "signer_key_id": "ed25519:sha256(pubkey)[:16]",
  "entries": [
     { "artifact": "artifacts/evidence-bundle.json", "sha256": "...", "sig": "base64(ed25519(signature))" }
  ],
  "bundle_hash": "sha256(concat(sorted entry.sha256 + \n))"
}
```

Rationale: Single verification pass; avoids file sprawl; key_id bind.

## 7. Canonicalization Rules

1. Read file bytes exactly as committed (UTF-8).  
2. No whitespace normalization; JSON already deterministic (tool writes stable ordering).  
3. Compute sha256 per artifact BEFORE signing.  
4. Sign concatenation string: `artifact_path + "\n" + sha256 + "\n" + signer_key_id + "\n" + generated_utc`.

## 8. Activation Phases

| Phase | Label | Capabilities | Enforcement |
|-------|-------|--------------|-------------|
| S0 | Plan (current) | Design doc + draft DEC | None |
| S1 | Dry Run | Generate key, sign bundle (advisory), publish signatures file | Verify script WARN on mismatch |
| S2 | Enforced Sign | CI fails if signature missing or mismatch for mandatory subset | Mandatory for A1–A2–A8 |
| S3 | Full Sign | All evidence + fairness sim & lints | Mandatory all |
| S4 | Chain Extend | Add credential/event signing integration | Extended |

## 9. Tooling Components

- `tools/signing/keygen.js`: create Ed25519 key pair; output encrypted private key + public key.  
- `tools/signing/sign-evidence.js`: enumerate mandatory artifacts, produce evidence-signatures.json.  
- `tools/signing/verify-evidence.js`: verify signatures; exit non-zero on mismatch.  
- Integrate into `governance:verify` after evidence generation & validation.

## 10. Key Rotation Process

1. Generate new key pair.  
2. Create DEC referencing old key_id, new key_id, deactivation time.  
3. Dual-sign window (both keys valid) for N builds (suggest 3) then remove old key.  
4. Update manifest with new public key file hash.

## 11. Incident Response

Trigger (suspected compromise) → immediate revoke DEC; mark prior signatures unverifiable; regenerate bundle with new key and set `incident_ref` in signatures metadata.

## 12. Public Verification Instructions (Planned Snippet)

```bash
node tools/signing/verify-evidence.js --pubkey=keys/ed25519.pub --signatures=artifacts/evidence-signatures.json
```

Outputs PASS/FAIL + which artifact mismatched.

## 13. Interaction with Existing Integrity Chain

Hash manifest anchors static specs; signing adds authenticity for mutable evidence snapshots.

## 14. DEC Dependencies

- Adoption DEC (current draft) to authorize implementation.  
- Rotation DEC template (future) enumerated in Section 10.  
- Escalation DEC to move from S2 → S3 (optional).

## 15. Open Questions / Deferred

| Topic | Question | Target Phase |
|-------|----------|--------------|
| Key Encryption | Use passphrase vs OS keychain? | S1 decision |
| Multi-signer | Add threshold or 2-of-2 (ops + governance)? | S3+ |
| Public Transparency | Publish public key externally (website) | S2 |
| Credential Reuse | Same key for credentials? (likely NO) | S2 planning |
| PQ Transition | Add PQ hybrid signature | Future review |

## 16. KPIs / Success Metrics

- Verification failure rate = 0 (excluding intentional test cases)  
- Rotation completed with <1 day overlap window  
- Evidence bundle verification time < 500ms local

## 17. Next Immediate Steps (S0 → S1)

1. Implement key generation & storage format (encrypted JSON or .key + metadata).  
2. Implement sign & verify scripts (feature flag `SIGNING_ENABLED`).  
3. Append design doc & DEC to hash manifest (`integrity_class: signature-design`).  
4. Dry run signing in CI (advisory) producing evidence-signatures.json.  
5. Update `requirement-agents-ready.md` once S1 artifact present.

---
End of signature-pipeline-plan-v1 (draft).
