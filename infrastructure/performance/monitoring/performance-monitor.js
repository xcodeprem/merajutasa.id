/**
 * Performance Monitor for Phase 2 Week 2 Performance Enhancement
 * Provides comprehensive performance tracking with intelligent analysis
 */

import EventEmitter from 'events';
import fs from 'fs/promises';
import path from 'path';
import { performance, PerformanceObserver } from 'perf_hooks';

export class PerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Monitoring intervals
      sampleInterval: options.sampleInterval || 5000, // 5 seconds
      reportInterval: options.reportInterval || 60000, // 1 minute
      
      // Data retention
      maxDataPoints: options.maxDataPoints || 1000,
      retentionDays: options.retentionDays || 7,
      
      // Performance thresholds
      slowRequestThreshold: options.slowRequestThreshold || 1000, // 1 second
      memoryWarningThreshold: options.memoryWarningThreshold || 0.8, // 80%
      cpuWarningThreshold: options.cpuWarningThreshold || 0.7, // 70%
      
      // Metrics collection
      collectSystemMetrics: options.collectSystemMetrics !== false,
      collectRequestMetrics: options.collectRequestMetrics !== false,
      collectMemoryMetrics: options.collectMemoryMetrics !== false,
      collectEventLoopMetrics: options.collectEventLoopMetrics !== false,
      
      // Storage
      dataPath: options.dataPath || 'artifacts/performance-monitoring',
      enablePersistence: options.enablePersistence !== false,
      
      ...options
    };

    // Performance data storage
    this.systemMetrics = [];
    this.requestMetrics = [];
    this.eventLoopMetrics = [];
    this.memoryMetrics = [];
    
    // Real-time tracking
    this.activeRequests = new Map();
    this.currentSystemLoad = null;
    this.performanceBaseline = null;
    
    // Timers
    this.sampleTimer = null;
    this.reportTimer = null;
    
    // Performance observers
    this.performanceObserver = null;
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      slowRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
      throughput: 0,
      lastSample: null
    };

    this.initialize();
  }

  async initialize() {
    try {
      await this.ensureDataDirectory();
      await this.loadHistoricalData();
      this.setupPerformanceObserver();
      this.startMonitoring();
      
      console.log('✅ Performance Monitor initialized successfully');
    } catch (error) {
      console.error('❌ Performance Monitor initialization failed:', error.message);
      throw error;
    }
  }

  async ensureDataDirectory() {
    if (this.config.enablePersistence) {
      try {
        await fs.mkdir(this.config.dataPath, { recursive: true });
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw error;
        }
      }
    }
  }

  async loadHistoricalData() {
    if (!this.config.enablePersistence) return;

    try {
      const dataFile = path.join(this.config.dataPath, 'performance-history.json');
      const data = await fs.readFile(dataFile, 'utf-8');
      const history = JSON.parse(data);
      
      this.systemMetrics = history.systemMetrics || [];
      this.requestMetrics = history.requestMetrics || [];
      this.eventLoopMetrics = history.eventLoopMetrics || [];
      this.memoryMetrics = history.memoryMetrics || [];
      this.performanceBaseline = history.performanceBaseline || null;
      
      console.log('📊 Loaded performance history');
    } catch (error) {
      console.log('📊 No performance history found, starting fresh');
    }
  }

  setupPerformanceObserver() {
    if (!this.config.collectEventLoopMetrics) return;

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordEventLoopMetric({
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            timestamp: Date.now()
          });
        });
      });

      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    } catch (error) {
      console.warn('⚠️ Performance Observer not available:', error.message);
    }
  }

  startMonitoring() {
    // Start system metrics collection
    if (this.config.collectSystemMetrics) {
      this.sampleTimer = setInterval(() => {
        this.collectSystemMetrics();
      }, this.config.sampleInterval);
    }

    // Start periodic reporting
    this.reportTimer = setInterval(() => {
      this.generatePerformanceReport();
    }, this.config.reportInterval);

    console.log('🚀 Performance monitoring started');
  }

  // Record request start
  startRequest(requestId, metadata = {}) {
    if (!this.config.collectRequestMetrics) return;

    const startTime = performance.now();
    this.activeRequests.set(requestId, {
      startTime,
      startTimestamp: Date.now(),
      metadata
    });

    this.emit('request:started', { requestId, startTime, metadata });
  }

  // Record request completion
  endRequest(requestId, success = true, statusCode = 200, errorDetails = null) {
    if (!this.config.collectRequestMetrics) return;

    const endTime = performance.now();
    const request = this.activeRequests.get(requestId);
    
    if (!request) {
      console.warn(`⚠️ Request ${requestId} not found in active requests`);
      return;
    }

    const duration = endTime - request.startTime;
    const metric = {
      requestId,
      duration,
      success,
      statusCode,
      errorDetails,
      timestamp: Date.now(),
      metadata: request.metadata
    };

    // Record metric
    this.recordRequestMetric(metric);
    
    // Remove from active requests
    this.activeRequests.delete(requestId);
    
    this.emit('request:completed', metric);
  }

  // Record request metric
  recordRequestMetric(metric) {
    this.requestMetrics.push(metric);
    this.stats.totalRequests++;
    
    // Check for slow requests
    if (metric.duration > this.config.slowRequestThreshold) {
      this.stats.slowRequests++;
      this.emit('request:slow', metric);
    }

    // Update statistics
    this.updateRequestStats();
    
    // Cleanup old data
    if (this.requestMetrics.length > this.config.maxDataPoints) {
      this.requestMetrics = this.requestMetrics.slice(-this.config.maxDataPoints);
    }
  }

  // Record event loop metric
  recordEventLoopMetric(metric) {
    this.eventLoopMetrics.push(metric);
    
    // Cleanup old data
    if (this.eventLoopMetrics.length > this.config.maxDataPoints) {
      this.eventLoopMetrics = this.eventLoopMetrics.slice(-this.config.maxDataPoints);
    }
  }

  // Collect system metrics
  async collectSystemMetrics() {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      const metric = {
        timestamp: Date.now(),
        memory: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
          arrayBuffers: memoryUsage.arrayBuffers
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        uptime: process.uptime(),
        activeRequests: this.activeRequests.size,
        eventLoopDelay: await this.measureEventLoopDelay()
      };

      this.systemMetrics.push(metric);
      this.currentSystemLoad = metric;
      
      // Check thresholds
      this.checkPerformanceThresholds(metric);
      
      // Store memory metric separately
      if (this.config.collectMemoryMetrics) {
        this.memoryMetrics.push({
          timestamp: metric.timestamp,
          ...metric.memory
        });
      }
      
      // Cleanup old data
      if (this.systemMetrics.length > this.config.maxDataPoints) {
        this.systemMetrics = this.systemMetrics.slice(-this.config.maxDataPoints);
      }
      
      if (this.memoryMetrics.length > this.config.maxDataPoints) {
        this.memoryMetrics = this.memoryMetrics.slice(-this.config.maxDataPoints);
      }
      
      this.emit('metrics:collected', metric);
      
    } catch (error) {
      console.error('Error collecting system metrics:', error.message);
    }
  }

  // Measure event loop delay
  async measureEventLoopDelay() {
    return new Promise((resolve) => {
      const start = performance.now();
      setImmediate(() => {
        const delay = performance.now() - start;
        resolve(delay);
      });
    });
  }

  // Check performance thresholds
  checkPerformanceThresholds(metric) {
    const memoryUsageRatio = metric.memory.heapUsed / metric.memory.heapTotal;
    
    // Memory warning
    if (memoryUsageRatio > this.config.memoryWarningThreshold) {
      this.emit('warning:memory', {
        usage: memoryUsageRatio,
        threshold: this.config.memoryWarningThreshold,
        metric
      });
    }

    // Event loop delay warning
    if (metric.eventLoopDelay > 100) { // 100ms is concerning
      this.emit('warning:event_loop', {
        delay: metric.eventLoopDelay,
        metric
      });
    }
  }

  // Update request statistics
  updateRequestStats() {
    if (this.requestMetrics.length === 0) return;

    const recentMetrics = this.requestMetrics.slice(-100); // Last 100 requests
    const durations = recentMetrics.map(m => m.duration).sort((a, b) => a - b);
    const errors = recentMetrics.filter(m => !m.success).length;
    
    this.stats.averageResponseTime = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    this.stats.p95ResponseTime = this.calculatePercentile(durations, 95);
    this.stats.p99ResponseTime = this.calculatePercentile(durations, 99);
    this.stats.errorRate = (errors / recentMetrics.length) * 100;
    this.stats.lastSample = Date.now();
    
    // Calculate throughput (requests per minute)
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = this.requestMetrics.filter(m => m.timestamp > oneMinuteAgo);
    this.stats.throughput = recentRequests.length;
  }

  // Calculate percentile
  calculatePercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  // Generate performance report
  async generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      period: 'last_hour',
      summary: this.stats,
      currentLoad: this.currentSystemLoad,
      trends: this.calculateTrends(),
      alerts: this.generateAlerts(),
      recommendations: this.generateRecommendations()
    };

    // Save report
    if (this.config.enablePersistence) {
      await this.savePerformanceReport(report);
    }

    this.emit('report:generated', report);
    return report;
  }

  // Calculate performance trends
  calculateTrends() {
    const trends = {};
    
    // Response time trend
    if (this.requestMetrics.length >= 2) {
      const recent = this.requestMetrics.slice(-50);
      const older = this.requestMetrics.slice(-100, -50);
      
      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;
        const olderAvg = older.reduce((sum, m) => sum + m.duration, 0) / older.length;
        
        trends.responseTime = {
          direction: recentAvg > olderAvg ? 'increasing' : 'decreasing',
          change: ((recentAvg - olderAvg) / olderAvg * 100).toFixed(2)
        };
      }
    }

    // Memory trend
    if (this.memoryMetrics.length >= 2) {
      const recent = this.memoryMetrics.slice(-10);
      const older = this.memoryMetrics.slice(-20, -10);
      
      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, m) => sum + m.heapUsed, 0) / recent.length;
        const olderAvg = older.reduce((sum, m) => sum + m.heapUsed, 0) / older.length;
        
        trends.memory = {
          direction: recentAvg > olderAvg ? 'increasing' : 'decreasing',
          change: ((recentAvg - olderAvg) / olderAvg * 100).toFixed(2)
        };
      }
    }

    return trends;
  }

  // Generate performance alerts
  generateAlerts() {
    const alerts = [];
    
    // High error rate alert
    if (this.stats.errorRate > 5) {
      alerts.push({
        type: 'error_rate',
        severity: this.stats.errorRate > 10 ? 'critical' : 'warning',
        message: `High error rate: ${this.stats.errorRate.toFixed(2)}%`,
        value: this.stats.errorRate,
        threshold: 5
      });
    }

    // Slow response time alert
    if (this.stats.p95ResponseTime > this.config.slowRequestThreshold) {
      alerts.push({
        type: 'response_time',
        severity: this.stats.p95ResponseTime > this.config.slowRequestThreshold * 2 ? 'critical' : 'warning',
        message: `Slow response times: P95 = ${this.stats.p95ResponseTime.toFixed(2)}ms`,
        value: this.stats.p95ResponseTime,
        threshold: this.config.slowRequestThreshold
      });
    }

    // Memory usage alert
    if (this.currentSystemLoad) {
      const memoryRatio = this.currentSystemLoad.memory.heapUsed / this.currentSystemLoad.memory.heapTotal;
      if (memoryRatio > this.config.memoryWarningThreshold) {
        alerts.push({
          type: 'memory_usage',
          severity: memoryRatio > 0.9 ? 'critical' : 'warning',
          message: `High memory usage: ${(memoryRatio * 100).toFixed(2)}%`,
          value: memoryRatio,
          threshold: this.config.memoryWarningThreshold
        });
      }
    }

    return alerts;
  }

  // Generate performance recommendations
  generateRecommendations() {
    const recommendations = [];
    
    // Response time recommendations
    if (this.stats.p95ResponseTime > this.config.slowRequestThreshold) {
      recommendations.push({
        type: 'response_time',
        priority: 'high',
        message: 'Consider implementing caching or optimizing database queries',
        details: 'High P95 response times indicate potential bottlenecks'
      });
    }

    // Memory recommendations
    if (this.currentSystemLoad) {
      const memoryRatio = this.currentSystemLoad.memory.heapUsed / this.currentSystemLoad.memory.heapTotal;
      if (memoryRatio > 0.8) {
        recommendations.push({
          type: 'memory',
          priority: 'medium',
          message: 'Consider increasing heap size or implementing memory optimization',
          details: 'High memory usage may lead to garbage collection pressure'
        });
      }
    }

    // Throughput recommendations
    if (this.stats.throughput < 10) {
      recommendations.push({
        type: 'throughput',
        priority: 'low',
        message: 'Low request throughput - monitor for traffic patterns',
        details: 'Consistently low throughput may indicate system underutilization'
      });
    }

    return recommendations;
  }

  // Save performance report
  async savePerformanceReport(report) {
    try {
      const filename = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
      const filepath = path.join(this.config.dataPath, filename);
      await fs.writeFile(filepath, JSON.stringify(report, null, 2));
      
      // Also save as latest report
      const latestPath = path.join(this.config.dataPath, 'performance-report-latest.json');
      await fs.writeFile(latestPath, JSON.stringify(report, null, 2));
      
      // Save historical data
      const historyData = {
        systemMetrics: this.systemMetrics,
        requestMetrics: this.requestMetrics,
        eventLoopMetrics: this.eventLoopMetrics,
        memoryMetrics: this.memoryMetrics,
        performanceBaseline: this.performanceBaseline
      };
      
      const historyPath = path.join(this.config.dataPath, 'performance-history.json');
      await fs.writeFile(historyPath, JSON.stringify(historyData, null, 2));
      
    } catch (error) {
      console.error('Failed to save performance report:', error.message);
    }
  }

  // Get current performance metrics
  getCurrentMetrics() {
    return {
      stats: this.stats,
      currentLoad: this.currentSystemLoad,
      activeRequests: this.activeRequests.size,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  // Health check
  async healthCheck() {
    const metrics = this.getCurrentMetrics();
    const alerts = this.generateAlerts();
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    
    return {
      status: criticalAlerts.length > 0 ? 'degraded' : 'healthy',
      alerts: alerts.length,
      criticalAlerts: criticalAlerts.length,
      metrics,
      monitoring: {
        systemMetrics: this.config.collectSystemMetrics,
        requestMetrics: this.config.collectRequestMetrics,
        memoryMetrics: this.config.collectMemoryMetrics,
        eventLoopMetrics: this.config.collectEventLoopMetrics
      }
    };
  }

  // Graceful shutdown
  async shutdown() {
    console.log('🛑 Shutting down Performance Monitor...');
    
    // Clear timers
    if (this.sampleTimer) {
      clearInterval(this.sampleTimer);
    }
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }
    
    // Disconnect performance observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    // Save final report
    if (this.config.enablePersistence) {
      await this.generatePerformanceReport();
    }
    
    console.log('✅ Performance Monitor shutdown complete');
  }
}

// Singleton instance
let performanceMonitor = null;

export function getPerformanceMonitor(options = {}) {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor(options);
  }
  return performanceMonitor;
}

export default { PerformanceMonitor, getPerformanceMonitor };