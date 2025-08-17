# Next Milestones — Menuju Gate 2 (Expanded Transparency)

Status: Draft operasional singkat (pasca Gate 1)
Rujukan utama: `docs/roadmap/roadmap-master-v1.md`
Status Gate 1: `docs/status/gate1-verification-2025-08-17.md`

Dokumen ringkas ini merangkum milestone terdekat untuk memenuhi kriteria Gate 2 sebagaimana didefinisikan di Roadmap Master (Bagian “Go / No-Go Gates”). Fokusnya adalah aktivasi transparansi yang dapat diaudit, dengan penguatan anomali, terminologi, aksesibilitas, dan publikasi changelog ringkas.

## Sasaran Gate 2 (ringkas)

Gate 2 – Expanded Transparency mengharuskan:

- Changelog excerpt live (publik).
- Anomaly detector stabil (delta threshold 0.03, noise terkendali).
- Adoption scanner terminologi operasional (persentase, tren, gating kebijakan).
- Accessibility automated scan PASS (tanpa critical).

Lihat perincian lengkap di `docs/roadmap/roadmap-master-v1.md` (H1/H2: H1-B3, H1-F1, H1-C1, H1-H2 dan H2-J1).

## Daftar Pekerjaan (siap dieksekusi)

1. Changelog Excerpt Page (H2-J1)

   - Output: Halaman publik “Changelog Excerpt” (fase 1.5).
   - Acceptance:
     - Tersaji di route publik (mis. `/changelog` atau sesuai konvensi repo).
     - Memuat ringkasan perubahan terbaru (sumber: artifacts/ atau pipeline yang sudah ada).
     - Masuk pengawasan CI (build tidak gagal jika konten kosong, tetapi presence dicek).

1. Equity Anomaly Detector Stabil (H1-B3)

   - Output: Detektor anomali delta=0.03 dengan cooldown/min sample size untuk menekan noise.
   - Acceptance:
     - Event anomali dihasilkan konsisten pada dataset uji.
     - “Coverage penjelasan” internal ≥ 100% untuk anomali terdeteksi (lihat KPI H1).
     - Tidak ada ledakan false positives pada run mingguan (indikatif).

1. Terminology Adoption Scanner + Policy-as-Code (H1-F1, H1-C1)

   - Output: Scanner hitung adoptionPercent dan rule lint kebijakan pemakaian istilah.
   - Acceptance:
     - adoptionPercent dihitung dan dipersist (artifacts/metrics).
     - CI memberi peringatan/gagal sesuai ambang kebijakan.
     - Laporan tren internal dapat dihasilkan (ndjson/json).

1. Accessibility Automated Scan PASS (H1-H2)

   - Output: Integrasi alat a11y (axe/pa11y) di CI.
   - Acceptance:
     - Tidak ada critical violations pada rute utama.
     - Laporan disimpan (artifacts/a11y-*.json) dan diringkas.

## Ketergantungan & Catatan

- Mengacu pada parameter dan definisi di `docs/roadmap/roadmap-master-v1.md` (khususnya §4, §5, §16).
- Gate 1 telah ditutup (lihat `docs/status/gate1-verification-2025-08-17.md`); Gate 2 bertumpu pada stabilisasi H1 dan sebagian aktivasi H2.

## Exit Criteria (Gate 2)

- [ ] Changelog excerpt page live dan dapat diakses.
- [ ] Anomaly detector lulus uji stabilitas internal.
- [ ] Terminology adoption scanner berjalan dan rule policy aktif di CI.
- [ ] A11y automated scan PASS tanpa critical di build default.

—
Dokumen ini bersifat pelengkap, tidak menggantikan Roadmap Master.
