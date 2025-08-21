# Sub-Issue 2: [Task] Inisiatif Rasionalisasi Developer Experience (DevEx) dan Toolchain

Labels: DevEx, tooling, CI/CD

Parent Issue: #[Epic]

## Deskripsi

Jumlah skrip NPM yang melebihi 200 menciptakan lingkungan pengembangan yang rapuh dan sulit dikelola. Inisiatif ini bertujuan untuk menstandardisasi dan menyederhanakan toolchain.

## Daftar Tugas

- [ ] 2.1. Audit dan Konsolidasi Skrip NPM
 	- Lakukan inventarisasi semua skrip, identifikasi yang redundan atau usang, dan kelompokkan ke dalam alur kerja yang logis. Target: mengurangi jumlah skrip hingga 50-70%.
- [ ] 2.2. Implementasi Build System atau Task Runner Terpusat
 	- Evaluasi dan implementasikan tool seperti Makefile, Bazel, atau skrip orkestrasi Go/Python untuk menggantikan skrip-skrip individual yang tersebar.
- [ ] 2.3. Ciptakan Perintah Inti yang Terstandardisasi
 	- Buat satu set perintah tingkat tinggi yang intuitif, seperti `make build`, `make test`, `make lint`, `make deploy`, yang mengabstraksi kompleksitas di baliknya.
- [ ] 2.4. Buat Dokumentasi Onboarding untuk Toolchain Baru
 	- Dokumentasikan alur kerja yang baru untuk mempercepat proses adaptasi bagi pengembang baru.
