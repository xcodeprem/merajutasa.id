# Lint Specification – principles.reference (v1.0)
Status: Draft for Activation (CIC-A)  
Prepared: 2025-08-12  
Scope: Memastikan setiap PR yang berpotensi memengaruhi satu atau lebih prinsip GP1–GP10 secara eksplisit mendeklarasikan dampak & mitigasi (bukan asumsi diam). Tidak menghapus lint eksisting; ini ADDITIVE.

## 1. Purpose
Mencegah “silent erosion” prinsip melalui perubahan incremental (misal menambahkan field numerik yang bisa dipersepsi sebagai ranking, atau memperluas data yang mengurangi minimisasi).

## 2. Trigger Conditions
Lint dijalankan jika dalam diff terdapat salah satu:
- File di path: `docs/`, `config/`, `content/`, `src/` yang mengandung:
  - Penambahan field event schema / credential / snapshot.
  - Perubahan parameter fairness (hysteresis, thresholds).
  - Penambahan kata kunci potensial ranking: `ranking|top|peringkat|score|skor` (case-insensitive).
  - Perubahan file PII pattern config.
  - Penambahan disclaimers atau modifikasi master disclaimers hash.
  - Penambahan file YAML/JSON di config kecuali test fixtures.

## 3. Required PR Sections
PR template Section 37 (PRINCIPLES IMPACT MATRIX) harus ada tabel minimal:

| Principle | Potential Impact (Yes/No) | Note / Mitigation |

Semua prinsip yang diberi “Yes” butuh catatan spesifik (bukan “N/A”).

## 4. Rule Codes
| Code | Description | Level |
|------|-------------|-------|
| PRIN-REF-001 | Section 37 missing entirely | ERROR |
| PRIN-REF-002 | A required principle marked implicit impact (detected by heuristics) but matrix says No | ERROR |
| PRIN-REF-003 | Impact=Yes tetapi kolom mitigasi kosong | ERROR |
| PRIN-REF-004 | New potential ranking token added & GP9 not marked Yes | ERROR |
| PRIN-REF-005 | New data field added & GP1/GP3 both No | ERROR |
| PRIN-REF-006 | Parameter diff fairness (hysteresis-config) & GP9 not Yes | ERROR |
| PRIN-REF-007 | Event schema structural change & GP10 not Yes | ERROR |
| PRIN-REF-008 | Disclaimers master hash change & GP5 not Yes | ERROR |
| PRIN-REF-009 | PII patterns diff & GP1 not Yes | ERROR |
| PRIN-REF-010 | Excessive generic mitigation text (“no impact”) repeated for Yes | WARN |

## 5. Heuristic Detection (Impact Inference)
| Principle | Heuristic Regex / Condition |
|-----------|-----------------------------|
| GP1 | Added lines with `user_ip|email|phone|address|lat|lng` or config PII |
| GP2 | DEC file addition / policy-as-code rule added |
| GP3 | Added data field in schema or DB migration file |
| GP4 | Hash/signature code path modified (`sign|hash|canonical`) |
| GP5 | Disclaimers file diff or methodology doc changed |
| GP6 | Words `score|skor|peringkat|rank|rating` removed/added near fairness text |
| GP7 | Hype words `revolusioner|terbaik|super|unggul` added |
| GP8 | Feedback form schema / category taxonomy diff |
| GP9 | Hysteresis config or fairness threshold diff |
| GP10 | Event schema file or validator code diff |

## 6. Pseudocode
```python
def run():
  diff = collect_git_diff()
  inferred = infer_principle_impacts(diff)
  matrix = parse_principles_matrix(pr_body_section_37)
  for p in inferred:
     if matrix[p].impact == 'No':
        error(PRIN-REF-002, p)
  validate_required_notes(matrix)
  check_schema_changes(matrix)
  output_report()
```

## 7. Output JSON Example
```json
{
  "summary":{"errors":2,"warnings":1},
  "violations":[
    {"code":"PRIN-REF-002","principle":"GP9","message":"Fairness config changed but GP9 marked No"},
    {"code":"PRIN-REF-003","principle":"GP1","message":"Impact Yes without mitigation note"},
    {"code":"PRIN-REF-010","principle":"GP7","message":"Generic mitigation text"}
  ]
}
```

## 8. Integration Order
Run AFTER:
1. spec hash diff
2. parameter integrity
3. hype language lint
So heuristics get stable diff data.

## 9. Acceptance Criteria
- [ ] Detect all synthetic test diffs (10 scenarios).
- [ ] 0 false negative on param hysteresis change.
- [ ] <5% false positive on neutral copy changes.
- [ ] CI fails on any ERROR codes.

## 10. Governance
Activation: CIC-A (no semantic meaning change).  
Any relaxation (e.g., removing heuristic) → CIC-E.

End of spec (append-only).

---

## Adoption Addendum (APPENDED – DO NOT ALTER ORIGINAL CONTENT)
Adoption DEC: DEC-20250812-03  
Adoption Date: 2025-08-12T06:22:10Z  
Status Change: Draft → Adopted (Phase 0 WARN, Phase 1 DENY after 48h, Phase 2 extended checks after 7d)  
No semantic rule changes from draft; only enforcement status elevated per DEC.  
Hash Post-Adoption: <PENDING_HASH_AFTER_UPDATE> (to be inserted into spec-hash-manifest-v1.json)  
Non-Removal Assertion: Konten asli di atas dipertahankan utuh; addendum hanya menambahkan status adopsi.