#!/usr/bin/env node
/**
 * structured-logger.js
 * Centralized structured logging service for MerajutASA.id
 * Implements JSON structured logging with log levels, correlation IDs, and audit trails
 */

import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import { performance } from 'perf_hooks';

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
  AUDIT: 5
};

// Current log level (configurable via environment)
const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'INFO'];

// Log configuration
const LOG_CONFIG = {
  logDir: './artifacts/logs',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  enableConsole: process.env.NODE_ENV !== 'production',
  enableFile: true,
  enableAudit: true,
  timestampFormat: 'iso',
  includeStackTrace: true
};

// Service metadata
const SERVICE_METADATA = {
  serviceName: process.env.SERVICE_NAME || 'merajutasa-service',
  version: process.env.SERVICE_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  nodeVersion: process.version,
  pid: process.pid,
  hostname: process.env.HOSTNAME || 'localhost'
};

// Current request context
let requestContext = new Map();

/**
 * Logger class with structured logging capabilities
 */
class StructuredLogger {
  constructor(options = {}) {
    this.config = { ...LOG_CONFIG, ...options };
    this.initializeLogDirectory();
  }

  async initializeLogDirectory() {
    try {
      await fs.mkdir(this.config.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  /**
   * Set request context for correlation
   */
  setRequestContext(requestId, context = {}) {
    requestContext.set(requestId, {
      ...context,
      startTime: performance.now()
    });
  }

  /**
   * Get request context
   */
  getRequestContext(requestId) {
    return requestContext.get(requestId) || {};
  }

  /**
   * Clear request context
   */
  clearRequestContext(requestId) {
    requestContext.delete(requestId);
  }

  /**
   * Generate correlation ID
   */
  generateCorrelationId() {
    return createHash('sha256')
      .update(`${Date.now()}-${Math.random()}-${process.pid}`)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Create base log entry structure
   */
  createBaseEntry(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const correlationId = meta.correlationId || this.generateCorrelationId();
    
    return {
      '@timestamp': timestamp,
      '@version': '1',
      level: level,
      message: message,
      logger: 'merajutasa-structured-logger',
      service: SERVICE_METADATA,
      correlation: {
        id: correlationId,
        requestId: meta.requestId || null
      },
      meta: { ...meta },
      performance: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    };
  }

  /**
   * Add error information to log entry
   */
  addErrorInfo(entry, error) {
    if (error instanceof Error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.config.includeStackTrace ? error.stack : undefined,
        code: error.code || null
      };
    } else if (typeof error === 'object') {
      entry.error = error;
    } else {
      entry.error = { message: String(error) };
    }
    return entry;
  }

  /**
   * Add request information to log entry
   */
  addRequestInfo(entry, requestId) {
    const context = this.getRequestContext(requestId);
    if (context) {
      entry.request = {
        id: requestId,
        method: context.method,
        url: context.url,
        userAgent: context.userAgent,
        ip: context.ip,
        user: context.user,
        duration: context.startTime ? performance.now() - context.startTime : null
      };
    }
    return entry;
  }

  /**
   * Write log entry to file
   */
  async writeToFile(entry) {
    if (!this.config.enableFile) return;

    try {
      const logFile = `${this.config.logDir}/${SERVICE_METADATA.serviceName}.log`;
      const logLine = JSON.stringify(entry) + '\n';
      
      await fs.appendFile(logFile, logLine);
      
      // Check file size and rotate if necessary
      await this.rotateLogFileIfNeeded(logFile);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Write audit log entry to separate file
   */
  async writeToAuditFile(entry) {
    if (!this.config.enableAudit) return;

    try {
      const auditFile = `${this.config.logDir}/audit.log`;
      const logLine = JSON.stringify(entry) + '\n';
      
      await fs.appendFile(auditFile, logLine);
      
      // Check file size and rotate if necessary
      await this.rotateLogFileIfNeeded(auditFile, 'audit');
    } catch (error) {
      console.error('Failed to write to audit file:', error);
    }
  }

  /**
   * Rotate log file if it exceeds maximum size
   */
  async rotateLogFileIfNeeded(logFile, type = 'main') {
    try {
      const stats = await fs.stat(logFile);
      
      if (stats.size > this.config.maxFileSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedFile = logFile.replace(/\.log$/, `-${timestamp}.log`);
        
        await fs.rename(logFile, rotatedFile);
        
        // Clean up old log files
        await this.cleanupOldLogFiles(type);
      }
    } catch (error) {
      // File doesn't exist or other error, continue
    }
  }

  /**
   * Clean up old log files, keeping only the most recent ones
   */
  async cleanupOldLogFiles(type = 'main') {
    try {
      const files = await fs.readdir(this.config.logDir);
      // Sanitize service name to prevent regex injection
      const safeName = SERVICE_METADATA.serviceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = type === 'audit' ? /^audit-.*\.log$/ : new RegExp(`^${safeName}-.*\\.log$`);
      
      const logFiles = files
        .filter(file => pattern.test(file))
        .map(file => ({
          name: file,
          path: `${this.config.logDir}/${file}`
        }))
        .sort((a, b) => b.name.localeCompare(a.name));

      // Remove old files beyond the limit
      if (logFiles.length > this.config.maxFiles) {
        const filesToDelete = logFiles.slice(this.config.maxFiles);
        
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old log files:', error);
    }
  }

  /**
   * Write to console with formatted output
   */
  writeToConsole(entry) {
    if (!this.config.enableConsole) return;

    const levelColors = {
      DEBUG: '\x1b[36m',  // Cyan
      INFO: '\x1b[32m',   // Green
      WARN: '\x1b[33m',   // Yellow
      ERROR: '\x1b[31m',  // Red
      FATAL: '\x1b[35m',  // Magenta
      AUDIT: '\x1b[34m'   // Blue
    };

    const reset = '\x1b[0m';
    const color = levelColors[entry.level] || '';
    
    const timestamp = entry['@timestamp'];
    const level = entry.level.padEnd(5);
    const correlationId = entry.correlation.id.substring(0, 8);
    const message = entry.message;
    
    console.log(`${color}${timestamp} [${level}] (${correlationId}) ${message}${reset}`);
    
    if (entry.error) {
      console.error(`${color}  Error: ${entry.error.message}${reset}`);
      if (entry.error.stack && this.config.includeStackTrace) {
        console.error(`${color}  Stack: ${entry.error.stack}${reset}`);
      }
    }
    
    if (entry.meta && Object.keys(entry.meta).length > 0) {
      console.log(`${color}  Meta: ${JSON.stringify(entry.meta, null, 2)}${reset}`);
    }
  }

  /**
   * Log a message at the specified level
   */
  async log(level, message, meta = {}, error = null) {
    const levelValue = LOG_LEVELS[level];
    
    if (levelValue < CURRENT_LOG_LEVEL) {
      return; // Skip logging if below current level
    }

    const entry = this.createBaseEntry(level, message, meta);
    
    if (error) {
      this.addErrorInfo(entry, error);
    }
    
    if (meta.requestId) {
      this.addRequestInfo(entry, meta.requestId);
    }

    // Write to console
    this.writeToConsole(entry);
    
    // Write to log file
    await this.writeToFile(entry);
    
    // Write to audit file for AUDIT level
    if (level === 'AUDIT') {
      await this.writeToAuditFile(entry);
    }
    
    return entry;
  }

  // Convenience methods for different log levels
  async debug(message, meta = {}) {
    return this.log('DEBUG', message, meta);
  }

  async info(message, meta = {}) {
    return this.log('INFO', message, meta);
  }

  async warn(message, meta = {}, error = null) {
    return this.log('WARN', message, meta, error);
  }

  async error(message, meta = {}, error = null) {
    return this.log('ERROR', message, meta, error);
  }

  async fatal(message, meta = {}, error = null) {
    return this.log('FATAL', message, meta, error);
  }

  async audit(action, meta = {}) {
    const auditMeta = {
      ...meta,
      auditType: 'user_action',
      timestamp: new Date().toISOString()
    };
    return this.log('AUDIT', `AUDIT: ${action}`, auditMeta);
  }

  /**
   * Log governance operations
   */
  async logGovernanceOperation(operation, status, meta = {}) {
    const governanceMeta = {
      ...meta,
      operationType: operation,
      status: status,
      category: 'governance'
    };
    
    const level = status === 'success' ? 'INFO' : 'ERROR';
    return this.log(level, `Governance operation: ${operation} - ${status}`, governanceMeta);
  }

  /**
   * Log security events
   */
  async logSecurityEvent(event, severity, meta = {}) {
    const securityMeta = {
      ...meta,
      eventType: event,
      severity: severity,
      category: 'security'
    };
    
    const level = severity === 'high' ? 'ERROR' : severity === 'medium' ? 'WARN' : 'INFO';
    return this.log(level, `Security event: ${event}`, securityMeta);
  }

  /**
   * Log performance metrics
   */
  async logPerformanceMetric(metric, value, meta = {}) {
    const perfMeta = {
      ...meta,
      metricName: metric,
      metricValue: value,
      category: 'performance'
    };
    
    return this.log('INFO', `Performance metric: ${metric} = ${value}`, perfMeta);
  }
}

/**
 * Create Express middleware for request logging
 */
function createLoggingMiddleware(logger) {
  return function loggingMiddleware(req, res, next) {
    const requestId = req.headers['x-request-id'] || logger.generateCorrelationId();
    const startTime = performance.now();
    
    // Set request context
    logger.setRequestContext(requestId, {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      user: req.user?.id || 'anonymous'
    });
    
    // Add request ID to request object
    req.requestId = requestId;
    
    // Log incoming request
    logger.info('Incoming request', {
      requestId: requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    });
    
    // Log response when finished
    res.on('finish', () => {
      const duration = performance.now() - startTime;
      
      logger.info('Request completed', {
        requestId: requestId,
        statusCode: res.statusCode,
        duration: Math.round(duration * 100) / 100 // Round to 2 decimal places
      });
      
      // Clear request context
      logger.clearRequestContext(requestId);
    });
    
    next();
  };
}

// Create global logger instance
const logger = new StructuredLogger();

export {
  StructuredLogger,
  logger,
  createLoggingMiddleware,
  LOG_LEVELS
};

export default logger;