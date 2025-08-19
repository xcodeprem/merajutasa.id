# Team Setup Guide - Phase 2 Week 3: Advanced Monitoring & Observability

## Overview 🎯

This guide provides step-by-step instructions for team members to set up and use the advanced monitoring and observability infrastructure implemented in Phase 2 Week 3. The setup process takes approximately **30-45 minutes** and covers all observability components.

## Prerequisites 📋

### System Requirements

- **Node.js**: Version 18.0.0 or higher
- **NPM**: Version 8.0.0 or higher
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: 2GB free space for logs and metrics
- **Network**: Stable internet connection for external integrations

### Optional External Dependencies

- **Redis**: For distributed caching (can run without)
- **Jaeger**: For distributed tracing visualization (can run without)
- **SMTP Server**: For email alerts (can use console alerts)
- **Slack Workspace**: For Slack alerts (optional)

### Development Tools

- **Web Browser**: Modern browser for dashboard access
- **Terminal/Command Prompt**: For running npm scripts
- **Code Editor**: VS Code recommended for configuration editing

## Quick Start (5 minutes) 🚀

### 1. Clone and Install

```bash
# If not already done
git clone https://github.com/codingxdev0/merajutasa.id.git
cd merajutasa.id

# Install dependencies
npm ci

# Verify installation
npm run week3:status
```

### 2. Start Observability System

```bash
# Initialize complete observability infrastructure
npm run observability:start

# Verify system health
npm run observability:health-check
```

### 3. Access Real-time Dashboards

```bash
# Open dashboards in browser
npm run dashboards:open

# Or manually navigate to: http://localhost:3000
```

### 4. Run Interactive Demo

```bash
# Experience all observability features
npm run week3:demo
```

## Detailed Setup Instructions

### Step 1: Validate Environment ✅

First, ensure your development environment meets the requirements:

```bash
# Check Node.js version
node --version
# Should be v18.0.0 or higher

# Check NPM version
npm --version
# Should be 8.0.0 or higher

# Verify repository status
npm run governance:verify
# Should pass all governance checks

# Validate Phase 2 Week 3 implementation
npm run week3:status
# Should show 80%+ implementation score
```

**Expected Output:**

```
🎯 Overall Score: 85/100
📦 Components: 7/7 implemented (≥80%)
🟢 Excellent (90-100%): 4 components
🟡 Good (80-89%): 3 components
```

### Step 2: Configure Observability Components 🔧

#### 2.1 Distributed Tracing Configuration

Create tracing configuration:

```bash
# Test distributed tracing
npm run tracing:start
```

**Optional Jaeger Setup:**

```bash
# Run Jaeger locally (Docker required)
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 14268:14268 \
  jaegertracing/all-in-one:latest

# Set Jaeger endpoint
export JAEGER_ENDPOINT=http://localhost:14268/api/traces
```

#### 2.2 Metrics Collection Configuration

```bash
# Initialize metrics collector
npm run metrics:start

# Test custom metrics
node -e "
import('./infrastructure/observability/metrics/advanced-metrics-collector.js')
  .then(m => {
    const metrics = m.getAdvancedMetricsCollector();
    metrics.recordCustomMetric('test_metric', 'set', 42);
    console.log('✅ Custom metric recorded');
  })
"
```

#### 2.3 Alerting System Configuration

Configure alert channels (optional):

```bash
# Email alerts (optional)
export SMTP_HOST=smtp.your-email-provider.com
export SMTP_PORT=587
export SMTP_USER=your-email@domain.com
export SMTP_PASS=your-email-password
export SMTP_FROM=alerts@merajutasa.id

# Slack alerts (optional)
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# PagerDuty alerts (optional)
export PAGERDUTY_INTEGRATION_KEY=your-pagerduty-integration-key
```

Test alerting system:

```bash
npm run alerting:start
```

#### 2.4 Log Aggregation Configuration

```bash
# Initialize log aggregation
npm run logs:start

# Test log generation
node -e "
import('./infrastructure/observability/logs/log-aggregation.js')
  .then(m => {
    const logging = m.getLogAggregationSystem();
    logging.info('Test log entry', { setup: true });
    console.log('✅ Log entry created');
  })
"
```

#### 2.5 Anomaly Detection Configuration

```bash
# Initialize anomaly detection
npm run anomaly:start

# Test anomaly detection
node -e "
import('./infrastructure/observability/anomaly/anomaly-detection.js')
  .then(m => {
    const anomaly = m.getAnomalyDetectionSystem();
    return anomaly.detectAnomalies({ 
      avg_response_time: 150, 
      error_rate: 2.5 
    });
  })
  .then(anomalies => console.log('✅ Anomaly detection:', anomalies.length, 'anomalies'))
"
```

### Step 3: Dashboard Setup & Configuration 📊

#### 3.1 Start Dashboard Server

```bash
# Start real-time dashboards
npm run dashboards:start

# Verify dashboard health
curl http://localhost:3000/health
```

#### 3.2 Access Dashboards

Open your web browser and navigate to:

- **Main Dashboard**: <http://localhost:3000/>
- **API Status**: <http://localhost:3000/api/dashboards>
- **Health Check**: <http://localhost:3000/health>

#### 3.3 Dashboard Navigation

**Available Dashboards:**

1. **System Overview** - High-level system health and performance
2. **Business Metrics** - Key business KPIs and governance metrics
3. **Performance Analysis** - Detailed performance metrics and trends
4. **Security Monitoring** - Security events and threat analysis

**Widget Types:**

- **Gauges**: System health scores, integrity percentages
- **Line Charts**: Time-series data for trends
- **Bar Charts**: Categorical data comparison
- **Status Grids**: Service health matrix
- **Alert Lists**: Active alerts with severity

### Step 4: Integration Testing 🔄

#### 4.1 Run Comprehensive Demo

Execute the interactive demo to see all components working together:

```bash
npm run week3:demo
```

The demo will:

1. Initialize observability system
2. Demonstrate distributed tracing
3. Show advanced metrics collection
4. Trigger intelligent alerts
5. Generate log events
6. Create anomaly scenarios
7. Display real-time dashboards
8. Show system integration
9. Run performance benchmarks
10. Export observability data

#### 4.2 Performance Benchmarking

Test system performance:

```bash
npm run observability:benchmark
```

**Expected Performance:**

- **Metrics Collection**: 2,000+ ops/sec
- **Distributed Tracing**: 500+ ops/sec
- **Log Generation**: 2,000+ ops/sec
- **Alert Processing**: 300+ ops/sec
- **Anomaly Detection**: 200+ ops/sec

#### 4.3 Data Export Testing

```bash
# Export observability data
npm run observability:export > observability-data.json

# Verify export
ls -la observability-data.json
```

## Role-Specific Instructions

### For Frontend Developers 🎨

#### Dashboard Integration

```javascript
// Connect to real-time dashboard updates
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to monitoring dashboards');
  socket.emit('subscribe_dashboard', 'system_overview');
});

socket.on('dashboard_data', (data) => {
  // Update your application UI with real-time metrics
  updateSystemHealthIndicator(data.widgets.system_health);
});
```

#### Metrics Integration

```javascript
// Record frontend metrics
import('./infrastructure/observability/metrics/advanced-metrics-collector.js')
  .then(m => {
    const metrics = m.getAdvancedMetricsCollector();
    
    // Record page load time
    metrics.recordCustomMetric('page_load_time', 'observe', loadTime, {
      page: window.location.pathname
    });
    
    // Record user interactions
    metrics.recordCustomMetric('user_interaction', 'inc', 1, {
      action: 'button_click',
      component: 'header'
    });
  });
```

### For Backend Developers 🔧

#### Service Integration

```javascript
import { getAdvancedObservabilitySystem } from './infrastructure/observability/advanced-observability-system.js';

// Initialize observability for your service
const observability = getAdvancedObservabilitySystem({
  serviceName: 'your-service-name'
});

await observability.initialize();

// Trace business operations
app.post('/api/documents/sign', async (req, res) => {
  await observability.traceBusinessOperation('document_signing', async (span) => {
    const result = await signDocument(req.body.documentId);
    
    // Record metrics
    observability.recordUnifiedMetric('document_signed', 1, {
      userId: req.user.id,
      documentType: req.body.type
    });
    
    return result;
  }, {
    operationId: req.headers['x-request-id'],
    userId: req.user.id
  });
  
  res.json({ success: true });
});
```

#### Error Handling with Observability

```javascript
app.use((error, req, res, next) => {
  // Log error with correlation
  const logging = observability.components.get('logging');
  logging.error('Request failed', {
    error: error.message,
    stack: error.stack,
    requestId: req.headers['x-request-id'],
    userId: req.user?.id
  });
  
  // Record error metric
  observability.recordUnifiedMetric('request_error', 1, {
    endpoint: req.path,
    method: req.method,
    statusCode: error.statusCode || 500
  });
  
  res.status(error.statusCode || 500).json({
    error: 'Internal server error'
  });
});
```

### For DevOps Engineers 🚀

#### Production Deployment Configuration

```yaml
# docker-compose.yml for production
version: '3.8'
services:
  observability:
    build: .
    environment:
      - NODE_ENV=production
      - JAEGER_ENDPOINT=http://jaeger:14268/api/traces
      - REDIS_HOST=redis
      - SMTP_HOST=smtp.company.com
      - SLACK_WEBHOOK_URL=${SLACK_WEBHOOK}
    ports:
      - "3000:3000"
    depends_on:
      - redis
      - jaeger

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"
      - "14268:14268"
```

#### Monitoring Configuration

```bash
# Set up production monitoring
export NODE_ENV=production
export OBSERVABILITY_ENABLED=true
export DASHBOARD_PORT=3000
export METRICS_UPDATE_INTERVAL=5000
export HEALTH_CHECK_INTERVAL=60000

# Start production observability
npm run observability:start
```

#### Alert Configuration

```javascript
// Production alert rules
const alertRules = [
  {
    name: 'High Error Rate',
    condition: (metrics) => metrics.error_rate > 5,
    severity: 'critical',
    channels: ['email', 'slack', 'pagerduty']
  },
  {
    name: 'Service Down',
    condition: (metrics) => metrics.service_health_status === 0,
    severity: 'critical',
    channels: ['email', 'pagerduty']
  }
];
```

### For QA Engineers 🔍

#### Testing Observability Features

```bash
# Test observability system
npm run test:infrastructure

# Validate metrics collection
npm run observability:benchmark

# Test alerting system
node -e "
import('./infrastructure/observability/alerting/intelligent-alerting.js')
  .then(m => {
    const alerting = m.getIntelligentAlertingSystem();
    alerting.evaluateMetrics({ error_rate: 15 }); // Should trigger alert
  })
"
```

#### Monitoring Test Results

```javascript
// Record test metrics
import('./infrastructure/observability/metrics/advanced-metrics-collector.js')
  .then(m => {
    const metrics = m.getAdvancedMetricsCollector();
    
    afterEach(() => {
      // Record test results
      metrics.recordCustomMetric('test_execution', 'inc', 1, {
        test_suite: currentSuite,
        status: testPassed ? 'passed' : 'failed',
        duration: testDuration
      });
    });
  });
```

## Troubleshooting Guide 🔧

### Common Issues

#### 1. Port Conflicts

```bash
# Check if port 3000 is in use
lsof -i :3000

# Use different port
export DASHBOARD_PORT=3001
npm run dashboards:start
```

#### 2. Missing Dependencies

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm ci

# Verify installation
npm run week3:status
```

#### 3. Permission Issues

```bash
# Check file permissions
chmod +x infrastructure/observability/**/*.js

# Check log directory permissions
sudo chown -R $USER:$USER ./logs/
```

#### 4. Memory Issues

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Monitor memory usage
node -e "
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory:', Math.round(usage.heapUsed / 1024 / 1024), 'MB');
}, 5000);
"
```

### Health Check Commands

```bash
# Check all components
npm run observability:health-check

# Check individual components
npm run tracing:start
npm run metrics:start
npm run alerting:start
npm run logs:start
npm run anomaly:start
npm run dashboards:start
```

### Reset and Cleanup

```bash
# Clean logs
rm -rf logs/

# Reset observability system
node -e "
import('./infrastructure/observability/advanced-observability-system.js')
  .then(m => m.getAdvancedObservabilitySystem().shutdown())
  .then(() => console.log('System shutdown complete'))
"
```

## Best Practices 📚

### Development Guidelines

1. **Always use correlation IDs** for request tracking
2. **Record custom metrics** for business operations
3. **Structure logs consistently** with metadata
4. **Test alert conditions** before deploying
5. **Monitor dashboard performance** regularly

### Security Considerations

1. **Secure sensitive data** in logs and metrics
2. **Use environment variables** for credentials
3. **Implement proper access controls** for dashboards
4. **Regularly rotate** API keys and tokens
5. **Monitor for suspicious activity** in logs

### Performance Optimization

1. **Configure appropriate metric intervals**
2. **Use sampling for high-volume traces**
3. **Implement log rotation** and cleanup
4. **Monitor observability system performance**
5. **Scale components horizontally** as needed

## Getting Help 🆘

### Documentation Resources

- **Phase 2 Week 3 Delivery Documentation**: Complete feature overview
- **Quick Reference Guide**: Command cheat sheet
- **API Documentation**: Component APIs and integration points

### Support Channels

1. **Team Chat**: #observability-support
2. **Documentation**: `/docs/phase-2/` directory
3. **Code Examples**: `/tools/` directory demos
4. **Issue Tracking**: GitHub issues for bugs and feature requests

### Useful Commands Reference

```bash
# Status and validation
npm run week3:status                    # Validate implementation
npm run observability:health-check     # Check system health

# System operations
npm run observability:start            # Start all components
npm run observability:benchmark        # Performance testing
npm run week3:demo                     # Interactive demo

# Component operations
npm run dashboards:open                # Open dashboards
npm run observability:export           # Export data

# Development and testing
npm run test:infrastructure            # Run tests
npm run governance:verify              # Validate governance
```

## Conclusion ✅

Following this setup guide, you should now have:

- ✅ **Complete observability infrastructure** running locally
- ✅ **Real-time monitoring dashboards** accessible at <http://localhost:3000>
- ✅ **All components integrated** and functioning properly
- ✅ **Development environment** ready for observability-aware development
- ✅ **Understanding of role-specific** integration patterns

The advanced monitoring and observability system is now ready for development and production use. Team members can start integrating observability features into their workflows and monitor system health in real-time.

**Next Steps**: Proceed with Phase 2 Week 4 implementation or begin production deployment preparation.
