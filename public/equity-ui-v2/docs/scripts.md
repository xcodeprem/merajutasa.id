# Scripts reference (UI v2)

From repo root, prefer these npm scripts:

- Install deps: `npm run equity-ui-v2:install`
- Dev server: `npm run equity-ui-v2:dev`
- Build (dev): `npm run equity-ui-v2:build`
- Build dist + report + health: `npm run equity-ui-v2:dist:all`
- Serve dist (Express): `npm run equity-ui-v2:serve:dist`
- Preview (Vite): `npm run equity-ui-v2:preview`
- Lint: `npm run equity-ui-v2:lint` (or `lint:fix`)
- Tests:
  - All: `npm run equity-ui-v2:test`
  - Coverage: `npm --prefix public/equity-ui-v2 run test:coverage`
  - A11y unit: `npm run equity-ui-v2:test:a11y:unit`
  - A11y e2e: `npm run equity-ui-v2:test:a11y:e2e`

Artifacts produced:

- `artifacts/ui-dist-report.json` – dist inventory summary
- `artifacts/*health-check*.json` – observability/perf health reports

Notes:

- Static server sets cache headers and serves `.gz`/`.br` files; suitable for quick smoke.
- For GH Pages, assets are read from `public/equity-ui-v2/data/*.json` when `location.host` matches `github.io`.
