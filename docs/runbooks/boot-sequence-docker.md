# Boot Sequence Runbook: Docker (All-in-one)

## Overview

This runbook provides step-by-step instructions for deploying and managing the MerajutASA.id platform using Docker containerization. It covers both development and production deployments with comprehensive health verification and troubleshooting guidance.

## Prerequisites

Before starting the Docker deployment, ensure you have:

- [ ] Docker Engine >= 20.10 installed and running
- [ ] Docker Compose >= 2.0 installed
- [ ] Repository cloned and dependencies installed (`npm ci`)
- [ ] User has Docker permissions (in docker group on Linux)
- [ ] No conflicting services on required ports
- [ ] Sufficient system resources (minimum 4GB RAM, 2GB disk space)

### Quick Prerequisites Check

```bash
# Check Docker version and status
docker --version          # Should be >= 20.10
docker-compose --version  # Should be >= 2.0
docker info              # Should show running status

# Check system resources
free -h                  # Should show >= 4GB available memory
df -h .                  # Should show >= 2GB available disk

# Check port availability (optional - Docker will handle port conflicts)
netstat -tlnp | grep -E ':(4601|4602|4603|4604|4605|8080|8081|8082|8086|8090|9000|9001|6379|80|443)'

# Verify npm dependencies are installed
npm list --depth=0 | head -5
```

## Boot Sequence

### Option 1: Development Deployment (Recommended for Testing)

This deployment includes all services with development optimizations and debugging enabled.

#### Step 1: Deploy Development Stack

```bash
# Deploy all containerized services
npm run docker:deploy-dev
```

**Expected output:**
```
[INFO] Starting MerajutASA.id deployment
[INFO] Environment: development
[INFO] Version: latest
[INFO] Action: deploy
[INFO] Pre-deployment checks passed
[INFO] Deploying services...
[docker-compose] Creating network "merajutasa-network" with driver "bridge"
[docker-compose] Building signer
[docker-compose] Building chain
[docker-compose] Building collector
[docker-compose] Building monitoring
[docker-compose] Building backup
[docker-compose] Creating merajutasa-redis-dev
[docker-compose] Creating merajutasa-signer-dev
[docker-compose] Creating merajutasa-chain-dev
[docker-compose] Creating merajutasa-collector-dev
[docker-compose] Creating merajutasa-monitoring-dev
[docker-compose] Creating merajutasa-backup-dev
[docker-compose] Creating merajutasa-observability-dev
[docker-compose] Creating merajutasa-api-gateway-dev
[docker-compose] Creating merajutasa-compliance-dev
[docker-compose] Creating merajutasa-nginx-dev
[SUCCESS] Deployment completed successfully!
```

**Wait time:** Initial deployment can take 3-5 minutes for image building and container startup.

#### Step 2: Verify Container Status

```bash
# Check container status
npm run docker:status
```

**Expected output:**
```
[INFO] Service status:
NAME                               IMAGE                        COMMAND             SERVICE        CREATED         STATUS                    PORTS
merajutasa-signer-dev             merajutasa-signer:latest     "node services/..."  signer        2 minutes ago   Up 2 minutes (healthy)   0.0.0.0:4601->4601/tcp
merajutasa-chain-dev              merajutasa-chain:latest      "node services/..."  chain         2 minutes ago   Up 2 minutes (healthy)   0.0.0.0:4602->4602/tcp
merajutasa-collector-dev          merajutasa-collector:latest  "node services/..."  collector     2 minutes ago   Up 2 minutes (healthy)   0.0.0.0:4603->4603/tcp
merajutasa-monitoring-dev         merajutasa-monitoring:latest "node infrastructure..." monitoring  2 minutes ago   Up 2 minutes (healthy)   0.0.0.0:4604->4604/tcp
merajutasa-backup-dev             merajutasa-backup:latest     "node infrastructure..." backup    2 minutes ago   Up 2 minutes (healthy)
```

#### Step 3: Run Comprehensive Health Check

```bash
# Execute detailed health verification
npm run docker:health-check
```

**Expected output:**
```
[INFO] Starting comprehensive health check for MerajutASA.id
[INFO] Environment: development
[SUCCESS] Container merajutasa-signer-development is healthy
[SUCCESS] HTTP health check passed for merajutasa-signer-development (200)
[SUCCESS] Signer public key endpoint accessible
[SUCCESS] Container merajutasa-chain-development is healthy
[SUCCESS] HTTP health check passed for merajutasa-chain-development (200)
[SUCCESS] Chain data directory accessible
[SUCCESS] Container merajutasa-collector-development is healthy
[SUCCESS] HTTP health check passed for merajutasa-collector-development (200)
[SUCCESS] Collector ingestion endpoint responding
[SUCCESS] Container merajutasa-monitoring-development is healthy
[SUCCESS] HTTP health check passed for merajutasa-monitoring-development (200)
[SUCCESS] Container merajutasa-backup-development is healthy
[SUCCESS] Network connectivity tests passed
[SUCCESS] CPU usage within normal limits
[SUCCESS] Memory usage within normal limits

[INFO] === Health Check Summary ===
Overall Status: healthy
Signer: healthy
Chain: healthy
Collector: healthy
Monitoring: healthy
Backup: healthy
Network: healthy
```

### Option 2: Production Deployment

For production environments with optimized configurations and security hardening.

#### Step 1: Deploy Production Stack

```bash
# Deploy production-ready services
npm run docker:deploy-prod
```

**Expected output:**
```
[INFO] Starting MerajutASA.id deployment
[INFO] Environment: production
[INFO] Version: latest
[INFO] Action: deploy
[INFO] Pre-deployment checks passed
[INFO] Deploying services...
[SUCCESS] Deployment completed successfully!
```

#### Step 2: Verify Production Health

```bash
# Check production container status
ENVIRONMENT=production npm run docker:status

# Run production health check
ENVIRONMENT=production npm run docker:health-check
```

## Container Dependency Graph

The services start in the following dependency order:

```
1. Redis Cache (foundational)
   └── 2. Core Services (parallel)
       ├── Signer Service (4601)
       ├── Chain Service (4602) 
       └── Collector Service (4603)
           └── 3. Infrastructure Services (depend on core)
               ├── Monitoring (4604)
               ├── Backup (4605)
               ├── Observability (8080-8082)
               ├── API Gateway (8086)
               ├── HA Orchestrator (8090)
               └── Compliance (9000-9001)
                   └── 4. Reverse Proxy (80, 443)
```

## Health Verification Checklist

Use this checklist to verify successful deployment:

### Core Services Health
- [ ] **Signer Service** (Port 4601)
  - [ ] Container status: `healthy`
  - [ ] HTTP endpoint: `GET /health` returns 200
  - [ ] Public key endpoint: `GET /pubkey` accessible
  - [ ] Log shows: `[signer] listening on 0.0.0.0:4601`

- [ ] **Chain Service** (Port 4602)
  - [ ] Container status: `healthy`
  - [ ] HTTP endpoint: `GET /health` returns 200
  - [ ] Chain head endpoint: `GET /head` accessible
  - [ ] Data directory accessible in container
  - [ ] Log shows: `[chain] listening on 0.0.0.0:4602`

- [ ] **Collector Service** (Port 4603)
  - [ ] Container status: `healthy`
  - [ ] HTTP endpoint: `GET /health` returns 200
  - [ ] Ingestion endpoint: `POST /ingest` accepting events
  - [ ] Log shows: `[collector] listening on 0.0.0.0:4603`

### Infrastructure Services Health
- [ ] **Monitoring Service** (Port 4604)
  - [ ] Container status: `healthy`
  - [ ] Metrics endpoint: `GET /metrics` returns Prometheus format
  - [ ] Service health metrics being collected

- [ ] **Backup Service**
  - [ ] Container status: `healthy`
  - [ ] Backup directory mounted and writable
  - [ ] Can access chain data for backup operations

- [ ] **Redis Cache** (Port 6379)
  - [ ] Container status: `healthy`
  - [ ] Redis PING command responds with PONG
  - [ ] Appendonly file being written

### Network & Integration Health
- [ ] **Internal Networking**
  - [ ] All containers on `merajutasa-network`
  - [ ] Services can communicate via container names
  - [ ] No port conflicts

- [ ] **External Access**
  - [ ] Core service ports accessible from host
  - [ ] Reverse proxy routing correctly (if enabled)
  - [ ] HTTPS certificates valid (production)

## Service Management Commands

### Basic Operations
```bash
# Deploy development stack
npm run docker:deploy-dev

# Deploy production stack
npm run docker:deploy-prod

# Check container status
npm run docker:status

# View container logs
npm run docker:logs

# Health check all services
npm run docker:health-check

# Restart all services
npm run docker:restart

# Stop all services
npm run docker:stop
```

### Advanced Operations
```bash
# Build all container images
npm run docker:build-all

# Deploy specific environment
ENVIRONMENT=test npm run docker:deploy-test

# Check specific environment status
ENVIRONMENT=production npm run docker:status

# View logs for specific service
docker logs merajutasa-signer-dev --tail 50

# Execute command in container
docker exec -it merajutasa-signer-dev /bin/sh

# Inspect container configuration
docker inspect merajutasa-chain-dev
```

## Success Criteria

The Docker boot sequence is successful when:

- [ ] All core containers (signer, chain, collector) are in `healthy` status
- [ ] HTTP health checks return 200 for all services
- [ ] `npm run docker:health-check` completes with "Overall Status: healthy"
- [ ] No error messages in container logs (`npm run docker:logs`)
- [ ] Container resource usage within normal limits
- [ ] Network connectivity between containers established
- [ ] Persistent volumes mounted and accessible
- [ ] External service ports accessible from host system

## Troubleshooting

### Common Issues and Solutions

#### Container Health Check Failures

**Issue:** Container shows `unhealthy` status
```bash
# Check container logs for errors
docker logs <container-name> --tail 50

# Check container resource usage
docker stats <container-name>

# Restart unhealthy container
docker restart <container-name>
```

#### Port Conflicts

**Issue:** `Error: bind: address already in use`
```bash
# Find process using the port
netstat -tlnp | grep :<port>
# or
lsof -i :<port>

# Kill the conflicting process
kill <pid>

# Or use different ports via environment variables
SIGNER_PORT=4701 npm run docker:deploy-dev
```

#### Image Build Failures

**Issue:** Docker build fails during deployment
```bash
# Rebuild all images manually
npm run docker:build-all

# Clean Docker cache and rebuild
docker system prune -a --volumes
npm run docker:build-all
```

#### Service Communication Issues

**Issue:** Services cannot communicate with each other
```bash
# Check network configuration
docker network ls
docker network inspect merajutasa-network

# Test connectivity between containers
docker exec -it merajutasa-signer-dev ping merajutasa-chain-dev
```

#### Resource Exhaustion

**Issue:** Containers failing to start due to insufficient resources
```bash
# Check system resources
docker system df
free -h
df -h

# Clean unused Docker resources
docker system prune -a --volumes

# Reduce service count by commenting services in docker-compose.yml
```

### Emergency Procedures

#### Complete Stack Reset
```bash
# Stop and remove all containers
npm run docker:stop
docker-compose -f infrastructure/docker/compose/docker-compose.yml down -v

# Remove all images and rebuild
docker image prune -a
npm run docker:build-all
npm run docker:deploy-dev
```

#### Service-Specific Recovery
```bash
# Restart individual service
docker restart merajutasa-<service>-dev

# Rebuild and redeploy single service
docker-compose -f infrastructure/docker/compose/docker-compose.yml up -d --build <service>
```

## Performance Monitoring

### Resource Usage Monitoring
```bash
# Real-time container statistics
docker stats

# Container resource limits
docker inspect <container> | grep -A 20 "HostConfig"

# Check container health over time
watch docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Log Monitoring
```bash
# Follow logs for all services
npm run docker:logs

# Follow logs for specific service
docker logs -f merajutasa-signer-dev

# Search logs for errors
docker logs merajutasa-chain-dev 2>&1 | grep -i error
```

## Security Considerations

- All containers run with non-root user (UID 1001)
- Sensitive environment variables should be set via `.env` files
- Production deployments use secure random secrets
- Network isolation via Docker bridge network
- Volume mounts use read-only when possible
- Regular security updates via base image updates

## Maintenance

### Regular Maintenance Tasks
```bash
# Update container images
docker-compose pull
npm run docker:restart

# Clean up unused resources weekly
docker system prune

# Backup persistent volumes
docker run --rm -v merajutasa_chain_data:/data -v $(pwd):/backup alpine tar czf /backup/chain-data-backup.tar.gz /data
```

### Log Rotation
```bash
# Configure Docker log rotation in daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
```

## Next Steps

After successful Docker deployment:

1. **Validate Governance**: Run `npm run governance:verify` to ensure container environment meets governance requirements
2. **Load Testing**: Use the containerized services for load testing and performance validation
3. **Integration Testing**: Run full test suite against the containerized environment
4. **Production Readiness**: Review security configurations and performance tuning for production deployment

---

*Last updated: This runbook covers Docker containerization boot sequence for all deployment environments. For local development without containers, see `boot-sequence-local.md`.*