/**
 * Health Contract
 * Defines schema and validation for infrastructure health monitoring
 * Used across all health check aggregators for consistent output
 */

/**
 * Valid health status values
 */
export const HEALTH_STATUS = {
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  FAILED: 'FAILED',
};

/**
 * Health check contract for individual components
 * @typedef {Object} ComponentHealth
 * @property {string} component - Component name
 * @property {string} category - Component category
 * @property {string} status - One of HEALTH_STATUS values
 * @property {Object} [metrics] - Optional metrics object
 * @property {Object} [error] - Error details if status is FAILED
 * @property {string} [error.message] - Error message
 * @property {string} [error.code] - Error code
 * @property {string} ts - ISO timestamp
 */

/**
 * Health summary contract for aggregated results
 * @typedef {Object} HealthSummary
 * @property {number} ok - Count of HEALTHY components
 * @property {number} degraded - Count of DEGRADED components
 * @property {number} failed - Count of FAILED components
 * @property {number} total - Total component count
 * @property {Object} byCategory - Health breakdown by category
 * @property {string} ts - ISO timestamp
 */

/**
 * Validate component health object
 * @param {Object} health - Component health object to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateComponentHealth(health) {
  const errors = [];

  if (!health || typeof health !== 'object') {
    return { isValid: false, errors: ['Health object is required'] };
  }

  // Required fields
  if (!health.component || typeof health.component !== 'string') {
    errors.push('component field is required and must be a string');
  }

  if (!health.category || typeof health.category !== 'string') {
    errors.push('category field is required and must be a string');
  }

  if (!health.status || !Object.values(HEALTH_STATUS).includes(health.status)) {
    errors.push(`status field is required and must be one of: ${Object.values(HEALTH_STATUS).join(', ')}`);
  }

  if (!health.ts || typeof health.ts !== 'string') {
    errors.push('ts field is required and must be an ISO timestamp string');
  }

  // Validate timestamp format
  if (health.ts && isNaN(Date.parse(health.ts))) {
    errors.push('ts field must be a valid ISO timestamp');
  }

  // Optional fields validation
  if (health.metrics && typeof health.metrics !== 'object') {
    errors.push('metrics field must be an object if provided');
  }

  if (health.error && typeof health.error !== 'object') {
    errors.push('error field must be an object if provided');
  }

  if (health.error && (!health.error.message || typeof health.error.message !== 'string')) {
    errors.push('error.message is required when error is provided');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate health summary object
 * @param {Object} summary - Health summary object to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateHealthSummary(summary) {
  const errors = [];

  if (!summary || typeof summary !== 'object') {
    return { isValid: false, errors: ['Summary object is required'] };
  }

  // Required numeric fields
  const numericFields = ['ok', 'degraded', 'failed', 'total'];
  for (const field of numericFields) {
    if (typeof summary[field] !== 'number' || summary[field] < 0) {
      errors.push(`${field} field is required and must be a non-negative number`);
    }
  }

  if (!summary.ts || typeof summary.ts !== 'string') {
    errors.push('ts field is required and must be an ISO timestamp string');
  }

  if (summary.ts && isNaN(Date.parse(summary.ts))) {
    errors.push('ts field must be a valid ISO timestamp');
  }

  if (!summary.byCategory || typeof summary.byCategory !== 'object') {
    errors.push('byCategory field is required and must be an object');
  }

  // Validate totals match
  if (summary.ok + summary.degraded + summary.failed !== summary.total) {
    errors.push('Sum of ok + degraded + failed must equal total');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Helper to map status strings to standard format
 * @param {string} status - Input status (case insensitive)
 * @returns {string} Standardized status
 */
export function mapStatus(status) {
  if (!status || typeof status !== 'string') {
    return HEALTH_STATUS.FAILED;
  }

  const normalized = status.toUpperCase();

  // Map common variations
  switch (normalized) {
  case 'OK':
  case 'UP':
  case 'ONLINE':
  case 'GOOD':
  case 'GREEN':
    return HEALTH_STATUS.HEALTHY;

  case 'WARNING':
  case 'WARN':
  case 'YELLOW':
  case 'PARTIAL':
  case 'UNSTABLE':
    return HEALTH_STATUS.DEGRADED;

  case 'ERROR':
  case 'DOWN':
  case 'OFFLINE':
  case 'BAD':
  case 'RED':
  case 'CRITICAL':
    return HEALTH_STATUS.FAILED;

  default:
    // Return as-is if already a valid status
    if (Object.values(HEALTH_STATUS).includes(normalized)) {
      return normalized;
    }
    return HEALTH_STATUS.FAILED;
  }
}

/**
 * Create a standardized component health object
 * @param {string} component - Component name
 * @param {string} category - Component category
 * @param {string} status - Health status
 * @param {Object} options - Additional options
 * @returns {Object} Standardized health object
 */
export function createComponentHealth(component, category, status, options = {}) {
  const health = {
    component,
    category,
    status: mapStatus(status),
    ts: new Date().toISOString(),
  };

  if (options.metrics) {
    health.metrics = options.metrics;
  }

  if (options.error) {
    health.error = {
      message: options.error.message,
      ...(options.error.code && { code: options.error.code }),
    };
  }

  return health;
}

/**
 * Create a standardized health summary from component results
 * @param {Array} componentHealths - Array of component health objects
 * @returns {Object} Health summary object
 */
export function createHealthSummary(componentHealths) {
  const summary = {
    ok: 0,
    degraded: 0,
    failed: 0,
    total: componentHealths.length,
    byCategory: {},
    ts: new Date().toISOString(),
  };

  for (const health of componentHealths) {
    // Count by status
    switch (health.status) {
    case HEALTH_STATUS.HEALTHY:
      summary.ok++;
      break;
    case HEALTH_STATUS.DEGRADED:
      summary.degraded++;
      break;
    case HEALTH_STATUS.FAILED:
      summary.failed++;
      break;
    }

    // Count by category
    if (!summary.byCategory[health.category]) {
      summary.byCategory[health.category] = {
        ok: 0,
        degraded: 0,
        failed: 0,
      };
    }

    switch (health.status) {
    case HEALTH_STATUS.HEALTHY:
      summary.byCategory[health.category].ok++;
      break;
    case HEALTH_STATUS.DEGRADED:
      summary.byCategory[health.category].degraded++;
      break;
    case HEALTH_STATUS.FAILED:
      summary.byCategory[health.category].failed++;
      break;
    }
  }

  return summary;
}
