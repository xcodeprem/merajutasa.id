# Dependency Drift Check - CI Visibility

## Overview

The Dependency Drift Check workflow provides automated CI guardrails to detect:

1. **Dependency Drift**: Mismatches between documented and actual component dependencies
2. **Boot Sequence Issues**: Validation of startup ordering against documented phases  
3. **Service Health**: Monitoring of service mesh and SLA status
4. **Documentation Sync**: Alerts when dependency docs don't match verification results

## Triggers

- **Pull Requests**: Runs on PRs that modify dependency-related files
- **Nightly Schedule**: Runs at 2 AM UTC daily to catch gradual drift
- **Manual Dispatch**: Can be triggered manually with optional health check inclusion

## What It Checks

### 1. Governance Verification

- Runs `npm run governance:verify` to check core integrity
- Validates spec hashes, parameter integrity, and policy compliance

### 2. Dependency Analysis

- Compares `docs/architecture/dependencies.json` against actual component health
- Identifies components documented but not found in health checks
- Flags undocumented components appearing in health monitoring

### 3. Boot Sequence Validation

- Parses `docs/onboarding/startup-dependencies-guide.md` for documented phases
- Validates each phase against actual system state
- Checks phase prerequisites and component availability

### 4. Service Health Checks

- **Service Mesh**: Connectivity and health status
- **SLA Monitoring**: Service level agreement compliance
- **Infrastructure Health**: Component availability and status

## Outputs

### Reports Generated

- `dependency-drift-report.json` - Comprehensive drift analysis
- `boot-sequence-validation.json` - Boot sequence validation results
- `dependency-drift-summary.json` - Quick summary for CI decisions

### PR Comments

For pull requests, the workflow automatically comments with:

- Critical drift issue count
- Documentation sync status
- Boot sequence validation results
- Service health summaries
- Actionable recommendations

## Success Criteria

### Passes When

- No critical dependency drift detected
- Boot sequence validates successfully
- Service mesh health is acceptable
- Documentation sync issues are minor

### Fails When

- Critical dependency drift found (mismatched critical components)
- Governance verification has critical failures
- Boot sequence validation fails

### Warnings When

- Documentation sync issues (non-critical)
- Service health checks timeout (expected in CI)
- Boot sequence has warnings

## Usage

### Local Testing

```bash
# Test complete dependency drift flow
npm run ci:dependency-drift

# Individual components
npm run deps:drift:check
npm run boot:sequence:validate
```

### CI Integration

The workflow runs automatically but can be triggered manually:

```bash
# Via GitHub CLI
gh workflow run dependency-drift-check.yml

# With health checks enabled
gh workflow run dependency-drift-check.yml -f include_health_checks=true
```

## Configuration

### File Paths Monitored

- `docs/architecture/dependencies.json`
- `docs/onboarding/startup-dependencies-guide.md`
- `docs/runbooks/boot-sequence-*.md`
- `infrastructure/**`
- `config/component-registry.json`

### Timeout Settings

- Overall workflow: 15 minutes
- Health checks: 30 seconds (expected to timeout in CI)

## Troubleshooting

### Common Issues

1. **Components not found in health check**
   - Update component registry with correct service names
   - Ensure health monitoring includes all documented components

2. **Boot sequence warnings**
   - Review startup dependencies guide for accuracy
   - Update health check reporting to better reflect boot phases

3. **Service mesh timeouts**
   - Expected in CI environment without running services
   - Run workflow manually with services running for full validation

### Debug Commands

```bash
# Check current dependency state
npm run deps:matrix

# Validate health monitoring
npm run infra:health:all

# Test governance verification
npm run governance:verify
```

## Related Documentation

- [Startup Dependencies Guide](../onboarding/startup-dependencies-guide.md)
- [Architecture Dependencies](../architecture/dependencies.json)
- [Boot Sequence Runbooks](../runbooks/)
- [Governance Verification](../../tools/governance-verify.js)

## Implementation Files

- **Workflow**: `.github/workflows/dependency-drift-check.yml`
- **Drift Detector**: `tools/dependency-drift-detector.js`
- **Boot Validator**: `tools/boot-sequence-validator.js`
- **NPM Scripts**: Added to `package.json`
