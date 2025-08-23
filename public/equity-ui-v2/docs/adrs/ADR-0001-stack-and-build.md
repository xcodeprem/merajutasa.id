# ADR-0001: UI v2 Stack and Build Strategy

Status: Accepted
Date: 2025-08-23

## Context

We need a modern, fast, and testable frontend for Equity UI v2 with simple hosting (GH Pages compatible) and local performance characteristics suitable for data visualizations.

## Decision

- Use React 19 + Vite 7 for fast dev/build.
- Styling with Tailwind CSS 4; component-level utilities; no heavy UI kit.
- Data layer via React Query 5 for caching/retries and simple invalidation.
- Lightweight global state via React Context/Zustand for theme and small bits only.
- Charts loaded lazily to keep initial bundle small.
- Build to `public/dist` with gzip+brotli precompression; serve via small Express server in dev/prod smoke with strong caching and SPA fallback.
- Testing via Vitest + RTL; a11y via jest-axe; optional E2E via Playwright.

## Alternatives considered

- Next.js: Great DX/SSR/ISR but unnecessary for SPA and complicates GH Pages.
- Create React App: Deprecated and slower builds.
- Rollup/Webpack custom: More control, more maintenance.

## Consequences

- Simple SPA deploy friendly to static hosting.
- Good local perf due to code-splitting and precompression.
- Requires discipline for routing/auth since we don’t use a router library; acceptable given small route surface.
