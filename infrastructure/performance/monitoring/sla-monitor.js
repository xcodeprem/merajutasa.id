/**
 * SLA Monitor for Phase 2 Week 2 Performance Enhancement
 * Provides comprehensive SLA tracking with intelligent alerting
 */

import EventEmitter from 'events';
import fs from 'fs/promises';
import path from 'path';

export class SLAMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Monitoring intervals
      checkInterval: options.checkInterval || 60000, // 1 minute
      reportInterval: options.reportInterval || 300000, // 5 minutes
      
      // Data retention
      retentionDays: options.retentionDays || 30,
      maxDataPoints: options.maxDataPoints || 10000,
      
      // Alert settings
      alertCooldown: options.alertCooldown || 300000, // 5 minutes
      enableAlerts: options.enableAlerts !== false,
      
      // Storage
      dataPath: options.dataPath || 'artifacts/sla-monitoring',
      ...options
    };

    // SLA targets for different services
    this.slaTargets = {
      'signing_service': {
        availability: 99.9,      // 99.9% uptime
        latency_p95: 100,        // 95th percentile < 100ms
        latency_p99: 500,        // 99th percentile < 500ms
        error_rate: 0.1,         // Error rate < 0.1%
        throughput_min: 10       // Minimum 10 requests/minute
      },
      'chain_service': {
        availability: 99.95,     // 99.95% uptime (critical service)
        latency_p95: 200,        // 95th percentile < 200ms
        latency_p99: 1000,       // 99th percentile < 1s
        error_rate: 0.05,        // Error rate < 0.05%
        throughput_min: 5        // Minimum 5 requests/minute
      },
      'collector_service': {
        availability: 99.5,      // 99.5% uptime
        latency_p95: 150,        // 95th percentile < 150ms
        latency_p99: 750,        // 99th percentile < 750ms
        error_rate: 0.2,         // Error rate < 0.2%
        throughput_min: 20       // Minimum 20 requests/minute
      },
      'backup_service': {
        availability: 95.0,      // 95% uptime (lower priority)
        latency_p95: 5000,       // 95th percentile < 5s
        latency_p99: 15000,      // 99th percentile < 15s
        error_rate: 1.0,         // Error rate < 1%
        throughput_min: 1        // Minimum 1 request/minute
      }
    };

    // Internal state
    this.serviceMetrics = new Map();
    this.alertHistory = new Map();
    this.monitoringActive = false;
    this.checkTimer = null;
    this.reportTimer = null;

    // Initialize
    this.initialize();
  }

  async initialize() {
    try {
      await this.ensureDataDirectory();
      console.log('✅ SLA Monitor initialized successfully');
    } catch (error) {
      console.error('❌ SLA Monitor initialization failed:', error.message);
      throw error;
    }
  }

  async ensureDataDirectory() {
    try {
      await fs.mkdir(this.config.dataPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  createEmptyWindow() {
    return {
      requests: 0,
      errors: 0,
      totalLatency: 0,
      latencies: [],
      uptimeChecks: 0,
      downtimeChecks: 0,
      startTime: Date.now(),
      endTime: null
    };
  }

  // Record service metrics
  recordMetric(service, metric) {
    const {
      responseTime,
      success = true,
      statusCode = 200,
      endpoint = 'unknown'
    } = metric;

    if (!this.serviceMetrics.has(service)) {
      this.serviceMetrics.set(service, {
        dataPoints: [],
        currentWindow: this.createEmptyWindow(),
        lastCheck: null
      });
    }

    const serviceData = this.serviceMetrics.get(service);
    const window = serviceData.currentWindow;

    // Update current window
    window.requests++;
    if (!success || statusCode >= 400) {
      window.errors++;
    }
    
    if (responseTime) {
      window.totalLatency += responseTime;
      window.latencies.push(responseTime);
      
      // Keep latencies sorted for percentile calculations
      if (window.latencies.length > 1000) {
        window.latencies.sort((a, b) => a - b);
        window.latencies = window.latencies.slice(-1000); // Keep last 1000
      }
    }

    // Health check recording
    if (success && statusCode < 400) {
      window.uptimeChecks++;
    } else {
      window.downtimeChecks++;
    }

    this.emit('metric:recorded', { service, metric, window });
  }

  // Evaluate SLA for a specific service
  async evaluateSLA(service, timeWindow = '1h') {
    const targets = this.slaTargets[service];
    if (!targets) {
      throw new Error(`No SLA targets defined for service: ${service}`);
    }

    const serviceData = this.serviceMetrics.get(service);
    if (!serviceData) {
      return {
        service,
        status: 'no_data',
        message: 'No metrics recorded for service',
        timestamp: new Date().toISOString()
      };
    }

    const metrics = this.calculateMetrics(serviceData, timeWindow);
    const slaStatus = {
      service,
      timeWindow,
      status: 'healthy',
      violations: [],
      metrics,
      targets,
      timestamp: new Date().toISOString()
    };

    // Check each SLA target
    Object.entries(targets).forEach(([metric, target]) => {
      const current = metrics[metric];
      if (current !== undefined && this.isViolation(metric, current, target)) {
        const violation = {
          metric,
          current,
          target,
          severity: this.calculateSeverity(metric, current, target),
          violationRatio: this.calculateViolationRatio(metric, current, target)
        };
        
        slaStatus.violations.push(violation);
        slaStatus.status = violation.severity === 'critical' ? 'critical' : 'degraded';
      }
    });

    return slaStatus;
  }

  calculateMetrics(serviceData, timeWindow) {
    const window = serviceData.currentWindow;
    const totalChecks = window.uptimeChecks + window.downtimeChecks;
    
    const metrics = {
      availability: totalChecks > 0 ? (window.uptimeChecks / totalChecks * 100) : 100,
      error_rate: window.requests > 0 ? (window.errors / window.requests * 100) : 0,
      throughput: window.requests, // Total requests in current window
      total_requests: window.requests,
      total_errors: window.errors
    };

    // Calculate latency percentiles
    if (window.latencies.length > 0) {
      const sorted = [...window.latencies].sort((a, b) => a - b);
      metrics.latency_avg = window.totalLatency / window.latencies.length;
      metrics.latency_p50 = this.calculatePercentile(sorted, 50);
      metrics.latency_p95 = this.calculatePercentile(sorted, 95);
      metrics.latency_p99 = this.calculatePercentile(sorted, 99);
      metrics.latency_min = sorted[0];
      metrics.latency_max = sorted[sorted.length - 1];
    } else {
      metrics.latency_avg = 0;
      metrics.latency_p50 = 0;
      metrics.latency_p95 = 0;
      metrics.latency_p99 = 0;
      metrics.latency_min = 0;
      metrics.latency_max = 0;
    }

    return metrics;
  }

  calculatePercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  isViolation(metric, current, target) {
    switch (metric) {
      case 'availability':
        return current < target;
      case 'error_rate':
        return current > target;
      case 'latency_p95':
      case 'latency_p99':
        return current > target;
      case 'throughput_min':
        return current < target;
      default:
        return false;
    }
  }

  calculateSeverity(metric, current, target) {
    const ratio = this.calculateViolationRatio(metric, current, target);
    
    if (ratio >= 2.0) return 'critical';
    if (ratio >= 1.5) return 'major';
    if (ratio >= 1.2) return 'minor';
    return 'warning';
  }

  calculateViolationRatio(metric, current, target) {
    switch (metric) {
      case 'availability':
        return target / Math.max(current, 0.1);
      case 'error_rate':
        return current / Math.max(target, 0.01);
      case 'latency_p95':
      case 'latency_p99':
        return current / Math.max(target, 1);
      case 'throughput_min':
        return target / Math.max(current, 0.1);
      default:
        return 1.0;
    }
  }

  // Get current SLA status for all services
  async getCurrentStatus() {
    const status = {};
    
    for (const service of Object.keys(this.slaTargets)) {
      try {
        status[service] = await this.evaluateSLA(service);
      } catch (error) {
        status[service] = {
          service,
          status: 'error',
          error: error.message
        };
      }
    }
    
    return status;
  }

  // Health check
  async healthCheck() {
    return {
      status: this.monitoringActive ? 'active' : 'inactive',
      servicesMonitored: Object.keys(this.slaTargets).length,
      dataPoints: Array.from(this.serviceMetrics.values())
        .reduce((sum, data) => sum + data.dataPoints.length, 0),
      alertsInHistory: this.alertHistory.size,
      uptime: this.monitoringActive ? 'active' : 'inactive'
    };
  }
}

// Singleton instance
let slaMonitor = null;

export function getSLAMonitor(options = {}) {
  if (!slaMonitor) {
    slaMonitor = new SLAMonitor(options);
  }
  return slaMonitor;
}

export default { SLAMonitor, getSLAMonitor };