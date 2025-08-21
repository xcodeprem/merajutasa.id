# Environment Configuration Guide

This document explains the comprehensive environment configuration system for MerajutASA.id, including setup for all Phase 2 components.

## Configuration Files Overview

### Template Files

- `.env.example` - Master template with all available environment variables
- `.env.development` - Development-specific overrides
- `.env.production` - Production-specific overrides

### Infrastructure Configurations

- `infrastructure/docker/compose/docker-compose.yml` - Docker development environment
- `infrastructure/kubernetes/configmaps/configmaps.yaml` - Kubernetes configuration maps

## Quick Start

### Local Development Setup

1. **Create your local environment file:**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your specific values
   ```

2. **For development, also load development overrides:**

   ```bash
   # Your application should load in this order:
   # 1. .env.example (defaults)
   # 2. .env.development (dev overrides)  
   # 3. .env.local (your personal overrides)
   ```

3. **Start core services:**

   ```bash
   npm run service:signer    # Port 4601
   npm run service:chain     # Port 4602  
   npm run service:collector # Port 4603
   ```

### Docker Development

1. **Set environment variables (optional):**

   ```bash
   export SIGNER_PORT=4601
   export CHAIN_PORT=4602
   export COLLECTOR_PORT=4603
   # Or use defaults defined in docker-compose.yml
   ```

2. **Start with Docker Compose:**

   ```bash
   cd infrastructure/docker/compose
   docker-compose up -d
   ```

## Core Services Configuration

### Service Ports

| Service | Default Port | Environment Variable | Health Check |
|---------|-------------|---------------------|--------------|
| Signer | 4601 | `SIGNER_PORT` | GET /pubkey |
| Chain | 4602 | `CHAIN_PORT` | GET /health |
| Collector | 4603 | `COLLECTOR_PORT` | GET /health |

### High Availability Components (Week 5)

| Component | Default Port | Environment Variable | Health Check |
|-----------|-------------|---------------------|--------------|
| HA Orchestrator | 8090 | `HA_ORCHESTRATOR_PORT` | GET /health |
| Multi-Region | 8095 | `MULTI_REGION_PORT` | GET /health |
| Disaster Recovery | 8096 | `DR_PORT` | GET /health |
| Auto-Scaling | 8097 | `AUTO_SCALING_PORT` | GET /health |

### Observability Stack (Week 3)

| Component | Default Port | Environment Variable | Health Check |
|-----------|-------------|---------------------|--------------|
| Observability System | 8080 | `OBSERVABILITY_PORT` | GET /health |
| Metrics | 8081 | `METRICS_PORT` | GET /metrics |
| Tracing | 8082 | `TRACING_PORT` | GET /health |
| Logs | 8083 | `LOGS_PORT` | GET /health |
| Dashboards | 8085 | `DASHBOARDS_PORT` | GET /health |

### Compliance & Security (Week 6)

| Component | Default Port | Environment Variable | Health Check |
|-----------|-------------|---------------------|--------------|
| Compliance Orchestrator | 9000 | `COMPLIANCE_ORCHESTRATOR_PORT` | GET /health |
| Audit System | 9001 | `AUDIT_SYSTEM_PORT` | GET /health |
| Privacy Rights | 9003 | `PRIVACY_RIGHTS_PORT` | GET /health |
| Security Hardening | 9004 | `SECURITY_HARDENING_PORT` | GET /health |

## Environment-Specific Configuration

### Development Environment

- Debug logging enabled
- Relaxed rate limits
- Local Redis and SMTP
- Faster health check intervals
- Minimal resource scaling

### Production Environment  

- Warn-level logging only
- Strict security settings
- External Redis cluster
- Production SMTP
- Full HA and auto-scaling enabled

## Configuration Validation

### Governance Pipeline

Test that all configurations work with the governance system:

```bash
npm run governance:verify
```

### Service Health Checks

Verify all services can start and respond:

```bash
# Core services
npm run service:signer &
npm run service:chain &
npm run service:collector &

# Test endpoints
curl http://localhost:4601/pubkey
curl http://localhost:4602/health  
curl http://localhost:4603/health
```

### Phase Status Checks

Check overall system health:

```bash
npm run phase1:status
npm run week6:status
npm run sla:status
```

## Docker Configuration

The Docker compose file now includes:

- Environment variable substitution from host
- All Phase 2 Week 6 components
- Proper service dependencies
- Health checks for all services
- Volume management for data persistence

### Starting Enterprise Stack

```bash
cd infrastructure/docker/compose
docker-compose up -d

# Check status
npm run docker:status
```

## Kubernetes Configuration

ConfigMaps have been updated with:

- All new component configuration
- Environment-specific settings
- Service discovery endpoints
- Monitoring and alerting configuration

### Deploying to Kubernetes

```bash
# Apply configurations
npm run k8s:deploy

# Check status
npm run k8s:status
npm run k8s:logs
```

## Troubleshooting

### Port Conflicts

If you get port binding errors:

```bash
# Check what's using the port
lsof -i :4601

# Override ports via environment
export SIGNER_PORT=14601
export CHAIN_PORT=14602
export COLLECTOR_PORT=14603
```

### Service Startup Issues

1. Check environment variables are set correctly
2. Verify no conflicting processes on ports
3. Check service logs for specific errors
4. Ensure dependencies (Redis, etc.) are running

### Configuration Validation Failures

1. Run governance verification: `npm run governance:verify`
2. Check parameter integrity: `npm run param:integrity`
3. Validate service contracts: `npm run test:services`

## Security Considerations

### Secret Management

- Never commit actual secrets to `.env.local` files
- Use external secret management for production
- Rotate credentials regularly
- Use least-privilege access principles

### Network Security

- Configure proper firewall rules for service ports
- Use TLS/SSL for inter-service communication in production
- Implement proper authentication for management interfaces

## Next Steps

After configuration:

1. Test all core services: `npm run test:services`
2. Validate governance: `npm run governance:verify`
3. Run infrastructure tests: `npm run test:infrastructure`
4. Check Week 6 components: `npm run test:week6`

For detailed implementation status, see:

- [Phase 2 Implementation Guide](../phase-2/phase-2-implementation-guide.md)
- [Implementation Status](../implementation/README.md)
