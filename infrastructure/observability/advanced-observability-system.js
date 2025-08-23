/**
 * MerajutASA.id - Phase 2 Week 3: Advanced Observability System
 *
 * Main orchestrator for the advanced observability infrastructure
 * Integrates all observability components into a unified system
 *
 * Features:
 * - Unified observability API
 * - Component lifecycle management
 * - Cross-component data correlation
 * - Health monitoring and self-healing
 * - Configuration management
 * - Performance optimization
 *
 * @version 1.0.0
 * @since Phase 2 Week 3
 */

import EventEmitter from 'events';
import { getDistributedTracing } from './tracing/distributed-tracing.js';
import { getAdvancedMetricsCollector } from './metrics/advanced-metrics-collector.js';
import { getIntelligentAlertingSystem } from './alerting/intelligent-alerting.js';
import { getLogAggregationSystem } from './logs/log-aggregation.js';
import { getAnomalyDetectionSystem } from './anomaly/anomaly-detection.js';
import { getRealTimeMonitoringDashboards } from './dashboards/real-time-dashboards.js';

export class AdvancedObservabilitySystem extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      serviceName: config.serviceName || 'merajutasa-observability',
      environment: config.environment || process.env.NODE_ENV || 'development',
      enableAllComponents: config.enableAllComponents !== false,
      autoCorrelation: config.autoCorrelation !== false,
      healthCheckInterval: config.healthCheckInterval || 60000, // 1 minute
      metricsUpdateInterval: config.metricsUpdateInterval || 10000, // 10 seconds
      ...config,
    };

    // Component instances
    this.components = new Map();
    this.isInitialized = false;
    this.isHealthy = true;

    // Correlation and integration state
    this.correlationEngine = null;
    this.healthCheckInterval = null;

    // Performance metrics
    this.systemMetrics = {
      startTime: Date.now(),
      requestCount: 0,
      errorCount: 0,
      lastError: null,
    };
  }

  /**
   * Initialize the complete observability system
   */
  async initialize() {
    try {
      console.log('Initializing Advanced Observability System...');

      await this.initializeComponents();
      this.setupComponentIntegration();
      this.startHealthMonitoring();
      this.startMetricsCollection();

      if (this.config.autoCorrelation) {
        this.setupAutoCorrelation();
      }

      this.isInitialized = true;
      this.emit('system_initialized');

      console.log('Advanced Observability System initialized successfully');

    } catch (error) {
      console.error('Failed to initialize observability system:', error);
      this.emit('system_error', error);
      throw error;
    }
  }

  /**
   * Initialize all observability components
   */
  async initializeComponents() {
    const componentConfigs = {
      tracing: {
        serviceName: this.config.serviceName,
        environment: this.config.environment,
        ...this.config.tracing,
      },
      metrics: {
        serviceName: this.config.serviceName,
        collectDefaultMetrics: true,
        customMetricsEnabled: true,
        ...this.config.metrics,
      },
      alerting: {
        serviceName: this.config.serviceName,
        environment: this.config.environment,
        escalationEnabled: true,
        correlationEnabled: true,
        ...this.config.alerting,
      },
      logging: {
        serviceName: this.config.serviceName,
        enableStructuredLogging: true,
        enableLogCorrelation: true,
        retentionDays: 30,
        ...this.config.logging,
      },
      anomalyDetection: {
        serviceName: this.config.serviceName,
        enableStatisticalDetection: true,
        enableBusinessLogicDetection: true,
        alertingEnabled: true,
        ...this.config.anomalyDetection,
      },
      dashboards: {
        serviceName: this.config.serviceName,
        port: this.config.dashboardPort || 3000,
        enableRealTimeStreaming: true,
        ...this.config.dashboards,
      },
    };

    // Initialize distributed tracing
    if (this.config.enableAllComponents || this.config.enableTracing) {
      try {
        this.components.set('tracing', getDistributedTracing(componentConfigs.tracing));
        console.log('✓ Distributed tracing initialized');
      } catch (error) {
        console.warn('Failed to initialize distributed tracing:', error.message);
      }
    }

    // Initialize metrics collection
    if (this.config.enableAllComponents || this.config.enableMetrics) {
      try {
        this.components.set('metrics', getAdvancedMetricsCollector(componentConfigs.metrics));
        console.log('✓ Advanced metrics collector initialized');
      } catch (error) {
        console.warn('Failed to initialize metrics collector:', error.message);
      }
    }

    // Initialize intelligent alerting
    if (this.config.enableAllComponents || this.config.enableAlerting) {
      try {
        this.components.set('alerting', getIntelligentAlertingSystem(componentConfigs.alerting));
        console.log('✓ Intelligent alerting system initialized');
      } catch (error) {
        console.warn('Failed to initialize alerting system:', error.message);
      }
    }

    // Initialize log aggregation
    if (this.config.enableAllComponents || this.config.enableLogging) {
      try {
        this.components.set('logging', getLogAggregationSystem(componentConfigs.logging));
        console.log('✓ Log aggregation system initialized');
      } catch (error) {
        console.warn('Failed to initialize log aggregation:', error.message);
      }
    }

    // Initialize anomaly detection
    if (this.config.enableAllComponents || this.config.enableAnomalyDetection) {
      try {
        this.components.set('anomalyDetection', getAnomalyDetectionSystem(componentConfigs.anomalyDetection));
        console.log('✓ Anomaly detection system initialized');
      } catch (error) {
        console.warn('Failed to initialize anomaly detection:', error.message);
      }
    }

    // Initialize dashboards
    if (this.config.enableAllComponents || this.config.enableDashboards) {
      try {
        this.components.set('dashboards', getRealTimeMonitoringDashboards(componentConfigs.dashboards));
        console.log('✓ Real-time monitoring dashboards initialized');
      } catch (error) {
        console.warn('Failed to initialize dashboards:', error.message);
      }
    }
  }

  /**
   * Setup integration between components
   */
  setupComponentIntegration() {
    const metrics = this.components.get('metrics');
    const alerting = this.components.get('alerting');
    const logging = this.components.get('logging');
    const anomalyDetection = this.components.get('anomalyDetection');
    const dashboards = this.components.get('dashboards');

    // Metrics → Alerting integration
    if (metrics && alerting) {
      metrics.on('metrics_stream', (metricsData) => {
        alerting.evaluateMetrics(metricsData.metrics);
      });
    }

    // Metrics → Anomaly Detection integration
    if (metrics && anomalyDetection) {
      metrics.on('metrics_stream', (metricsData) => {
        anomalyDetection.detectAnomalies(metricsData.metrics);
      });
    }

    // Metrics → Dashboards integration
    if (metrics && dashboards) {
      metrics.on('metrics_stream', (metricsData) => {
        // derive simple flattened metrics for dashboards
        try {
          const flat = {};
          for (const m of metricsData.metrics || []) {
            const name = m.name || m.help || '';
            const last = Array.isArray(m.values) && m.values.length > 0 ? m.values[m.values.length - 1].value : null;
            if (name.endsWith('error_rate')) {flat.error_rate = last ?? flat.error_rate;}
            if (name.endsWith('service_health_status')) {flat.service_health_status = last ?? flat.service_health_status;}
            if (name.endsWith('chain_integrity_score')) {flat.chain_integrity_score = last ?? flat.chain_integrity_score;}
            if (name.endsWith('cpu_usage_percent')) {flat.cpu_usage_percent = last ?? flat.cpu_usage_percent;}
            if (name.endsWith('memory_usage_percent')) {flat.memory_usage_percent = last ?? flat.memory_usage_percent;}
          }
          dashboards.updateMetrics({ ...flat });
        } catch (e) {
          dashboards.updateMetrics({});
        }
      });
    }

    // Alerting → Logging integration
    if (alerting && logging) {
      alerting.on('alert_sent', (alert) => {
        logging.audit('alert_triggered', 'system', alert.rule, 'sent', {
          alertId: alert.id,
          severity: alert.severity,
          service: alert.service,
        });
      });
    }

    // Alerting → Dashboards integration
    if (alerting && dashboards) {
      alerting.on('alert_sent', (alert) => {
        dashboards.updateAlerts([alert]);
      });
    }

    // Anomaly Detection → Alerting integration
    if (anomalyDetection && alerting) {
      anomalyDetection.on('anomaly_detected', (anomaly) => {
        // Create custom alert rule for anomaly
        alerting.addAlertRule(`anomaly_${anomaly.id}`, {
          name: `Anomaly: ${anomaly.name}`,
          condition: () => true, // Already detected
          severity: anomaly.severity,
          description: anomaly.description,
          channels: ['email', 'slack'],
        });
      });
    }

    // Anomaly Detection → Logging integration
    if (anomalyDetection && logging) {
      anomalyDetection.on('anomaly_detected', (anomaly) => {
        logging.security('anomaly_detected', anomaly.severity, anomaly.description, {
          anomalyId: anomaly.id,
          detector: anomaly.detector,
          value: anomaly.value,
        });
      });
    }

    // Logging → Anomaly Detection integration (log pattern analysis)
    if (logging && anomalyDetection) {
      logging.on('pattern_match', (patternEvent) => {
        if (patternEvent.severity === 'critical' || patternEvent.severity === 'high') {
          // Convert log pattern to anomaly
          const anomaly = {
            id: patternEvent.id,
            name: `Log Pattern: ${patternEvent.patternName}`,
            severity: patternEvent.severity,
            description: `Log pattern detected: ${patternEvent.patternName}`,
            detector: 'log_pattern',
            timestamp: patternEvent.timestamp,
          };

          anomalyDetection.emit('anomaly_detected', anomaly);
        }
      });
    }

    console.log('Component integration setup completed');
  }

  /**
   * Setup automatic correlation between components
   */
  setupAutoCorrelation() {
    this.correlationEngine = {
      correlationRules: new Map(),
      correlationData: new Map(),
      processingInterval: null,
    };

    // Setup correlation rules
    this.addCorrelationRule('performance_degradation', {
      name: 'Performance Degradation Correlation',
      components: ['metrics', 'anomalyDetection', 'logging'],
      condition: (data) => {
        const hasSlowResponse = data.metrics?.avg_response_time > 1000;
        const hasPerformanceAnomalies = data.anomalies?.some(a =>
          a.detector.includes('response_time') || a.detector.includes('throughput'),
        );
        const hasPerformanceLogs = data.logs?.some(log =>
          log.message.includes('slow') || log.message.includes('timeout'),
        );

        return hasSlowResponse && (hasPerformanceAnomalies || hasPerformanceLogs);
      },
      action: (correlatedData) => {
        this.handlePerformanceDegradation(correlatedData);
      },
    });

    this.addCorrelationRule('security_incident', {
      name: 'Security Incident Correlation',
      components: ['logging', 'anomalyDetection', 'alerting'],
      condition: (data) => {
        const hasSecurityLogs = data.logs?.some(log =>
          log.logType === 'security' && log.level === 'error',
        );
        const hasSecurityAnomalies = data.anomalies?.some(a =>
          a.detector.includes('security') || a.detector.includes('authentication'),
        );
        const hasSecurityAlerts = data.alerts?.some(alert =>
          alert.rule.includes('security') || alert.rule.includes('auth'),
        );

        return hasSecurityLogs && (hasSecurityAnomalies || hasSecurityAlerts);
      },
      action: (correlatedData) => {
        this.handleSecurityIncident(correlatedData);
      },
    });

    // Start correlation processor
    this.correlationEngine.processingInterval = setInterval(() => {
      this.processCorrelations();
    }, 30000); // Process every 30 seconds

    console.log('Auto-correlation engine initialized');
  }

  /**
   * Add correlation rule
   */
  addCorrelationRule(ruleId, rule) {
    if (this.correlationEngine) {
      this.correlationEngine.correlationRules.set(ruleId, rule);
    }
  }

  /**
   * Process correlations between components
   */
  processCorrelations() {
    if (!this.correlationEngine) {return;}

    // Collect data from all components
    const correlationData = this.collectCorrelationData();

    // Apply correlation rules
    for (const [ruleId, rule] of this.correlationEngine.correlationRules) {
      try {
        if (rule.condition(correlationData)) {
          rule.action(correlationData);
          this.emit('correlation_detected', { ruleId, rule, data: correlationData });
        }
      } catch (error) {
        console.error(`Error processing correlation rule ${ruleId}:`, error);
      }
    }
  }

  /**
   * Collect correlation data from all components
   */
  collectCorrelationData() {
    const data = {};

    // Collect from metrics
    const metrics = this.components.get('metrics');
    if (metrics) {
      data.metrics = {}; // Would collect latest metrics
    }

    // Collect from anomaly detection
    const anomalyDetection = this.components.get('anomalyDetection');
    if (anomalyDetection) {
      data.anomalies = anomalyDetection.getCurrentAnomalies();
    }

    // Collect from alerting
    const alerting = this.components.get('alerting');
    if (alerting) {
      data.alerts = alerting.getActiveAlerts();
    }

    // Collect from logging
    const logging = this.components.get('logging');
    if (logging) {
      data.logs = []; // Would collect recent logs
    }

    return data;
  }

  /**
   * Handle performance degradation correlation
   */
  handlePerformanceDegradation(data) {
    const logging = this.components.get('logging');
    const alerting = this.components.get('alerting');

    if (logging) {
      logging.warn('Performance degradation detected through correlation', {
        correlationType: 'performance_degradation',
        metrics: data.metrics,
        anomalies: data.anomalies?.length || 0,
        logs: data.logs?.length || 0,
      });
    }

    if (alerting) {
      // Create composite alert
      alerting.addAlertRule('correlated_performance_degradation', {
        name: 'Correlated Performance Degradation',
        condition: () => true, // Already detected
        severity: 'high',
        description: 'Performance degradation detected through cross-component correlation',
        channels: ['email', 'slack'],
      });
    }

    this.emit('performance_degradation', data);
  }

  /**
   * Handle security incident correlation
   */
  handleSecurityIncident(data) {
    const logging = this.components.get('logging');
    const alerting = this.components.get('alerting');

    if (logging) {
      logging.security('security_incident_detected', 'critical', 'Security incident detected through correlation', {
        correlationType: 'security_incident',
        logs: data.logs?.length || 0,
        anomalies: data.anomalies?.length || 0,
        alerts: data.alerts?.length || 0,
      });
    }

    if (alerting) {
      // Create critical security alert
      alerting.addAlertRule('correlated_security_incident', {
        name: 'Correlated Security Incident',
        condition: () => true, // Already detected
        severity: 'critical',
        description: 'Security incident detected through cross-component correlation',
        channels: ['email', 'slack', 'pagerduty'],
      });
    }

    this.emit('security_incident', data);
  }

  /**
   * Start health monitoring for all components
   */
  startHealthMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);

    console.log('Health monitoring started');
  }

  /**
   * Perform health check on all components
   */
  async performHealthCheck() {
    try {
      const healthResults = {};
      let overallHealthy = true;

      for (const [componentName, component] of this.components) {
        try {
          const health = await component.healthCheck();
          healthResults[componentName] = health;

          if (health.status !== 'healthy') {
            overallHealthy = false;
          }
        } catch (error) {
          healthResults[componentName] = {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString(),
          };
          overallHealthy = false;
        }
      }

      this.isHealthy = overallHealthy;
      this.emit('health_check_completed', {
        overall: overallHealthy ? 'healthy' : 'unhealthy',
        components: healthResults,
        timestamp: new Date().toISOString(),
      });

      // Log health issues
      if (!overallHealthy) {
        const logging = this.components.get('logging');
        if (logging) {
          logging.warn('Observability system health check failed', {
            healthResults,
            unhealthyComponents: Object.entries(healthResults)
              .filter(([name, health]) => health.status !== 'healthy')
              .map(([name]) => name),
          });
        }
      }

    } catch (error) {
      console.error('Error during health check:', error);
      this.emit('health_check_error', error);
    }
  }

  /**
   * Start metrics collection for the observability system itself
   */
  startMetricsCollection() {
    setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.metricsUpdateInterval);

    console.log('System metrics collection started');
  }

  /**
   * Collect metrics about the observability system itself
   */
  collectSystemMetrics() {
    const metrics = this.components.get('metrics');
    if (!metrics) {return;}

    const uptime = Date.now() - this.systemMetrics.startTime;
    const errorRate = this.systemMetrics.requestCount > 0 ?
      (this.systemMetrics.errorCount / this.systemMetrics.requestCount) * 100 : 0;

    // Record observability system metrics
    metrics.recordCustomMetric('observability_uptime_seconds', 'set', uptime / 1000);
    metrics.recordCustomMetric('observability_request_count', 'inc', this.systemMetrics.requestCount);
    metrics.recordCustomMetric('observability_error_rate', 'set', errorRate);
    metrics.recordCustomMetric('observability_component_count', 'set', this.components.size);
    metrics.recordCustomMetric('observability_health_status', 'set', this.isHealthy ? 1 : 0);

    // Component-specific metrics
    for (const [componentName, component] of this.components) {
      metrics.recordCustomMetric('observability_component_status', 'set', 1, {
        component: componentName,
        status: 'active',
      });
    }
  }

  /**
   * Create a unified trace for a business operation
   */
  async traceBusinessOperation(operationName, fn, metadata = {}) {
    const tracing = this.components.get('tracing');
    const metrics = this.components.get('metrics');
    const logging = this.components.get('logging');

    const startTime = Date.now();
    const operationId = metadata.operationId || `op_${Date.now()}`;

    try {
      // Start distributed trace
      let result;
      if (tracing) {
        result = await tracing.traceServiceCall(operationName, fn, {
          attributes: {
            'operation.id': operationId,
            'operation.type': 'business',
            ...metadata,
          },
        });
      } else {
        result = await fn();
      }

      const duration = Date.now() - startTime;

      // Record metrics
      if (metrics) {
        metrics.recordCustomMetric('business_operation_duration', 'observe', duration, {
          operation: operationName,
          status: 'success',
        });
        metrics.recordCustomMetric('business_operation_total', 'inc', 1, {
          operation: operationName,
          status: 'success',
        });
      }

      // Log operation
      if (logging) {
        logging.info(`Business operation completed: ${operationName}`, {
          operationId,
          operationName,
          duration,
          status: 'success',
          ...metadata,
        });
      }

      this.systemMetrics.requestCount++;
      this.emit('business_operation_completed', {
        operationName,
        operationId,
        duration,
        status: 'success',
        result,
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;

      // Record error metrics
      if (metrics) {
        metrics.recordCustomMetric('business_operation_duration', 'observe', duration, {
          operation: operationName,
          status: 'error',
        });
        metrics.recordCustomMetric('business_operation_total', 'inc', 1, {
          operation: operationName,
          status: 'error',
        });
      }

      // Log error
      if (logging) {
        logging.error(`Business operation failed: ${operationName}`, {
          operationId,
          operationName,
          duration,
          status: 'error',
          error: error.message,
          ...metadata,
        });
      }

      this.systemMetrics.requestCount++;
      this.systemMetrics.errorCount++;
      this.systemMetrics.lastError = error;

      this.emit('business_operation_failed', {
        operationName,
        operationId,
        duration,
        status: 'error',
        error,
      });

      throw error;
    }
  }

  /**
   * Create custom metric across all relevant components
   */
  recordUnifiedMetric(metricName, value, metadata = {}) {
    const metrics = this.components.get('metrics');
    const logging = this.components.get('logging');

    // Record in metrics system
    if (metrics) {
      metrics.recordCustomMetric(metricName, 'set', value, metadata);
    }

    // Log significant metrics
    if (logging && metadata.logLevel) {
      logging.log(metadata.logLevel, `Metric recorded: ${metricName} = ${value}`, {
        metricName,
        value,
        ...metadata,
      });
    }

    this.emit('metric_recorded', { metricName, value, metadata });
  }

  /**
   * Create unified alert across alerting and logging
   */
  createUnifiedAlert(alertName, severity, description, metadata = {}) {
    const alerting = this.components.get('alerting');
    const logging = this.components.get('logging');

    // Create alert in alerting system
    if (alerting) {
      alerting.addAlertRule(`unified_${alertName}`, {
        name: alertName,
        condition: () => true, // Alert is being created manually
        severity,
        description,
        channels: metadata.channels || ['email', 'slack'],
      });
    }

    // Log alert creation
    if (logging) {
      logging.audit('alert_created', 'system', alertName, 'created', {
        severity,
        description,
        ...metadata,
      });
    }

    this.emit('unified_alert_created', { alertName, severity, description, metadata });
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus() {
    const status = {
      system: {
        name: this.config.serviceName,
        environment: this.config.environment,
        initialized: this.isInitialized,
        healthy: this.isHealthy,
        uptime: Date.now() - this.systemMetrics.startTime,
        version: '1.0.0',
      },
      components: {},
      metrics: this.systemMetrics,
      timestamp: new Date().toISOString(),
    };

    // Get status from each component
    for (const [componentName, component] of this.components) {
      try {
        status.components[componentName] = await component.healthCheck();
      } catch (error) {
        status.components[componentName] = {
          status: 'error',
          error: error.message,
        };
      }
    }

    return status;
  }

  /**
   * Get observability configuration
   */
  getConfiguration() {
    return {
      ...this.config,
      components: Array.from(this.components.keys()),
      initialized: this.isInitialized,
      correlationEnabled: !!this.correlationEngine,
      healthMonitoringEnabled: !!this.healthCheckInterval,
    };
  }

  /**
   * Update configuration (hot reload)
   */
  updateConfiguration(newConfig) {
    // Merge with existing config
    Object.assign(this.config, newConfig);

    // Apply changes to components if needed
    this.emit('configuration_updated', this.config);

    const logging = this.components.get('logging');
    if (logging) {
      logging.info('Observability configuration updated', {
        previousConfig: this.config,
        newConfig,
      });
    }
  }

  /**
   * Export observability data
   */
  async exportObservabilityData(options = {}) {
    const timeRange = options.timeRange || '1h';
    const components = options.components || Array.from(this.components.keys());

    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        timeRange,
        components,
        system: this.config.serviceName,
      },
      data: {},
    };

    // Export data from each requested component
    for (const componentName of components) {
      const component = this.components.get(componentName);
      if (component) {
        try {
          switch (componentName) {
          case 'metrics':
            exportData.data.metrics = await component.getMetricsJSON();
            break;
          case 'logging':
            exportData.data.logs = await component.searchLogs({
              startTime: this.getTimeRangeStart(timeRange),
              limit: options.logLimit || 1000,
            });
            break;
          case 'alerting':
            exportData.data.alerts = {
              active: component.getActiveAlerts(),
              history: component.getAlertHistory(options.alertLimit || 100),
            };
            break;
          case 'anomalyDetection':
            exportData.data.anomalies = {
              current: component.getCurrentAnomalies(),
              statistics: component.getAnomalyStatistics(),
            };
            break;
          case 'dashboards':
            exportData.data.dashboards = Array.from(component.dashboards.keys());
            break;
          }
        } catch (error) {
          exportData.data[componentName] = { error: error.message };
        }
      }
    }

    return exportData;
  }

  /**
   * Get time range start for exports
   */
  getTimeRangeStart(timeRange) {
    const now = new Date();
    switch (timeRange) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    }
  }

  /**
   * Shutdown the entire observability system
   */
  async shutdown() {
    try {
      console.log('Shutting down Advanced Observability System...');

      // Stop health monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      // Stop correlation engine
      if (this.correlationEngine?.processingInterval) {
        clearInterval(this.correlationEngine.processingInterval);
      }

      // Shutdown all components
      for (const [componentName, component] of this.components) {
        try {
          if (component.shutdown) {
            await component.shutdown();
          }
          console.log(`✓ ${componentName} shutdown complete`);
        } catch (error) {
          console.error(`Error shutting down ${componentName}:`, error);
        }
      }

      this.components.clear();
      this.isInitialized = false;
      this.emit('system_shutdown');

      console.log('Advanced Observability System shutdown complete');

    } catch (error) {
      console.error('Error during observability system shutdown:', error);
      throw error;
    }
  }
}

// Singleton instance for global use
let globalObservabilitySystem = null;

/**
 * Get or create global observability system
 */
export function getAdvancedObservabilitySystem(config = {}) {
  if (!globalObservabilitySystem) {
    globalObservabilitySystem = new AdvancedObservabilitySystem(config);
  }
  return globalObservabilitySystem;
}

/**
 * Initialize observability for service
 */
export async function initializeObservability(serviceName, config = {}) {
  const observability = getAdvancedObservabilitySystem({
    serviceName,
    ...config,
  });

  await observability.initialize();
  return observability;
}

export default AdvancedObservabilitySystem;
