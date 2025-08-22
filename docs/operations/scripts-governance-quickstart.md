# Scripts Governance Quickstart

This quickstart streamlines managing 200+ npm scripts: inventory, validate, detect obsolete, and bundle Week6.

## Daily workflow

- Inventory: npm run scripts:analyze → artifacts/scripts/inventory.json
- Validate (safe-only, ≥95% target): npm run scripts:validate → artifacts/scripts/validation*.json
- Quick triage: npm run scripts:quick → artifacts/quick-script-analysis.json
- Obsolete detection: npm run scripts:obsolete → artifacts/scripts/obsolete-candidates.json
- Baseline bundle: npm run scripts:baseline (runs analyze → validate → obsolete → docs metrics)

## Standards recap

- Naming, grouping, and prefixes: see docs/operations/scripts-governance.md
- Cleanup plan: see docs/operations/scripts-cleanup-plan.md
- CI baseline: .github/workflows/scripts-validation.yml

## Week6 helpers

- End-to-end bundle: scripts/week6-validation-bundle.sh
- Health subsets: health:\* and infra:health:\* runners

Artifacts are deterministic JSON under artifacts/, suitable for governance evidence.
