/**
 * Enhanced Signer Service with Performance Optimizations
 * Phase 2 Week 2+ Integration
 */

import { getCacheStrategies } from '../cache/cache-strategies.js';
import { getResponseCompression } from '../optimization/response-compression.js';
import { getSLAMonitor } from '../monitoring/sla-monitor.js';
import { getPerformanceMonitor } from '../monitoring/performance-monitor.js';

export class EnhancedSignerService {
  constructor(baseService, options = {}) {
    this.baseService = baseService;
    this.config = {
      enableCaching: options.enableCaching !== false,
      enableCompression: options.enableCompression !== false,
      enableSLAMonitoring: options.enableSLAMonitoring !== false,
      enablePerformanceTracking: options.enablePerformanceTracking !== false,
      cacheKeyPrefix: options.cacheKeyPrefix || 'signer:',
      cacheTTL: options.cacheTTL || 300, // 5 minutes
      ...options,
    };

    // Initialize performance components
    this.cache = this.config.enableCaching ? getCacheStrategies() : null;
    this.compression = this.config.enableCompression ? getResponseCompression() : null;
    this.slaMonitor = this.config.enableSLAMonitoring ? getSLAMonitor() : null;
    this.perfMonitor = this.config.enablePerformanceTracking ? getPerformanceMonitor() : null;

    // Request tracking
    this.activeRequests = new Map();
  }

  // Enhanced sign method with performance optimizations
  async sign(payload, options = {}) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      // Start performance tracking
      if (this.perfMonitor) {
        this.perfMonitor.startRequest(requestId, {
          endpoint: '/sign',
          method: 'POST',
          payloadSize: JSON.stringify(payload).length,
        });
      }

      // Check cache first
      if (this.cache && !options.bypassCache) {
        const cacheKey = this.generateCacheKey(payload);

        const cachedResult = await this.cache.cacheAside(cacheKey, async () => {
          return await this.performSigning(payload, options);
        }, {
          ttl: this.config.cacheTTL,
          useCompression: true,
        });

        // Record metrics
        this.recordSuccessMetrics(requestId, startTime, true);
        return cachedResult;
      }

      // Perform signing without cache
      const result = await this.performSigning(payload, options);

      // Record metrics
      this.recordSuccessMetrics(requestId, startTime, false);
      return result;

    } catch (error) {
      // Record error metrics
      this.recordErrorMetrics(requestId, startTime, error);
      throw error;
    }
  }

  // Core signing logic (delegates to base service)
  async performSigning(payload, options) {
    if (this.baseService && this.baseService.sign) {
      return await this.baseService.sign(payload, options);
    }

    // Fallback implementation
    return {
      signature: `enhanced_signature_${Date.now()}`,
      canonical: JSON.stringify(payload),
      hash_sha256: `hash_${Date.now()}`,
      timestamp: new Date().toISOString(),
      enhanced: true,
    };
  }

  // Generate cache key for signing operations
  generateCacheKey(payload) {
    // Simple hash for demo without requiring crypto
    const payloadStr = JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < payloadStr.length; i++) {
      const char = payloadStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `${this.config.cacheKeyPrefix}sign:${Math.abs(hash).toString(16)}`;
  }

  // Generate unique request ID
  generateRequestId() {
    return `signer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Record successful operation metrics
  recordSuccessMetrics(requestId, startTime, fromCache) {
    const duration = Date.now() - startTime;

    // Performance monitoring
    if (this.perfMonitor) {
      this.perfMonitor.endRequest(requestId, true, 200);
    }

    // SLA monitoring
    if (this.slaMonitor) {
      this.slaMonitor.recordMetric('signing_service', {
        responseTime: duration,
        success: true,
        statusCode: 200,
        fromCache,
      });
    }
  }

  // Record error metrics
  recordErrorMetrics(requestId, startTime, error) {
    const duration = Date.now() - startTime;

    // Performance monitoring
    if (this.perfMonitor) {
      this.perfMonitor.endRequest(requestId, false, 500, error.message);
    }

    // SLA monitoring
    if (this.slaMonitor) {
      this.slaMonitor.recordMetric('signing_service', {
        responseTime: duration,
        success: false,
        statusCode: 500,
        error: error.message,
      });
    }
  }

  // Health check with performance metrics
  async healthCheck() {
    const checks = {
      service: 'enhanced_signer_service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      performance: {},
    };

    try {
      // Check cache health
      if (this.cache) {
        const cacheHealth = await this.cache.healthCheck();
        checks.performance.cache = {
          status: cacheHealth.status,
          hitRate: cacheHealth.stats.overallHitRate,
        };
      }

      // Check SLA status
      if (this.slaMonitor) {
        const slaStatus = await this.slaMonitor.evaluateSLA('signing_service');
        checks.performance.sla = {
          status: slaStatus.status,
          availability: slaStatus.metrics?.availability,
          avgLatency: slaStatus.metrics?.latency_avg,
        };
      }

      // Overall health assessment
      const hasIssues = Object.values(checks.performance).some(
        metric => metric.status === 'degraded' || metric.status === 'critical',
      );

      if (hasIssues) {
        checks.status = 'degraded';
      }

    } catch (error) {
      checks.status = 'error';
      checks.error = error.message;
    }

    return checks;
  }
}

export default EnhancedSignerService;
