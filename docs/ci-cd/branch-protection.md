# Branch Protection Configuration

## Required Status Checks

To maintain code quality and security, the following status checks are required for all PRs to `main`:

### Core CI Contexts

- **`ci/build`** - Node LTS Matrix Build (Node 18, 20, 22)
- **`ci/lint`** - Linting & Type Checking  
- **`ci/test`** - Test Suite (governance, services, infrastructure)
- **`ci/security`** - Security Scanning (npm audit, secret scan)
- **`coverage-gate`** - Coverage Gate Enforcement (≥80% lines, functions, statements)

### Additional Required Checks

- **security/codeql** - CodeQL static code analysis
- **security/secret-scan** - Secret scanning with Gitleaks
- **SBOM generation** - Software Bill of Materials
- **Governance verification** - Hash integrity and policy compliance
- **Coverage gate enforcement** - Minimum 80% test coverage (progressive to 90%+)

## Configuration Requirements

### Branch Protection Rules

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "ci/build",
      "ci/lint", 
      "ci/test",
      "ci/security",
      "security/codeql",
      "security/secret-scan"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

### Setup Instructions

1. Navigate to repository **Settings** → **Branches**
2. Click **Add rule** for `main` branch
3. Configure required settings:
   - ☑️ Require a pull request before merging
   - ☑️ Require approvals (minimum 1)
   - ☑️ Dismiss stale reviews when new commits are pushed
   - ☑️ Require review from code owners
   - ☑️ Require status checks to pass before merging
   - ☑️ Require branches to be up to date before merging
   - ☑️ Require conversation resolution before merging
4. Add required status check contexts:
   - `ci/build`
   - `ci/lint`
   - `ci/test`
   - `ci/security`
5. ☑️ Restrict pushes that create files larger than 100 MB
6. ☑️ Include administrators in restrictions
7. Save the rule

### Performance Requirements

- **CI Runtime**: Maximum 15 minutes per workflow
- **Cache Hit Rate**: >80% for dependency caching
- **Artifact Retention**: 14-90 days based on type
- **Security Scan**: Zero tolerance for HIGH/CRITICAL findings
- **Test Coverage**: Minimum 80% (lines, functions, statements), progressing to 90%+

### Coverage Gate Requirements

The coverage gate enforces minimum test coverage thresholds:

- **Lines**: ≥80% (target: 90%+)
- **Functions**: ≥80% (target: 90%+)
- **Statements**: ≥80% (target: 90%+)
- **Branches**: ≥70% (target: 80%+)

**Progressive Plan:**

1. **Phase 1** (current): 80% minimum for lines, functions, statements
2. **Phase 2** (future): 85% minimum
3. **Phase 3** (target): 90%+ minimum

**Enforcement:** Coverage gate fails the build if any threshold is not met. Use `npm run coverage:gate` to check locally.

### Governance Integration

All CI workflows integrate with the governance framework:

- Actions pinned to commit SHA for supply chain security
- SBOM generation mandatory for compliance
- Comprehensive artifact collection for audit trails
- Hash integrity verification where applicable

### Rollout Plan

1. **Phase 1**: Deploy workflow to development branch
2. **Phase 2**: Test with dummy PRs to verify gates work
3. **Phase 3**: Enable branch protection with required checks
4. **Phase 4**: Monitor performance and adjust timeouts if needed

### Emergency Bypass

In case of critical issues, branch protection can be temporarily disabled by repository administrators. All bypasses must be:

1. Documented in an issue with justification
2. Approved by tech owners (@xcodeprem, @Farid-Ze)
3. Re-enabled within 24 hours
4. Followed by a retrospective to prevent recurrence

For questions or issues with branch protection, contact the tech owners or create an issue.
