# Post-Configuration Verification

## Overview

The post-configuration verification system provides comprehensive validation after configuration changes to ensure system integrity and compliance. This addresses the requirement for thorough verification following any configuration updates.

## Usage

### Quick Run

```bash
npm run post-config:verify
```

### Individual Commands

The verification process can also be run as individual steps:

```bash
# Complete governance integrity check
npm run governance:verify

# Content hash verification  
npm run spec-hash:verify

# Parameter consistency validation
npm run param:integrity

# Compliance audit checks
npm run compliance:audit
```

## Verification Steps

The post-configuration verification runs the following steps in sequence:

1. **Governance Verify** (`governance:verify`)
   - Complete governance integrity check including spec-hash validation
   - Parameter integrity verification
   - Security patterns smoke testing
   - Evidence validation and collision testing
   - Duration: ~3-5 seconds

2. **Spec Hash Verify** (`spec-hash:verify`)  
   - Content hash verification for governed documents
   - Detects unauthorized changes and drift
   - Duration: ~200ms

3. **Parameter Integrity** (`param:integrity`)
   - Parameter consistency validation between config, code, and DEC files
   - Ensures configuration values match across sources
   - Duration: ~200ms

4. **Compliance Audit** (`compliance:audit`)
   - Compliance audit system validation
   - Generates audit trail and compliance reports
   - Duration: ~200ms

## Success Criteria

All verification steps must meet the following criteria:

- ✅ **All Commands Pass**: All verification commands must exit with code 0
- ✅ **No Hash Drift**: Content hash verification must show zero violations
- ✅ **No Parameter Violations**: Parameter integrity must show all parameters in MATCH status
- ✅ **Artifacts Generated**: Required verification artifacts must be created

## Generated Artifacts

The verification process generates several important artifacts:

### Summary Report

- `artifacts/post-config-verification-summary.json` - Complete verification summary with status and timing

### Step-Specific Artifacts

- `artifacts/governance-verify-summary.json` - Governance verification details
- `artifacts/spec-hash-diff.json` - Hash verification results
- `artifacts/param-integrity-matrix.json` - Parameter consistency matrix
- Audit logs in `artifacts/audit/` - Compliance audit trail

### Action Logs

- `artifacts/post-config-verify-YYYY-MM-DD.json` - Detailed action log with metadata

## Example Output

```
[post-config-verify] ==========================================
[post-config-verify] POST-CONFIGURATION VERIFICATION COMPLETE
[post-config-verify] ==========================================
Overall Status: ✅ PASS
Steps: 4/4 passed
Duration: 4154ms
Summary: artifacts/post-config-verification-summary.json

✅ All post-configuration verification criteria met:
   - All verification commands: PASS
   - No hash drift: PASS
   - No parameter violations: PASS
   - Artifacts generated: PASS
```

## Integration with CI/CD

The post-configuration verification is designed for integration with CI/CD pipelines:

```yaml
- name: Post-Config Verification
  run: npm run post-config:verify
  timeout-minutes: 10
```

### Exit Codes

- `0`: All verification steps passed
- `1`: One or more verification steps failed  
- `2`: Fatal error during verification
- `130`: Interrupted by user (SIGINT)
- `143`: Terminated (SIGTERM)

## Error Handling

The verification system provides comprehensive error handling:

- **Critical Failures**: Any critical step failure stops the entire process
- **Timeouts**: Individual steps have configurable timeouts (default: 1-5 minutes)
- **Graceful Shutdown**: Handles SIGINT and SIGTERM signals properly
- **Detailed Logging**: All actions are logged with metadata for audit trails

## Testing

Run the test suite to validate the post-config verification:

```bash
# Test individual functionality
node tools/tests/post-config-verify.test.js

# Include in governance test suite  
npm run test:governance
```

## Configuration

The verification steps and their timeouts can be configured in `tools/post-config-verify.js`:

```javascript
const VERIFICATION_STEPS = [
  {
    name: 'governance-verify',
    cmd: ['npm', 'run', 'governance:verify'],
    description: 'Complete governance integrity check',
    critical: true,
    timeout: 300000 // 5 minutes
  },
  // ... other steps
];
```

## Troubleshooting

### Common Issues

1. **Timeout Errors**
   - Increase timeout values in the configuration
   - Check for hanging processes or services

2. **Hash Drift Violations**
   - Review changes in `artifacts/spec-hash-diff.json`
   - Use `npm run spec-hash:seal` if changes are authorized

3. **Parameter Violations**
   - Check `artifacts/param-integrity-matrix.json` for mismatches
   - Ensure configuration files are synchronized

4. **Missing Dependencies**
   - Run `npm ci` to ensure all dependencies are installed
   - Check that required services are available

### Debug Mode

For detailed debugging, check the generated log files:

```bash
# View detailed action log
cat artifacts/post-config-verify-$(date +%Y-%m-%d).json

# Check individual step artifacts
ls -la artifacts/
```

## Related Documentation

- [Governance Framework](../governance/) - Overall governance processes
- [Integrity Verification](../integrity/) - Hash verification details
- [Compliance Automation](../compliance/) - Compliance system overview
