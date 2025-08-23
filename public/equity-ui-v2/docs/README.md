# Equity UI v2 – Developer Guide

This folder hosts the living docs for the Equity UI v2 app. It covers the architecture, how to contribute, available scripts, key technical decisions (ADRs), and a page → data sources mapping for quick onboarding.

- Architecture: ./architecture.md
- Contributing: ./contributing.md
- Scripts: ./scripts.md
- Page → Data mapping: ./page-data-mapping.md
- ADRs: ./adrs/
- PR Checklist (copy into PR description): ./pr-checklist.md

If you’re reviewing a UI v2 PR, ask authors to include a link to changed sections here and tick the PR checklist.

## Quick start

- Install deps: from repo root run: npm run equity-ui-v2:install
- Dev server: npm run equity-ui-v2:dev (ensure API Gateway/services are up to avoid proxy 502s)
- Unit tests: npm run equity-ui-v2:test
- Coverage: npm --prefix public/equity-ui-v2 run test:coverage
- Build dist: npm run equity-ui-v2:dist:all
- Serve dist locally: npm run equity-ui-v2:serve:dist (precompressed, cache headers)

## Current stack (summary)

React 19 + Vite 7 + Tailwind CSS 4 + React Query 5 + Zustand + i18n (react-i18next) + Socket.IO client. Tests via Vitest + RTL (+ jest-axe), optional E2E via Playwright.

See ADR-0001 for rationale and alternatives.