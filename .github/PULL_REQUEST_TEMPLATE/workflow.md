# Workflow Changes - CI Governance Checklist

> **This PR template is specifically for changes to GitHub Actions workflows, scripts, or CI governance.**
> 
> If your PR does not modify files in `.github/workflows/`, `.github/actions/`, `.github/scripts/`, or related governance files, please use the main PR template instead.

## Overview

**Type of workflow change:**
- [ ] New workflow
- [ ] Modify existing workflow  
- [ ] New composite action
- [ ] Modify existing composite action
- [ ] Update governance scripts
- [ ] Update actions allowlist
- [ ] Other CI/CD infrastructure

**Brief description:**
<!-- Explain what this change does and why it's necessary -->

## Governance Compliance Checklist

### Actions Pinning ✅
- [ ] All GitHub Actions are pinned to commit SHA (not tags or branches)
- [ ] All action SHAs are present in `.github/actions-allowlist.json`
- [ ] No new actions introduced without proper justification
- [ ] Local actions (starting with `./`) are allowed without SHA pinning

### Workflow Security 🔒
- [ ] Workflow has appropriate `permissions` block (principle of least privilege)
- [ ] No secrets exposed in logs or outputs
- [ ] Input validation is present where needed
- [ ] Third-party actions are from trusted sources only

### Concurrency Configuration ⚡
- [ ] Workflow includes `concurrency` block with meaningful group name
- [ ] `cancel-in-progress: true` is set (unless job needs to complete)
- [ ] Concurrency group is scoped appropriately (per branch/PR)

### A8 Governance Integration 🛡️
- [ ] Workflow includes `run-a8` composite action (if appropriate)
- [ ] `policy-path: tools/policy/policy.json` is explicitly specified
- [ ] Governance checks run before main workflow logic
- [ ] Artifacts are uploaded for audit trail

### Testing & Validation 🧪
- [ ] Workflow tested in fork/draft PR
- [ ] Actions pinning linter passes: `./.github/scripts/check-actions-pinning.sh`
- [ ] No workflow syntax errors (GitHub Actions tab shows no issues)
- [ ] Dry-run tested where possible

## Action Allowlist Updates

**If adding new actions to allowlist:**

| Action | SHA | Justification | Security Review |
|--------|-----|---------------|-----------------|
| | | | [ ] Reviewed |

**New action security checklist:**
- [ ] Action is from verified publisher or well-known organization
- [ ] Action source code reviewed for security concerns
- [ ] Action has good security track record (no recent CVEs)
- [ ] Action follows security best practices (minimal permissions, etc.)
- [ ] SHA corresponds to a tagged release (not random commit)

## Impact Assessment

**Workflows affected:**
<!-- List workflows that will be impacted by this change -->

**Breaking changes:**
- [ ] No breaking changes
- [ ] Breaking changes (explain mitigation below)

**Rollback plan:**
<!-- How to quickly revert if something goes wrong -->

## Compliance Verification

- [ ] `./.github/scripts/check-actions-pinning.sh` passes
- [ ] `workflow-guard.yml` checks pass  
- [ ] No security warnings in GitHub Actions tab
- [ ] CODEOWNERS approval obtained for governance changes

## Testing Evidence

**Local testing:**
```
# Paste output of governance checks
$ ./.github/scripts/check-actions-pinning.sh
# Output here
```

**Integration testing:**
<!-- Link to test workflow runs or describe manual testing -->

## Post-Merge Actions

- [ ] Monitor first workflow run for issues
- [ ] Update documentation if workflow behavior changes
- [ ] Notify team of any new required actions or changes

---

## Security Considerations

**For security-sensitive changes:**
- [ ] Security team notified
- [ ] Change has security review approval
- [ ] No new attack vectors introduced
- [ ] Secrets management follows best practices

## Compliance Statement

By submitting this PR, I confirm that:

- [ ] All actions are pinned to approved commit SHAs
- [ ] No deprecated or insecure practices are introduced
- [ ] Workflow follows CI governance policies
- [ ] Changes align with repository security requirements
- [ ] I have tested the changes thoroughly

---

**Additional Notes:**
<!-- Any other relevant information, constraints, or context -->

/cc @codingxdev0 <!-- Ensure governance owner is notified -->