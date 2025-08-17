# Next Milestones — Menuju Gate 3 (Stage 2 Terminology)

Status: Draft operasional singkat (pasca Gate 2)
Rujukan utama: `docs/roadmap/roadmap-master-v1.md` (Gate 3 — Stage 2 Terminology)
Status Gate 2: `docs/status/gate2-verification-2025-08-17.md`

Dokumen ringkas ini merangkum milestone terdekat untuk memenuhi kriteria Gate 3: adopsi terminologi ≥70%, keputusan governance (DEC) untuk aktivasi Stage 2, dan pembaruan disclaimers/copy publik.

## Sasaran Gate 3 (ringkas)

- Terminology adoption ≥70% (baseline saat ini 100%).
- DEC Stage 2 Transition disetujui dan dicatat.
- Disclaimers & copy publik diperbarui ke Stage 2; lint & policy-as-code tetap hijau.

## Daftar Pekerjaan (siap dieksekusi)

1. Stage 2 Readiness Report
   - Keluaran: ringkasan adoptionPercent + tren, sisa saran (0), bukti artefak.
   - Artefak: `artifacts/terminology-adoption.json`, `artifacts/terminology-adoption-trend.json`.

2. DEC untuk Stage 2 Transition (eksekusi DEC-TERM-09)
   - Keluaran: draft DEC (ID + rationale + scope + rollback plan) di `docs/governance/dec/`.
   - Referensi: Roadmap Master + artefak adopsi.

3. Pembaruan Disclaimers & Copy
   - Keluaran: halaman publik disesuaikan Stage 2; lint disclaimers PASS; tidak ada istilah terlarang.
   - Kebijakan: `BANNED_MAX=0` tetap enforced; adoption gate tetap aktif.

4. Penyesuaian CI & Transparansi
   - Keluaran: scanner terminologi tetap dijalankan (ci-guard/pages), artefak tren dipublikasikan.
   - Changelog excerpt menampilkan Stage 2 transition.

## Exit Criteria (Gate 3)

- [ ] Readiness report menyatakan ≥70% (atau lebih) dengan bukti artefak.
- [ ] DEC Stage 2 disetujui dan tercatat.
- [ ] Disclaimers/copy publik diperbarui; semua lint/policy PASS.
- [ ] CI guard tetap hijau; changelog menampilkan transisi.

—
Dokumen ini pelengkap; acuan utama tetap Roadmap Master.
