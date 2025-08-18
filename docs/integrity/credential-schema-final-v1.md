# MerajutASA – Integrity Credential Schema (Final Draft v1.0)

<div data-disclaimer-block="hash_excerpt_module">
<p data-disclaimer-id="D5">Hash excerpt hanya metadata perubahan; tidak memuat konten sensitif.</p>
</div>

Status: Ready for Governance Ratification (CIC-C)  
Spec Version ID: cred-schema-v1.0 (locked upon decision log entry)  
Related Master Spec: Public Multi‑Page Experience Master Specification v2.0 (“Hero Constellation”)  
Do Not Remove: This document augments, not replaces, prior strategy. No previously agreed constraint is deleted.

> PURPOSE  
Menetapkan skema formal, batas, aturan governance, dan praktik kriptografi untuk “Integrity Credential” yang menjadi trust primitive utama. Credential ini: (a) Memverifikasi bahwa sebuah unit/organisasi (selanjutnya: “unit kesejahteraan anak”) telah melalui proses verifikasi standar, (b) Menyediakan bukti portabel non‑ranking, (c) Tidak memuat data pribadi anak, (d) Memungkinkan audit transisi & revocation di masa depan, (e) Selaras dengan prinsip privacy-by-architecture & non-ranking fairness.

---

## 1. PRINCIPLES (RESTATED & BOUND TO SCHEMA)

| Code | Application in Credential |
|------|---------------------------|
| GP1 Privacy-by-Architecture | Tidak ada child PII; organisasi hanya minimal metadata non sensitif (name normative, region broad). |
| GP2 Executable Governance | Setiap credential ditandatangani; dapat diverifikasi via CLI + DID document. |
| GP3 Federated Mindset | Format JSON-LD / W3C Verifiable Credential compatible subset → portabilitas lintas platform. |
| GP4 Integrity Before Scale | Tidak menambah field impresif (impact score, rating) sebelum governance gating. |
| GP5 Transparency as Feature | Schema publik, hash-able, canonical normalization guideline disertakan. |
| GP6 Outcome Honesty | Credential ≠ quality rating; disclaimers wajib. |
| GP7 Transition-Aligned | Field terminologyStage, adoptionPercent (opsional) untuk publisitas transisi (bisa omit jika noise). |
| GP8 Differential Exposure | Hanya field L0–L4; tidak ada pipeline internal IDs berlebihan. |
| GP9 Non-Ranking Fairness | Tidak memuat ranking, skor komparatif, ratio fairness detail. |
| GP10 Observability | Version + chain linkage references (chain heads) untuk audit. |

---

## 2. SCOPE & NON-SCOPE

IN-SCOPE: Schema definisi, enumerasi nilai, JSON Schema, contoh valid, normalisasi hashing, penandatanganan, versi, revocation placeholder, governance gating, compliance lint.
OUT-OF-SCOPE: Implementasi service signing produksi, key management operational details (Anda yang lakukan), predictive scoring, per-unit sensitive operational KPIs, geolokasi granular, data anak.

---

## 3. CORE DATA MODEL (OVERVIEW)

High-level fields (level-utama):

- @context
- type
- id
- credentialSchema
- version
- issuer
- issuanceDate
- expirationDate
- validFrom (redundansi eksplisit)
- credentialSubject (object)
- proof (signature container)
- governance (extension)
- revocation (extension placeholder)
- meta (non-assertive, optional; e.g., hashChainHead, disclaimers)
- terminology (optional transitional object)

Not all optional sub-objects harus muncul. Minimal required for MVP: @context, type, id, issuer, issuanceDate, credentialSubject, proof.

---

## 4. FIELD DEFINITIONS & CONSTRAINTS

| Field | Type | Req | Constraint / Pattern | Rationale / Notes | Governance Class on Change |
|-------|------|-----|---------------------|-------------------|-----------------------------|
| @context | array/string | Yes | MUST include “<https://www.w3.org/2018/credentials/v1”> & MerajutASA context URL | VC compatibility | CIC-E if removal |
| type | array | Yes | MUST contain “VerifiableCredential” & “IntegrityCredential” | Semantic classification | CIC-E |
| id | string (URI) | Yes | DID-agnostic resolvable or URN `urn:merajutasa:cred:{uuid}` | Global uniqueness | CIC-B if format change |
| credentialSchema | object | Yes | id + type (“JsonSchemaValidator2018” or variant) | Machine validation | CIC-E |
| version | string semver | Yes | `^1\.0(\.\d+)?$` initial; bump per additive change | Traceability | CIC-C/E |
| issuer | string (DID or https URL) | Yes | `did:web:merajutasa.id` initial | Federated trust anchor | CIC-B |
| issuanceDate | string (ISO 8601) | Yes | Past or current timestamp | Proof issuance time | CIC-A |
| validFrom | string (ISO) | Yes | ≤ issuanceDate + 5s tolerance | Clarity validity start | CIC-A |
| expirationDate | string (ISO) | Optional (MVP) | > issuanceDate if present | Future revocation & rotation | CIC-C |
| credentialSubject | object | Yes | See sub-table | Assertion payload | CIC-C on new fields |
| proof | object | Yes | MUST include `type`, `created`, `verificationMethod`, `proofPurpose`, `jws` | W3C VC style proof | CIC-A for algorithm |
| governance | object | Yes | decisionIds[], policySet[] | Bind governance context | CIC-B adding policies |
| revocation | object | Placeholder | status (“active”), registry URL, reason (null) | Future-safe | CIC-C |
| meta | object | Optional | disclaimers[], hashChainHead, snapshotRef | Non-assertive | CIC-D |
| terminology | object | Optional | stage, adoptionPercent, lastUpdate | Transition reflection | CIC-C |

### 4.1 credentialSubject Sub-Fields

| Field | Type | Req | Constraint | Notes |
|-------|------|-----|-----------|-------|
| id | string | Yes | `urn:merajutasa:org:{uuid}` or org DID if later | Internal stable reference |
| name | string | Yes | 3–120 chars; sanitized (no ranking adjectives) | Display name |
| legalForm | string | Optional | Enum: `foundation`, `association`, `religious`, `other` | Non-sensitive category |
| region | string | Yes | Province-level only (no district granularity) | Privacy minimization |
| country | string | Optional | “ID” default | For portability |
| verificationStatus | string | Yes | Enum: `verified`, `pending`, `suspended` | `suspended` for revocation-pre state |
| verificationScope | array | Optional | Values: `documentation`, `site-visit`, `governance-check` | Multi-step evidence transparency |
| verificationEvidenceHash | string | Optional | Hex (sha256) truncated 16–64 chars | Reference aggregated evidence |
| lastVerificationUpdate | string (ISO) | Yes | ≤ issuanceDate | Freshness signal |
| needsDataIncluded | boolean | Yes | MUST false in credential (we never embed needs) | Affirmation of minimization |
| equityDataIncluded | boolean | Yes | ALWAYS false (equity aggregated elsewhere) | Prevent misuse |
| dataVersionRef | string | Optional | Hash or version tag of org metadata schema | Auditable schema |
| disclaimersRef | string | Optional | URL to disclaimers set version | Integrity of messaging |

No fields like: numberOfChildren, exactAddress, staffNames, financialBalance. Prohibited list enforced via lint.

---

## 5. PROHIBITED / BLACKLIST FIELDS

| Category | Examples | Reason |
|----------|----------|--------|
| Child Identifiers | childName, birthDate, caseId | Privacy risk |
| Exact Location | streetAddress, latLng | Re-identification risk |
| Performance / Ranking | ratingScore, rankPosition | Violates non-ranking fairness |
| Financial Sensitive | bankAccount, donationTotals | Out-of-scope + misuse risk |
| Predictive / Risk | riskScore, vulnerabilityIndex | Ethical hazard, not validated |
| Sensitive Capacity | numberOfChildren, occupancyRate | De-anonymization vector |
| Subjective Narrative | testimonial, anecdote | Potential sensationalization |

Lint MUST block any addition matching regex list (case-insensitive).

---

## 6. ENUMERATIONS & VALIDATIONS

- verificationStatus: `pending` → credential SHOULD NOT be publicly surfaced as proof-of-integrity (but allowed for pipeline test).  
- When verificationStatus = `verified`, required: lastVerificationUpdate.  
- verificationScope subset must be non-empty if status = verified.  
- region must match controlled list (baseline: official province enumerations; maintain external file).  
- version bump rule: Adding optional field = patch; adding required field = minor (1.x) (NEVER break; else 2.0).  
- adoptionPercent (terminology): integer 0–100; only present at Stage 1 & 2; removed Stage 3 (Stage 4 optional archive).  

---

## 7. JSON-LD CONTEXT

Base:

- `https://www.w3.org/2018/credentials/v1`
- `https://schema.merajutasa.id/contexts/integrity-credential-v1.json` (to publish; defines custom terms)
  
Custom terms (indicative, not exhaustive):

| Term | IRI |
|------|-----|
| IntegrityCredential | `https://schema.merajutasa.id/IntegrityCredential` |
| verificationStatus | `https://schema.merajutasa.id/verificationStatus` |
| verificationScope | `https://schema.merajutasa.id/verificationScope` |
| governance | `https://schema.merajutasa.id/governance` |
| revocation | `https://schema.merajutasa.id/revocation` |
| terminology | `https://schema.merajutasa.id/terminology` |

---

## 8. JSON SCHEMA (Draft 2020-12)

> NOTE: JSON Schema digunakan untuk mesin validasi; JSON-LD context untuk semantik. Both are normative. Keep in repo at: `schemas/credential/integrity-credential-v1.json`

```json
{
  "$id": "https://schema.merajutasa.id/credential/integrity-credential-v1.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "IntegrityCredential",
  "type": "object",
  "required": ["@context","type","id","issuer","issuanceDate","validFrom","credentialSubject","proof","credentialSchema","version"],
  "additionalProperties": false,
  "properties": {
    "@context": {
      "oneOf":[
        {"type":"string","const":"https://www.w3.org/2018/credentials/v1"},
        {"type":"array","minItems":1,"items":{"type":["string","object"]}}
      ]
    },
    "type": {
      "type":"array",
      "items":{"type":"string"},
      "contains":{"const":"VerifiableCredential"}
    },
    "id": {"type":"string","pattern":"^(urn:merajutasa:cred:|https?://)"},
    "credentialSchema": {
      "type":"object",
      "required":["id","type"],
      "properties":{
        "id":{"type":"string","pattern":"^https://schema\\.merajutasa\\.id/credential/integrity-credential-v1\\.json$"},
        "type":{"type":"string","enum":["JsonSchemaValidator2018","JsonSchemaValidator2023"]}
      },
      "additionalProperties": false
    },
    "version":{"type":"string","pattern":"^1\\.0(\\.\\d+)?$"},
    "issuer":{"type":"string","pattern":"^did:web:merajutasa\\.id$"},
    "issuanceDate":{"type":"string","format":"date-time"},
    "validFrom":{"type":"string","format":"date-time"},
    "expirationDate":{"type":"string","format":"date-time"},
    "credentialSubject":{
      "type":"object",
      "required":["id","name","region","verificationStatus","lastVerificationUpdate","needsDataIncluded","equityDataIncluded"],
      "additionalProperties": false,
      "properties":{
        "id":{"type":"string","pattern":"^urn:merajutasa:org:"},
        "name":{"type":"string","minLength":3,"maxLength":120},
        "legalForm":{"type":"string","enum":["foundation","association","religious","other"]},
        "region":{"type":"string"},
        "country":{"type":"string","pattern":"^[A-Z]{2}$","default":"ID"},
        "verificationStatus":{"type":"string","enum":["pending","verified","suspended"]},
        "verificationScope":{
          "type":"array",
            "items":{"type":"string","enum":["documentation","site-visit","governance-check"]},
            "uniqueItems": true
        },
        "verificationEvidenceHash":{"type":"string","pattern":"^[a-f0-9]{8,128}$"},
        "lastVerificationUpdate":{"type":"string","format":"date-time"},
        "needsDataIncluded":{"type":"boolean","const":false},
        "equityDataIncluded":{"type":"boolean","const":false},
        "dataVersionRef":{"type":"string"},
        "disclaimersRef":{"type":"string","format":"uri"}
      }
    },
    "governance":{
      "type":"object",
      "required":["decisionIds"],
      "properties":{
        "decisionIds":{"type":"array","items":{"type":"string","pattern":"^DEC-\\d{8}-\\d{2}$"}},
        "policySet":{"type":"array","items":{"type":"string"}}
      },
      "additionalProperties": false
    },
    "revocation":{
      "type":"object",
      "required":["status"],
      "properties":{
        "status":{"type":"string","enum":["active","revoked","suspended"]},
        "reason":{"type":["string","null"]},
        "registry":{"type":"string","format":"uri"},
        "revokedAt":{"type":"string","format":"date-time"}
      },
      "additionalProperties": false
    },
    "terminology":{
      "type":"object",
      "properties":{
        "stage":{"type":"string","enum":["stage1-dual","stage2-primary","stage3-new-only","stage4-archived"]},
        "adoptionPercent":{"type":"integer","minimum":0,"maximum":100},
        "lastUpdate":{"type":"string","format":"date-time"}
      },
      "additionalProperties": false
    },
    "meta":{
      "type":"object",
      "properties":{
        "hashChainHead":{"type":"string","pattern":"^[a-f0-9]{16,128}$"},
        "snapshotRef":{"type":"string"},
        "disclaimers":[
          {"type":"array","items":{"type":"string"}}
        ]
      },
      "additionalProperties": true
    },
    "proof":{
      "type":"object",
      "required":["type","created","verificationMethod","proofPurpose","jws"],
      "properties":{
        "type":{"type":"string","enum":["Ed25519Signature2020","Ed25519Signature2023","JcsEd25519Signature2024"]},
        "created":{"type":"string","format":"date-time"},
        "verificationMethod":{"type":"string","pattern":"^did:web:merajutasa\\.id#keys-\\d+$"},
        "proofPurpose":{"type":"string","enum":["assertionMethod"]},
        "jws":{"type":"string"}
      },
      "additionalProperties": false
    }
  }
}
```

---

## 9. SHACL (OPTIONAL VALIDATION LAYER – INFORMATIVE)

(Keep a SHACL shapes file separately if needed; omitted here for brevity; not replacing JSON Schema.)

---

## 10. EXAMPLE CREDENTIAL (VALID)

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://schema.merajutasa.id/contexts/integrity-credential-v1.json"
  ],
  "type": ["VerifiableCredential","IntegrityCredential"],
  "id": "urn:merajutasa:cred:2f8f3a2d-8c41-4e55-9c67-19b6ad73c201",
  "credentialSchema": {
    "id": "https://schema.merajutasa.id/credential/integrity-credential-v1.json",
    "type": "JsonSchemaValidator2018"
  },
  "version": "1.0.0",
  "issuer": "did:web:merajutasa.id",
  "issuanceDate": "2025-08-12T02:55:12Z",
  "validFrom": "2025-08-12T02:55:12Z",
  "credentialSubject": {
    "id": "urn:merajutasa:org:8b7d6d3d-7e91-4923-9e02-cc0d8acfe021",
    "name": "LKSA Harapan Cerah",
    "region": "Jawa Barat",
    "country": "ID",
    "verificationStatus": "verified",
    "verificationScope": ["documentation","site-visit"],
    "verificationEvidenceHash": "a41bf2d3e9c1ab88",
    "lastVerificationUpdate": "2025-08-09T09:30:00Z",
    "needsDataIncluded": false,
    "equityDataIncluded": false,
    "dataVersionRef": "org-meta-v1",
    "disclaimersRef": "https://merajutasa.id/disclaimers/v1"
  },
  "governance": {
    "decisionIds": ["DEC-20250810-03","DEC-20250811-01"],
    "policySet": ["aggregation.min_cell_threshold","terminology.stage1"]
  },
  "revocation": {
    "status": "active",
    "reason": null
  },
  "terminology": {
    "stage": "stage1-dual",
    "adoptionPercent": 42,
    "lastUpdate": "2025-08-11T23:10:00Z"
  },
  "meta": {
    "hashChainHead": "b93f2da17c9e44df",
    "snapshotRef": "equity-snap-2025-08-11",
    "disclaimers": ["D1","D2","D3","D5"]
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2025-08-12T02:55:13Z",
    "verificationMethod": "did:web:merajutasa.id#keys-1",
    "proofPurpose": "assertionMethod",
    "jws": "eyJhbGciOiJFZERTQSJ9..N3b6X_fakesignatureexample__m57z"
  }
}
```

---

## 11. CANONICALIZATION & HASHING GUIDELINES

Goal: Deterministic binary representation for hashing + chain inclusion.

Steps:

1. JSON Canonicalization using JCS (RFC 8785 style) OR strict lexicographic sort of keys (lowest ASCII).
2. Remove `proof` object when hashing for `credentialContentHash` (pre-sign).
3. Compute `sha256(utf8(canonicalJson))` → hex (lowercase).
4. Include `credentialContentHash` inside governance chain event (not inside credential to avoid recursive).
5. For integrity chain entry: fields: seq, timestamp, type=“CREDENTIAL_ISSUED”, credId, contentHash, prevHash, signature.

Rationale: Stable pre-proof hash ensures detect differences even if re-signed.

---

## 12. SIGNATURE & KEY MANAGEMENT (ABSTRACT SPEC)

- Algorithm baseline: Ed25519 (libsodium).
- DID Document: `did:web:merajutasa.id` hosts verificationMethod entries (#keys-1, #keys-2...) with public keys (base58).
- Rotation: New key addition before old key deprecation (overlap 7 days).
- Key custody: HUMAN (Anda/tim) – AI tidak mengelola kunci.
- proof.jws: Detached JWS: header.alg=EdDSA, header.typ=“JWT” optional; payload = base64url(canonical credential object WITHOUT proof).
- Optional upgrade: Ed25519Signature2023 / JcsEd25519Signature2024 once ecosystem stable—requires schema version patch bump.

---

## 13. REVOCATION MODEL (PLACEHOLDER)

Revocation not immediate; placeholder ensures forward compatibility.

Design:

- External `revocation list` endpoint returns array of {credId, status, revokedAt, reasonCode}.
- Credential’s own `revocation.status` is “active” or updated to “revoked” (shadow update) but consumers MUST check revocation list (list-of-truth).
- Reason codes (initial reserved):  
  - `EVIDENCE_INVALIDATED`  
  - `POLICY_VIOLATION`  
  - `EXPIRED_VERIFICATION`  
  - `REQUEST_WITHDRAWN`  
- Governance change (CIC-C) required to add new code.

Revocation Workflow (future):

1. Trigger internal review → logged decision ID.
2. Revocation list updated → chain event `CREDENTIAL_REVOKED`.
3. UI: Org shows “Verification Suspended/Revoked” badge (no ranking penalty is applied; disclaimers emphasise). <!-- data-phrase-context="disclaimer-explanation" -->

---

## 14. GOVERNANCE INTEGRATION

| Governance Event | Credential Field Affected | Log Type |
|------------------|---------------------------|---------|
| Initial issuance | Whole credential | CREDENTIAL_ISSUED |
| Key rotation | proof.verificationMethod (future issues) | KEY_ROTATION |
| Revocation | revocation.status, external list | CREDENTIAL_REVOKED |
| Reinstatement (if allowed) | revocation.status back to active | CREDENTIAL_REINSTATED |
| Schema version bump | version, credentialSchema.id | SCHEMA_CHANGE |

All events hashed + appended. Decision IDs inserted in governance.decisionIds.

---

## 15. POLICY-AS-CODE HOOKS (OPA / REGO TARGETS)

Pseudo conditions prior to issuance:

| Policy Name | Condition | Action if Fail |
|-------------|-----------|----------------|
| policy.disallowed.fields | Credential contains any prohibited field | DENY issuance |
| policy.version.allowed | version matches supported semver pattern | DENY |
| policy.verification.scope.for.verified | If verificationStatus=verified but verificationScope empty | DENY |
| policy.temporal.consistency | issuanceDate >= lastVerificationUpdate | DENY |
| policy.expiry.window | If expirationDate present and expirationDate ≤ issuanceDate | DENY |
| policy.region.whitelist | region not in allowedProvincialList | DENY |
| policy.terminology.stage.logic | Stage mismatch with adoptionPercent thresholds | WARN (not deny) |

---

## 16. DISCLAIMER LINKAGE

Credential-level disclaimersRef & meta.disclaimers hold references to disclaimers library IDs (D1–D7). UI must still show disclaimers outside credential—this is not substitution, only traceability.

---

## 17. EXTENSION & CHANGE CONTROL

| Extension Proposal | Governance Class | Required Docs |
|--------------------|------------------|---------------|
| Add optional field (non-sensitive) | CIC-C | Impact note + privacy review |
| Add required field | CIC-E | Justification & migration plan |
| Remove field | CIC-E | Deprecation notice, fallback semantics |
| Add cryptographic suite | CIC-B | Security evaluation summary |
| Introduce revocation viewer metrics | CIC-B | Misinterpretation risk memo |

No field promoting ranking or performance scoring allowed. <!-- data-phrase-context="disclaimer-explanation" --> Attempt requires Ethics Board veto procedure (fast reject).

---

## 18. LINT & CI CHECKS (REQUIRED)

Automated build must:

1. Validate JSON against schema.
2. Ensure no prohibited field names (regex list).
3. Confirm disclaimersRef points to versioned disclaimers file (exists).
4. Validate time logic (issuanceDate ≤ now, lastVerificationUpdate ≤ issuanceDate).
5. Ensure `needsDataIncluded=false` & `equityDataIncluded=false`.
6. Enforce card order unaffected by new credential field (UI independence).
7. If revocation.status != active → verify presence in revocation list (consistency).

Fail = pipeline abort (except policy.terminology.stage.logic which warns first two cycles).

---

## 19. TEST VECTORS (HASH & SIGNATURE) (INFORMATIVE)

Canonical (hypothetical) pre-proof object hash example:

- Pre-proof canonical JSON (sorted keys) → SHA256 hex: `4c2b5c4f37d4ca25e7e1f0c5a7df23b4ab71c2d064f26c476b1c7658d2dd6f4a` (example; recompute once finalized).
*Recompute after final editorial changes before production commit.*  
Store expected hash in test fixtures: `tests/fixtures/credential/hash_vector_v1.json`.

---

## 20. SECURITY & PRIVACY CONSIDERATIONS

| Vector | Risk | Mitigation |
|--------|------|-----------|
| Replay (reuse old credential after revocation) | Outdated trust claim | Mandate revocation list check & expirationDate adoption later |
| Tampering (field modification) | Fake credential appears valid offline | Signature verification + canonical hash chain event |
| Cross-link Deanonymization | Combining region + external sources | Only broad region, no micro-locational fields |
| Scope Misinterpretation | Interpreting credential as performance rating | Embedded disclaimers & UI copy banning ranking |
| Silent Schema Drift | Consumers unaware updated semantics | version field + credentialSchema.id pinned |

---

## 21. MISINTERPRETATION HANDLING

If feedback cluster indicates credential dianggap “rating” (>5% confusion):

1. Add global banner clarifying.
2. Append additional disclaimer ID (e.g., D3 reinforcement).
3. Consider adding field `interpretationNote` (requires CIC-C) — optionally reject if leads to verbosity.

---

## 22. PERFORMANCE

Credential size target: ≤ 3 KB typical (excluding signature). Avoid bloat: limit arrays (verificationScope ≤3), truncated evidence hash (16–24 hex recommended while maintain collision practicality for display; full hash stored internally in chain event).

---

## 23. LOCALIZATION

Credential uses canonical English tokens for portability; UI localizes labels. Do not localize field keys. Terminology object stage enumerations remain English-coded identifiers.

---

## 24. FUTURE EXTENSIONS (PLACEHOLDER, NOT APPROVED)

| Candidate Field | Purpose | Pre-Assessment |
|-----------------|---------|---------------|
| accreditationBody | External oversight reference | Could add; needs anti-misuse guidelines |
| governanceScore (BAN) | Would rank governance | Rejected – ranking risk |
| lastPolicyAuditDate | Auditable governance recency | Low risk; future patch |
| revocationReasonCode | Already planned in revocation list (not embedded) | Keep external |

---

## 25. DEPLOYMENT STEPS (MVP)

1. Publish JSON Schema at canonical URL.
2. Publish context JSON-LD.
3. Generate DID document with key #keys-1.
4. Implement signing service (returns credential with proof).
5. Build verification CLI doc referencing schema URL & DID.
6. Integrate issuance pipeline: validate → sign → store canonical form + content hash → log chain event.
7. Expose verify endpoint: Accept credential JSON → return validity, revocation status, schema version match.

---

## 26. VERIFICATION PROCESS (CONSUMER)

Steps:

1. Fetch credential JSON.
2. Validate against schema (fail early).
3. Extract proof; canonicalize credential minus proof.
4. Verify Ed25519 signature via verificationMethod in DID doc.
5. Optional: fetch revocation list → verify credId not revoked.
6. Optional: fetch hash chain tail → ensure contentHash present.
7. Confirm absence of prohibited fields (defense-in-depth).
8. Confirm disclaimersRef resolvable (for narrative context).

Return status: { isValid, signatureValid, schemaValid, notRevoked, chainAnchored, warnings[] }.

---

## 27. ERROR / WARNING CODES (SPEC)

| Code | Level | Meaning | Consumer Action |
|------|-------|---------|-----------------|
| ERR_SCHEMA_INVALID | error | Fails JSON Schema | Reject |
| ERR_SIGNATURE_INVALID | error | Signature fail | Reject |
| ERR_REVOKED | error | Found in revocation list | Reject |
| WARN_NEAR_EXPIRY | warning | expiration in <30d | Flag |
| WARN_STAGE_MISMATCH | warning | terminology stage inconsistent with adoptionPercent | Investigate |
| WARN_UNKNOWN_POLICY | warning | governance.policySet contains unknown key | Soft ignore |
| WARN_HASH_NOT_CHAINED | warning | contentHash not found in chain (network mismatch / lag) | Retry / manual audit |

---

## 28. CHANGE MANAGEMENT & VERSIONING

- Minor additive optional field: version patch (1.0.x).
- Add required field / structural semantics shift: bump minor (1.1.x) (still within major 1).
- Breaking removal or meaning change: major 2.0 (requires governance multi-step: announce → deprecation window → migration plan).
- Maintain migration map `docs/integrity/migrations.md`.

---

## 29. AUDIT LOG MAPPING (CHAIN EVENT)

Chain entry JSON (example):

```json
{
  "seq": 142,
  "timestamp": "2025-08-12T02:55:13Z",
  "type": "CREDENTIAL_ISSUED",
  "credId": "urn:merajutasa:cred:2f8f3a2d-8c41-4e55-9c67-19b6ad73c201",
  "contentHash": "4c2b5c4f37d4ca25e7e1f0c5a7df23b4ab71c2d064f26c476b1c7658d2dd6f4a",
  "prevHash": "b93f2da17c9e44df...",
  "signature": "z9Ed...sig"
}
```

Fields `credId`, `contentHash` non‑PII; safe to expose in excerpt (truncate if needed).

---

## 30. COMPLIANCE WITH MASTER SPEC (TRACE)

| Master Spec Element | Credential Reflection |
|---------------------|------------------------|
| Non-Ranking | No ranking fields; disclaimers explicit |
| Privacy | No child PII, no address |
| Governance | decisionIds & policySet fields |
| Transition | terminology object optional with adoptionPercent |
| Portability | JSON-LD + DID method |
| Observability | hashChainHead reference & chain anchoring |
| Revocation Future | placeholder revocation section |

---

## 31. OPEN DECISIONS (NEEDED TO RATIFY)

| Decision | Options | Recommendation | Owner |
|----------|---------|----------------|-------|
| Expiration adoption timing | immediate / after revocation subsystem | After revocation subsystem (Phase 2) | Governance |
| verificationEvidenceHash length displayed | 16 / 24 / full 64 | 16 (UI) + full internal chain | Governance |
| Hysteresis reference link in credential? | yes/no | No (keep fairness outside credential) | Governance |
| Terminology fields inclusion at issuance | always / only stage1 | Only stage1 & stage2 | Governance |
| Allow “suspended” state pre-revocation? | yes/no | Yes (grace status) | Governance |

---

## 32. IMPLEMENTATION ACCEPTANCE CRITERIA (MVP)

- [ ] Schema published & fetchable (200 OK).
- [ ] Example credential validates & signature verifiable.
- [ ] Lint blocks prohibited field injection test.
- [ ] governance.decisionIds cross-referenced with chain events (≥1).
- [ ] CLI verification returns all success flags for example.
- [ ] Revocation endpoint returns JSON list (empty) with correct schema.
- [ ] Content hash for example credential present in chain event log.
- [ ] DisclaimersRef resolves to stable disclaimers with IDs D1–D7.

---

## 33. RISKS & MITIGATIONS

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Incorrect canonicalization leads to signature mismatch | Undermines trust | Medium | Provide test vectors & JCS libs |
| Schema drift without version bump | Consumers misinterpret | Low | Lint requiring version bump on diff |
| Overuse of optional fields → bloat | Larger payload & complexity | Medium | Policy limiting additive fields per quarter |
| Revocation path not ready but field exists | Confusion | Medium | Document placeholder + status=active only |
| Credential reused after scope change (region) | Stale region data | Medium | Add chain event on region change + new issuance |
| Partial evidence scope misinterpreted as full audit | Overtrust | Medium | verificationScope enumerated + doc about scope limitations |

---

## 34. FUTURE ROADMAP (CREDENTIAL EVOLUTION)

| Phase | Enhancement | Gate |
|-------|-------------|------|
| 1.5 | Add lastPolicyAuditDate (optional) | Governance sign-off |
| 2 | Add expirationDate & scheduler renewal | Revocation infrastructure |
| 2 | Revocation reasons formal field mapping (external list) | Ethics approval |
| 3 | Integrity attestation claims (multi-signed by peer nodes) | Federation readiness |
| 3 | Compact binary form (CBOR LD) for offline verification | Performance need established |

---

## 35. SUMMARY STATEMENT

Integrity Credential v1.0 memberikan pondasi portabel, minim, non‑ranking, dan dapat diaudit yang menyelaraskan semua pilar: privacy, fairness, governance, portability, & transition. Tidak ada deviations dari strategi; struktur mempersiapkan revocation & extensibility tanpa membuka risiko data sensitif. Immediate next step: governance ratification + implement signer & chain to avoid trust theater.

---

## 36. ACTION NEXT (AI vs ANDA)

| Action | Owner |
|--------|-------|
| Ratify open decisions (Section 31) | ANDA / Governance |
| Publish schema & context files | ANDA |
| Create decision log entry DEC (issuance of schema) | ANDA |
| Provide final example credential (regenerated hash) | ANDA |
| Add lint & CI validation referencing this schema | ANDA |
| Draft CLI verify doc (AI on request) | AI |
| Hysteresis doc (separate) | AI (pending your command) |

---

## 37. APPENDIX – PROHIBITED FIELD REGEX LIST (INITIAL)

```regex
(child(Name|DOB|Date)|case(Id|ID)|address|lat|lng|geo|rating|rank|score|performance|donation|bank|vulnerability|riskScore|numberOfChildren|occupancy|testimonial|story)
```

Case-insensitive; boundaries ensured; can expand.

---

## 38. APPENDIX – SAMPLE LINT FAILURE MESSAGE

`[CRED-LINT-004] Prohibited field 'ratingScore' detected in credentialSubject. Remove to comply with privacy & non-ranking policy.`

---

## 39. APPENDIX – DIFF POLICY

Any diff to schema file triggers:

1. Extract structural changes (keys added/removed/modified).
2. Compare with version bump rule; if mismatch → fail pipeline with instruction.
3. Generate machine patch summary saved to `docs/integrity/diff/cred-schema-v1.0-to-v1.0.x.json`.

---

(End of Integrity Credential Schema Final Draft v1.0)
