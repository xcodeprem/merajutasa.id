# Boot Sequence Runbook: Local Development

## Overview

This runbook provides step-by-step instructions for starting the MerajutASA.id local development environment in the correct order to minimize startup errors and ensure proper service dependencies.

## Prerequisites

Before starting the boot sequence, ensure you have:

- [ ] Node.js >= 18.0.0 installed
- [ ] NPM >= 8.0.0 installed
- [ ] Repository cloned and dependencies installed (`npm install`)
- [ ] No processes running on ports 4601, 4602, 4603
- [ ] File system write access to `artifacts/` directory

### Quick Prerequisites Check

```bash
# Check Node.js version
node --version  # Should be >= 18.0.0

# Check NPM version
npm --version   # Should be >= 8.0.0

# Check port availability
lsof -i :4601   # Should return nothing
lsof -i :4602   # Should return nothing
lsof -i :4603   # Should return nothing

# Verify artifacts directory exists and is writable
ls -la artifacts/ && touch artifacts/.test && rm artifacts/.test
```

## Boot Sequence

Follow these steps in order. **Do not skip steps or start services in parallel.**

### Step 1: Start Signer Service (Port 4601)

The signer service provides cryptographic signing capabilities required by the chain service.

```bash
# Terminal 1: Start signer service
npm run service:signer
```

**Expected output:**
```
[signer] listening on 0.0.0.0:4601
```

**Health check:**
```bash
# In a new terminal
curl http://localhost:4601/pubkey
```

**Expected response:** JSON object with `publicKeyPem` field

⚠️ **Wait for signer to be fully ready before proceeding to Step 2**

### Step 2: Start Chain Service (Port 4602)

The chain service handles blockchain operations and requires the signer service for signature verification.

```bash
# Terminal 2: Start chain service
npm run service:chain
```

**Expected output:**
```
[chain] listening on 0.0.0.0:4602
```

**Health check:**
```bash
curl http://localhost:4602/health
```

**Expected response:** JSON object with `ok: true`

⚠️ **Wait for chain to be fully ready before proceeding to Step 3**

### Step 3: Start Collector Service (Port 4603)

The collector service handles event ingestion and processing.

```bash
# Terminal 3: Start collector service
npm run service:collector
```

**Expected output:**
```
[collector] listening on 0.0.0.0:4603
```

**Health check:**
```bash
curl http://localhost:4603/health
```

**Expected response:** JSON object with `ok: true` and pipeline information

### Step 4: Validate System Health

Once all three services are running, validate the complete system:

```bash
# Check all services are responsive
curl http://localhost:4601/pubkey && echo "✅ Signer OK"
curl http://localhost:4602/health && echo "✅ Chain OK"
curl http://localhost:4603/health && echo "✅ Collector OK"
```

### Step 5: Run Governance Verification

Final validation to ensure the system meets governance requirements:

```bash
# Run governance verification
npm run governance:verify
```

**Expected outcome:** All critical checks should pass with exit code 0.

**Success indicator:** The final message should read:
```
[governance-verify] Completed. See artifacts/governance-verify-summary.json
```

## Success Criteria

The boot sequence is successful when:

- [ ] All three services are listening on their respective ports
- [ ] Health checks for all services return success responses
- [ ] `npm run governance:verify` completes with exit code 0
- [ ] No error messages in service console outputs
- [ ] `artifacts/governance-verify-summary.json` shows all critical steps passed

## Troubleshooting

### Port Already in Use

If you get "EADDRINUSE" or "port already in use" errors:

```bash
# Find what's using the port (replace XXXX with the port number)
lsof -i :XXXX

# Kill the process using the port
kill -9 <PID>

# Or use environment variables to override ports
export SIGNER_PORT=14601
export CHAIN_PORT=14602
export COLLECTOR_PORT=14603
```

### Service Startup Failures

If any service fails to start:

1. **Check console output** for specific error messages
2. **Verify prerequisites** are met
3. **Check file permissions** in artifacts/ directory
4. **Ensure no conflicting processes** are running
5. **Restart in correct order** starting from Step 1

### Governance Verification Failures

If `npm run governance:verify` fails:

1. **Check the summary file**: `cat artifacts/governance-verify-summary.json`
2. **Look for specific failure artifacts** mentioned in the summary
3. **Ensure all services are running** and healthy
4. **Check for recent changes** that might affect governance rules

### Common Error Patterns

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` on health check | Service not fully started | Wait 2-3 seconds and retry |
| `signature_invalid` in chain logs | Signer not accessible | Ensure signer started first and is healthy |
| Governance verification timeout | Services overloaded | Restart services in sequence |
| Missing artifacts directory | File system permissions | Create directory: `mkdir -p artifacts` |

## Quick Commands Reference

```bash
# Start all services (use separate terminals)
npm run service:signer    # Terminal 1
npm run service:chain     # Terminal 2  
npm run service:collector # Terminal 3

# Health check all services
curl http://localhost:4601/pubkey
curl http://localhost:4602/health
curl http://localhost:4603/health

# Final validation
npm run governance:verify

# Emergency stop all (if needed)
pkill -f "service:"
```

## Environment Variables

Override default ports if needed:

```bash
export SIGNER_PORT=14601
export CHAIN_PORT=14602
export COLLECTOR_PORT=14603
export SIGNER_HOST=127.0.0.1
export CHAIN_HOST=127.0.0.1
export COLLECTOR_HOST=127.0.0.1
```

## Notes

- Services must be started **sequentially**, not in parallel
- Each service depends on the previous one being fully operational
- The governance verification is the final validation step
- Keep all three terminal windows open during development
- Services will run until manually stopped with Ctrl+C

## Next Steps

After successful boot sequence:

1. Review `artifacts/governance-verify-summary.json` for system status
2. Use the running services for development and testing
3. Monitor service logs for any runtime issues
4. Refer to service-specific documentation for API usage

---

*Last updated: This runbook covers the standard boot sequence for local development. For production deployments, see the production runbooks.*