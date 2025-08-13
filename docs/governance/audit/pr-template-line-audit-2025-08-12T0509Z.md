# PR Template Line & Integrity Audit (Initial Capture)

Status: Draft v1.0 (APPEND-ONLY)  
Timestamp (UTC): 2025-08-12T05:09:02Z  
Purpose: Mendokumentasikan struktur & jejak .github/pull_request_template.md pasca penambahan Section 37 (PRINCIPLES IMPACT MATRIX). Tidak menggantikan template; hanya audit agar tidak ada kecurigaan penghapusan.  

## 1. Source File

Path: `.github/pull_request_template.md`

## 2. Section Inventory (Expected)

1. Ringkasan  
2. Jenis Perubahan  
3. Referensi Dokumen/Spesifikasi  
4. Integrity Impact  
5. Fairness / Hysteresis Impact  
6. Privacy / PII & Data Minimization  
7. Disclaimer & Copy Guardrails  
8. Policy-as-code & Lint Status  
9. Event Schema & Instrumentation  
10. Test & Quality  
11. Risk Assessment  
12. Decisions (Baru / Update)  
13. Rollback Plan  
14. Post-Merge Actions  
15. Observability Checklist  
16. Security Review  
17. Performance & A11y Notes  
18. Fairness & User Comprehension Copy  
19. Data Schema / Storage Migrations  
20. Config / Parameter Diff  
21. Log / Audit Artifacts  
22. Tidak Menghapus Strategi Confirmation  
23. Screenshots / Evidence  
24. Reviu Dibutuhkan  
25. Catatan Tambahan  
26. Spec Hash Integrity  
27. Evidence Bundle  
28. Parameter Integrity Matrix  
29. Terminology Adoption Impact  
30. Sampling & Observability  
31. Fairness Anomaly & Churn Simulation  
32. Revocation Lifecycle Consideration  
33. Data Minimization & Field Classification  
34. External Narrative & Anti-Hype Audit  
35. Audit Replay Capability  
36. “No Silent Drift” Final Checklist  
37. Principles Impact Matrix (GP1–GP10)  

Total sections: 37 (bertambah dari sebelumnya yang berakhir di 36).  

## 3. Line Count Snapshot

(Angka ini akan diisi otomatis oleh script spec-hash-diff nanti; sementara placeholder.)

| Metric | Count (Current) | Notes |
|--------|-----------------|-------|
| Total lines file | <AUTO_PENDING> | Termasuk marker AUTO |
| Non-empty lines | <AUTO_PENDING> | Tanpa blank lines |
| Comment / note lines ("> " atau parenthetical) | <AUTO_PENDING> | Governance tips |
| AUTO marker lines | <AUTO_PENDING> | Marker integrasi bot |
| Section headers (## ) | 37 | Sesuai inventory |

## 4. Integrity Hashes

(Placeholder – isi lewat pipeline. Gunakan SHA256 konten file persis.)

- sha256_current: <PENDING_COMPUTE>
- sha256_previous: (isi jika ada snapshot commit sebelumnya)
- diff_ratio_estimate: <PENDING> (token-level Jaccard; hanya bertambah?)

## 5. Structural Additions Since Prior Version

| Change | Type | Notes |
|--------|------|-------|
| Added Section 37 | Addition | Principles Impact Matrix |
| Added automation script references (principles-impact.js) | Addition | Tidak mengganti referensi lama |
| Maintained all earlier sections 1–36 | Preservation | Tidak ada rename |

## 6. No Removal Assertion

- Tidak ada penghapusan daftar referensi spesifikasi.
- Tidak ada penghapusan referensi GP1–GP10.
- Tidak ada penghapusan placeholder DEC.
- Tidak ada penghapusan guardrail disclaimers / fairness.

## 7. Optional Future Enhancements

| Idea | Rationale | DEC Needed? |
|------|-----------|-------------|
| Append archived “raw previous template” block (commented) | Menenangkan audit sejarah visual | Tidak (append only) |
| Add per-section line anchor IDs | Memudahkan bot deep linking | Tidak |
| Automatic per-section hash list | Granular tamper detection | CIC-A |

## 8. Verification Steps (Script Outline)

Pseudocode:

```bash
# 1. Extract section headers
grep '^## ' .github/pull_request_template.md > sections.txt
# 2. Count lines
wc -l .github/pull_request_template.md
# 3. Compute sha256
shasum -a 256 .github/pull_request_template.md
# 4. Assert expected section names
diff -u expected_sections.txt sections.txt
# 5. Ensure presence “GP1–GP10”
grep -q 'GP1–GP10' .github/pull_request_template.md
```

## 9. Next Actions

- [ ] Run automation to fill placeholders.
- [ ] Commit spec hash diff artifact.
- [ ] (Optional) Append archival block if requested.

## 10. Append-Only Guarantee

Peraturan: File ini hanya boleh bertambah dengan segmen audit baru (tanggal baru). Tidak boleh menghapus segmen terdahulu.

(End of audit file v1.0)
