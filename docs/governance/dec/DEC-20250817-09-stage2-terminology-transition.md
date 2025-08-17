---
id: DEC-20250817-09
title: Stage 2 Terminology Transition — Adoption Policy and Public Copy Updates
class: terminology
status: proposed
decided_at: 2025-08-17
hash_canonicalization_note: Canonicalization uses normalized LF and trimmed trailing spaces before hashing.
references:
  - docs/roadmap/roadmap-master-v1.md#gate-3-stage-2-terminology
  - artifacts/terminology-adoption.json
  - artifacts/terminology-adoption-trend.json
  - artifacts/disclaimers-lint.json
aliases:
  - DEC-TERM-09
---

## Decision Summary

This DEC approves the transition to Stage 2 Terminology with policy-as-code thresholds and public copy updates. The aim is to retire ranking-leaning language and clarify inclusive terminology without blocking broader delivery.

## Rationale

- Consistency with GP6 (Outcome Honesty) and GP7 (Anti-Hype & Plain Language): avoid ranking framings and ambiguous language.
- Increase clarity and inclusivity in public documentation and UI copy.
- Maintain transparent, measurable adoption via artifacts and CI.

## Scope

- Terms in scope for Stage 2 enforcement (category: ranking):
  - "ranking", "peringkat", "top", "terbaik" (and localized variants)
- Terms tracked for visibility (category: inclusive; advisory in Stage 2):
  - "whitelist" ➜ "daftar izin", "blacklist" ➜ "daftar blokir", "master" ➜ "utama", "slave" ➜ "sekunder", "user" ➜ "pengguna"

## Policy (Stage 2)

- Adoption threshold: adoptionPercent ≥ 70 (ranking category).
- Banned terms policy: BANNED_MAX=0 applies to ranking category in CI.
- Inclusive-category terms are measured and surfaced as advisory during Stage 2; proposed for future stricter gating in Stage 3.

## Rollout Plan

1) CI thresholds updated to Stage 2 (adoption ≥70, banned ranking terms = 0).
2) Public copy updates: apply Stage 2 replacements on primary docs and disclaimers; keep lint green.
3) Trend tracking continues via NDJSON/JSON; changelog excerpt highlights the transition.
4) Pages publishes updated artifacts and changelog.

## Rollback Plan

- If adoption falls below 70 or introduces regressions, temporarily relax enforcement to advisory by setting `ADOPTION_MIN=0` while keeping suggestions visible.
- Revert copy changes selectively; keep DEC reference intact for traceability.

## Acceptance Criteria

- CI green with Stage 2 thresholds (adoption ≥70, banned ranking terms = 0).
- Disclaimers lint PASS; terminology gate PASS.
- Changelog excerpt reflects the Stage 2 transition with a DEC reference.
- Terminology trend artifacts updated and published.

## Notes

- Stage 3 proposal will consider inclusive-category terms for stricter enforcement based on measured impact and copy readiness.
