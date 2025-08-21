/**
 * Health Monitoring System
 * Comprehensive health monitoring with intelligent alerting
 * Phase 2 Week 5: High Availability & Infrastructure Resilience
 */

import { EventEmitter } from 'events';

export class HealthMonitoringSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      checkInterval: 30000, // 30 seconds
      alertThresholds: {
        cpu: { warning: 75, critical: 90 },
        memory: { warning: 80, critical: 95 },
        disk: { warning: 85, critical: 95 },
        responseTime: { warning: 1000, critical: 5000 }, // milliseconds
        errorRate: { warning: 5, critical: 10 }, // percentage
        uptime: { warning: 99, critical: 95 } // percentage
      },
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      aggregationWindow: 5 * 60 * 1000, // 5 minutes
      ...config
    };

    this.monitoredServices = new Map();
    this.healthMetrics = new Map();
    this.alertHistory = [];
    this.activeAlerts = new Map();
    this.healthReports = [];

    this.initializeHealthMonitoring();
  }

  async initializeHealthMonitoring() {
    this.startHealthChecks();
    this.startMetricsAggregation();
    this.startAlertManager();
    
    this.emit('health-monitoring-initialized', {
      checkInterval: this.config.checkInterval,
      alertThresholds: this.config.alertThresholds
    });
  }

  registerService(serviceName, serviceConfig) {
    const service = {
      name: serviceName,
      config: {
        url: serviceConfig.url,
        healthEndpoint: serviceConfig.healthEndpoint || '/health',
        timeout: serviceConfig.timeout || 5000,
        expectedStatusCode: serviceConfig.expectedStatusCode || 200,
        customChecks: serviceConfig.customChecks || [],
        alertThresholds: { ...this.config.alertThresholds, ...serviceConfig.alertThresholds },
        ...serviceConfig
      },
      state: {
        isHealthy: true,
        lastCheckTime: null,
        consecutiveFailures: 0,
        lastFailureTime: null,
        lastRecoveryTime: null
      },
      metrics: {
        uptime: 100,
        averageResponseTime: 0,
        totalChecks: 0,
        totalFailures: 0,
        errorRate: 0
      }
    };

    this.monitoredServices.set(serviceName, service);
    this.healthMetrics.set(serviceName, []);
    
    this.emit('service-registered', { serviceName, config: service.config });
    return service;
  }

  startHealthChecks() {
    const performChecks = async () => {
      const checkPromises = Array.from(this.monitoredServices.keys()).map(
        serviceName => this.performHealthCheck(serviceName)
      );
      
      try {
        await Promise.allSettled(checkPromises);
      } catch (error) {
        this.emit('health-check-batch-error', error);
      }
    };

    // Initial check
    performChecks();
    
    // Schedule periodic checks
    this.healthCheckInterval = setInterval(performChecks, this.config.checkInterval);
  }

  async performHealthCheck(serviceName) {
    const service = this.monitoredServices.get(serviceName);
    if (!service) return;

    const startTime = Date.now();
    const checkTimestamp = startTime;
    
    try {
      // Perform basic health check
      const basicHealth = await this.performBasicHealthCheck(service);
      
      // Perform custom checks if configured
      const customChecks = await this.performCustomChecks(service);
      
      // Aggregate results
      const healthResult = this.aggregateHealthResults(basicHealth, customChecks);
      const responseTime = Date.now() - startTime;
      
      // Update service state and metrics
      this.updateServiceHealth(service, healthResult, responseTime, checkTimestamp);
      
      // Store health metrics
      this.storeHealthMetrics(serviceName, healthResult, responseTime, checkTimestamp);
      
      // Check for alerts
      this.evaluateAlerts(serviceName, service, healthResult);
      
      this.emit('health-check-completed', {
        serviceName,
        healthy: healthResult.healthy,
        responseTime,
        timestamp: checkTimestamp
      });
      
    } catch (error) {
      this.handleHealthCheckError(service, error, startTime, checkTimestamp);
    }
  }

  async performBasicHealthCheck(service) {
    const healthUrl = `${service.config.url}${service.config.healthEndpoint}`;
    
    // Mock HTTP request - in real implementation, use fetch or axios
    const mockRequest = async () => {
      await this.sleep(Math.random() * 500 + 100); // Simulate network delay
      
      // Simulate occasional failures
      if (Math.random() < 0.05) { // 5% failure rate
        throw new Error('Service temporarily unavailable');
      }
      
      return {
        status: service.config.expectedStatusCode,
        data: {
          status: 'healthy',
          timestamp: Date.now(),
          version: '1.0.0',
          dependencies: {
            database: Math.random() > 0.02 ? 'healthy' : 'unhealthy',
            cache: Math.random() > 0.01 ? 'healthy' : 'unhealthy',
            storage: Math.random() > 0.03 ? 'healthy' : 'unhealthy'
          }
        }
      };
    };

    const response = await this.executeWithTimeout(mockRequest, service.config.timeout);
    
    const healthy = response.status === service.config.expectedStatusCode;
    const dependencies = response.data?.dependencies || {};
    const dependenciesHealthy = Object.values(dependencies).every(status => status === 'healthy');
    
    return {
      healthy: healthy && dependenciesHealthy,
      statusCode: response.status,
      dependencies,
      responseData: response.data
    };
  }

  async performCustomChecks(service) {
    if (!service.config.customChecks || service.config.customChecks.length === 0) {
      return { healthy: true, checks: [] };
    }

    const checkResults = [];
    
    for (const customCheck of service.config.customChecks) {
      try {
        const result = await this.executeCustomCheck(customCheck, service);
        checkResults.push(result);
      } catch (error) {
        checkResults.push({
          name: customCheck.name,
          healthy: false,
          error: error.message
        });
      }
    }
    
    const allHealthy = checkResults.every(check => check.healthy);
    
    return {
      healthy: allHealthy,
      checks: checkResults
    };
  }

  async executeCustomCheck(customCheck, service) {
    // Mock custom check execution
    switch (customCheck.type) {
      case 'database-connection':
        return await this.checkDatabaseConnection(customCheck, service);
      case 'memory-usage':
        return await this.checkMemoryUsage(customCheck, service);
      case 'disk-space':
        return await this.checkDiskSpace(customCheck, service);
      case 'api-endpoint':
        return await this.checkAPIEndpoint(customCheck, service);
      default:
        throw new Error(`Unknown custom check type: ${customCheck.type}`);
    }
  }

  async checkDatabaseConnection(check, service) {
    await this.sleep(100);
    const healthy = Math.random() > 0.02; // 2% failure rate
    
    return {
      name: check.name,
      type: 'database-connection',
      healthy,
      details: {
        connectionTime: Math.random() * 50 + 10,
        poolSize: Math.floor(Math.random() * 20) + 5
      }
    };
  }

  async checkMemoryUsage(check, service) {
    await this.sleep(50);
    const memoryUsage = Math.random() * 100;
    const threshold = check.threshold || 80;
    
    return {
      name: check.name,
      type: 'memory-usage',
      healthy: memoryUsage < threshold,
      details: {
        currentUsage: Math.round(memoryUsage),
        threshold,
        unit: 'percentage'
      }
    };
  }

  async checkDiskSpace(check, service) {
    await this.sleep(75);
    const diskUsage = Math.random() * 100;
    const threshold = check.threshold || 90;
    
    return {
      name: check.name,
      type: 'disk-space',
      healthy: diskUsage < threshold,
      details: {
        currentUsage: Math.round(diskUsage),
        threshold,
        unit: 'percentage'
      }
    };
  }

  async checkAPIEndpoint(check, service) {
    await this.sleep(200);
    const responseTime = Math.random() * 1000 + 100;
    const threshold = check.threshold || 1000;
    
    return {
      name: check.name,
      type: 'api-endpoint',
      healthy: responseTime < threshold,
      details: {
        responseTime: Math.round(responseTime),
        threshold,
        unit: 'milliseconds'
      }
    };
  }

  aggregateHealthResults(basicHealth, customChecks) {
    const allHealthy = basicHealth.healthy && customChecks.healthy;
    
    return {
      healthy: allHealthy,
      basicHealth,
      customChecks,
      summary: {
        totalChecks: 1 + customChecks.checks.length,
        passedChecks: (basicHealth.healthy ? 1 : 0) + 
                     customChecks.checks.filter(c => c.healthy).length
      }
    };
  }

  updateServiceHealth(service, healthResult, responseTime, timestamp) {
    service.state.lastCheckTime = timestamp;
    service.metrics.totalChecks++;
    
    // Update response time average
    const totalResponseTime = service.metrics.averageResponseTime * 
      (service.metrics.totalChecks - 1) + responseTime;
    service.metrics.averageResponseTime = totalResponseTime / service.metrics.totalChecks;
    
    if (healthResult.healthy) {
      // Service is healthy
      const wasUnhealthy = !service.state.isHealthy;
      service.state.isHealthy = true;
      service.state.consecutiveFailures = 0;
      
      if (wasUnhealthy) {
        service.state.lastRecoveryTime = timestamp;
        this.emit('service-recovered', { serviceName: service.name, timestamp });
      }
    } else {
      // Service is unhealthy
      const wasHealthy = service.state.isHealthy;
      service.state.isHealthy = false;
      service.state.consecutiveFailures++;
      service.state.lastFailureTime = timestamp;
      service.metrics.totalFailures++;
      
      if (wasHealthy) {
        this.emit('service-degraded', { serviceName: service.name, timestamp });
      }
    }
    
    // Update uptime and error rate
    service.metrics.errorRate = (service.metrics.totalFailures / service.metrics.totalChecks) * 100;
    service.metrics.uptime = ((service.metrics.totalChecks - service.metrics.totalFailures) / 
                             service.metrics.totalChecks) * 100;
  }

  handleHealthCheckError(service, error, startTime, timestamp) {
    const responseTime = Date.now() - startTime;
    
    service.state.lastCheckTime = timestamp;
    service.state.isHealthy = false;
    service.state.consecutiveFailures++;
    service.state.lastFailureTime = timestamp;
    service.metrics.totalChecks++;
    service.metrics.totalFailures++;
    
    const healthResult = {
      healthy: false,
      error: error.message,
      summary: { totalChecks: 1, passedChecks: 0 }
    };
    
    this.storeHealthMetrics(service.name, healthResult, responseTime, timestamp);
    this.evaluateAlerts(service.name, service, healthResult);
    
    this.emit('health-check-error', {
      serviceName: service.name,
      error: error.message,
      responseTime,
      timestamp
    });
  }

  storeHealthMetrics(serviceName, healthResult, responseTime, timestamp) {
    const metrics = this.healthMetrics.get(serviceName);
    if (!metrics) return;
    
    const metricEntry = {
      timestamp,
      healthy: healthResult.healthy,
      responseTime,
      error: healthResult.error || null,
      details: {
        basicHealth: healthResult.basicHealth,
        customChecks: healthResult.customChecks,
        summary: healthResult.summary
      }
    };
    
    metrics.push(metricEntry);
    
    // Cleanup old metrics
    const cutoff = timestamp - this.config.retentionPeriod;
    while (metrics.length > 0 && metrics[0].timestamp < cutoff) {
      metrics.shift();
    }
  }

  evaluateAlerts(serviceName, service, healthResult) {
    const alerts = [];
    
    // Check consecutive failures
    if (service.state.consecutiveFailures >= 3) {
      alerts.push({
        type: 'consecutive-failures',
        severity: service.state.consecutiveFailures >= 5 ? 'critical' : 'warning',
        message: `Service ${serviceName} has ${service.state.consecutiveFailures} consecutive failures`,
        value: service.state.consecutiveFailures,
        threshold: 3
      });
    }
    
    // Check response time
    if (service.metrics.averageResponseTime > this.config.alertThresholds.responseTime.warning) {
      const severity = service.metrics.averageResponseTime > this.config.alertThresholds.responseTime.critical 
        ? 'critical' : 'warning';
      
      alerts.push({
        type: 'high-response-time',
        severity,
        message: `Service ${serviceName} response time is ${Math.round(service.metrics.averageResponseTime)}ms`,
        value: service.metrics.averageResponseTime,
        threshold: this.config.alertThresholds.responseTime[severity]
      });
    }
    
    // Check error rate
    if (service.metrics.errorRate > this.config.alertThresholds.errorRate.warning) {
      const severity = service.metrics.errorRate > this.config.alertThresholds.errorRate.critical 
        ? 'critical' : 'warning';
      
      alerts.push({
        type: 'high-error-rate',
        severity,
        message: `Service ${serviceName} error rate is ${Math.round(service.metrics.errorRate)}%`,
        value: service.metrics.errorRate,
        threshold: this.config.alertThresholds.errorRate[severity]
      });
    }
    
    // Check uptime
    if (service.metrics.uptime < this.config.alertThresholds.uptime.warning) {
      const severity = service.metrics.uptime < this.config.alertThresholds.uptime.critical 
        ? 'critical' : 'warning';
      
      alerts.push({
        type: 'low-uptime',
        severity,
        message: `Service ${serviceName} uptime is ${Math.round(service.metrics.uptime)}%`,
        value: service.metrics.uptime,
        threshold: this.config.alertThresholds.uptime[severity]
      });
    }
    
    // Process alerts
    for (const alert of alerts) {
      this.processAlert(serviceName, alert);
    }
  }

  processAlert(serviceName, alert) {
    const alertKey = `${serviceName}-${alert.type}`;
    const existingAlert = this.activeAlerts.get(alertKey);
    
    if (existingAlert) {
      // Update existing alert
      existingAlert.lastSeen = Date.now();
      existingAlert.count++;
      
      // Escalate if severity increased
      if (this.getSeverityLevel(alert.severity) > this.getSeverityLevel(existingAlert.severity)) {
        existingAlert.severity = alert.severity;
        existingAlert.escalated = true;
        this.emit('alert-escalated', existingAlert);
      }
    } else {
      // Create new alert
      const newAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        serviceName,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        value: alert.value,
        threshold: alert.threshold,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        count: 1,
        resolved: false,
        escalated: false
      };
      
      this.activeAlerts.set(alertKey, newAlert);
      this.alertHistory.push(newAlert);
      
      this.emit('alert-triggered', newAlert);
    }
  }

  resolveAlert(serviceName, alertType) {
    const alertKey = `${serviceName}-${alertType}`;
    const alert = this.activeAlerts.get(alertKey);
    
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      this.activeAlerts.delete(alertKey);
      
      this.emit('alert-resolved', alert);
    }
  }

  getSeverityLevel(severity) {
    const levels = { info: 1, warning: 2, critical: 3 };
    return levels[severity] || 1;
  }

  startMetricsAggregation() {
    const aggregateMetrics = () => {
      try {
        this.aggregateHealthMetrics();
      } catch (error) {
        this.emit('metrics-aggregation-error', error);
      }
    };

    // Initial aggregation
    aggregateMetrics();
    
    // Schedule periodic aggregation
    this.metricsAggregationInterval = setInterval(aggregateMetrics, this.config.aggregationWindow);
  }

  aggregateHealthMetrics() {
    const timestamp = Date.now();
    const aggregatedReport = {
      timestamp,
      services: {},
      systemSummary: {
        totalServices: this.monitoredServices.size,
        healthyServices: 0,
        unhealthyServices: 0,
        averageResponseTime: 0,
        averageUptime: 0,
        totalActiveAlerts: this.activeAlerts.size
      }
    };

    let totalResponseTime = 0;
    let totalUptime = 0;
    
    for (const [serviceName, service] of this.monitoredServices) {
      const serviceMetrics = this.healthMetrics.get(serviceName) || [];
      const recentMetrics = serviceMetrics.filter(
        m => timestamp - m.timestamp <= this.config.aggregationWindow
      );
      
      const serviceReport = {
        isHealthy: service.state.isHealthy,
        consecutiveFailures: service.state.consecutiveFailures,
        uptime: service.metrics.uptime,
        averageResponseTime: service.metrics.averageResponseTime,
        errorRate: service.metrics.errorRate,
        totalChecks: service.metrics.totalChecks,
        recentChecks: recentMetrics.length,
        recentFailures: recentMetrics.filter(m => !m.healthy).length
      };
      
      aggregatedReport.services[serviceName] = serviceReport;
      
      if (service.state.isHealthy) {
        aggregatedReport.systemSummary.healthyServices++;
      } else {
        aggregatedReport.systemSummary.unhealthyServices++;
      }
      
      totalResponseTime += service.metrics.averageResponseTime;
      totalUptime += service.metrics.uptime;
    }
    
    // Calculate system averages
    if (this.monitoredServices.size > 0) {
      aggregatedReport.systemSummary.averageResponseTime = totalResponseTime / this.monitoredServices.size;
      aggregatedReport.systemSummary.averageUptime = totalUptime / this.monitoredServices.size;
    }
    
    this.healthReports.push(aggregatedReport);
    
    // Cleanup old reports
    const cutoff = timestamp - this.config.retentionPeriod;
    while (this.healthReports.length > 0 && this.healthReports[0].timestamp < cutoff) {
      this.healthReports.shift();
    }
    
    this.emit('health-report-generated', aggregatedReport);
  }

  startAlertManager() {
    const manageAlerts = () => {
      try {
        this.cleanupResolvedAlerts();
        this.checkForAlertResolution();
      } catch (error) {
        this.emit('alert-manager-error', error);
      }
    };

    // Run every minute
    this.alertManagerInterval = setInterval(manageAlerts, 60000);
  }

  cleanupResolvedAlerts() {
    // Clean up old resolved alerts from history
    const cutoff = Date.now() - this.config.retentionPeriod;
    this.alertHistory = this.alertHistory.filter(
      alert => !alert.resolved || alert.resolvedAt > cutoff
    );
  }

  checkForAlertResolution() {
    // Check if any active alerts should be resolved
    for (const [alertKey, alert] of this.activeAlerts) {
      const service = this.monitoredServices.get(alert.serviceName);
      
      if (!service) {
        this.resolveAlert(alert.serviceName, alert.type);
        continue;
      }
      
      // Check if alert conditions are no longer met
      let shouldResolve = false;
      
      switch (alert.type) {
        case 'consecutive-failures':
          shouldResolve = service.state.consecutiveFailures < 3;
          break;
        case 'high-response-time':
          shouldResolve = service.metrics.averageResponseTime <= this.config.alertThresholds.responseTime.warning;
          break;
        case 'high-error-rate':
          shouldResolve = service.metrics.errorRate <= this.config.alertThresholds.errorRate.warning;
          break;
        case 'low-uptime':
          shouldResolve = service.metrics.uptime >= this.config.alertThresholds.uptime.warning;
          break;
      }
      
      if (shouldResolve) {
        this.resolveAlert(alert.serviceName, alert.type);
      }
    }
  }

  async getHealthStatus() {
    const services = {};
    
    for (const [serviceName, service] of this.monitoredServices) {
      services[serviceName] = {
        isHealthy: service.state.isHealthy,
        consecutiveFailures: service.state.consecutiveFailures,
        lastCheckTime: service.state.lastCheckTime,
        metrics: service.metrics
      };
    }
    
    const activeAlerts = Array.from(this.activeAlerts.values());
    const recentReports = this.healthReports.slice(-5);
    
    return {
      timestamp: Date.now(),
      services,
      systemSummary: {
        totalServices: this.monitoredServices.size,
        healthyServices: Array.from(this.monitoredServices.values()).filter(s => s.state.isHealthy).length,
        totalActiveAlerts: activeAlerts.length,
        criticalAlerts: activeAlerts.filter(a => a.severity === 'critical').length
      },
      activeAlerts,
      recentReports: recentReports.slice(-1)[0] // Latest report
    };
  }

  async healthCheck() {
    const healthStatus = await this.getHealthStatus();
    const systemHealth = this.calculateSystemHealth(healthStatus);
    
    return {
      service: 'health-monitoring',
      status: systemHealth,
      monitoredServices: healthStatus.systemSummary.totalServices,
      healthyServices: healthStatus.systemSummary.healthyServices,
      activeAlerts: healthStatus.systemSummary.totalActiveAlerts,
      criticalAlerts: healthStatus.systemSummary.criticalAlerts,
      timestamp: Date.now()
    };
  }

  calculateSystemHealth(healthStatus) {
    const { totalServices, healthyServices, criticalAlerts } = healthStatus.systemSummary;
    
    // If no services are configured, the system is healthy but idle
    if (totalServices === 0) return 'healthy';
    
    const healthPercentage = (healthyServices / totalServices) * 100;
    
    if (criticalAlerts > 0) return 'critical';
    if (healthPercentage === 100) return 'healthy';
    if (healthPercentage >= 80) return 'degraded';
    return 'unhealthy';
  }

  async executeWithTimeout(operation, timeout) {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      try {
        const result = await operation();
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cleanup
  destroy() {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.metricsAggregationInterval) clearInterval(this.metricsAggregationInterval);
    if (this.alertManagerInterval) clearInterval(this.alertManagerInterval);
  }
}

// Singleton instance
let healthMonitoringInstance = null;

export function getHealthMonitoringSystem(config) {
  if (!healthMonitoringInstance) {
    healthMonitoringInstance = new HealthMonitoringSystem(config);
  }
  return healthMonitoringInstance;
}

export default { HealthMonitoringSystem, getHealthMonitoringSystem };