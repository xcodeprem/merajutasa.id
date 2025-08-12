# Master Spec v2.0 (Baseline Canonical)
Version: 2.0.0  
Status: Baseline (hash pending – will be sealed via spec-hash-manifest-v1.json)  
Change Policy: delta-files (NO direct edits for semantic changes; use docs/master-spec-deltas/)  
Non-Removal Assertion: Bagian lama tidak dihapus; penambahan melalui delta saja.

## Table of Contents (Section Numbers Stable)
§1 Introduction  
§2 Scope & Non-Goals  
§3 Terminology & Controlled Vocabulary  
§4 Architectural Overview  
§5 Data Flow (High-Level)  
§6 Trust & Integrity Model Overview  
§7 Governance Overview (Link: decision log process)  
§8 Governance Execution (DEC lifecycle)  
§9 Policy-as-Code Overview  
§10 External Interfaces (Public)  
§11 External Interfaces (Internal / Admin)  
§12 Privacy Foundations (GP1, GP3)  
§13 Transparency & Public Fragments (GP5)  
§14 Fairness Methodology (Hysteresis, GP9)  
§15 Equity Snapshot Computation  
§16 Equity Metrics (Definitions)  
§17 Sampling Strategy (Reserved)  
§18 Feedback & Participation Loop (GP8)  
§19 Risk Categories (Integrity / Fairness / Privacy)  
§20 Security Considerations  
§21 Data Scope & Minimization Model (GP1, GP3)  
§22 Storage & Retention Policies  
§23 Redaction & PII Handling Pipeline  
§24 Credential Issuance Overview  
§25 Credential Field Definitions (Stable)  
§26 Credential Canonicalization & Hashing Steps  
§27 Event Schema Canonical Overview (GP10)  
§28 Lint & Policy Framework (Mapping codes)  
§29 Policy Escalation / Enforcement Levels  
§30 Equity Narrative & Non-Ranking Framing (GP6)  
§31 Integrity Chain (Event Hash, pipeline_hash, signatures) (GP4)  
§32 Audit & Replay Requirements (GP10)  
§33 Observability Metrics (ingestion success, lag)  
§34 Performance & A11y Budgets  
§35 Ethical & Copy Guidelines (Disclaimers, Anti-Hype – GP5, GP6, GP7)  
§36 Data Field Classification Levels (L0–L4)  
§37 Revocation Lifecycle (Placeholder)  
§38 Adoption Monitoring (Terminology, adoptionPercent)  
§39 Churn & Detection Delay Metrics Definitions  
§40 Anomaly Detection Principles (delta equity ratio)  
§41 Stalled Recovery Semantics  
§42 Hysteresis Parameter Table (links to config file)  
§43 Configuration Governance (hash sealing)  
§44 Test & Quality Gates Matrix  
§45 Evidence Bundle Specification  
§46 Principles Impact Matrix Requirement  
§47 Roadmap Interface & Delta Integration  
§48 DEC Index & Cross-Reference  
§49 Disclaimers Canonical Mapping  
§50 Future Work (Reserved Only – append)  

## §12 Privacy Foundations (Excerpt)
Principles GP1 & GP3 menekankan minimisasi struktural: sistem dirancang agar PII tidak perlu dikumpulkan; redaction terjadi sebelum persist. Field-level classification L0–L4 menjaga eksplisit scope. (Detail elaboration – refer privacy spec & PII pattern library.)

## §14 Fairness Methodology (Anchor)
Definisi mekanisme hysteresis: Parameter aktif ditetapkan lewat DEC (misal DEC-20250812-02 Option F). Tidak ada ranking / scoring kompetitif. Status ‘under‑served’ sinyal perbaikan, bukan kualitas relatif.

## §27 Event Schema Canonical Overview (Anchor)
Event mandatory fields: event_name, event_version, occurred_at, meta.integrity.event_hash, meta.client.app_version, meta.privacy.redaction_status. Field additions memerlukan patch version & DEC jika memengaruhi interpretasi fairness, integrity, atau privacy scope.

## §31 Integrity Chain (Excerpt)
Setiap event di-hash: event_hash = hash(canonical_json(event minus signature)). pipeline_hash memetakan transform graph versi. Credential issuance melakukan canonicalization deterministic sebelum signing (Ed25519).

## §35 Ethical & Copy Guidelines (Excerpt)
Disclaimers D1–D7 wajib pada surface tertentu. Larangan leksikal: ranking/top/terbaik/“peringkat” kecuali dalam konteks redaksi (educational example). Anti-hype lint memblok frasa prospektif yang memicu overclaim.

## §42 Hysteresis Parameter Table
(Lihat docs/fairness/hysteresis-config-v1.yml – config canonical. Master Spec tidak menduplikasi nilai agar drift tidak terjadi; hanya memuat link.)

## §46 Principles Impact Matrix Requirement
Semua PR wajib Section 37 – memetakan dampak per prinsip GP1–GP10. Lint principles.reference memverifikasi korelasi diff vs deklarasi.

## Hash & Integrity Notice
Hash (SHA256) baseline akan diisi di manifest. Setiap delta spec harus menambah file di docs/master-spec-deltas/ dengan DEC baru.

(End of Master Spec v2.0 Baseline – Append-Only via deltas)
