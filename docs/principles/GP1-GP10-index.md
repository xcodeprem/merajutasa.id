# GP1–GP10 Principles Index (Quick Machine & Reviewer Reference)

Status: Final Index v1.0 (APPEND-ONLY – Tidak menggantikan Master Spec v2.0)  
Prepared: 2025-08-12  
Purpose: Menyediakan ringkasan 1 kalimat + pointer pasal Master Spec agar Agent / lint / reviewer cepat melakukan cross-check kepatuhan tanpa membuka keseluruhan dokumen. Tidak menghapus atau mengubah substansi prinsip yang sudah hidup di Master Spec v2.0.  

> Catatan: Master Spec tetap sumber otoritatif penuh. Setiap perubahan pada ringkasan di sini harus memiliki DEC dan tidak boleh mengubah makna tanpa memperbarui Master Spec terlebih dahulu.

| ID | Nama (Short Label) | Ringkasan 1 Kalimat | Fokus Utama | Master Spec Sections (Indicative)* | Contoh Implementasi/Kontrol |
|----|--------------------|---------------------|-------------|------------------------------------|-----------------------------|
| GP1 | Privacy-by-Architecture | Desain menolak kebutuhan mengumpulkan PII (khusus data anak) dengan minimisasi struktural & redaksi otomatis, bukan sekadar kebijakan. | Privacy Foundation | §12 Privacy Foundations, §27 Events, §49 Disclaimers | PII Scanner v1.0, no user_ip, redaction before persist |
| GP2 | Executable Governance | Setiap perubahan metodologis/fairness/integritas dikunci melalui DEC + lint policy-as-code, bukan keputusan lisan. | Governance Automation | §8 Governance, §28 Lint & Policy, Delta Files | DEC-20250812-02 hysteresis, hysteresis.params.lock |
| GP3 | Data Minimization & Purpose Limiting | Tidak ada penambahan field/data tanpa tujuan eksplisit dan mapping ke tujuan analitik atau audit yang sah. | Data Bounds | §12 Privacy, §21 Data Scope, §27 Events | Event schema prohibited fields, minim meta enumerations |
| GP4 | Verifiability & Integrity | Bukti (hash, signature, chain) tersedia agar klaim dapat diverifikasi independen & mencegah trust theater. | Integrity Layer | §31 Integrity, Credential Schema, Chain Spec | Ed25519 signer, event_hash, pipeline_hash |
| GP5 | Transparency | Definisi metrik, disclaimers, metodologi (fairness/hysteresis) dapat diinspeksi publik tanpa dark logic. | Public Clarity | §13 Hero, §35 Ethical Content, Methodology Fragments | D1–D7 disclaimers, published methodology fragment |
| GP6 | Outcome Honesty | Tidak mempresentasikan sinyal sebagai ranking / kualitas; menghindari misframing performa. | Ethical Framing | §14 Fairness Narrative, §30 Equity UI | No “top”, disclaimers Reinforce non-ranking |
| GP7 | Anti-Hype & Plain Language | Bahasa pemasaran berlebihan & ambigu (ranking, “revolusioner”) diblok lint demi kejelasan & menghindari overclaim. | Copy Discipline | §35 Ethical Content, Disclaimers Lint, Hype Lint (planned) | Banned phrase list, hype lexicon lint |
| GP8 | User Participation & Feedback Respect | Mekanisme feedback diaktifkan tanpa memanen PII dan menyediakan jalur perbaikan terukur. | Participation Loop | §18 Feedback, PII Pattern Library | Redacted feedback storage + block event metrics |
| GP9 | Non-Ranking Fairness | Label under‑served & equity index tidak memeringkat; hanya sinyal pemerataan dengan hysteresis stabil untuk menekan noise. | Fairness Stability | §14 Fairness, §42 Hysteresis, DEC-20250812-02 | Hysteresis Option F, D1 disclaimer |
| GP10 | Observability & Auditability | Setiap interaksi penting memiliki event terstandar dengan hashing & lint agar sistem dapat diaudit secara konsisten. | Operational Insight | §27 Events, §28 Lint, §31 Integrity | Event schema canonical, meta validators, dashboard KPIs |

*Nomor pasal (Section numbers) mengacu ke struktur Master Spec v2.0 sebagaimana telah digunakan dalam dokumen sebelumnya (referential – jika penomoran internal berubah, delta file wajib menyesuaikan tanpa mengubah makna).  

## Cross-File Pointers

- DEC Files: `docs/governance/dec/` (misal DEC-20250812-02)
- Disclaimers Canonical: `content/disclaimers/master.json`
- Hysteresis Config: `docs/fairness/hysteresis-config-v1.yml`
- Event Schema: `docs/analytics/event-schema-canonical-v1.md`
- PII Pattern Library: `docs/privacy/pii-pattern-library-v1.md`
- Roadmap Master: `docs/roadmap/roadmap-master-v1.md`

## Lint Integration Hooks

- `principles.reference` lint (baru) memvalidasi bahwa PR yang berpotensi menyentuh domain prinsip menandai dampak per prinsip (lihat Section PRINCIPLES IMPACT MATRIX di PR template).
- Parameter drift lint: `hysteresis.params.lock` → GP2, GP9
- Disclaimers lint: → GP5, GP6, GP7, GP9
- PII scanner tests: → GP1, GP3, GP8
- Event schema validator: → GP10
- Hype language lint: → GP7

## Change Control

- Update ringkasan satu kalimat: CIC-E (butuh DEC & Master Spec delta).
- Penambahan prinsip baru (GP11+): memerlukan dokumen konseptual + versi Master Spec mayor.

## Usage (Agent)

1. Agent parse tabel; buat mapping ID→Focus→Spec sections.
2. Saat PR template Section 37 (PRINCIPLES IMPACT MATRIX) terisi auto, lint memastikan minimal semua prinsip yang berdampak “Yes” punya catatan mitigasi jika menyentuh domain sensitif (privacy, fairness, integrity).
3. Jika ada field baru di event atau credential & GP1/GP3/GP10 tidak ditandai → fail.

## No Removal Guarantee

Dokumen ini tidak mengganti definisi tekstual lengkap; hanya indeks ringkas. Tidak ada strategi dihapus.

(End of GP1–GP10 Principles Index v1.0)
