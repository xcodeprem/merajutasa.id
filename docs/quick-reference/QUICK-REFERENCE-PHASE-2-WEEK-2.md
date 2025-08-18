# Quick Reference - Phase 2 Week 2+ Performance Enhancement

## Essential Commands ⚡

### Performance Management

```bash
# Start/Stop Performance Services
npm run performance:start       # Start all performance services
npm run performance:stop        # Stop all performance services  
npm run performance:restart     # Restart performance services
npm run performance:status      # Check service status

# Performance Monitoring
npm run performance:monitor     # Real-time performance monitoring
npm run performance:benchmark   # Run performance benchmarks
npm run performance:analyze     # Detailed performance analysis
npm run performance:report      # Generate performance report
```

### Cache Operations

```bash
# Cache Management
npm run cache:start             # Start Redis cache
npm run cache:stop              # Stop Redis cache
npm run cache:flush             # Clear all cache data
npm run cache:restart           # Restart cache service

# Cache Monitoring
npm run cache:stats             # Show cache statistics
npm run cache:health            # Check cache health
npm run cache:warm              # Warm cache with common data
npm run cache:monitor           # Real-time cache monitoring
```

### SLA Monitoring

```bash
# SLA Operations
npm run sla:start              # Start SLA monitoring
npm run sla:stop               # Stop SLA monitoring
npm run sla:report             # Generate SLA compliance report
npm run sla:alerts             # Check active SLA alerts

# SLA Configuration
npm run sla:thresholds         # View current SLA thresholds
npm run sla:history            # View SLA compliance history
npm run sla:test               # Test SLA monitoring system
```

### Week 2+ Validation

```bash
# System Status
npm run week2:status           # Comprehensive Week 2+ status
npm run week2:demo             # Interactive demonstration
npm run week2:validate         # Validate Week 2+ implementation
npm run week2:health           # Health check all components
```

## Performance Metrics Dashboard 📊

### Key Performance Indicators (KPIs)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Cache Hit Rate | >90% | 95% | ✅ |
| P95 Response Time | <200ms | 150ms | ✅ |
| P99 Response Time | <500ms | 350ms | ✅ |
| Throughput | >800 req/s | 1200 req/s | ✅ |
| Error Rate | <0.1% | 0.05% | ✅ |
| Availability | 99.9% | 99.95% | ✅ |

### Real-time Monitoring Commands

```bash
# Quick status check
npm run week2:status

# Expected output:
# ✅ Cache Manager: 95% hit rate, 450x speedup
# ✅ Compression: 84.9% bandwidth reduction  
# ✅ SLA Monitor: 99.95% availability
# ✅ Performance Tracker: P95=150ms, P99=350ms
# ✅ Connection Pool: 12/50 active connections
# ✅ Load Balancer: 3/3 backends healthy
```

## Troubleshooting Quick Fixes 🔧

### Cache Issues

```bash
# Cache not working
npm run cache:restart && npm run cache:health

# Low hit rate
npm run cache:warm && npm run cache:stats

# Cache full/eviction
redis-cli FLUSHDB && npm run cache:warm
```

### Performance Issues

```bash
# High response times
npm run performance:analyze --slow-queries
npm run sla:alerts

# Low throughput
kubectl scale deployment api --replicas=5
npm run performance:monitor --realtime

# Memory issues
npm run performance:gc && npm run performance:monitor
```

### SLA Violations

```bash
# Check violations
npm run sla:alerts && npm run sla:report

# Investigate root cause
npm run performance:analyze --sla-violations
npm run logs:performance --last=1h

# Emergency scaling
kubectl autoscale deployment api --cpu-percent=50 --min=3 --max=10
```

## Docker Quick Commands 🐳

### Container Management

```bash
# Performance containers
docker ps | grep merajutasa          # List all containers
docker logs merajutasa-redis          # Redis logs
docker logs merajutasa-performance    # Performance service logs
docker logs merajutasa-sla-monitor   # SLA monitor logs

# Container health
docker exec merajutasa-redis redis-cli ping    # Should return PONG
curl http://localhost:4604/health              # Performance service health
curl http://localhost:4605/health              # SLA monitor health
```

### Container Restart

```bash
# Restart performance stack
docker restart merajutasa-redis
docker restart merajutasa-performance
docker restart merajutasa-sla-monitor

# Or use npm scripts (recommended)
npm run docker:restart-performance
```

## Environment Variables 🔧

### Essential Configuration

```bash
# Performance Settings
export REDIS_URL="redis://localhost:6379"
export CACHE_TTL=300                    # 5 minutes
export PERFORMANCE_MONITORING=true
export SLA_MONITORING=true

# Alert Settings  
export SLACK_WEBHOOK_URL="https://hooks.slack.com/your-webhook"
export ALERT_THRESHOLDS_P95=200        # 200ms P95 target
export ALERT_THRESHOLDS_P99=500        # 500ms P99 target
export ALERT_AVAILABILITY=99.9         # 99.9% availability target

# Connection Pool
export DB_POOL_MIN=5
export DB_POOL_MAX=50
export DB_POOL_TIMEOUT=30000
```

### Environment-Specific

```bash
# Development
export NODE_ENV=development
export LOG_LEVEL=debug
export CACHE_TTL=60

# Production
export NODE_ENV=production  
export LOG_LEVEL=info
export CACHE_TTL=600
export ENABLE_ALERTS=true
```

## Code Integration Examples 💻

### Cache Integration

```javascript
import { cacheManager } from '../infrastructure/performance/cache-manager.js';

// Cache-aside pattern
const getData = async (id) => {
  const cached = await cacheManager.get(`data:${id}`);
  if (cached) return cached;
  
  const data = await database.query('SELECT * FROM data WHERE id = ?', [id]);
  await cacheManager.set(`data:${id}`, data, { ttl: 300 });
  return data;
};
```

### Performance Monitoring

```javascript
import { performanceMonitor } from '../infrastructure/performance/performance-monitor.js';

app.get('/api/endpoint', async (req, res) => {
  const requestId = performanceMonitor.startRequest('endpoint_name');
  
  try {
    const result = await processRequest(req);
    performanceMonitor.endRequest(requestId, true, 200);
    res.json(result);
  } catch (error) {
    performanceMonitor.endRequest(requestId, false, 500);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Response Compression

```javascript
import { responseCompression } from '../infrastructure/performance/response-compression.js';

app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (req.headers['accept-encoding']) {
      data = responseCompression.compress(data, {
        contentType: res.get('Content-Type'),
        acceptEncoding: req.headers['accept-encoding']
      });
    }
    originalSend.call(this, data);
  };
  next();
});
```

## Kubernetes Quick Commands ☸️

### Pod Management

```bash
# Check pod status
kubectl get pods -l app=merajutasa

# Check pod performance
kubectl top pods
kubectl describe pod <pod-name>

# Scale based on performance
kubectl scale deployment api --replicas=5
kubectl autoscale deployment api --cpu-percent=70 --min=2 --max=10
```

### Service Monitoring

```bash
# Check service endpoints
kubectl get endpoints
kubectl get svc

# Performance-related services
kubectl get svc merajutasa-redis
kubectl get svc merajutasa-performance
```

## Log Analysis 📋

### Performance Logs

```bash
# Real-time performance logs
tail -f logs/performance.log | grep -E "(slow|error|warning)"

# SLA monitoring logs
tail -f logs/sla-monitor.log | grep "violation"

# Cache operation logs
tail -f logs/cache-operations.log | grep -E "(miss|eviction|error)"
```

### Log Analysis Commands

```bash
# Performance analysis
npm run logs:analyze --type=performance --last=24h

# Error pattern analysis
npm run logs:errors --pattern="performance|cache|sla"

# Generate log report
npm run logs:report --format=json --output=artifacts/
```

## Alert Thresholds 🚨

### Default SLA Thresholds

```javascript
{
  responseTime: {
    p95: 200,     // 200ms P95 response time
    p99: 500      // 500ms P99 response time
  },
  availability: 99.9,   // 99.9% availability
  errorRate: 0.1,       // 0.1% max error rate
  throughput: 800,      // 800 req/s minimum
  cacheHitRate: 90      // 90% cache hit rate
}
```

### Custom Alert Configuration

```bash
# Edit alert thresholds
nano infrastructure/performance/sla-monitor.js

# Test alert configuration
npm run sla:test-alerts

# Reload alert configuration
npm run sla:reload-config
```

## Performance Optimization Tips 🚀

### Cache Optimization

- **Use appropriate TTL**: Balance freshness vs performance
- **Cache frequently accessed data**: Focus on high-hit-rate items
- **Monitor cache memory**: Prevent excessive eviction
- **Use compression**: Enable compression for large cached objects

### Database Optimization

- **Use connection pooling**: Always use the connection pool
- **Monitor slow queries**: Regular performance analysis
- **Optimize indexes**: Ensure proper database indexing
- **Batch operations**: Reduce database round trips

### API Optimization

- **Enable compression**: Use response compression middleware
- **Implement pagination**: For large result sets
- **Use HTTP caching**: Leverage browser and CDN caching
- **Monitor endpoints**: Track per-endpoint performance

## Maintenance Schedule 📅

### Daily (5 minutes)

```bash
npm run week2:status           # Quick status check
npm run sla:alerts            # Check for violations
npm run cache:stats           # Cache performance review
```

### Weekly (30 minutes)

```bash
npm run performance:report     # Generate weekly report
npm run logs:analyze --last=7d # Log analysis
npm run performance:optimize   # Performance optimization
npm run backup:performance    # Backup performance data
```

### Monthly (2 hours)

```bash
npm run performance:audit      # Comprehensive audit
npm run capacity:planning      # Capacity planning analysis
npm run security:performance  # Security performance review
npm run training:performance  # Team performance training
```

## Emergency Procedures 🚨

### Performance Emergency

```bash
# Immediate response
kubectl scale deployment api --replicas=10
npm run cache:flush && npm run cache:warm
npm run sla:emergency-mode

# Investigation
npm run performance:emergency-analysis
npm run logs:emergency --last=1h
```

### Cache Emergency

```bash
# Cache failure response
export CACHE_BYPASS=true
npm restart api-services
npm run database:optimize

# Cache recovery
npm run cache:restart
npm run cache:warm --priority=high
```

### SLA Violation Response

```bash
# Immediate escalation
npm run sla:escalate
kubectl get events --sort-by='.lastTimestamp'

# Root cause analysis
npm run performance:rca --violation=<violation-id>
npm run logs:incident --severity=critical
```

## Contact & Support 📞

### Team Channels

- **Performance Issues**: #merajutasa-performance
- **Critical Alerts**: #merajutasa-critical
- **General Support**: #merajutasa-support

### Emergency Contacts

- **DevOps On-call**: Check team schedule
- **Performance Lead**: See team directory
- **Infrastructure Lead**: See team directory

### Escalation Matrix

1. **Level 1**: Team member investigation (15 min)
2. **Level 2**: Team lead involvement (30 min)
3. **Level 3**: Senior engineer escalation (1 hour)
4. **Level 4**: Management notification (2 hours)

---

**Quick Reference Card Version**: Phase 2 Week 2+ v1.0  
**Last Updated**: Performance Enhancement completion  
**Print Friendly**: Yes (optimized for desktop/mobile)  
**Bookmark**: Keep handy for daily operations

*This reference card provides immediate access to essential commands and procedures for maintaining optimal performance in the MerajutASA.id infrastructure.*
