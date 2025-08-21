# MerajutASA.id Documentation Index

Status: Canonical TOC & Information Architecture v1.0  
Purpose: Menyediakan navigasi terpusat untuk semua domain dokumentasi dengan hierarki yang jelas  
Last Updated: 2025-08-21

> **Navigation Hub**  
> Dokumen ini menjadi titik masuk utama untuk navigasi lintas domain dokumentasi MerajutASA.id, mencakup governance, integrity, fairness, analytics, privacy, dan contributor guides.

---

## 🏛️ Governance & Decision Management

Central governance processes, policies, and decision-making frameworks.

### Core Governance

- **[Policy Index v1.0](governance/policy-index-v1.md)** - Konsolidasi seluruh policy-as-code & lint guardrail
- **[Handbook Index](governance/handbook-index.md)** - Navigasi area governance & integrity
- **[Decision Process](governance/README-decision-log-process.md)** - Proses keputusan dan decision log

### Decision Documents (DEC)

- **[DEC Directory](governance/dec/)** - Immutable decision documents
- **[DEC-20250812-04: Baseline Thresholds](governance/dec/DEC-20250812-04-governance-baseline-thresholds.md)** - Governance baseline & fairness thresholds
- **[DEC-20250815-01: Editorial Maintenance](governance/dec/DEC-20250815-01-governed-editorial-maintenance.md)** - Editorial updates governance

### Operations & Toolchain

- **[Toolchain Overview](governance/toolchain-overview.md)** - Development & governance toolchain
- **[Phase Tracker](governance/phase-tracker-ops.md)** - Implementation phase tracking
- **[Signature Pipeline](governance/signature-pipeline-plan-v1.md)** - Document signing & verification pipeline

---

## 🔒 Integrity & Credential Management

Trust primitives, verification systems, and credential schemas.

### Core Integrity

- **[🏠 Integrity & Credential Chain Index](integrity/index.md)** - **Indeks terpusat sistem integritas lengkap**
- **[Spec Hash Manifest](integrity/spec-hash-manifest-v1.json)** - Anchor hash integritas dokumen
- **[Credential Schema Final v1.0](integrity/credential-schema-final-v1.md)** - Struktur credential trust primitive
- **[Auto-Seal Allowlist](integrity/auto-seal-allowlist.json)** - Daftar file yang diizinkan auto-seal

### Verification & Validation

- **[CLI Verification Guide](integrity/verify-cli-doc-draft.md)** - Manual verification steps
- **[API Verification Docs](integrity/api-verification-docs.md)** - API verification endpoints
- **[Gating Policy v1.0](integrity/gating-policy-v1.json)** - Policy enforcement configuration

### Evidence & Audit

- **[Evidence Minimum Phase 1.5](integrity/evidence-minimum-phase1.5-v1.md)** - Minimum evidence requirements
- **[Hash Excerpt Module](integrity/hash-excerpt-module.md)** - Hash metadata extraction

### Evidence Pointers

Automated reports and pipeline artifacts for governance & auditability:

- **[Disclaimers Lint Report](../artifacts/disclaimers-lint.json)** - Disclaimers compliance validation
- **[Evidence Schema Validation](../artifacts/evidence-schema-validation.json)** - Artifact schema validation summary  
- **[PII Scan Report](../artifacts/pii-scan-report.json)** - Privacy scanning and PII detection results
- **[Spec Hash Diff Report](../artifacts/spec-hash-diff.json)** - Governance integrity verification
- **[Param Integrity Matrix](../artifacts/param-integrity-matrix.json)** - Fairness parameter validation
- **[Principles Impact Report](../artifacts/principles-impact-report.json)** - Principles compliance assessment
- **[Hype Lint Report](../artifacts/hype-lint.json)** - Language and terminology validation
- **[No Silent Drift Report](../artifacts/no-silent-drift-report.json)** - System drift detection and aggregation
- **[Fairness Simulation Report](../artifacts/fairness-sim-report.json)** - Fairness engine simulation results
- **[Evidence Bundle](../artifacts/evidence-bundle.json)** - Comprehensive evidence artifact manifest

---

## ⚖️ Fairness & Hysteresis Systems

Equity measures, fairness methodology, and hysteresis configuration.

### Configuration & Methodology

- **[Hysteresis Config v1.0](fairness/hysteresis-config-v1.yml)** - Parameter konfigurasi hysteresis
- **[Public Methodology Fragment](fairness/hysteresis-public-methodology-fragment-v1.md)** - Metodologi fairness publik
- **[State Machine Transitions](fairness/hysteresis-state-machine-transitions.md)** - Transisi status sistem

### Equity Implementation

- **[Equity Page](fairness/equity-page.md)** - Halaman equity implementation
- **[Equity Snapshot Pseudocode](fairness/equity-snapshot-pseudocode.md)** - Logic equity calculation
- **[Under-Served Section](fairness/equity-under-served-section.md)** - Focused equity measures

### Archive & Historical Options

- **[Hysteresis Options v1.0](archive/fairness_equity-hysteresis-options-v1.md)** - Opsi A–F historis
- **[Archive Trace Index](governance/trace/archive-trace-index-v1.md)** - Peta archive → canonical

---

## 📊 Analytics & Event Schema

Event tracking, schema definitions, and analytics framework.

### Schema & Standards

- **[Analytics & Event Schema Index](analytics/index.md)** - Comprehensive event schema index & validation overview
- **[Event Schema Canonical v1.0](analytics/event-schema-canonical-v1.md)** - Event fairness & envelope specification
- **[Dashboard Widgets](analytics/dashboard-widgets-hysteresis-initial.md)** - Initial dashboard component specs
- **[Media Digest](analytics/media-digest.md)** - Media analytics framework

### Data & Schemas

- **[Schemas Overview](schemas/README.md)** - Data validation schemas
- **[Data Dictionary](data/README.md)** - Kamus data & retensi policies

---

## 🔐 Privacy & PII Protection

Privacy framework, PII detection, and data protection policies.

- **[Privacy Documentation Index](privacy/index.md)** - Comprehensive privacy documentation hub & scanner usage guidelines

### PII Detection & Management

- **[PII Pattern Library v1.0](privacy/pii-pattern-library-v1.md)** - Detection framework & pattern definitions
- **[PII Rotation Policy](privacy/pii-rotation-policy.md)** - Salt rotation & privacy policies
- **[PII Scan Fixture](privacy/pii-scan-fixture.md)** - Testing fixtures for PII detection
- **[Privacy Overview](privacy/README.md)** - Privacy framework rujukan

### Privacy Corpus & Testing

- **[Privacy Corpus](privacy/corpus/)** - Testing data & validation samples

### FAQ & Public Information

- **[Privacy FAQ (Abridged)](faq/privacy-faq-abridged.md)** - User-facing privacy questions

---

## 👥 Contributor Guide & Onboarding

Developer onboarding, team setup, and contribution guidelines.

### Getting Started

- **[Contributor Guide](contributing.md)** - Complete documentation contribution guidelines
- **[Agent Bootstrap Manifest](onboarding/agent-bootstrap-manifest.md)** - Quick onboarding for AI agents
- **[Environment Setup](onboarding/environment-setup.md)** - Development environment configuration
- **[Startup Dependencies Guide](onboarding/startup-dependencies-guide.md)** - Service dependencies & startup

### Agent & Role Guidelines

- **[Agent Role Policy v1.0](onboarding/agent-role-policy-v1.md)** - AI agent behavior guidelines
- **[Agent Guardrails v1.0](onboarding/agent-guardrails-v1.md)** - Safety & constraint guidelines
- **[Knowledge Baseline](onboarding/agent-knowledge-baseline-2025-08-14.md)** - Required knowledge for agents

### Team Setup Guides

- **[Team Guides Overview](team-guides/)** - Complete onboarding guides per infrastructure phase
- **[Quick Reference Cards](quick-reference/)** - Daily operation commands & troubleshooting

---

## 🏗️ Implementation & Infrastructure

Phase-by-phase implementation guides and infrastructure documentation.

### Phase Documentation

- **[Phase 1 Implementation Guide](phase-1/PHASE-1-IMPLEMENTATION-GUIDE.md)** - Incremental enhancement strategy
- **[Phase 2 Implementation Guide](phase-2/PHASE-2-IMPLEMENTATION-GUIDE.md)** - Enterprise scalability roadmap
- **[Implementation Status](implementation/README.md)** - Current capabilities & limitations

### Infrastructure & Operations

- **[Infrastructure Documentation](infrastructure/)** - Technical infrastructure guides
- **[Operations & Runbooks](operations/)** - Operational procedures
- **[Security Documentation](security/README.md)** - Security policies & procedures

---

## 📋 Specifications & Standards

Technical specifications, API documentation, and compliance standards.

### API & Integration

- **[API Documentation](api/README.md)** - Service integration guide
- **[Public API Definitions](api/)** - REST API specifications

### Product & UX Specifications

- **[Master Spec v2.0](master-spec/)** - Comprehensive product specifications
- **[UX Guidelines](ux/README.md)** - Accessibility & content style guidelines
- **[Multi-Page Experience Spec](archive/ux_public-multipage-experience-master-spec-v2.md)** - Historical UX specification

---

## 🎯 Planning & Strategy

Strategic planning documents, roadmaps, and analysis frameworks.

### Strategic Planning

- **[Strategic Planning Index](planning/STRATEGIC-PLANNING-INDEX.md)** - Post Phase 2 Week 6 planning
- **[Roadmap Master v1.0](roadmap/roadmap-master-v1.md)** - Development roadmap
- **[Infrastructure Analysis](analysis/INFRASTRUCTURE-UPDATE-ANALYSIS-V1.md)** - Infrastructure assessment

### Gap Analysis & Status

- **[Gap Analysis](gap-analysis/)** - System readiness assessment
- **[Status Documentation](status/)** - Current implementation status

---

## 🔍 Transparency & Trust

Public transparency, audit trails, and trust-building documentation.

### Public Documentation

- **[Public Materials](public/README.md)** - External communication materials
- **[Transparency Documentation](transparency/)** - Public transparency reports
- **[Trust Documentation](trust/)** - Trust-building measures

### Support & FAQ

- **[Support Overview](support/README.md)** - User support processes
- **[FAQ Documentation](faq/)** - Frequently asked questions

---

## 🧪 Testing & Validation

Testing frameworks, validation procedures, and quality assurance.

### Testing Documentation

- **[Test Documentation](tests/)** - Testing procedures & frameworks
- **[Verification CLI](verify-cli.md)** - Manual verification commands

---

## 📚 Additional Resources

### Legal & Compliance

- **[Legal Documentation](legal/README.md)** - Jurisdictional & legal requirements
- **[Policies Overview](policies/README.md)** - Content & access policies

### Release Management

- **[Release Documentation](release/README.md)** - Release processes & checklists

### Archive & Historical

- **[Archive Documentation](archive/)** - Historical documentation & specifications

---

## 🔗 Cross-References

### Key Integration Points

- **Governance ↔ Integrity**: Policy enforcement via spec-hash verification
- **Fairness ↔ Analytics**: Event-driven equity monitoring
- **Privacy ↔ Analytics**: PII-safe event collection
- **Contributors ↔ Governance**: DEC process for significant changes

### Regulatory References

- UNCRC-2/3/16, UU-KIP-14/2008, UU-PDP-27/2022, UU-8/2016, WCAG-2.2, ISO-29100, ODC-2015

---

*Dokumen ini mengikuti kebijakan append-only dan diatur oleh spec-hash integrity manifest. Untuk perubahan struktural, gunakan proses DEC yang sesuai.*
