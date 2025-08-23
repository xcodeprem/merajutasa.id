# PR Checklist – Equity UI v2

Paste this block into your PR description and tick items:

- [ ] I linked to updated docs under `public/equity-ui-v2/docs/` (sections changed):
  - [ ] Architecture
  - [ ] Contributing
  - [ ] Scripts
  - [ ] Page→Data mapping
  - [ ] ADRs (list numbers)
- [ ] All unit/integration tests pass locally: `npm run equity-ui-v2:test`
- [ ] Coverage meets thresholds (see Vitest config/report): `npm --prefix public/equity-ui-v2 run test:coverage`
- [ ] For auth changes: flows covered by tests (401 retry, refresh, logout)
- [ ] For UX changes: attached screenshots/GIF
- [ ] Built dist and verified health: `npm run equity-ui-v2:dist:all`
- [ ] No governed files changed without DEC; if changed, link DEC

If adding/altering endpoints, update `page-data-mapping.md` and ensure GH Pages fallbacks are considered.
