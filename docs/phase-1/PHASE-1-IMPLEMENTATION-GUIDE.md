# Phase 1 Implementation Guide - Incremental Enhancement

**Target:** Transform MerajutASA.id to production-ready without major restructuring  
**Duration:** 4 weeks  
**Approach:** Progressive enhancement of existing architecture

---

## Implementation Strategy Overview

### Core Principle: ADD, Don't REBUILD

```
Current Architecture (PRESERVE):          Enhanced Architecture (ADD):
                                         
[Client] → [Services] → [Storage]        [Client] → [Security Layer] → [Services] → [Storage]
                                                         ↓                  ↓           ↓
                                                    [Monitoring]      [Logging]   [Backup]
```

---

## Phase 1A: Security Foundation (Week 1-2)

### Day 1-3: HTTPS & Reverse Proxy Setup

#### Create infrastructure directory structure

```bash
mkdir -p infrastructure/{reverse-proxy,auth,security}
mkdir -p infrastructure/reverse-proxy/{config,ssl-certs}
```

#### 1. Reverse Proxy Configuration

**File:** `infrastructure/reverse-proxy/nginx.conf`

```nginx
upstream signer_service {
    server 127.0.0.1:4601;
}

upstream chain_service {
    server 127.0.0.1:4602;
}

upstream collector_service {
    server 127.0.0.1:4603;
}

server {
    listen 443 ssl http2;
    server_name localhost;

    ssl_certificate ssl-certs/server.crt;
    ssl_private_key ssl-certs/server.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location /api/signer/ {
        proxy_pass http://signer_service/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/chain/ {
        proxy_pass http://chain_service/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/collector/ {
        proxy_pass http://collector_service/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name localhost;
    return 301 https://$host$request_uri;
}
```

#### 2. SSL Certificate Generation

**File:** `infrastructure/reverse-proxy/generate-certs.sh`

```bash
#!/bin/bash
cd infrastructure/reverse-proxy/ssl-certs/

# Generate self-signed certificate for development
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout server.key \
    -out server.crt \
    -subj "/C=ID/ST=Jakarta/L=Jakarta/O=MerajutASA/CN=localhost"

echo "SSL certificates generated successfully"
```

### Day 4-6: Authentication Middleware

#### 1. JWT Authentication Middleware

**File:** `infrastructure/auth/auth-middleware.js`

```javascript
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('hex');
const API_KEYS = new Set(process.env.API_KEYS?.split(',') || []);

export class AuthMiddleware {
  static generateApiKey() {
    return createHash('sha256').update(randomBytes(32)).digest('hex').slice(0, 32);
  }

  static generateJWT(payload, expiresIn = '24h') {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  }

  static verifyJWT(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  static verifyApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    if (!API_KEYS.has(apiKey)) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    req.apiKey = apiKey;
    next();
  }

  static requireAuth(req, res, next) {
    // Try JWT first, then API key
    if (req.headers.authorization) {
      return AuthMiddleware.verifyJWT(req, res, next);
    } else if (req.headers['x-api-key']) {
      return AuthMiddleware.verifyApiKey(req, res, next);
    } else {
      return res.status(401).json({ error: 'Authentication required' });
    }
  }
}
```

#### 2. Integrate Auth into Existing Services

**File:** `infrastructure/auth/service-enhancer.js`

```javascript
import express from 'express';
import { AuthMiddleware } from './auth-middleware.js';

export function enhanceServiceWithAuth(app, serviceName) {
  // Add authentication to sensitive endpoints
  const sensitiveEndpoints = {
    signer: ['/sign', '/rotate'],
    chain: ['/append'],
    collector: ['/ingest', '/ingest-batch']
  };

  const endpoints = sensitiveEndpoints[serviceName] || [];
  
  endpoints.forEach(endpoint => {
    app.use(endpoint, AuthMiddleware.requireAuth);
  });

  // Add auth status endpoint
  app.get('/auth/status', AuthMiddleware.requireAuth, (req, res) => {
    res.json({ 
      authenticated: true, 
      user: req.user || { apiKey: req.apiKey },
      service: serviceName 
    });
  });

  console.log(`[${serviceName}] Enhanced with authentication for endpoints: ${endpoints.join(', ')}`);
}
```

### Day 7-10: Input Validation & Rate Limiting

#### 1. Input Validation Middleware

**File:** `infrastructure/security/input-validator.js`

```javascript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import rateLimit from 'express-rate-limit';
import { createHash } from 'crypto';

const ajv = new Ajv({ strict: false });
addFormats(ajv);

// Validation schemas for each service
const schemas = {
  signer: {
    sign: {
      type: 'object',
      properties: {
        payload: { type: 'object' }
      },
      required: ['payload'],
      additionalProperties: false
    }
  },
  chain: {
    append: {
      type: 'object',
      properties: {
        canonical: { type: 'string', minLength: 1 },
        signature: { type: 'string', pattern: '^[A-Za-z0-9+/]+=*$' },
        publicKeyPem: { type: 'string', minLength: 100 }
      },
      required: ['canonical', 'signature', 'publicKeyPem'],
      additionalProperties: false
    }
  },
  collector: {
    ingest: {
      type: 'object',
      properties: {
        event_name: { type: 'string', minLength: 1, maxLength: 100 },
        occurred_at: { type: 'string', format: 'date-time' },
        received_at: { type: 'string', format: 'date-time' },
        meta: { type: 'object' }
      },
      required: ['event_name', 'occurred_at'],
      additionalProperties: false
    }
  }
};

export class InputValidator {
  static createValidator(serviceName, endpoint) {
    const schema = schemas[serviceName]?.[endpoint];
    if (!schema) return (req, res, next) => next();

    const validate = ajv.compile(schema);
    
    return (req, res, next) => {
      const valid = validate(req.body);
      if (!valid) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validate.errors
        });
      }
      next();
    };
  }

  static sanitizeInput(req, res, next) {
    // Basic XSS prevention
    const sanitize = (obj) => {
      if (typeof obj === 'string') {
        return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          obj[key] = sanitize(obj[key]);
        }
      }
      return obj;
    };

    if (req.body) {
      req.body = sanitize(req.body);
    }
    next();
  }

  static createRateLimit(windowMs = 15 * 60 * 1000, max = 100) {
    return rateLimit({
      windowMs,
      max,
      message: { error: 'Too many requests, please try again later' },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }
}
```

### Day 11-14: Security Integration & Testing

#### 1. Enhance Existing Services (Minimal Changes)

**Example: Enhanced Signer Service**

```javascript
// Add to beginning of tools/services/signer.js
import { enhanceServiceWithAuth } from '../../infrastructure/auth/service-enhancer.js';
import { InputValidator } from '../../infrastructure/security/input-validator.js';

// After creating the Express app:
app.use(express.json({ limit: '10mb' }));
app.use(InputValidator.sanitizeInput);
app.use(InputValidator.createRateLimit(15 * 60 * 1000, 50)); // 50 requests per 15 minutes

// Enhance with auth
enhanceServiceWithAuth(app, 'signer');

// Add validation to specific endpoints
app.post('/sign', 
  InputValidator.createValidator('signer', 'sign'),
  async (req, res) => {
    // EXISTING LOGIC UNCHANGED
    // ... existing sign implementation
  }
);
```

#### 2. Security Testing Scripts

**File:** `infrastructure/security/security-test.js`

```javascript
#!/usr/bin/env node
/**
 * Basic security testing for enhanced services
 */
import https from 'https';
import { execSync } from 'child_process';

async function testSecurityEnhancements() {
  console.log('[security-test] Testing enhanced security features...');

  const tests = [
    {
      name: 'HTTPS Enforcement',
      test: () => testHttpsRedirect()
    },
    {
      name: 'Authentication Required',
      test: () => testAuthenticationRequired()
    },
    {
      name: 'Input Validation',
      test: () => testInputValidation()
    },
    {
      name: 'Rate Limiting',
      test: () => testRateLimit()
    }
  ];

  for (const test of tests) {
    try {
      await test.test();
      console.log(`✅ ${test.name}`);
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
}

async function testHttpsRedirect() {
  // Test that HTTP redirects to HTTPS
  const response = await fetch('http://localhost/api/signer/pubkey', { redirect: 'manual' });
  if (response.status !== 301) {
    throw new Error('HTTP to HTTPS redirect not working');
  }
}

async function testAuthenticationRequired() {
  // Test that protected endpoints require auth
  const response = await fetch('https://localhost/api/signer/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: {} })
  });
  if (response.status !== 401) {
    throw new Error('Authentication not required for protected endpoint');
  }
}

async function testInputValidation() {
  // Test input validation with invalid data
  const response = await fetch('https://localhost/api/signer/sign', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-api-key': 'test-key'
    },
    body: JSON.stringify({ invalid: 'data' })
  });
  if (response.status !== 400) {
    throw new Error('Input validation not working');
  }
}

async function testRateLimit() {
  // Test rate limiting by making multiple requests
  const promises = Array(20).fill().map(() => 
    fetch('https://localhost/api/signer/pubkey')
  );
  const responses = await Promise.all(promises);
  const rateLimited = responses.some(r => r.status === 429);
  if (!rateLimited) {
    throw new Error('Rate limiting not working');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testSecurityEnhancements();
}
```

---

## Phase 1B: Observability Stack (Week 2-3)

### Day 1-3: Metrics Collection

#### 1. Prometheus Metrics Integration

**File:** `observability/metrics/prometheus-metrics.js`

```javascript
import client from 'prom-client';

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'merajutasa-governance'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Custom metrics for MerajutASA services
export const metrics = {
  // Signer service metrics
  signingDuration: new client.Histogram({
    name: 'signer_signing_duration_seconds',
    help: 'Duration of signing operations',
    labelNames: ['operation', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5]
  }),

  signingTotal: new client.Counter({
    name: 'signer_operations_total',
    help: 'Total number of signing operations',
    labelNames: ['operation', 'status']
  }),

  // Chain service metrics
  chainAppendDuration: new client.Histogram({
    name: 'chain_append_duration_seconds',
    help: 'Duration of chain append operations',
    buckets: [0.01, 0.1, 0.5, 1, 2]
  }),

  chainAppendTotal: new client.Counter({
    name: 'chain_append_total',
    help: 'Total number of chain append operations',
    labelNames: ['status']
  }),

  chainLength: new client.Gauge({
    name: 'chain_length',
    help: 'Current length of the chain'
  }),

  // Collector service metrics
  eventsIngested: new client.Counter({
    name: 'collector_events_ingested_total',
    help: 'Total number of events ingested',
    labelNames: ['event_type', 'status']
  }),

  eventProcessingDuration: new client.Histogram({
    name: 'collector_event_processing_duration_seconds',
    help: 'Duration of event processing',
    labelNames: ['event_type'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1]
  }),

  // Governance metrics
  governanceVerificationDuration: new client.Histogram({
    name: 'governance_verification_duration_seconds',
    help: 'Duration of governance verification',
    buckets: [1, 5, 10, 30, 60]
  }),

  governanceGapsDetected: new client.Gauge({
    name: 'governance_gaps_detected',
    help: 'Number of gaps detected in latest analysis',
    labelNames: ['category', 'severity']
  })
};

// Register all metrics
Object.values(metrics).forEach(metric => register.register(metric));

export { register };

// Metrics server
export function startMetricsServer(port = 9090) {
  const express = require('express');
  const app = express();

  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  app.listen(port, () => {
    console.log(`[metrics] Prometheus metrics server listening on port ${port}`);
  });
}
```

#### 2. Service Enhancement with Metrics

**File:** `observability/metrics/service-metrics-enhancer.js`

```javascript
import { metrics } from './prometheus-metrics.js';

export function enhanceServiceWithMetrics(serviceName) {
  return {
    // Timing decorator for async functions
    timed: (metricName, labels = {}) => {
      return (target, propertyKey, descriptor) => {
        const originalMethod = descriptor.value;

        descriptor.value = async function(...args) {
          const timer = metrics[metricName].startTimer(labels);
          try {
            const result = await originalMethod.apply(this, args);
            timer({ status: 'success' });
            return result;
          } catch (error) {
            timer({ status: 'error' });
            throw error;
          }
        };

        return descriptor;
      };
    },

    // Counter increment
    incrementCounter: (metricName, labels = {}) => {
      metrics[metricName].inc(labels);
    },

    // Gauge setting
    setGauge: (metricName, value, labels = {}) => {
      metrics[metricName].set(labels, value);
    },

    // Manual timer
    startTimer: (metricName, labels = {}) => {
      return metrics[metricName].startTimer(labels);
    }
  };
}
```

### Day 4-6: Structured Logging

#### 1. Structured Logger Implementation

**File:** `observability/logging/structured-logger.js`

```javascript
import winston from 'winston';
import path from 'path';

// Log format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service, operation, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      service,
      operation,
      ...meta
    });
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: process.env.SERVICE_NAME || 'merajutasa-governance',
    version: process.env.npm_package_version || '0.1.2'
  },
  transports: [
    // Console for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File for production
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Service-specific logger factory
export function createServiceLogger(serviceName) {
  return logger.child({ service: serviceName });
}

// Operation logger factory
export function createOperationLogger(serviceName, operation) {
  return logger.child({ service: serviceName, operation });
}

// Enhanced logging methods
export const log = {
  info: (message, meta = {}) => logger.info(message, meta),
  error: (message, error = null, meta = {}) => {
    logger.error(message, { 
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: error.code
      } : null,
      ...meta 
    });
  },
  warn: (message, meta = {}) => logger.warn(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),
  
  // Business operation logging
  operation: {
    start: (operation, meta = {}) => logger.info(`${operation} started`, { operation, ...meta }),
    success: (operation, result = null, meta = {}) => logger.info(`${operation} completed`, { 
      operation, 
      result: result ? { status: 'success', ...result } : { status: 'success' },
      ...meta 
    }),
    error: (operation, error, meta = {}) => logger.error(`${operation} failed`, { 
      operation,
      error: {
        message: error.message,
        stack: error.stack
      },
      ...meta 
    })
  }
};
```

### Day 7-10: Monitoring Dashboard

#### 1. Prometheus Configuration

**File:** `observability/monitoring/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alerting-rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'merajutasa-services'
    static_configs:
      - targets: ['localhost:9090']  # Metrics server
    scrape_interval: 5s
    metrics_path: /metrics

  - job_name: 'signer-service'
    static_configs:
      - targets: ['localhost:4601']
    scrape_interval: 10s

  - job_name: 'chain-service'
    static_configs:
      - targets: ['localhost:4602']
    scrape_interval: 10s

  - job_name: 'collector-service'
    static_configs:
      - targets: ['localhost:4603']
    scrape_interval: 10s
```

#### 2. Grafana Dashboard

**File:** `observability/monitoring/grafana-dashboard.json`

```json
{
  "dashboard": {
    "id": null,
    "title": "MerajutASA Governance Services",
    "tags": ["merajutasa", "governance"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Service Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=~\".*-service\"}",
            "legendFormat": "{{job}}"
          }
        ],
        "gridPos": { "h": 6, "w": 8, "x": 0, "y": 0 }
      },
      {
        "id": 2,
        "title": "Signing Operations Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(signer_operations_total[5m])",
            "legendFormat": "{{operation}}"
          }
        ],
        "gridPos": { "h": 6, "w": 8, "x": 8, "y": 0 }
      },
      {
        "id": 3,
        "title": "Chain Length",
        "type": "stat",
        "targets": [
          {
            "expr": "chain_length",
            "legendFormat": "Chain Length"
          }
        ],
        "gridPos": { "h": 6, "w": 8, "x": 16, "y": 0 }
      },
      {
        "id": 4,
        "title": "Event Ingestion Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(collector_events_ingested_total[5m])",
            "legendFormat": "{{event_type}}"
          }
        ],
        "gridPos": { "h": 6, "w": 12, "x": 0, "y": 6 }
      },
      {
        "id": 5,
        "title": "Response Times",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(signer_signing_duration_seconds_bucket[5m]))",
            "legendFormat": "Signing 95th percentile"
          },
          {
            "expr": "histogram_quantile(0.95, rate(chain_append_duration_seconds_bucket[5m]))",
            "legendFormat": "Chain Append 95th percentile"
          }
        ],
        "gridPos": { "h": 6, "w": 12, "x": 12, "y": 6 }
      }
    ],
    "time": { "from": "now-1h", "to": "now" },
    "refresh": "5s"
  }
}
```

---

## Package.json Enhancements

Add these scripts to support the new infrastructure:

```json
{
  "scripts": {
    "infrastructure:start": "concurrently \"npm run infrastructure:proxy\" \"npm run infrastructure:monitoring\"",
    "infrastructure:proxy": "nginx -c $(pwd)/infrastructure/reverse-proxy/nginx.conf",
    "infrastructure:monitoring": "prometheus --config.file=observability/monitoring/prometheus.yml",
    "infrastructure:certs": "bash infrastructure/reverse-proxy/generate-certs.sh",
    "security:test": "node infrastructure/security/security-test.js",
    "observability:metrics": "node -e \"import('./observability/metrics/prometheus-metrics.js').then(m => m.startMetricsServer())\"",
    "logs:tail": "tail -f logs/combined.log | jq .",
    "backup:create": "node backup/services/backup-service.js --create",
    "backup:restore": "node backup/services/backup-service.js --restore",
    "production:start": "npm run infrastructure:start && concurrently \"npm run service:signer\" \"npm run service:chain\" \"npm run service:collector\"",
    "production:health": "node infrastructure/health/health-check.js"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "express-rate-limit": "^7.1.5",
    "jsonwebtoken": "^9.0.2",
    "winston": "^3.11.0",
    "prom-client": "^15.1.0"
  }
}
```

---

## Testing & Validation

### Daily Testing Checklist

**Day 1-3:**

- [ ] HTTPS termination working
- [ ] HTTP to HTTPS redirect functioning
- [ ] SSL certificates valid
- [ ] Reverse proxy routing correctly

**Day 4-6:**

- [ ] Authentication middleware blocking unauthorized requests
- [ ] JWT token validation working
- [ ] API key validation working
- [ ] Auth endpoints responding correctly

**Day 7-10:**

- [ ] Input validation catching malformed requests
- [ ] Rate limiting preventing abuse
- [ ] XSS protection working
- [ ] Security headers present

**Day 11-14:**

- [ ] All services enhanced with security
- [ ] End-to-end authentication flow
- [ ] Security testing passing
- [ ] Performance impact acceptable

**Week 2-3:**

- [ ] Metrics collection working
- [ ] Structured logging operational
- [ ] Monitoring dashboard displaying data
- [ ] Alerting rules configured

---

## Expected Outcomes

After Phase 1A+1B completion:

### Security Achievements

- ✅ **100% HTTPS enforcement** with proper TLS configuration
- ✅ **Authentication required** for all sensitive operations
- ✅ **Input validation** preventing injection attacks
- ✅ **Rate limiting** preventing abuse and DoS

### Observability Achievements  

- ✅ **Real-time metrics** for all services and operations
- ✅ **Structured logging** for debugging and audit trails
- ✅ **Visual dashboards** showing system health
- ✅ **Alerting** for critical issues

### Architecture Benefits

- ✅ **Existing services preserved** - no major restructuring
- ✅ **Incremental enhancement** - low risk deployment
- ✅ **Production readiness** - meets industry standards
- ✅ **Future-proof foundation** - ready for Phase 2 scaling

This approach demonstrates that **major restructuring is not required** - the existing MerajutASA.id architecture is solid and can be enhanced incrementally to achieve production readiness.
