# Agent Bootstrap Manifest v1.0 (Append-Only)

Status: Baseline Draft (hash pending – will be included in spec-hash-manifest at next update)  
Prepared: 2025-08-12  
Authoring Context: Created to enable any NEW Agent (governance bot, CI lint worker, audit assistant) memahami seluruh jejak strategi tanpa menghapus atau menimpa dokumen sebelumnya.  

Non-Removal Assertion: Dokumen ini TIDAK mengganti, menyederhanakan, atau menghapus strategi terdahulu; hanya merangkum & menunjuk (pointer) ke sumber canonical.

---

## 1. Tujuan

Memberikan panduan deterministik bagi Agent baru untuk:

1. Menemukan & memverifikasi file canonical.
2. Memastikan integritas (hash sealing) dan kepatuhan DEC chain.
3. Menjalankan lint principles.reference & guardrails lain secara benar.
4. Merekam bukti (evidence bundle) tanpa mengubah sejarah.
5. Mengklasifikasikan perubahan PR terhadap prinsip GP1–GP10.

---

## 2. Ruang Lingkup & Batasan

Termasuk: fairness hysteresis governance, hash manifest, DEC activation, principles matrix enforcement, disclaimers lint, credential/event schema canonical, test plan execution placeholders.  
Tidak termasuk: implementasi internal bisnis, pipeline runtime beyond governance surface.

---

## 3. File Canonical & Mutability (Snapshot)

| Path | Domain | Mutability Rule | dec_ref | Notes |
|------|--------|-----------------|---------|-------|
| docs/integrity/spec-hash-manifest-v1.json | Integrity Core | append-only (replace placeholders) | multiple | Sumber daftar & aturan |
| docs/fairness/hysteresis-config-v1.yml | Fairness Config | locked-by-config-hash | DEC-20250812-02 | Parameter Option F |
| docs/fairness/hysteresis-public-methodology-fragment-v1.md | Fairness Narrative | delta-via-dec | DEC-20250812-02 | Public fragment |
| docs/fairness/hysteresis-state-machine-transitions.md | Fairness Spec | append-only | DEC-20250812-02 | Transisi internal |
| docs/governance/dec/DEC-20250812-02-hysteresis-adoption.md | Decision | immutable | SELF | Opsi F adoption |
| docs/governance/dec/DEC-20250812-03-principles-reference-activation.md | Decision | immutable | SELF | Activation lint |
| docs/governance/lint-principles-reference-spec-v1.md | Lint Spec | append-only (post adoption) | DEC-20250812-03 | Section 37 rules |
| docs/governance/disclaimers-lint-spec-v1.md | Lint Spec | delta-via-dec | future DEC | Disclaimers presence |
| docs/principles/GP1-GP10-index.md | Principles | append-only | – | Ringkasan GP1–GP10 |
| docs/master-spec/master-spec-v2.0.md | Master Spec | delta-files | – | Baseline v2.0 |
| docs/master-spec-deltas/delta-master-spec-v2-DEC-20250812-02.md | Delta | immutable | DEC-20250812-02 | Parameter delta |
| docs/integrity/credential-schema-final-v1.md | Credential Schema | versioned | future DEC | Chain & fields |
| docs/analytics/event-schema-canonical-v1.md | Event Schema | versioned | future DEC | Envelope events |
| .github/pull_request_template.md | Governance Workflow | append-only | DEC-20250812-02/03 | 37 sections |
| docs/tests/hysteresis-test-plan-v1.md | Test Plan | append-only | DEC-20250812-02 | Execution table |
| docs/governance/policy-index-v1.md | Policy Index | append-only | DEC-20250812-03 | Guardrail map |
| docs/governance/audit/pr-template-line-audit-2025-08-12T0509Z.md | Audit Snapshot | immutable | – | Baseline structure |

(Agent WAJIB memverifikasi keberadaan file di atas sebelum menjalankan lint enforcement final.)

---

## 4. Bootstrap Sequence (High-Level)

1. Parse spec-hash-manifest → build internal registry (path → rules).
2. Validate no critical canonical path missing (error if absent unless manifest marks placeholder).
3. For each file with hash_sha256 placeholder `<PENDING_HASH>`:
   - If first bootstrap & policy allows, compute & fill; else raise drift warning (depending on mode).
4. Parse DEC files (status=adopted) -> build DEC index (id → date, class, scope).
5. Cross-link: For every file next_change_requires_dec=true, ensure at least one DEC referencing it (explicit dec_ref match or delta).
6. Load PR (if in PR context) → extract Section 37 matrix.
7. Run heuristics (principles-impact) → produce inferred principle impact set.
8. Compare with matrix, apply lint-principles rules (PRIN-REF-001..010).
9. Assemble evidence bundle (disclaimers, schema validation, param integrity).
10. Output consolidated enforcement report (RAG + violations + hash status).

---

## 5. Hash & Integrity Validation (Deterministic Steps)

| Step | Description | Fail Code (suggested) |
|------|-------------|-----------------------|
| H1 | Manifest JSON parse valid | INTEGRITY_MANIFEST_PARSE |
| H2 | Every file with next_change_requires_dec has dec_ref or DEC link chain | MISSING_DEC_LINK |
| H3 | For file hash mismatch (non-placeholder) & no new DEC | HASH_MISMATCH_DEC_REQUIRED |
| H4 | Placeholder hashes remain after sealing window closed | PLACEHOLDER_AFTER_SEAL |
| H5 | Non-allowed mutability violation (line deletions in append-only) | MUTABILITY_VIOLATION |
| H6 | Master Spec changed directly (not via delta) | MASTER_SPEC_DIRECT_EDIT |

Note: Agent tidak mengedit (kecuali penggantian placeholder awal). Mode strict → semua placeholder dianggap harus sudah terisi; mode bootstrap-init → placeholder dapat diisi.

---

## 6. PR Evaluation Workflow (Principles Impact)

| Phase | Condition | Enforcement |
|-------|-----------|-------------|
| 0 | <48h post DEC-20250812-03 | WARN for PRIN-REF errors |
| 1 | ≥48h | ERROR (fail merge) |
| 2 | ≥7d | ERROR + requires evidence bundle completeness |

Matrix Checks:

- Missing table → PRIN-REF-001
- Inferred Impact vs Declared No → PRIN-REF-002
- Missing mitigation for Yes → PRIN-REF-003
- Ranking token addition & GP9=No → PRIN-REF-004
- Parameter fairness diff w/o GP9=Yes → PRIN-REF-006

---

## 7. Parameter & Hysteresis Integrity

Validation Source:

- docs/fairness/hysteresis-config-v1.yml
- Code constants (extracted via regex or build export)
Checks:
- Each parameter (T_enter_major, T_enter_standard, consecutive_required_standard, T_exit, cooldown_snapshots_after_exit, stalled_window_snapshots, stalled_min_ratio, stalled_max_ratio_below_exit) equality.
- Drift detection (first mismatch: WARN; second consecutive mismatch: ERROR → aligns with enforcement escalation).
- If anomaly_delta_threshold_equity_ratio changed sans DEC anomaly → raise FAIRNESS_ANOM_DEC_REQUIRED (planned).

---

## 8. Evidence Bundle Composition (Section 27)

Required Artifacts (initial set):

| Artifact | Produced By | Purpose |
|----------|-------------|---------|
| disclaimers-lint-report.json | disclaimers lint | Validate disclaimers presence |
| event-schema-validation-report.json | schema validator | Event structure compliance |
| pii-scan-test-summary.json | PII scanner | Minimization evidence |
| param-integrity-matrix.json | param-integrity.js | Parameter match matrix |
| principles-impact-report.json | principles-impact.js | Heuristic vs declared diff |
| fairness-sim-report.json | fairness-sim.js | Churn & detection delay projection |
| observability-metrics.json | observability-metrics.js | Ingestion & lag baseline |
| no-silent-drift-report.json | no-silent-drift.js | Aggregated drift findings |
| audit-replay.json | audit-replay.js | Reproducibility baseline |

Completeness Rule:

- For Phase 2 DEC-20250812-03 enforcement, all artifacts must exist (even if some metrics null). Missing → EVIDENCE_INCOMPLETE.

---

## 9. Policy-as-Code Order (CI Pipeline)

1. spec-hash-diff (fills & verifies hash)  
2. param-integrity (hysteresis lock)  
3. disclaimers-lint (ensures presence & hash)  
4. hype-lint (anti-hype tokens)  
5. principles-reference (matrix vs heuristics)  
6. additional domain lint (pii.patterns, anomaly)  
7. evidence-bundle synthesis check (if required phase)  

Failure short-circuit semantics: If earlier step is ERROR → subsequent steps may be skipped (recorded as NOT_RUN) to avoid cascading noise.

---

## 10. RAG Snapshot (Embedded for Agent Baseline)

| Domain | Status | Key Gap |
|--------|--------|---------|
| Fairness Methodology | GREEN | Hash sealing pending |
| Governance DEC Chain | GREEN | None immediate |
| Hash & Integrity | RED | Placeholders not filled |
| Automation Scripts | AMBER | Logic stubs minimal |
| Privacy / PII | AMBER | Pattern lint inactive |
| Observability | AMBER | Metrics null baseline |
| Principles Enforcement | GREEN (Phase 0) | Escalation timing |
| Evidence Bundle | AMBER | Artifacts incomplete |
| Anti-Hype | AMBER | Lint stub only |

Agent must not downgrade RED status until conditions resolved (see Section 12).

---

## 11. Open Gating Decisions (For Reference)

| Decision | Needed For | Current State |
|----------|------------|---------------|
| DEC anomaly (delta threshold formalization) | Anomaly events enforcement | Pending |
| Hash sealing cadence policy | Spec update gating finalization | Daily vs per-commit (TBD) |
| PII false positive target threshold | Privacy lint severity | Not set |
| Phase 1 timestamp anchor | Strict DENY switch | Derived from DEC date ±48h |

Agent should read DEC-20250812-03.date then compute enforcement windows; do NOT hardcode epoch.

---

## 12. Bootstrap Pseudocode

```python
def bootstrap(mode='strict'):
    manifest = load_manifest()
    registry = index_files(manifest)
    ensure_mandatory_present(registry)
    seal_hashes_if_allowed(mode, registry)
    dec_index = parse_decs(registry)
    validate_dec_links(registry, dec_index)
    context = compute_enforcement_phase(dec_index['DEC-20250812-03'])
    if is_pr_context():
        pr_body = load_pr_body()
        matrix = parse_principles_matrix(pr_body)
        inferred = run_heuristics(diff())
        violations = eval_principles_rules(matrix, inferred, context.phase)
        evidence = gather_evidence()
        output = build_report(registry, violations, evidence, context)
        write(output)
        exit(1 if output.errors else 0)
```

---

## 13. Failure Codes (Suggested)

| Code | Meaning | Recovery Hint |
|------|---------|---------------|
| INTEGRITY_MANIFEST_PARSE | Manifest invalid JSON | Validate JSON schema |
| MISSING_DEC_LINK | File changed w/o DEC | Create DEC or revert |
| HASH_MISMATCH_DEC_REQUIRED | Hash drift locked file | Add DEC or reject |
| PLACEHOLDER_AFTER_SEAL | Placeholder remained past sealing | Run hash fill |
| MUTABILITY_VIOLATION | Append-only deletion detected | Restore removed lines |
| MASTER_SPEC_DIRECT_EDIT | Master spec mutated directly | Revert; use delta file |
| PRIN_REF_MATRIX_MISSING | Section 37 absent | Add matrix |
| PRIN_REF_IMPACT_MISMATCH | Heuristic vs declared mismatch | Update matrix or code |
| EVIDENCE_INCOMPLETE | Required artifact missing | Generate artifact |
| PARAM_DRIFT | Config vs runtime mismatch | Align values or DEC |
| DISCLAIMER_DRIFT | Disclaimers hash changed w/o DEC | Add DEC or revert |

---

## 14. Append-Only Change Policy (Untuk Dokumen Ini)

Perubahan yang diperbolehkan:

- Menambahkan baris/section baru.
- Menambahkan entry tabel baru.
Tidak diperbolehkan:
- Menghapus atau menyunting definisi di bagian sebelumnya kecuali menambah Addendum yang menyatakan supersede (tanpa menghapus teks lama).

Addendum format:

```
## Addendum YYYY-MM-DD – Reason
(Deskripsi tambahan; tidak mengubah konten baseline.)
```

---

## 15. Interaksi Agent Multi-Peran

Jika ada lebih dari satu Agent (lint vs audit):

- Audit Agent menjalankan hash & structural snapshot; menyimpan artifacts/audit-scan-<ts>.json
- Lint Agent membaca snapshot (jika timestamp <5m) agar tidak re-hash (idempotent).
- Conflict avoidance: hanya satu Agent diberi izin write manifest (lock file .ci/manifest.lock). Jika lock ada & >10m stale → override safe mode log.

---

## 16. Metrics Minimal yang Dianjurkan (First Fill)

| Metric | Source | Target (Initial) |
|--------|--------|------------------|
| missing_matrix_rate | principles lint | 0% Phase 1 |
| fairness_config_mismatch_count | param-integrity | 0 |
| churn_projection_pct | fairness-sim | <15% |
| detection_delay_avg | fairness-sim | <=1 snapshot |
| ingestion_success_24h_pct | observability-metrics | ≥99% (placeholder) |
| event_lag_p95_ms | observability-metrics | <5000 ms |

Agent boleh menulis placeholder null → tidak menurunkan status, tapi generate TODO.

---

## 17. Terminology Adoption Guidance

If terminology-scan shows adoptionPercent_after < adoptionPercent_before:

- Flag TERM_REGRESSION (WARN) → Developer review.
If new_tokens non-empty:
- Ensure principles matrix marks GP5 (transparency) or GP7 (anti-hype) appropriately if tokens user-facing.

---

## 18. Security & Integrity Chain Cross-Check

For credential / event schema changes:

- Ensure GP4 (verifiability) & GP10 (auditability) flagged Yes.
- If signature/public_key_id field semantics added → require new DEC.

---

## 19. Minimal Heuristic Regex Set (Seed)

| Principle | Regex (case-insensitive) |
|-----------|--------------------------|
| GP6 | `ranking|peringkat|top\\s\\d+|score|skor` |
| GP7 | `revolusioner|terbaik|unggul|paling\\s(bagus|hebat)` |
| GP1/3 | `email|phone|telepon|alamat|address|lat\\s*[,/]|lng\\s*[,/]` |
| GP9 | `T_enter_major|T_exit|hysteresis` |
| GP10 | `event_schema|event-version|event_name` |

Agent boleh memperluas, tetapi tidak menghapus baseline.

---

## 20. Output Report Schema (Suggested)

```json
{
  "timestamp": "2025-08-12T06:55:00Z",
  "phase": "Phase0|Phase1|Phase2",
  "hash_integrity": {"violations": [], "updated": [], "placeholders_remaining": 3},
  "principles_lint": {"errors": [], "warnings": []},
  "evidence_completeness": {"missing": ["pii-scan-test-summary.json"]},
  "param_integrity": {"mismatches": []},
  "rag": {"hash": "RED", "fairness": "GREEN", "privacy": "AMBER"},
  "exit_code": 0
}
```

---

## 21. Roadmap Hooks

Agent dapat mengekstrak milestone dari docs/roadmap/roadmap-master-v1.md lalu membuat delta interpretasi internal tanpa mengedit file (tulis output ke artifacts/roadmap-scan.json).

---

## 22. Logging & Traceability

All agent actions log ke:

- artifacts/agent-run-<timestamp>.log
Include:
- Manifest revision hash.
- DEC IDs loaded.
- Principle heuristic counts.
- Evidence artifact existence map (SHA256 each).

---

## 23. Konflik & Recovery

Jika HASH_MISMATCH_DEC_REQUIRED:

1. Mark PR as BLOCKED.
2. Append suggestion: “Tambahkan DEC baru atau revert commit X.”
3. Do not auto-correct content (immutability principle).

---

## 24. Addendum Reserved

(Empty – future append only)

---

## 25. Ringkasan Eksekutif Untuk Agent

“Validasikan set canonical, seal hash, terapkan lint prinsip dengan heuristik, kumpulkan evidence, laporkan RAG. Tidak pernah menghapus sejarah—selalu append.”

---

Hash Placeholder: <PENDING_HASH>  
Akan dimasukkan ke spec-hash-manifest-v1.json (append entry) – tidak menggantikan file lain.

(End of agent-bootstrap-manifest v1.0 – Append-Only)
