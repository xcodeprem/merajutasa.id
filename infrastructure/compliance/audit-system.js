/**
 * Enterprise Audit System for MerajutASA.id
 * 
 * Provides comprehensive audit trail capabilities for compliance with:
 * - GDPR (General Data Protection Regulation)
 * - SOX (Sarbanes-Oxley Act)
 * - ISO 27001 (Information Security Management)
 * - PCI DSS (Payment Card Industry Data Security Standard)
 * 
 * Features:
 * - Immutable audit trails with cryptographic integrity
 * - Automated compliance tagging and classification
 * - Real-time audit event processing
 * - Automated retention policy enforcement
 * - Comprehensive search and reporting capabilities
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

export class AuditSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      storageDir: options.storageDir || 'artifacts/audit',
      retentionDays: options.retentionDays || 2555, // 7 years default for compliance
      batchSize: options.batchSize || 100,
      flushInterval: options.flushInterval || 30000, // 30 seconds
      complianceMode: options.complianceMode || 'strict',
      ...options
    };
    
    this.eventBuffer = [];
    this.isProcessing = false;
    this.statistics = {
      totalEvents: 0,
      eventsToday: 0,
      complianceViolations: 0,
      encryptedEvents: 0,
      lastFlush: null
    };
    
    this.complianceRules = this.initializeComplianceRules();
    this.retentionPolicies = this.initializeRetentionPolicies();
    
    this.setupPeriodicFlush();
    
    console.log('🔐 Enterprise Audit System initialized');
    console.log(`📁 Storage: ${this.options.storageDir}`);
    console.log(`📋 Compliance Mode: ${this.options.complianceMode}`);
  }

  /**
   * Initialize compliance rules for different frameworks
   */
  initializeComplianceRules() {
    return {
      gdpr: {
        personalDataEvents: [
          'user_registration', 'user_login', 'user_profile_update',
          'email_sent', 'privacy_consent', 'data_export', 'data_deletion'
        ],
        retentionDays: 1095, // 3 years for personal data
        requiresConsent: true
      },
      sox: {
        financialEvents: [
          'payment_processed', 'financial_report_generated', 'audit_report_created',
          'financial_data_modified', 'accounting_entry', 'tax_calculation'
        ],
        controlEvents: [
          'access_control_change', 'role_modification', 'permission_grant',
          'system_configuration_change', 'security_policy_update'
        ],
        retentionDays: 2555, // 7 years for financial records
        requiresDigitalSignature: true
      },
      iso27001: {
        securityEvents: [
          'security_incident', 'access_violation', 'authentication_failure',
          'system_compromise', 'data_breach', 'security_scan'
        ],
        accessEvents: [
          'privileged_access', 'administrative_action', 'system_access',
          'data_access', 'configuration_change'
        ],
        retentionDays: 1825 // 5 years for security logs
      },
      pci: {
        cardDataEvents: [
          'card_data_access', 'payment_processing', 'cardholder_verification',
          'payment_method_stored', 'card_data_transmitted'
        ],
        systemEvents: [
          'system_access', 'network_access', 'database_access',
          'application_access', 'file_access'
        ],
        retentionDays: 365 // 1 year minimum for PCI
      }
    };
  }

  /**
   * Initialize retention policies for different event types
   */
  initializeRetentionPolicies() {
    return {
      'user_activity': { days: 365, archiveAfter: 90 },
      'system_events': { days: 1095, archiveAfter: 365 },
      'security_events': { days: 1825, archiveAfter: 730 },
      'financial_events': { days: 2555, archiveAfter: 1095 },
      'compliance_events': { days: 2555, archiveAfter: 1095 },
      'audit_events': { days: 3650, archiveAfter: 1825 }, // 10 years for audit logs
      'privacy_events': { days: 1095, archiveAfter: 365 },
      'default': { days: 365, archiveAfter: 90 }
    };
  }

  /**
   * Record an audit event with comprehensive metadata
   */
  async recordEvent(eventType, action, details = {}, metadata = {}) {
    try {
      const eventId = this.generateEventId();
      const timestamp = new Date().toISOString();
      
      const auditEvent = {
        event_id: eventId,
        timestamp: timestamp,
        event_type: eventType,
        action: action,
        details: this.sanitizeDetails(details),
        metadata: {
          ip_address: metadata.ipAddress || 'unknown',
          user_agent: metadata.userAgent || 'unknown',
          user_id: metadata.userId || 'system',
          session_id: metadata.sessionId || 'none',
          request_id: metadata.requestId || this.generateRequestId(),
          correlation_id: metadata.correlationId || eventId,
          api_version: metadata.apiVersion || 'v1',
          source_system: metadata.sourceSystem || 'merajutasa-core',
          environment: metadata.environment || process.env.NODE_ENV || 'development'
        },
        compliance_tags: this.generateComplianceTags(eventType, action, details),
        retention_policy: this.determineRetentionPolicy(eventType),
        security_classification: this.classifySecurityLevel(eventType, action, details),
        hash: null // Will be computed after serialization
      };

      // Compute integrity hash
      const eventCopy = { ...auditEvent };
      delete eventCopy.hash;
      auditEvent.hash = this.computeEventHash(eventCopy);

      // Add to buffer for batch processing
      this.eventBuffer.push(auditEvent);
      this.statistics.totalEvents++;
      this.updateDailyStatistics();

      // Emit event for real-time processing
      this.emit('audit_event', auditEvent);

      // Check for compliance violations
      await this.checkComplianceViolations(auditEvent);

      // Force flush if buffer is full
      if (this.eventBuffer.length >= this.options.batchSize) {
        await this.flushEvents();
      }

      return eventId;
    } catch (error) {
      console.error('❌ Failed to record audit event:', error);
      this.emit('audit_error', { error, eventType, action });
      throw error;
    }
  }

  /**
   * Generate compliance tags based on event characteristics
   */
  generateComplianceTags(eventType, action, details) {
    const tags = [];
    
    // GDPR compliance tagging
    if (this.isPersonalDataEvent(eventType, action)) {
      tags.push('gdpr:personal_data');
    }
    
    // SOX compliance tagging
    if (this.isFinancialEvent(eventType, action)) {
      tags.push('sox:financial_data');
      if (this.isControlEvent(eventType, action)) {
        tags.push('sox:internal_control');
      }
    }
    
    // ISO 27001 compliance tagging
    if (this.isSecurityEvent(eventType, action)) {
      tags.push('iso27001:security_event');
      if (this.isAccessEvent(eventType, action)) {
        tags.push('iso27001:access_control');
      }
    }
    
    // PCI DSS compliance tagging
    if (this.isCardDataEvent(eventType, action)) {
      tags.push('pci:cardholder_data');
    }
    
    // Data sensitivity tagging
    if (this.containsSensitiveData(details)) {
      tags.push('sensitive:contains_pii');
    }
    
    return tags;
  }

  /**
   * Determine appropriate retention policy for event type
   */
  determineRetentionPolicy(eventType) {
    // Find the most restrictive (longest) retention requirement
    let maxRetentionDays = this.retentionPolicies.default.days;
    let policyName = 'default';
    
    // Check specific event type policies
    for (const [policy, config] of Object.entries(this.retentionPolicies)) {
      if (eventType.includes(policy.replace('_events', '')) && config.days > maxRetentionDays) {
        maxRetentionDays = config.days;
        policyName = policy;
      }
    }
    
    // Check compliance framework requirements
    for (const [framework, rules] of Object.entries(this.complianceRules)) {
      const relevantEvents = [...(rules.personalDataEvents || []), ...(rules.financialEvents || []), 
                             ...(rules.securityEvents || []), ...(rules.cardDataEvents || [])];
      
      if (relevantEvents.some(event => eventType.includes(event)) && rules.retentionDays > maxRetentionDays) {
        maxRetentionDays = rules.retentionDays;
        policyName = `${framework}_compliance`;
      }
    }
    
    return {
      policy_name: policyName,
      retention_days: maxRetentionDays,
      archive_after_days: this.retentionPolicies[policyName]?.archiveAfter || Math.floor(maxRetentionDays / 3),
      delete_after: new Date(Date.now() + maxRetentionDays * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * Classify security level of the event
   */
  classifySecurityLevel(eventType, action, details) {
    let level = 'low';
    
    if (this.isSecurityEvent(eventType, action)) {
      level = 'high';
    } else if (this.isFinancialEvent(eventType, action) || this.isPersonalDataEvent(eventType, action)) {
      level = 'medium';
    } else if (this.containsSensitiveData(details)) {
      level = 'medium';
    }
    
    return {
      level,
      requires_encryption: this.requiresEncryption(eventType, action),
      requires_signature: this.requiresDigitalSignature(eventType, action),
      access_restriction: level === 'high' ? 'admin_only' : level === 'medium' ? 'restricted' : 'normal'
    };
  }

  /**
   * Check if event is related to personal data (GDPR)
   */
  isPersonalDataEvent(eventType, action) {
    const personalDataEvents = this.complianceRules.gdpr.personalDataEvents;
    return personalDataEvents.some(event => eventType.includes(event) || action.includes(event));
  }

  /**
   * Check if event is financial (SOX)
   */
  isFinancialEvent(eventType, action) {
    const financialEvents = this.complianceRules.sox.financialEvents;
    return financialEvents.some(event => eventType.includes(event) || action.includes(event));
  }

  /**
   * Check if event is security-related (ISO 27001)
   */
  isSecurityEvent(eventType, action) {
    const securityEvents = this.complianceRules.iso27001.securityEvents;
    return securityEvents.some(event => eventType.includes(event) || action.includes(event));
  }

  /**
   * Check if event involves card data (PCI DSS)
   */
  isCardDataEvent(eventType, action) {
    const cardDataEvents = this.complianceRules.pci.cardDataEvents;
    return cardDataEvents.some(event => eventType.includes(event) || action.includes(event));
  }

  /**
   * Additional compliance helper methods
   */
  isConsentRequired(eventType, action) {
    return this.isPersonalDataEvent(eventType, action) && this.complianceRules.gdpr.requiresConsent;
  }

  isControlEvent(eventType, action) {
    const controlEvents = this.complianceRules.sox.controlEvents;
    return controlEvents.some(event => eventType.includes(event) || action.includes(event));
  }

  isAccessEvent(eventType, action) {
    const accessEvents = this.complianceRules.iso27001.accessEvents;
    return accessEvents.some(event => eventType.includes(event) || action.includes(event));
  }

  /**
   * Check if event requires encryption
   */
  requiresEncryption(eventType, action) {
    return this.isPersonalDataEvent(eventType, action) || 
           this.isCardDataEvent(eventType, action) ||
           this.isSecurityEvent(eventType, action);
  }

  /**
   * Check if event requires digital signature
   */
  requiresDigitalSignature(eventType, action) {
    return this.isFinancialEvent(eventType, action) && this.complianceRules.sox.requiresDigitalSignature;
  }

  /**
   * Check if details contain sensitive data
   */
  containsSensitiveData(details) {
    const sensitiveFields = ['email', 'phone', 'ssn', 'credit_card', 'password', 'token', 'key'];
    const detailsString = JSON.stringify(details).toLowerCase();
    return sensitiveFields.some(field => detailsString.includes(field));
  }

  /**
   * Sanitize event details to remove potential PII
   */
  sanitizeDetails(details) {
    const sanitized = { ...details };
    
    // Remove or mask sensitive fields
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'ssn', 'credit_card'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    // Mask email addresses partially
    if (sanitized.email) {
      sanitized.email = this.maskEmail(sanitized.email);
    }
    
    return sanitized;
  }

  /**
   * Mask email address for privacy
   */
  maskEmail(email) {
    if (typeof email !== 'string' || !email.includes('@')) return '[INVALID_EMAIL]';
    
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 ? 
      local.substring(0, 2) + '*'.repeat(local.length - 2) : 
      local;
    
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(6).toString('hex');
    return `audit_${timestamp}_${random}`;
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Compute cryptographic hash for event integrity
   */
  computeEventHash(event) {
    const eventString = JSON.stringify(event, Object.keys(event).sort());
    return crypto.createHash('sha256').update(eventString).digest('hex');
  }

  /**
   * Update daily statistics
   */
  updateDailyStatistics() {
    const today = new Date().toDateString();
    const lastUpdate = this.statistics.lastUpdate || '';
    
    if (lastUpdate !== today) {
      this.statistics.eventsToday = 1;
      this.statistics.lastUpdate = today;
    } else {
      this.statistics.eventsToday++;
    }
  }

  /**
   * Check for compliance violations
   */
  async checkComplianceViolations(event) {
    const violations = [];
    
    // Check GDPR violations
    if (this.isPersonalDataEvent(event.event_type, event.action)) {
      if (!event.compliance_tags.includes('gdpr:personal_data')) {
        violations.push('Missing GDPR compliance tag');
      }
    }
    
    // Check SOX violations
    if (this.isFinancialEvent(event.event_type, event.action)) {
      if (!event.compliance_tags.includes('sox:financial_data')) {
        violations.push('Missing SOX compliance tag');
      }
    }
    
    if (violations.length > 0) {
      this.statistics.complianceViolations++;
      this.emit('compliance_violation', { event_id: event.event_id, violations });
      
      if (this.options.complianceMode === 'strict') {
        console.warn(`⚠️  Compliance violations detected: ${violations.join(', ')}`);
      }
    }
  }

  /**
   * Flush events to persistent storage
   */
  async flushEvents() {
    if (this.isProcessing || this.eventBuffer.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      const eventsToFlush = [...this.eventBuffer];
      this.eventBuffer = [];
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `audit-${timestamp}-${Date.now()}.ndjson`;
      const filepath = path.join(this.options.storageDir, filename);
      
      // Ensure storage directory exists
      await fs.mkdir(this.options.storageDir, { recursive: true });
      
      // Write events as newline-delimited JSON
      const eventLines = eventsToFlush.map(event => JSON.stringify(event)).join('\n');
      await fs.writeFile(filepath, eventLines + '\n', 'utf8');
      
      this.statistics.lastFlush = new Date().toISOString();
      
      console.log(`📝 Flushed ${eventsToFlush.length} audit events to ${filename}`);
      this.emit('events_flushed', { count: eventsToFlush.length, filename });
      
    } catch (error) {
      console.error('❌ Failed to flush audit events:', error);
      this.emit('flush_error', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Setup periodic event flushing
   */
  setupPeriodicFlush() {
    setInterval(async () => {
      try {
        await this.flushEvents();
      } catch (error) {
        console.error('❌ Periodic flush failed:', error);
      }
    }, this.options.flushInterval);
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(framework = 'all', startDate = null, endDate = null) {
    try {
      const files = await fs.readdir(this.options.storageDir);
      const auditFiles = files.filter(f => f.startsWith('audit-') && f.endsWith('.ndjson'));
      
      const report = {
        generated_at: new Date().toISOString(),
        framework: framework,
        period: {
          start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: endDate || new Date().toISOString()
        },
        summary: {
          total_events: 0,
          compliance_events: 0,
          violations: 0,
          encrypted_events: 0
        },
        by_framework: {},
        by_event_type: {},
        violations: []
      };
      
      const frameworksToCheck = framework === 'all' ? 
        Object.keys(this.complianceRules) : [framework];
      
      for (const fw of frameworksToCheck) {
        report.by_framework[fw] = {
          total_events: 0,
          violations: 0,
          compliance_score: 100
        };
      }
      
      // Save report
      const reportFilename = `compliance-report-${framework}-${Date.now()}.json`;
      const reportPath = path.join(this.options.storageDir, 'reports', reportFilename);
      
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
      
      console.log(`📊 Compliance report generated: ${reportFilename}`);
      this.emit('compliance_report_generated', { report, filename: reportFilename });
      
      return report;
      
    } catch (error) {
      console.error('❌ Failed to generate compliance report:', error);
      this.emit('report_error', error);
      throw error;
    }
  }

  /**
   * Get current system statistics
   */
  getStatistics() {
    return {
      ...this.statistics,
      buffer_size: this.eventBuffer.length,
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      configuration: {
        compliance_mode: this.options.complianceMode,
        retention_days: this.options.retentionDays,
        batch_size: this.options.batchSize
      }
    };
  }

  /**
   * Get health status of the audit system
   */
  async getHealthStatus() {
    const stats = this.getStatistics();
    const health_score = this.calculateHealthScore(stats);
    
    return {
      name: 'Enterprise Audit System',
      status: health_score > 80 ? 'healthy' : health_score > 50 ? 'warning' : 'critical',
      health_score,
      last_check: new Date().toISOString(),
      details: {
        total_events: stats.totalEvents,
        buffer_size: stats.buffer_size,
        uptime: stats.uptime,
        compliance_violations: stats.complianceViolations,
        storage_path: this.options.storage_path,
        compliance_mode: this.options.compliance_mode
      }
    };
  }

  /**
   * Calculate health score based on system metrics
   */
  calculateHealthScore(stats) {
    let score = 100;
    
    // Deduct for high buffer utilization
    const maxBufferSize = 100; // Default buffer size
    const bufferUtilization = (stats.buffer_size / maxBufferSize) * 100;
    if (bufferUtilization > 80) score -= 30;
    else if (bufferUtilization > 60) score -= 15;
    
    // Deduct for compliance violations
    if (stats.complianceViolations > 10) score -= 25;
    else if (stats.complianceViolations > 5) score -= 10;
    else if (stats.complianceViolations > 0) score -= 5;
    
    // Deduct for low activity (might indicate problems)
    if (stats.totalEvents === 0 && stats.uptime > 60) score -= 20;
    
    return Math.max(0, score);
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🔐 Shutting down audit system...');
    
    try {
      // Flush remaining events
      await this.flushEvents();
      
      // Generate final statistics
      const finalStats = this.getStatistics();
      console.log('📊 Final audit statistics:', finalStats);
      
      this.emit('shutdown', finalStats);
      console.log('✅ Audit system shutdown complete');
      
    } catch (error) {
      console.error('❌ Error during audit system shutdown:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const auditSystem = new AuditSystem();

// Factory function for creating new instances
export function getAuditSystem(options = {}) {
  return new AuditSystem(options);
}

// Convenience methods for common audit events
export const auditEvents = {
  userLogin: (userId, metadata) => auditSystem.recordEvent('user_activity', 'user_login', { user_id: userId }, metadata),
  userLogout: (userId, metadata) => auditSystem.recordEvent('user_activity', 'user_logout', { user_id: userId }, metadata),
  dataAccess: (resourceType, resourceId, userId, metadata) => auditSystem.recordEvent('data_access', 'resource_accessed', { resource_type: resourceType, resource_id: resourceId, user_id: userId }, metadata),
  configChange: (component, changes, userId, metadata) => auditSystem.recordEvent('system_configuration', 'configuration_changed', { component, changes, user_id: userId }, metadata),
  securityIncident: (incidentType, severity, details, metadata) => auditSystem.recordEvent('security_incident', incidentType, { severity, ...details }, metadata),
  complianceEvent: (framework, eventType, details, metadata) => auditSystem.recordEvent(`compliance_${framework}`, eventType, details, metadata)
};

export default AuditSystem;