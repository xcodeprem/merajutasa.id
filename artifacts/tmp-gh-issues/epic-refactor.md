# Judul Issue: [Epic] Refactoring Kritis untuk Skalabilitas dan Keberlanjutan Jangka Panjang

Labels: epic, technical-debt, architecture, high-priority

Assignee:

Project:

## Deskripsi

Repositori `merajutasa.id` telah mencapai tingkat kematangan fungsional dan tata kelola yang signifikan. Namun, analisis mendalam dari perspektif rekayasa sistem berskala besar mengidentifikasi beberapa utang arsitektural dan operasional yang fundamental. Jika tidak ditangani, risiko-risiko ini dapat menghambat kecepatan iterasi, skalabilitas, dan keandalan platform di masa depan.

Dokumen tinjauan arsitektur mengonfirmasi adanya **37 komponen dengan 324 relasi dependensi** dan **16 dependensi sirkular**. Selain itu, `package.json` mengandung lebih dari 200 skrip, yang menciptakan beban operasional yang tinggi.

Epic ini berfungsi sebagai isu utama untuk melacak tiga inisiatif perbaikan kritis yang harus dijalankan secara paralel.

## Tugas Utama (Sub-Issues)

- [ ] 1. Inisiatif Refaktor Arsitektur dan Dekomposisi Sistem
 	- Tujuan: Mengurangi keterkaitan antar komponen (coupling), menghilangkan dependensi sirkular, dan meningkatkan resiliensi sistem secara keseluruhan.
- [ ] 2. Inisiatif Rasionalisasi Developer Experience (DevEx) dan Toolchain
 	- Tujuan: Menyederhanakan alur kerja pengembangan dan operasional, mengurangi beban kognitif, dan meningkatkan produktivitas tim rekayasa.
- [ ] 3. Inisiatif Isolasi dan Penguatan Produk Berisiko Tinggi
 	- Tujuan: Memitigasi risiko reputasi dan keamanan yang terkait dengan aplikasi "Portal Panti Asuhan" dengan memisahkannya dari platform inti yang kompleks.

## Tracking

- [ ] #211
- [ ] #212
- [ ] #213
