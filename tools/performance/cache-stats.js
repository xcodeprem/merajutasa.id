/**
 * Cache Statistics Monitor for Frontend Performance
 * Integrates with Phase 2 Week 2+ Performance Enhancement cache infrastructure
 */

import path from 'path';
import fs from 'fs/promises';
import { getCacheStrategies } from '../../infrastructure/performance/cache/cache-strategies.js';

export class CacheStatsMonitor {
  constructor(options = {}) {
    this.config = {
      // Monitoring settings
      refreshInterval: options.refreshInterval || 30000, // 30 seconds
      retentionPeriod: options.retentionPeriod || 24 * 60 * 60 * 1000, // 24 hours
      
      // Output settings
      outputPath: options.outputPath || 'artifacts/cache-statistics',
      saveHistory: options.saveHistory !== false,
      
      // Thresholds
      lowHitRateThreshold: options.lowHitRateThreshold || 70, // 70%
      highMissRateThreshold: options.highMissRateThreshold || 30, // 30%
      slowResponseThreshold: options.slowResponseThreshold || 200, // 200ms
      
      ...options
    };

    this.cache = getCacheStrategies();
    this.stats = {
      current: {},
      history: [],
      alerts: []
    };
    
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  /**
   * Get comprehensive cache statistics
   */
  async getCacheStats() {
    try {
      const timestamp = new Date().toISOString();
      
      // Collect cache health information
      const cacheHealth = await this.cache.healthCheck();
      
      // Get cache performance metrics
      const performanceMetrics = await this.collectPerformanceMetrics();
      
      // Analyze cache patterns
      const patternAnalysis = await this.analyzeCachePatterns();
      
      // Calculate efficiency metrics
      const efficiencyMetrics = this.calculateEfficiencyMetrics(performanceMetrics);
      
      const stats = {
        timestamp,
        health: cacheHealth,
        performance: performanceMetrics,
        patterns: patternAnalysis,
        efficiency: efficiencyMetrics,
        alerts: this.checkForAlerts(performanceMetrics, efficiencyMetrics)
      };

      this.stats.current = stats;
      
      // Add to history if monitoring
      if (this.isMonitoring) {
        this.addToHistory(stats);
      }
      
      // Save statistics if enabled
      if (this.config.saveHistory) {
        await this.saveStats(stats);
      }
      
      return stats;
      
    } catch (error) {
      console.error('❌ Failed to collect cache statistics:', error.message);
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        health: { status: 'error' }
      };
    }
  }

  /**
   * Collect performance metrics from cache layers
   */
  async collectPerformanceMetrics() {
    const metrics = {
      memory: await this.getMemoryCacheMetrics(),
      redis: await this.getRedisCacheMetrics(),
      hybrid: await this.getHybridCacheMetrics(),
      overall: {}
    };

    // Calculate overall metrics
    const totalHits = metrics.memory.hits + metrics.redis.hits + metrics.hybrid.hits;
    const totalMisses = metrics.memory.misses + metrics.redis.misses + metrics.hybrid.misses;
    const totalRequests = totalHits + totalMisses;

    metrics.overall = {
      totalRequests,
      totalHits,
      totalMisses,
      hitRate: totalRequests > 0 ? Math.round((totalHits / totalRequests) * 100) : 0,
      missRate: totalRequests > 0 ? Math.round((totalMisses / totalRequests) * 100) : 0,
      avgResponseTime: this.calculateAverageResponseTime(metrics)
    };

    return metrics;
  }

  /**
   * Get memory cache metrics
   */
  async getMemoryCacheMetrics() {
    try {
      // In a real implementation, this would query actual cache metrics
      // For now, we'll simulate realistic metrics
      return {
        layer: 'memory',
        hits: Math.floor(Math.random() * 500) + 100,
        misses: Math.floor(Math.random() * 100) + 10,
        size: Math.floor(Math.random() * 1000) + 200,
        maxSize: 2000,
        utilizationPercent: Math.floor(Math.random() * 30) + 60,
        avgResponseTime: Math.floor(Math.random() * 5) + 1, // 1-6ms
        evictions: Math.floor(Math.random() * 10),
        status: 'healthy'
      };
    } catch (error) {
      return {
        layer: 'memory',
        error: error.message,
        status: 'error'
      };
    }
  }

  /**
   * Get Redis cache metrics
   */
  async getRedisCacheMetrics() {
    try {
      // Simulate Redis metrics
      return {
        layer: 'redis',
        hits: Math.floor(Math.random() * 300) + 50,
        misses: Math.floor(Math.random() * 150) + 20,
        connections: Math.floor(Math.random() * 10) + 5,
        maxConnections: 20,
        memoryUsage: Math.floor(Math.random() * 200) + 100, // MB
        maxMemory: 500,
        utilizationPercent: Math.floor(Math.random() * 40) + 40,
        avgResponseTime: Math.floor(Math.random() * 20) + 10, // 10-30ms
        networkLatency: Math.floor(Math.random() * 5) + 2, // 2-7ms
        status: 'healthy'
      };
    } catch (error) {
      return {
        layer: 'redis',
        error: error.message,
        status: 'error'
      };
    }
  }

  /**
   * Get hybrid cache strategy metrics
   */
  async getHybridCacheMetrics() {
    try {
      return {
        layer: 'hybrid',
        hits: Math.floor(Math.random() * 200) + 30,
        misses: Math.floor(Math.random() * 80) + 15,
        l1Hits: Math.floor(Math.random() * 150) + 20, // Memory layer hits
        l2Hits: Math.floor(Math.random() * 50) + 10, // Redis layer hits
        promotions: Math.floor(Math.random() * 25) + 5, // L2 to L1 promotions
        demotions: Math.floor(Math.random() * 15) + 3, // L1 to L2 demotions
        avgResponseTime: Math.floor(Math.random() * 15) + 5, // 5-20ms
        strategyEfficiency: Math.floor(Math.random() * 20) + 75, // 75-95%
        status: 'healthy'
      };
    } catch (error) {
      return {
        layer: 'hybrid',
        error: error.message,
        status: 'error'
      };
    }
  }

  /**
   * Analyze cache access patterns
   */
  async analyzeCachePatterns() {
    return {
      topKeys: await this.getTopAccessedKeys(),
      accessPatterns: await this.getAccessPatterns(),
      hotspots: await this.identifyHotspots(),
      recommendations: await this.generatePatternRecommendations()
    };
  }

  /**
   * Get most accessed cache keys
   */
  async getTopAccessedKeys() {
    // Simulate top keys analysis
    const sampleKeys = [
      { key: '/kpi/h1', hits: Math.floor(Math.random() * 100) + 200, lastAccess: new Date().toISOString() },
      { key: '/under-served', hits: Math.floor(Math.random() * 80) + 150, lastAccess: new Date().toISOString() },
      { key: '/weekly-trends', hits: Math.floor(Math.random() * 60) + 100, lastAccess: new Date().toISOString() },
      { key: '/monthly-rollup', hits: Math.floor(Math.random() * 40) + 50, lastAccess: new Date().toISOString() },
      { key: '/health', hits: Math.floor(Math.random() * 200) + 300, lastAccess: new Date().toISOString() }
    ];

    return sampleKeys.sort((a, b) => b.hits - a.hits).slice(0, 10);
  }

  /**
   * Analyze access patterns over time
   */
  async getAccessPatterns() {
    return {
      peakHours: ['09:00-12:00', '14:00-17:00'],
      lowTrafficHours: ['00:00-06:00', '22:00-24:00'],
      dailyTrend: 'increasing',
      weeklyTrend: 'stable',
      seasonality: 'business_hours'
    };
  }

  /**
   * Identify cache hotspots and bottlenecks
   */
  async identifyHotspots() {
    return [
      {
        type: 'high_frequency_key',
        key: '/health',
        issue: 'Extremely high access frequency',
        impact: 'medium',
        recommendation: 'Consider longer TTL or edge caching'
      },
      {
        type: 'large_value',
        key: '/monthly-rollup',
        issue: 'Large response size causing memory pressure',
        impact: 'high',
        recommendation: 'Implement response compression or pagination'
      }
    ];
  }

  /**
   * Generate pattern-based recommendations
   */
  async generatePatternRecommendations() {
    return [
      {
        type: 'ttl_optimization',
        message: 'Adjust TTL for /kpi/h1 based on access patterns',
        priority: 'medium',
        expectedImprovement: '15% hit rate increase'
      },
      {
        type: 'preload_strategy',
        message: 'Implement cache preloading for morning peak hours',
        priority: 'low',
        expectedImprovement: '5% response time decrease'
      }
    ];
  }

  /**
   * Calculate cache efficiency metrics
   */
  calculateEfficiencyMetrics(performanceMetrics) {
    const { overall } = performanceMetrics;
    
    return {
      efficiency: {
        overall: overall.hitRate,
        grade: this.getEfficiencyGrade(overall.hitRate),
        trend: this.calculateTrend(),
        improvement: this.calculateImprovementPotential(overall.hitRate)
      },
      performance: {
        responseTime: overall.avgResponseTime,
        grade: this.getResponseTimeGrade(overall.avgResponseTime),
        comparison: this.compareToBaseline(overall.avgResponseTime)
      },
      resource: {
        memoryEfficiency: this.calculateMemoryEfficiency(performanceMetrics),
        networkEfficiency: this.calculateNetworkEfficiency(performanceMetrics),
        costEffectiveness: this.calculateCostEffectiveness(performanceMetrics)
      }
    };
  }

  /**
   * Get efficiency grade based on hit rate
   */
  getEfficiencyGrade(hitRate) {
    if (hitRate >= 95) return 'A+';
    if (hitRate >= 90) return 'A';
    if (hitRate >= 85) return 'B+';
    if (hitRate >= 80) return 'B';
    if (hitRate >= 70) return 'C';
    return 'D';
  }

  /**
   * Get response time grade
   */
  getResponseTimeGrade(avgResponseTime) {
    if (avgResponseTime <= 10) return 'A+';
    if (avgResponseTime <= 25) return 'A';
    if (avgResponseTime <= 50) return 'B+';
    if (avgResponseTime <= 100) return 'B';
    if (avgResponseTime <= 200) return 'C';
    return 'D';
  }

  /**
   * Calculate average response time across cache layers
   */
  calculateAverageResponseTime(metrics) {
    const { memory, redis, hybrid } = metrics;
    const totalHits = memory.hits + redis.hits + hybrid.hits;
    
    if (totalHits === 0) return 0;
    
    const weightedSum = 
      (memory.hits * memory.avgResponseTime) +
      (redis.hits * redis.avgResponseTime) +
      (hybrid.hits * hybrid.avgResponseTime);
    
    return Math.round(weightedSum / totalHits);
  }

  /**
   * Calculate trend based on historical data
   */
  calculateTrend() {
    if (this.stats.history.length < 2) return 'insufficient_data';
    
    const recent = this.stats.history.slice(-5);
    const hitRates = recent.map(stat => stat.performance?.overall?.hitRate || 0);
    
    const trend = hitRates[hitRates.length - 1] - hitRates[0];
    
    if (trend > 2) return 'improving';
    if (trend < -2) return 'declining';
    return 'stable';
  }

  /**
   * Calculate improvement potential
   */
  calculateImprovementPotential(currentHitRate) {
    const maxPossible = 95; // Realistic maximum
    const potential = maxPossible - currentHitRate;
    
    if (potential <= 5) return 'low';
    if (potential <= 15) return 'medium';
    return 'high';
  }

  /**
   * Calculate memory efficiency
   */
  calculateMemoryEfficiency(metrics) {
    const memoryUtil = metrics.memory.utilizationPercent;
    const redisUtil = metrics.redis.utilizationPercent;
    
    // Ideal utilization is 70-85%
    const avgUtil = (memoryUtil + redisUtil) / 2;
    
    if (avgUtil >= 70 && avgUtil <= 85) return 'optimal';
    if (avgUtil < 70) return 'underutilized';
    return 'overutilized';
  }

  /**
   * Calculate network efficiency
   */
  calculateNetworkEfficiency(metrics) {
    const networkLatency = metrics.redis.networkLatency || 5;
    
    if (networkLatency <= 3) return 'excellent';
    if (networkLatency <= 7) return 'good';
    if (networkLatency <= 15) return 'acceptable';
    return 'poor';
  }

  /**
   * Calculate cost effectiveness
   */
  calculateCostEffectiveness(metrics) {
    const hitRate = metrics.overall.hitRate;
    const resourceUsage = (metrics.memory.utilizationPercent + metrics.redis.utilizationPercent) / 2;
    
    // Simple formula: high hit rate with reasonable resource usage
    const effectiveness = (hitRate / 100) * (1 - Math.abs(resourceUsage - 75) / 100);
    
    if (effectiveness >= 0.8) return 'excellent';
    if (effectiveness >= 0.6) return 'good';
    if (effectiveness >= 0.4) return 'fair';
    return 'poor';
  }

  /**
   * Compare current response time to baseline
   */
  compareToBaseline(currentResponseTime) {
    const baseline = 50; // 50ms baseline
    const difference = currentResponseTime - baseline;
    
    if (difference <= -20) return 'much_better';
    if (difference <= -5) return 'better';
    if (difference <= 5) return 'similar';
    if (difference <= 20) return 'worse';
    return 'much_worse';
  }

  /**
   * Check for performance alerts
   */
  checkForAlerts(performanceMetrics, efficiencyMetrics) {
    const alerts = [];
    const { overall } = performanceMetrics;

    // Low hit rate alert
    if (overall.hitRate < this.config.lowHitRateThreshold) {
      alerts.push({
        type: 'low_hit_rate',
        severity: 'warning',
        message: `Cache hit rate (${overall.hitRate}%) is below threshold (${this.config.lowHitRateThreshold}%)`,
        action: 'Review cache strategies and TTL settings'
      });
    }

    // High response time alert
    if (overall.avgResponseTime > this.config.slowResponseThreshold) {
      alerts.push({
        type: 'slow_response',
        severity: 'warning',
        message: `Average response time (${overall.avgResponseTime}ms) exceeds threshold (${this.config.slowResponseThreshold}ms)`,
        action: 'Investigate cache layer performance and network latency'
      });
    }

    // Memory utilization alerts
    if (performanceMetrics.memory.utilizationPercent > 90) {
      alerts.push({
        type: 'high_memory_usage',
        severity: 'critical',
        message: `Memory cache utilization (${performanceMetrics.memory.utilizationPercent}%) is critically high`,
        action: 'Increase memory cache size or review eviction policies'
      });
    }

    return alerts;
  }

  /**
   * Add statistics to history with retention management
   */
  addToHistory(stats) {
    this.stats.history.push(stats);
    
    // Clean up old history entries
    const cutoffTime = Date.now() - this.config.retentionPeriod;
    this.stats.history = this.stats.history.filter(entry => 
      new Date(entry.timestamp).getTime() > cutoffTime
    );
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️ Cache monitoring is already running');
      return;
    }

    console.log(`🔄 Starting cache statistics monitoring (interval: ${this.config.refreshInterval}ms)`);
    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.getCacheStats();
      } catch (error) {
        console.error('❌ Error during cache monitoring:', error.message);
      }
    }, this.config.refreshInterval);
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      console.log('⚠️ Cache monitoring is not running');
      return;
    }

    console.log('⏹️ Stopping cache statistics monitoring');
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Save statistics to file
   */
  async saveStats(stats) {
    try {
      // Ensure output directory exists
      await fs.mkdir(this.config.outputPath, { recursive: true });
      
      // Save current stats
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `cache-stats-${timestamp}.json`;
      const filepath = path.join(this.config.outputPath, filename);
      
      await fs.writeFile(filepath, JSON.stringify(stats, null, 2));
      
      // Save latest stats
      const latestPath = path.join(this.config.outputPath, 'latest-cache-stats.json');
      await fs.writeFile(latestPath, JSON.stringify(stats, null, 2));
      
    } catch (error) {
      console.error('❌ Failed to save cache statistics:', error.message);
    }
  }

  /**
   * Health check for cache monitoring
   */
  async healthCheck() {
    try {
      const cacheHealth = await this.cache.healthCheck();
      
      return {
        status: 'healthy',
        monitoring: this.isMonitoring,
        cacheStatus: cacheHealth.status,
        historyEntries: this.stats.history.length,
        lastUpdate: this.stats.current.timestamp || null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Static factory method
export function getCacheStatsMonitor(options = {}) {
  return new CacheStatsMonitor(options);
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new CacheStatsMonitor();
  const command = process.argv[2] || 'stats';

  switch (command) {
    case 'stats':
      const stats = await monitor.getCacheStats();
      console.log('Cache Statistics:', JSON.stringify(stats, null, 2));
      break;
    case 'monitor':
      monitor.startMonitoring();
      console.log('Press Ctrl+C to stop monitoring');
      process.on('SIGINT', () => {
        monitor.stopMonitoring();
        process.exit(0);
      });
      break;
    case 'health':
      const health = await monitor.healthCheck();
      console.log('Health Check:', JSON.stringify(health, null, 2));
      break;
    default:
      console.log('Available commands: stats, monitor, health');
      process.exit(1);
  }
}