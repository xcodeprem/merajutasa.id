# Architecture

This section explains how Equity UI v2 is structured and how data flows through the app.

## High-level

- Runtime: React 19 SPA with Vite.
- State/data: React Query for async fetching/caching; small UI state via Zustand (theme) and simple React state.
- i18n: react-i18next, locales persisted in localStorage and URL `?lang=`.
- Auth/session: Token manager storing access token + expiry + refresh token with optional session persistence; silent refresh scheduled before expiry; 401 retry-once then logout.
- Realtime: Socket.IO client with `useRealtimeDashboard` hook to push live updates.
- Charts: Lazy-loaded chart components to keep TTI small.
- Build/serve: Vite builds to `public/dist/` with precompression (gzip+brotli). An Express server serves dist with strong cache headers and SPA fallback.

## Folders

- `src/components/`: Reusable UI pieces (Header, Dashboard, Cards, Disclaimers, Charts, ErrorBoundary).
- `src/pages/`: Route-level pages: dashboard, analytics, compliance, settings.
- `src/services/`: API access, auth, websocket, i18n bootstrap, generated OpenAPI client.
- `src/stores/`: Theme context and any light global UI state.

## Routing and Guards

- Hash-based routing via `window.location.hash` with minimal logic in `App.jsx`.
- Protected pages: `#/analytics` and `#/compliance` require authentication. If not authenticated, we render Settings so users can configure tokens.
- Error boundaries: `ErrorBoundary` wraps lazy pages to catch render/runtime errors and show a fallback.

## Data flow

- `services/api.js` exposes fetchers for dashboard content and wraps an authed Gateway client for Phase 2 endpoints.
- `fetchDashboardData()` aggregates multiple endpoints in parallel and returns a single object the `Dashboard` consumes.
- On GitHub Pages, data fetchers read from prebuilt `public/equity-ui-v2/data/*.json` snapshots (see `isOnPages()` heuristics in `api.js`).

## Auth flow

- `tokenManager` manages tokens: set/get access token with TTL or explicit expiry, refresh token storage, clear, and a subscription mechanism.
- `authService` implements `refreshToken()` using POST `/auth/refresh`, updates tokens, and exposes `createAuthedGatewayClient()` which retries once on 401 before logging out.
- `startSilentRefresh()` schedules a refresh ~60s before expiry, rescheduling after each refresh; `stopSilentRefresh()` cancels timers. `App.jsx` starts/stops this based on `useAuth().isAuthenticated`.

## Build, caching, and serving

- Vite configuration outputs hashed assets; `vite-plugin-compression` emits `.gz` and `.br` variants.
- `tools/static-server.js` serves with:
  - `Cache-Control: public, max-age=31536000, immutable` for hashed assets
  - `Cache-Control: public, max-age=86400` for JSON/text
  - `Cache-Control: no-cache` for HTML
  - SPA fallback using an Express 5-safe catch-all regex

## Error handling and resilience

- Pages show loading states and friendly errors with retry affordances.
- `ErrorBoundary` logs and renders a fallback on unexpected exceptions.
- API `healthCheck()` falls back to `/health` proxy in dev if Gateway isn’t running.

## Testing

- Unit/integration tests via Vitest + RTL; a11y smoke tests via jest-axe; optional Playwright e2e.
- Coverage enforced via V8 with thresholds configured in Vite/Vitest setup.
