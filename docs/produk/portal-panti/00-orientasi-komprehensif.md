# Orientasi Komprehensif: Portal Panti Asuhan

Catatan istilah: “panti asuhan” pada dokumen ini mengacu pada pengurus/penyelenggara lembaga panti (entitas institusional) sebagai subjek pengelola profil. Fokus institusi selaras dengan asas keterbukaan informasi publik dan perlindungan anak.

---

## 1. Definisi dan Ruang Lingkup Terminologi

- Subjek institusi: pengurus/penyelenggara panti (UU-KIP-14/2008).
- Subjek anak: bukan target publikasi; hak privasi dilindungi (UNCRC-16).
- Informasi publik: informasi yang dapat diakses sesuai UU-KIP dengan pengecualian yang dilindungi (UU-KIP-14/2008).
- Data pribadi: mengacu pada definisi dan kategori UU PDP (UU-PDP-27/2022).

## 2. Kerangka Hukum dan Standar (Acuan)

- UNCRC-2, UNCRC-3, UNCRC-16 — Konvensi Hak Anak PBB (non-diskriminasi; kepentingan terbaik anak; privasi).
- UU-KIP-14/2008 — Keterbukaan Informasi Publik (akses; pengecualian).
- UU-PDP-27/2022 — Perlindungan Data Pribadi (asas, kategori, dasar pemrosesan, hak subjek data).
- UU-8/2016 — Penyandang Disabilitas (aksesibilitas layanan informasi).
- WCAG-2.2 — Pedoman aksesibilitas konten web (W3C).
- ISO/IEC 29100 — Privacy framework (prinsip: minimalisasi, pembatasan tujuan, dsb.).
- ODC-2015 — International Open Data Charter (prinsip keterbukaan beretika).
- LINDDUN — Taksonomi ancaman privasi (Linkability, Identifiability, Non-repudiation, Detectability, Information Disclosure, Content Unawareness, Policy/Consent Non-compliance).

## 3. Pemetaan Elemen Data → Status & Landasan

| Elemen | Status | Landasan |
|--------|--------|----------|
| nama_lembaga | Wajib | UU-KIP-14/2008 |
| wilayah_administratif | Wajib (non-presisi) | UNCRC-16; ISO-29100 |
| status_legal_publik (bila publik) | Wajib bersyarat | UU-KIP-14/2008 |
| kontak_institusional | Wajib | UU-KIP-14/2008 |
| tautan_resmi | Wajib bila ada | ODC-2015 |
| tanggal_verifikasi | Wajib | UU-KIP-14/2008 |
| sumber_verifikasi | Wajib | ODC-2015 |
| alamat_jalan | Opsional (persetujuan eksplisit) | UU-PDP-27/2022; ISO-29100 |
| titik_peta_approx | Opsional; presisi atas persetujuan | UNCRC-16; UU-PDP-27/2022 |
| jam_kunjung | Opsional | UU-KIP-14/2008 |
| kanal_donasi_institusi | Opsional | ODC-2015 |
| media_sosial_institusi | Opsional | ODC-2015 |
| PII anak/pengasuh | Dilarang | UNCRC-16; UU-PDP-27/2022 |
| jadwal_kegiatan_anak | Dilarang | UNCRC-3; UNCRC-16 |
| data_kerentanan/medis | Dilarang | UU-PDP-27/2022 |
| koordinat_presisi tanpa persetujuan | Dilarang | ISO-29100; UU-PDP-27/2022 |
| berkas menampilkan wajah anak tanpa redaksi | Dilarang | UNCRC-16 |

Catatan: tabel ini menyarikan dokumen “Model Data Minimal Aman — Portal Panti” dan menyertakan acuan di setiap baris.

## 4. Dasar Pemrosesan (UU PDP — Pemetaan Konseptual)

Tanpa menetapkan pilihan, dasar yang diakui UU-PDP-27/2022 meliputi: persetujuan, kewajiban hukum, kepentingan vital, penyelenggaraan tugas dalam kepentingan umum, atau kepentingan sah tertentu. Elemen data pada bagian 3 berpaut pada dasar yang relevan sesuai konteks publikasi informasi institusi (UU-PDP-27/2022).

## 5. Hak Subjek Data (UU PDP — Pemetaan Konseptual)

Hak untuk mengakses, memperbaiki, melengkapi, menghapus, menarik persetujuan, dan/atau menghentikan pemrosesan diatur dalam UU-PDP-27/2022. Penerapannya terkait data institusional dan pengurus panti sebagai pengelola profil; data anak tidak menjadi objek publikasi (UNCRC-16; UU-PDP-27/2022).

## 6. Aksesibilitas (WCAG 2.2 — Pemetaan Kriteria)

| Jenis Konten | Kriteria Utama WCAG 2.2 |
|--------------|--------------------------|
| Teks halaman | 1.4.3 Contrast (Minimum), 1.4.4 Resize text, 2.4.7 Focus Visible |
| Tautan/ikon | 1.1.1 Non-text Content (alt), 2.4.4 Link Purpose |
| Struktur dokumen | 1.3.1 Info and Relationships, 2.4.1 Bypass Blocks |
| Navigasi | 2.1.1 Keyboard, 2.4.3 Focus Order |

## 7. Transparansi & Prinsip Keterbukaan (ODC)

Orientasi sejalan dengan ODC-2015: keterbukaan yang dapat diakses, dapat digunakan, dan etis, dengan pembatasan pada data anak dan informasi yang dikecualikan (ODC-2015; UNCRC-16; UU-KIP-14/2008).

## 8. Taksonomi Ancaman Privasi (LINDDUN — Pemetaan Kontekstual)

- Linkability/Identifiability: penghilangan PII anak pada profil institusi (UNCRC-16).
- Detectability/Information Disclosure: pembatasan presisi lokasi default pada tingkat administratif (ISO-29100; UNCRC-16).
- Content Unawareness/Policy Non-compliance: penjelasan “About” yang jelas dan rujukan kerangka hukum (ODC-2015; UU-KIP-14/2008; UU-PDP-27/2022).

## 9. Keterlacakan & Tata Kelola

- Indeks kebijakan: dicantumkan di Policy Index (bagian “Non-code Policy References”).
- Roadmap: Track M “Portal Panti” dan Appendix A (verbatim) untuk audit konten.
- Verifikasi: artefak `artifacts/policy-index-verify.json` menyertakan ringkasan eksistensi & keterhubungan dokumen.

## 10. Daftar Rujukan (Kode Sitasi)

UNCRC-2, UNCRC-3, UNCRC-16; UU-KIP-14/2008; UU-PDP-27/2022; UU-8/2016; WCAG-2.2; ISO-29100; ODC-2015; LINDDUN.
