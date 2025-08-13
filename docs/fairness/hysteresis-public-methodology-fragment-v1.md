# Metodologi Penandaan Under‑Served (Versi Aktif – DEC-20250812-02)

Hash (SHA256) Fragmen: <PENDING_HASH – to be filled from spec-hash-manifest-v1.json>
Version: 1.0.0  
DEC Reference: DEC-20250812-02  
Change Policy: delta-via-dec (append new fragment versions; tidak mengedit definisi lama)

Mulai 12 Agustus 2025 (DEC-20250812-02), sistem menggunakan mekanisme hibrida:

1. Deteksi cepat (severe): Jika rasio pemenuhan < 50% pada satu snapshot harian → langsung ditandai under‑served.
2. Deteksi stabil (borderline): Jika rasio berada di antara 50% dan <60% selama dua snapshot berturut-turut → kemudian ditandai under‑served.
3. Keluar dari status: Jika pada snapshot berikut rasio mencapai atau melebihi 65% (≥0.65) → status under‑served dihapus.
4. Cooldown: Setelah keluar, ada 1 snapshot cooldown untuk mencegah re-flash instan kecuali terjadi penurunan severe (<50%).
5. Stalled Recovery (internal): Jika 5 snapshot berturut under‑served dan seluruh rasio dalam rentang 0.55–<0.65 tanpa mencapai 0.65, sistem menandai internal “stalled” (tidak mengubah tampilan publik).
6. Alasan masuk internal: “severe” atau “consecutive”.
7. Anomali: Perubahan tajam (delta rasio >=0.03) dianotasi internal untuk konteks.

Disclaimers relevan:

- D1: Equity Index & daftar under‑served bukan ranking kualitas—hanya sinyal pemerataan.
- D2: Tidak ada data pribadi anak dikumpulkan / ditampilkan.

<div data-disclaimer-block="trust_hysteresis">
<p data-disclaimer-id="D1">Equity Index & daftar under‑served bukan ranking kualitas—hanya sinyal pemerataan.</p>
</div>

Audit & Verifiability:

- Fragment ini di-hash; hash tercantum di manifest integritas.
- Perubahan parameter tanpa DEC → CI fail (hysteresis.params.lock).

Tidak ada penghapusan rencana sebelumnya; pembaruan di masa depan menambahkan fragment baru + DEC baru.

(End of fragment v1.0.0 – append only for future revisions)
