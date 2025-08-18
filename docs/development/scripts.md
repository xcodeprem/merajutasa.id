# NPM Scripts Organization Guide

This document provides a comprehensive overview of the 203+ NPM scripts organized into logical categories for the MerajutASA.id governance system.

## Overview

The package.json contains 203 scripts organized into 23 logical categories, with comprehensive validation and management tools for maintaining script quality and cross-platform compatibility.

## Script Categories

### 1. Core Development & Validation

Essential workflow scripts for development and validation processes.

**Scripts:** `lint`, `test`, `format`, `validate`, `check`, `verify`

Key scripts:

- `lint` - Run all linting checks
- `test` - Run all test suites  
- `test:governance` - Run governance-specific tests
- `test:services` - Run service integration tests
- `test:infrastructure` - Run infrastructure tests

### 2. Spec Hash & Integrity

Hash-based verification and integrity management.

**Scripts:** `spec-hash:*`, `param:*`, `evidence:*`

Key scripts:

- `spec-hash:verify` - Verify spec hash integrity
- `spec-hash:seal` - Seal spec hashes
- `param:integrity` - Check parameter integrity
- `evidence:validate` - Validate evidence bundles

### 3. Core Services

Main service components for the governance system.

**Scripts:** `service:*`

Key scripts:

- `service:signer` - Start signature service
- `service:chain` - Start blockchain service
- `service:collector` - Start event collector
- `service:revocation` - Start revocation service

### 4. Privacy & PII Tools

Privacy handling and PII management tools.

**Scripts:** `privacy:*`, `pii:*`

Key scripts:

- `privacy:scan` - Scan for PII leaks
- `privacy:metrics` - Generate privacy metrics
- `privacy:rights` - Manage privacy rights
- `privacy:request:simulate` - Simulate privacy requests

### 5. Fairness & Equity

Equity calculations and fairness monitoring.

**Scripts:** `fairness:*`, `equity:*`

Key scripts:

- `fairness:generate-snapshots` - Generate equity snapshots
- `fairness:sim` - Run fairness simulation
- `fairness:engine` - Start fairness engine

### 6. Compliance & Security

Enhanced with Week 6 components for compliance and security.

**Scripts:** `compliance:*`, `security:*`, `audit:*`

Key scripts:

- `security:scan` - Run comprehensive security scan
- `compliance:assess` - Generate compliance assessment
- `compliance:orchestrator:test` - Test compliance orchestrator
- `audit:start` - Start audit service

### 7. Week Status & Demos

Phase tracking and demonstration scripts.

**Scripts:** `phase:*`, `week*`, `demo:*`, `status:*`

Key scripts:

- `phase2:week6:verify` - Complete Week 6 validation pipeline
- `week6:validate` - Week 6 integration validation
- `week6:health-check` - Week 6 component health check

### 8. Governance & Policy

Governance framework and policy management.

**Scripts:** `governance:*`, `policy:*`, `dec:*`

Key scripts:

- `governance:verify` - Run governance verification
- `policy:aggregation:enforce` - Enforce policy aggregation
- `dec:new` - Create new governance decision

### 9. Infrastructure Management

Core infrastructure and deployment management.

**Scripts:** `infra:*`, `infrastructure:*`

### 10. Docker & Container Management

Containerization and Docker operations.

**Scripts:** `docker:*`, `container:*`

### 11. Kubernetes Operations

K8s orchestration and management.

**Scripts:** `k8s:*`, `kubernetes:*`, `kube:*`

### 12. Performance & Monitoring

Performance optimization and monitoring.

**Scripts:** `perf:*`, `performance:*`, `benchmark:*`

### 13. Observability & Metrics

Advanced observability and metrics collection.

**Scripts:** `observability:*`, `metrics:*`, `monitoring:*`

### 14. High Availability

Multi-region operations and high availability.

**Scripts:** `ha:*`, `cluster:*`, `replica:*`

### 15. API & Services Testing

API testing and service validation.

**Scripts:** `api:*`, `smoke:*`, `endpoint:*`

### 16. Data & Analytics

Data processing and analytics.

**Scripts:** `data:*`, `analytics:*`, `reporting:*`

### 17. UI & Frontend

Frontend and accessibility testing.

**Scripts:** `ui:*`, `frontend:*`, `a11y:*`

### 18. Chain & Blockchain

Blockchain operations and chain management.

**Scripts:** `chain:*`, `signer:*`, `collector:*`

### 19. Event Processing

Event pipeline and processing.

**Scripts:** `event:*`, `pipeline:*`

### 20. Documentation & Help

Documentation generation and help systems.

**Scripts:** `docs:*`, `help:*`, `readme:*`

### 21. Deployment & CI/CD

Deployment and continuous integration.

**Scripts:** `deploy:*`, `ci:*`, `cd:*`, `publish:*`

### 22. Database & Storage

Database operations and storage management.

**Scripts:** `db:*`, `database:*`, `storage:*`

### 23. Scripts Management

Script validation and management tools.

**Scripts:** `scripts:*`

Key scripts:

- `scripts:validate` - Validate scripts for safety and compatibility
- `scripts:analyze` - Analyze scripts inventory
- `scripts:organize` - Organize scripts structure

## Risk Classification

Scripts are classified by risk level:

### Safe (26 scripts, 13% coverage)

Read-only operations that can be safely executed:

- Linting and validation scripts
- Test scripts (non-destructive)
- Status and information scripts
- Schema validation

### Grey (Potentially Risky)

Operations requiring environment/network access:

- Build and compilation scripts
- Service startup scripts
- Development servers
- Backup operations

### Black (Destructive)

Dangerous operations requiring careful execution:

- Deployment scripts
- Database operations
- System modifications
- Cleanup operations

## Cross-Platform Compatibility

### Issues Identified

- 8 PowerShell-dependent scripts removed for Linux compatibility
- Shell chaining operators (`&&`, `||`) standardized
- Environment variable syntax unified
- Path separator handling improved

### Solutions Implemented

- Added `concurrently` for multi-service scripts
- Use `cross-env` for environment variables
- Standardized on Node.js scripts for portability

## Week 6 Integration Scripts

### Core Pipeline: `phase2:week6:verify`

Complete validation pipeline including:

1. Week 6 component validation
2. Compliance assessment
3. Security scanning
4. Privacy request simulation

### Individual Components

#### Security Scanning

- `security:scan` - Non-interactive security hardening scan
- Exit code 0 for scores ≥70, exit code 1 for lower scores

#### Compliance Assessment  

- `compliance:assess` - Multi-framework compliance assessment (GDPR, SOC2, ISO27001)
- Generates evidence artifacts and recommendations

#### Privacy Rights Testing

- `privacy:request:simulate` - Offline simulation of privacy requests
- Tests all GDPR rights (access, deletion, portability, etc.)

#### Orchestrator Testing

- `compliance:orchestrator:test` - Headless compliance orchestrator cycle

## Script Management Tools

### Validation Pipeline

```bash
# Analyze all scripts
npm run scripts:analyze

# Validate safe scripts only
npm run scripts:validate

# Organize script structure  
npm run scripts:organize
```

### Validation Results

- **Total Scripts**: 203
- **Safe Scripts**: 26 (13% coverage)
- **Success Rate Target**: ≥95%
- **Timeout Protection**: 120 seconds default

## Best Practices

### Script Naming Conventions

- Use descriptive prefixes (`test:`, `lint:`, `security:`)
- Separate words with colons or hyphens
- Avoid spaces and special characters

### Safety Guidelines

- Prefer read-only operations for frequent use
- Add timeouts for long-running scripts
- Use environment isolation for testing
- Document destructive operations clearly

### Cross-Platform Requirements

- Use Node.js scripts instead of shell scripts when possible
- Avoid platform-specific commands
- Use `concurrently` for parallel execution
- Test on multiple platforms before committing

## Governance Integration

### Quality Gates

Scripts must pass:

1. **Safety Classification** - No prohibited patterns
2. **Cross-Platform Check** - Linux/Windows compatibility  
3. **Dependency Validation** - Required tools available
4. **Timeout Compliance** - Reasonable execution time
5. **Exit Code Standards** - Proper success/failure reporting

### Continuous Validation

- CI pipeline runs `scripts:validate` on PRs
- Automated safety classification
- Cross-platform compatibility checks
- Performance monitoring

## Troubleshooting

### Common Issues

1. **Script Hangs** - Check for interactive prompts, add timeouts
2. **Platform Errors** - Use Node.js instead of shell commands
3. **Permission Denied** - Avoid privileged operations
4. **Module Not Found** - Check import paths and dependencies

### Recovery Actions

1. Use `scripts:validate --dry-run` to test safely
2. Check `artifacts/scripts/validation.json` for detailed results
3. Review cross-platform issues in inventory report
4. Update script classification if needed

## Artifact Generation

The script management system generates comprehensive artifacts:

- `artifacts/scripts/inventory.json` - Complete script analysis
- `artifacts/scripts/validation.json` - Validation results  
- `artifacts/scripts/validation-summary.json` - Executive summary
- `artifacts/compliance/` - Compliance assessment results
- `artifacts/privacy-requests/` - Privacy simulation data
- `artifacts/security/` - Security scan reports

---

This organization ensures maintainable, portable, and safe script execution across the MerajutASA.id governance system while providing comprehensive validation and monitoring capabilities.
