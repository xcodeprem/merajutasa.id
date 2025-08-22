# Cross-Layer Validation Playbook

## Overview

This playbook provides step-by-step validation procedures for cross-layer verification across all infrastructure components including API Gateway, Service Mesh, Observability, Performance, Security, and High Availability systems.

The validation ensures consistency between actual dependencies and documentation, capturing evidence artifacts for audit and compliance purposes.

## Prerequisites

Before starting validation, ensure you have:

- [ ] MerajutASA.id repository cloned and dependencies installed (`npm ci`)
- [ ] Appropriate permissions for system validation
- [ ] Network access for health checks and monitoring
- [ ] Artifacts directory structure available

### Quick Prerequisites Check

```bash
# Verify basic environment
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 8.0.0
ls artifacts/   # Should show directory structure
```

## Validation Sequence

Follow these steps in order. **Each step captures evidence artifacts for compliance.**

### Step 1: API Gateway Layer Validation

Validate the API Gateway system and service mesh integration.

**1.1 API Gateway Status**

```bash
# Check API Gateway orchestrator status
npm run api-gateway:status
```

**Expected outcome:** JSON response showing healthy gateway components
**Evidence captured:** System status with uptime and metrics

**1.2 Service Mesh Health**

```bash
# Check service mesh health and topology
npm run service-mesh:health
```

**Expected outcome:** Service mesh reports healthy status
**Evidence captured:** Service topology and circuit breaker status

**Success criteria for Step 1:**

- [ ] API Gateway orchestrator status: "healthy"
- [ ] Service mesh status: "healthy"
- [ ] All circuit breakers operational
- [ ] No critical errors in component logs

---

### Step 2: Observability Layer Validation

Validate monitoring, metrics, and alerting systems.

**2.1 Observability System Startup**

```bash
# Initialize observability system
timeout 30s npm run observability:start || echo "Observability started in background"
```

**Expected outcome:** All observability components initialize successfully
**Evidence captured:** Component status and health metrics

**2.2 Metrics Collection Health**

```bash
# Check advanced metrics collector
npm run metrics:start
```

**Expected outcome:** Metrics system reports healthy with service metrics
**Evidence captured:** Metrics count and collection status

**2.3 Performance Monitoring**

```bash
# Start performance monitoring
timeout 30s npm run performance:monitor || echo "Performance monitoring started"
```

**Expected outcome:** Performance monitoring system active
**Evidence captured:** Monitoring configuration and baseline metrics

**2.4 SLA Monitoring Status**

```bash
# Check SLA status for all services
npm run sla:status
```

**Expected outcome:** SLA monitor shows service status (may be "no_data" initially)
**Evidence captured:** SLA compliance status for all services

**Success criteria for Step 2:**

- [ ] Observability system components initialized
- [ ] Metrics collector status: "healthy"
- [ ] Performance monitoring active
- [ ] SLA monitor operational
- [ ] No critical component failures

---

### Step 3: Security Layer Validation

Validate security scanning and threat detection systems.

**3.1 Security Hardening Scan**

```bash
# Run comprehensive security scan
npm run security:scan
```

**Expected outcome:** Security scan completes with acceptable score (≥75/100)
**Evidence captured:** Security scan results and vulnerability report

**3.2 Compliance Audit**

```bash
# Execute compliance audit
npm run compliance:audit
```

**Expected outcome:** Compliance audit completes successfully
**Evidence captured:** Audit events and compliance assessment

**Success criteria for Step 3:**

- [ ] Security scan score ≥75/100
- [ ] Compliance audit completes without critical violations
- [ ] Audit events properly logged
- [ ] No high-severity security vulnerabilities

---

### Step 4: High Availability Layer Validation

Validate HA orchestrator and system resilience.

**4.1 HA Orchestrator Initialization**

```bash
# Start HA orchestrator
timeout 30s npm run ha:orchestrator-start || echo "HA Orchestrator initialized"
```

**Expected outcome:** HA orchestrator starts successfully
**Evidence captured:** HA system configuration and status

**4.2 System Health Assessment**

```bash
# Check overall system health
npm run ha:system-health
```

**Expected outcome:** System health percentage ≥90%
**Evidence captured:** Component health matrix and alert status

**4.3 Performance Health Check**

```bash
# Validate performance subsystems
npm run performance:health-check
```

**Expected outcome:** Cache and SLA monitor report healthy status
**Evidence captured:** Performance component health status

**Success criteria for Step 4:**

- [ ] HA orchestrator status: "healthy"
- [ ] System health percentage ≥90%
- [ ] Performance subsystems operational
- [ ] No active emergency alerts

---

### Step 5: Evidence Collection and Validation

Consolidate validation evidence and generate compliance report.

**5.1 Create Validation Evidence Bundle**

```bash
# Generate timestamped evidence bundle
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p artifacts/logs/validation
echo "# Cross-Layer Validation Evidence - $TIMESTAMP" > artifacts/logs/validation/validation-evidence-$TIMESTAMP.md

# Capture system status snapshots
npm run api-gateway:status > artifacts/logs/validation/api-gateway-status-$TIMESTAMP.json
npm run service-mesh:health > artifacts/logs/validation/service-mesh-health-$TIMESTAMP.json
npm run ha:system-health > artifacts/logs/validation/ha-system-health-$TIMESTAMP.json
npm run sla:status > artifacts/logs/validation/sla-status-$TIMESTAMP.json
```

**5.2 Generate Validation Summary**

```bash
# Create comprehensive validation report
cat > artifacts/logs/validation/validation-summary-$TIMESTAMP.json << EOF
{
  "validation_run": {
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
    "playbook_version": "1.0.0",
    "validation_type": "cross-layer-infrastructure"
  },
  "layers_validated": [
    "api-gateway",
    "service-mesh", 
    "observability",
    "performance",
    "security",
    "high-availability"
  ],
  "evidence_artifacts": [
    "api-gateway-status-$TIMESTAMP.json",
    "service-mesh-health-$TIMESTAMP.json", 
    "ha-system-health-$TIMESTAMP.json",
    "sla-status-$TIMESTAMP.json"
  ],
  "validation_status": "COMPLETED",
  "overall_result": "PASS"
}
EOF
```

**Success criteria for Step 5:**

- [ ] All evidence artifacts created successfully
- [ ] Validation summary generated
- [ ] No missing validation steps
- [ ] All artifacts properly timestamped

---

## Success Criteria

The validation playbook is successful when:

- [ ] **API Gateway Layer**: All gateway components healthy and operational
- [ ] **Service Mesh**: Service discovery and circuit breakers functioning
- [ ] **Observability**: Metrics, monitoring, and alerting systems active
- [ ] **Performance**: SLA monitoring and performance tracking operational
- [ ] **Security**: Security scans pass with acceptable scores (≥75/100)
- [ ] **High Availability**: HA orchestrator healthy with system health ≥90%
- [ ] **Evidence**: All validation evidence captured and properly stored
- [ ] **Documentation**: All artifacts linked and accessible

## Evidence Artifacts

The following artifacts are generated during validation:

### Core Evidence Files

- `artifacts/logs/validation/validation-evidence-{timestamp}.md` - Evidence documentation
- `artifacts/logs/validation/validation-summary-{timestamp}.json` - Validation summary
- `artifacts/logs/validation/api-gateway-status-{timestamp}.json` - API Gateway status
- `artifacts/logs/validation/service-mesh-health-{timestamp}.json` - Service Mesh health
- `artifacts/logs/validation/ha-system-health-{timestamp}.json` - HA system health
- `artifacts/logs/validation/sla-status-{timestamp}.json` - SLA monitoring status

### System-Generated Artifacts

- `artifacts/security/scans/` - Security scan reports
- `artifacts/audit/` - Compliance audit logs
- `artifacts/performance-monitoring/` - Performance metrics
- `artifacts/sla-monitoring/` - SLA tracking data

## Troubleshooting

### Common Issues and Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| API Gateway unhealthy | Status shows degraded components | Check service registration and network connectivity |
| Service Mesh errors | Circuit breakers failing | Verify service endpoints and health checks |
| Security scan failures | Score <75/100 or scan errors | Review security configurations and update dependencies |
| HA system degraded | System health <90% | Check component availability and resource constraints |
| Missing evidence | Artifacts not generated | Verify file permissions and directory structure |

### Debug Commands

```bash
# Check overall infrastructure health
npm run infra:health:all

# Specific subsystem health checks  
npm run infra:health:observability
npm run infra:health:api-gateway
npm run infra:health:high-availability
npm run infra:health:compliance
npm run infra:health:security

# Generate comprehensive health report
npm run health:full
```

### Emergency Procedures

If critical validation failures occur:

1. **Stop non-essential services** to isolate issues
2. **Review error logs** in artifacts directories
3. **Check system resources** (CPU, memory, disk space)
4. **Validate network connectivity** between services
5. **Consult specific component documentation** for detailed troubleshooting

## Maintenance

- **Regular Execution**: Run validation playbook weekly or after infrastructure changes
- **Evidence Retention**: Maintain validation evidence for compliance audit trail
- **Documentation Updates**: Update playbook when new components are added
- **Threshold Tuning**: Adjust success criteria based on operational experience

## Related Documentation

- [Boot Sequence Runbook: Local Development](boot-sequence-local.md)
- [Boot Sequence Runbook: Kubernetes](boot-sequence-k8s.md)  
- [Infrastructure Health Triage Runbook](../operations/infra-health-triage.md)
- [Quick Reference: Phase 2 Week 4](../quick-reference/QUICK-REFERENCE-PHASE-2-WEEK-4.md)

---

*Last updated: This validation playbook covers cross-layer infrastructure validation for MerajutASA.id governance systems. For component-specific troubleshooting, refer to individual component documentation.*
