# GitHub Projects (Personal) Integration Guide — merajutasa.id

Audience: Lead IT • Scope: Personal GitHub Projects (user-owned) fully integrated with repository `Andhika-Rey/merajutasa.id`.

Project URL: <https://github.com/users/Andhika-Rey/projects/10>

---

## Tujuan

Menyatukan klasifikasi yang benar, label repository, serta automations di GitHub Projects (akun pribadi) agar alur kerja terintegrasi penuh dengan repo/workspace merajutasa.id.

Hasil akhir:

- Issues/PR dari repo otomatis masuk Project (auto-add).
- Label di repo memetakan nilai Custom Fields di Project.
- Status dimutakhirkan otomatis (closed/merged → Done, dll.).
- Saved Views siap pakai untuk backlog, triage bug, sprint, dan rilis.

---

## Ringkasan langkah (checklist)

- [x] Hubungkan repo ke Project dan aktifkan auto-add
- [x] Tampilkan field bawaan yang relevan
- [x] Buat semua Custom Fields (sesuai daftar)
- [x] Susun Status (field bawaan) sesuai standar
- [x] Standarisasi label di repo (selaras dengan fields)
- [ ] Atur automations (workflows) pemetaan label → fields + status syncing
- [ ] Siapkan Iteration/Sprint bila diperlukan
- [ ] Buat Saved Views (Backlog, Bug Triage, Current Sprint, Release)
- [ ] Terapkan konvensi linking PR↔Issue dan penamaan branch

---

## 1) Hubungkan repo ke Project dan aktifkan auto-add

- Buka Project Anda → tab Workflows (ikon gear/Automation).
- Tambahkan workflow “Auto-add items”.
- Filter “Items to add”: `repository: Andhika-Rey/merajutasa.id`; pilih Issues dan Pull requests (sesuai kebutuhan).
- Simpan workflow.

Catatan: Ini memastikan setiap Issue/PR baru dari repo langsung masuk ke Project.

---

## 2) Aktifkan/siapkan field bawaan yang relevan

Pastikan field bawaan berikut tampil di tampilan tabel (Table view):

- Status
- Assignees
- Labels
- Repository
- Milestone (jika repo menggunakan milestones)
- Iteration (field native Projects)

Cara: di header tabel, klik “+” → pilih field yang ingin ditampilkan.

---

## 3) Buat Custom Fields (tanpa script)

Header kolom → “+” → “New field” (atau “Manage fields”) → pilih tipe sesuai daftar di bawah.

- Work Type (Single select): Bug, Feature, Improvement, Chore, Docs, Design, Research
- Priority (Single select): P0 – Critical, P1 – High, P2 – Medium, P3 – Low
- Severity (Single select): S1 – Critical, S2 – Major, S3 – Minor, S4 – Trivial
- Impact (Single select): Blocker, High, Medium, Low
- Effort/Size (Single select): XS, S, M, L, XL
- Area/Module (Single select): Landing, Auth, User Profile, Orders, Payments, Catalog, CMS, API, Infra/DevOps, Analytics, SEO/Content, Mobile
- Environment (Single select): Prod, Staging, Dev
- Platform (Single select): Web, Backend, Mobile
- Target Release (Text atau Milestone; gunakan Milestone jika repo memakainya)
- Start Date (Date)
- Due Date (Date)
- Blocked (Checkbox)
- Blocked By (Text)
- Customer/Stakeholder (Text)
- OKR/Goal (Text)
- Risk (Single select): High, Medium, Low
- Story Points (Number)
- Notes/Links (Text)

Tips:

- Gunakan warna yang konsisten untuk opsi prioritas/severity.
- Opsi Area/Module sebaiknya diselaraskan dengan domain repo (API, Infra/DevOps, equity UI, dll.).

---

## 4) Susun Status (field bawaan) yang jelas

Standarisasi nilai Status (rename/hapus default jika perlu):

- Triage
- Backlog
- Ready
- In Progress
- In Review
- Blocked
- Done
- Won’t Do

---

## 5) Standarisasi label di repo merajutasa.id

Selaraskan label agar sinkron dengan fields (hindari label status duplikat, karena Status dikelola di Projects):

- Tipe kerja: `type:bug`, `type:feature`, `type:improvement`, `type:chore`, `type:docs`, `type:design`, `type:research`
- Prioritas: `priority:p0`, `priority:p1`, `priority:p2`, `priority:p3`
- Severity: `severity:s1`, `severity:s2`, `severity:s3`, `severity:s4`
- Area: `area:landing`, `area:auth`, `area:user-profile`, `area:orders`, `area:payments`, `area:catalog`, `area:cms`, `area:api`, `area:infra-devops`, `area:analytics`, `area:seo-content`, `area:mobile`
- Environment: `env:prod`, `env:staging`, `env:dev`
- Effort/Size: `size:xs`, `size:s`, `size:m`, `size:l`, `size:xl`
- Kondisi: `blocked`, `hotfix`, `good-first-issue` (opsional)

Rekomendasi:

- Dokumentasikan arti setiap label di `docs/workflows/` atau `docs/team-guides/` untuk konsistensi.

---

## 6) Automations (Workflows) di Projects untuk integrasi 100%

A. Auto-add (langkah 1) — sudah dibuat.

B. “Set defaults on item added” berdasarkan label (gunakan “Labels contains”):

- Jika label contains `type:bug` → set Work Type=Bug, Status=Triage, Priority default=P1, Severity=S2
- Jika label contains `type:feature` → set Work Type=Feature, Status=Backlog
- Jika label contains `type:chore` → set Work Type=Chore
- Jika label contains `type:docs` → set Work Type=Docs
- Jika label contains `priority:p0` ATAU `hotfix` → set Priority=P0, Severity=S1, Status=Ready
- Jika label contains `size:*` → set Effort/Size sesuai label
- Jika label contains `area:*` → set Area/Module sesuai label
- Jika label contains `env:*` → set Environment sesuai label

C. “Status syncing”:

- When Issue closed → set Status=Done
- When Issue reopened → set Status=In Progress (atau Backlog, sesuai preferensi)
- When Pull request merged → set Status=Done
- When Blocked checkbox is checked → set Status=Blocked
- When Status=Done → Archive item after 14 days (opsional)

Catatan: Semua aturan ini dapat dikonfigurasi tanpa menulis script.

---

## 7) Iteration/Sprint

- Tambahkan field Iteration (native) dengan cadence 1 atau 2 minggu sesuai ritme tim.
- Opsi workflow (opsional): When item added and label contains `iteration:@current` → set Status=Ready.
- Anda juga bisa membuat tampilan khusus sprint (lihat bagian Views).

---

## 8) Tampilan (Saved Views)

- Backlog (Features/Improvements): filter `is:issue` AND Status in [Backlog, Ready] AND Work Type in [Feature, Improvement]; group by Priority; sort by Impact desc, Effort asc.
- Bug Triage: filter Work Type=Bug AND Status=Triage; group by Severity; sort by Priority desc.
- Current Sprint: filter Iteration=@current; group by Status; gunakan Board view untuk eksekusi harian.
- Release Planning: group by Target Release atau Milestone.
- Area/Module Focus: group by Area/Module; filter Status not in [Done, Won’t Do].
- Review/QA: filter Status=In Review; optionally PR only.

---

## 9) Konvensi linking dan branch

- Di setiap PR, referensikan issue dengan kata kunci close/fix: `Fixes #123` agar penutupan issue otomatis mengubah Status ke Done via workflow.
- Gunakan penamaan branch yang mengandung nomor issue: `feature/123-judul-singkat`, `bugfix/456-judul-singkat`.

---

## 10) Klasifikasi “benar” untuk merajutasa.id (ringkasan)

- Dimensi prioritas: Priority (urgency) + Impact (dampak) + Severity (khusus bug)
- Dimensi upaya: Effort/Size, Story Points (opsional)
- Dimensi domain: Area/Module, Platform, Environment
- Dimensi proses: Status, Iteration, Start/Due Date, Blocked/Blocked By
- Dimensi bisnis: Target Release, Customer/Stakeholder, OKR/Goal, Risk

Dengan struktur di atas:

- Issues/PR baru dari repo merajutasa.id otomatis masuk ke Project.
- Label memetakan nilai Custom Fields di Project.
- Status dan arsip dikelola otomatis oleh Project Workflows.
- Backlog, triage bug, sprint, dan perilisan dapat dilihat dari Saved Views yang konsisten.

---

## Validasi cepat (QA)

- Auto-add berfungsi: Item baru dari `Andhika-Rey/merajutasa.id` muncul otomatis di Project.
- Pemetaan label → fields berjalan (uji dengan `type:bug`, `priority:p0`, `size:m`).
- Status syncing: close Issue/merge PR → Status menjadi Done; reopen → Status sesuai aturan.
- Views menampilkan data sesuai filter/group/sort yang ditetapkan.

---

## Catatan integrasi repo

- Hindari membuat label status duplikat (status dikelola oleh Projects).
- Pertahankan konsistensi kapitalisasi dan prefiks label (`type:*`, `priority:*`, `area:*`, `env:*`, `size:*`).
- Dokumentasikan kebijakan label dan fields di README tim atau folder `docs/workflows/`.

---

Dokumen ini adalah panduan operasional tanpa skrip (no-code) untuk menyelaraskan GitHub Projects pribadi dengan repo `merajutasa.id`, mengikuti praktik klasifikasi, label, dan automations yang konsisten.
