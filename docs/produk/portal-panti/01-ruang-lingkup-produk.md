# Ruang Lingkup Produk: Portal Panti Asuhan

Status: Living Draft
Prepared: 2025-08-14

## Sasaran (berlandas regulasi/standar)

- Visibilitas lembaga panti yang terverifikasi sebagai bentuk akses informasi publik yang proporsional (UU-KIP-14/2008).
- Transparansi institusional yang aman dan mudah dipahami dengan pembatasan pengecualian informasi (UU-KIP-14/2008; UNCRC-16).
- Penyusunan informasi mengikuti prinsip aksesibilitas untuk pengguna beragam (UU-8/2016; WCAG-2.2).

## Masalah & Motivasi

- Masyarakat memerlukan akses ringkas dan tepercaya ke informasi institusi panti, dengan perlindungan keselamatan/privasi anak sebagai prioritas (UNCRC-3; UNCRC-16; UU-KIP-14/2008).

## Sasaran Spesifik (deskriptif)

- Direktori publik dengan profil institusi terverifikasi secara wajar (UU-KIP-14/2008).
- Tampilan default aman: hanya bidang non-sensitif, narasi publik jelas tentang apa yang ditampilkan/tidak (UNCRC-16; UU-PDP-27/2022).

## Cakupan

- Wilayah awal: Bandung (ruang lingkup geografis eksplisit; perluasan bersyarat keputusan governance) (ODC-2015).
- Entitas: lembaga panti (bukan individu), fokus institusional (UU-KIP-14/2008).
- Konten: profil institusi, tautan resmi, dokumen publik (jika berstatus informasi publik), status verifikasi dan tanggalnya (UU-KIP-14/2008).

## Di Luar Cakupan (batas eksplisit)

- Peringkat, skor, label komparatif/klaim mutu (UNCRC-3; ODC-2015).
- PII anak/pengasuh, visual yang mengidentifikasi anak, jadwal anak, atau informasi sensitif (UNCRC-16; UU-PDP-27/2022).
- Penggabungan dengan modul analitik/label yang dapat memunculkan stigma (ODC-2015).

## Batasan

- Tidak menampilkan data/visual yang dapat mengidentifikasi anak (UNCRC-16; UU-PDP-27/2022).
- Lokasi presisi (alamat/koordinat) ditampilkan hanya berdasarkan persetujuan eksplisit pengurus dan sesuai prinsip minimalisasi (UU-PDP-27/2022; ISO-29100).
- Tidak ada peringkat, skor, atau klaim komparatif antar panti; teks bersifat deskriptif (UNCRC-3; ODC-2015).

## Peran Pengguna

- Pengurus panti: mengelola profil institusional dan dapat menarik persetujuan lokasi presisi (UU-KIP-14/2008; UU-PDP-27/2022).
- Admin verifikasi: memeriksa kelayakan dasar informasi institusi dan menetapkan status (UU-KIP-14/2008).
- Publik/komunitas: menelusuri profil dan menyampaikan laporan konten bermasalah (UU-KIP-14/2008).

## Alur Kritis (ringkas)

- Pembuatan profil → verifikasi dasar → publikasi → pembaruan berkala (changelog ringkas) (ODC-2015).
- Opt-in alamat/koordinat presisi → penayangan → penarikan persetujuan (jika diminta) → jejak perubahan (UU-PDP-27/2022; ISO-29100).
- Keberatan/koreksi → tinjauan → pembaruan → changelog (UU-KIP-14/2008).

## Peran (pernyataan berbasis mandat)

- Pengurus panti: pengelolaan profil institusi dan penyediaan bukti legitimasi (UU-KIP-14/2008).
- Admin verifikasi: pemeriksaan kelengkapan/keabsahan informasi profil institusi (UU-KIP-14/2008).
- Publik/komunitas: mengakses informasi institusional dan menyampaikan laporan konten bermasalah (UU-KIP-14/2008).

## Artefak Publik

- Halaman profil panti (informasi minimal aman) (UNCRC-16; UU-PDP-27/2022).
- Laman “About Portal Panti” (ODC-2015; UU-KIP-14/2008).
- Penanda status “Terverifikasi” dan “Terakhir diverifikasi pada: YYYY‑MM‑DD” (UU-KIP-14/2008).
- Ringkasan perubahan profil (changelog non-teknis) untuk jejak transparansi (ODC-2015).

## Kebijakan Konten & Privasi (deskriptif)

- Default aman: hanya data institusi non-sensitif (UU-KIP-14/2008; UU-PDP-27/2022; ISO-29100).
- Opt-in tertulis untuk alamat/koordinat presisi; tanpa persetujuan, granularitas pada tingkat administratif (ISO-29100; UU-PDP-27/2022).
- Larangan menampilkan/menyimpan PII anak/pengasuh dan visual anak yang dapat dikenali (UNCRC-16; UU-PDP-27/2022).

## Aksesibilitas (WCAG-2.2)

- Struktur heading semantik, alt text, kontras memadai, navigasi keyboard, serta ringkasan konten (UU-8/2016; WCAG-2.2).

## Acceptance Criteria (deskriptif)

- Halaman profil menampilkan bidang yang diizinkan beserta status verifikasi dan tanggal jika terverifikasi (UU-KIP-14/2008).
- Tidak ada frasa peringkat/penilaian mutu (UNCRC-3; ODC-2015).
- Alamat/koordinat presisi tidak ditayangkan tanpa persetujuan tertulis yang dapat diaudit (UU-PDP-27/2022; ISO-29100).
- Laman About menjelaskan apa yang ditampilkan/tidak dan mekanisme penarikan persetujuan (ODC-2015; UU-PDP-27/2022).

## Risiko & Mitigasi (contoh)

- Salah tafsir sebagai peringkat → disclaimer anti-ranking; pemisahan modul (UNCRC-3; ODC-2015).
- Permintaan informasi sensitif → ditolak sesuai kebijakan konten; penjelasan netral (UNCRC-16; UU-PDP-27/2022).
- Beban a11y → lint a11y dan tinjauan berkala (WCAG-2.2; UU-8/2016).

## Observabilitas & Jejak (akuntabilitas)

- Changelog publik ringkas (tanggal + bidang) (ODC-2015).
- Status verifikasi menampilkan tanggal dan sumber verifikasi ringkas (UU-KIP-14/2008; ODC-2015).

## Ketergantungan & Keterkaitan

- Kebijakan anti-hiperbola/anti-stigma, larangan PII anak, opt-in lokasi presisi (UNCRC-3; UNCRC-16; UU-PDP-27/2022; ISO-29100; ODC-2015).

## Versi Dokumen

- 1.0.0 (2025-08-14)

## Daftar Rujukan (kode sitasi)

- UNCRC-3, UNCRC-16 — Konvensi Hak Anak PBB.
- UU-PDP-27/2022 — Perlindungan Data Pribadi (RI).
- UU-KIP-14/2008 — Keterbukaan Informasi Publik (RI).
- UU-8/2016 — Penyandang Disabilitas (RI).
- WCAG-2.2 — Web Content Accessibility Guidelines (W3C).
- ISO-29100 — Privacy framework.
- ODC-2015 — International Open Data Charter.
