/**
 * Frontend Performance Summary Tool
 * Provides a unified dashboard view of all frontend performance metrics
 * Integrates with cache stats and performance tests
 */

import fs from 'fs/promises';
import path from 'path';
import { getFrontendPerformanceTest } from './frontend-performance-test.js';
import { getCacheStatsMonitor } from './cache-stats.js';

export class FrontendPerformanceSummary {
  constructor(options = {}) {
    this.config = {
      // Data sources
      performanceDataPath: options.performanceDataPath || 'artifacts/frontend-performance',
      cacheDataPath: options.cacheDataPath || 'artifacts/cache-statistics',
      
      // Summary settings
      historicalDays: options.historicalDays || 7,
      refreshInterval: options.refreshInterval || 60000, // 1 minute
      
      // Thresholds for summary status
      performanceThreshold: options.performanceThreshold || 85,
      cacheHitRateThreshold: options.cacheHitRateThreshold || 80,
      apiSuccessRateThreshold: options.apiSuccessRateThreshold || 95,
      
      ...options
    };

    this.performanceTest = getFrontendPerformanceTest();
    this.cacheMonitor = getCacheStatsMonitor();
  }

  /**
   * Generate comprehensive frontend performance summary
   */
  async generateSummary() {
    console.log('📊 Generating Frontend Performance Summary...');
    
    try {
      // Collect current performance data
      const currentPerformance = await this.collectCurrentPerformance();
      
      // Collect cache statistics
      const cacheStats = await this.collectCacheStats();
      
      // Load historical data
      const historical = await this.loadHistoricalData();
      
      // Generate insights and trends
      const insights = this.generateInsights(currentPerformance, cacheStats, historical);
      
      // Create summary report
      const summary = {
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          generatedBy: 'frontend-performance-summary'
        },
        current: {
          performance: currentPerformance,
          cache: cacheStats,
          status: this.determineOverallStatus(currentPerformance, cacheStats)
        },
        historical,
        insights,
        recommendations: this.generateRecommendations(currentPerformance, cacheStats, insights)
      };

      console.log('✅ Frontend performance summary generated');
      return summary;
      
    } catch (error) {
      console.error('❌ Failed to generate frontend performance summary:', error.message);
      return {
        metadata: {
          timestamp: new Date().toISOString(),
          error: error.message
        },
        status: 'ERROR'
      };
    }
  }

  /**
   * Collect current performance metrics
   */
  async collectCurrentPerformance() {
    try {
      return await this.performanceTest.runPerformanceTest();
    } catch (error) {
      console.warn('⚠️ Could not collect current performance data:', error.message);
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Collect current cache statistics
   */
  async collectCacheStats() {
    try {
      return await this.cacheMonitor.getCacheStats();
    } catch (error) {
      console.warn('⚠️ Could not collect cache statistics:', error.message);
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Load historical performance data
   */
  async loadHistoricalData() {
    const historical = {
      performance: [],
      cache: [],
      trends: {}
    };

    try {
      // Load recent performance test reports
      const performanceFiles = await this.getRecentFiles(this.config.performanceDataPath, 'frontend-performance-test-');
      for (const file of performanceFiles.slice(-10)) { // Last 10 reports
        try {
          const data = JSON.parse(await fs.readFile(file, 'utf8'));
          historical.performance.push({
            timestamp: data.metadata?.timestamp,
            grade: data.summary?.overallGrade,
            uiResponseTime: data.ui?.responseTime,
            apiSuccessRate: data.api?.summary?.successRate,
            apiResponseTime: data.api?.summary?.avgResponseTime
          });
        } catch (err) {
          console.warn(`⚠️ Could not parse ${file}:`, err.message);
        }
      }

      // Load recent cache statistics
      const cacheFiles = await this.getRecentFiles(this.config.cacheDataPath, 'cache-stats-');
      for (const file of cacheFiles.slice(-10)) { // Last 10 reports
        try {
          const data = JSON.parse(await fs.readFile(file, 'utf8'));
          historical.cache.push({
            timestamp: data.timestamp,
            hitRate: data.performance?.overall?.hitRate,
            responseTime: data.performance?.overall?.avgResponseTime,
            efficiency: data.efficiency?.efficiency?.overall
          });
        } catch (err) {
          console.warn(`⚠️ Could not parse ${file}:`, err.message);
        }
      }

      // Calculate trends
      historical.trends = this.calculateTrends(historical);

    } catch (error) {
      console.warn('⚠️ Could not load historical data:', error.message);
    }

    return historical;
  }

  /**
   * Get recent files from directory matching pattern
   */
  async getRecentFiles(dirPath, pattern) {
    try {
      const files = await fs.readdir(dirPath);
      const matchingFiles = files
        .filter(file => file.startsWith(pattern) && file.endsWith('.json'))
        .map(file => path.join(dirPath, file))
        .sort();
      
      return matchingFiles;
    } catch (error) {
      return [];
    }
  }

  /**
   * Calculate performance trends from historical data
   */
  calculateTrends(historical) {
    const trends = {};

    // Performance trends
    if (historical.performance.length >= 2) {
      const recent = historical.performance.slice(-5);
      const uiTimes = recent.map(p => p.uiResponseTime).filter(t => t != null);
      const apiSuccessRates = recent.map(p => p.apiSuccessRate).filter(r => r != null);
      const apiTimes = recent.map(p => p.apiResponseTime).filter(t => t != null);

      trends.performance = {
        uiResponseTime: this.calculateTrend(uiTimes),
        apiSuccessRate: this.calculateTrend(apiSuccessRates),
        apiResponseTime: this.calculateTrend(apiTimes)
      };
    }

    // Cache trends
    if (historical.cache.length >= 2) {
      const recent = historical.cache.slice(-5);
      const hitRates = recent.map(c => c.hitRate).filter(r => r != null);
      const responseTimes = recent.map(c => c.responseTime).filter(t => t != null);

      trends.cache = {
        hitRate: this.calculateTrend(hitRates),
        responseTime: this.calculateTrend(responseTimes)
      };
    }

    return trends;
  }

  /**
   * Calculate trend direction for a series of values
   */
  calculateTrend(values) {
    if (values.length < 2) return 'insufficient_data';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Generate performance insights
   */
  generateInsights(performance, cache, historical) {
    const insights = {
      performance: [],
      cache: [],
      integration: []
    };

    // Performance insights
    if (performance.summary?.overallGrade) {
      const grade = performance.summary.overallGrade;
      insights.performance.push({
        type: 'overall_grade',
        value: grade,
        message: `Current frontend performance grade: ${grade}`,
        impact: this.getGradeImpact(grade)
      });
    }

    if (performance.api?.summary?.successRate != null) {
      const successRate = performance.api.summary.successRate;
      if (successRate < this.config.apiSuccessRateThreshold) {
        insights.performance.push({
          type: 'api_reliability',
          value: successRate,
          message: `API success rate (${successRate}%) is below target (${this.config.apiSuccessRateThreshold}%)`,
          impact: 'high'
        });
      }
    }

    // Cache insights
    if (cache.performance?.overall?.hitRate != null) {
      const hitRate = cache.performance.overall.hitRate;
      if (hitRate < this.config.cacheHitRateThreshold) {
        insights.cache.push({
          type: 'cache_efficiency',
          value: hitRate,
          message: `Cache hit rate (${hitRate}%) is below target (${this.config.cacheHitRateThreshold}%)`,
          impact: 'medium'
        });
      }
    }

    // Integration insights
    if (performance.api?.summary?.avgResponseTime && cache.performance?.overall?.avgResponseTime) {
      const apiTime = performance.api.summary.avgResponseTime;
      const cacheTime = cache.performance.overall.avgResponseTime;
      
      if (apiTime > cacheTime * 3) {
        insights.integration.push({
          type: 'cache_optimization_opportunity',
          value: { apiTime, cacheTime },
          message: `API response times (${apiTime}ms) could benefit from better caching (current: ${cacheTime}ms)`,
          impact: 'medium'
        });
      }
    }

    // Trend insights
    if (historical.trends?.performance?.apiResponseTime === 'increasing') {
      insights.performance.push({
        type: 'performance_degradation',
        message: 'API response times are trending upward',
        impact: 'medium'
      });
    }

    if (historical.trends?.cache?.hitRate === 'decreasing') {
      insights.cache.push({
        type: 'cache_degradation',
        message: 'Cache hit rates are trending downward',
        impact: 'medium'
      });
    }

    return insights;
  }

  /**
   * Get impact level for performance grade
   */
  getGradeImpact(grade) {
    const gradeImpact = {
      'A+': 'none',
      'A': 'low',
      'B+': 'low',
      'B': 'medium',
      'C': 'high',
      'D': 'critical',
      'F': 'critical'
    };
    return gradeImpact[grade] || 'unknown';
  }

  /**
   * Determine overall frontend status
   */
  determineOverallStatus(performance, cache) {
    const issues = [];

    // Check performance status
    if (performance.summary?.status === 'FAIL') {
      issues.push('performance_failure');
    }

    // Check cache efficiency
    if (cache.performance?.overall?.hitRate < this.config.cacheHitRateThreshold) {
      issues.push('cache_inefficiency');
    }

    // Check API reliability
    if (performance.api?.summary?.successRate < this.config.apiSuccessRateThreshold) {
      issues.push('api_reliability');
    }

    // Check response times
    if (performance.api?.summary?.avgResponseTime > 500) {
      issues.push('slow_api_response');
    }

    return {
      level: issues.length === 0 ? 'HEALTHY' : 
             issues.length <= 2 ? 'WARNING' : 'CRITICAL',
      issues,
      score: Math.max(0, 100 - (issues.length * 25))
    };
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(performance, cache, insights) {
    const recommendations = [];

    // High-impact recommendations
    const highImpactInsights = [...insights.performance, ...insights.cache, ...insights.integration]
      .filter(insight => insight.impact === 'high' || insight.impact === 'critical');

    highImpactInsights.forEach(insight => {
      switch (insight.type) {
        case 'api_reliability':
          recommendations.push({
            priority: 'critical',
            category: 'reliability',
            title: 'Improve API Reliability',
            description: insight.message,
            actions: [
              'Investigate failing API endpoints',
              'Implement better error handling and retries',
              'Add circuit breaker patterns',
              'Monitor API dependencies'
            ]
          });
          break;

        case 'cache_efficiency':
          recommendations.push({
            priority: 'high',
            category: 'performance',
            title: 'Optimize Cache Strategy',
            description: insight.message,
            actions: [
              'Review cache TTL settings',
              'Implement cache warming strategies',
              'Optimize cache key patterns',
              'Consider cache partitioning'
            ]
          });
          break;

        case 'cache_optimization_opportunity':
          recommendations.push({
            priority: 'medium',
            category: 'optimization',
            title: 'Leverage Caching for API Performance',
            description: insight.message,
            actions: [
              'Identify cacheable API responses',
              'Implement response caching',
              'Add cache headers to API responses',
              'Consider edge caching'
            ]
          });
          break;
      }
    });

    // General recommendations based on performance grades
    if (performance.summary?.overallGrade && this.getGradeImpact(performance.summary.overallGrade) !== 'none') {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        title: 'Improve Overall Performance',
        description: `Current grade: ${performance.summary.overallGrade}`,
        actions: [
          'Run detailed Lighthouse audits when Chrome is available',
          'Optimize Core Web Vitals',
          'Implement performance monitoring',
          'Consider frontend optimization techniques'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Generate dashboard-style summary for console output
   */
  formatDashboard(summary) {
    const lines = [];
    
    lines.push('🎯 Frontend Performance Dashboard');
    lines.push('================================');
    lines.push('');
    
    // Overall status
    const status = summary.current?.status;
    const statusIcon = status?.level === 'HEALTHY' ? '✅' : 
                      status?.level === 'WARNING' ? '⚠️' : '❌';
    lines.push(`${statusIcon} Overall Status: ${status?.level || 'UNKNOWN'} (Score: ${status?.score || 0}/100)`);
    lines.push('');
    
    // Performance metrics
    if (summary.current?.performance) {
      const perf = summary.current.performance;
      lines.push('📊 Performance Metrics:');
      if (perf.summary?.overallGrade) {
        lines.push(`   Grade: ${perf.summary.overallGrade}`);
      }
      if (perf.ui?.responseTime) {
        lines.push(`   UI Response Time: ${perf.ui.responseTime}ms`);
      }
      if (perf.api?.summary) {
        lines.push(`   API Success Rate: ${perf.api.summary.successRate}%`);
        lines.push(`   API Response Time: ${perf.api.summary.avgResponseTime}ms`);
      }
      lines.push('');
    }
    
    // Cache metrics
    if (summary.current?.cache?.performance?.overall) {
      const cache = summary.current.cache.performance.overall;
      lines.push('💾 Cache Performance:');
      lines.push(`   Hit Rate: ${cache.hitRate}%`);
      lines.push(`   Response Time: ${cache.avgResponseTime}ms`);
      lines.push('');
    }
    
    // Top recommendations
    if (summary.recommendations && summary.recommendations.length > 0) {
      lines.push('🎯 Top Recommendations:');
      summary.recommendations.slice(0, 3).forEach((rec, i) => {
        lines.push(`   ${i + 1}. ${rec.title} (${rec.priority})`);
      });
      lines.push('');
    }
    
    lines.push(`Generated: ${summary.metadata?.timestamp}`);
    
    return lines.join('\n');
  }
}

// Static factory method
export function getFrontendPerformanceSummary(options = {}) {
  return new FrontendPerformanceSummary(options);
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const summary = new FrontendPerformanceSummary();
  const command = process.argv[2] || 'dashboard';

  switch (command) {
    case 'dashboard':
      const result = await summary.generateSummary();
      console.log(summary.formatDashboard(result));
      break;
    case 'json':
      const jsonResult = await summary.generateSummary();
      console.log(JSON.stringify(jsonResult, null, 2));
      break;
    default:
      console.log('Available commands: dashboard, json');
      process.exit(1);
  }
}