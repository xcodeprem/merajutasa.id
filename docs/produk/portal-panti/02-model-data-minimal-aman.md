# Model Data Minimal Aman — Portal Panti

Status: Living Draft
Prepared: 2025-08-14

Dokumen ini merinci elemen data pada profil institusi panti beserta dasar referensi hukum/standar untuk setiap kelompok.

## 1) Wajib (dasar legitimasi & transparansi)

- nama_lembaga (string) — identitas institusional (UU-KIP-14/2008).
- wilayah_administratif (kecamatan, kota/kabupaten, provinsi) — konteks geospasial non-presisi (UNCRC-16; ISO-29100).
- status_legal_publik (nomor izin/registrasi bila berstatus informasi publik) — transparansi legal (UU-KIP-14/2008).
- kontak_institusional (email resmi, telepon kantor) — kanal institusional (UU-KIP-14/2008).
- tautan_resmi (website panti, bila ada) — sumber rujukan resmi (ODC-2015).
- tanggal_verifikasi (YYYY‑MM‑DD) — jejak waktu verifikasi (UU-KIP-14/2008).
- sumber_verifikasi (deskripsi singkat) — akuntabilitas sumber (ODC-2015).

## 2) Opsional — berdasarkan persetujuan eksplisit

- alamat_jalan (string) — data lokasi rinci memerlukan persetujuan eksplisit & prinsip minimalisasi (UU-PDP-27/2022; ISO-29100).
- titik_peta_approx (centroid kecamatan/kota; presisi hanya bila ada persetujuan tertulis) — kontrol presisi lokasi (UNCRC-16; UU-PDP-27/2022).
- jam_kunjung (string) — informasi layanan institusi (UU-KIP-14/2008).
- kanal_donasi_institusi (tautan resmi) — transparansi kanal resmi (ODC-2015).
- media_sosial_institusi (tautan) — rujukan komunikasi institusional (ODC-2015).

## 3) Dilarang (perlindungan anak & privasi)

- Data pribadi anak/pengasuh (nama, foto identifiable, tanggal lahir, kesehatan, dsb.) — hak privasi anak & pembatasan penggunaan data (UNCRC-16; UU-PDP-27/2022).
- jadwal_kegiatan_anak — pencegahan risiko keamanan (UNCRC-3; UNCRC-16).
- data_kerentanan/medis — kategori sensitif (UU-PDP-27/2022).
- koordinat_presisi tanpa persetujuan tertulis — pembatasan presisi geolokasi (ISO-29100; UU-PDP-27/2022).
- berkas yang menampilkan wajah anak tanpa redaksi — perlindungan identitas visual (UNCRC-16).

## Metadata & Jejak (akuntabilitas)

- id_profil (UUID) — identifikasi internal (ISO-29100).
- dibuat_pada / diubah_pada (timestamp) — jejak perubahan (ODC-2015).
- log_perubahan_ringkas (tanggal + field yang berubah) — audit trail ringkas (ODC-2015).
- status_verifikasi (belum diverifikasi | terverifikasi | kadaluarsa) — status informasi (UU-KIP-14/2008).
- alasan_penolakan (jika ada) — catatan keputusan (ODC-2015).

## Pertimbangan Privasi/Akses

- Default granularitas lokasi pada level kecamatan/kota — pembatasan presisi untuk mitigasi risiko (ISO-29100; UNCRC-16).
- Dokumen legal hanya bila statusnya informasi publik — kepatuhan akses (UU-KIP-14/2008).
- Penautan ke sumber asli; tidak menyalin konten anak — prinsip minimisasi & etika publikasi (UNCRC-16; ODC-2015).

## Validasi & Aturan (deskriptif)

- Nama lembaga tidak mengandung nama anak/personal (UNCRC-16).
- Wilayah administratif terisi; alamat/koordinat presisi kosong bila tidak ada persetujuan tertulis (UU-PDP-27/2022; ISO-29100).
- Kontak institusional tidak memuat akun personal; gunakan kanal institusi (UU-KIP-14/2008).
- Tautan resmi diverifikasi format dan keterhubungan institusional (ODC-2015).
- Tanggal verifikasi format ISO 8601; sumber verifikasi ringkas dan faktual (UU-KIP-14/2008; ODC-2015).

## Contoh & Non-Contoh (ringkas)

- Benar: wilayah_administratif pada tingkat kecamatan/kota.
- Salah: klaim hiperbolik pada nama_lembaga (ODC-2015).
- Salah: foto wajah anak pada profil (UNCRC-16).

## Retensi & Pembaruan (deskriptif)

- Retensi terbatas pada data institusional non-sensitif yang relevan (ISO-29100).
- Setiap pembaruan memicu entri log_perubahan_ringkas bertanggal (ODC-2015).

## Aksesibilitas & I18N (ringkas)

- Label bidang jelas, dukungan bahasa sederhana, tanggal ISO 8601, ringkasan konten (WCAG-2.2).

## Daftar Rujukan (kode sitasi) — tambahan

- UNCRC-3, UNCRC-16 — Konvensi Hak Anak PBB.
- UU-PDP-27/2022 — Perlindungan Data Pribadi (RI).
- UU-KIP-14/2008 — Keterbukaan Informasi Publik (RI).
- ISO-29100 — Privacy framework.
- ODC-2015 — International Open Data Charter.
