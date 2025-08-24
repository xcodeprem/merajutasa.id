# CI/CD Testing Workflow Documentation

## Overview

This repository implements a comprehensive CI/CD testing workflow that enforces quality gates through automated testing, coverage thresholds, security scanning, and performance monitoring.

## Workflow Components

### 1. Comprehensive Testing Workflow (`ci-comprehensive-tests.yml`)

This is the main CI workflow that runs on all pull requests and pushes to main. It includes:

#### **Unit & Integration Tests**
- Runs governance, services, and infrastructure test suites
- Executes UI unit tests with coverage reporting
- Generates comprehensive coverage summaries
- Enforces minimum coverage thresholds (≥80% for lines, functions, statements)

#### **End-to-End Tests**
- Builds optimized UI assets
- Runs Playwright E2E tests
- Executes accessibility testing
- Validates user workflows

#### **Security Scanning**
- npm audit for dependency vulnerabilities (fails on critical/high)
- Secret scanning with Gitleaks
- Generates SBOM (Software Bill of Materials)
- CodeQL static analysis (separate workflow)

#### **Performance Testing**
- Bundle size validation (5MB limit)
- Performance budget enforcement
- Load testing capabilities

#### **Observability Checks**
- Logging, tracing, and monitoring validation
- Health check verification

## Coverage Requirements

### Current Thresholds
- **Lines**: ≥80%
- **Functions**: ≥80% 
- **Statements**: ≥80%
- **Branches**: ≥70% (more lenient initially)

### Progressive Plan
- **Phase 1**: 80% minimum (current)
- **Phase 2**: 85% target
- **Phase 3**: 90%+ goal

## Required Status Checks

The following status checks are reported for branch protection:

- `ci/unit-tests` - Unit and integration test results
- `ci/e2e-tests` - End-to-end test results  
- `ci/security` - Security scanning results
- `ci/performance` - Performance test results
- `ci/observability` - Observability check results
- `security/codeql` - CodeQL static analysis

## Branch Protection Configuration

Configure the following required status checks in GitHub:

```
Required status checks:
- ci/unit-tests
- ci/security  
- security/codeql
- Require branches to be up to date before merging: ✓
- Require review from CODEOWNERS: ✓
```

## Local Development

### Running Tests Locally

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:governance
npm run test:services  
npm run test:infrastructure

# UI tests with coverage
cd public/equity-ui-v2
npm run test:coverage
npm run test:a11y:e2e

# Coverage validation
npm run coverage:summary
npm run coverage:gate
```

### Validate CI Workflow
```bash
# Test CI workflow components
npm run test:ci-workflow

# Check security setup
npm run secrets:scan
npm audit --audit-level=high

# Performance checks
npm run performance:benchmark
npm run frontend:performance-test
```

## Artifacts

The workflow generates several artifacts for analysis:

### Coverage Reports
- `artifacts/coverage-summary-comprehensive.json`
- `artifacts/coverage-gate-enforcement.json`
- `artifacts/equity-ui-v2-coverage/`

### Test Results
- `artifacts/e2e-results/`
- `artifacts/test-coverage/`
- `playwright-report/` (E2E test reports)

### Security Artifacts
- `artifacts/security/npm-audit.json`
- `artifacts/sbom-comprehensive.spdx.json`
- `artifacts/secret-*.json`

### Performance Reports
- `artifacts/performance/bundle-size-check.json`
- `artifacts/perf-*.json`

### CI Summary
- `artifacts/ci-summary/comprehensive-ci-report.json`

## Troubleshooting

### Common Issues

#### Coverage Gate Failures
```bash
# Generate coverage data first
npm run coverage:summary

# Check specific thresholds
npm run coverage:gate
```

#### E2E Test Failures
```bash
# Install Playwright browsers
cd public/equity-ui-v2
npx playwright install --with-deps

# Run tests with UI
npx playwright test --ui
```

#### Security Scan Issues
```bash
# Update dependencies
npm audit fix

# Check for secrets
npm run secrets:scan
```

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# UI build issues
cd public/equity-ui-v2
rm -rf node_modules dist
npm install && npm run build
```

### Environment Variables

The workflow respects these environment variables:

- `COVERAGE_THRESHOLD`: Coverage percentage threshold (default: 80)
- `NODE_VERSION`: Node.js version to use (default: 20)
- `CI`: Marks CI environment behavior
- `GITHUB_ACTIONS`: GitHub Actions specific behavior

## Performance Budgets

### Bundle Size Limits
- **Maximum bundle size**: 5MB
- **Individual chunk limit**: 1MB
- **CSS limit**: 500KB

### Performance Metrics
- **Time to Interactive**: < 3s
- **First Contentful Paint**: < 1.5s
- **Cumulative Layout Shift**: < 0.1

## Security Policies

### Vulnerability Management
- **Critical vulnerabilities**: Block merge immediately
- **High vulnerabilities**: Block merge immediately  
- **Medium vulnerabilities**: Warning (advisory)
- **Low vulnerabilities**: Allowed

### Secret Scanning
- Gitleaks configuration in `.gitleaks.toml`
- Scans commit history and staged files
- Blocks commits containing secrets

## Integration with Existing Workflows

This comprehensive workflow complements existing workflows:

- **`ci-guard.yml`**: H1 governance and compliance checks
- **`node-lts-matrix.yml`**: Multi-version Node.js testing
- **`codeql.yml`**: Static security analysis
- **`gitleaks.yml`**: Secret scanning
- **`governance-gates.yml`**: Governance verification

## Badges

Add these badges to README.md:

```markdown
[![CI: Tests & Coverage](https://github.com/xcodeprem/merajutasa.id/workflows/CI:%20Comprehensive%20Tests%20&%20Coverage/badge.svg)](https://github.com/xcodeprem/merajutasa.id/actions/workflows/ci-comprehensive-tests.yml)

[![CodeQL](https://github.com/xcodeprem/merajutasa.id/workflows/CodeQL/badge.svg)](https://github.com/xcodeprem/merajutasa.id/actions/workflows/codeql.yml)

[![Security Scan](https://github.com/xcodeprem/merajutasa.id/workflows/Gitleaks/badge.svg)](https://github.com/xcodeprem/merajutasa.id/actions/workflows/gitleaks.yml)
```

## Compliance & Audit

This workflow helps meet compliance requirements:

- **SOC 2**: Automated testing and monitoring
- **ISO 27001**: Security scanning and controls
- **PCI DSS**: Secret scanning and vulnerability management
- **GDPR**: Privacy-by-design testing

## Monitoring & Alerting

The workflow integrates with observability systems:

- **Structured logging**: JSON format with correlation IDs
- **Tracing**: Distributed tracing across test execution
- **Metrics**: Test duration, coverage trends, failure rates
- **Alerting**: Slack/email notifications for failures

## Future Enhancements

### Planned Improvements
- Visual regression testing
- Cross-browser testing matrix
- Dependency update automation
- Advanced performance monitoring
- Security policy as code
- Compliance reporting automation

### Phase 2 Goals
- Increase coverage to 85%
- Add integration testing
- Implement chaos engineering
- Enhanced security scanning
- Performance optimization