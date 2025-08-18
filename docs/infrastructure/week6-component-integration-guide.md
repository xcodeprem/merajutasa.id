# Week 6 Component Integration Guide

This document provides a runbook for maintaining and testing the Week 6 Security Hardening and Compliance Orchestrator components, covering import resolution, integration testing, and governance compliance.

## Component Architecture

### Security Hardening System

- **Location**: `infrastructure/security/enhanced/security-hardening.js`
- **Dependencies**: `../../compliance/audit-system.js`
- **Exports**: `SecurityHardening` class, `securityHardening` singleton
- **Key Features**: Real-time threat detection, automated incident response, security scanning

### Compliance Orchestrator

- **Location**: `infrastructure/compliance/compliance-orchestrator.js`
- **Dependencies**:
  - `./audit-system.js`
  - `./compliance-automation.js`
  - `../security/enhanced/security-hardening.js`
  - `./privacy-rights-management.js`
- **Exports**: `ComplianceOrchestrator` class, `complianceOrchestrator` singleton
- **Key Features**: Cross-component orchestration, event correlation, risk assessment

### Audit System

- **Location**: `infrastructure/compliance/audit-system.js`
- **Dependencies**: Node.js built-ins only
- **Exports**: `AuditSystem` class, `auditSystem` singleton, `auditEvents` helpers
- **Key Features**: Immutable audit trails, compliance tagging, automated retention

## Import Path Conventions

### Correct Patterns

```javascript
// From security-hardening.js to audit-system.js
import { auditSystem } from '../../compliance/audit-system.js';

// From compliance-orchestrator.js to security-hardening.js
import { securityHardening } from '../security/enhanced/security-hardening.js';

// From compliance-orchestrator.js to audit-system.js
import { auditSystem } from './audit-system.js';
```

### Import Resolution Rules

1. Always use relative imports for project files
2. Include the `.js` extension
3. Use `../../` to go up directory levels from `security/enhanced/`
4. Use `../` to go up one level from `compliance/`
5. Use `./` for same-directory imports

## Testing Framework

### Test Suites

#### 1. Import Resolution Tests

- **Command**: `npm run test:week6-imports`
- **File**: `tools/tests/week6-component-imports.test.js`
- **Purpose**: Validates import paths and module exports
- **Key Checks**:
  - Correct import syntax
  - No circular dependencies
  - Module exports available
  - ES module compliance

#### 2. Contract Tests

- **Command**: `npm run test:week6-contracts`
- **File**: `tools/tests/week6-component-contracts.test.js`
- **Purpose**: Tests component integration contracts
- **Key Checks**:
  - Orchestrator boot with audit system
  - Audit system call contracts
  - Cross-component integration
  - Error handling resilience

#### 3. Smoke Tests

- **Command**: `npm run test:week6-smoke`
- **File**: `tools/tests/week6-component-smoke.test.js`
- **Purpose**: End-to-end functionality validation
- **Key Checks**:
  - Audit event flow
  - Security threat detection
  - Compliance orchestration
  - System integration under load

#### 4. Complete Week 6 Suite

- **Command**: `npm run test:week6`
- **Runs**: All three test suites in sequence

### CI/CD Integration

#### Import Dependency Checking

- **Command**: `npm run lint:imports`
- **File**: `tools/import-dependency-check.js`
- **Purpose**: Prevents unresolved imports in CI
- **Features**:
  - Scans all JavaScript files in `infrastructure/`
  - Detects missing imports
  - Identifies circular dependencies
  - Generates detailed reports

#### Infrastructure Testing

- **Command**: `npm run test:infrastructure`
- **Includes**: Week 6 tests plus general infrastructure validation

## Component Scoring

### Score Calculation

Component scores are calculated based on:

- **Import Resolution**: 100/100 (all imports must resolve)
- **Contract Compliance**: 85-90/100 (based on integration tests)
- **Smoke Test Performance**: 85-95/100 (based on end-to-end functionality)
- **Overall Week 6 Score**: Average of component scores

### Target Scores

- **Security Hardening**: ≥75/100 (Target: 90/100)
- **Compliance Orchestrator**: ≥75/100 (Target: 85/100)
- **Overall Phase 2 Week 6**: ≥75/100 (Target: 85/100)

## Dependency Map

```
audit-system.js (base)
    ↑
    └── security-hardening.js
    ↑
    └── compliance-orchestrator.js
            ↑
            ├── compliance-automation.js
            └── privacy-rights-management.js
```

### Dependencies Flow

1. **audit-system.js**: No dependencies (base layer)
2. **security-hardening.js**: Depends on audit-system.js
3. **compliance-orchestrator.js**: Depends on all other components
4. **No circular dependencies**: Enforced by import checker

## Troubleshooting

### Common Issues

#### Import Resolution Errors

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'xyz'
```

**Solution**: Check import path, ensure relative paths are correct

#### Circular Dependency Detected

```
RangeError: Maximum call stack size exceeded
```

**Solution**: Run `npm run lint:imports` to identify cycle, refactor dependencies

#### Component Load Failures

```
TypeError: Cannot read properties of undefined
```

**Solution**: Run `npm run test:week6-contracts` to verify integration

### Debugging Commands

```bash
# Test specific component imports
npm run test:week6-imports

# Validate component contracts
npm run test:week6-contracts

# End-to-end functionality test
npm run test:week6-smoke

# Check for import issues
npm run lint:imports

# Full governance check
npm run governance:verify

# View component scores
cat artifacts/week6-component-smoke-test.json | jq '.component_scores'
```

### Recovery Procedures

#### If Import Tests Fail

1. Check file paths in error messages
2. Verify directory structure matches expectations
3. Ensure all files have `.js` extensions
4. Run `npm run lint:imports` for detailed analysis

#### If Contract Tests Fail

1. Check component initialization order
2. Verify all dependencies are properly exported
3. Check for null/undefined references
4. Review component health check logic

#### If Smoke Tests Fail

1. Check for event processing delays
2. Verify component shutdown procedures
3. Review error handling in integration points
4. Check temporary file cleanup

## Governance Integration

### Verification Steps

1. **Import Resolution**: Automated via test suite
2. **Contract Validation**: Automated via test suite
3. **Functional Testing**: Automated via smoke tests
4. **Governance Compliance**: Validated via `governance:verify`

### Artifacts Generated

- `artifacts/week6-component-imports-test.json`
- `artifacts/week6-component-contracts-test.json`
- `artifacts/week6-component-smoke-test.json`
- `artifacts/import-dependency-check.json`

### Score Reporting

Component scores are automatically calculated and reported in test artifacts. Use these for monitoring component health and compliance with Week 6 targets.

## Maintenance Guidelines

### Regular Tasks

1. Run `npm run test:week6` before merging changes
2. Monitor component scores in CI/CD pipeline
3. Review import dependency reports for new violations
4. Validate governance compliance after component updates

### Best Practices

1. Always use relative imports for project files
2. Include explicit `.js` extensions
3. Maintain dependency hierarchy (no cycles)
4. Test component integration after changes
5. Update documentation when adding new dependencies

### Code Review Checklist

- [ ] Import paths follow conventions
- [ ] No circular dependencies introduced
- [ ] All tests pass (`npm run test:week6`)
- [ ] Import dependency check passes (`npm run lint:imports`)
- [ ] Component scores meet targets (≥75/100)
- [ ] Governance verification passes (`npm run governance:verify`)
