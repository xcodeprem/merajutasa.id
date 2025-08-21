# Integrity & Credential Chain Index

**Version:** 1.0  
**Purpose:** Indeks terpusat untuk sistem integritas, credential schema, signature chain, dan verifikasi  
**Last Updated:** 2025-08-21  
**Status:** Canonical Navigation Hub

> **Navigation Hub**  
> Dokumentasi ini menyediakan akses terpusat ke semua komponen sistem integritas MerajutASA.id, termasuk credential schema, prosedur verifikasi, test vectors, dan chain signature examples.

---

## 🏗️ Core Credential System

### Credential Schema v1.0

- **[Credential Schema Final v1.0](credential-schema-final-v1.md)** - Schema definisi lengkap untuk Integrity Credential
  - JSON-LD context dan field definitions
  - W3C Verifiable Credentials compliance
  - Test vectors dan contoh implementasi
  - Governance binding dan revocation framework
  - Canonicalization dan hashing procedures

### Schema Governance & Versioning

- **[Spec Hash Manifest](spec-hash-manifest-v1.json)** - Anchor hash integritas untuk semua governed documents
  - Mutable policy definitions
  - DEC reference linkage
  - Integrity class classifications
  - Change management rules

---

## 🔐 Verification & Validation Systems

### Manual Verification

- **[CLI Verification Guide](verify-cli-doc-draft.md)** - Comprehensive manual verification procedures
  - Hash integrity verification steps
  - Parameter consistency checks
  - Signature verification processes  
  - Service health checks
  - Evidence validation procedures

### API Verification

- **[API Verification Docs](api-verification-docs.md)** - Programmatic verification endpoints
  - Service integration patterns
  - Automated verification workflows

### Verification Tools

```bash
# Core verification commands
npm run governance:verify         # Full governance integrity check
npm run spec-hash:verify         # Hash integrity verification
npm run param:integrity          # Parameter consistency check

# Service verification
npm run test:services           # Service integration tests
npm run test:signer-e2e        # End-to-end signer tests
```

---

## ⚙️ Cryptographic Primitives & Examples

### Test Vectors

**Location:** `artifacts/test-vectors.json`

Example credential hash vector:

```json
{
  "sample": {
    "id": "cred-test-001",
    "subject": "did:example:123",
    "issuanceDate": "2025-08-13T00:00:00Z",
    "claim": {
      "role": "tester",
      "level": 1
    }
  },
  "signed": {
    "canonical": "{\"claim\":{\"level\":1,\"role\":\"tester\"},\"id\":\"cred-test-001\",\"issuanceDate\":\"2025-08-13T00:00:00Z\",\"subject\":\"did:example:123\"}",
    "hash_sha256": "7f508b830a1a139e81b54add69240627a2117d891d714f5a36e753ec16df9c11",
    "signature": "hJQ1j+3dEawBv6h80OtRiTxbKcMrvOstpygeDcq9fkaHijZI8O9PLwiKIgogHLXd7WI4AwAw8Ns+2dF9jhxaCg==",
    "alg": "Ed25519"
  }
}
```

### Chain & Signature Examples

**Current Chain State:** `artifacts/chain-head.json`  
**Full Chain:** `artifacts/chain.json`

Example chain entry:

```json
{
  "seq": 0,
  "prevHash": null,
  "contentHash": "43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777",
  "signature": "kSNbpYfsBDPH9KdFRGAlgLv43HPx5i+q0x2WgvzB8c61rUGmikIHGkpIOzMwWsgarIoBKHUxurEri9/0JKplBQ==",
  "canonical": "{\"a\":1,\"b\":2}",
  "ts": "2025-08-18T22:13:14.180Z"
}
```

### Canonicalization Process

**Algorithm:** SHA-256 over canonical JSON

- Sorted keys, UTF-8 encoding
- LF line endings only
- No trailing whitespace

**Hash Computation Example:**

```bash
# Generate test vectors
node tools/generate-test-vectors.js

# Verify hash computation
node tools/evidence-collision-test.js
```

---

## 📋 Evidence & Audit Framework

### Evidence Requirements

- **[Evidence Minimum Phase 1.5](evidence-minimum-phase1.5-v1.md)** - Required evidence artifacts for Phase 1.5
  - Artifact specifications (A1-A7)
  - Evidence bundle structure
  - Freshness requirements

### Hash & Metadata Tools

- **[Hash Excerpt Module](hash-excerpt-module.md)** - Hash metadata extraction utilities
  - Evidence prefix truncation (16 hex chars)
  - Collision detection algorithms
  - Metadata-only exposure patterns

### Evidence Validation

```bash
# Evidence validation commands
npm run evidence:validate        # Validate evidence bundle
npm run evidence:collision      # Check hash collisions  
npm run evidence:bundle         # Generate evidence bundle
```

**Key Artifacts:**

- `artifacts/evidence-bundle.json` - Current evidence bundle
- `artifacts/evidence-collision-test.json` - Collision analysis
- `artifacts/evidence-freshness-report.json` - Freshness validation

---

## 🛡️ Gating Policy & Enforcement

### Policy Configuration

- **[Gating Policy v1.0](gating-policy-v1.json)** - Wave 1 governance gating thresholds
- **[Gating Policy Annotations](gating-policy-annotations.md)** - Policy field mappings to DEC decisions

### Critical Thresholds

```json
{
  "spec_hash_violation_count": 0,
  "param_integrity_status": "PASS", 
  "hype_high_max": 0,
  "disclaimers_errors_allowed": 0,
  "pii_critical_max": 0
}
```

### Auto-Seal Allowlist

- **[Auto-Seal Allowlist](auto-seal-allowlist.json)** - Files authorized for editorial auto-seal
  - README.md and documentation files
  - Non-breaking editorial changes only

---

## 🔧 Service Integration

### Core Services

```bash
# Start core services
npm run service:signer          # Signature service (port 4601)
npm run service:chain           # Chain append service (port 4602) 
npm run service:collector       # Event collection service (port 4603)
```

### Service Health Checks

```bash
# Health endpoint examples
curl http://localhost:4601/pubkey     # Signer public key
curl http://localhost:4602/health     # Chain service health
curl http://localhost:4603/stats      # Collector statistics
```

### Chain Operations

```bash
# Chain management
npm run chain:append            # Append signed entry
npm run chain:monitor           # Monitor chain state
npm run test:collector          # Test event collection
```

---

## 📖 CLI Quick Reference

### Hash Integrity Verification

```bash
# Check hash integrity
npm run spec-hash:verify
cat artifacts/spec-hash-diff.json

# Seal hashes (first time)
npm run spec-hash:seal
```

### Parameter Verification

```bash
# Verify parameter consistency  
npm run param:integrity
cat artifacts/param-integrity-matrix.json
```

### Full Governance Check

```bash
# Complete governance verification
npm run governance:verify
cat artifacts/governance-verify-summary.json
```

### Troubleshooting

**Hash Mismatch:**

- File changed without proper governance
- Use `spec-hash:verify` to identify violations
- Check DEC authorization for governed files

**Parameter Mismatch:**  

- Configuration drift detected
- Review `artifacts/param-integrity-matrix.json`
- Ensure hysteresis config alignment

**Service Failure:**

- Check service ports (4601, 4602, 4603)
- Verify service integration with `npm run test:services`
- Review service logs for errors

---

## 🔗 Related Documentation

### Master Documentation

- **[Main Documentation Index](../index.md#🔒-integrity--credential-management)** - Primary navigation hub
- **[Master Spec v2.0](../master-spec/master-spec-v2.0.md)** - Complete system specification

### Implementation Guides  

- **[Phase 1 Implementation](../phase-1/PHASE-1-IMPLEMENTATION-GUIDE.md)** - Integrity system implementation
- **[Phase 2 Implementation](../phase-2/PHASE-2-IMPLEMENTATION-GUIDE.md)** - Advanced credential features

### Privacy & Security

- **[PII Pattern Library](../privacy/pii-pattern-library-v1.md)** - Privacy pattern detection
- **[Security Documentation](../security/README.md)** - Security policies & procedures

---

## 📊 System Status

**Last Verification:** `artifacts/governance-verify-summary.json`  
**Chain Head:** `artifacts/chain-head.json`  
**Evidence Bundle:** `artifacts/evidence-bundle.json`

**Service Status:**

- Signer: Verify via `GET /pubkey`
- Chain: Verify via `GET /health`  
- Collector: Verify via `GET /stats`

---

**Version History:**

- v1.0 (2025-08-21): Initial comprehensive index creation
