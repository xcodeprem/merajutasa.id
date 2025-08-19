/**
 * MerajutASA.id - Phase 2 Week 3: Log Aggregation System
 * 
 * Enterprise-grade log aggregation and management system
 * Provides centralized logging with structured data and correlation
 * 
 * Features:
 * - Structured logging with correlation IDs
 * - Log level management and filtering
 * - Audit trail integration
 * - Security event logging
 * - Performance and error tracking
 * 
 * @version 1.0.0
 * @since Phase 2 Week 3
 */

import EventEmitter from 'events';
import fs from 'fs/promises';
import path from 'path';

export class LogAggregationSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      serviceName: config.serviceName || 'merajutasa-service',
      logLevel: config.logLevel || 'info',
      logDir: config.logDir || 'artifacts/logs',
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles || 10,
      enableConsoleLogging: config.enableConsoleLogging !== false,
      enableAuditLogging: config.enableAuditLogging !== false,
      ...config
    };

    // Log levels
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };

    // Log storage
    this.logBuffer = [];
    this.auditLog = [];
    this.securityLog = [];
    
    this.initializeLogging();
  }

  /**
   * Initialize logging system
   */
  async initializeLogging() {
    try {
      await fs.mkdir(this.config.logDir, { recursive: true });
      console.log('Log Aggregation System initialized');
    } catch (error) {
      console.error('Failed to initialize logging:', error);
    }
  }

  /**
   * Log a message at specified level
   */
  log(level, message, metadata = {}) {
    if (this.logLevels[level] > this.logLevels[this.config.logLevel]) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.config.serviceName,
      message,
      metadata,
      correlationId: metadata.correlationId || this.generateCorrelationId()
    };

    this.logBuffer.push(logEntry);
    
    if (this.config.enableConsoleLogging) {
      console[level] || console.log(`[${level.toUpperCase()}] ${message}`, metadata);
    }

    this.emit('log_entry', logEntry);
  }

  /**
   * Log error messages
   */
  error(message, metadata = {}) {
    this.log('error', message, metadata);
  }

  /**
   * Log warning messages
   */
  warn(message, metadata = {}) {
    this.log('warn', message, metadata);
  }

  /**
   * Log info messages
   */
  info(message, metadata = {}) {
    this.log('info', message, metadata);
  }

  /**
   * Log debug messages
   */
  debug(message, metadata = {}) {
    this.log('debug', message, metadata);
  }

  /**
   * Log audit events
   */
  audit(action, component, details, status = 'success', metadata = {}) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      type: 'audit',
      action,
      component,
      details,
      status,
      metadata,
      correlationId: metadata.correlationId || this.generateCorrelationId()
    };

    this.auditLog.push(auditEntry);
    this.emit('audit_entry', auditEntry);

    if (this.config.enableAuditLogging) {
      console.log(`[AUDIT] ${action} on ${component}: ${status}`, details);
    }
  }

  /**
   * Log security events
   */
  security(eventType, severity, description, metadata = {}) {
    const securityEntry = {
      timestamp: new Date().toISOString(),
      type: 'security',
      eventType,
      severity,
      description,
      metadata,
      correlationId: metadata.correlationId || this.generateCorrelationId()
    };

    this.securityLog.push(securityEntry);
    this.emit('security_entry', securityEntry);

    console.log(`[SECURITY] ${severity.toUpperCase()}: ${eventType} - ${description}`, metadata);
  }

  /**
   * Search logs with filters
   */
  async searchLogs(filters = {}) {
    const { startTime, endTime, level, component, limit = 100 } = filters;
    
    let results = [...this.logBuffer];

    if (startTime) {
      results = results.filter(log => new Date(log.timestamp) >= new Date(startTime));
    }

    if (endTime) {
      results = results.filter(log => new Date(log.timestamp) <= new Date(endTime));
    }

    if (level) {
      results = results.filter(log => log.level === level);
    }

    if (component) {
      results = results.filter(log => log.metadata?.component === component);
    }

    return results.slice(0, limit);
  }

  /**
   * Get log statistics
   */
  getLogStatistics() {
    const stats = {
      totalLogs: this.logBuffer.length,
      auditLogs: this.auditLog.length,
      securityLogs: this.securityLog.length,
      logsByLevel: {},
      recentErrors: this.logBuffer.filter(log => 
        log.level === 'error' && 
        Date.now() - new Date(log.timestamp).getTime() < 3600000 // Last hour
      ).length
    };

    // Count logs by level
    for (const level of Object.keys(this.logLevels)) {
      stats.logsByLevel[level] = this.logBuffer.filter(log => log.level === level).length;
    }

    return stats;
  }

  /**
   * Generate correlation ID
   */
  generateCorrelationId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Flush logs to persistent storage
   */
  async flushLogs() {
    try {
      if (this.logBuffer.length > 0) {
        const logFile = path.join(this.config.logDir, `${this.config.serviceName}.log`);
        const logData = this.logBuffer.map(log => JSON.stringify(log)).join('\n') + '\n';
        await fs.appendFile(logFile, logData);
        this.logBuffer = [];
      }

      if (this.auditLog.length > 0) {
        const auditFile = path.join(this.config.logDir, `${this.config.serviceName}-audit.log`);
        const auditData = this.auditLog.map(log => JSON.stringify(log)).join('\n') + '\n';
        await fs.appendFile(auditFile, auditData);
        this.auditLog = [];
      }

      if (this.securityLog.length > 0) {
        const securityFile = path.join(this.config.logDir, `${this.config.serviceName}-security.log`);
        const securityData = this.securityLog.map(log => JSON.stringify(log)).join('\n') + '\n';
        await fs.appendFile(securityFile, securityData);
        this.securityLog = [];
      }
    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return {
      status: 'healthy',
      logBufferSize: this.logBuffer.length,
      auditLogSize: this.auditLog.length,
      securityLogSize: this.securityLog.length,
      configuration: {
        logLevel: this.config.logLevel,
        logDir: this.config.logDir
      }
    };
  }
}

// Singleton instance for global use
let globalLogAggregationSystem = null;

/**
 * Get or create global log aggregation system
 */
export function getLogAggregationSystem(config = {}) {
  if (!globalLogAggregationSystem) {
    globalLogAggregationSystem = new LogAggregationSystem(config);
  }
  return globalLogAggregationSystem;
}

export default LogAggregationSystem;