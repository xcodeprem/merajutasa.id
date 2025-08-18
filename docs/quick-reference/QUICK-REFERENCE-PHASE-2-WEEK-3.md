# Quick Reference - Phase 2 Week 3: Advanced Monitoring & Observability

## Essential Commands 🚀

### System Operations

```bash
# Complete system management
npm run observability:start              # Start unified observability system
npm run observability:health-check       # Check system health status
npm run observability:benchmark          # Run performance benchmarks
npm run observability:export             # Export observability data

# Phase 2 Week 3 specific
npm run week3:status                     # Validate implementation (85%+ expected)
npm run week3:demo                       # Interactive 10-step demonstration
```

### Component Operations

```bash
# Individual component management
npm run tracing:start                    # Initialize distributed tracing
npm run metrics:start                    # Start metrics collection
npm run alerting:start                   # Initialize alerting system
npm run logs:start                       # Start log aggregation
npm run anomaly:start                    # Initialize anomaly detection
npm run dashboards:start                 # Start real-time dashboards
npm run dashboards:open                  # Open dashboard in browser
```

## Key URLs & Endpoints 🌐

### Dashboards

- **Main Dashboard**: <http://localhost:3000/>
- **System Overview**: <http://localhost:3000/> (default view)
- **API Status**: <http://localhost:3000/api/dashboards>
- **Health Check**: <http://localhost:3000/health>

### External Integrations (Optional)

- **Jaeger UI**: <http://localhost:16686/> (if Jaeger running)
- **Prometheus Metrics**: <http://localhost:3000/metrics>
- **API Documentation**: <http://localhost:3000/api/>

## Quick Integration Patterns 🔧

### 1. Trace Business Operations

```javascript
import { getAdvancedObservabilitySystem } from './infrastructure/observability/advanced-observability-system.js';

const observability = getAdvancedObservabilitySystem();

// Trace any business operation
await observability.traceBusinessOperation('user_action', async (span) => {
  span.setAttributes({ userId: user.id, action: 'document_sign' });
  return await processUserAction();
}, { operationId: requestId });
```

### 2. Record Custom Metrics

```javascript
// Quick metric recording
observability.recordUnifiedMetric('custom_event', 1, {
  type: 'user_interaction',
  component: 'header',
  logLevel: 'info'
});
```

### 3. Structured Logging

```javascript
const logging = observability.components.get('logging');

// Different log types
logging.info('Operation successful', { userId, operationId });
logging.audit('document_signed', userId, documentId, 'success');
logging.security('login_attempt', 'medium', 'Failed login', { ip, attempts });
```

### 4. Create Custom Alerts

```javascript
observability.createUnifiedAlert(
  'custom_alert_name',
  'high',                           // severity: critical, high, medium, low
  'Custom alert description',
  { channels: ['email', 'slack'] }
);
```

## Component Architecture Map 🗺️

```
┌─────────────────────────────────────────────────────────────┐
│                Advanced Observability System                │
├─────────────────────────────────────────────────────────────┤
│ 🔍 Distributed Tracing   │ 📊 Advanced Metrics            │
│ - OpenTelemetry/Jaeger   │ - Prometheus + Business        │
│ - End-to-end tracking    │ - 25+ metric types            │
│ - 500+ ops/sec           │ - 2,000+ ops/sec              │
├─────────────────────────────────────────────────────────────┤
│ 🚨 Intelligent Alerting  │ 📝 Log Aggregation            │
│ - Multi-channel alerts   │ - Structured logs             │
│ - Escalation policies    │ - Pattern detection           │
│ - 300+ evals/sec         │ - 2,000+ entries/sec          │
├─────────────────────────────────────────────────────────────┤
│ 🤖 Anomaly Detection     │ 📱 Real-time Dashboards       │
│ - Statistical + Business │ - Socket.IO streaming         │
│ - Adaptive baselines     │ - 4 dashboard types           │
│ - 200+ detections/sec    │ - 400+ updates/sec            │
└─────────────────────────────────────────────────────────────┘
```

## Metric Types Reference 📊

### System Metrics

- `http_requests_total` - HTTP request counter
- `http_request_duration` - Request latency histogram
- `error_rate` - Current error rate percentage
- `cpu_usage_percent` - CPU utilization
- `memory_usage_percent` - Memory utilization

### Business Metrics

- `signing_operations_total` - Document signing operations
- `chain_integrity_score` - Blockchain integrity percentage
- `governance_verifications_total` - Governance checks
- `equity_score_distribution` - Equity scoring histogram
- `policy_compliance_score` - Policy compliance percentage

### Performance Metrics

- `cache_hit_ratio` - Cache effectiveness
- `database_connections_active` - DB connection pool
- `response_time_p95` - 95th percentile response time
- `throughput_ops_per_second` - Operations throughput

## Alert Severity Levels 🚨

| Level | Description | Channels | Response Time |
|-------|-------------|----------|---------------|
| **Critical** | System down, data loss | Email, Slack, PagerDuty | Immediate |
| **High** | Degraded performance | Email, Slack | < 15 minutes |
| **Medium** | Warning conditions | Slack | < 1 hour |
| **Low** | Informational | Console, Log | Best effort |

## Log Levels & Types 📝

### Log Levels

- `error` - Error conditions requiring attention
- `warn` - Warning conditions, degraded performance
- `info` - Informational messages, normal operations
- `debug` - Detailed debugging information
- `trace` - Very detailed tracing information

### Log Types

- `application` - Standard application logs
- `audit` - Governance and compliance events
- `access` - HTTP request/response logs
- `security` - Authentication and authorization
- `performance` - Operation timing and metrics

## Dashboard Widget Types 📱

### Available Widgets

- **Gauge** - System health scores, percentages
- **Line Chart** - Time-series trends and patterns
- **Bar Chart** - Categorical data comparison
- **Multi-Line Chart** - Multiple metrics comparison
- **Status Grid** - Service health matrix
- **Alert List** - Active alerts with severity
- **Number Display** - Single metric values

### Dashboard Types

1. **System Overview** - High-level health and performance
2. **Business Metrics** - KPIs and governance metrics
3. **Performance Analysis** - Detailed performance trends
4. **Security Monitoring** - Security events and threats

## Environment Variables 🔧

### Required (Optional with defaults)

```bash
NODE_ENV=development                     # Environment mode
DASHBOARD_PORT=3000                      # Dashboard server port
```

### External Integrations (Optional)

```bash
# Distributed Tracing
JAEGER_ENDPOINT=http://localhost:14268/api/traces

# Caching
REDIS_HOST=localhost
REDIS_PORT=6379

# Email Alerts
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
SMTP_FROM=alerts@merajutasa.id

# Slack Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK

# PagerDuty Alerts
PAGERDUTY_INTEGRATION_KEY=your-integration-key
```

## Performance Benchmarks ⚡

### Expected Performance (Local Development)

| Component | Throughput | Latency P95 | Memory Usage |
|-----------|------------|-------------|--------------|
| Metrics Collection | 2,000 ops/sec | 2ms | 15MB |
| Distributed Tracing | 500 ops/sec | 8ms | 20MB |
| Log Generation | 2,000 ops/sec | 1ms | 10MB |
| Alert Processing | 300 ops/sec | 5ms | 8MB |
| Anomaly Detection | 200 ops/sec | 15ms | 12MB |
| Dashboard Updates | 400 ops/sec | 3ms | 25MB |

### Production Scaling

- **Horizontal Scaling**: All components support distributed deployment
- **Resource Requirements**: 2-4 CPU cores, 4-8GB RAM per instance
- **Storage**: 10GB+ for logs and metrics retention
- **Network**: 100Mbps+ for metric streaming

## Health Check Indicators 🏥

### System Health Status

```bash
# Quick health check
npm run observability:health-check

# Expected healthy output:
{
  "status": "healthy",
  "components": {
    "tracing": { "status": "healthy", "activeSpans": 0 },
    "metrics": { "status": "healthy", "totalMetrics": 25 },
    "alerting": { "status": "healthy", "activeAlerts": 0 },
    "logging": { "status": "healthy", "streams": 6 },
    "anomalyDetection": { "status": "healthy", "detectors": 12 },
    "dashboards": { "status": "healthy", "connectedClients": 0 }
  }
}
```

### Component Health Indicators

- ✅ **Green**: All systems operational
- 🟡 **Yellow**: Degraded performance, non-critical
- 🔴 **Red**: Critical failure, immediate attention required

## Troubleshooting Quick Fixes 🔧

### Common Issues & Solutions

#### Port Conflicts

```bash
# Check port usage
lsof -i :3000

# Use different port
export DASHBOARD_PORT=3001
npm run dashboards:start
```

#### High Memory Usage

```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"

# Monitor memory
node -e "setInterval(() => console.log('Memory:', Math.round(process.memoryUsage().heapUsed/1024/1024), 'MB'), 5000)"
```

#### Component Not Starting

```bash
# Check dependencies
npm ci

# Verify file permissions
chmod +x infrastructure/observability/**/*.js

# Reset and restart
npm run observability:start
```

#### Dashboard Not Loading

```bash
# Verify dashboard server
curl http://localhost:3000/health

# Check browser console for errors
# Ensure JavaScript is enabled
# Try different browser
```

## File Locations 📁

### Core Implementation

```
infrastructure/observability/
├── advanced-observability-system.js    # Main orchestrator (28.4KB)
├── tracing/distributed-tracing.js       # Distributed tracing (10.6KB)
├── metrics/advanced-metrics-collector.js # Metrics collection (16.9KB)
├── alerting/intelligent-alerting.js     # Alerting system (24.8KB)
├── logs/log-aggregation.js             # Log aggregation (24.0KB)
├── anomaly/anomaly-detection.js        # Anomaly detection (23.9KB)
└── dashboards/real-time-dashboards.js  # Real-time dashboards (28.4KB)
```

### Tools & Utilities

```
tools/
├── phase2-week3-status.js              # Status validation (23.4KB)
├── phase2-week3-demo.js                # Interactive demo (20.0KB)
└── observability-benchmark.js          # Performance benchmark (23.0KB)
```

### Documentation

```
docs/
├── phase-2/PHASE-2-WEEK-3-DELIVERY-DOCUMENTATION.md
├── team-guides/TEAM-SETUP-GUIDE-PHASE-2-WEEK-3.md
└── quick-reference/QUICK-REFERENCE-PHASE-2-WEEK-3.md
```

## Support & Resources 🆘

### Getting Help

1. **Team Chat**: #observability-support
2. **Documentation**: `/docs/phase-2/` directory
3. **Code Examples**: `/tools/` directory demos
4. **Issue Tracking**: GitHub issues

### Useful Links

- **OpenTelemetry Docs**: <https://opentelemetry.io/docs/>
- **Prometheus Docs**: <https://prometheus.io/docs/>
- **Socket.IO Docs**: <https://socket.io/docs/>

### Emergency Commands

```bash
# Stop all observability components
pkill -f "observability"

# Reset system state
rm -rf logs/ artifacts/observability-*

# Restart from clean state
npm run observability:start
```

---

**Status**: ✅ Phase 2 Week 3 Complete  
**Next**: Phase 2 Week 4 - API Gateway & Management  
**Support**: #observability-support channel
