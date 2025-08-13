# Audit Process Overview (Append-Only)

Purpose: Menstandarkan artefak audit setelah hash seal baseline.

## 1. Artifacts

| Artifact | Path | Trigger | Purpose |
|----------|------|---------|---------|
| spec-hash-diff report | artifacts/spec-hash-diff.json | seal-first & verify | Integritas hash & drift detection |
| PR template line audit | docs/governance/audit/pr-template-line-audit-<ts>-posthash.md | Setelah seal | Bukti struktur template stabil |
| Phase tracker (future) | artifacts/phase-tracker.json | Scheduled / CI | Monitoring countdown WARN→ERROR→DENY |
| Evidence bundle report | artifacts/evidence-bundle-report.json | CI per PR | Kelengkapan bukti governance |

## 2. Hash Seal Procedure (Condensed)

1. Freeze baseline (declared).
2. Run seal-first (fills placeholders + DEC internal hash).
3. Generate PR template line audit snapshot.
4. Run verify (0 violations, 0 placeholders).
5. Commit & tag (opsional) `hash-seal-baseline-v1`.
6. Add changelog excerpt entry referencing commit & DEC IDs.

## 3. Violation Handling

| Code | Action |
|------|--------|
| PLACEHOLDER_AFTER_SEAL | FAIL build; root-cause mengapa placeholder dibiarkan |
| HASH_MISMATCH_DEC_REQUIRED | FAIL; butuh DEC baru atau revert |
| DEC_HASH_FIELD_MISMATCH | FAIL; selaraskan kembali, audit potensi tamper |
| MISSING_FILE | FAIL; telusuri commit yang menghapus tanpa policy |

## 4. Non-Removal Assertion

File audit snapshot TIDAK diubah; tambahan snapshot → file baru.

## 5. Future Extensions

- Append section untuk risk register referensi
- Link ke DEC disclaimers / anomaly saat tersedia
- Phase tracker summary embed

Hash Placeholder: <PENDING_HASH>

(End of README-audit-process.md)
