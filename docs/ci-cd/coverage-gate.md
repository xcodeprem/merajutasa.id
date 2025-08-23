# Coverage Gate Documentation

## Overview

The coverage gate ensures that all code changes maintain adequate test coverage to prevent regressions from entering the main branch.

## Coverage Thresholds

### Current Requirements (Phase 1)
- **Lines**: ≥80%
- **Functions**: ≥80%  
- **Statements**: ≥80%
- **Branches**: ≥70%

### Progressive Plan
1. **Phase 1** (current): 80% minimum for core metrics
2. **Phase 2** (Q1 2025): Increase to 85%
3. **Phase 3** (Q2 2025): Target 90%+ for production readiness

## How It Works

The coverage gate runs after UI tests complete and:

1. Reads coverage data from Vitest output
2. Compares actual coverage against thresholds
3. Fails the build if any metric falls below requirements
4. Generates detailed reports for debugging

## Usage

### Local Development

```bash
# Run tests with coverage
cd public/equity-ui-v2 && npm test -- --coverage

# Generate coverage summary
npm run coverage:summary

# Check coverage gate (will fail if below thresholds)
npm run coverage:gate
```

### CI Integration

The coverage gate runs automatically in:
- `.github/workflows/ci-guard.yml`
- `.github/workflows/node-lts-matrix.yml`

### Checking Coverage Reports

Coverage artifacts are generated in:
- `artifacts/equity-ui-v2-coverage/` - Raw coverage data
- `artifacts/coverage-summary-comprehensive.json` - Summary data
- `artifacts/coverage-gate-enforcement.json` - Gate results

## Improving Coverage

### 1. Identify Uncovered Code

```bash
# Generate coverage report
cd public/equity-ui-v2 && npm test -- --coverage

# Open HTML report in browser
open ../../artifacts/equity-ui-v2-coverage/lcov-report/index.html
```

### 2. Add Missing Tests

Focus on:
- Untested functions (biggest impact on function coverage)
- Complex conditionals (improves branch coverage) 
- Error handling paths
- Edge cases

### 3. Test Quality Guidelines

```javascript
// Good: Tests actual functionality
test('validates email format correctly', () => {
  expect(validateEmail('valid@email.com')).toBe(true);
  expect(validateEmail('invalid-email')).toBe(false);
});

// Good: Tests error conditions
test('handles API failure gracefully', async () => {
  mockApiCall.mockRejectedValue(new Error('Network error'));
  await expect(fetchUserData()).rejects.toThrow('Network error');
});
```

### 4. Coverage Patterns

**Effective patterns:**
- Test public API methods thoroughly
- Mock external dependencies
- Use data-driven tests for multiple scenarios
- Test both success and failure paths

**Avoid:**
- Testing implementation details
- Trivial getter/setter tests
- Mocking everything (reduces confidence)

## Troubleshooting

### Coverage Too Low

```bash
# 1. Check which files need coverage
npm run coverage:gate

# 2. Review coverage report
open artifacts/equity-ui-v2-coverage/lcov-report/index.html

# 3. Add tests for uncovered code

# 4. Verify improvement
npm run coverage:summary && npm run coverage:gate
```

### Coverage Gate Failing in CI

1. Check the `coverage-gate-enforcement.json` artifact
2. Review which metrics are failing
3. Run coverage locally to debug
4. Add tests to meet thresholds

### Coverage Data Missing

```bash
# Ensure UI tests run with coverage first
cd public/equity-ui-v2 && npm test -- --coverage

# Then generate summary
npm run coverage:summary

# Finally check gate
npm run coverage:gate
```

## Configuration

### Thresholds

Current thresholds are defined in `tools/coverage-gate-enforce.js`:

```javascript
const COVERAGE_THRESHOLDS = {
  lines: 80,    // Start at 80%, progress to 90%+
  functions: 80,
  branches: 70, // More lenient for branches initially  
  statements: 80,
};
```

### Future Configuration

Thresholds will be moved to a configuration file for easier updates:
- `docs/governance/coverage-policy.yml`
- Support for per-file/directory thresholds
- Integration with DEC change approval process

## Governance Integration

Coverage requirements are enforced through:
- **Branch Protection**: Coverage gate is a required status check
- **PR Reviews**: Coverage reports included in PR artifacts
- **Audit Trail**: All coverage enforcement logged
- **Progressive Enhancement**: Threshold increases require DEC approval

## Artifacts Generated

| File | Purpose |
|------|---------|
| `coverage-summary-comprehensive.json` | Overall coverage summary |
| `coverage-gate-enforcement.json` | Gate enforcement results |
| `equity-ui-v2-coverage/` | Detailed Vitest coverage reports |
| `lcov-report/index.html` | Interactive coverage browser |

## Related Documentation

- [Branch Protection](branch-protection.md)
- [CI Artifacts](../ci-artifacts.md)  
- [Testing Guidelines](../testing/README.md)
- [Governance Framework](../governance/README.md)