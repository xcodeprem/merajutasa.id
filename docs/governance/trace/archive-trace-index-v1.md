# Archive Trace Index v1.0 (Append-Only)
Status: Draft (hash pending)
Purpose: Menjamin jejak eksplorasi (options & UX multipage) terhubung ke state canonical aktif tanpa menghapus dokumen historis.

Non-Removal Assertion: Tidak ada konten historis yang dihapus; file ini hanya memetakan hubungan.

## 1. Scope
Mencakup dua file archive:
- docs/archive/fairness_equity-hysteresis-options-v1.md
- docs/archive/ux_public-multipage-experience-master-spec-v2.md

## 2. Decision Linkage
| Archive File | Canonical Adoption Vehicle | DEC | Notes |
|--------------|---------------------------|-----|-------|
| fairness_equity-hysteresis-options-v1.md | Parameter final Option F | DEC-20250812-02 | Semua parameter disegel lewat config + test plan |
| ux_public-multipage-experience-master-spec-v2.md | Narrative & modular disclaimers | (multi-source) | Direferensikan ke Master Spec & disclaimers lint |

## 3. Parameter Trace (Option F)
| Concept | Archive Source Section | Adopted Value | Live Location(s) | Verification Path |
|---------|------------------------|---------------|------------------|-------------------|
| Severe trigger | Option matrix row F | 0.50 | hysteresis-config-v1.yml (T_enter_major) | Hash seal + param-integrity |
| Borderline trigger | Row F | 0.60 (2 consecutive) | config (T_enter_standard, consecutive_required_standard) | Config vs DEC |
| Exit threshold | Row F | 0.65 | config (T_exit) | Test T05 |
| Cooldown | Row F | 1 snapshot | config (cooldown_snapshots_after_exit) | Test T06 |
| Stalled detection | Row F | 5 snapshots in 0.55–<0.65 | config (stalled_window_snapshots, stalled_min_ratio, stalled_max_ratio_below_exit) | Test T07 |
| Anomaly delta | Row F | 0.03 | config (anomaly_delta_threshold_equity_ratio) | Test T08 |

## 4. Narrative & UX Trace
| UX Theme | Archive Presence | Current Canonical | Lint / Policy Link |
|----------|------------------|-------------------|--------------------|
| Non-ranking fairness framing | Landing narrative draft | methodology fragment + Master Spec §30/§35 | hype-lint + disclaimers presence |
| Modular disclaimers placement | Section disclaimers mapping | disclaimers-lint-spec-v1.md | disclaimers.presence policy |
| Snapshot cadence transparency | Timeline section | disclaimers D4 + methodology fragment | disclaimers lint |
| Equity signal caution | Caution notes | disclaimers D5 + Master Spec §35 | hype-lint |
| Credential preview integrity | UX multipage flow | credential-schema-final-v1.md + Master Spec §31 | spec-hash-manifest integrity |

## 5. Integrity Assurance Plan
1. Add BOTH archive files + this trace file to spec-hash-manifest (immutable/append-only as defined).
2. Post-hash seal: Any diff on these paths → immediate FAIL (HASH_MISMATCH_DEC_REQUIRED).
3. For new explanatory commentary → add a new trace addendum section (append-only).

## 6. Change Control
- New archived design set → create docs/archive/<name>-vX.md + link di Section 2.
- Revisiting Option F rationale → create DEC referencing this trace (do not mutate old archive).

## 7. Future Addendum Placeholder
(Reserved – append only)

Hash Placeholder: <PENDING_HASH>

(End of Archive Trace Index v1.0)
