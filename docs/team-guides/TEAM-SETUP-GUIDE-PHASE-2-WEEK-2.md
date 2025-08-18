# Team Setup Guide - Phase 2 Week 2+ Performance Enhancement

## Overview 🎯

This guide enables all team members to setup, use, and maintain the Phase 2 Week 2+ Performance Enhancement infrastructure. The performance optimization layer builds upon Phase 1 (Security/Observability) and Phase 2 Week 1 (Containerization) to deliver enterprise-grade performance capabilities.

**Prerequisites**: Completed Phase 2 Week 1 setup (Docker, Kubernetes, team accounts)

## Quick Setup Verification ⚡

Before starting, verify your Phase 2 Week 1 setup:

```bash
# Verify Docker access
docker --version                # Should show 20.10+
docker login                    # Should succeed with merajutasa-[name] account

# Verify previous phase status
npm run phase1:status           # Should show Phase 1 complete
npm run phase2:status           # Should show Week 1 complete

# Check new Week 2+ capabilities
npm run week2:status            # Should show performance components
```

## Week 2+ Performance Setup (30-45 minutes)

### Step 1: Redis Cache Setup (10 minutes)

Performance enhancement requires Redis for caching layer:

#### Option A: Docker Redis (Recommended for Development)

```bash
# Start Redis container
npm run cache:start

# Verify Redis connectivity
docker exec -it merajutasa-redis redis-cli ping
# Should return: PONG

# Check cache configuration
npm run cache:stats
```

#### Option B: Local Redis Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:**
```bash
# Use WSL2 or Docker Desktop (Option A recommended)
```

### Step 2: Performance Services Initialization (10 minutes)

```bash
# Initialize all performance services
npm run performance:start

# Verify services are running
npm run performance:status

# Expected output:
# ✅ Cache Manager: Running (Port 6379)
# ✅ SLA Monitor: Running (Port 4604)
# ✅ Performance Tracker: Running
# ✅ Connection Pool: Initialized
# ✅ Compression Engine: Ready
```

### Step 3: Performance Benchmarking (10 minutes)

Establish baseline performance metrics:

```bash
# Run comprehensive performance benchmark
npm run performance:benchmark

# Expected results:
# Cache Operations: 450x improvement
# Compression Ratio: 84.9% reduction
# Response Time: <200ms P95
# Throughput: >800 req/s
```

### Step 4: SLA Monitoring Setup (10 minutes)

Configure service level agreement monitoring:

```bash
# Start SLA monitoring
npm run sla:start

# Configure alert thresholds (edit if needed)
nano infrastructure/performance/sla-monitor.js
# Look for SLA_THRESHOLDS configuration

# Test SLA monitoring
npm run sla:report
# Should generate initial SLA compliance report
```

### Step 5: Integration Validation (5 minutes)

```bash
# Run complete integration test
npm run test:infrastructure

# All tests should pass:
# ✅ Phase 1 Security Tests: 7/7
# ✅ Phase 2 Week 1 Container Tests: 7/7
# ✅ Phase 2 Week 2+ Performance Tests: 8/8

# Demo the complete system
npm run week2:demo
```

## Role-Specific Setup Instructions

### Frontend Developers 🎨

**Focus**: UI performance optimization and caching strategies

```bash
# Additional frontend-specific tools
npm install --save-dev lighthouse-cli

# Performance testing for UI
npm run frontend:performance-test

# Cache integration for API calls
# See: infrastructure/performance/cache-manager.js
# Use cache.cacheAside() for API response caching
```

**Key Files to Understand**:
- `infrastructure/performance/response-compression.js` - API response optimization
- `infrastructure/performance/cache-manager.js` - Client-side cache integration
- `tools/performance/frontend-metrics.js` - UI performance monitoring

**Daily Workflow**:
```bash
npm run performance:status      # Check performance services
npm run cache:stats            # Monitor cache hit rates
npm run frontend:lighthouse    # Run performance audits
```

### Backend Developers ⚙️

**Focus**: API performance optimization and database connection management

```bash
# Database connection pool setup
export DB_POOL_MIN=5
export DB_POOL_MAX=50
export DB_POOL_TIMEOUT=30000

# Start with performance monitoring
npm run performance:start
npm run sla:start

# Monitor API performance
npm run api:performance-monitor
```

**Key Files to Understand**:
- `infrastructure/performance/connection-pool.js` - Database optimization
- `infrastructure/performance/performance-monitor.js` - API monitoring
- `infrastructure/performance/sla-monitor.js` - Service level tracking

**Daily Workflow**:
```bash
npm run performance:monitor     # Real-time performance tracking
npm run sla:alerts             # Check SLA violations
npm run connection:health      # Database connection status
npm run api:benchmark          # API performance testing
```

**Code Integration Example**:
```javascript
// Add to your API routes
import { performanceMonitor } from '../infrastructure/performance/performance-monitor.js';
import { cacheManager } from '../infrastructure/performance/cache-manager.js';

app.get('/api/data', async (req, res) => {
  const requestId = performanceMonitor.startRequest('api_data');
  
  try {
    // Try cache first
    const cached = await cacheManager.get(`data:${req.params.id}`);
    if (cached) {
      performanceMonitor.endRequest(requestId, true, 200);
      return res.json(cached);
    }
    
    // Database query with connection pool
    const data = await db.query('SELECT * FROM data WHERE id = ?', [req.params.id]);
    
    // Cache the result
    await cacheManager.set(`data:${req.params.id}`, data, { ttl: 300 });
    
    performanceMonitor.endRequest(requestId, true, 200);
    res.json(data);
  } catch (error) {
    performanceMonitor.endRequest(requestId, false, 500);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### DevOps Engineers 🚀

**Focus**: Infrastructure management, monitoring, and scaling

```bash
# Complete infrastructure monitoring
npm run infra:monitor-all

# Kubernetes performance optimization
kubectl apply -f infrastructure/k8s/performance/

# Monitor cluster performance
kubectl top nodes
kubectl top pods

# Database performance monitoring
npm run db:performance-monitor
```

**Key Files to Understand**:
- `infrastructure/k8s/performance/` - K8s performance configurations
- `infrastructure/terraform/performance.tf` - Infrastructure scaling
- `infrastructure/monitoring/performance-dashboard.json` - Grafana dashboards
- `infrastructure/performance/load-balancer.conf` - NGINX optimization

**Daily Workflow**:
```bash
npm run infra:health           # Infrastructure health check
npm run k8s:performance        # Kubernetes performance metrics
npm run monitoring:alerts     # Check all monitoring alerts
npm run scaling:auto          # Verify auto-scaling policies
npm run backup:performance    # Performance-optimized backups
```

**Infrastructure Scaling**:
```bash
# Scale based on performance metrics
kubectl autoscale deployment merajutasa-api --cpu-percent=70 --min=2 --max=10

# Monitor scaling events
kubectl get hpa
kubectl describe hpa merajutasa-api

# Performance-based node scaling
kubectl apply -f infrastructure/k8s/performance/cluster-autoscaler.yaml
```

### QA Engineers 🧪

**Focus**: Performance testing, SLA validation, and quality assurance

```bash
# Performance test suite
npm run test:performance-full

# Load testing
npm install -g artillery
npm run test:load

# SLA compliance testing
npm run test:sla-compliance
```

**Key Files to Understand**:
- `tools/tests/performance-integration.test.js` - Performance test suite
- `tools/tests/load-testing/` - Load test configurations
- `tools/tests/sla-validation.js` - SLA compliance tests
- `artifacts/performance-test-reports/` - Test result analysis

**Daily Workflow**:
```bash
npm run test:performance      # Run performance test suite
npm run test:regression       # Performance regression testing
npm run sla:validate         # SLA compliance validation
npm run reports:performance   # Generate performance reports
```

**Performance Test Examples**:
```bash
# Cache performance test
npm run test:cache-performance
# Expected: 450x improvement over database queries

# Compression test
npm run test:compression-ratio
# Expected: 84.9% size reduction for JSON

# Load test with Artillery
artillery run tools/tests/load-testing/api-load-test.yml
# Expected: 800+ req/s sustained throughput
```

## Environment-Specific Setup

### Development Environment

```bash
# Lightweight development setup
export NODE_ENV=development
export REDIS_URL=redis://localhost:6379
export PERFORMANCE_MONITORING=true
export CACHE_TTL=60

npm run dev:performance
```

### Staging Environment

```bash
# Production-like staging setup
export NODE_ENV=staging
export REDIS_URL=redis://staging-redis:6379
export PERFORMANCE_MONITORING=true
export SLA_MONITORING=true
export CACHE_TTL=300

npm run staging:performance
```

### Production Environment

```bash
# Full production performance setup
export NODE_ENV=production
export REDIS_URL=redis://prod-redis-cluster:6379
export PERFORMANCE_MONITORING=true
export SLA_MONITORING=true
export ALERT_WEBHOOKS=true
export CACHE_TTL=600

npm run production:performance
```

## Monitoring & Alerting Setup

### Grafana Dashboard Setup (Optional)

```bash
# Import performance dashboards
curl -X POST http://grafana:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @infrastructure/monitoring/performance-dashboard.json
```

### Alert Configuration

Edit `infrastructure/performance/sla-monitor.js` to customize alert thresholds:

```javascript
const SLA_THRESHOLDS = {
  responseTime: {
    p95: 200,    // 200ms P95 response time
    p99: 500     // 500ms P99 response time
  },
  availability: 99.9,  // 99.9% availability target
  errorRate: 0.1,      // 0.1% max error rate
  throughput: 800      // 800 req/s minimum throughput
};
```

### Slack/Discord Alerting (Optional)

```bash
# Set webhook URLs for alerting
export SLACK_WEBHOOK_URL="https://hooks.slack.com/your-webhook"
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/your-webhook"

# Enable alerting
export ENABLE_ALERTS=true
npm run sla:start
```

## Troubleshooting Guide 🔧

### Common Issues

#### Redis Connection Errors
```bash
# Check Redis status
npm run cache:stats
docker ps | grep redis

# Restart Redis if needed
npm run cache:restart
```

#### Performance Services Not Starting
```bash
# Check port availability
netstat -tulpn | grep :4604

# Kill conflicting processes
sudo kill -9 $(lsof -t -i:4604)

# Restart services
npm run performance:restart
```

#### Low Cache Hit Rate
```bash
# Check cache statistics
npm run cache:stats

# Common causes:
# 1. TTL too low - increase cache TTL
# 2. Cache warming needed - run npm run cache:warm
# 3. High cache eviction - increase Redis memory
```

#### SLA Violations
```bash
# Check SLA report
npm run sla:report

# Investigate performance issues
npm run performance:analyze

# Common fixes:
# 1. Scale up replicas: kubectl scale deployment api --replicas=5
# 2. Increase cache TTL
# 3. Optimize database queries
```

### Performance Debugging

```bash
# Real-time performance monitoring
npm run performance:monitor --realtime

# Detailed performance analysis
npm run performance:analyze --detailed

# Generate performance report
npm run performance:report --format=pdf
```

### Log Analysis

```bash
# Performance-related logs
tail -f logs/performance.log

# SLA monitoring logs
tail -f logs/sla-monitor.log

# Cache operation logs
tail -f logs/cache-operations.log
```

## Security Considerations 🔒

### Cache Security

- **Data Encryption**: Sensitive data encrypted in cache
- **Access Control**: Redis AUTH password required
- **Network Security**: Redis on private network only
- **TTL Management**: Automatic expiration prevents data leaks

### Performance Monitoring Security

- **Metrics Sanitization**: PII excluded from performance metrics
- **Access Control**: Performance endpoints require authentication
- **Audit Logging**: All performance changes logged
- **Rate Limiting**: Performance API endpoints rate limited

## Best Practices 📋

### Cache Strategy

1. **Use Cache-Aside Pattern**: Let application control cache logic
2. **Set Appropriate TTL**: Balance freshness vs performance
3. **Monitor Cache Hit Rate**: Target >90% hit rate
4. **Handle Cache Failures**: Graceful degradation when cache unavailable

### Performance Monitoring

1. **Monitor P95/P99**: Don't just look at averages
2. **Set Realistic SLAs**: Based on business requirements
3. **Alert on Trends**: Not just absolute thresholds
4. **Regular Performance Reviews**: Weekly performance analysis

### Database Optimization

1. **Use Connection Pooling**: Always use connection pool
2. **Monitor Connection Health**: Regular health checks
3. **Optimize Queries**: Use performance monitoring to identify slow queries
4. **Index Management**: Ensure appropriate indexes exist

## Maintenance Schedule 📅

### Daily Tasks
- Check performance dashboard
- Review SLA compliance report
- Monitor cache hit rates
- Verify backup completion

### Weekly Tasks
- Analyze performance trends
- Review slow query reports
- Update performance baselines
- Test disaster recovery procedures

### Monthly Tasks
- Performance capacity planning
- Cache strategy optimization
- Security performance audit
- Team performance training

## Support & Documentation 📚

### Internal Documentation
- `/docs/performance/` - Detailed technical documentation
- `/docs/troubleshooting/` - Issue resolution guides
- `/docs/architecture/` - System architecture diagrams

### External Resources
- Redis Documentation: https://redis.io/documentation
- Node.js Performance: https://nodejs.org/en/docs/guides/nodejs-performance/
- Kubernetes HPA: https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/

### Team Communication
- **Performance Channel**: #merajutasa-performance
- **Alerts Channel**: #merajutasa-alerts
- **Weekly Review**: Every Friday 2PM
- **On-call Rotation**: See DevOps team schedule

---

**Setup Verification Checklist:**

- [ ] Redis cache running and accessible
- [ ] Performance services started successfully
- [ ] SLA monitoring configured and running
- [ ] Benchmark results meet expectations (450x cache, 84.9% compression)
- [ ] Role-specific tools and documentation reviewed
- [ ] Monitoring dashboards accessible
- [ ] Alert thresholds configured appropriately
- [ ] Team communication channels joined
- [ ] Troubleshooting guide bookmarked
- [ ] Weekly maintenance schedule understood

**Estimated Setup Time**: 30-45 minutes for complete setup
**Prerequisites**: Phase 2 Week 1 completion (Docker, Kubernetes, team accounts)
**Support**: Contact DevOps team in #merajutasa-performance for assistance

*This guide ensures all team members can effectively work with the Phase 2 Week 2+ Performance Enhancement infrastructure while maintaining security and reliability standards.*