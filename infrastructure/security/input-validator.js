#!/usr/bin/env node
/**
 * input-validator.js
 * Comprehensive input validation middleware for MerajutASA.id services
 * Implements OWASP input validation and sanitization best practices
 */

import { createHash } from 'crypto';

// Validation rules for different data types
const VALIDATION_RULES = {
  // Hash validation (SHA-256, SHA-512)
  hash: {
    sha256: /^[a-f0-9]{64}$/i,
    sha512: /^[a-f0-9]{128}$/i,
  },

  // Signature validation (Ed25519, base64)
  signature: {
    ed25519: /^[A-Za-z0-9+/]{86}==$/,
    base64: /^[A-Za-z0-9+/]*={0,2}$/,
  },

  // Key validation
  publicKey: {
    ed25519Pem: /^-----BEGIN PUBLIC KEY-----[\s\S]+-----END PUBLIC KEY-----$/,
    ed25519Hex: /^[a-f0-9]{64}$/i,
  },

  // Identifier validation
  id: {
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    alphanumeric: /^[a-zA-Z0-9_-]+$/,
    keyId: /^k-\d+$/,
  },

  // Event validation
  event: {
    name: /^[a-zA-Z][a-zA-Z0-9_]*$/,
    timestamp: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
  },

  // Network validation
  ip: {
    v4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    v6: /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i,
  },

  // URL validation
  url: {
    http: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
    https: /^https:\/\/[^\s/$.?#].[^\s]*$/i,
  },
};

// Dangerous patterns to reject
const DANGEROUS_PATTERNS = [
  // SQL Injection
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i,
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
  /(';\s*(DROP|DELETE|UPDATE|INSERT))/i,

  // XSS - Improved script tag detection to handle malformed tags
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,

  // Command Injection
  /[;&|`$(){}]/,
  /\b(rm|cat|ls|ps|kill|chmod|sudo)\b/i,

  // Path Traversal
  /\.\.[\/\\]/,
  /\/(etc|proc|sys|dev)\//i,

  // NoSQL Injection
  /\$where/gi,
  /\$regex/gi,
  /\$ne/gi,
];

// Size limits for different content types
const SIZE_LIMITS = {
  text: 10000,        // 10KB for text fields
  json: 100000,       // 100KB for JSON payloads
  signature: 1000,    // 1KB for signatures
  hash: 200,          // 200 bytes for hashes
  key: 2000,          // 2KB for public keys
  event: 50000,        // 50KB for events
};

/**
 * Sanitize string input by removing dangerous characters
 */
function sanitizeString(input, options = {}) {
  if (typeof input !== 'string') {return input;}

  let sanitized = input;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Trim whitespace
  if (options.trim !== false) {
    sanitized = sanitized.trim();
  }

  // HTML encode if requested
  if (options.htmlEncode) {
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // Normalize unicode
  sanitized = sanitized.normalize('NFC');

  return sanitized;
}

/**
 * Validate input against dangerous patterns
 */
function checkDangerousPatterns(input) {
  if (typeof input !== 'string') {return null;}

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(input)) {
      return `Dangerous pattern detected: ${pattern.source}`;
    }
  }

  return null;
}

/**
 * Validate string length and size
 */
function validateSize(input, type = 'text') {
  const limit = SIZE_LIMITS[type] || SIZE_LIMITS.text;

  if (typeof input === 'string') {
    const byteLength = Buffer.from(input, 'utf8').length;
    if (byteLength > limit) {
      return `Input too large: ${byteLength} bytes (limit: ${limit})`;
    }
  } else if (input && typeof input === 'object') {
    const jsonSize = JSON.stringify(input).length;
    if (jsonSize > limit) {
      return `JSON too large: ${jsonSize} bytes (limit: ${limit})`;
    }
  }

  return null;
}

/**
 * Validate hash format and integrity
 */
function validateHash(hash, algorithm = 'sha256') {
  if (!hash || typeof hash !== 'string') {
    return 'Hash must be a non-empty string';
  }

  const rule = VALIDATION_RULES.hash[algorithm];
  if (!rule) {
    return `Unsupported hash algorithm: ${algorithm}`;
  }

  if (!rule.test(hash)) {
    return `Invalid ${algorithm} hash format`;
  }

  return null;
}

/**
 * Validate signature format
 */
function validateSignature(signature, algorithm = 'ed25519') {
  if (!signature || typeof signature !== 'string') {
    return 'Signature must be a non-empty string';
  }

  const rule = VALIDATION_RULES.signature[algorithm];
  if (!rule) {
    return `Unsupported signature algorithm: ${algorithm}`;
  }

  if (!rule.test(signature)) {
    return `Invalid ${algorithm} signature format`;
  }

  return null;
}

/**
 * Validate public key format
 */
function validatePublicKey(publicKey, format = 'ed25519Pem') {
  if (!publicKey || typeof publicKey !== 'string') {
    return 'Public key must be a non-empty string';
  }

  const rule = VALIDATION_RULES.publicKey[format];
  if (!rule) {
    return `Unsupported public key format: ${format}`;
  }

  if (!rule.test(publicKey)) {
    return `Invalid ${format} public key format`;
  }

  return null;
}

/**
 * Validate event structure and content
 */
function validateEvent(event) {
  if (!event || typeof event !== 'object') {
    return 'Event must be an object';
  }

  // Required fields
  const requiredFields = ['event_name', 'occurred_at', 'received_at'];
  for (const field of requiredFields) {
    if (!event[field]) {
      return `Missing required field: ${field}`;
    }
  }

  // Validate event name
  if (!VALIDATION_RULES.event.name.test(event.event_name)) {
    return 'Invalid event name format';
  }

  // Validate timestamps
  if (!VALIDATION_RULES.event.timestamp.test(event.occurred_at)) {
    return 'Invalid occurred_at timestamp format';
  }

  if (!VALIDATION_RULES.event.timestamp.test(event.received_at)) {
    return 'Invalid received_at timestamp format';
  }

  // Check timestamp logic
  const occurredTime = new Date(event.occurred_at);
  const receivedTime = new Date(event.received_at);
  const now = new Date();

  if (receivedTime < occurredTime) {
    return 'received_at cannot be before occurred_at';
  }

  if (occurredTime > now) {
    return 'occurred_at cannot be in the future';
  }

  // Validate metadata if present
  if (event.meta && typeof event.meta !== 'object') {
    return 'Event meta must be an object';
  }

  return null;
}

/**
 * Validation schemas for different endpoints
 */
const VALIDATION_SCHEMAS = {
  '/api/signer/sign': {
    method: 'POST',
    body: {
      payload: { required: true, type: 'object', maxSize: 'json' },
    },
  },

  '/api/chain/append': {
    method: 'POST',
    body: {
      canonical: { required: true, type: 'string', maxSize: 'json' },
      signature: { required: true, type: 'string', validator: 'signature' },
      publicKeyPem: { required: true, type: 'string', validator: 'publicKey' },
    },
  },

  '/api/collector/ingest': {
    method: 'POST',
    body: {
      event_name: { required: true, type: 'string', pattern: VALIDATION_RULES.event.name },
      occurred_at: { required: true, type: 'string', pattern: VALIDATION_RULES.event.timestamp },
      received_at: { required: true, type: 'string', pattern: VALIDATION_RULES.event.timestamp },
      meta: { required: false, type: 'object' },
    },
  },

  '/api/revocation/revoke': {
    method: 'POST',
    body: {
      keyId: { required: true, type: 'string', pattern: VALIDATION_RULES.id.keyId },
      reason: { required: true, type: 'string', maxLength: 500 },
    },
  },
};

/**
 * Create validation middleware for specific endpoint
 */
export function createValidationMiddleware(endpoint) {
  const schema = VALIDATION_SCHEMAS[endpoint];

  return function validationMiddleware(req, res, next) {
    try {
      const errors = [];

      // Validate request method
      if (schema && schema.method && req.method !== schema.method) {
        return res.status(405).json({
          error: 'Method not allowed',
          allowed: schema.method,
          actual: req.method,
        });
      }

      // General request validation
      const dangerousCheck = checkDangerousPatterns(req.url);
      if (dangerousCheck) {
        return res.status(400).json({
          error: 'Invalid request',
          message: dangerousCheck,
        });
      }

      // Validate request body size
      if (req.body) {
        const sizeError = validateSize(req.body, 'json');
        if (sizeError) {
          return res.status(413).json({
            error: 'Payload too large',
            message: sizeError,
          });
        }
      }

      // Schema-based validation
      if (schema && schema.body && req.body) {
        for (const [field, rules] of Object.entries(schema.body)) {
          const value = req.body[field];

          // Required field check
          if (rules.required && (value === undefined || value === null)) {
            errors.push(`Missing required field: ${field}`);
            continue;
          }

          // Skip validation for optional missing fields
          if (!rules.required && (value === undefined || value === null)) {
            continue;
          }

          // Type validation
          if (rules.type && typeof value !== rules.type) {
            errors.push(`Field ${field} must be of type ${rules.type}`);
            continue;
          }

          // Pattern validation
          if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
            errors.push(`Field ${field} has invalid format`);
            continue;
          }

          // Custom validator
          if (rules.validator) {
            let validationError = null;

            switch (rules.validator) {
            case 'signature':
              validationError = validateSignature(value);
              break;
            case 'publicKey':
              validationError = validatePublicKey(value);
              break;
            case 'hash':
              validationError = validateHash(value);
              break;
            }

            if (validationError) {
              errors.push(`Field ${field}: ${validationError}`);
            }
          }

          // Length validation
          if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
            errors.push(`Field ${field} exceeds maximum length of ${rules.maxLength}`);
          }

          // Size validation
          if (rules.maxSize) {
            const sizeError = validateSize(value, rules.maxSize);
            if (sizeError) {
              errors.push(`Field ${field}: ${sizeError}`);
            }
          }

          // Dangerous pattern check
          if (typeof value === 'string') {
            const dangerousError = checkDangerousPatterns(value);
            if (dangerousError) {
              errors.push(`Field ${field}: ${dangerousError}`);
            }
          }
        }
      }

      // Special validation for event endpoints
      if (endpoint === '/api/collector/ingest' && req.body) {
        const eventError = validateEvent(req.body);
        if (eventError) {
          errors.push(eventError);
        }
      }

      // Return validation errors
      if (errors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: errors,
          endpoint: endpoint,
        });
      }

      // Sanitize request data
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeRequestData(req.body);
      }

      // Add validation headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Validation-Status', 'passed');

      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      res.status(500).json({
        error: 'Validation error',
        message: 'Internal validation error',
      });
    }
  };
}

/**
 * Recursively sanitize request data
 */
function sanitizeRequestData(data, depth = 0) {
  if (depth > 10) {return data;} // Prevent deep recursion

  if (typeof data === 'string') {
    return sanitizeString(data);
  } else if (Array.isArray(data)) {
    return data.map(item => sanitizeRequestData(item, depth + 1));
  } else if (data && typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeRequestData(value, depth + 1);
    }
    return sanitized;
  }

  return data;
}

/**
 * General purpose validation middleware
 */
export function createGeneralValidationMiddleware() {
  return function generalValidationMiddleware(req, res, next) {
    try {
      // Check for dangerous patterns in URL
      const urlCheck = checkDangerousPatterns(req.url);
      if (urlCheck) {
        return res.status(400).json({
          error: 'Invalid request URL',
          message: 'URL contains dangerous patterns',
        });
      }

      // Validate Content-Type for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
          return res.status(415).json({
            error: 'Unsupported Media Type',
            message: 'Content-Type must be application/json',
          });
        }
      }

      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');

      next();
    } catch (error) {
      console.error('General validation error:', error);
      res.status(500).json({
        error: 'Validation error',
      });
    }
  };
}

export {
  validateHash,
  validateSignature,
  validatePublicKey,
  validateEvent,
  sanitizeString,
  checkDangerousPatterns,
};
