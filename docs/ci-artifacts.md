# CI Artifacts Documentation

This document describes the comprehensive CI artifact saving implementation for the merajutasa.id repository.

## Artifact Types and Structure

### Build Artifacts
- **Name Pattern**: `ui-build-{run_id}`
- **Contents**: Production build outputs from `npm run equity-ui-v2:build`
- **Location**: `public/dist/` + build summaries in `artifacts/build/`
- **Retention**: 14 days
- **Includes**: Compiled assets, source maps, compressed files, build environment info

### Test Coverage Artifacts
- **Name Pattern**: `test-coverage-{run_id}`
- **Contents**: Comprehensive coverage reports and test summaries
- **Includes**:
  - `coverage-summary-comprehensive.json` - UI and root test coverage
  - `lint-summary-comprehensive.json` - All lint results
  - Governance verification results
  - Parameter integrity reports
- **Retention**: 30 days

### UI Test Artifacts
- **Name Pattern**: `ui2-tests-{run_id}`
- **Contents**: UI-specific test results and coverage
- **Includes**:
  - `artifacts/equity-ui-v2-coverage/` - Vitest coverage reports
  - E2E test results
  - Accessibility test results
- **Retention**: 30 days

### Security Artifacts
- **Name Pattern**: `sbom-{run_id}`
- **Contents**: Software Bill of Materials
- **Format**: SPDX JSON
- **Retention**: 90 days (longest retention for security compliance)

### KPI and Monitoring Artifacts
- **Name Pattern**: `h1-kpi-artifacts`
- **Contents**: Performance metrics, equity reports, compliance data
- **Retention**: 30 days

## Summary Reports

The implementation includes comprehensive summary generators:

### Coverage Summary (`npm run coverage:summary`)
```json
{
  "timestamp": "2025-08-23T22:35:12.797Z",
  "coverage": {
    "ui": {
      "lines": { "pct": 72.03, "covered": 1543, "total": 2142 },
      "functions": { "pct": 59.7, "covered": 80, "total": 134 }
    },
    "root_tests": { "governance": "failed", "services": "passed" }
  },
  "build": { "status": "success", "artifacts_generated": true },
  "badge": { "coverage": "fair", "coverage_pct": 72.03 }
}
```

### Lint Summary (`npm run lint:summary`)
```json
{
  "timestamp": "2025-08-23T22:35:17.418Z",
  "lint_results": {
    "dec": { "status": "PASS", "violations": 0 },
    "disclaimers": { "status": "PASS", "violations": 0 },
    "security_patterns": { "status": "PASS", "high_severity_findings": 0 }
  },
  "overall_status": "pass",
  "badge": { "lint": "passing", "pass_rate": 100 }
}
```

## Badge Integration

The summary files generate badge-compatible data:
- Coverage percentage and status
- Lint pass/fail status
- Build success/failure status

## Performance Compliance

All workflows maintain the repository standard of < 10 minute runtime:
- Builds use npm caching
- Tests run with `continue-on-error: true` for advisory mode
- Artifact uploads happen in parallel where possible

## Security Compliance

- All external actions pinned to commit SHA
- Retention policies prevent indefinite storage
- SBOM generation for supply chain security
- Security scan results preserved for audit trails

## Usage in CI

These artifacts are automatically generated and uploaded by:
- `.github/workflows/ci-guard.yml` - Main CI pipeline
- `.github/workflows/infrastructure-ci.yml` - Infrastructure testing
- `.github/workflows/sbom.yml` - Security bill of materials

No manual intervention required for artifact generation.