---
id: DEC-20250816-01
title: Governance Pipeline Security Enhancement & Canonical Spec Updates
date: 2025-08-16T18:00:00Z
class: CIC-B
status: adopted
supersedes: []
depends_on:
  - DEC-20250813-05
  - DEC-20250815-01
governance_tags: [security, integrity, gating, canonical-spec]
related_principles: [GP1, GP2, GP5, GP10]
related_files:
  - docs/analytics/event-schema-canonical-v1.md
  - tools/lib/security-validators.js
  - tools/lib/json-stable.js
  - tools/policy/policy.json
  - tools/governance-verify.js
  - README.md
hash_of_decision_document: "4c2147f1569bfe8466a3ead4a72a3fbb107aafac150ead9d3e08a6e9a76e028c"
decision_summary: >
  Comprehensive security enhancement to governance pipeline addressing critical vulnerabilities,
  implementing policy-as-code framework, and establishing deterministic artifact generation.
  Updates to canonical event schema specification are authorized under controlled governance.
---

## Context

During comprehensive security audit of the governance pipeline, several critical vulnerabilities were identified requiring immediate remediation:

1. **High-severity security patterns**: `execSync` with template literal interpolation in phase tracker
2. **Path traversal vulnerabilities**: Unsafe `path.resolve` usage in schema validator
3. **Non-deterministic artifacts**: Inconsistent JSON output causing pipeline noise
4. **Security gating gaps**: HIGH security violations not properly gating pipeline execution
5. **Policy drift**: Decentralized A8 (no-silent-drift) implementation across workflows

Additionally, the canonical event schema specification requires updates to reflect current implementation state and maintain synchronization with governance artifacts.

## Decision

### 1. Security Infrastructure Implementation

**APPROVED**: Implement comprehensive security validation framework:

- **`tools/lib/security-validators.js`**: Centralized path validation utilities preventing directory traversal
- **`tools/lib/json-stable.js`**: Deterministic JSON output with sorted keys and metadata injection
- **Path validation enforcement**: All user input paths validated against base directories
- **Safe command execution**: Replace `execSync` interpolation with `execFileSync` array arguments

### 2. Policy-as-Code Framework

**APPROVED**: Establish centralized policy management:

- **`tools/policy/policy.json`**: Single source of truth for A8 gating rules
- **Security gating escalation**: HIGH severity security violations → FAIL (immediate gate failure)
- **Composite action standardization**: `.github/actions/run-a8/action.yml` for consistent execution
- **Policy-driven enforcement**: Route-based requirements and severity thresholds

### 3. Canonical Specification Updates

**AUTHORIZED**: Under controlled governance, the following canonical spec changes are approved:

- **Event schema refinements**: Clarification of integrity field requirements
- **Documentation alignment**: Synchronization with current implementation patterns  
- **Governance integration**: Addition of policy compliance markers

**Change control**: All canonical edits tracked through this DEC with hash manifest updates.

### 4. Pipeline Determinism & Observability

**APPROVED**: Implement artifact standardization:

- **Stable JSON writers**: Consistent formatting across all governance tools
- **Metadata injection**: Git SHA, PR number, actor information in key artifacts
- **Volatile/stable segregation**: CI logs separate from audit-critical evidence
- **README auto-sync**: Status section synchronized with artifact state

## Implementation Requirements

### Security Patterns Remediation

1. **Phase Tracker** (`tools/generate-phase-tracker.js`):

   ```javascript
   // BEFORE (vulnerable):
   const ts = execSync(`git log -1 --format=%cI -- ${DEC_FILE}`)
   
   // AFTER (secure):
   const ts = execFileSync('git', ['log','-1','--format=%cI','--', validatedDecFile])
   ```

2. **Schema Validator** (`tools/schema-validate.js`):

   ```javascript
   // BEFORE (vulnerable):
   const dataPath = path.resolve(process.argv[2])
   
   // AFTER (secure):
   const dataPath = validateFileArg(DATA_ROOT, process.argv[2], 'default.json')
   ```

### Policy Enforcement Matrix

| Check Type | Gating Level | Enforcement |
|------------|--------------|-------------|
| security-smoke HIGH | FAIL | Immediate pipeline termination |
| security-smoke MEDIUM | ADVISORY | Warning logged, execution continues |
| spec-hash-diff | FAIL | DEC required for canonical changes |
| dec-lint | FAIL | All DEC files must pass validation |
| param-integrity | FAIL | Parameter matrix consistency required |

### Artifact Standardization

All governance artifacts MUST:

- Use `stableStringify()` for deterministic output
- Include `_metadata` section with:
  - `generated_at`: ISO timestamp
  - `git_sha`: Commit hash (if available)
  - `run_id`: CI run identifier (if available)
  - `actor`: Git actor/CI user (if available)
  - `generator`: Tool name and version

## Risk Assessment

| Risk ID | Description | Mitigation |
|---------|-------------|------------|
| R-SEC-01 | False positive security detection | Allowlist mechanism via policy.json scoped overrides |
| R-DET-02 | Artifact format breaking changes | Versioned metadata schema with backward compatibility |
| R-POL-03 | Policy configuration errors | Schema validation and dry-run capability |
| R-CAN-04 | Canonical spec drift | Automated sync verification and DEC linkage |

## Rollback Plan

1. **Emergency security bypass**: Set `SECURITY_GATING_DISABLED=true` environment variable
2. **Policy revert**: Replace `tools/policy/policy.json` with previous version
3. **Artifact format rollback**: Individual tools have legacy output compatibility flags
4. **Composite action disable**: Remove `uses: ./.github/actions/run-a8` from workflow files

## Verification Criteria

- [ ] No HIGH severity security patterns detected in codebase scan
- [ ] All `execSync` with interpolation eliminated from tools directory
- [ ] Path traversal protection validated with negative test cases
- [ ] Policy.json schema compliance verified
- [ ] Canonical spec hash manifest updated and verified
- [ ] README status markers functional and auto-updating
- [ ] Deterministic artifact output verified (repeated runs produce identical JSON)
- [ ] A8 composite action executes consistently across all workflows

## Traceability Matrix

### Artifacts Modified

- `docs/analytics/event-schema-canonical-v1.md`: Controlled canonical updates
- `README.md`: Status section markers and governance documentation
- `tools/generate-phase-tracker.js`: Security remediation and stable output
- `tools/schema-validate.js`: Path validation and artifact standardization
- `tools/governance-verify.js`: Policy integration and security gating

### Artifacts Created

- `tools/lib/security-validators.js`: Path validation utilities
- `tools/lib/json-stable.js`: Deterministic JSON output
- `tools/policy/policy.json`: Centralized gating policy
- `tools/status/update-readme-status.js`: README synchronization
- `.github/actions/run-a8/action.yml`: Composite A8 execution

### Test Coverage

- Unit tests for security validators with traversal attack vectors
- Integration tests for policy-driven gating behavior
- End-to-end verification of deterministic artifact generation

## Compliance Statement

This DEC authorizes security-critical changes to governance infrastructure while maintaining backward compatibility and audit trail integrity. All canonical specification edits are tracked through hash manifest updates and remain subject to ongoing governance review.

**Decision Authority**: Infrastructure Security & Governance Automation  
**Ratification Date**: 2025-08-16T18:00:00Z  
**Effective Immediately**: Security fixes active upon deployment  
**Review Cycle**: 30 days post-implementation for effectiveness assessment
