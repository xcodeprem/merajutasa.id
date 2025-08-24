# Branch Protection Requirements

This document summarizes the required branch protection settings for the main and master branches to ensure repository security and code quality.

## Required Protections for Main and Master Branches

### Pull Request Requirements

- ✅ **Require a pull request before merging**
- ✅ **Require approvals**: Minimum 1 approval required
- ✅ **Dismiss stale reviews when new commits are pushed**
- ✅ **Require review from code owners**
- ✅ **Require conversation resolution before merging**

### Branch Update Requirements

- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**

### Administrative Controls

- ✅ **Restrict pushes that create files larger than 100 MB**
- ✅ **Include administrators in restrictions** (enforce admins)
- ✅ **Require linear history**

## Required Status Checks

The following status checks must pass before merging:

### Primary Status Check

- **`orphanage-content-validation`** - Validates orphanage JSON content against schema

> **Note**: The exact check name shows in the Checks tab as "orphanage-content-validation / validate" (Workflow name / Job name format).

### Additional Recommended Checks

- `ci/build` - Build verification
- `ci/lint` - Code linting
- `ci/test` - Test suite execution
- `security/codeql` - Security analysis
- `security/secret-scan` - Secret scanning

## Setup Instructions

1. Navigate to repository **Settings** → **Branches**
2. Click **Add rule** for each branch (`main`, `master`)
3. Configure the settings listed above
4. Add required status check: `orphanage-content-validation`
5. Save the rule

## Safe Master Strategy

This repository implements a safe master strategy where:

1. **Main branch** serves as the primary development branch
2. **Master branch** is automatically synchronized from main via GitHub Actions
3. Both branches maintain identical protection rules
4. The mirror workflow ensures master stays in sync with main automatically

## Workflow Integration

The `orphanage-content-validation` workflow runs automatically on:

- Pull requests that modify `content/orphanages/**/*.json` files
- Manual dispatch via workflow UI

This ensures all orphanage content changes are validated before merge.
