# ADR-0002: AuthN/AuthZ and Token Refresh

Status: Accepted
Date: 2025-08-23

## Context

Analytics and compliance routes must be protected. Token-based auth should allow session refresh to avoid UX disruptions while remaining simple and auditable.

## Decision

- Manage tokens via `tokenManager` with access token + expiry + refresh token, optional session persistence, and a tiny subscriber API.
- Implement `/auth/refresh` POST flow in `authService.refreshToken()`; schedule silent refresh ~60s before expiry.
- Wrap Gateway client calls in `createAuthedGatewayClient()` which retries once on 401 by invoking `refreshToken()`, then clears session on failure.
- UI guards: unauthenticated users browsing protected routes are shown Settings to configure tokens.

## Alternatives considered

- OAuth PKCE implicit: Adds extra complexity and dependencies not needed for internal/SaaS admin UI.
- Full router guards (React Router): Heavy for our simple hash-based routing, but can be adopted later if route surface grows.

## Consequences

- Minimal deps, predictable behavior, and unit-testable logic.
- Requires backend `/auth/refresh` parity; parsing may be adjusted to match real response fields (e.g., `access_token`, `expires_in`, `refresh_token`).
