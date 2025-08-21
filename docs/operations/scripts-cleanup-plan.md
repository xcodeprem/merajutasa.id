# Scripts Cleanup Plan

Sumber data:
- Inventory: `artifacts/scripts/inventory.json`
- Validation: `artifacts/scripts/validation-summary.json`
- Obsolete Candidates: `artifacts/scripts/obsolete-candidates.json`

## Langkah Eksekusi

### 1) Generate inventory & validation
   - `npm run scripts:analyze`
   - `npm run scripts:validate` atau `node tools/scripts-validator.js --dry-run`
   - `node tools/obsolete-scripts-detector.js`

### 2) Identifikasi kandidat hapus:
   - **Skrip duplikat**: Lihat `obsolete-candidates.json` untuk duplikasi eksak
   - **Skrip tidak direferensikan**: Skrip yang tidak dipanggil oleh runner lain
   - **Skrip deploy/publish**: Yang tidak digunakan di pipeline CI/CD  
   - **Skrip PowerShell**: Yang tidak kompatibel dengan Linux

### 3) Tinjau "skipped" scripts:
   - **Long-running**: service:*, *:start, *:watch
   - **Deploy/publish**: deploy*, publish*, *:production  
   - **Interactive**: Skrip yang memerlukan input user
   - Pastikan kategori ini memang seharusnya tidak masuk validasi

### 4) Hapus atau konsolidasikan:
   - Backup `package.json` sebelum modifikasi
   - Update referensi di runner agregasi (test:*, *:all, etc.)
   - Konsolidasikan skrip dengan fungsi identik

### 5) Verifikasi:
   - Jalankan `npm run scripts:validate` dan pastikan success rate ≥ 95%
   - Test skrip agregasi yang dimodifikasi
   - Update dokumentasi bila ada perubahan signifikan

## Status Target
- **Current**: ~60% validation success rate
- **Target**: ≥95% validation success rate
- **Current duplicates**: 6 candidates identified

## Tools Tersedia
- `npm run scripts:analyze` - Generate inventory lengkap
- `npm run scripts:validate` - Validasi dengan timeout protection  
- `npm run scripts:organize` - Auto-reorganize dan cleanup (gunakan dengan hati-hati)
- `node tools/obsolete-scripts-detector.js` - Deteksi kandidat obsolete