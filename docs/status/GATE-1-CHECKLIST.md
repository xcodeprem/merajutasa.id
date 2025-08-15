# Gate 1 – Public Soft Launch Checklist

Status: Living – auto-updated artifacts on each CI run

Gate 1 criteria (must-have at end of H1):

- Signer + Chain active
  - Proof: chain monitor artifact and latest append proof
  - Links:
    - artifacts/chain-monitor.json (CI artifact)
    - artifacts/chain-append-latest.json (if present)
- Disclaimers lint enforced (strict)
  - Proof: CI step “Disclaimers Lint (strict)” succeeds
  - Links:
    - artifacts/disclaimers-lint.json (CI artifact)
    - docs/governance/disclaimers-lint-spec-v1.md
- PII scanner operational on feedback
  - Proof: feedback smoke report; monthly roll-up includes pii tallies
  - Links:
    - artifacts/feedback-smoke-report.json
    - artifacts/feedback-monthly-rollup.json
    - docs/privacy/pii-pattern-library-v1.md
- Hysteresis (Option F) implemented and surfaced
  - Proof: under-served artifact; methodology link in UI
  - Links:
    - artifacts/under-served.json
    - docs/fairness/hysteresis-public-methodology-fragment-v1.md
- Event collector reliability ≥98% (smoke)
  - Proof: collector reliability report
  - Links:
    - artifacts/collector-reliability.json
    - tools/collector-reliability-smoke.js
- KPI/Observability in place
  - Proof: KPI summary, weekly trends, anomalies
  - Links:
    - artifacts/h1-kpi-summary.json
    - artifacts/weekly-trends.json
    - artifacts/equity-anomalies.json
- UI availability (snapshot publish)
  - Proof: GitHub Pages deploy contains data/ snapshots and dashboard UI
  - Links:
    - .github/workflows/pages.yml
    - public/equity-ui/snapshots.html

How to verify locally (optional):

- Run monthly + KPI and smoke UI
  - npm run feedback:monthly
  - npm run h1:kpi
  - node tools/tests/equity-ui-smoke.test.js
- Check collector reliability
  - npm run collector:reliability

Notes:

- Performance budget is advisory during tuning; a11y smoke must pass.
- Governance verify includes additional critical checks (DEC lint, param lock, evidence collisions).
