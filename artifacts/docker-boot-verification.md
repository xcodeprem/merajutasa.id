# Docker Boot Sequence Verification Log

## Test Environment
- Date: Fri Aug 22 00:05:13 UTC 2025
- Docker Version: Docker version 28.0.4, build b8034c0
- Compose Version: 

## Script Validation

### Deploy Stack Script Test
    [0;34m[INFO][0m Starting MerajutASA.id deployment
    [0;34m[INFO][0m Environment: development
    [0;34m[INFO][0m Version: latest
    [0;34m[INFO][0m Action: status
    [0;34m[INFO][0m Service status:
    NAME      IMAGE     COMMAND   SERVICE   CREATED   STATUS    PORTS
    [0;34m[INFO][0m Cleaning up temporary files...

### Health Check Script Test
(Without containers running - expected to show errors)

    [0;34m[INFO][0m Starting comprehensive health check for MerajutASA.id
    [0;34m[INFO][0m Environment: development
    [0;34m[INFO][0m Timestamp: 2025-08-22T00:05:14Z
    [0;34m[INFO][0m === Signer Service Health Check ===
    [0;34m[INFO][0m Checking container: merajutasa-signer-development
    [0;31m[ERROR][0m Container merajutasa-signer-development is not running
    [0;34m[INFO][0m === Chain Service Health Check ===
    [0;34m[INFO][0m Checking container: merajutasa-chain-development
    [0;31m[ERROR][0m Container merajutasa-chain-development is not running
    [0;34m[INFO][0m === Collector Service Health Check ===

### Available Docker Scripts

npm scripts related to Docker:
        "docker:build-all": "./infrastructure/docker/scripts/build-all.sh",
        "docker:deploy-dev": "ENVIRONMENT=development ./infrastructure/docker/scripts/deploy-stack.sh deploy",
        "docker:deploy-prod": "ENVIRONMENT=production ./infrastructure/docker/scripts/deploy-stack.sh deploy",
        "docker:deploy-test": "ENVIRONMENT=test ./infrastructure/docker/scripts/deploy-stack.sh deploy",
        "docker:stop": "./infrastructure/docker/scripts/deploy-stack.sh stop",
        "docker:restart": "./infrastructure/docker/scripts/deploy-stack.sh restart",
        "docker:status": "./infrastructure/docker/scripts/deploy-stack.sh status",
        "docker:logs": "./infrastructure/docker/scripts/deploy-stack.sh logs",
        "docker:health-check": "./infrastructure/docker/scripts/health-check.sh",

### Docker Compose Files Available

    total 36
    drwxr-xr-x 2 runner docker 4096 Aug 21 23:59 .
    drwxr-xr-x 6 runner docker 4096 Aug 21 23:59 ..
    -rw-r--r-- 1 runner docker 7063 Aug 21 23:59 docker-compose.prod.yml
    -rw-r--r-- 1 runner docker 5297 Aug 21 23:59 docker-compose.test.yml
    -rw-r--r-- 1 runner docker 9190 Aug 21 23:59 docker-compose.yml

### Governance Verification Test

Governance verification test passed successfully, confirming core system integrity.

Exit code: 0 (Success)

This validates that the dependency graph is consistent and all governed
components are properly integrated.
