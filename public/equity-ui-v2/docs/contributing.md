# Contributing to Equity UI v2

This guide explains local setup, coding standards, testing, and PR expectations for UI v2.

## Setup

- Node 18+ required. From repo root:
  - Install deps: `npm run equity-ui-v2:install`
  - Start API Gateway/services if developing features that call backend:
    - `npm run api-gateway:start` (and optionally start signer/chain/collector)

## Development

- Dev server: `npm run equity-ui-v2:dev`
- Lint: `npm run equity-ui-v2:lint` (use `:lint` then `:lint:fix`)
- Format: `npm --prefix public/equity-ui-v2 run format`
- Unit tests: `npm run equity-ui-v2:test`
- Coverage: `npm --prefix public/equity-ui-v2 run test:coverage`
- A11y unit: `npm run equity-ui-v2:test:a11y:unit`
- E2E a11y: `npm run equity-ui-v2:test:a11y:e2e` (requires Playwright install)

## Patterns and conventions

- Prefer functional components and hooks. Keep components focused and composable.
- Lazy-load heavy chart modules and wrap with Suspense fallbacks.
- Use React Query for data fetching and caching. Keep query keys stable and scoped.
- Never block rendering while waiting for non-critical data; show friendly loading and error states.
- Keep typed contracts documented in code comments; avoid prop drilling by composing.
- i18n: Add keys to both `en` and `id` locales. Avoid hardcoded strings.
- Auth: Use `tokenManager` and `authService` helpers; don’t roll your own storage or timers.

## PR expectations

- Include a link to docs you changed in `public/equity-ui-v2/docs/`.
- Paste the checklist from `public/equity-ui-v2/docs/pr-checklist.md` into the PR and tick items.
- If changing governed files in `docs/**`, follow governance rules and DEC process.
- For UX changes, attach screenshots or short GIFs.
- For feature flags or risky flows, add unit tests and keep coverage at or above thresholds.

## Build/Release

- Build to dist and validate:
  - `npm run equity-ui-v2:dist:all`
  - Artifacts:
    - `artifacts/ui-dist-report.json`
    - Observability/perf health check outputs (part of postbuild verify)

## Troubleshooting

- Dev proxy 502: make sure API Gateway is running. Try `npm run api-gateway:status`.
- Static server crash: ensure fallback route is the regex version (Express 5-safe). Already fixed in `tools/static-server.js`.
- Tests flaky on charts: ensure chart mocks in Vitest setup are active.
