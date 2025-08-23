# Accessibility and Performance Guide

## Accessibility (WCAG 2.1 AA)

- Keyboard navigation: ensure focus outlines and logical tab order.
- Color contrast: Tailwind themes comply; verify with jest-axe and manual checks.
- Semantics: landmarks (main, nav), aria-labels on controls, alt text.
- Disclaimers: use `components/Disclaimers` and non-ranking language.

Testing:

- Unit a11y: `npm run equity-ui-v2:test:a11y:unit`
- E2E a11y (optional): `npm run equity-ui-v2:test:a11y:e2e`

## Performance (<2s target)

- Code-splitting: lazy charts, route-based Suspense in `App.jsx`.
- Cache: React Query staleTime and background refresh; Express static cache headers.
- Compression: vite-plugin-compression (gzip, brotli).
- Defer heavy work: initialize charts after data resolves.
- Monitor: `npm run observability:start` then `npm run performance:health-check`.

Artifacts:

- `artifacts/ui-dist-report.json`
- `artifacts/*health-check*.json`
