# Agent Context Pack - CI Governance & Workflow Hardening

> **Version:** 1.0  
> **Created:** 2025-08-17  
> **Purpose:** Guidance for agents and workflow authors with governance invariants and baseline examples

## Overview

This document provides essential context for AI agents, developers, and workflow authors working with the CI/CD infrastructure of this repository. It establishes governance invariants that **MUST** be maintained and provides baseline examples for common patterns.

## Core Governance Invariants

### 1. Actions Pinning (CRITICAL) 🔒

**Rule:** All external GitHub Actions MUST be pinned to commit SHA, never tags or branches.

**Why:** Tags and branches can be moved/compromised, introducing supply chain attacks.

**✅ Correct:**

```yaml
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.1.7
- uses: actions/setup-node@1e60f620b9541d16bece96c5465dc8ee9832be0b # v4.0.3
```

**❌ Incorrect:**

```yaml  
- uses: actions/checkout@v4
- uses: actions/setup-node@main
- uses: some-action@latest
```

**Exception:** Local actions (starting with `./`) don't require SHA pinning:

```yaml
- uses: ./.github/actions/run-a8  # ✅ OK
```

### 2. Actions Allowlist Compliance (CRITICAL) 📋

**Rule:** All external actions MUST be present in `.github/actions-allowlist.json` with approved SHAs.

**Process for new actions:**

1. Add action + SHA to allowlist with justification
2. Security review of action source code
3. CODEOWNERS approval for allowlist changes

**Allowlist structure:**

```json
{
  "allowed_actions": [
    {
      "action": "actions/checkout",
      "allowed_shas": ["11bd71901bbe5b1630ceea73d27597364c9af683"],
      "description": "Official GitHub checkout action"
    }
  ]
}
```

### 3. Concurrency Management (REQUIRED) ⚡

**Rule:** All workflows MUST include concurrency with `cancel-in-progress: true`.

**Standard pattern:**

```yaml
concurrency:
  group: workflow-name-${{ github.ref }}
  cancel-in-progress: true
```

**For PR-specific patterns:**

```yaml
concurrency:
  group: workflow-name-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

### 4. A8 Governance Integration (REQUIRED) 🛡️

**Rule:** Workflows that modify code/config MUST include A8 governance checks.

**Standard integration:**

```yaml
- name: Run A8 governance guard
  uses: ./.github/actions/run-a8
  with:
    policy-path: tools/policy/policy.json
```

**When A8 is required:**

- Code changes
- Configuration updates  
- Governance file modifications
- Policy changes

**When A8 may be skipped:**

- Pure documentation workflows
- External API calls only
- Read-only operations

### 5. Permissions (SECURITY) 🔐

**Rule:** Use principle of least privilege for `permissions` blocks.

**Default safe permissions:**

```yaml
permissions:
  contents: read
```

**Common permission patterns:**

```yaml
# For PR comments
permissions:
  contents: read
  pull-requests: write

# For releases  
permissions:
  contents: write
  packages: write

# For Pages deployment
permissions:
  contents: read
  pages: write
  id-token: write
```

**❌ Avoid:** `permissions: write-all` or overly broad permissions.

## Baseline Workflow Templates

### Standard CI Workflow

```yaml
name: Example CI Workflow

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.1.7

      - name: Setup Node.js
        uses: actions/setup-node@1e60f620b9541d16bece96c5465dc8ee9832be0b # v4.0.3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Run A8 governance guard
        uses: ./.github/actions/run-a8
        with:
          policy-path: tools/policy/policy.json

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
```

### Deployment Workflow

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

permissions:
  contents: read
  deployments: write

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false  # Don't cancel deployments

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    environment: production
    steps:
      - name: Checkout
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.1.7

      - name: Run A8 governance guard
        uses: ./.github/actions/run-a8
        with:
          policy-path: tools/policy/policy.json

      # Deployment steps...
```

## Common Patterns and Pitfalls

### ✅ Good Practices

1. **Explicit timeouts:** Always set `timeout-minutes` on jobs
2. **Environment variables:** Use `env:` blocks for configuration
3. **Artifacts:** Upload important build outputs for debugging
4. **Conditional execution:** Use `if:` conditions to optimize workflow runs
5. **Matrix strategies:** Use for testing across multiple versions/platforms

### ❌ Common Pitfalls

1. **Missing SHA pinning:** Using tags instead of commit SHAs
2. **Overly broad permissions:** Using `write-all` or unnecessary permissions
3. **Missing concurrency:** Allowing parallel runs to interfere
4. **No governance checks:** Skipping A8 integration
5. **Secret exposure:** Logging secrets or sensitive data
6. **No error handling:** Not using `continue-on-error` or `if: always()` where appropriate

## Governance Tools & Validation

### Local Validation Scripts

```bash
# Check actions pinning compliance
./.github/scripts/check-actions-pinning.sh

# Run A8 governance checks
node tools/governance-verify.js --policy tools/policy/policy.json --a8

# Validate allowlist format
node -e "JSON.parse(require('fs').readFileSync('.github/actions-allowlist.json', 'utf8'))"
```

### Automated Checks

The `workflow-guard.yml` workflow automatically validates:

- Actions pinning to approved SHAs
- Concurrency configuration
- A8 governance integration  
- Allowlist format compliance

## Incident Response & Rollback

### Quick Rollback Procedures

1. **Bad workflow:** Revert the commit, disable workflow in UI
2. **Compromised action:** Remove from allowlist, update all usages
3. **Security incident:** Revoke tokens, audit logs, notify security team

### Emergency Overrides

In critical situations, temporary overrides may be granted:

- Set `SECURITY_GATING_DISABLED=true` to bypass A8 checks
- Use workflow dispatch to run specific jobs
- Manual intervention via repository settings

## Agent-Specific Guidance

### For AI Agents Modifying Workflows

1. **Always validate:** Run governance checks before proposing changes
2. **Follow templates:** Use baseline patterns from this document
3. **Explain changes:** Provide clear justification for any deviations
4. **Test incrementally:** Make small, testable changes
5. **Respect invariants:** Never compromise security/governance requirements

### For Code Review

1. **Check allowlist:** Verify all actions are approved
2. **Validate permissions:** Ensure least privilege principle
3. **Test execution:** Run workflows in fork before merging
4. **Document changes:** Update this guide if new patterns emerge

## Change Management

### Adding New Actions

1. Research action security and trustworthiness
2. Add to `.github/actions-allowlist.json` with justification
3. Get security review and CODEOWNERS approval
4. Update this guide with usage examples

### Modifying Governance

1. Create DEC (Decision Record) for significant changes
2. Update `tools/policy/policy.json` if needed
3. Test changes thoroughly in isolation
4. Coordinate with governance team

## References

- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides)
- [Repository Governance DEC Records](../governance/dec/)
- [Policy Configuration](../../tools/policy/policy.json)
- [Actions Allowlist](../.github/actions-allowlist.json)

---

**Maintenance:** This document should be updated whenever governance policies change or new patterns emerge. Updates require CODEOWNERS approval.
