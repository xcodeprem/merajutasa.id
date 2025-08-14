---
id: GUIDANCE-DOC-DEC-STYLE-V1
title: Decision (DEC) Authoring Style Guide v1
date: 2025-08-13T12:05:00Z
class: guidance
status: superseded
supersedes: []
depends_on: []
hash_of_decision_document: "e1dcff6a2e0558e8335086d83f8a3385c31ef3a3d1f9ee4b66bc5c04ddfafb60"  # canonical SHA256
superseded_by: GUIDANCE-DEC-STYLE-V2
---

# Decision (DEC) Authoring Style Guide (v1)

## 1. Purpose

Menyediakan format konsisten untuk seluruh file DEC agar:

- Hash canonicalization stabil (menghindari drift karena variasi struktur).
- Tooling (governed-change-scan, spec-hash-diff) dapat mengekstrak metadata tanpa regex rapuh.
- Reviewer cepat memindai bagian kritikal (Context, Decision, Enforcement, Sunset).

## 2. Required YAML Front-Matter Fields

| Field | Required | Description |
|-------|----------|-------------|
| id | Yes | Identifier unik `DEC-YYYYMMDD-XX` atau `GUIDANCE-*` untuk non-adoption guidance |
| title | Yes | Judul ringkas (≤120 chars) |
| date | Yes | ISO8601 UTC timestamp pembuatan (immutable) |
| status | Yes | `draft` / `adopted` / `deprecated` / `superseded` |
| class | Yes | Kode klasifikasi (misal: `CIC-A/B/C`, `governance`, `change-control`, `guidance`) |
| supersedes | Yes | Array id DEC yang digantikan (boleh kosong) |
| depends_on | Yes | Array id DEC dependensi (boleh kosong) |
| hash_of_decision_document | Yes | SHA256 aktual (diisi otomatis) |
| governance_tags | Optional | Array tag lintas domain: `['gating','fairness','privacy','anti-hype']` |
| review_after | Optional | ISO8601 target review date untuk sunset / evaluasi |

Catatan: `hash_of_decision_document` dihitung atas isi file setelah mengganti nilai field itu sendiri dengan token placeholder `<HASH_VALUE>` (canonicalization). Tool `spec-hash-diff` sudah menerapkan logika ini.

## 3. Section Order (Markdown Body)

1. Status (opsional jika sudah jelas di front-matter — boleh di-skip)
2. Context
3. Decision
4. Rationale
5. Scope & Non-Changes (jika relevan)
6. Enforcement / Controls / Tool Integration
7. Sunset / Review Plan (jika ada review_after)
8. Implications (Risk, Migration)
9. Traceability & References (link ke DEC lain / spec files / manifest entries)
10. Hash Canonicalization Note (standar)

## 4. Decision Block Pattern (Optional)

Untuk keputusan multi-parameter gunakan table berikut:

```
| Block | Topic | Decision | Enforcement | Locked | Notes |
|-------|-------|----------|-------------|--------|-------|
| DB-01 | <topic> | <value> | immediate | true | rationale short |
```

## 5. Template (Copy & Use via dec-create.js)

```
---
id: DEC-YYYYMMDD-XX
title: <Title>
date: YYYY-MM-DDThh:mm:ssZ
status: draft
class: CIC-A
supersedes: []
depends_on: []
governance_tags: [gating]
review_after: 2025-09-30T00:00:00Z
hash_of_decision_document: "<AUTO>"
---

## Context
<why>

## Decision
1. <item>

## Rationale
<why chosen>

## Enforcement
- Tool / file governed: <path>
- Change control: next change requires DEC referencing this id.

## Sunset / Review
<criteria>

## Implications
- Risk: <risk>

## References
- DEC-... (prior)
- docs/... (spec)

## Hash Canonicalization Note
Immutable once sealed; any edit requires successor DEC.
```

## 6. Retrofit Plan (Existing Mixed Styles)

- Legacy DECs (20250813-05 / -06) dibiarkan immutable; successor DEC jika perlu format baru.
- Tool `dec-normalize` (future) dapat membaca kedua format (front-matter & heading style) — low priority.

## 7. Lint Expectations

- YAML lines ≤ 120 chars.
- No tab indentation (2 spaces).
- Lists: gunakan `-` untuk array front-matter.

## 8. Hash Integrity Guidance

Gunakan script `node tools/dec-manifest-append.js <path>` setelah adopsi untuk memasukkan ke manifest dengan hash.

## 9. Change Log

- v1 (2025-08-13): Initial publication.

Hash placeholder akan diisi melalui pipeline; file ini guidance bukan DEC perubahan parameter sehingga boleh tetap `<AUTO>` sampai proses normalisasi massal.
