# Page → Data sources mapping

This mapping helps locate where each page gets data, the adapters (if any), and backend dependencies.

## Dashboard (`#/`)

- Entry: `src/components/Dashboard.jsx`
- Data aggregator: `fetchDashboardData()` in `src/services/api.js`
- Sources:
  - KPI: `GET /kpi/h1` or `data/h1-kpi-summary.json`
  - Under-served: `GET /under-served` or `data/under-served.json`
  - Weekly trends: `GET /kpi/weekly` or `data/weekly-trends.json`
  - Monthly feedback: `GET /feedback/monthly` or `data/feedback-monthly-rollup.json`
  - Risk digest: `GET /risk/digest` or `data/risk-digest.json`
- Realtime: `src/services/websocket/useRealtimeDashboard.js` syncs updates to store.

## Analytics (`#/analytics`) [Protected]

- Entry: `src/pages/analytics/AnalyticsPage.jsx`
- Fetchers: `fetchWeeklyTrends`, `fetchEquityAnomalies` (in `api.js`)
- Adapters: `adaptWeeklyTrends`, `adaptAnomalies` (if added under `src/services/api/feed-adapters.*`)
- Charts: lazy imports from `src/components/charts/*`
- Disclaimers: `components/Disclaimers` with `pageId="analytics"`

## Compliance (`#/compliance`) [Protected]

- Entry: `src/pages/compliance/CompliancePage.jsx`
- Gateway client: `apiGateway` from `src/services/api.js`
- Endpoints:
  - Gateway health: `getHealth()`
  - Registered services: `getServices()`
  - Chain head: `getApiV1ChainHead()`
- Disclaimers: `components/Disclaimers` with `pageId="compliance"`

## Settings (`#/settings`)

- Entry: `src/pages/settings/SettingsPage.jsx`
- Token storage: `src/services/auth/tokenManager.js`
- Auth utilities: `src/services/auth/authService.js`, `src/services/auth/useAuth.js`
- Controls: access token, remember-in-session, API key, language preference

## Auth/session

- Token manager: access token + expiry, refresh token; remember flag stored in `sessionStorage`.
- Refresh flow: `POST /auth/refresh` expects `{ refresh_token }`; response should include `access_token`, `expires_in` (sec), and optionally `refresh_token`.
- Silent refresh: scheduled ~60s before expiry via `startSilentRefresh()`.

## Health/observability

- `healthCheck()` in `api.js` calls authed Gateway client or falls back to `/health` (proxied in dev).
- Dist server: `tools/static-server.js` serves the built UI with cache headers.
