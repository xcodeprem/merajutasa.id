# Startup Order (Derived from Dependency Graph)

This document defines the deterministic startup order for MerajutASA.id components based on the dependency graph topological sort.

## Global Prerequisites

Before starting any service:

- Database migrations completed
- Secrets/Config loaded
- File system access validated
- Network connectivity verified

## Order (Topologically Sorted)

The startup order is derived from `build/deps/graph.json` using topological sort:

### Phase 1: Foundation Services (Parallel Group A)

1. **db** - Database service (no dependencies)
2. **search** - Search service (no dependencies)

*These services can start in parallel as they have no dependencies.*

### Phase 2: Authentication Layer

1. **auth** - Authentication service (after db)

*Requires: db healthy*

### Phase 3: Application Services

1. **catalog** - Catalog service (after db + search)

*Requires: db and search healthy*

### Phase 4: API Gateway

1. **gateway** - API Gateway (after auth + catalog)

*Requires: auth and catalog healthy*

## Operational Guidance

### Health Check Endpoints

Each service exposes standard health endpoints:

- `GET /health` - Basic health status
- `GET /ready` - Readiness for traffic
- `GET /metrics` - Service metrics (optional)

### Retry Policy

**Exponential backoff configuration:**

- Initial retry delay: 1 second
- Maximum retry attempts: 5
- Backoff multiplier: 2x
- Maximum retry delay: 30 seconds
- Health check timeout: 5 seconds
- Health check interval: 10 seconds

**Example retry sequence:** 1s → 2s → 4s → 8s → 16s

### Failure Isolation

**On service failure:**

1. **Isolate**: Stop accepting new requests to failed service
2. **Restart dependencies first**: Ensure all dependencies are healthy
3. **Progressive restart**: Start with lowest dependency level
4. **Validate health**: Wait for `/ready` endpoint before proceeding
5. **Circuit breaker**: Implement circuit breaker pattern for external calls

**Failure scenarios:**

- **Database failure**: Restart db → auth → catalog → gateway
- **Search failure**: Restart search → catalog → gateway
- **Auth failure**: Restart auth → gateway
- **Catalog failure**: Restart catalog → gateway
- **Gateway failure**: Restart gateway only

### Monitoring Integration

**Health check reports:**

- Location: `./artifacts/integrated-health-check-report.json`
- Format: JSON with component health scores and dependency status
- Frequency: Continuous monitoring with 10-second intervals

**Key metrics:**

- Service startup time
- Dependency resolution time
- Health check response times
- Failure recovery time
- Circuit breaker state transitions

### Startup Commands

```bash
# Phase 1: Start foundation services in parallel
npm run service:db &
npm run service:search &
wait  # Wait for both to be ready

# Phase 2: Start authentication 
npm run service:auth
# Wait for /ready endpoint

# Phase 3: Start catalog
npm run service:catalog  
# Wait for /ready endpoint

# Phase 4: Start gateway
npm run service:gateway
# Wait for /ready endpoint
```

### Validation Scripts

```bash
# Verify startup order
npm run deps:graph
npm run test:services

# Health check validation
npm run health:core
npm run health:full
```
