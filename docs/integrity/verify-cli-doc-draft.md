# CLI Verification Guide

Comprehensive guide for manually verifying MerajutASA governance artifacts, credential signatures, and chain integrity.

## Prerequisites

- Node.js LTS (v18+)
- Access to repository files
- Basic command line knowledge

## Quick Start

```bash
# Verify governance integrity
npm run governance:verify

# Verify specific components
npm run spec-hash:verify
npm run param:integrity
npm run test:all
```

## Detailed Verification Steps

### 1. Hash Integrity Verification

Verify that all governed documents match their recorded hashes:

```bash
# Check hash integrity status
node tools/spec-hash-diff.js --mode=verify

# Report only (non-failing)
node tools/spec-hash-diff.js --mode=report-only

# View detailed violations
cat artifacts/spec-hash-diff.json
```

**Expected Output:**

- `violations=0` indicates all files match their hashes
- Any violations indicate files changed without proper governance

### 2. Parameter Integrity Check

Validate that governance parameters are consistent:

```bash
# Run parameter integrity check
node tools/param-integrity.js

# View parameter matrix
cat artifacts/param-integrity-matrix.json
```

**Expected Output:**

- Status: `PASS`
- All parameters show `MATCH` status

### 3. Signature Verification

Verify cryptographic signatures on critical artifacts:

```bash
# Check DEC canonical hashes
node tools/tests/dec-canonical-hash-equivalence.test.js

# Verify decision document integrity
node tools/dec-lint.js
```

### 4. Service Health Checks

Verify core services are functional:

```bash
# Test service integration
node tools/tests/services-integration.test.js

# Test specific services
npm run test:signer-e2e
npm run test:collector
```

### 5. Evidence Validation

Verify evidence artifacts and avoid hash collisions:

```bash
# Validate evidence bundle
node tools/evidence-bundle.js

# Check for hash collisions
node tools/evidence-collision-test.js

# Verify evidence freshness
node tools/evidence-freshness.js
```

## Troubleshooting

### Hash Integrity Violations

If `spec-hash:verify` fails with violations:

1. **Check what changed:**

   ```bash
   node tools/spec-hash-diff.js --mode=report-only
   cat artifacts/spec-hash-diff.json
   ```

2. **For authorized changes**, seal new hashes:

   ```bash
   npm run spec-hash:seal
   ```

3. **For README-only changes**, use auto-seal:

   ```bash
   npm run spec-hash:auto-seal-readme
   ```

### Parameter Mismatches

If parameter integrity fails:

1. **Check specific mismatches:**

   ```bash
   cat artifacts/param-integrity-matrix.json | jq '.parameters[] | select(.status != "MATCH")'
   ```

2. **Review parameter definitions** in DEC documents
3. **Update configurations** to match governance decisions

### Service Failures

If services fail to start:

1. **Check port conflicts:**
    - macOS/Linux:

       ```bash
       lsof -i :4601 -i :4602 -i :4603
       ```

    - Windows (PowerShell):

       ```powershell
       Get-NetTCPConnection -LocalPort 4601,4602,4603 | Format-Table -AutoSize
       ```

2. **Review service logs** in stdout/stderr
3. **Verify dependencies** are installed

## Verification Artifacts

All verification tools generate artifacts in `artifacts/`:

- `spec-hash-diff.json` - Hash integrity report
- `param-integrity-matrix.json` - Parameter consistency matrix  
- `governance-verify-summary.json` - Overall governance status
- `evidence-collision-test.json` - Hash collision analysis
- `dec-lint.json` - Decision document validation

## API Verification (Programmatic)

For automated verification:

```javascript
// Example: Check governance status
import { spawn } from 'child_process';

const result = await new Promise((resolve) => {
  const proc = spawn('npm', ['run', 'governance:verify']);
  proc.on('close', (code) => resolve(code === 0));
});

console.log(`Governance status: ${result ? 'PASS' : 'FAIL'}`);
```

## Windows PowerShell quick recipes

Use these end-to-end snippets on Windows (PowerShell v5+). They spin up ephemeral jobs, run checks, and then clean up.

- Governance verify (core):

   ```powershell
   npm run governance:verify
   ```

- Signer + Chain: append a signed canonical item, verify chain, and cleanup:

   ```powershell
   npm run chain:append
   ```

- Collector smoke: start collector, ingest one sample event, then stop:

   ```powershell
   $c = Start-Job -ScriptBlock { node tools/services/collector.js }
   Start-Sleep -Seconds 1
   npm run collector:smoke
   Get-Job | Remove-Job -Force
   ```

- Equity UI + Perf/A11y smoke (serves <http://127.0.0.1:4620/>):

   ```powershell
   $e = Start-Job -ScriptBlock { node tools/services/equity.js }
   Start-Sleep -Seconds 1
   npm run perf:budget
   npm run a11y:smoke
   Start-Process http://127.0.0.1:4620/
   Get-Job | Remove-Job -Force
   ```

- Gate 1 verification summary and artifact snapshot:

   ```powershell
   npm run gate:1
   npm run snapshot:artifacts
   ```

- Spec hash + parameter integrity (artifacts: spec-hash-diff.json, param-integrity-matrix.json):

   ```powershell
   npm run spec-hash:verify; npm run param:integrity
   ```

## Bash equivalents (optional)

If you’re on macOS/Linux:

```bash
# Governance verify
npm run governance:verify

# Signer + Chain append (same as PowerShell one-liner)
npm run chain:append

# Collector smoke
(node tools/services/collector.js &); sleep 1; npm run collector:smoke; kill %1 || true

# Equity UI + Perf/A11y
(node tools/services/equity.js &); sleep 1; npm run perf:budget; npm run a11y:smoke; kill %1 || true

# Gate 1 and snapshot
npm run gate:1
npm run snapshot:artifacts

# Hash and params
npm run spec-hash:verify && npm run param:integrity
```

## Exit Codes

- `0` - Verification passed
- `1` - Verification failed (violations found)
- `2` - Tool error or invalid usage

## Security Considerations

- Always verify on a clean repository clone
- Check git commit signatures when available  
- Validate artifact timestamps for freshness
- Report any unexpected verification failures

---

**Last Updated:** 2025-08-16  
**Version:** 2.0 (Enhanced with comprehensive CLI coverage)

Algorithm: SHA-256 over canonical JSON (sorted keys, UTF-8, LF line endings).

## 5. Troubleshooting

- Mismatch prevHash: likely out-of-order append.
- Signature invalid: ensure correct key version.
- Hash mismatch: re-run canonicalization (remove volatile fields, sort keys).

## 6. Next

- Expand automation examples (CI snippets) after stabilizing H1 guard and dashboard assets.

> Draft; finalize after signer & chain MVP live.
