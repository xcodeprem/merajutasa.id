# FAQ Tambahan – Hysteresis Under‑Served (DEC-20250812-02)

Q: Mengapa suatu unit baru muncul setelah dua hari di bawah 60%?  
A: Untuk menghindari fluktuasi sesaat. Sistem menunggu bukti stabil dua snapshot kecuali penurunan sangat rendah (<50%) yang ditandai segera.

Q: Mengapa unit tetap ditandai walau naik ke 63%?  
A: Exit membutuhkan pemulihan kuat ≥65% agar sinyal tidak berulang naik-turun kecil yang membingungkan.

Q: Apa arti “severe” dan “consecutive”?  
A: “Severe” berarti rasio sekali jatuh di bawah 50%. “Consecutive” berarti dua snapshot berturut antara 50% dan <60%.

Q: Apakah ini bentuk ranking?  
A: Tidak. Ini bukan peringkat kualitas layanan, hanya indikator pemerataan pemenuhan (lihat Disclaimer D1).

Q: Bagaimana jika data harian hilang?  
A: Snapshot tidak valid diabaikan dan tidak menghitung bukti consecutive.

Q: Kapan parameter bisa berubah?  
A: Setelah review 30 hari dengan data cukup, melalui keputusan governance baru (DEC baru), bukan perubahan diam-diam.

End of FAQ.