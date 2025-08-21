# Privacy & PII Protection — Documentation Index

Status: Canonical Privacy Documentation Hub  
Purpose: Indeks terpusat untuk kebijakan privasi, deteksi PII, minimalisasi data, dan strategi mitigasi risiko  
Last Updated: 2025-08-21

> **Privacy-First Architecture**  
> MerajutASA.id menerapkan prinsip privacy-by-design dengan deteksi PII otomatis, minimalisasi data, dan transparansi kontrol untuk mencegah kebocoran data pribadi sambil mempertahankan utilitas feedback publik.

---

## 🛡️ Prinsip Privasi Inti

### Framework Dasar

- **Minimalisasi Data**: Hanya kumpulkan data yang diperlukan untuk tujuan spesifik
- **Pembatasan Tujuan**: Data hanya digunakan sesuai tujuan pengumpulan awal  
- **Akuntabilitas**: Dokumentasi lengkap praktik penanganan data dan audit trail
- **Transparansi**: Pengguna diberi informasi jelas tentang pemrosesan data mereka

### Standar Kepatuhan

- **ISO 29100**: Privacy framework internasional
- **UU PDP 27/2022**: Undang-undang Perlindungan Data Pribadi Indonesia
- **GDPR**: Aplikabilitas untuk pengguna EU
- **Prinsip No-Child-Data**: Tidak memproses/menampilkan data pribadi anak

---

## 🔍 PII Detection & Management

### Pattern Library & Detection Framework

- **[PII Pattern Library v1.0](pii-pattern-library-v1.md)** — Framework deteksi komprehensif dengan pola regex dan heuristik
  - 11+ kategori PII termasuk NIK, KK, NISN, email, telepon, alamat
  - Sistem klasifikasi risiko (High/Medium/Low) dengan tindakan sesuai (BLOCK/REDACT/WARN)
  - Dukungan konteks Indonesia dengan validasi province code
  - Pattern versioning dan governance change control

### Scanner Usage Guidelines

| Kategori PII | Risk Level | Tindakan | Implementasi |
|--------------|------------|----------|--------------|
| **IDN_NIK** (16 digit NIK) | High | BLOCK | Reject submission sepenuhnya |
| **IDN_NKK** (16 digit No KK) | High | BLOCK | Reject submission sepenuhnya |  
| **CONTACT_EMAIL** | Medium | REDACT | Store hashed version |
| **CONTACT_PHONE** | Medium | REDACT | Store masked format |
| **ADDRESS_STREET** | Medium | REDACT | Remove specific identifiers |
| **DOB** (tanggal lahir) | Medium | REDACT | Generalize to year only |
| **CHILD_NAME_AGE** | High | BLOCK | Protect minors completely |
| **BANK_ACCOUNT** | High | BLOCK | Financial privacy protection |

### Mitigasi False Positives

- **Corpus Testing**: [Positive test cases](corpus/positive-highrisk.md) dan [negative decoys](corpus/negative-decoy.md)
- **Context Validation**: Province code verification untuk NIK, keyword proximity untuk akun bank
- **Multi-phase Scanning**: High-risk patterns first untuk early exit optimization
- **Threshold Configuration**: Adjustable sensitivity per environment (dev/staging/prod)

---

## 🔐 Data Minimization & Security

### Hash & Salt Management

- **[PII Rotation Policy](pii-rotation-policy.md)** — Automated salt rotation untuk PII hashing
  - Daily rotation at 08:00 UTC via GitHub Actions
  - 14-day retention window untuk previous salts
  - Zero raw PII storage — hanya hashed representations

### Redaction & Masking Formats

| Data Type | Original | Redacted Format | Purpose |
|-----------|----------|-----------------|---------|
| Email | `user@example.com` | [EMAIL_REDACTED] | Indicate presence without exposure |
| Phone | +6281234567890 | +62812***67890 | Partial masking for reference |
| Address | Jl. Merdeka No. 10 | [ADDRESS_REDACTED] | Complete address removal |
| Bank Account | rek 123456789012 | [BANK_REDACTED] | Financial privacy protection |

### Logging & Observability

Internal monitoring tanpa PII exposure:

- Detection time metrics
- Pattern match counts  
- Category frequency analysis
- Block vs redact action ratios

---

## 🧪 Testing & Validation

### Test Corpus Management

- **[PII Scan Fixture](pii-scan-fixture.md)** — Synthetic examples untuk scanner testing
- **[Positive High-Risk Corpus](corpus/positive-highrisk.md)** — Pattern yang harus terdeteksi
- **[Negative Decoy Corpus](corpus/negative-decoy.md)** — False positives yang harus dihindari

### Scanner Reliability Testing

```bash
# Jalankan PII scanner tests
npm run test:pii-scanner

# Validate pattern library consistency
npm run privacy:validate-patterns

# Test corpus compliance check
npm run test:privacy-corpus
```

---

## 📋 Compliance & Risk Management

### Risk Assessment Matrix

| Risk Category | Impact | Probability | Mitigation Strategy |
|---------------|--------|-------------|-------------------|
| **PII Leakage** | High | Low | Automated detection + blocking |
| **False Positives** | Medium | Medium | Comprehensive test corpus |
| **Regulatory Non-compliance** | High | Low | Multi-jurisdiction framework |
| **Child Data Exposure** | Critical | Very Low | Zero-tolerance blocking |

### Audit Trail Requirements

- All PII detection events logged (without raw data)
- Pattern library version tracking
- Salt rotation history maintenance  
- User consent and data subject rights processing

### Data Subject Rights

| Right | Implementation | Automation Level |
|-------|----------------|------------------|
| **Access** | Query hashed data references | Semi-automated |
| **Rectification** | Update/correct stored data | Manual process |
| **Erasure** | Remove all associated records | Automated pipeline |
| **Portability** | Export structured data | Semi-automated |

---

## 🚀 Implementation & Operations

### Scanner Integration Points

1. **Feedback Form Processing** — Real-time PII scanning sebelum storage
2. **Event Pipeline** — PII validation dalam analytics ingestion  
3. **Content Moderation** — Automated review untuk user-generated content
4. **Admin Tools** — Optional scanning untuk internal notes

### Performance Optimization

- Precompiled regex patterns untuk speed
- Multi-phase scanning dengan early exit
- Aho-Corasick keyword matching untuk efficiency
- Benchmark target: <10ms untuk 4KB payload

### Governance & Change Control

| Change Type | Classification | Review Required |
|-------------|----------------|-----------------|
| New high-risk pattern | CIC-E | Privacy team + legal review |
| Threshold adjustments | CIC-C | Impact analysis required |  
| Pattern removal | CIC-E | Risk acceptance documentation |
| Algorithm changes | CIC-E | Full regression testing |

---

## 📚 Additional Resources

### Quick Reference

- **[Privacy Overview](README.md)** — High-level privacy principles
- **[Copilot Instructions](../.github/copilot-instructions.md#privacy-tools)** — Privacy tools dalam workflow
- **[Policy Index](../governance/policy-index-v1.md)** — PII pattern lock policies

### Public Information

- **[Privacy FAQ (Abridged)](../faq/privacy-faq-abridged.md)** — User-facing privacy questions
- **Public Excerpt**: "Platform otomatis menyaring pola data pribadi seperti nomor identitas kependudukan, nomor kartu keluarga, kontak (email/telepon), alamat spesifik, tanggal lahir, dan detail anak. Jika terdeteksi, entri diblokir atau disamarkan. Sistem tidak menyimpan data pribadi bentuk mentah."

### Developer Tools

```bash  
# Privacy scanner smoke test
npm run privacy:scan

# Generate privacy metrics
npm run privacy:metrics  

# Privacy rights request processing
npm run privacy:rights

# Privacy compliance assertions
npm run privacy:asserts
```

---

## 🔗 Cross-References

### Integration dengan Dokumentasi Lain

- **[Integrity & Verification](../integrity/)** — PII detection dalam credential validation
- **[Analytics & Events](../analytics/)** — Privacy-safe event schema design  
- **[Governance](../governance/)** — Privacy policy enforcement dan change control
- **[Implementation](../implementation/)** — Privacy-by-design dalam development lifecycle

### Prinsip Terkait

- **GP1**: Privacy-by-Architecture — Built-in protection, bukan afterthought
- **GP5**: Transparency — Clear communication tentang data practices  
- **GP6**: Outcome Honesty — Realistic capability claims, acknowledge limitations
- **GP9**: Non-Ranking Fairness — Scanner tidak membuat entity judgments

---

> **Next Actions**  
> Untuk implementasi scanner, lihat Next Actions dalam [PII Pattern Library](pii-pattern-library-v1.md#36-next-actions). Untuk privacy request processing, mulai dengan [Team Setup Guide](../team-guides/TEAM-SETUP-GUIDE-PHASE-2-WEEK-6.md#privacy-officers).
