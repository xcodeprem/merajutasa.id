# MerajutASA – PII Pattern Library & Detection Framework (v1.0)
Status: Draft for Ratification (CIC-A on tooling implementation; CIC-E if detection semantics expanded beyond declared scope)  
Prepared: 2025-08-12  
Related Docs: Master Spec v2.0 (Privacy & Fairness Principles), Event Schema Canonical v1.0, Disclaimers Lint Spec v1.0, Integrity Credential Schema v1.0, Hysteresis Options Decision Pack  
NON-DESTRUCTIVE: Dokumen ini MENAMBAHKAN detail; tidak menghapus strategi/konstraint sebelumnya (GP1 Privacy-by-Architecture, GP6 Outcome Honesty, GP9 Non-Ranking).  

> PURPOSE  
Menyediakan katalog pola (regex & heuristik) untuk mendeteksi, menandai, atau memblokir masukan yang berpotensi mengandung PII ketika pengguna mengirim feedback / teks bebas (public tier), serta mencegah kebocoran PII di konten yang tak disengaja. Fokus pada konteks Indonesia & format umum yang tinggi risiko re-identifikasi.

---

## 1. PRINCIPLES APPLIED
| Principle | Application |
|----------|-------------|
| GP1 Privacy-by-Architecture | Blok atau scramble PII sebelum persist/log; tidak menyimpan raw. |
| GP2 Executable Governance | Pattern set versioned & hashed; perubahan butuh DEC. |
| GP5 Transparency | Kategori PII didokumentasi publik ringkas (FAQ) tanpa detail yang memudahkan penjahat menghindari deteksi. |
| GP6 Outcome Honesty | Tidak over-claim (pattern “100% akurat”); jelaskan false positive possibility. |
| GP9 Non-Ranking Fairness | Scanner tidak membuat penilaian entitas; hanya sanitasi. |
| GP10 Observability | Event pub_feedback_block_pii dengan pattern_type (Event Schema v1.0). |

---

## 2. SCOPE & NON-SCOPE
IN-SCOPE:  
- Input feedback form, optional free-text internal admin notes (future).  
- Inline detection pada pipeline ingestion event.  
- PII kategori: identitas personal (NIK), identitas pendidikan (NISN), identitas keluarga (No KK), nomor telepon, alamat email, potensi alamat rumah, rekening bank umum, plat kendaraan (opsional filter), nama anak + usia bersanding (heuristik), tanggal lahir individu, pola KTP.  

OUT-OF-SCOPE (v1):  
- Gambar / OCR, audio, file attachments.  
- Advanced NLP de-identification (contextual redaction).  
- Entity linking cross-dataset.  

---

## 3. PII CATEGORY TAXONOMY

| Code | Category | Description | Risk Level | Action |
|------|----------|-------------|-----------|--------|
| IDN_NIK | Nomor Induk Kependudukan | 16 digit dengan checksum sederhana pola administratif | High | BLOCK (reject submission) |
| IDN_NKK | Nomor Kartu Keluarga | 16 digit (mirip NIK, beda subset) | High | BLOCK |
| EDU_NISN | Nomor Induk Siswa Nasional | 10 digit (awal tidak selalu) | Medium | BLOCK |
| CONTACT_EMAIL | Email pribadi | Format RFC partially simplified | Medium | REDACT (store hashed) |
| CONTACT_PHONE | Nomor telepon / HP Indonesia | +62 / 08 prefix; 10–13 digits | Medium | REDACT (store masked) |
| ADDRESS_STREET | Alamat rumah (heuristic) | Kata kunci “Jl.” “Jalan” + angka / RT/RW | Medium | MASK (pattern-level) |
| DOB | Tanggal lahir individu | dd-mm-yyyy / dd/mm/yyyy / dd mmmm yyyy | Medium | REDACT |
| BANK_ACCOUNT | Rekening bank (umum 10–16 digit) + keyphrase bank | High | BLOCK |
| PLATE_ID | Plat kendaraan (B 1234 XYZ) | Low | WARN (optionally block if combined) |
| CHILD_NAME_AGE | Nama anak + usia ( “(7 tahun)” ) | High (child-specific) | BLOCK |
| FREE_NAME | Nama personal (first + last) heuristik | Low | IGNORE (v1) unless combined with DOB or address |
| GEO_FINE | Koordinat lat/lng | pattern lat,lon numeric | High | BLOCK |
| GOV_ID_DOC | Sebutan KTP / SIM + nomor >8 digit | High | BLOCK |
| EMAIL_IN_NAME | Email terselip dalam kata panjang | Medium | REDACT |
| IBAN_LIKE (future) | Format IBAN internasional | Medium | BLOCK (phase 2) |

---

## 4. PATTERN DEFINITIONS (REGEX CORE)
Semua regex case-insensitive kecuali disebutkan.

| Code | Regex (simplified) | Notes / False Positive Mitigation |
|------|--------------------|-----------------------------------|
| IDN_NIK | `\b\d{16}\b` + heuristic (prefix 2 digit valid province 11–95) | Confirm first 2 digits in ID province list; else treat unknown_16digit (reduce FP). |
| IDN_NKK | `\b\d{16}\b` + NOT matched as NIK? (fallback classification) | If fails NIK province list but still 16 digits → assume NKK unless context denies. |
| EDU_NISN | `\b\d{10}\b` + context word boundary with preceding/following “NISN” (case-ins) optional | To reduce FP with random numbers. |
| CONTACT_EMAIL | `\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b` | Truncate local part to first 2 chars + hash remainder. |
| CONTACT_PHONE | `\b(?:\+62|62|0)(?:8[1-9])[0-9]{6,10}\b` | Carrier-specific prefix reduce FP; length 9–13 digits. |
| ADDRESS_STREET | `\b(Jl\.?|Jalan)\s+[A-Za-z0-9]+(?:\s+[A-Za-z0-9]+){0,4}(?:\s*No\.?\s*\d+)?` OR presence of `RT\s*\d{1,3}/RW\s*\d{1,3}` | Combine tokens; threshold >2 address markers to trigger. |
| DOB | `\b(0?[1-9]|[12][0-9]|3[01])([-/])(0?[1-9]|1[0-2])\2(19|20)\d{2}\b` OR spelled month Indonesian | Exclude if appears inside hash or code context. |
| BANK_ACCOUNT | `\b(?:bank|rek|rekening)\b.*?\b\d{10,16}\b` | Require keyword within 40 chars to reduce FP. |
| PLATE_ID | `\b[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}\b` | Exclude if all uppercase word block >30 chars (table header). |
| CHILD_NAME_AGE | `\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*\(\s*(\d{1,2})\s*(th|tahun)\s*\)` | Age ≤17 triggers block. |
| GEO_FINE | `\b(-?\d{1,2}\.\d{4,}),\s*(-?\d{1,3}\.\d{4,})\b` | Limit lat range -10..10, lon 90..150 (Indonesia approx). |
| GOV_ID_DOC | `(KTP|SIM|Paspor)\s*(No\.?|Nomor)?\s*\d{8,}` | Require keyword. |
| EMAIL_IN_NAME | `[A-Za-z0-9]{5,}@` inside a longer token lacking whitespace | If token split reveals email, reuse CONTACT_EMAIL logic. |

Normalization required: collapse Unicode homoglyphs (e.g., fullwidth digits, zero-width spaces).

---

## 5. PROVINCE CODE LIST (NIK prefix validation)
Valid first 2 digits (subset; complete list maintained separately):  
`11,12,13,14,15,16,17,18,19,21,31,32,33,34,35,36,51,52,53,61,62,63,64,65,71,72,73,74,75,76,81,82,91,92,94,95`  
If 16-digit number prefix not in set → degrade classification to GENERIC_16DIGIT (no block unless with context `NIK|KTP`).

---

## 6. CLASSIFICATION LOGIC (DECISION TREE)
1. Normalize input (strip ASCII control, unify whitespace).
2. Tokenize & run multi-pattern matches.
3. If multiple categories detected with escalating severity (e.g., EMAIL + PHONE + ADDRESS) do combined risk escalation.
4. Priority order for overlapping numeric patterns:  
   IDN_NIK > IDN_NKK > BANK_ACCOUNT > GEO_FINE > EDU_NISN > GENERIC_16DIGIT.
5. If CHILD_NAME_AGE detected → immediate block (child safeguarding).
6. If only CONTACT_EMAIL or CONTACT_PHONE and length < 400 feedback chars → REDACT not block (encourage feedback continuity).
7. If >2 distinct PII categories → escalate to BLOCK (multi leakage).
8. Logging: store sanitized summary (PII types, counts); do not persist raw PII.

---

## 7. ACTION MATRIX

| Action | Description | Response to User | Storage |
|--------|-------------|------------------|---------|
| BLOCK | Reject submission; display privacy rationale | “Bagian tertentu terdeteksi mengandung data pribadi sensitif (misal nomor identitas). Mohon hapus sebelum mengirim.” | Event logged (pattern_type) |
| REDACT | Replace with placeholder tokens & accept | “Beberapa detail kontak disamarkan untuk privasi.” | Placeholder + hashed root |
| MASK | Partial masking (address components) | “Alamat diringkas demi privasi.” | Masked form |
| WARN (internal) | Not shown; internal flag (e.g., PLATE_ID alone) | No user message | Flag counter |
| IGNORE | No action (free name alone) | None | None |

---

## 8. REDACTION / MASKING FORMAT

| Category | Replacement |
|----------|-------------|
| CONTACT_EMAIL | `email:[local2]***@domain.tld` (store SHA256 of full) |
| CONTACT_PHONE | `phone:+62****{last3}` (store SHA256) |
| ADDRESS_STREET | Replace street name tokens with `Jl.[masked]` keep city/province if generic |
| DOB | `DOB:[redacted]` |
| BANK_ACCOUNT | BLOCK (no redaction) |
| PLATE_ID | `plate:[masked]` if escalated; else unchanged |
| CHILD_NAME_AGE | BLOCK |
| GEO_FINE | `geo:[approx]` or BLOCK if high precision |

Hash salt rotated daily; keep 7-day rolling salts to detect repeat submissions without deanonymizing.

---

## 9. NORMALIZATION PIPELINE

Steps:
1. Unicode NFKC normalization.
2. Replace zero-width & control chars.
3. Standardize line breaks to `\n`.
4. Convert fullwidth digits to ASCII.
5. Lowercase copy for pattern detection (except name heuristics).
6. Maintain parallel original for targeted redaction spans.

---

## 10. FALSE POSITIVE MITIGATION

| Pattern | Potential FP | Mitigation |
|---------|--------------|-----------|
| 16-digit numbers | Order IDs, transaction codes | Province prefix verification |
| Phone numbers | Random numeric tokens | Require Indonesia prefix patterns |
| Address heuristic | Mention of “Jalan cerita” (figurative) | Require numeric + optional RT/RW or “No.” |
| DOB | Date ranges (“Promo 01/09/2025–02/10/2025”) | Block only if single date, not range pattern with dash |
| NISN | Random 10-digit IDs | Require context “NISN” if FP rate high > threshold |
| Plate ID | Acronyms + numbers | Only classify if pattern start of token OR spaced properly |

Adaptive Toggle: If FP rate > target (e.g., 5%), escalate required context tokens (e.g., for EDUCATION ID).

---

## 11. TEST CORPUS DESIGN

| Corpus Segment | Examples Count | Purpose |
|----------------|----------------|---------|
| Positive High Risk (NIK, KK, Bank) | 50 | Ensure BLOCK accuracy |
| Positive Medium (Email, Phone) | 100 | Redaction pathways |
| Neutral Non-PII (marketing text) | 200 | FP measurement baseline |
| Mixed Multi-PII | 30 | Multi category escalation |
| Edge Cases (format spacing, zero-width) | 40 | Robust normalization |
| Decoy FP (random 16-digit not province) | 60 | Validate downgrade logic |
| Contextual address illusions | 25 | Address heuristic precision |
| Child name + age disguised | 25 | Age parentheses variants |
| Date ranges vs DOB singles | 40 | Distinguish birthday vs promo |

All stored as synthetic generation script (no real identities). Provide manual review tag.

---

## 12. QUALITY METRICS (TARGETS INITIAL)

| Metric | Target |
|--------|--------|
| Recall High Risk (NIK, KK, Bank, CHILD_NAME_AGE) | ≥ 0.98 |
| Precision High Risk | ≥ 0.95 |
| Recall Medium (Email, Phone, Address) | ≥ 0.90 |
| Precision Medium | ≥ 0.90 |
| False Positive Rate Overall | < 0.05 |
| Multi-PII Escalation Accuracy | ≥ 0.95 |
| Latency (p95) per 2KB input | < 20ms |

Review monthly; adjust patterns.

---

## 13. EVENT INTEGRATION

When BLOCK or REDACT triggered:
- Emit `pub_feedback_block_pii` (pattern_type = highest severity category OR “multi”).
- If multiple categories, include `meta.pattern_type="multi"` and summary counts in internal-only field (not public event schema unless extended).
- For accepted with redaction, original event `pub_feedback_submit` includes `contains_pii=true` (already in Event Schema recommended extension).

---

## 14. CONFIG FILE (YAML) – PATTERN ENABLE FLAGS

File: `config/pii/patterns.yml`

```yaml
version: 1
updated: "2025-08-12T03:55:00Z"
min_high_risk_block: true
patterns:
  IDN_NIK:
    enabled: true
    province_prefix_check: true
  IDN_NKK:
    enabled: true
  EDU_NISN:
    enabled: true
    require_context_keyword: false
  CONTACT_EMAIL:
    enabled: true
    redaction: hash_local
  CONTACT_PHONE:
    enabled: true
    min_length: 9
  ADDRESS_STREET:
    enabled: true
    min_markers: 2
  DOB:
    enabled: true
    block_mode: false
  BANK_ACCOUNT:
    enabled: true
    keyword_distance: 40
  PLATE_ID:
    enabled: true
    action: warn
  CHILD_NAME_AGE:
    enabled: true
  GEO_FINE:
    enabled: true
    lat_range: [-10,10]
    lon_range: [90,150]
escalation:
  multi_category_block_threshold: 2
hashing:
  salts_retention_days: 7
  algorithm: sha256
logging:
  store_snippet: false
  store_categories: true
```

---

## 15. PSEUDOCODE DETECTION ENGINE

```
function scanPII(inputRaw, config):
  norm = normalize(inputRaw)
  matches = []

  for pattern in orderedPatterns(config):
     res = applyPattern(pattern, norm, config[pattern])
     if res:
        matches.append(res)

  matches = deduplicateOverlaps(matches)

  classification = classify(matches, config.escalation)

  redactedText = inputRaw
  actions = []

  for m in matches:
     if m.action == 'REDACT':
        redactedText = replaceSpan(redactedText, m.span, m.replacement)
     elif m.action == 'MASK':
        redactedText = maskSpan(redactedText, m.span)
     # BLOCK handled separately

  result = {
     "blocked": classification.block,
     "redacted": redactedText if not classification.block else null,
     "categories": uniqueCategories(matches),
     "multi": classification.multi,
     "hashes": hashSensitive(matches)
  }

  return result
```

---

## 16. HASHING STRATEGY
- For CONTACT_EMAIL / CONTACT_PHONE only.
- Hash input normalized (e.g., lowercased email) + daily rotating salt.
- Format stored: `sha256(base64url(salt)||value)` truncated to 16 hex for storage footprint.
- Rotating salt file: `config/pii/salts/<YYYY-MM-DD>.salt` secure access; old salts purged after retention.

---

## 17. ESCALATION RULES

| Condition | Escalation |
|-----------|------------|
| High-risk category present (NIK, KK, BANK_ACCOUNT, CHILD_NAME_AGE, GEO_FINE) | BLOCK regardless of others |
| ≥2 categories total AND includes at least one medium | BLOCK |
| Only medium categories (email/phone/address) | REDACT / MASK |
| Only low-risk (plate) | WARN (accept) |
| DOB + Name heuristic (two capitalized tokens) | REDACT (not BLOCK) unless age <18 flagged with child link (not implemented yet) |

---

## 18. CHILD PROTECTION EXTENSION (FUTURE)
Add pattern: “(Anak|Adik|Si kecil)\s+[A-Z][a-z]+” combined with age pattern. For now avoid over-blocking; evaluate false positives with test bench.

---

## 19. NAME + AGE HEURISTIC DETAIL
Regex combination:
- Name token: `\b[A-Z][a-z]{2,}(\s[A-Z][a-z]{2,})?\b`
- Age: `\b(\d{1,2})\s*(th|tahun)\b`
Window ≤ 25 characters between. If age ≤17 & context words `anak|usia|umur` present → CHILD_NAME_AGE.

---

## 20. LATENCY OPTIMIZATION
- Precompile all regex patterns.
- Multi-phase scan: high-risk numeric patterns first (NIK/KK) to early exit if BLOCK.
- Use Aho-Corasick for keyword triggers (bank, jalan, RT, RW) before expensive expansions.
- Benchmark with 4KB payload typical; concurrency safe.

---

## 21. LOGGING & OBSERVABILITY FIELDS
Internal log (not user visible):
| Field | Example |
|-------|---------|
| pii_scan_version | `pii-v1.0` |
| categories | `["CONTACT_EMAIL","CONTACT_PHONE"]` |
| action | `REDACT` |
| blocked | false |
| detection_time_ms | 7 |
| raw_length | 420 |
| match_count | 3 |

No raw PII stored.

---

## 22. GOVERNANCE CHANGE CONTROL

| Change | Class | Notes |
|--------|-------|-------|
| Add new high-risk pattern | CIC-E | Privacy review required |
| Adjust threshold multi_category_block_threshold | CIC-C | Provide impact analysis |
| Remove pattern | CIC-E | Document reason & risk acceptance |
| Lower precision criterion (e.g., disable province prefix check) | CIC-E | Increases FP risk |

All changes recorded in decision log, referencing pattern library version bump.

---

## 23. VERSIONING POLICY
File: `docs/privacy/pii-pattern-library-v1.md` version increments:
- Patch (1.0.x): refine regex (tighten), add false-positive mitigation.
- Minor (1.1.0): add new category.
- Major (2.0.0): shift detection approach (NLP context-based) or change action semantics.

Store machine-readable manifest: `config/pii/version.json`.

---

## 24. RISK REGISTER (PII DETECTION)

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| High false positives block real feedback | Reduced participation | Medium | Provide redacted fallback where possible; do not block medium categories |
| False negatives (clever obfuscation) | PII leak | Medium | Add normalization & homoglyph handling; periodic review |
| Over-reliance (false sense of safety) | Hidden risk | High | Messaging: “Deteksi bersifat best-effort” in privacy policy |
| Hash salt compromise | Correlation risk | Low | Rotate + limit salt access |
| Pattern maintenance drift | Obsolete detection | Medium | Quarterly review schedule |

---

## 25. USER MESSAGING (UI COPY DRAFT)

Blocked Submission Notice (High-Risk):
“Untuk melindungi privasi dan keamanan, sistem mendeteksi data pribadi (misal nomor identitas). Mohon hapus atau ubah sebelum mengirim.”

Redacted Notice (Medium):
“Beberapa detail (email/nomor telepon) kami samarkan demi privasi. Saran Anda tetap tersimpan.”

Privacy FAQ Addition:
“Kami mendeteksi pola umum (misal NIK, email). Sistem tidak sempurna; hindari memasukkan data pribadi anak atau informasi identitas sensitif.”

---

## 26. PUBLIC TRANSPARENCY (ABRIDGED)
Publish a simplified excerpt: categories monitored (no raw regex) + rationale + oversight statement; keep full pattern details internal to reduce evasion risk.

---

## 27. TEST AUTOMATION SUITE OUTLINE

Directory: `tests/pii/`

| File | Purpose |
|------|---------|
| `positive_nik_cases.json` | Ensure detection & block |
| `positive_email_phone.json` | Ensure redaction |
| `address_heuristics.json` | Evaluate precision |
| `false_positive_numeric.json` | Ensure degrade classification |
| `child_name_age.json` | Block correctness |
| `performance_benchmark.txt` | Baseline timing |
| `multi_category_escalation.json` | Combined escalation tests |

CI Gate: tests must pass; detection_time_ms p95 below threshold.

---

## 28. METRICS DASHBOARD (PRIVACY OBSERVABILITY)

| KPI | Query Basis |
|-----|-------------|
| PII Block Rate | count(block) / total submissions |
| Redaction Rate | count(redacted) / submissions |
| Multi-Category Escalations | count(matches categories>=2) |
| FP Review Queue Size | Manual labeled samples flagged FP |
| Avg Detection Latency | mean(detection_time_ms) |
| Category Distribution | histogram(matches.category) |

Trigger: If Block Rate > 20% first month → review threshold (may overly strict or user education needed).

---

## 29. EXAMPLE SCAN OUTPUT (INTERNAL)

```json
{
  "input_length": 312,
  "blocked": false,
  "action": "REDACT",
  "categories": ["CONTACT_EMAIL","CONTACT_PHONE"],
  "redacted_text": "Saya ingin tahu ... email:[jo]***@contoh.id ... phone:+62****123",
  "hashes": {
    "CONTACT_EMAIL": "ec91f3a7d4e9a8b2",
    "CONTACT_PHONE": "a72d93c1180bf4e1"
  },
  "detection_time_ms": 9,
  "pii_scan_version": "pii-v1.0"
}
```

---

## 30. EXAMPLE BLOCK OUTPUT

```json
{
  "blocked": true,
  "categories": ["IDN_NIK"],
  "message": "High risk personal identifier detected (NIK).",
  "pii_scan_version": "pii-v1.0"
}
```

---

## 31. INTEGRATION SEQUENCE (FEEDBACK SUBMISSION)

1. Client posts raw feedback.
2. API gateway runs `scanPII`.
3. If blocked → return 400 + localized message.
4. If redacted → store redacted + category summary.
5. Emit events (`pub_feedback_block_pii` or `pub_feedback_submit`).
6. Write anonymized log (no raw).
7. Periodic scheduled job samples 1% redacted results for manual FP audit (strip hashed forms).

---

## 32. GOVERNANCE DECISION PROMPT (TO RATIFY)

Decisions needed:
| Decision | Options | Recommendation |
|----------|---------|---------------|
| Enter thresholds (multi_category_block_threshold) | 2 / 3 | 2 |
| Province prefix strict mode | On / Off | On |
| Bank account classification keyword required | Yes / No | Yes |
| Address min markers | 1 / 2 / 3 | 2 |
| DOB action | Redact / Block | Redact |
| PLATE_ID action | Warn / Ignore / Block | Warn |
| Age threshold child detection | 17 / 18 | 17 |
| Hash retention days | 7 / 14 | 7 |

Balas format:  
`KEPUTUSAN: multi=2, province=on, bank_keyword=yes, address_markers=2, dob=redact, plate=warn, child_age=17, hash_retention=7`

---

## 33. ACCEPTANCE CRITERIA (IMPLEMENTATION)

- [ ] Pattern set compiled & passes test corpus (targets Section 12).
- [ ] Latency p95 < 20ms for 2KB input in CI benchmark.
- [ ] False positive sample rate < 5% in initial synthetic tests.
- [ ] Events emitted with correct pattern_type for block.
- [ ] Hash rotation script scheduled (daily).
- [ ] Governance DEC entry created with chosen parameters.
- [ ] Documentation snippet added to public privacy FAQ (abridged).
- [ ] Security review sign-off (no raw PII logs).

---

## 34. CHANGE LOG (LOCAL)

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2025-08-12 | Initial pattern library & framework |

---

## 35. SUMMARY ONE-LINER
“Pattern library v1.0 memberikan deteksi deterministik, terukur, dan dapat diaudit untuk mencegah kebocoran data pribadi sambil mempertahankan umpan balik bernilai dengan redaksi adaptif.”

---

## 36. NEXT ACTIONS

| Action | Owner |
|--------|-------|
| Ratify decisions (Section 32) | Governance |
| Implement scanner (server) | Engineering |
| Build test corpus & CI integration | Engineering |
| Add event wiring & dashboards | Analytics |
| Publish privacy FAQ excerpt | UX Writer |
| DEC entry & version hash record | Governance |
| Monitor first-week metrics (block vs redact) | Privacy Lead |

---

## 37. APPENDIX – REGEX CONSOLIDATED (RAW)

```regex
# NIK (prefix validated separately)
\b\d{16}\b

# Phone
\b(?:\+62|62|0)(?:8[1-9])[0-9]{6,10}\b

# Email
\b[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}\b

# Address markers
\b(Jl\.?|Jalan)\s+[A-Za-z0-9]+(?:\s+[A-Za-z0-9]+){0,4}(?:\s*No\.?\s*\d+)?|\bRT\s*\d{1,3}/RW\s*\d{1,3}\b

# DOB (numeric)
\b(0?[1-9]|[12][0-9]|3[01])([-/])(0?[1-9]|1[0-2])\2(19|20)\d{2}\b

# DOB (indonesian month words)
\b(0?[1-9]|[12][0-9]|3[01])\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(19|20)\d{2}\b

# Bank account (with keyword)
\b(?:bank|rek|rekening)\b.{0,40}\b\d{10,16}\b

# Plate
\b[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}\b

# Child name + age
\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*\(\s*(\d{1,2})\s*(th|tahun)\s*\)

# Geo
\b(-?\d{1,2}\.\d{4,}),\s*(-?\d{1,3}\.\d{4,})\b

# Gov ID doc number
(KTP|SIM|Paspor)\s*(No\.?|Nomor)?\s*\d{8,}
```

---

## 38. APPENDIX – SIMPLIFIED PUBLIC EXCERPT (FOR PRIVACY PAGE)
(Not for internal lint; just educational)
“Platform otomatis menyaring pola data pribadi seperti nomor identitas kependudukan, nomor kartu keluarga, kontak (email/telepon), alamat spesifik, tanggal lahir, dan detail anak. Jika terdeteksi, entri diblokir atau disamarkan. Sistem tidak menyimpan data pribadi bentuk mentah.”

---

## 39. ACKNOWLEDGEMENT
Spec ini mempertahankan integritas strategi: menutup gap privasi sebelum skala, menghindari trust theater, mempersiapkan audit trail melalui event schema & governance log, serta tidak membawa ranking atau data anak ke permukaan—konsisten dengan semua dokumen sebelumnya.

(End of PII Pattern Library & Detection Framework v1.0)