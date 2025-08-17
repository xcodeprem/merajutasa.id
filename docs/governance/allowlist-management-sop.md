# GitHub Actions Allowlist Management SOP

## Overview

This document outlines the Standard Operating Procedures (SOPs) for managing the GitHub Actions allowlist (`/.github/actions-allowlist.json`) to maintain supply chain security.

## Actions Allowlist Upgrade Procedure

### Prerequisites

- Administrative access to the repository
- Understanding of the action being added/updated
- Security review completed for new actions

### Step-by-Step Process

#### 1. Security Review

**For new actions:**
- [ ] Verify the action is from a trusted publisher (GitHub official, verified organization, or well-established maintainer)
- [ ] Review the action's source code for security issues
- [ ] Check for any reported security vulnerabilities
- [ ] Ensure the action follows security best practices
- [ ] Document the business justification for adding this action

**For existing action updates:**
- [ ] Review the changelog between old and new SHA
- [ ] Verify no breaking changes or security issues in the new version
- [ ] Test the new version in a fork/branch if significant changes

#### 2. Technical Verification

```bash
# 1. Find the latest release/tag
git ls-remote --tags https://github.com/owner/action-name

# 2. Get the commit SHA for the tag
git ls-remote https://github.com/owner/action-name refs/tags/v1.2.3
# or browse to: https://github.com/owner/action-name/releases/tag/v1.2.3

# 3. Verify the SHA is 40 characters (commit hash, not tag hash)
echo "SHA_HERE" | grep -E '^[a-f0-9]{40}$'
```

#### 3. Update Process

1. **Create feature branch:**
   ```bash
   git checkout -b feat/allowlist-update-action-name
   ```

2. **Update allowlist file:**
   - Add new action entry or update existing SHA in `.github/actions-allowlist.json`
   - Include descriptive comment with version information
   - Maintain alphabetical order by action name

3. **Update workflow files:**
   - Update all workflows using the action to reference the new SHA
   - Ensure SHA matches exactly what's in the allowlist

4. **Test validation:**
   ```bash
   # Run actions pinning check
   ./.github/scripts/check-actions-pinning.sh
   
   # Run allowlist validation
   node -e "
     const allowlist = require('./.github/actions-allowlist.json');
     console.log('Allowlist is valid JSON');
     console.log('Total actions:', allowlist.allowed_actions.length);
   "
   ```

#### 4. Review and Approval

1. **Create Pull Request:**
   - Use the workflow PR template
   - Include security review documentation
   - Tag security team for review (`@codingxdev0`)
   - Include rollback plan in PR description

2. **Required Reviews:**
   - CODEOWNERS approval (required)
   - Security team review for new actions
   - Additional domain expert review if needed

3. **Pre-merge Validation:**
   - All CI checks pass
   - Actions pinning validation succeeds
   - Manual testing of workflows if significant changes

#### 5. Emergency Rollback Procedure

If issues are discovered after merge:

1. **Immediate action:**
   ```bash
   # Revert to previous working SHA
   git checkout main
   git revert COMMIT_SHA
   git push origin main
   ```

2. **Communicate:**
   - Notify in repository discussions/issues
   - Update any dependent teams
   - Document the issue and resolution

### Governance Guard Waiver Procedure

For exceptional cases where governance rules need to be bypassed:

#### When Waivers Are Allowed

- Critical security patches requiring immediate deployment
- Hotfixes for production outages
- Emergency compliance requirements

#### Waiver Process

1. **Request Waiver:**
   - Open an issue with `governance-waiver` label
   - Document business justification
   - Include risk assessment and mitigation plan
   - Set expiry date for waiver (max 30 days)

2. **Approval Required:**
   - Security team approval
   - Repository owner approval
   - Document in audit trail

3. **Implementation:**
   - Add `GOVERNANCE_WAIVER=true` environment variable to workflow
   - Or use `--skip-governance` flag if supported
   - Include waiver reference in commit message

4. **Follow-up:**
   - Schedule remediation work before waiver expires
   - Close waiver issue when compliance is restored
   - Update governance documentation if needed

### Audit Trail

All allowlist changes must maintain audit trail:

- Git commit history with descriptive messages
- PR discussions documenting security review
- Issues/discussions for any waivers granted
- Regular security reviews of approved actions

### Regular Maintenance

- **Monthly:** Review and update action SHAs to latest stable versions
- **Quarterly:** Security review of all approved actions
- **Annually:** Complete allowlist audit and cleanup

### Emergency Contacts

- **Security Issues:** @codingxdev0
- **Repository Owner:** @codingxdev0
- **Governance Questions:** Create issue with `governance` label

---

**Document Version:** 1.0  
**Last Updated:** 2025-08-17  
**Next Review:** 2025-11-17