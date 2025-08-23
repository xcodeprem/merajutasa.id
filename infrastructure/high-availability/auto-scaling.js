/**
 * Auto-Scaling System
 * Intelligent auto-scaling with predictive analytics
 * Phase 2 Week 5: High Availability & Infrastructure Resilience
 */

import { EventEmitter } from 'events';

export class AutoScalingSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      minInstances: 2,
      maxInstances: 50,
      targetCPU: 70, // Target CPU utilization percentage
      targetMemory: 80, // Target memory utilization percentage
      scaleUpThreshold: 80, // Scale up when usage exceeds this
      scaleDownThreshold: 30, // Scale down when usage is below this
      scaleUpCooldown: 300000, // 5 minutes
      scaleDownCooldown: 600000, // 10 minutes
      metricsWindow: 300000, // 5 minutes metrics window
      predictiveScalingEnabled: true,
      ...config,
    };

    this.scalingState = {
      currentInstances: this.config.minInstances,
      targetInstances: this.config.minInstances,
      lastScaleUp: null,
      lastScaleDown: null,
      scalingHistory: [],
      metricsHistory: [],
      predictions: null,
    };

    this.services = new Map();
    this.metrics = new Map();
    this.scalingPolicies = new Map();

    this.initializeAutoScaling();
  }

  async initializeAutoScaling() {
    // Start metrics collection
    this.startMetricsCollection();

    // Start scaling decision engine
    this.startScalingEngine();

    // Initialize predictive analytics if enabled
    if (this.config.predictiveScalingEnabled) {
      this.startPredictiveAnalytics();
    }

    this.emit('auto-scaling-initialized', {
      minInstances: this.config.minInstances,
      maxInstances: this.config.maxInstances,
      currentInstances: this.scalingState.currentInstances,
    });
  }

  async registerService(serviceName, serviceConfig) {
    const service = {
      name: serviceName,
      config: {
        minInstances: serviceConfig.minInstances || this.config.minInstances,
        maxInstances: serviceConfig.maxInstances || this.config.maxInstances,
        targetCPU: serviceConfig.targetCPU || this.config.targetCPU,
        targetMemory: serviceConfig.targetMemory || this.config.targetMemory,
        ...serviceConfig,
      },
      state: {
        currentInstances: serviceConfig.minInstances || this.config.minInstances,
        targetInstances: serviceConfig.minInstances || this.config.minInstances,
        lastScaleAction: null,
        instances: new Map(),
      },
    };

    this.services.set(serviceName, service);
    this.metrics.set(serviceName, {
      cpu: [],
      memory: [],
      requestCount: [],
      responseTime: [],
      errorRate: [],
    });

    // Create scaling policy for service
    const policy = this.createScalingPolicy(service);
    this.scalingPolicies.set(serviceName, policy);

    this.emit('service-registered', { serviceName, service });
    return service;
  }

  createScalingPolicy(service) {
    return {
      scaleUpRules: [
        {
          metric: 'cpu',
          threshold: service.config.scaleUpThreshold || this.config.scaleUpThreshold,
          duration: 300000, // 5 minutes
          action: 'scale-up',
          factor: 2, // Double instances
        },
        {
          metric: 'memory',
          threshold: service.config.scaleUpThreshold || this.config.scaleUpThreshold,
          duration: 300000,
          action: 'scale-up',
          factor: 2,
        },
        {
          metric: 'requestCount',
          threshold: 1000, // requests per minute
          duration: 180000, // 3 minutes
          action: 'scale-up',
          factor: 1.5,
        },
      ],
      scaleDownRules: [
        {
          metric: 'cpu',
          threshold: service.config.scaleDownThreshold || this.config.scaleDownThreshold,
          duration: 600000, // 10 minutes
          action: 'scale-down',
          factor: 0.5, // Halve instances
        },
        {
          metric: 'memory',
          threshold: service.config.scaleDownThreshold || this.config.scaleDownThreshold,
          duration: 600000,
          action: 'scale-down',
          factor: 0.5,
        },
      ],
    };
  }

  startMetricsCollection() {
    const metricsInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        this.emit('metrics-collection-error', error);
      }
    }, 60000); // Collect every minute

    this.metricsInterval = metricsInterval;
  }

  async collectMetrics() {
    const timestamp = Date.now();

    for (const [serviceName, service] of this.services) {
      try {
        const serviceMetrics = await this.getServiceMetrics(serviceName);

        // Store metrics
        const metricsStore = this.metrics.get(serviceName);
        metricsStore.cpu.push({ timestamp, value: serviceMetrics.cpu });
        metricsStore.memory.push({ timestamp, value: serviceMetrics.memory });
        metricsStore.requestCount.push({ timestamp, value: serviceMetrics.requestCount });
        metricsStore.responseTime.push({ timestamp, value: serviceMetrics.responseTime });
        metricsStore.errorRate.push({ timestamp, value: serviceMetrics.errorRate });

        // Cleanup old metrics (keep last 24 hours)
        const cutoff = timestamp - 24 * 60 * 60 * 1000;
        Object.values(metricsStore).forEach(metricArray => {
          while (metricArray.length > 0 && metricArray[0].timestamp < cutoff) {
            metricArray.shift();
          }
        });

        // Store in global history
        this.scalingState.metricsHistory.push({
          timestamp,
          serviceName,
          metrics: serviceMetrics,
        });

        this.emit('metrics-collected', { serviceName, metrics: serviceMetrics, timestamp });

      } catch (error) {
        this.emit('service-metrics-error', { serviceName, error });
      }
    }

    // Cleanup global metrics history
    const cutoff = timestamp - 24 * 60 * 60 * 1000;
    while (this.scalingState.metricsHistory.length > 0 &&
           this.scalingState.metricsHistory[0].timestamp < cutoff) {
      this.scalingState.metricsHistory.shift();
    }
  }

  async getServiceMetrics(serviceName) {
    // Mock metrics - in real implementation, this would query monitoring systems
    const baseMetrics = {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      requestCount: Math.random() * 2000,
      responseTime: Math.random() * 1000 + 50,
      errorRate: Math.random() * 5,
    };

    // Add some realistic patterns
    const hour = new Date().getHours();
    const isBusinessHours = hour >= 9 && hour <= 17;

    if (isBusinessHours) {
      baseMetrics.cpu += 20;
      baseMetrics.memory += 15;
      baseMetrics.requestCount *= 2;
    }

    return baseMetrics;
  }

  startScalingEngine() {
    const scalingInterval = setInterval(async () => {
      try {
        await this.evaluateScalingDecisions();
      } catch (error) {
        this.emit('scaling-engine-error', error);
      }
    }, 120000); // Evaluate every 2 minutes

    this.scalingInterval = scalingInterval;
  }

  async evaluateScalingDecisions() {
    for (const [serviceName, service] of this.services) {
      try {
        const decision = await this.makeScalingDecision(serviceName);

        if (decision.action !== 'no-action') {
          await this.executeScalingAction(serviceName, decision);
        }

      } catch (error) {
        this.emit('scaling-decision-error', { serviceName, error });
      }
    }
  }

  async makeScalingDecision(serviceName) {
    const service = this.services.get(serviceName);
    const policy = this.scalingPolicies.get(serviceName);
    const metricsStore = this.metrics.get(serviceName);

    if (!service || !policy || !metricsStore) {
      return { action: 'no-action', reason: 'Service not found' };
    }

    // Check cooldown periods
    const now = Date.now();
    const lastScaleUp = service.state.lastScaleAction?.type === 'scale-up'
      ? service.state.lastScaleAction.timestamp
      : 0;
    const lastScaleDown = service.state.lastScaleAction?.type === 'scale-down'
      ? service.state.lastScaleAction.timestamp
      : 0;

    const scaleUpCooldown = now - lastScaleUp < this.config.scaleUpCooldown;
    const scaleDownCooldown = now - lastScaleDown < this.config.scaleDownCooldown;

    // Get recent metrics
    const recentMetrics = this.getRecentMetrics(serviceName, this.config.metricsWindow);

    if (!recentMetrics || recentMetrics.length === 0) {
      return { action: 'no-action', reason: 'No recent metrics available' };
    }

    // Evaluate scale up rules
    if (!scaleUpCooldown && service.state.currentInstances < service.config.maxInstances) {
      for (const rule of policy.scaleUpRules) {
        const violation = this.evaluateRule(rule, recentMetrics);

        if (violation.triggered) {
          const targetInstances = Math.min(
            Math.ceil(service.state.currentInstances * rule.factor),
            service.config.maxInstances,
          );

          return {
            action: 'scale-up',
            currentInstances: service.state.currentInstances,
            targetInstances,
            reason: `${rule.metric} ${violation.averageValue}% > ${rule.threshold}% for ${rule.duration}ms`,
            rule,
            metrics: violation.metrics,
          };
        }
      }
    }

    // Evaluate scale down rules
    if (!scaleDownCooldown && service.state.currentInstances > service.config.minInstances) {
      for (const rule of policy.scaleDownRules) {
        const violation = this.evaluateRule(rule, recentMetrics);

        if (violation.triggered) {
          const targetInstances = Math.max(
            Math.floor(service.state.currentInstances * rule.factor),
            service.config.minInstances,
          );

          return {
            action: 'scale-down',
            currentInstances: service.state.currentInstances,
            targetInstances,
            reason: `${rule.metric} ${violation.averageValue}% < ${rule.threshold}% for ${rule.duration}ms`,
            rule,
            metrics: violation.metrics,
          };
        }
      }
    }

    // Check predictive scaling
    if (this.config.predictiveScalingEnabled && this.scalingState.predictions) {
      const predictiveDecision = this.evaluatePredictiveScaling(serviceName);
      if (predictiveDecision.action !== 'no-action') {
        return predictiveDecision;
      }
    }

    return { action: 'no-action', reason: 'No scaling conditions met' };
  }

  evaluateRule(rule, recentMetrics) {
    const metricName = rule.metric;
    const relevantMetrics = recentMetrics
      .filter(m => m.metrics[metricName] !== undefined)
      .filter(m => Date.now() - m.timestamp <= rule.duration);

    if (relevantMetrics.length === 0) {
      return { triggered: false, reason: 'No relevant metrics' };
    }

    const values = relevantMetrics.map(m => m.metrics[metricName]);
    const averageValue = values.reduce((sum, val) => sum + val, 0) / values.length;

    let triggered = false;

    if (rule.action === 'scale-up') {
      triggered = averageValue > rule.threshold;
    } else if (rule.action === 'scale-down') {
      triggered = averageValue < rule.threshold;
    }

    return {
      triggered,
      averageValue: Math.round(averageValue * 100) / 100,
      metrics: relevantMetrics,
      sampleCount: relevantMetrics.length,
    };
  }

  getRecentMetrics(serviceName, windowMs) {
    const cutoff = Date.now() - windowMs;
    return this.scalingState.metricsHistory.filter(
      m => m.serviceName === serviceName && m.timestamp >= cutoff,
    );
  }

  async executeScalingAction(serviceName, decision) {
    const service = this.services.get(serviceName);

    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const scalingAction = {
      id: `scaling-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      serviceName,
      type: decision.action,
      fromInstances: decision.currentInstances,
      toInstances: decision.targetInstances,
      reason: decision.reason,
      startTime: Date.now(),
      status: 'in-progress',
    };

    this.emit('scaling-action-started', scalingAction);

    try {
      if (decision.action === 'scale-up') {
        await this.scaleUp(serviceName, decision.targetInstances, scalingAction);
      } else if (decision.action === 'scale-down') {
        await this.scaleDown(serviceName, decision.targetInstances, scalingAction);
      }

      // Update service state
      service.state.currentInstances = decision.targetInstances;
      service.state.targetInstances = decision.targetInstances;
      service.state.lastScaleAction = {
        type: decision.action,
        timestamp: Date.now(),
        instances: decision.targetInstances,
      };

      scalingAction.status = 'completed';
      scalingAction.endTime = Date.now();
      scalingAction.duration = scalingAction.endTime - scalingAction.startTime;

      // Add to history
      this.scalingState.scalingHistory.push(scalingAction);

      this.emit('scaling-action-completed', scalingAction);

    } catch (error) {
      scalingAction.status = 'failed';
      scalingAction.error = error.message;
      scalingAction.endTime = Date.now();

      this.emit('scaling-action-failed', { scalingAction, error });
      throw error;
    }
  }

  async scaleUp(serviceName, targetInstances, scalingAction) {
    const service = this.services.get(serviceName);
    const instancesToAdd = targetInstances - service.state.currentInstances;

    this.emit('scale-up-started', { serviceName, instancesToAdd, targetInstances });

    // Simulate instance creation
    for (let i = 0; i < instancesToAdd; i++) {
      const instanceId = `${serviceName}-${Date.now()}-${i}`;

      // Simulate instance startup time
      await this.sleep(2000);

      service.state.instances.set(instanceId, {
        id: instanceId,
        status: 'running',
        startTime: Date.now(),
        healthStatus: 'healthy',
      });

      this.emit('instance-created', { serviceName, instanceId });
    }

    this.emit('scale-up-completed', { serviceName, newInstances: instancesToAdd, totalInstances: targetInstances });
  }

  async scaleDown(serviceName, targetInstances, scalingAction) {
    const service = this.services.get(serviceName);
    const instancesToRemove = service.state.currentInstances - targetInstances;

    this.emit('scale-down-started', { serviceName, instancesToRemove, targetInstances });

    // Get instances to remove (oldest first)
    const instances = Array.from(service.state.instances.values())
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, instancesToRemove);

    // Graceful shutdown
    for (const instance of instances) {
      // Simulate graceful shutdown
      await this.sleep(1000);

      service.state.instances.delete(instance.id);

      this.emit('instance-removed', { serviceName, instanceId: instance.id });
    }

    this.emit('scale-down-completed', { serviceName, removedInstances: instancesToRemove, totalInstances: targetInstances });
  }

  startPredictiveAnalytics() {
    const analyticsInterval = setInterval(async () => {
      try {
        await this.runPredictiveAnalytics();
      } catch (error) {
        this.emit('predictive-analytics-error', error);
      }
    }, 600000); // Run every 10 minutes

    this.analyticsInterval = analyticsInterval;
  }

  async runPredictiveAnalytics() {
    const predictions = {};

    for (const [serviceName, service] of this.services) {
      const historicalMetrics = this.getHistoricalMetrics(serviceName, 24 * 60 * 60 * 1000); // Last 24 hours

      if (historicalMetrics.length < 10) {
        continue; // Not enough data for prediction
      }

      const prediction = this.generatePrediction(historicalMetrics);
      predictions[serviceName] = prediction;
    }

    this.scalingState.predictions = {
      timestamp: Date.now(),
      predictions,
    };

    this.emit('predictions-updated', this.scalingState.predictions);
  }

  generatePrediction(historicalMetrics) {
    // Simple prediction based on historical patterns
    // In a real implementation, this would use more sophisticated ML models

    const metricsOverTime = historicalMetrics.map(m => ({
      timestamp: m.timestamp,
      cpu: m.metrics.cpu,
      memory: m.metrics.memory,
      requestCount: m.metrics.requestCount,
    }));

    // Calculate trends
    const cpuTrend = this.calculateTrend(metricsOverTime.map(m => m.cpu));
    const memoryTrend = this.calculateTrend(metricsOverTime.map(m => m.memory));
    const requestTrend = this.calculateTrend(metricsOverTime.map(m => m.requestCount));

    // Predict next hour's peak values
    const nextHourPrediction = {
      cpu: Math.max(0, Math.min(100, cpuTrend.prediction + cpuTrend.variance)),
      memory: Math.max(0, Math.min(100, memoryTrend.prediction + memoryTrend.variance)),
      requestCount: Math.max(0, requestTrend.prediction + requestTrend.variance),
    };

    return {
      nextHour: nextHourPrediction,
      trends: { cpuTrend, memoryTrend, requestTrend },
      confidence: this.calculatePredictionConfidence(metricsOverTime),
      recommendation: this.generateScalingRecommendation(nextHourPrediction),
    };
  }

  calculateTrend(values) {
    if (values.length < 2) {
      return { prediction: values[0] || 0, variance: 0, direction: 'stable' };
    }

    // Simple linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const prediction = slope * n + intercept;
    const variance = Math.abs(slope * 5); // Simple variance estimation

    return {
      prediction,
      variance,
      direction: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
      slope,
    };
  }

  calculatePredictionConfidence(metricsOverTime) {
    // Simple confidence calculation based on data consistency
    const dataPoints = metricsOverTime.length;
    const timespan = metricsOverTime[metricsOverTime.length - 1].timestamp - metricsOverTime[0].timestamp;

    let confidence = Math.min(dataPoints / 50, 1); // More data = higher confidence
    confidence *= Math.min(timespan / (24 * 60 * 60 * 1000), 1); // Longer timespan = higher confidence

    return Math.round(confidence * 100);
  }

  generateScalingRecommendation(prediction) {
    if (prediction.cpu > 80 || prediction.memory > 80 || prediction.requestCount > 1500) {
      return {
        action: 'scale-up',
        reason: 'Predicted high load in next hour',
        suggestedFactor: 1.5,
      };
    } else if (prediction.cpu < 30 && prediction.memory < 30 && prediction.requestCount < 200) {
      return {
        action: 'scale-down',
        reason: 'Predicted low load in next hour',
        suggestedFactor: 0.7,
      };
    }

    return {
      action: 'no-change',
      reason: 'Predicted load within normal range',
    };
  }

  evaluatePredictiveScaling(serviceName) {
    const predictions = this.scalingState.predictions?.predictions[serviceName];

    if (!predictions || predictions.confidence < 70) {
      return { action: 'no-action', reason: 'Low prediction confidence' };
    }

    const recommendation = predictions.recommendation;

    if (recommendation.action === 'no-change') {
      return { action: 'no-action', reason: recommendation.reason };
    }

    const service = this.services.get(serviceName);
    const currentInstances = service.state.currentInstances;

    let targetInstances;

    if (recommendation.action === 'scale-up') {
      targetInstances = Math.min(
        Math.ceil(currentInstances * recommendation.suggestedFactor),
        service.config.maxInstances,
      );
    } else {
      targetInstances = Math.max(
        Math.floor(currentInstances * recommendation.suggestedFactor),
        service.config.minInstances,
      );
    }

    if (targetInstances === currentInstances) {
      return { action: 'no-action', reason: 'Already at predicted optimal size' };
    }

    return {
      action: recommendation.action,
      currentInstances,
      targetInstances,
      reason: `Predictive scaling: ${recommendation.reason} (${predictions.confidence}% confidence)`,
      predictive: true,
      prediction: predictions.nextHour,
    };
  }

  getHistoricalMetrics(serviceName, windowMs) {
    const cutoff = Date.now() - windowMs;
    return this.scalingState.metricsHistory.filter(
      m => m.serviceName === serviceName && m.timestamp >= cutoff,
    );
  }

  async getScalingStatus() {
    const status = {
      system: {
        enabled: true,
        predictiveScalingEnabled: this.config.predictiveScalingEnabled,
        totalServices: this.services.size,
      },
      services: {},
      predictions: this.scalingState.predictions,
      recentActions: this.scalingState.scalingHistory.slice(-10),
    };

    for (const [serviceName, service] of this.services) {
      const recentMetrics = this.getRecentMetrics(serviceName, 300000);
      const latestMetrics = recentMetrics[recentMetrics.length - 1]?.metrics;

      status.services[serviceName] = {
        currentInstances: service.state.currentInstances,
        targetInstances: service.state.targetInstances,
        minInstances: service.config.minInstances,
        maxInstances: service.config.maxInstances,
        lastScaleAction: service.state.lastScaleAction,
        latestMetrics,
        instanceStatus: Object.fromEntries(service.state.instances),
      };
    }

    return status;
  }

  async healthCheck() {
    const services = Array.from(this.services.values());
    const totalInstances = services.reduce((sum, service) => sum + service.state.currentInstances, 0);
    const healthyServices = services.filter(service =>
      service.state.currentInstances >= service.config.minInstances,
    ).length;

    return {
      service: 'auto-scaling',
      status: healthyServices === services.length ? 'healthy' : 'degraded',
      services: services.length,
      healthyServices,
      totalInstances,
      predictiveScalingEnabled: this.config.predictiveScalingEnabled,
      recentScalingActions: this.scalingState.scalingHistory.length,
      timestamp: Date.now(),
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cleanup methods
  destroy() {
    if (this.metricsInterval) {clearInterval(this.metricsInterval);}
    if (this.scalingInterval) {clearInterval(this.scalingInterval);}
    if (this.analyticsInterval) {clearInterval(this.analyticsInterval);}
  }
}

// Singleton instance
let autoScalingInstance = null;

export function getAutoScalingSystem(config) {
  if (!autoScalingInstance) {
    autoScalingInstance = new AutoScalingSystem(config);
  }
  return autoScalingInstance;
}

export default { AutoScalingSystem, getAutoScalingSystem };
