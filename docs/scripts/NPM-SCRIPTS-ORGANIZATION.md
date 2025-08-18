# NPM Scripts Organization Guide

## Overview

The package.json scripts have been reorganized from 202 scripts into 200 well-organized scripts across 23 logical groups. 8 obsolete PowerShell scripts were removed and 6 new Week 6 integration scripts were added.

## Script Categories

### 1. Core Development & Validation
Essential development workflow scripts:
- `lint` - Run all linting (markdown + DEC files)
- `test` - Run all tests (governance + services + infrastructure)
- `format` - Code formatting (placeholder - uses markdownlint for markdown)
- `governance:check` - Comprehensive governance verification
- `governance:verify` - Core governance verification pipeline

### 2. Spec Hash & Integrity  
Hash-based integrity verification:
- `spec-hash:verify` - Verify specification hash integrity
- `spec-hash:seal` - Seal specification hashes
- `param:integrity` - Parameter integrity verification
- `evidence:validate` - Evidence validation

### 3. Core Services
Main service components:
- `service:signer` - Ed25519 signing service (port 4601)
- `service:chain` - Hash chain service (port 4602) 
- `service:collector` - Event collector service (port 4603)
- `service:revocation` - Revocation service
- `service:equity` - Equity calculation service

### 4. Privacy & PII Tools
Privacy and PII handling:
- `privacy:scan` - PII scanning with SARIF output
- `privacy:metrics` - Privacy metrics generation
- `privacy:asserts` - Privacy assertions validation
- `privacy:rights` - Privacy rights management
- `privacy:validate` - **NEW** - Complete privacy validation pipeline

### 5. Fairness & Equity
Fairness calculation and equity tracking:
- `fairness:generate-snapshots` - Generate equity snapshots
- `fairness:hysteresis-run` - Run hysteresis engine
- `fairness:sim` - Fairness simulation
- `equity:snapshot` - Create equity snapshots

### 6. Infrastructure Management
Core infrastructure operations:
- `infra:nginx` - Start nginx reverse proxy
- `infra:generate-certs` - Generate SSL certificates
- `infra:metrics` - Start metrics collector (port 9090)
- `infra:backup:create` - Create system backup
- `infra:start-all` - Start all infrastructure services

### 7. Docker & Container Management
Docker containerization:
- `docker:build-all` - Build all Docker images
- `docker:deploy-dev/prod/test` - Deploy to environments
- `docker:status` - Check container status
- `docker:health-check` - Container health verification

### 8. Kubernetes Operations
Kubernetes orchestration:
- `k8s:deploy` - Deploy to Kubernetes
- `k8s:status` - Check pod/service status
- `k8s:logs` - View application logs

### 9. Performance & Monitoring
Performance optimization:
- `performance:start` - Start performance monitoring stack
- `performance:benchmark` - Run performance benchmarks
- `cache:redis-start` - Start Redis cache manager
- `sla:monitor-start` - Start SLA monitoring

### 10. Observability & Metrics
Advanced observability:
- `observability:start` - Start observability system
- `tracing:start` - Start distributed tracing
- `metrics:start` - Start metrics collection
- `dashboards:start` - Start monitoring dashboards

### 11. High Availability
Multi-region and fault tolerance:
- `ha:orchestrator-start` - Start HA orchestrator
- `ha:multi-region-deploy` - Deploy across regions
- `ha:system-health` - System health check
- `ha:start-all` - Start all HA components

### 12. Compliance & Security
**Enhanced with Week 6 components:**
- `compliance:orchestrator` - Start compliance orchestrator
- `compliance:audit` - Enterprise audit system
- `security:hardening` - Security hardening system
- `security:monitor` - **NEW** - Security monitoring pipeline
- `compliance:start-all` - **NEW** - Start all compliance services

### 13. Week Status & Demos
Phase 2 week tracking:
- `week6:status` - Week 6 component status
- `week6:validate` - **NEW** - Complete Week 6 validation
- `week6:health-check` - **NEW** - Week 6 health check demo
- `week6:integration-test` - **NEW** - Integration testing

## Removed Obsolete Scripts

The following 8 scripts were removed for Linux compatibility:

1. `phase:H1` - PowerShell-specific phase tracking
2. `test:signer-e2e` - PowerShell-based E2E testing
3. `test:chain-verify-negative` - PowerShell chain testing
4. `chain:append` - PowerShell chain operations
5. `chain:verify:negative` - PowerShell verification
6. `collector:smoke` - PowerShell API calls
7. `ci:governance-with-collector` - PowerShell CI integration
8. `signer:rotate` - PowerShell signer rotation

## New Week 6 Integration Scripts

Added 6 new scripts for Week 6 compliance and security integration:

1. **`week6:validate`** - `npm run test:week6 && npm run compliance:orchestrator`
   - Complete Week 6 validation pipeline

2. **`week6:health-check`** - Week 6 component health demonstration
   - Runs comprehensive Week 6 demo

3. **`week6:integration-test`** - `npm run compliance:audit && npm run security:scan && npm run privacy:rights`
   - Integration testing across compliance components

4. **`compliance:start-all`** - `concurrently "npm run compliance:orchestrator" "npm run security:hardening" "npm run audit:start"`
   - Start all compliance services simultaneously

5. **`security:monitor`** - `npm run security:hardening && npm run security:threats`
   - Security monitoring pipeline

6. **`privacy:validate`** - `npm run privacy:rights && npm run privacy:request && npm run privacy:report`
   - Complete privacy validation workflow

## Quick Start Commands

### Development Workflow
```bash
npm run lint                    # Lint all files
npm run test                    # Run all tests
npm run governance:verify       # Verify governance integrity
```

### Infrastructure Operations
```bash
npm run infra:start-all         # Start core infrastructure
npm run week6:validate          # Validate Week 6 components
npm run compliance:start-all    # Start compliance services
```

### Status Checks
```bash
npm run phase1:status           # Phase 1 status
npm run week6:status            # Week 6 component status  
npm run week6:health-check      # Week 6 health demo
```

### Testing
```bash
npm run test:governance         # Governance tests
npm run test:infrastructure     # Infrastructure tests
npm run week6:integration-test  # Week 6 integration tests
```

## Dependencies

Added dependencies:
- `concurrently` - For running multiple scripts simultaneously

## Script Organization Benefits

1. **Reduced Count**: 202 → 200 scripts (removed obsolete, added essential)
2. **Better Grouping**: 23 logical categories instead of mixed organization
3. **Linux Compatibility**: Removed all PowerShell dependencies
4. **Week 6 Integration**: Complete integration testing for newest components
5. **Improved Discoverability**: Clear naming conventions and grouping
6. **Enhanced Testing**: Comprehensive validation pipelines

## Next Steps

1. Consider adding script group comments directly in package.json
2. Update CI/CD pipelines to use new script names
3. Document environment-specific requirements for Docker/K8s scripts
4. Add script aliases for common development workflows