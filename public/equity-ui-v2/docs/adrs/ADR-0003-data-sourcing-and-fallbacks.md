# ADR-0003: Data sourcing and GitHub Pages fallbacks

Status: Accepted
Date: 2025-08-23

## Context

The app should work both with live services during development and as a static demo on GitHub Pages.

## Decision

- Use `services/api.js` with an `isOnPages()` heuristic to switch read-only endpoints to `public/equity-ui-v2/data/*.json` snapshots when running on GitHub Pages.
- For health checks and Gateway calls, provide a fallback to local `/health` proxy when Gateway is not running in dev.
- Keep adapters close to the API services (e.g., `feed-adapters.*`) to transform responses for charts.

## Consequences

- Demo-friendly UI without additional configuration.
- Clear boundary for where to adapt data for visualization.
