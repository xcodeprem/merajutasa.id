# Model Data Minimal Aman — Portal Panti

## 1) Wajib (default aman) (LEBIH KOMPREHENSIF LAGI)

- nama_lembaga (string)
- wilayah_administratif (kecamatan, kota/kabupaten, provinsi)
- status_legal_publik (nomor izin/registrasi bila memang informasi publik)
- kontak_institusional (email resmi, telepon kantor)
- tautan_resmi (website panti, bila ada)
- tanggal_verifikasi (YYYY‑MM‑DD)
- sumber_verifikasi (deskripsi singkat)

## 2) Opsional — Opt‑in eksplisit (LEBIH KOMPREHENSIF LAGI)

- alamat_jalan (string)
- titik_peta_approx (centroid kecamatan/kota; presisi hanya bila disetujui tertulis)
- jam_kunjung (string)
- kanal_donasi_institusi (tautan resmi institusi)
- media_sosial_institusi (tautan)

## 3) Dilarang (tidak disimpan/ditampilkan)

- PII anak/pengasuh (nama, foto identifiable, tanggal lahir, kesehatan, dsb.)
- jadwal_kegiatan_anak
- data_kerentanan/medis
- koordinat_presisi tanpa persetujuan tertulis
- berkas yang menampilkan wajah anak tanpa redaksi

## Metadata & Jejak (LEBIH KOMPREHENSIF LAGI)

- id_profil (UUID)
- dibuat_pada / diubah_pada (timestamp)
- log_perubahan_ringkas (tanggal + field yang berubah)
- status_verifikasi (belum diverifikasi | terverifikasi | kadaluarsa)
- alasan_penolakan (jika ada)

## Pertimbangan Privasi/Akses

- Default granularitas lokasi pada level kecamatan/kota.
- Dokumen legal hanya bila statusnya memang informasi publik.
- Portal hanya menautkan; tidak menyalin konten anak dari situs panti.

## Rujukan

- UU PDP (minimalisasi, purpose limitation), UNCRC Pasal 3/16, UU KIP.
