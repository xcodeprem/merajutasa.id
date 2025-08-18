#!/usr/bin/env node
/**
 * metrics-collector.js
 * Prometheus-compatible metrics collection service for MerajutASA.id
 * Implements comprehensive observability for all microservices
 */

import http from 'http';
import { performance } from 'perf_hooks';
import { promises as fs } from 'fs';

const PORT = process.env.METRICS_PORT || 9090;
const METRICS_INTERVAL = 30000; // 30 seconds

// Metrics registry
const metrics = new Map();

// System metrics
let systemMetrics = {
  httpRequests: new Map(),
  httpDuration: new Map(),
  httpErrors: new Map(),
  memoryUsage: {},
  cpuUsage: 0,
  uptime: 0,
  serviceStatus: new Map()
};

/**
 * Metric types
 */
class Counter {
  constructor(name, help, labels = []) {
    this.name = name;
    this.help = help;
    this.labels = labels;
    this.values = new Map();
  }

  inc(labels = {}, value = 1) {
    const key = this.labelsToKey(labels);
    const current = this.values.get(key) || 0;
    this.values.set(key, current + value);
  }

  get(labels = {}) {
    const key = this.labelsToKey(labels);
    return this.values.get(key) || 0;
  }

  labelsToKey(labels) {
    return JSON.stringify(Object.keys(labels).sort().reduce((obj, key) => {
      obj[key] = labels[key];
      return obj;
    }, {}));
  }

  toPrometheus() {
    let output = `# HELP ${this.name} ${this.help}\n`;
    output += `# TYPE ${this.name} counter\n`;
    
    for (const [key, value] of this.values.entries()) {
      const labels = key === '{}' ? '' : key.slice(1, -1).replace(/"/g, '').replace(/:/g, '=');
      const labelStr = labels ? `{${labels}}` : '';
      output += `${this.name}${labelStr} ${value}\n`;
    }
    
    return output;
  }
}

class Gauge {
  constructor(name, help, labels = []) {
    this.name = name;
    this.help = help;
    this.labels = labels;
    this.values = new Map();
  }

  set(labels = {}, value) {
    const key = this.labelsToKey(labels);
    this.values.set(key, value);
  }

  inc(labels = {}, value = 1) {
    const key = this.labelsToKey(labels);
    const current = this.values.get(key) || 0;
    this.values.set(key, current + value);
  }

  dec(labels = {}, value = 1) {
    this.inc(labels, -value);
  }

  get(labels = {}) {
    const key = this.labelsToKey(labels);
    return this.values.get(key) || 0;
  }

  labelsToKey(labels) {
    return JSON.stringify(Object.keys(labels).sort().reduce((obj, key) => {
      obj[key] = labels[key];
      return obj;
    }, {}));
  }

  toPrometheus() {
    let output = `# HELP ${this.name} ${this.help}\n`;
    output += `# TYPE ${this.name} gauge\n`;
    
    for (const [key, value] of this.values.entries()) {
      const labels = key === '{}' ? '' : key.slice(1, -1).replace(/"/g, '').replace(/:/g, '=');
      const labelStr = labels ? `{${labels}}` : '';
      output += `${this.name}${labelStr} ${value}\n`;
    }
    
    return output;
  }
}

class Histogram {
  constructor(name, help, buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]) {
    this.name = name;
    this.help = help;
    this.buckets = buckets.sort((a, b) => a - b);
    this.counts = new Map();
    this.sums = new Map();
    this.bucketCounts = new Map();
  }

  observe(labels = {}, value) {
    const key = this.labelsToKey(labels);
    
    // Update count and sum
    const count = this.counts.get(key) || 0;
    const sum = this.sums.get(key) || 0;
    this.counts.set(key, count + 1);
    this.sums.set(key, sum + value);
    
    // Update bucket counts
    for (const bucket of this.buckets) {
      if (value <= bucket) {
        const bucketKey = `${key}:${bucket}`;
        const bucketCount = this.bucketCounts.get(bucketKey) || 0;
        this.bucketCounts.set(bucketKey, bucketCount + 1);
      }
    }
  }

  labelsToKey(labels) {
    return JSON.stringify(Object.keys(labels).sort().reduce((obj, key) => {
      obj[key] = labels[key];
      return obj;
    }, {}));
  }

  toPrometheus() {
    let output = `# HELP ${this.name} ${this.help}\n`;
    output += `# TYPE ${this.name} histogram\n`;
    
    // Bucket metrics
    for (const [key, count] of this.bucketCounts.entries()) {
      const [labelKey, bucket] = key.split(':');
      const labels = labelKey === '{}' ? '' : labelKey.slice(1, -1).replace(/"/g, '').replace(/:/g, '=');
      const labelStr = labels ? `{${labels},le="${bucket}"}` : `{le="${bucket}"}`;
      output += `${this.name}_bucket${labelStr} ${count}\n`;
    }
    
    // +Inf buckets
    for (const [key, count] of this.counts.entries()) {
      const labels = key === '{}' ? '' : key.slice(1, -1).replace(/"/g, '').replace(/:/g, '=');
      const labelStr = labels ? `{${labels},le="+Inf"}` : `{le="+Inf"}`;
      output += `${this.name}_bucket${labelStr} ${count}\n`;
    }
    
    // Sum and count
    for (const [key, sum] of this.sums.entries()) {
      const labels = key === '{}' ? '' : key.slice(1, -1).replace(/"/g, '').replace(/:/g, '=');
      const labelStr = labels ? `{${labels}}` : '';
      output += `${this.name}_sum${labelStr} ${sum}\n`;
      output += `${this.name}_count${labelStr} ${this.counts.get(key)}\n`;
    }
    
    return output;
  }
}

// Initialize core metrics
const httpRequestsTotal = new Counter(
  'merajutasa_http_requests_total',
  'Total number of HTTP requests',
  ['method', 'route', 'status_code', 'service']
);

const httpRequestDuration = new Histogram(
  'merajutasa_http_request_duration_seconds',
  'Duration of HTTP requests in seconds',
  [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
);

const serviceHealthStatus = new Gauge(
  'merajutasa_service_health_status',
  'Health status of services (1=healthy, 0=unhealthy)',
  ['service', 'endpoint']
);

const memoryUsageBytes = new Gauge(
  'merajutasa_memory_usage_bytes',
  'Memory usage in bytes',
  ['type']
);

const signingOperationsTotal = new Counter(
  'merajutasa_signing_operations_total',
  'Total number of signing operations',
  ['operation', 'status']
);

const chainOperationsTotal = new Counter(
  'merajutasa_chain_operations_total',
  'Total number of chain operations',
  ['operation', 'status']
);

const eventsIngestedTotal = new Counter(
  'merajutasa_events_ingested_total',
  'Total number of events ingested',
  ['event_type', 'status']
);

const equityMetricsCalculated = new Gauge(
  'merajutasa_equity_score',
  'Current equity fairness score',
  ['metric_type']
);

// Register metrics
metrics.set('http_requests_total', httpRequestsTotal);
metrics.set('http_request_duration', httpRequestDuration);
metrics.set('service_health_status', serviceHealthStatus);
metrics.set('memory_usage_bytes', memoryUsageBytes);
metrics.set('signing_operations_total', signingOperationsTotal);
metrics.set('chain_operations_total', chainOperationsTotal);
metrics.set('events_ingested_total', eventsIngestedTotal);
metrics.set('equity_score', equityMetricsCalculated);

/**
 * HTTP Request tracking middleware
 */
function createMetricsMiddleware(serviceName) {
  return function metricsMiddleware(req, res, next) {
    const start = performance.now();
    
    // Track request
    res.on('finish', () => {
      const duration = (performance.now() - start) / 1000;
      const route = req.route?.path || req.url.split('?')[0];
      
      httpRequestsTotal.inc({
        method: req.method,
        route: route,
        status_code: res.statusCode,
        service: serviceName
      });
      
      httpRequestDuration.observe({
        method: req.method,
        route: route,
        service: serviceName
      }, duration);
    });
    
    next();
  };
}

/**
 * Service health checker
 */
async function checkServiceHealth() {
  const services = [
    { name: 'signer', port: 4601, endpoint: '/pubkey' },
    { name: 'chain', port: 4602, endpoint: '/head' },
    { name: 'collector', port: 4603, endpoint: '/health' },
    { name: 'equity', port: 4604, endpoint: '/metrics' },
    { name: 'revocation', port: 4605, endpoint: '/status' }
  ];

  for (const service of services) {
    try {
      const response = await fetch(`http://127.0.0.1:${service.port}${service.endpoint}`, {
        timeout: 5000
      });
      
      serviceHealthStatus.set(
        { service: service.name, endpoint: service.endpoint },
        response.ok ? 1 : 0
      );
    } catch (error) {
      serviceHealthStatus.set(
        { service: service.name, endpoint: service.endpoint },
        0
      );
    }
  }
}

/**
 * System metrics collection
 */
function collectSystemMetrics() {
  // Memory usage
  const memUsage = process.memoryUsage();
  memoryUsageBytes.set({ type: 'heap_used' }, memUsage.heapUsed);
  memoryUsageBytes.set({ type: 'heap_total' }, memUsage.heapTotal);
  memoryUsageBytes.set({ type: 'external' }, memUsage.external);
  memoryUsageBytes.set({ type: 'rss' }, memUsage.rss);
  
  // CPU usage (simplified)
  const usage = process.cpuUsage();
  const cpuPercent = (usage.user + usage.system) / 1000000; // Convert to seconds
  memoryUsageBytes.set({ type: 'cpu_usage' }, cpuPercent);
  
  // Uptime
  memoryUsageBytes.set({ type: 'uptime' }, process.uptime());
}

/**
 * Application-specific metrics tracking
 */
function trackSigningOperation(operation, status) {
  signingOperationsTotal.inc({
    operation: operation,
    status: status
  });
}

function trackChainOperation(operation, status) {
  chainOperationsTotal.inc({
    operation: operation,
    status: status
  });
}

function trackEventIngestion(eventType, status) {
  eventsIngestedTotal.inc({
    event_type: eventType,
    status: status
  });
}

function updateEquityScore(metricType, score) {
  equityMetricsCalculated.set({
    metric_type: metricType
  }, score);
}

/**
 * Generate Prometheus format output
 */
function generatePrometheusMetrics() {
  let output = '';
  
  for (const metric of metrics.values()) {
    output += metric.toPrometheus() + '\n';
  }
  
  // Add process metrics
  output += `# HELP merajutasa_process_start_time_seconds Start time of the process since unix epoch in seconds\n`;
  output += `# TYPE merajutasa_process_start_time_seconds gauge\n`;
  output += `merajutasa_process_start_time_seconds ${Date.now() / 1000 - process.uptime()}\n\n`;
  
  return output;
}

/**
 * HTTP server for metrics endpoint
 */
const server = http.createServer(async (req, res) => {
  if (req.url === '/metrics' && req.method === 'GET') {
    try {
      const metrics = generatePrometheusMetrics();
      
      res.writeHead(200, {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.end(metrics);
    } catch (error) {
      console.error('Metrics generation error:', error);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  } else if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

/**
 * Start metrics collection
 */
function startMetricsCollection() {
  // Collect system metrics every 30 seconds
  setInterval(collectSystemMetrics, METRICS_INTERVAL);
  
  // Check service health every 30 seconds
  setInterval(checkServiceHealth, METRICS_INTERVAL);
  
  // Initial collection
  collectSystemMetrics();
  checkServiceHealth();
  
  console.log(`🔍 Metrics collector listening on port ${PORT}`);
  console.log(`📊 Metrics endpoint: http://localhost:${PORT}/metrics`);
  console.log(`💚 Health endpoint: http://localhost:${PORT}/health`);
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  server.listen(PORT, '127.0.0.1', () => {
    startMetricsCollection();
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Shutting down metrics collector...');
    server.close(() => {
      process.exit(0);
    });
  });
}

export {
  server,
  startMetricsCollection,
  createMetricsMiddleware,
  trackSigningOperation,
  trackChainOperation,
  trackEventIngestion,
  updateEquityScore
};