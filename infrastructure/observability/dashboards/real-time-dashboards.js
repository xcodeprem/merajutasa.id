/**
 * MerajutASA.id - Phase 2 Week 3: Real-time Monitoring Dashboards
 *
 * Advanced dashboard system with real-time metrics and visualization
 * Provides comprehensive monitoring dashboards for operations teams
 *
 * Features:
 * - Real-time metric streaming
 * - Interactive dashboard widgets
 * - Custom dashboard creation
 * - Alert integration with dashboards
 * - Historical data visualization
 * - Export and sharing capabilities
 *
 * @version 1.0.0
 * @since Phase 2 Week 3
 */

import EventEmitter from 'events';
import { createServer } from 'http';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Lightweight Socket.IO and Express fallbacks
class LightweightSocketServer {
  constructor(httpServer, options = {}) {
    this.httpServer = httpServer;
    this.options = options;
    this.sockets = new Set();
  }

  emit(eventName, data) {
    console.log(`📡 [SOCKET] Broadcasting: ${eventName}`, data);
    return this;
  }

  on(eventName, handler) {
    console.log(`📡 [SOCKET] Listening for: ${eventName}`);
    return this;
  }

  close() {
    console.log('📡 [SOCKET] Server closed');
    return Promise.resolve();
  }
}

class LightweightExpressApp {
  constructor() {
    this.routes = new Map();
  }

  static() {
    return (req, res, next) => {
      console.log('📁 [EXPRESS] Serving static files');
      next();
    };
  }

  use(path, handler) {
    if (typeof path === 'function') {
      handler = path;
      path = '*';
    }
    console.log(`🌐 [EXPRESS] Middleware registered for: ${path}`);
    return this;
  }

  get(path, handler) {
    this.routes.set(`GET:${path}`, handler);
    console.log(`🌐 [EXPRESS] GET route registered: ${path}`);
    return this;
  }

  listen(port, callback) {
    console.log(`🌐 [EXPRESS] Simulated server listening on port ${port}`);
    if (callback) {callback();}
    return this;
  }
}

// Try to import real packages, fall back to lightweight implementation
let SocketIOServer, express;

try {
  const socketio = await import('socket.io');
  const expressModule = await import('express');

  SocketIOServer = socketio.Server;
  express = expressModule.default;
  console.log('✅ Using full Socket.IO and Express implementations for dashboards');
} catch (error) {
  console.log('ℹ️ Socket.IO and Express not available for dashboards, using lightweight fallback');

  SocketIOServer = LightweightSocketServer;
  express = () => new LightweightExpressApp();
  express.static = (path) => {
    return (req, res, next) => {
      console.log(`📁 [EXPRESS] Serving static files from: ${path}`);
      next();
    };
  };
}

export class RealTimeMonitoringDashboards extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      serviceName: config.serviceName || 'merajutasa-service',
      port: config.port || 3000,
      enableRealTimeStreaming: config.enableRealTimeStreaming !== false,
      updateInterval: config.updateInterval || 5000, // 5 seconds
      maxDataPoints: config.maxDataPoints || 1000,
      dashboardsEnabled: config.dashboardsEnabled !== false,
      ...config,
    };

    // Dashboard state
    this.dashboards = new Map();
    this.widgets = new Map();
    this.dataStreams = new Map();
    this.clients = new Map();

    // Web server components
    this.app = null;
    this.server = null;
    this.io = null;

    // Data storage for dashboards
    this.metricsBuffer = new Map();
    this.alertsBuffer = [];

    this.initialize();
  }

  /**
   * Initialize the dashboard system
   */
  async initialize() {
    try {
      this.setupDefaultDashboards();
      this.setupDefaultWidgets();

      if (this.config.dashboardsEnabled) {
        await this.setupWebServer();
        await this.setupSocketIO();
      }

      this.startDataStreaming();

      console.log(`Real-time monitoring dashboards initialized on port ${this.config.port}`);
    } catch (error) {
      console.error('Failed to initialize dashboard system:', error);
      throw error;
    }
  }

  /**
   * Setup default dashboards
   */
  setupDefaultDashboards() {
    // System Overview Dashboard
    this.addDashboard('system_overview', {
      name: 'System Overview',
      description: 'High-level system health and performance metrics',
      layout: {
        rows: 3,
        columns: 4,
      },
      widgets: [
        { id: 'system_health', position: { row: 0, col: 0, span: 1 } },
        { id: 'response_time', position: { row: 0, col: 1, span: 1 } },
        { id: 'error_rate', position: { row: 0, col: 2, span: 1 } },
        { id: 'throughput', position: { row: 0, col: 3, span: 1 } },
        { id: 'cpu_memory', position: { row: 1, col: 0, span: 2 } },
        { id: 'active_alerts', position: { row: 1, col: 2, span: 2 } },
        { id: 'service_status', position: { row: 2, col: 0, span: 4 } },
      ],
      refreshInterval: 5000,
      isDefault: true,
    });

    // Business Metrics Dashboard
    this.addDashboard('business_metrics', {
      name: 'Business Metrics',
      description: 'Key business KPIs and governance metrics',
      layout: {
        rows: 3,
        columns: 3,
      },
      widgets: [
        { id: 'signing_operations', position: { row: 0, col: 0, span: 1 } },
        { id: 'chain_integrity', position: { row: 0, col: 1, span: 1 } },
        { id: 'governance_compliance', position: { row: 0, col: 2, span: 1 } },
        { id: 'equity_scores', position: { row: 1, col: 0, span: 2 } },
        { id: 'user_activity', position: { row: 1, col: 2, span: 1 } },
        { id: 'business_trends', position: { row: 2, col: 0, span: 3 } },
      ],
      refreshInterval: 10000,
      isDefault: true,
    });

    // Performance Dashboard
    this.addDashboard('performance', {
      name: 'Performance Analysis',
      description: 'Detailed performance metrics and trends',
      layout: {
        rows: 2,
        columns: 3,
      },
      widgets: [
        { id: 'response_time_histogram', position: { row: 0, col: 0, span: 1 } },
        { id: 'cache_performance', position: { row: 0, col: 1, span: 1 } },
        { id: 'database_performance', position: { row: 0, col: 2, span: 1 } },
        { id: 'performance_trends', position: { row: 1, col: 0, span: 3 } },
      ],
      refreshInterval: 5000,
      isDefault: true,
    });

    // Security Dashboard
    this.addDashboard('security', {
      name: 'Security Monitoring',
      description: 'Security events and threat analysis',
      layout: {
        rows: 2,
        columns: 2,
      },
      widgets: [
        { id: 'security_events', position: { row: 0, col: 0, span: 1 } },
        { id: 'authentication_stats', position: { row: 0, col: 1, span: 1 } },
        { id: 'threat_analysis', position: { row: 1, col: 0, span: 2 } },
      ],
      refreshInterval: 10000,
      isDefault: true,
    });
  }

  /**
   * Setup default widgets
   */
  setupDefaultWidgets() {
    // System Health Widget
    this.addWidget('system_health', {
      name: 'System Health',
      type: 'gauge',
      description: 'Overall system health score',
      dataSource: 'metrics',
      query: 'system_health_score',
      visualization: {
        type: 'gauge',
        min: 0,
        max: 100,
        thresholds: [
          { value: 80, color: 'green' },
          { value: 60, color: 'yellow' },
          { value: 0, color: 'red' },
        ],
      },
    });

    // Response Time Widget
    this.addWidget('response_time', {
      name: 'Response Time',
      type: 'line_chart',
      description: 'Average response time over time',
      dataSource: 'metrics',
      query: 'avg_response_time',
      visualization: {
        type: 'line',
        timeWindow: '1h',
        yAxisLabel: 'ms',
      },
    });

    // Error Rate Widget
    this.addWidget('error_rate', {
      name: 'Error Rate',
      type: 'number',
      description: 'Current error rate percentage',
      dataSource: 'metrics',
      query: 'error_rate',
      visualization: {
        type: 'number',
        suffix: '%',
        precision: 2,
        thresholds: [
          { value: 5, color: 'red' },
          { value: 1, color: 'yellow' },
          { value: 0, color: 'green' },
        ],
      },
    });

    // Throughput Widget
    this.addWidget('throughput', {
      name: 'Throughput',
      type: 'number',
      description: 'Requests per second',
      dataSource: 'metrics',
      query: 'requests_per_second',
      visualization: {
        type: 'number',
        suffix: ' req/s',
        precision: 1,
      },
    });

    // CPU and Memory Widget
    this.addWidget('cpu_memory', {
      name: 'CPU & Memory',
      type: 'multi_line_chart',
      description: 'CPU and memory usage over time',
      dataSource: 'metrics',
      queries: ['cpu_usage_percent', 'memory_usage_percent'],
      visualization: {
        type: 'multi_line',
        timeWindow: '1h',
        yAxisLabel: '%',
        series: [
          { name: 'CPU', color: '#ff6b6b' },
          { name: 'Memory', color: '#4ecdc4' },
        ],
      },
    });

    // Active Alerts Widget
    this.addWidget('active_alerts', {
      name: 'Active Alerts',
      type: 'list',
      description: 'Current active alerts',
      dataSource: 'alerts',
      query: 'active_alerts',
      visualization: {
        type: 'alert_list',
        maxItems: 10,
        showSeverity: true,
        showTimestamp: true,
      },
    });

    // Service Status Widget
    this.addWidget('service_status', {
      name: 'Service Status',
      type: 'status_grid',
      description: 'Status of all microservices',
      dataSource: 'services',
      query: 'service_health_status',
      visualization: {
        type: 'status_grid',
        services: ['signer', 'chain', 'collector', 'backup', 'monitoring'],
      },
    });

    // Signing Operations Widget
    this.addWidget('signing_operations', {
      name: 'Signing Operations',
      type: 'bar_chart',
      description: 'Signing operations by status',
      dataSource: 'business_metrics',
      query: 'signing_operations_by_status',
      visualization: {
        type: 'bar',
        categories: ['success', 'failed', 'pending'],
      },
    });

    // Chain Integrity Widget
    this.addWidget('chain_integrity', {
      name: 'Chain Integrity',
      type: 'gauge',
      description: 'Chain integrity score',
      dataSource: 'business_metrics',
      query: 'chain_integrity_score',
      visualization: {
        type: 'gauge',
        min: 0,
        max: 100,
        thresholds: [
          { value: 95, color: 'green' },
          { value: 90, color: 'yellow' },
          { value: 0, color: 'red' },
        ],
      },
    });

    // Performance Trends Widget
    this.addWidget('performance_trends', {
      name: 'Performance Trends',
      type: 'multi_line_chart',
      description: '24-hour performance trends',
      dataSource: 'metrics',
      queries: ['avg_response_time', 'throughput', 'error_rate'],
      visualization: {
        type: 'multi_line',
        timeWindow: '24h',
        aggregation: 'avg',
        interval: '1h',
      },
    });
  }

  /**
   * Setup web server for dashboards
   */
  async setupWebServer() {
    this.app = express();

    // Serve static dashboard files
    this.app.use('/static', express.static(path.join(process.cwd(), 'public/dashboards')));

    // API endpoints
    this.app.get('/api/dashboards', (req, res) => {
      const dashboards = Array.from(this.dashboards.values()).map(d => ({
        id: d.id,
        name: d.name,
        description: d.description,
        isDefault: d.isDefault,
      }));
      res.json(dashboards);
    });

    this.app.get('/api/dashboards/:id', (req, res) => {
      const dashboard = this.dashboards.get(req.params.id);
      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }
      res.json(dashboard);
    });

    this.app.get('/api/widgets', (req, res) => {
      const widgets = Array.from(this.widgets.values());
      res.json(widgets);
    });

    this.app.get('/api/widgets/:id/data', async (req, res) => {
      try {
        const widgetData = await this.getWidgetData(req.params.id);
        res.json(widgetData);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'monitoring-dashboards',
        timestamp: new Date().toISOString(),
      });
    });

    // Main dashboard page
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboardHTML());
    });

    this.server = createServer(this.app);
  }

  /**
   * Setup Socket.IO for real-time updates
   */
  setupSocketIO() {
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      const clientId = uuidv4();
      this.clients.set(clientId, {
        id: clientId,
        socket,
        subscribedDashboards: new Set(),
        subscribedWidgets: new Set(),
      });

      console.log(`Dashboard client connected: ${clientId}`);

      // Handle dashboard subscription
      socket.on('subscribe_dashboard', (dashboardId) => {
        const client = this.clients.get(clientId);
        if (client) {
          client.subscribedDashboards.add(dashboardId);
          // Send initial dashboard data
          this.sendDashboardData(clientId, dashboardId);
        }
      });

      // Handle widget subscription
      socket.on('subscribe_widget', (widgetId) => {
        const client = this.clients.get(clientId);
        if (client) {
          client.subscribedWidgets.add(widgetId);
          // Send initial widget data
          this.sendWidgetData(clientId, widgetId);
        }
      });

      // Handle unsubscription
      socket.on('unsubscribe_dashboard', (dashboardId) => {
        const client = this.clients.get(clientId);
        if (client) {
          client.subscribedDashboards.delete(dashboardId);
        }
      });

      socket.on('unsubscribe_widget', (widgetId) => {
        const client = this.clients.get(clientId);
        if (client) {
          client.subscribedWidgets.delete(widgetId);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.clients.delete(clientId);
        console.log(`Dashboard client disconnected: ${clientId}`);
      });
    });

    // Start server
    this.server.listen(this.config.port, () => {
      console.log(`Dashboard server listening on port ${this.config.port}`);
    });
  }

  /**
   * Add dashboard
   */
  addDashboard(dashboardId, config) {
    this.dashboards.set(dashboardId, {
      id: dashboardId,
      ...config,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Add widget
   */
  addWidget(widgetId, config) {
    this.widgets.set(widgetId, {
      id: widgetId,
      ...config,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Update metrics for dashboards
   */
  updateMetrics(metrics) {
    const timestamp = new Date().toISOString();

    // Store metrics with timestamp
    for (const [key, value] of Object.entries(metrics)) {
      if (typeof value === 'number' && !isNaN(value)) {
        let metricHistory = this.metricsBuffer.get(key) || [];

        metricHistory.push({
          value,
          timestamp,
        });

        // Keep only recent data points
        if (metricHistory.length > this.config.maxDataPoints) {
          metricHistory = metricHistory.slice(-this.config.maxDataPoints);
        }

        this.metricsBuffer.set(key, metricHistory);
      }
    }

    // Broadcast to subscribed clients if real-time streaming is enabled
    if (this.config.enableRealTimeStreaming) {
      this.broadcastMetricsUpdate(metrics);
    }

    this.emit('metrics_updated', { metrics, timestamp });
  }

  /**
   * Update alerts for dashboards
   */
  updateAlerts(alerts) {
    this.alertsBuffer = alerts.slice(-100); // Keep last 100 alerts

    // Broadcast to subscribed clients
    if (this.config.enableRealTimeStreaming) {
      this.broadcastAlertsUpdate(alerts);
    }

    this.emit('alerts_updated', alerts);
  }

  /**
   * Get widget data
   */
  async getWidgetData(widgetId) {
    const widget = this.widgets.get(widgetId);
    if (!widget) {
      throw new Error(`Widget ${widgetId} not found`);
    }

    switch (widget.dataSource) {
    case 'metrics':
      return this.getMetricsData(widget);
    case 'alerts':
      return this.getAlertsData(widget);
    case 'services':
      return this.getServicesData(widget);
    case 'business_metrics':
      return this.getBusinessMetricsData(widget);
    default:
      throw new Error(`Unknown data source: ${widget.dataSource}`);
    }
  }

  /**
   * Get metrics data for widget
   */
  getMetricsData(widget) {
    if (widget.queries) {
      // Multi-query widget
      const data = {};
      for (const query of widget.queries) {
        const metricHistory = this.metricsBuffer.get(query) || [];
        data[query] = this.processMetricData(metricHistory, widget.visualization);
      }
      return data;
    } else {
      // Single query widget
      const metricHistory = this.metricsBuffer.get(widget.query) || [];
      return this.processMetricData(metricHistory, widget.visualization);
    }
  }

  /**
   * Get alerts data for widget
   */
  getAlertsData(widget) {
    const alerts = this.alertsBuffer.filter(alert => alert.status === 'active');

    return {
      alerts: alerts.slice(0, widget.visualization.maxItems || 10),
      total: alerts.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get services data for widget
   */
  getServicesData(widget) {
    const services = widget.visualization.services || [];
    const serviceStatus = {};

    for (const service of services) {
      // Get latest health status for each service
      const healthMetric = this.metricsBuffer.get(`service_health_${service}`) || [];
      const latest = healthMetric.length > 0 ? healthMetric[healthMetric.length - 1] : null;

      serviceStatus[service] = {
        status: latest && latest.value === 1 ? 'healthy' : 'unhealthy',
        lastUpdate: latest ? latest.timestamp : null,
      };
    }

    return {
      services: serviceStatus,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get business metrics data for widget
   */
  getBusinessMetricsData(widget) {
    // Similar to getMetricsData but for business-specific metrics
    return this.getMetricsData(widget);
  }

  /**
   * Process metric data based on visualization type
   */
  processMetricData(metricHistory, visualization) {
    if (metricHistory.length === 0) {
      return { value: null, data: [], timestamp: new Date().toISOString() };
    }

    const latest = metricHistory[metricHistory.length - 1];
    let processedData = metricHistory;

    // Apply time window filtering
    if (visualization.timeWindow) {
      const timeWindowMs = this.parseTimeWindow(visualization.timeWindow);
      const cutoffTime = Date.now() - timeWindowMs;
      processedData = metricHistory.filter(point =>
        new Date(point.timestamp).getTime() > cutoffTime,
      );
    }

    // Apply aggregation if specified
    if (visualization.aggregation && visualization.interval) {
      processedData = this.aggregateData(processedData, visualization.interval, visualization.aggregation);
    }

    return {
      value: latest.value,
      data: processedData,
      timestamp: latest.timestamp,
      count: processedData.length,
    };
  }

  /**
   * Parse time window string to milliseconds
   */
  parseTimeWindow(timeWindow) {
    const units = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
    };

    const match = timeWindow.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600000; // Default 1 hour
    }

    const [, amount, unit] = match;
    return parseInt(amount) * units[unit];
  }

  /**
   * Aggregate data by interval
   */
  aggregateData(data, interval, aggregation) {
    const intervalMs = this.parseTimeWindow(interval);
    const buckets = new Map();

    // Group data into time buckets
    for (const point of data) {
      const time = new Date(point.timestamp).getTime();
      const bucketTime = Math.floor(time / intervalMs) * intervalMs;

      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, []);
      }
      buckets.get(bucketTime).push(point.value);
    }

    // Aggregate each bucket
    const aggregated = [];
    for (const [bucketTime, values] of buckets) {
      let aggregatedValue;

      switch (aggregation) {
      case 'avg':
        aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
        break;
      case 'sum':
        aggregatedValue = values.reduce((sum, val) => sum + val, 0);
        break;
      case 'max':
        aggregatedValue = Math.max(...values);
        break;
      case 'min':
        aggregatedValue = Math.min(...values);
        break;
      default:
        aggregatedValue = values[values.length - 1]; // Last value
      }

      aggregated.push({
        value: aggregatedValue,
        timestamp: new Date(bucketTime).toISOString(),
      });
    }

    return aggregated.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Send dashboard data to client
   */
  async sendDashboardData(clientId, dashboardId) {
    try {
      const client = this.clients.get(clientId);
      const dashboard = this.dashboards.get(dashboardId);

      if (!client || !dashboard) {return;}

      // Get data for all widgets in dashboard
      const widgetData = {};
      for (const widgetConfig of dashboard.widgets) {
        const data = await this.getWidgetData(widgetConfig.id);
        widgetData[widgetConfig.id] = data;
      }

      client.socket.emit('dashboard_data', {
        dashboardId,
        widgets: widgetData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error sending dashboard data to client ${clientId}:`, error);
    }
  }

  /**
   * Send widget data to client
   */
  async sendWidgetData(clientId, widgetId) {
    try {
      const client = this.clients.get(clientId);
      if (!client) {return;}

      const data = await this.getWidgetData(widgetId);
      client.socket.emit('widget_data', {
        widgetId,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error sending widget data to client ${clientId}:`, error);
    }
  }

  /**
   * Broadcast metrics update to all clients
   */
  broadcastMetricsUpdate(metrics) {
    for (const [clientId, client] of this.clients) {
      // Send updates for subscribed widgets that use metrics
      for (const widgetId of client.subscribedWidgets) {
        const widget = this.widgets.get(widgetId);
        if (widget && widget.dataSource === 'metrics') {
          this.sendWidgetData(clientId, widgetId);
        }
      }
    }
  }

  /**
   * Broadcast alerts update to all clients
   */
  broadcastAlertsUpdate(alerts) {
    for (const [clientId, client] of this.clients) {
      // Send updates for subscribed widgets that use alerts
      for (const widgetId of client.subscribedWidgets) {
        const widget = this.widgets.get(widgetId);
        if (widget && widget.dataSource === 'alerts') {
          this.sendWidgetData(clientId, widgetId);
        }
      }
    }
  }

  /**
   * Start data streaming
   */
  startDataStreaming() {
    if (!this.config.enableRealTimeStreaming) {return;}

    this.streamingInterval = setInterval(() => {
      // Refresh all connected clients
      for (const [clientId, client] of this.clients) {
        for (const dashboardId of client.subscribedDashboards) {
          this.sendDashboardData(clientId, dashboardId);
        }
      }
    }, this.config.updateInterval);

    console.log(`Started real-time data streaming with ${this.config.updateInterval}ms interval`);
  }

  /**
   * Generate basic dashboard HTML
   */
  generateDashboardHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>MerajutASA.id - Monitoring Dashboards</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .dashboard { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .widget { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .widget h3 { margin: 0 0 15px 0; color: #333; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2196F3; }
        .status-healthy { color: #4CAF50; }
        .status-unhealthy { color: #f44336; }
        .alert-critical { background: #ffebee; border-left: 4px solid #f44336; }
        .alert-high { background: #fff3e0; border-left: 4px solid #ff9800; }
        .alert-medium { background: #f3e5f5; border-left: 4px solid #9c27b0; }
    </style>
</head>
<body>
    <h1>MerajutASA.id - Real-time Monitoring</h1>
    <div id="dashboard" class="dashboard">
        <div class="widget">
            <h3>System Health</h3>
            <div id="system-health" class="metric-value">Loading...</div>
        </div>
        <div class="widget">
            <h3>Response Time</h3>
            <div id="response-time" class="metric-value">Loading...</div>
        </div>
        <div class="widget">
            <h3>Error Rate</h3>
            <div id="error-rate" class="metric-value">Loading...</div>
        </div>
        <div class="widget">
            <h3>Active Alerts</h3>
            <div id="active-alerts">Loading...</div>
        </div>
    </div>

    <script>
        const socket = io();
        
        socket.on('connect', () => {
            console.log('Connected to dashboard server');
            socket.emit('subscribe_dashboard', 'system_overview');
        });

        socket.on('dashboard_data', (data) => {
            updateDashboard(data);
        });

        function updateDashboard(data) {
            // Update system health
            const systemHealth = data.widgets.system_health;
            if (systemHealth) {
                document.getElementById('system-health').textContent = 
                    systemHealth.value ? systemHealth.value.toFixed(1) + '%' : 'N/A';
            }

            // Update response time
            const responseTime = data.widgets.response_time;
            if (responseTime) {
                document.getElementById('response-time').textContent = 
                    responseTime.value ? responseTime.value.toFixed(0) + 'ms' : 'N/A';
            }

            // Update error rate
            const errorRate = data.widgets.error_rate;
            if (errorRate) {
                document.getElementById('error-rate').textContent = 
                    errorRate.value ? errorRate.value.toFixed(2) + '%' : 'N/A';
            }

            // Update alerts
            const alerts = data.widgets.active_alerts;
            if (alerts) {
                const alertsDiv = document.getElementById('active-alerts');
                if (alerts.alerts && alerts.alerts.length > 0) {
                    alertsDiv.innerHTML = alerts.alerts.map(alert => 
                        \`<div class="alert-\${alert.severity}">\${alert.name}</div>\`
                    ).join('');
                } else {
                    alertsDiv.innerHTML = '<div class="status-healthy">No active alerts</div>';
                }
            }
        }
    </script>
</body>
</html>
    `;
  }

  /**
   * Export dashboard configuration
   */
  exportDashboard(dashboardId) {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    return {
      dashboard,
      widgets: dashboard.widgets.map(w => this.widgets.get(w.id)),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  /**
   * Import dashboard configuration
   */
  importDashboard(config) {
    const dashboardId = config.dashboard.id || uuidv4();

    // Import widgets first
    for (const widget of config.widgets) {
      if (widget) {
        this.addWidget(widget.id, widget);
      }
    }

    // Import dashboard
    this.addDashboard(dashboardId, config.dashboard);

    return dashboardId;
  }

  /**
   * Health check for dashboard system
   */
  async healthCheck() {
    try {
      return {
        status: 'healthy',
        service: this.config.serviceName,
        port: this.config.port,
        dashboards: this.dashboards.size,
        widgets: this.widgets.size,
        connectedClients: this.clients.size,
        realTimeStreaming: this.config.enableRealTimeStreaming,
        updateInterval: this.config.updateInterval,
        metricsBuffered: this.metricsBuffer.size,
        alertsBuffered: this.alertsBuffer.length,
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
   * Shutdown dashboard system
   */
  async shutdown() {
    try {
      if (this.streamingInterval) {
        clearInterval(this.streamingInterval);
      }

      if (this.io) {
        this.io.close();
      }

      if (this.server) {
        this.server.close();
      }

      this.clients.clear();
      this.metricsBuffer.clear();
      this.alertsBuffer = [];

      console.log('Real-time monitoring dashboards shutdown complete');
    } catch (error) {
      console.error('Error during dashboard shutdown:', error);
    }
  }
}

// Singleton instance for global use
let globalDashboards = null;

/**
 * Get or create global dashboard system
 */
export function getRealTimeMonitoringDashboards(config = {}) {
  if (!globalDashboards) {
    globalDashboards = new RealTimeMonitoringDashboards(config);
  }
  return globalDashboards;
}

export default RealTimeMonitoringDashboards;
