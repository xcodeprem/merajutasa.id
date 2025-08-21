# Scripts Validation (Baseline)

Skrip yang digunakan (sudah ada di package.json):

- `scripts:analyze` → `node tools/scripts-inventory.js`
- `scripts:validate` → `node tools/scripts-validator.js`

Workflow

1) Jalankan inventaris:

   ```
   npm run scripts:analyze
   ```

   Output: `artifacts/scripts/inventory.json`

2) Validasi (mode aman default, threshold sukses 95%):

   ```
   npm run scripts:validate
   ```

   Output:
   - `artifacts/scripts/validation.json`
   - `artifacts/scripts/validation-summary.json`

Catatan

- Validator membaca inventory yang dihasilkan analyzer dan otomatis skip skrip berisiko (service long-running, deploy, interactive).
- Gunakan `node tools/scripts-validator.js --dry-run` untuk melihat daftar eksekusi tanpa menjalankan.
