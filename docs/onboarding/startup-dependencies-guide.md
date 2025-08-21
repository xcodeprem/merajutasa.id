# Startup Dependencies & Health Check Guide

## Component Startup Order

The MerajutASA.id infrastructure follows a strict startup order to ensure proper dependency resolution and system stability.

### Phase 1: Foundation Validation

**Components:** `fileSystem`
**Description:** File system access validation
**Prerequisites:** None
**Health Check:** Validates access to core directories (`./artifacts`, `./data`, `./docs`, `./infrastructure`, `./tools`)

### Phase 2: Core Services

**Components:** `signer`, `chain`, `collector`
**Description:** Core services (can start in parallel)
**Prerequisites:** Phase 1 complete
**Health Check:** HTTP endpoint validation

```bash
# Start core services
npm run service:signer    # Port 4601
npm run service:chain     # Port 4602  
npm run service:collector # Port 4603
```

### Phase 3: Foundation Services

**Components:** `auditSystem`, `logAggregation`
**Description:** Foundation services for compliance and observability
**Prerequisites:** Phase 2 complete
**Health Check:** Component initialization and basic functionality

```bash
# Test foundation services
npm run audit:start
npm run observability:logs:start
```

### Phase 4: Compliance & Security Services

**Components:** `securityHardening`, `privacyRights`, `complianceAutomation`
**Description:** Week 6 compliance and security services
**Prerequisites:** Phase 3 complete (audit system required)
**Health Check:** Component health scoring and compliance metrics

```bash
# Start compliance & security
npm run security:hardening
npm run privacy:rights
npm run compliance:automation
```

### Phase 5: Orchestration Services

**Components:** `complianceOrchestrator`, `observability`
**Description:** Orchestration and monitoring services
**Prerequisites:** Phase 4 complete (requires compliance components)
**Health Check:** Cross-component integration validation

```bash
# Start orchestration
npm run compliance:orchestrator
npm run observability:start
```

### Phase 6: Infrastructure Services

**Components:** `haOrchestrator`, `apiGateway`, `performance`
**Description:** High-level infrastructure services
**Prerequisites:** Phase 5 complete (requires core services)
**Health Check:** End-to-end infrastructure validation

```bash
# Start infrastructure services
npm run ha:orchestrator-start
npm run api-gateway:start
npm run performance:start
```

## Component Dependencies

### Hard Dependencies

- `complianceOrchestrator` → requires: `auditSystem`, `securityHardening`, `privacyRights`, `complianceAutomation`
- `observability` → requires: `logAggregation`
- `apiGateway` → requires: `signer`, `chain`, `collector`
- `haOrchestrator` → requires: `signer`, `chain`, `collector`
- `performance` → requires: `observability`

### Soft Dependencies

- All Week 6 components benefit from audit system being available
- Infrastructure services work better with observability running
- HA components can bootstrap without full stack but provide better resilience with complete setup

## Health Check Commands

### Comprehensive Health Checks

```bash
# Full system health check (all 35+ components)
npm run health:full

# Core services only
npm run health:core

# Week 6 compliance & security components only  
npm run health:week6

# Infrastructure components only
npm run health:infra

# Quick status overview
npm run week6:components-status
```

### Component-Specific Health Checks

```bash
# Individual components
npm run infra:health:observability
npm run infra:health:performance
npm run infra:health:api-gateway
npm run infra:health:high-availability
npm run infra:health:compliance
npm run infra:health:security
```

### Integration Testing

```bash
# Week 6 integration flow
npm run week6:integration-flow

# Full Week 6 validation
npm run week6:validate

# Dependency verification
npm run week6:dependency-check
```

## Health Check Scoring

### Health Score Ranges

- **100-80:** `healthy` - Component operating optimally
- **79-50:** `warning` - Minor issues, monitoring recommended  
- **49-20:** `degraded` - Performance issues, investigation needed
- **19-0:** `critical` - Component failure, immediate action required

### Health Check Factors

#### Core Services (signer, chain, collector)

- HTTP endpoint responsiveness
- Service port availability
- Basic functionality validation

#### Week 6 Components

- **Audit System:** Event recording capability, storage access, compliance mode
- **Compliance Automation:** Framework coverage, assessment completion, alert management
- **Security Hardening:** Threat detection, configuration security, automated response
- **Privacy Rights:** Request processing, jurisdiction coverage, response time compliance
- **Compliance Orchestrator:** Component integration, health monitoring, event correlation

#### Infrastructure Services

- **HA Orchestrator:** Multi-region readiness, failover capability, backup systems
- **Observability:** Metrics collection, log aggregation, alerting systems
- **API Gateway:** Route management, rate limiting, security policies
- **Performance Monitor:** Resource utilization, response times, throughput metrics

## Troubleshooting Common Issues

### Service Won't Start

1. Check if required ports are available: `npm run health:core`
2. Verify file system permissions: `npm run health:check fileSystem`
3. Review startup order dependencies: `npm run startup:order`

### Health Check Failures

1. **Critical scores:** Check component logs and restart service
2. **Degraded performance:** Review resource utilization and configuration
3. **Warning status:** Monitor metrics and investigate potential issues

### Integration Issues

1. Verify component dependencies are running: `npm run health:week6`
2. Check cross-component communication: `npm run week6:integration-test`
3. Validate audit system availability: `npm run audit:start`

## Environment Variables

### Required for Health Checks

```bash
# Core service ports
SIGNER_PORT=4601
CHAIN_PORT=4602
COLLECTOR_PORT=4603

# Week 6 compliance & security
COMPLIANCE_THRESHOLD=85
AUDIT_RETENTION_DAYS=30
PRIVACY_RESPONSE_DAYS=30
SECURITY_SCAN_DEPTH=deep
THREAT_SENSITIVITY=medium
INCIDENT_AUTO_RESPONSE=true
```

### Optional Configuration

```bash
# Health check intervals
HEALTH_CHECK_TIMEOUT=10
HEALTH_CHECK_INTERVAL=30

# Alerting thresholds
ALERT_THRESHOLDS_P95=200
ALERT_THRESHOLDS_P99=500
ALERT_AVAILABILITY=99.9
```

## Monitoring Integration

### Health Check Reports

- **Location:** `./artifacts/integrated-health-check-report.json`
- **Format:** JSON with component details, dependency graph, recommendations
- **Frequency:** On-demand via health check commands

### Metrics Collection

- Component health scores tracked over time
- Dependency resolution validation
- Performance impact assessment
- Alert correlation with health status

### Automated Alerts

- Critical component failures trigger immediate alerts
- Degraded performance generates monitoring recommendations
- Dependency violations raise integration warnings
- Health trend analysis provides proactive insights
