# Infrastructure Health Monitoring System

## Overview

The Unified Health Monitoring System provides comprehensive health checking across all 37 infrastructure components, organized into logical categories for better operational visibility and debugging capability.

## Quick Start

```bash
# Master health check (all components)
npm run infra:health-check-all

# Health dashboard (visual overview)
npm run infra:health-dashboard

# Category-specific health checks
npm run infra:health-performance
npm run infra:health-observability
npm run infra:health-security
npm run infra:health-compliance
npm run infra:health-governance
npm run infra:health-integrations
npm run infra:health-dependencies
```

## Component Categories

### API Gateway (4 components)
- `api-gateway-core` - Core gateway functionality
- `api-gateway-orchestrator` - Gateway orchestration
- `openapi-documentation` - API documentation system
- `service-mesh` - Service mesh implementation

### Auth (1 component)
- `auth-middleware` - Authentication middleware

### Backup (1 component)
- `backup-service` - Backup and recovery service

### CI/CD (1 component)
- `pipeline-manager` - CI/CD pipeline management

### Compliance (4 components)
- `audit-system` - Enterprise audit system
- `compliance-automation` - Compliance automation
- `compliance-orchestrator` - Compliance orchestration
- `privacy-rights-management` - Privacy rights management

### Governance (2 components)
- `component-dependency-analyzer` - Dependency analysis
- `infrastructure-integration-platform` - Platform integration

### High Availability (6 components)
- `auto-scaling` - Auto-scaling system
- `disaster-recovery` - Disaster recovery
- `fault-tolerance` - Fault tolerance system
- `ha-orchestrator` - HA orchestration
- `health-monitoring` - Health monitoring
- `multi-region-deployment` - Multi-region deployment

### Monitoring (2 components)
- `metrics-collector` - Metrics collection
- `structured-logger` - Structured logging

### Observability (6 components)
- `advanced-observability-system` - Advanced observability
- `intelligent-alerting` - Intelligent alerting
- `anomaly-detection` - Anomaly detection
- `real-time-dashboards` - Real-time dashboards
- `advanced-metrics-collector` - Advanced metrics
- `distributed-tracing` - Distributed tracing

### Performance (7 components)
- `performance-monitor` - Performance monitoring
- `sla-monitor` - SLA monitoring
- `cache-strategies` - Cache strategies
- `redis-manager` - Redis management
- `enhanced-signer` - Enhanced signer service
- `response-compression` - Response compression
- `connection-pool` - Connection pooling

### Security (3 components)
- `security-hardening` - Security hardening
- `input-validator` - Input validation
- `rate-limiter` - Rate limiting

## Health Check Features

### Automated Discovery
- Automatically discovers and registers all infrastructure components
- Supports multiple health check patterns:
  - `healthCheck()` method
  - `getHealthStatus()` method
  - Component loadability check (fallback)

### Health Status Types
- **Healthy**: Component is functioning normally
- **Unhealthy**: Component has issues requiring attention
- **Unknown**: Component status cannot be determined
- **Error**: Component failed to load or threw an error

### Response Time Monitoring
- Tracks health check response times
- Configurable timeout (default: 5 seconds)
- Retry logic for failed checks

### Report Generation
Health checks generate JSON reports in the `artifacts/` directory:
- `infrastructure-health-report.json` - Complete health report
- `component-health-matrix.json` - Health matrix for dashboard
- `{category}-health-report.json` - Category-specific reports

## Health Dashboard

The health dashboard provides a visual overview of infrastructure health:

```bash
npm run infra:health-dashboard
```

### Features
- ASCII table showing health status by category
- Detailed breakdown of unhealthy components
- Recommendations for fixing issues
- Health badge generation
- Recent report caching (5-minute threshold)

### Sample Output
```
🏥 INFRASTRUCTURE HEALTH DASHBOARD
================================================================================
Last Check: 8/18/2025, 10:26:23 PM
Duration: 169ms
Overall Status: DEGRADED
Health Score: 81%

📊 COMPONENT HEALTH MATRIX
+-------------------+-------+---------+-----------+----------+--------------+
| Category          | Total | Healthy | Unhealthy | Health % | Status       |
+-------------------+-------+---------+-----------+----------+--------------+
| PERFORMANCE       | 7     | 7       | 0         | 100%     | ✅ HEALTHY    |
| SECURITY          | 3     | 3       | 0         | 100%     | ✅ HEALTHY    |
| OBSERVABILITY     | 6     | 1       | 5         | 17%      | ⚠️  DEGRADED |
+-------------------+-------+---------+-----------+----------+--------------+
```

## Integration Health Checks

### Component Dependencies
```bash
npm run infra:health-dependencies
```
- Analyzes component dependencies using the Component Dependency Analyzer
- Detects circular dependencies
- Provides dependency documentation
- Maps critical paths

### Integration Components
```bash
npm run infra:health-integrations
```
- Checks integration platform components
- Validates cross-component communication
- Monitors integration health

## Configuration

### Health Monitor Configuration
```javascript
const config = {
  checkInterval: 30000,    // Health check interval (ms)
  timeout: 5000,          // Health check timeout (ms) 
  retries: 2              // Number of retries for failed checks
};
```

### Component Categories
Components are automatically categorized based on their file paths:
- `infrastructure/api-gateway/*` → api-gateway
- `infrastructure/security/*` → security
- `infrastructure/performance/*` → performance
- etc.

## Best Practices

### For Component Developers
1. **Implement Health Checks**: Add a `healthCheck()` method to your components
2. **Return Structured Status**: Use consistent health status format:
   ```javascript
   {
     status: 'healthy|unhealthy|degraded',
     message: 'Description of current state',
     details: { /* additional info */ }
   }
   ```
3. **Include Dependencies**: Check external dependencies in health checks
4. **Timeout Handling**: Implement proper timeout handling

### For Operations Teams
1. **Regular Monitoring**: Run `npm run infra:health-dashboard` regularly
2. **Category Focus**: Use category-specific checks for troubleshooting
3. **Trend Analysis**: Monitor health reports over time
4. **Alerting Integration**: Consider integrating with monitoring systems

## Troubleshooting

### Common Issues

#### Missing Dependencies
Some components may show as unhealthy due to missing packages:
```bash
npm install nodemailer socket.io prom-client @opentelemetry/auto-instrumentations-node
```

#### Duplicate Exports
Components with duplicate exports need code fixes:
- Check for conflicting export statements
- Ensure unique export names

#### Module Not Found
Components referencing non-existent modules:
- Verify file paths in import statements
- Check if referenced modules exist

### Debug Commands
```bash
# Check specific category in detail
npm run infra:health-observability

# Run dependency analysis
npm run infra:health-dependencies

# View full health report
cat artifacts/infrastructure-health-report.json | jq
```

## API Reference

### UnifiedHealthMonitor Class
```javascript
import { getUnifiedHealthMonitor } from './infrastructure/integration/unified-health-monitor.js';

const monitor = getUnifiedHealthMonitor();

// Check all components
const report = await monitor.checkAllComponentsHealth();

// Check specific category  
const categoryHealth = await monitor.checkCategoryHealth('performance');

// Get health summary
const summary = monitor.getHealthSummary();

// Get component matrix
const matrix = monitor.getComponentHealthMatrix();
```

### Health Report Structure
```json
{
  "overall": {
    "status": "healthy|degraded",
    "totalComponents": 37,
    "healthyComponents": 30,
    "unhealthyComponents": 7,
    "healthyPercentage": 81,
    "duration": 169,
    "timestamp": "2025-08-18T22:26:23.000Z"
  },
  "categories": {
    "performance": {
      "category": "performance",
      "totalComponents": 7,
      "healthyComponents": 7,
      "unhealthyComponents": 0,
      "components": [...]
    }
  }
}
```

## Integration with CI/CD

### GitHub Actions
```yaml
- name: Infrastructure Health Check
  run: npm run infra:health-check-all
  
- name: Upload Health Reports
  uses: actions/upload-artifact@v3
  with:
    name: health-reports
    path: artifacts/*-health-report.json
```

### Monitoring Integration
Health reports can be integrated with monitoring systems like Prometheus, Grafana, or custom dashboards by parsing the JSON reports in `artifacts/`.

## Metrics and KPIs

- **Overall Health Percentage**: Target >95%
- **Category Health**: All categories should be >90%
- **Response Time**: Health checks should complete <5s
- **Availability**: Infrastructure should maintain >99.9% uptime

## Support

For issues or questions about the health monitoring system:
1. Check the troubleshooting section above
2. Run category-specific health checks for detailed diagnostics
3. Review component-specific logs and error messages
4. Consult the component health matrix for patterns