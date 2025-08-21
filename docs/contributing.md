# MerajutASA.id Contributor Guide

Status: Active Documentation Contribution Guide v1.0  
Purpose: Panduan komprehensif untuk kontribusi dokumentasi dengan fokus pada konsistensi terminology dan style  
Last Updated: 2025-08-21

> **Contributor Hub**  
> Dokumen ini menyediakan panduan lengkap untuk berkontribusi pada dokumentasi MerajutASA.id dengan standar kualitas tinggi, konsistensi terminology, dan alignment dengan kebijakan governance.

---

## 🎯 Overview

Kontribusi dokumentasi pada MerajutASA.id mengikuti prinsip governance yang ketat dengan fokus pada konsistensi, kualitas, dan compliance terhadap standar yang telah ditetapkan. Setiap perubahan harus mempertimbangkan dampak terhadap prinsip GP1-GP10 dan mengikuti kebijakan anti-hype yang berlaku.

### Key Principles

- **Konsistensi Terminologi**: Menggunakan vocabulary yang telah disepakati dan menghindari istilah yang berpotensi overclaim
- **Documentation Quality**: Memastikan akurasi, kelengkapan, dan struktur yang logis
- **Governance Compliance**: Mengikuti proses DEC untuk perubahan signifikan
- **Cross-Reference Integrity**: Memelihara hubungan antar dokumen yang konsisten

---

## 📝 Documentation Contribution Guidelines

### 1. File Organization & Naming

**Naming Conventions:**

- Gunakan lowercase dengan dash sebagai separator: `my-document.md`
- Untuk versioned files: `document-name-v1.md`
- Untuk dated files: `YYYY-MM-DD-topic.md` (untuk DEC)
- Untuk status files: `STATUS-topic.md`

**Directory Structure:**

```text
docs/
├── governance/          # Core governance & policies
├── integrity/           # Trust & verification systems
├── fairness/           # Equity & hysteresis systems
├── analytics/          # Event schema & analytics
├── privacy/            # Privacy & PII protection
├── onboarding/         # Contributor guides
├── operations/         # Operational procedures
├── archive/            # Historical documents (immutable)
└── index.md           # Central navigation hub
```

### 2. Heading Standards

**Hierarchy Structure:**

```markdown
# Document Title (H1 - once per document)
## Major Section (H2)
### Subsection (H3)
#### Detail Section (H4 - minimize usage)
```

**Heading Conventions:**

- H1: Always include status/version info below title
- H2: Use emojis for major sections when appropriate: 🎯 📝 ⚖️ 🔒
- Be descriptive but concise
- Avoid generic headings like "Overview" without context

**Example:**

```markdown
# Event Schema Canonical v1.0

Status: Published - Canonical Reference  
Purpose: Defines event structure for fairness monitoring  
Last Updated: 2025-08-21

## 🎯 Schema Definition
### Core Event Structure
#### Metadata Requirements
```

### 3. Cross-Linking Guidelines

**Internal Links:**

- Always use relative paths from document root: `[Link Text](../folder/file.md)`
- For same-directory files: `[Link Text](file.md)`
- Include descriptive link text, avoid "click here"
- Link to specific sections: `[Link Text](file.md#section-heading)`

**Reference Patterns:**

```markdown
- **[Document Title](path/to/document.md)** - Brief description
- See: **[Section Name](document.md#section)** for details
- Cross-reference: [GP1-GP10 Principles](governance/dec/DEC-20250812-03-principles-reference-activation.md)
```

**Central Index Integration:**

- All new major documents must be added to `docs/index.md`
- Use consistent categorization and emoji patterns
- Include brief descriptions for navigation clarity

### 4. Content Style Guidelines

**Writing Style:**

- Use Indonesian for operational content, English for technical terms
- Be precise and factual, avoid marketing language
- Use active voice where possible
- Include concrete examples where helpful

**Technical Documentation:**

- Include status/version information at the top
- Reference related specifications and dependencies
- Use code blocks with appropriate language tags
- Include practical examples and usage patterns

---

## 🚫 Terminology & Anti-Hype Policy

### Banned Terminology

The following terms are **prohibited** and will trigger lint failures:

**High Severity (Hard Fail):**

- "terbaik" (best) - absolute superiority claims
- "revolusioner" (revolutionary) - overclaim terminology

**Medium Severity (Review Required):**

- "ranking" - unsubstantiated ranking claims
- "top" - generic superiority claims
- "peringkat" - ranking implications
- "skor kompetitif" - competitive scoring language

### Approved Alternatives

Instead of banned terms, use:

- **"indikator stabil fairness"** instead of "peringkat" or "ranking"
- **"metrik objektif"** instead of "scoring" claims
- **"pendekatan berbasis evidens"** instead of "revolutionary"
- **"solusi yang sesuai"** instead of "terbaik"

### Lint Integration

All documentation is automatically scanned by `tools/hype-lint.js`:

```bash
# Check terminology compliance
node tools/hype-lint.js

# View detailed results
cat artifacts/hype-lint.json
```

**Exception Patterns:**

- Use `<!-- lint-allow-negated-context hype-lint-ignore-line -->` for educational content
- Use `<!-- hype-lint-ignore-line -->` for specific exemptions
- Reference documentation discussing banned terms should use context markers

---

## 🔗 Reference Integration

### Governance References

**DEC Integration:**

- Reference relevant DECs: `dec_ref: DEC-YYYYMMDD-XX`
- Link to decision documents for policy changes
- Use immutable references for archived decisions

**Policy References:**

- **[Anti-Hype Policy](governance/terminology.md)** - Current terminology governance
- **[DEC Style Guide v3](governance/dec/DEC-style-guide-v3.md)** - Decision document format
- **[Lint Principles Reference](governance/lint-principles-reference-spec-v1.md)** - PR impact requirements

### Disclaimer Integration

Include appropriate disclaimers using the established format:

```markdown
<div data-disclaimer-block="terminology_banner">
<p data-disclaimer-id="D6">Terminologi dalam fase transisi (Stage 2); adopsi dipantau publik — lihat DEC-20250817-09.</p>
</div>
```

Current disclaimer categories:

- `terminology` - For terminology transition notices
- `terminology_banner` - For banner-style terminology notices
- `data_protection` - For PII/privacy notices

---

## ✅ Quality Assurance Process

### Pre-Submission Checklist

**Content Review:**

- [ ] Document follows naming conventions
- [ ] Heading structure is logical and consistent
- [ ] Cross-references are accurate and working
- [ ] Terminology complies with anti-hype policy
- [ ] Status/version information is current
- [ ] Added to `docs/index.md` if applicable

**Technical Validation:**

- [ ] Run `npm run lint` to check markdown compliance
- [ ] Verify `node tools/hype-lint.js` passes
- [ ] Check `npm run governance:verify` for compliance
- [ ] Ensure no silent drift in governance artifacts

### PR Requirements

**Documentation PRs must:**

1. Use appropriate PR template (main or workflow-specific)
2. Fill Section 37 (Principles Impact Matrix) completely
3. Reference relevant DEC documents if making policy changes
4. Include terminology compliance verification
5. Update cross-references as needed

**Section 37 Example:**

```markdown
| Principle | Potential Impact (Yes/No) | Note / Mitigation |
|-----------|---------------------------|-------------------|
| GP7 (Anti-Hype) | Yes | Reviewed terminology, no banned terms used |
| GP1 (Minimization) | No | Documentation only, no data changes |
```

---

## 🛠️ Tools & Automation

### Governance Tools

**Core Linting:**

```bash
# Markdown compliance
npm run lint:md

# Terminology compliance  
node tools/hype-lint.js

# DEC document validation
npm run lint:dec

# Full governance verification
npm run governance:verify
```

**Evidence Generation:**

- `tools/spec-hash-diff.js` - Document integrity verification
- `tools/param-integrity.js` - Parameter consistency checks
- `tools/terminology-scan.js` - Terminology adoption tracking

### Integration Points

**With Governance Pipeline:**

- Documentation changes trigger spec-hash verification
- Parameter changes require DEC approval process
- Cross-reference integrity is automatically validated

**With CI/CD:**

- All documentation is automatically linted
- Terminology compliance is enforced pre-merge
- Evidence artifacts are generated and archived

---

## 📚 Resources & Support

### Key Documentation References

- **[Documentation Index](index.md)** - Central navigation and structure
- **[Governance Handbook](governance/handbook-index.md)** - Governance processes
- **[Agent Bootstrap Manifest](onboarding/agent-bootstrap-manifest.md)** - Quick onboarding guide
- **[Policy Index v1.0](governance/policy-index-v1.md)** - Complete policy reference

### Getting Help

**For Documentation Questions:**

- Review existing patterns in similar documents
- Check the governance handbook for process guidance
- Reference the DEC style guide for decision documentation

**For Technical Issues:**

- Run local governance verification tools
- Check artifacts/ directory for detailed lint reports
- Reference operational runbooks in docs/operations/

---

*This contributor guide follows append-only governance and is managed through the spec-hash integrity manifest. For structural changes, use the DEC process as outlined in the governance handbook.*

dec_ref: Related to DEC-20250817-09 (Terminology Adoption)

Last updated: 2025-08-21 by governance automation
