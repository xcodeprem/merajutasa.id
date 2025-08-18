/**
 * MerajutASA.id - Phase 2 Week 3: Anomaly Detection System
 * 
 * Advanced anomaly detection for system and business metrics
 * Provides intelligent anomaly detection using statistical methods
 * 
 * Features:
 * - Statistical anomaly detection (Z-score, IQR)
 * - Machine learning-based detection
 * - Business logic anomaly detection
 * - Real-time anomaly alerting
 * - Historical baseline learning
 * - Adaptive thresholds
 * 
 * @version 1.0.0
 * @since Phase 2 Week 3
 */

import EventEmitter from 'events';
import { v4 as uuidv4 } from 'uuid';

export class AnomalyDetectionSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      serviceName: config.serviceName || 'merajutasa-service',
      enableStatisticalDetection: config.enableStatisticalDetection !== false,
      enableBusinessLogicDetection: config.enableBusinessLogicDetection !== false,
      baselineWindow: config.baselineWindow || 3600000, // 1 hour
      anomalyThreshold: config.anomalyThreshold || 2.5, // Z-score threshold
      learningPeriod: config.learningPeriod || 604800000, // 7 days
      alertingEnabled: config.alertingEnabled !== false,
      ...config
    };

    // Anomaly detection state
    this.baselines = new Map();
    this.anomalies = new Map();
    this.detectionRules = new Map();
    this.metricHistory = new Map();
    
    // Statistical models
    this.statisticalModels = new Map();
    this.businessModels = new Map();
    
    this.initialize();
  }

  /**
   * Initialize the anomaly detection system
   */
  initialize() {
    this.setupStatisticalDetectors();
    this.setupBusinessLogicDetectors();
    this.setupAnomalyRules();
    this.startAnomalyProcessor();
    
    console.log(`Anomaly detection system initialized for ${this.config.serviceName}`);
  }

  /**
   * Setup statistical anomaly detectors
   */
  setupStatisticalDetectors() {
    if (!this.config.enableStatisticalDetection) return;

    // Response time anomaly detection
    this.addStatisticalDetector('response_time', {
      name: 'Response Time Anomaly',
      metric: 'avg_response_time',
      method: 'zscore',
      threshold: 2.5,
      windowSize: 100, // Number of data points for baseline
      sensitivity: 'medium'
    });

    // Error rate anomaly detection
    this.addStatisticalDetector('error_rate', {
      name: 'Error Rate Anomaly',
      metric: 'error_rate',
      method: 'iqr',
      threshold: 1.5,
      windowSize: 50,
      sensitivity: 'high'
    });

    // Throughput anomaly detection
    this.addStatisticalDetector('throughput', {
      name: 'Throughput Anomaly',
      metric: 'requests_per_second',
      method: 'zscore',
      threshold: 2.0,
      windowSize: 200,
      sensitivity: 'medium'
    });

    // Memory usage anomaly detection
    this.addStatisticalDetector('memory_usage', {
      name: 'Memory Usage Anomaly',
      metric: 'memory_usage_percent',
      method: 'trend',
      threshold: 0.8, // 80% increase trend
      windowSize: 30,
      sensitivity: 'low'
    });

    // CPU usage anomaly detection
    this.addStatisticalDetector('cpu_usage', {
      name: 'CPU Usage Anomaly',
      metric: 'cpu_usage_percent',
      method: 'zscore',
      threshold: 2.0,
      windowSize: 50,
      sensitivity: 'medium'
    });
  }

  /**
   * Setup business logic anomaly detectors
   */
  setupBusinessLogicDetectors() {
    if (!this.config.enableBusinessLogicDetection) return;

    // Signing operation anomaly detection
    this.addBusinessLogicDetector('signing_anomaly', {
      name: 'Signing Operation Anomaly',
      condition: (metrics, baseline) => {
        const currentFailureRate = metrics.signing_failures / metrics.signing_total;
        const baselineFailureRate = baseline.avg_signing_failure_rate || 0.01;
        
        // Anomaly if failure rate is 5x higher than baseline
        return currentFailureRate > baselineFailureRate * 5;
      },
      severity: 'high',
      description: 'Signing operation failure rate significantly higher than baseline'
    });

    // Chain integrity anomaly detection
    this.addBusinessLogicDetector('chain_integrity_anomaly', {
      name: 'Chain Integrity Anomaly',
      condition: (metrics, baseline) => {
        const currentIntegrity = metrics.chain_integrity_score;
        const baselineIntegrity = baseline.avg_chain_integrity || 99;
        
        // Anomaly if integrity drops by more than 2%
        return currentIntegrity < baselineIntegrity - 2;
      },
      severity: 'critical',
      description: 'Chain integrity score significantly lower than baseline'
    });

    // Governance verification anomaly detection
    this.addBusinessLogicDetector('governance_anomaly', {
      name: 'Governance Verification Anomaly',
      condition: (metrics, baseline) => {
        const currentFailureRate = metrics.governance_verification_failures / metrics.governance_verifications_total;
        const baselineFailureRate = baseline.avg_governance_failure_rate || 0.05;
        
        // Anomaly if governance failure rate is 3x higher than baseline
        return currentFailureRate > baselineFailureRate * 3;
      },
      severity: 'high',
      description: 'Governance verification failure rate significantly higher than baseline'
    });

    // Equity scoring anomaly detection
    this.addBusinessLogicDetector('equity_anomaly', {
      name: 'Equity Scoring Anomaly',
      condition: (metrics, baseline) => {
        const currentAvgScore = metrics.avg_equity_score;
        const baselineAvgScore = baseline.avg_equity_score || 0.7;
        
        // Anomaly if average equity score drops significantly
        return currentAvgScore < baselineAvgScore * 0.8;
      },
      severity: 'medium',
      description: 'Average equity score significantly lower than baseline'
    });

    // User behavior anomaly detection
    this.addBusinessLogicDetector('user_behavior_anomaly', {
      name: 'User Behavior Anomaly',
      condition: (metrics, baseline) => {
        const currentActiveUsers = metrics.active_users;
        const baselineActiveUsers = baseline.avg_active_users || 100;
        
        // Anomaly if active users suddenly spike or drop significantly
        return Math.abs(currentActiveUsers - baselineActiveUsers) > baselineActiveUsers * 0.5;
      },
      severity: 'medium',
      description: 'User activity significantly different from baseline'
    });
  }

  /**
   * Setup anomaly detection rules
   */
  setupAnomalyRules() {
    // Composite anomaly rule: Multiple system metrics anomalous
    this.addAnomalyRule('system_degradation', {
      name: 'System Degradation',
      condition: (anomalies) => {
        const systemAnomalies = anomalies.filter(a => 
          ['response_time', 'error_rate', 'cpu_usage', 'memory_usage'].includes(a.detector)
        );
        return systemAnomalies.length >= 2;
      },
      severity: 'critical',
      action: 'alert',
      description: 'Multiple system metrics showing anomalous behavior'
    });

    // Business critical anomaly rule
    this.addAnomalyRule('business_critical', {
      name: 'Business Critical Anomaly',
      condition: (anomalies) => {
        return anomalies.some(a => 
          ['signing_anomaly', 'chain_integrity_anomaly'].includes(a.detector) && 
          a.severity === 'critical'
        );
      },
      severity: 'critical',
      action: 'immediate_alert',
      description: 'Critical business function showing anomalous behavior'
    });

    // Performance degradation rule
    this.addAnomalyRule('performance_degradation', {
      name: 'Performance Degradation',
      condition: (anomalies) => {
        const perfAnomalies = anomalies.filter(a => 
          ['response_time', 'throughput'].includes(a.detector)
        );
        return perfAnomalies.length >= 1;
      },
      severity: 'medium',
      action: 'monitor',
      description: 'Performance metrics showing degradation'
    });
  }

  /**
   * Add statistical anomaly detector
   */
  addStatisticalDetector(detectorId, config) {
    this.statisticalModels.set(detectorId, {
      id: detectorId,
      ...config,
      enabled: config.enabled !== false,
      baseline: null,
      lastUpdated: null
    });
  }

  /**
   * Add business logic anomaly detector
   */
  addBusinessLogicDetector(detectorId, config) {
    this.businessModels.set(detectorId, {
      id: detectorId,
      ...config,
      enabled: config.enabled !== false,
      baseline: null,
      lastUpdated: null
    });
  }

  /**
   * Add anomaly detection rule
   */
  addAnomalyRule(ruleId, rule) {
    this.detectionRules.set(ruleId, {
      id: ruleId,
      ...rule,
      enabled: rule.enabled !== false
    });
  }

  /**
   * Process metrics and detect anomalies
   */
  async detectAnomalies(metrics) {
    try {
      const detectedAnomalies = [];

      // Update metric history
      this.updateMetricHistory(metrics);

      // Run statistical detection
      if (this.config.enableStatisticalDetection) {
        const statisticalAnomalies = await this.runStatisticalDetection(metrics);
        detectedAnomalies.push(...statisticalAnomalies);
      }

      // Run business logic detection
      if (this.config.enableBusinessLogicDetection) {
        const businessAnomalies = await this.runBusinessLogicDetection(metrics);
        detectedAnomalies.push(...businessAnomalies);
      }

      // Process composite rules
      const compositeAnomalies = this.processAnomalyRules(detectedAnomalies);
      detectedAnomalies.push(...compositeAnomalies);

      // Store detected anomalies
      detectedAnomalies.forEach(anomaly => {
        this.anomalies.set(anomaly.id, anomaly);
      });

      // Emit events for alerting
      if (this.config.alertingEnabled) {
        detectedAnomalies.forEach(anomaly => {
          this.emit('anomaly_detected', anomaly);
        });
      }

      return detectedAnomalies;

    } catch (error) {
      console.error('Error in anomaly detection:', error);
      return [];
    }
  }

  /**
   * Run statistical anomaly detection
   */
  async runStatisticalDetection(metrics) {
    const anomalies = [];

    for (const [detectorId, detector] of this.statisticalModels) {
      if (!detector.enabled) continue;

      try {
        const metricValue = this.extractMetricValue(metrics, detector.metric);
        if (metricValue === null || metricValue === undefined) continue;

        const baseline = await this.getOrCreateBaseline(detectorId, detector);
        if (!baseline) continue;

        const isAnomaly = this.checkStatisticalAnomaly(metricValue, baseline, detector);
        
        if (isAnomaly) {
          const anomaly = this.createAnomalyRecord(detectorId, detector, metricValue, baseline, metrics);
          anomalies.push(anomaly);
        }

        // Update baseline with new data point
        this.updateBaseline(detectorId, metricValue);

      } catch (error) {
        console.error(`Error in statistical detector ${detectorId}:`, error);
      }
    }

    return anomalies;
  }

  /**
   * Run business logic anomaly detection
   */
  async runBusinessLogicDetection(metrics) {
    const anomalies = [];

    for (const [detectorId, detector] of this.businessModels) {
      if (!detector.enabled) continue;

      try {
        const baseline = await this.getOrCreateBaseline(detectorId, detector);
        if (!baseline) continue;

        const isAnomaly = detector.condition(metrics, baseline);
        
        if (isAnomaly) {
          const anomaly = this.createAnomalyRecord(detectorId, detector, null, baseline, metrics);
          anomalies.push(anomaly);
        }

      } catch (error) {
        console.error(`Error in business logic detector ${detectorId}:`, error);
      }
    }

    return anomalies;
  }

  /**
   * Check statistical anomaly using specified method
   */
  checkStatisticalAnomaly(value, baseline, detector) {
    switch (detector.method) {
      case 'zscore':
        return this.checkZScoreAnomaly(value, baseline, detector.threshold);
      case 'iqr':
        return this.checkIQRAnomaly(value, baseline, detector.threshold);
      case 'trend':
        return this.checkTrendAnomaly(value, baseline, detector.threshold);
      default:
        console.warn(`Unknown anomaly detection method: ${detector.method}`);
        return false;
    }
  }

  /**
   * Check Z-score based anomaly
   */
  checkZScoreAnomaly(value, baseline, threshold) {
    if (!baseline.mean || !baseline.stddev || baseline.stddev === 0) {
      return false;
    }

    const zscore = Math.abs(value - baseline.mean) / baseline.stddev;
    return zscore > threshold;
  }

  /**
   * Check IQR (Interquartile Range) based anomaly
   */
  checkIQRAnomaly(value, baseline, threshold) {
    if (!baseline.q1 || !baseline.q3) {
      return false;
    }

    const iqr = baseline.q3 - baseline.q1;
    const lowerBound = baseline.q1 - (threshold * iqr);
    const upperBound = baseline.q3 + (threshold * iqr);

    return value < lowerBound || value > upperBound;
  }

  /**
   * Check trend-based anomaly
   */
  checkTrendAnomaly(value, baseline, threshold) {
    if (!baseline.trend || !baseline.recent_avg) {
      return false;
    }

    // Check if current value deviates from trend
    const expectedValue = baseline.recent_avg + baseline.trend;
    const deviation = Math.abs(value - expectedValue) / Math.max(expectedValue, 1);

    return deviation > threshold;
  }

  /**
   * Process composite anomaly rules
   */
  processAnomalyRules(anomalies) {
    const compositeAnomalies = [];

    for (const [ruleId, rule] of this.detectionRules) {
      if (!rule.enabled) continue;

      try {
        if (rule.condition(anomalies)) {
          const compositeAnomaly = {
            id: uuidv4(),
            type: 'composite',
            rule: ruleId,
            name: rule.name,
            severity: rule.severity,
            action: rule.action,
            description: rule.description,
            childAnomalies: anomalies.map(a => a.id),
            timestamp: new Date().toISOString(),
            service: this.config.serviceName
          };

          compositeAnomalies.push(compositeAnomaly);
        }
      } catch (error) {
        console.error(`Error in anomaly rule ${ruleId}:`, error);
      }
    }

    return compositeAnomalies;
  }

  /**
   * Create anomaly record
   */
  createAnomalyRecord(detectorId, detector, value, baseline, metrics) {
    return {
      id: uuidv4(),
      type: detector.name.includes('Business') ? 'business' : 'statistical',
      detector: detectorId,
      name: detector.name,
      severity: detector.severity || 'medium',
      description: detector.description || `Anomaly detected in ${detector.metric}`,
      value,
      baseline: this.sanitizeBaseline(baseline),
      metrics: this.sanitizeMetrics(metrics),
      timestamp: new Date().toISOString(),
      service: this.config.serviceName,
      method: detector.method,
      threshold: detector.threshold
    };
  }

  /**
   * Get or create baseline for detector
   */
  async getOrCreateBaseline(detectorId, detector) {
    let baseline = this.baselines.get(detectorId);

    if (!baseline) {
      baseline = await this.createBaseline(detectorId, detector);
      if (baseline) {
        this.baselines.set(detectorId, baseline);
      }
    }

    return baseline;
  }

  /**
   * Create baseline from historical data
   */
  async createBaseline(detectorId, detector) {
    const history = this.metricHistory.get(detector.metric) || [];
    
    if (history.length < detector.windowSize) {
      return null; // Not enough data for baseline
    }

    const recentData = history.slice(-detector.windowSize);
    const values = recentData.map(h => h.value);

    const baseline = {
      detectorId,
      metric: detector.metric,
      method: detector.method,
      dataPoints: values.length,
      mean: this.calculateMean(values),
      median: this.calculateMedian(values),
      stddev: this.calculateStandardDeviation(values),
      min: Math.min(...values),
      max: Math.max(...values),
      q1: this.calculateQuartile(values, 0.25),
      q3: this.calculateQuartile(values, 0.75),
      trend: this.calculateTrend(values),
      recent_avg: this.calculateMean(values.slice(-10)), // Last 10 values
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return baseline;
  }

  /**
   * Update baseline with new data point
   */
  updateBaseline(detectorId, value) {
    const baseline = this.baselines.get(detectorId);
    if (!baseline) return;

    // Simple moving average update (can be made more sophisticated)
    const alpha = 0.1; // Learning rate
    baseline.mean = baseline.mean * (1 - alpha) + value * alpha;
    baseline.updatedAt = new Date().toISOString();

    this.baselines.set(detectorId, baseline);
  }

  /**
   * Update metric history
   */
  updateMetricHistory(metrics) {
    const timestamp = new Date();
    
    for (const [key, value] of Object.entries(metrics)) {
      if (typeof value === 'number' && !isNaN(value)) {
        let history = this.metricHistory.get(key) || [];
        
        history.push({
          value,
          timestamp: timestamp.toISOString()
        });

        // Keep only recent history (last 1000 points)
        if (history.length > 1000) {
          history = history.slice(-1000);
        }

        this.metricHistory.set(key, history);
      }
    }
  }

  /**
   * Extract metric value from metrics object
   */
  extractMetricValue(metrics, metricPath) {
    const keys = metricPath.split('.');
    let value = metrics;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return null;
      }
    }

    return typeof value === 'number' ? value : null;
  }

  /**
   * Calculate statistical functions
   */
  calculateMean(values) {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  calculateStandardDeviation(values) {
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = this.calculateMean(squaredDiffs);
    return Math.sqrt(avgSquaredDiff);
  }

  calculateQuartile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (sorted.length - 1) * percentile;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sorted[lower];
    }
    
    return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;

    // Simple linear trend calculation
    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + val * index, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squared indices

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  /**
   * Sanitize baseline for output
   */
  sanitizeBaseline(baseline) {
    return {
      mean: baseline.mean,
      median: baseline.median,
      stddev: baseline.stddev,
      method: baseline.method,
      dataPoints: baseline.dataPoints
    };
  }

  /**
   * Sanitize metrics for output
   */
  sanitizeMetrics(metrics) {
    const sanitized = {};
    for (const [key, value] of Object.entries(metrics)) {
      if (typeof value === 'number' && !isNaN(value)) {
        sanitized[key] = Math.round(value * 100) / 100;
      }
    }
    return sanitized;
  }

  /**
   * Get current anomalies
   */
  getCurrentAnomalies() {
    return Array.from(this.anomalies.values()).filter(anomaly => {
      // Consider anomalies from last hour as current
      const ageMs = Date.now() - new Date(anomaly.timestamp).getTime();
      return ageMs < 3600000; // 1 hour
    });
  }

  /**
   * Get anomaly statistics
   */
  getAnomalyStatistics() {
    const currentAnomalies = this.getCurrentAnomalies();
    
    const stats = {
      total: currentAnomalies.length,
      bySeverity: {
        critical: currentAnomalies.filter(a => a.severity === 'critical').length,
        high: currentAnomalies.filter(a => a.severity === 'high').length,
        medium: currentAnomalies.filter(a => a.severity === 'medium').length,
        low: currentAnomalies.filter(a => a.severity === 'low').length
      },
      byType: {
        statistical: currentAnomalies.filter(a => a.type === 'statistical').length,
        business: currentAnomalies.filter(a => a.type === 'business').length,
        composite: currentAnomalies.filter(a => a.type === 'composite').length
      },
      detectors: {
        statistical: this.statisticalModels.size,
        business: this.businessModels.size,
        rules: this.detectionRules.size
      }
    };

    return stats;
  }

  /**
   * Start background anomaly processor
   */
  startAnomalyProcessor() {
    this.anomalyProcessorInterval = setInterval(() => {
      this.cleanupOldAnomalies();
      this.updateBaselines();
    }, 300000); // Every 5 minutes

    console.log('Anomaly processor started');
  }

  /**
   * Clean up old anomalies
   */
  cleanupOldAnomalies() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

    for (const [id, anomaly] of this.anomalies) {
      if (new Date(anomaly.timestamp).getTime() < cutoffTime) {
        this.anomalies.delete(id);
      }
    }
  }

  /**
   * Update baselines periodically
   */
  updateBaselines() {
    // Refresh baselines if they're old
    const refreshTime = Date.now() - this.config.baselineWindow;

    for (const [detectorId, baseline] of this.baselines) {
      if (new Date(baseline.updatedAt).getTime() < refreshTime) {
        // Mark for refresh on next detection cycle
        baseline.needsRefresh = true;
      }
    }
  }

  /**
   * Health check for anomaly detection system
   */
  async healthCheck() {
    try {
      const stats = this.getAnomalyStatistics();
      
      return {
        status: 'healthy',
        service: this.config.serviceName,
        configuration: {
          statisticalDetection: this.config.enableStatisticalDetection,
          businessLogicDetection: this.config.enableBusinessLogicDetection,
          alerting: this.config.alertingEnabled,
          anomalyThreshold: this.config.anomalyThreshold,
          baselineWindow: this.config.baselineWindow
        },
        statistics: stats,
        baselines: this.baselines.size,
        metricHistory: this.metricHistory.size,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Shutdown anomaly detection system
   */
  shutdown() {
    if (this.anomalyProcessorInterval) {
      clearInterval(this.anomalyProcessorInterval);
    }

    this.anomalies.clear();
    this.baselines.clear();
    this.metricHistory.clear();
    
    console.log('Anomaly detection system shutdown complete');
  }
}

// Singleton instance for global use
let globalAnomalyDetection = null;

/**
 * Get or create global anomaly detection system
 */
export function getAnomalyDetectionSystem(config = {}) {
  if (!globalAnomalyDetection) {
    globalAnomalyDetection = new AnomalyDetectionSystem(config);
  }
  return globalAnomalyDetection;
}

export default AnomalyDetectionSystem;