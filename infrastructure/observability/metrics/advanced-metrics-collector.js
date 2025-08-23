/**
 * MerajutASA.id - Phase 2 Week 3: Advanced Metrics Collection System
 *
 * Enterprise-grade metrics collection with custom business metrics
 * Extends basic Prometheus with domain-specific metrics for governance
 *
 * Features:
 * - Business metrics (signing ops, chain ops, equity scoring)
 * - Custom metric aggregations
 * - Real-time metric streaming
 * - Historical trend analysis
 * - Metric correlation and anomaly detection
 *
 * @version 1.0.0
 * @since Phase 2 Week 3
 */

import EventEmitter from 'events';
import { performance } from 'perf_hooks';

// Lightweight Prometheus client fallback
class LightweightRegistry {
  constructor() {
    this.metrics = new Map();
    this.defaultMetricsInterval = null;
  }

  register(metric) {
    this.metrics.set(metric.name, metric);
  }

  clear() {
    if (this.defaultMetricsInterval) {
      clearInterval(this.defaultMetricsInterval);
    }
    this.metrics.clear();
  }

  async metrics() {
    const lines = [];
    for (const [name, metric] of this.metrics) {
      lines.push(...metric.toPrometheusString());
    }
    return lines.join('\n');
  }

  async getMetricsAsJSON() {
    const result = [];
    for (const [name, metric] of this.metrics) {
      result.push(metric.toJSON());
    }
    return result;
  }
}

class LightweightMetric {
  constructor(config, type) {
    this.name = config.name;
    this.help = config.help;
    this.labelNames = config.labelNames || [];
    this.type = type;
    this.values = new Map();

    if (config.registers) {
      config.registers.forEach(registry => registry.register(this));
    }
  }

  toPrometheusString() {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} ${this.type}`];

    for (const [labelKey, value] of this.values) {
      if (labelKey === '__default__') {
        lines.push(`${this.name} ${value.value}`);
      } else {
        lines.push(`${this.name}{${labelKey}} ${value.value}`);
      }
    }

    return lines;
  }

  toJSON() {
    return {
      name: this.name,
      help: this.help,
      type: this.type,
      values: Array.from(this.values.entries()).map(([labelKey, value]) => ({
        labels: labelKey === '__default__' ? {} : JSON.parse(labelKey),
        value: value.value,
        timestamp: value.timestamp,
      })),
    };
  }

  _getLabelKey(labels = {}) {
    if (Object.keys(labels).length === 0) {return '__default__';}
    return JSON.stringify(labels);
  }
}

class LightweightCounter extends LightweightMetric {
  constructor(config) {
    super(config, 'counter');
  }

  inc(labels = {}, value = 1) {
    const key = this._getLabelKey(labels);
    const current = this.values.get(key) || { value: 0, timestamp: Date.now() };
    this.values.set(key, { value: current.value + value, timestamp: Date.now() });
  }
}

class LightweightGauge extends LightweightMetric {
  constructor(config) {
    super(config, 'gauge');
  }

  set(labels = {}, value) {
    const key = this._getLabelKey(labels);
    this.values.set(key, { value, timestamp: Date.now() });
  }

  inc(labels = {}, value = 1) {
    const key = this._getLabelKey(labels);
    const current = this.values.get(key) || { value: 0, timestamp: Date.now() };
    this.values.set(key, { value: current.value + value, timestamp: Date.now() });
  }

  dec(labels = {}, value = 1) {
    this.inc(labels, -value);
  }
}

class LightweightHistogram extends LightweightMetric {
  constructor(config) {
    super(config, 'histogram');
    this.buckets = config.buckets || [0.1, 0.5, 1, 2, 5, 10];
    this.observations = new Map();
  }

  observe(labels = {}, value) {
    const key = this._getLabelKey(labels);
    const observations = this.observations.get(key) || [];
    observations.push({ value, timestamp: Date.now() });
    this.observations.set(key, observations);

    // Update histogram buckets
    for (const bucket of this.buckets) {
      const bucketKey = `${key}_bucket_${bucket}`;
      const bucketCount = observations.filter(obs => obs.value <= bucket).length;
      this.values.set(bucketKey, { value: bucketCount, timestamp: Date.now() });
    }

    // Update count and sum
    this.values.set(`${key}_count`, { value: observations.length, timestamp: Date.now() });
    this.values.set(`${key}_sum`, {
      value: observations.reduce((sum, obs) => sum + obs.value, 0),
      timestamp: Date.now(),
    });
  }
}

class LightweightSummary extends LightweightMetric {
  constructor(config) {
    super(config, 'summary');
    this.percentiles = config.percentiles || [0.5, 0.9, 0.95, 0.99];
    this.observations = new Map();
  }

  observe(labels = {}, value) {
    const key = this._getLabelKey(labels);
    const observations = this.observations.get(key) || [];
    observations.push({ value, timestamp: Date.now() });
    observations.sort((a, b) => a.value - b.value);
    this.observations.set(key, observations);

    // Calculate percentiles
    for (const percentile of this.percentiles) {
      const index = Math.ceil(percentile * observations.length) - 1;
      const percentileValue = observations[Math.max(0, index)]?.value || 0;
      this.values.set(`${key}_${percentile}`, { value: percentileValue, timestamp: Date.now() });
    }

    // Update count and sum
    this.values.set(`${key}_count`, { value: observations.length, timestamp: Date.now() });
    this.values.set(`${key}_sum`, {
      value: observations.reduce((sum, obs) => sum + obs.value, 0),
      timestamp: Date.now(),
    });
  }
}

// Try to import real prometheus client, fall back to lightweight implementation
let prometheus;

try {
  prometheus = await import('prom-client');
  console.log('✅ Using full Prometheus client implementation');
} catch (error) {
  console.log('ℹ️ Prometheus client not available, using lightweight fallback');

  prometheus = {
    Registry: LightweightRegistry,
    Counter: LightweightCounter,
    Gauge: LightweightGauge,
    Histogram: LightweightHistogram,
    Summary: LightweightSummary,
    collectDefaultMetrics: (config) => {
      console.log('📊 Default metrics collection simulated');
      // Simulate default metrics collection
      if (config.register) {
        const interval = setInterval(() => {
          // This would normally collect Node.js metrics
        }, 10000);
        config.register.defaultMetricsInterval = interval;
      }
    },
  };
}

export class AdvancedMetricsCollector extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      serviceName: config.serviceName || 'merajutasa-service',
      collectDefaultMetrics: config.collectDefaultMetrics !== false,
      customMetricsEnabled: config.customMetricsEnabled !== false,
      histogramBuckets: config.histogramBuckets || [0.1, 0.5, 1, 2, 5, 10, 30, 60],
      summaryPercentiles: config.summaryPercentiles || [0.5, 0.9, 0.95, 0.99],
      metricPrefix: config.metricPrefix || 'merajutasa_',
      ...config,
    };

    // Initialize Prometheus registry
    this.registry = new prometheus.Registry();

    // Metric storage
    this.metrics = new Map();
    this.customMetrics = new Map();
    this.businessMetrics = new Map();

    this.initializeMetrics();
  }

  /**
   * Initialize all metric types
   */
  initializeMetrics() {
    // Collect default Node.js metrics
    if (this.config.collectDefaultMetrics) {
      prometheus.collectDefaultMetrics({
        register: this.registry,
        prefix: this.config.metricPrefix,
      });
    }

    this.initializeServiceMetrics();
    this.initializeBusinessMetrics();
    this.initializePerformanceMetrics();
    this.initializeGovernanceMetrics();
  }

  /**
   * Initialize core service metrics
   */
  initializeServiceMetrics() {
    // HTTP request metrics
    this.metrics.set('http_requests_total', new prometheus.Counter({
      name: `${this.config.metricPrefix}http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'endpoint', 'status_code', 'service'],
      registers: [this.registry],
    }));

    this.metrics.set('http_request_duration', new prometheus.Histogram({
      name: `${this.config.metricPrefix}http_request_duration_seconds`,
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'endpoint', 'status_code', 'service'],
      buckets: this.config.histogramBuckets,
      registers: [this.registry],
    }));

    // Service health metrics
    this.metrics.set('service_health_status', new prometheus.Gauge({
      name: `${this.config.metricPrefix}service_health_status`,
      help: 'Service health status (1 = healthy, 0 = unhealthy)',
      labelNames: ['service', 'component'],
      registers: [this.registry],
    }));

    // Error rate metrics
    this.metrics.set('error_rate', new prometheus.Gauge({
      name: `${this.config.metricPrefix}error_rate`,
      help: 'Current error rate percentage',
      labelNames: ['service', 'error_type'],
      registers: [this.registry],
    }));

    // Throughput metrics
    this.metrics.set('throughput_ops_per_second', new prometheus.Gauge({
      name: `${this.config.metricPrefix}throughput_ops_per_second`,
      help: 'Operations per second throughput',
      labelNames: ['service', 'operation_type'],
      registers: [this.registry],
    }));
  }

  /**
   * Initialize business-specific metrics
   */
  initializeBusinessMetrics() {
    // Signing operations
    this.businessMetrics.set('signing_operations_total', new prometheus.Counter({
      name: `${this.config.metricPrefix}signing_operations_total`,
      help: 'Total number of signing operations',
      labelNames: ['operation_type', 'status', 'key_type'],
      registers: [this.registry],
    }));

    this.businessMetrics.set('signing_operation_duration', new prometheus.Histogram({
      name: `${this.config.metricPrefix}signing_operation_duration_seconds`,
      help: 'Signing operation duration in seconds',
      labelNames: ['operation_type', 'key_type'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
      registers: [this.registry],
    }));

    // Chain operations
    this.businessMetrics.set('chain_operations_total', new prometheus.Counter({
      name: `${this.config.metricPrefix}chain_operations_total`,
      help: 'Total number of chain operations',
      labelNames: ['operation_type', 'status'],
      registers: [this.registry],
    }));

    this.businessMetrics.set('chain_integrity_score', new prometheus.Gauge({
      name: `${this.config.metricPrefix}chain_integrity_score`,
      help: 'Chain integrity score percentage',
      labelNames: ['chain_id'],
      registers: [this.registry],
    }));

    // Equity scoring metrics
    this.businessMetrics.set('equity_score_distribution', new prometheus.Histogram({
      name: `${this.config.metricPrefix}equity_score_distribution`,
      help: 'Distribution of equity scores',
      labelNames: ['category', 'threshold'],
      buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      registers: [this.registry],
    }));

    this.businessMetrics.set('equity_anomaly_detected', new prometheus.Counter({
      name: `${this.config.metricPrefix}equity_anomaly_detected_total`,
      help: 'Total number of equity anomalies detected',
      labelNames: ['anomaly_type', 'severity'],
      registers: [this.registry],
    }));
  }

  /**
   * Initialize performance metrics
   */
  initializePerformanceMetrics() {
    // Cache metrics
    this.metrics.set('cache_operations_total', new prometheus.Counter({
      name: `${this.config.metricPrefix}cache_operations_total`,
      help: 'Total number of cache operations',
      labelNames: ['operation', 'cache_type', 'result'],
      registers: [this.registry],
    }));

    this.metrics.set('cache_hit_ratio', new prometheus.Gauge({
      name: `${this.config.metricPrefix}cache_hit_ratio`,
      help: 'Cache hit ratio percentage',
      labelNames: ['cache_type'],
      registers: [this.registry],
    }));

    // Database metrics
    this.metrics.set('database_operations_total', new prometheus.Counter({
      name: `${this.config.metricPrefix}database_operations_total`,
      help: 'Total number of database operations',
      labelNames: ['operation', 'table', 'status'],
      registers: [this.registry],
    }));

    this.metrics.set('database_connection_pool_size', new prometheus.Gauge({
      name: `${this.config.metricPrefix}database_connection_pool_size`,
      help: 'Current database connection pool size',
      labelNames: ['database', 'state'],
      registers: [this.registry],
    }));
  }

  /**
   * Initialize governance-specific metrics
   */
  initializeGovernanceMetrics() {
    // Governance verification
    this.businessMetrics.set('governance_verifications_total', new prometheus.Counter({
      name: `${this.config.metricPrefix}governance_verifications_total`,
      help: 'Total number of governance verifications',
      labelNames: ['verification_type', 'status'],
      registers: [this.registry],
    }));

    // Policy compliance
    this.businessMetrics.set('policy_compliance_score', new prometheus.Gauge({
      name: `${this.config.metricPrefix}policy_compliance_score`,
      help: 'Policy compliance score percentage',
      labelNames: ['policy_type', 'component'],
      registers: [this.registry],
    }));

    // DEC operations
    this.businessMetrics.set('dec_operations_total', new prometheus.Counter({
      name: `${this.config.metricPrefix}dec_operations_total`,
      help: 'Total number of DEC operations',
      labelNames: ['operation_type', 'status'],
      registers: [this.registry],
    }));

    // Audit events
    this.businessMetrics.set('audit_events_total', new prometheus.Counter({
      name: `${this.config.metricPrefix}audit_events_total`,
      help: 'Total number of audit events',
      labelNames: ['event_type', 'severity'],
      registers: [this.registry],
    }));
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(method, endpoint, statusCode, duration, service = this.config.serviceName) {
    const labels = { method, endpoint, status_code: statusCode, service };

    this.metrics.get('http_requests_total').inc(labels);
    this.metrics.get('http_request_duration').observe(labels, duration / 1000);

    // Emit event for real-time monitoring
    this.emit('http_request', { method, endpoint, statusCode, duration, service });
  }

  /**
   * Record signing operation metrics
   */
  recordSigningOperation(operationType, status, keyType, duration) {
    const labels = { operation_type: operationType, status, key_type: keyType };

    this.businessMetrics.get('signing_operations_total').inc(labels);
    if (duration !== undefined) {
      this.businessMetrics.get('signing_operation_duration').observe(
        { operation_type: operationType, key_type: keyType },
        duration / 1000,
      );
    }

    this.emit('signing_operation', { operationType, status, keyType, duration });
  }

  /**
   * Record chain operation metrics
   */
  recordChainOperation(operationType, status, metadata = {}) {
    const labels = { operation_type: operationType, status };

    this.businessMetrics.get('chain_operations_total').inc(labels);

    // Update chain integrity if provided
    if (metadata.integrityScore !== undefined && metadata.chainId) {
      this.businessMetrics.get('chain_integrity_score').set(
        { chain_id: metadata.chainId },
        metadata.integrityScore,
      );
    }

    this.emit('chain_operation', { operationType, status, metadata });
  }

  /**
   * Record equity scoring metrics
   */
  recordEquityScore(score, category, threshold) {
    this.businessMetrics.get('equity_score_distribution').observe(
      { category, threshold },
      score,
    );

    this.emit('equity_score', { score, category, threshold });
  }

  /**
   * Record equity anomaly detection
   */
  recordEquityAnomaly(anomalyType, severity) {
    this.businessMetrics.get('equity_anomaly_detected').inc({
      anomaly_type: anomalyType,
      severity,
    });

    this.emit('equity_anomaly', { anomalyType, severity });
  }

  /**
   * Record cache operation metrics
   */
  recordCacheOperation(operation, cacheType, result) {
    this.metrics.get('cache_operations_total').inc({
      operation,
      cache_type: cacheType,
      result,
    });

    this.emit('cache_operation', { operation, cacheType, result });
  }

  /**
   * Update cache hit ratio
   */
  updateCacheHitRatio(cacheType, hitRatio) {
    this.metrics.get('cache_hit_ratio').set({ cache_type: cacheType }, hitRatio);
    this.emit('cache_hit_ratio', { cacheType, hitRatio });
  }

  /**
   * Record governance verification
   */
  recordGovernanceVerification(verificationType, status) {
    this.businessMetrics.get('governance_verifications_total').inc({
      verification_type: verificationType,
      status,
    });

    this.emit('governance_verification', { verificationType, status });
  }

  /**
   * Update service health status
   */
  updateServiceHealth(service, component, isHealthy) {
    this.metrics.get('service_health_status').set(
      { service, component },
      isHealthy ? 1 : 0,
    );

    this.emit('service_health', { service, component, isHealthy });
  }

  /**
   * Update error rate
   */
  updateErrorRate(service, errorType, rate) {
    this.metrics.get('error_rate').set({ service, error_type: errorType }, rate);
    this.emit('error_rate', { service, errorType, rate });
  }

  /**
   * Create custom metric
   */
  createCustomMetric(name, type, config) {
    const metricName = `${this.config.metricPrefix}${name}`;
    let metric;

    switch (type) {
    case 'counter':
      metric = new prometheus.Counter({
        name: metricName,
        help: config.help,
        labelNames: config.labelNames || [],
        registers: [this.registry],
      });
      break;
    case 'gauge':
      metric = new prometheus.Gauge({
        name: metricName,
        help: config.help,
        labelNames: config.labelNames || [],
        registers: [this.registry],
      });
      break;
    case 'histogram':
      metric = new prometheus.Histogram({
        name: metricName,
        help: config.help,
        labelNames: config.labelNames || [],
        buckets: config.buckets || this.config.histogramBuckets,
        registers: [this.registry],
      });
      break;
    case 'summary':
      metric = new prometheus.Summary({
        name: metricName,
        help: config.help,
        labelNames: config.labelNames || [],
        percentiles: config.percentiles || this.config.summaryPercentiles,
        registers: [this.registry],
      });
      break;
    default:
      throw new Error(`Unsupported metric type: ${type}`);
    }

    this.customMetrics.set(name, metric);
    return metric;
  }

  /**
   * Get custom metric
   */
  getCustomMetric(name) {
    return this.customMetrics.get(name);
  }

  /**
   * Record custom metric value
   */
  recordCustomMetric(name, operation, value, labels = {}) {
    let metric = this.customMetrics.get(name);
    if (!metric) {
      // Auto-create as Gauge by default to enable write-on-first-use
      try {
        metric = new prometheus.Gauge({
          name: `${this.config.metricPrefix}${name}`,
          help: `Auto-created metric ${name}`,
          labelNames: [],
          registers: [this.registry],
        });
        this.customMetrics.set(name, metric);
      } catch (e) {
        console.warn(`Custom metric '${name}' not found and auto-create failed: ${e.message}`);
        return;
      }
    }

    switch (operation) {
    case 'inc':
      metric.inc(labels, value);
      break;
    case 'dec':
      metric.dec(labels, value);
      break;
    case 'set':
      metric.set(labels, value);
      break;
    case 'observe':
      metric.observe(labels, value);
      break;
    default:
      console.warn(`Unknown operation '${operation}' for metric '${name}'`);
    }

    this.emit('custom_metric', { name, operation, value, labels });
  }

  /**
   * Get metrics for Prometheus scraping
   */
  async getMetrics() {
    return await this.registry.metrics();
  }

  /**
   * Get metric values in JSON format
   */
  async getMetricsJSON() {
    const metrics = await this.registry.getMetricsAsJSON();
    return {
      timestamp: new Date().toISOString(),
      service: this.config.serviceName,
      metrics,
    };
  }

  /**
   * Get business metrics summary
   */
  getBusinessMetricsSummary() {
    const businessKeys = Array.from(this.businessMetrics.keys());
    return {
      totalBusinessMetrics: businessKeys.length,
      signingMetrics: businessKeys.filter(k => k.includes('signing')).length,
      chainMetrics: businessKeys.filter(k => k.includes('chain')).length,
      equityMetrics: businessKeys.filter(k => k.includes('equity')).length,
      governanceMetrics: businessKeys.filter(k => k.includes('governance')).length,
    };
  }

  /**
   * Health check for metrics system
   */
  async healthCheck() {
    try {
      const metricsCount = (await this.registry.getMetricsAsJSON()).length;
      const businessSummary = this.getBusinessMetricsSummary();

      return {
        status: 'healthy',
        service: this.config.serviceName,
        totalMetrics: metricsCount,
        customMetrics: this.customMetrics.size,
        businessMetrics: businessSummary,
        defaultMetricsEnabled: this.config.collectDefaultMetrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.registry.clear();
    this.metrics.clear();
    this.customMetrics.clear();
    this.businessMetrics.clear();
  }

  /**
   * Start real-time metric streaming
   */
  startMetricStreaming(interval = 5000) {
    if (this.streamingInterval) {
      clearInterval(this.streamingInterval);
    }

    this.streamingInterval = setInterval(async () => {
      try {
        const metrics = await this.getMetricsJSON();
        this.emit('metrics_stream', metrics);
      } catch (error) {
        console.error('Error streaming metrics:', error);
      }
    }, interval);

    console.log(`Started metric streaming with ${interval}ms interval`);
  }

  /**
   * Stop metric streaming
   */
  stopMetricStreaming() {
    if (this.streamingInterval) {
      clearInterval(this.streamingInterval);
      this.streamingInterval = null;
      console.log('Stopped metric streaming');
    }
  }
}

// Singleton instance for global use
let globalMetricsCollector = null;

/**
 * Get or create global metrics collector
 */
export function getAdvancedMetricsCollector(config = {}) {
  if (!globalMetricsCollector) {
    globalMetricsCollector = new AdvancedMetricsCollector(config);
  }
  return globalMetricsCollector;
}

export default AdvancedMetricsCollector;
