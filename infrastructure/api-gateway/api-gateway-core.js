import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { performance } from 'perf_hooks';

/**
 * Enterprise API Gateway Core
 * Provides centralized API management with versioning, rate limiting, 
 * security, monitoring, and service orchestration
 */
export class APIGatewayCore {
  constructor(config = {}) {
    this.config = {
      port: 8080,
      name: 'merajutasa-api-gateway',
      version: '1.0.0',
      enableMetrics: true,
      enableTracing: true,
      enableCompression: true,
      cors: {
        origin: ['http://localhost:3000', 'https://merajutasa.id'],
        credentials: true
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // requests per windowMs
        skipSuccessfulRequests: false
      },
      ...config
    };

    this.app = express();
    this.services = new Map();
    this.middlewares = new Map();
    this.metrics = {
      requests: 0,
      errors: 0,
      latency: [],
      uptime: Date.now()
    };

    this.setupCore();
    this.setupRouting();
  }

  /**
   * Register a microservice with the gateway
   */
  registerService(name, config) {
    const serviceConfig = {
      host: 'localhost',
      port: 3000,
      version: 'v1',
      healthPath: '/health',
      timeout: 30000,
      retries: 3,
      circuitBreaker: {
        threshold: 5,
        timeout: 60000
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 500
      },
      ...config
    };

    this.services.set(name, serviceConfig);
    this.setupServiceProxy(name, serviceConfig);
    
    return this;
  }

  setupCore() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors(this.config.cors));

    // Compression
    if (this.config.enableCompression) {
      this.app.use(compression());
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID and timing
    this.app.use(this.requestMetadata);

    // Global rate limiting
    this.app.use(rateLimit({
      ...this.config.rateLimit,
      keyGenerator: (req) => {
        const ip = ipKeyGenerator(req);
        return ip + ':' + (req.headers['x-api-key'] || 'anonymous');
      },
      message: {
        error: 'Too many requests',
        retryAfter: Math.ceil(this.config.rateLimit.windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false
    }));

    // Request logging
    this.app.use(this.requestLogging);
  }

  requestMetadata = (req, res, next) => {
    req.requestId = uuidv4();
    req.startTime = performance.now();
    
    res.setHeader('X-Request-ID', req.requestId);
    res.setHeader('X-Gateway-Version', this.config.version);
    res.setHeader('X-Gateway-Name', this.config.name);
    
    next();
  };

  requestLogging = (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      const endTime = performance.now();
      const duration = endTime - req.startTime;
      
      // Update metrics
      this.updateMetrics(req, res, duration);
      
      // Log request
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: Math.round(duration * 100) / 100,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        service: req.targetService || 'gateway'
      }));
      
      originalSend.call(this, data);
    }.bind(this);
    
    next();
  };

  updateMetrics(req, res, duration) {
    this.metrics.requests++;
    this.metrics.latency.push(duration);
    
    // Keep latency array manageable
    if (this.metrics.latency.length > 1000) {
      this.metrics.latency = this.metrics.latency.slice(-500);
    }
    
    if (res.statusCode >= 400) {
      this.metrics.errors++;
    }
  }

  setupServiceProxy(serviceName, config) {
    const proxyOptions = {
      target: `http://${config.host}:${config.port}`,
      changeOrigin: true,
      timeout: config.timeout,
      pathRewrite: {
        [`^/api/${config.version}/${serviceName}`]: '/'
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add gateway metadata
        proxyReq.setHeader('X-Gateway-Request-ID', req.requestId);
        proxyReq.setHeader('X-Service-Name', serviceName);
        proxyReq.setHeader('X-API-Version', config.version);
        proxyReq.setHeader('X-Gateway-Name', this.config.name);
        
        req.targetService = serviceName;
      },
      onProxyRes: (proxyRes, req, res) => {
        // Add response metadata
        proxyRes.headers['X-Service-Name'] = serviceName;
        proxyRes.headers['X-API-Version'] = config.version;
        proxyRes.headers['X-Proxied-By'] = this.config.name;
      },
      onError: (err, req, res) => {
        console.error(`Proxy error for ${serviceName}:`, {
          error: err.message,
          requestId: req.requestId,
          url: req.url
        });
        
        res.status(502).json({
          error: 'Service temporarily unavailable',
          requestId: req.requestId,
          service: serviceName
        });
      }
    };

    // Service-specific rate limiting
    const serviceLimiter = rateLimit({
      ...config.rateLimit,
      keyGenerator: (req) => {
        const ip = ipKeyGenerator(req);
        return `${serviceName}:${ip}:${req.headers['x-api-key'] || 'anon'}`;
      },
      message: {
        error: `Rate limit exceeded for ${serviceName}`,
        service: serviceName
      }
    });

    this.app.use(
      `/api/${config.version}/${serviceName}`,
      serviceLimiter,
      createProxyMiddleware(proxyOptions)
    );
  }

  setupRouting() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const health = this.getHealthStatus();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });

    // Metrics endpoint
    this.app.get('/metrics', (req, res) => {
      res.json(this.getMetrics());
    });

    // Service discovery
    this.app.get('/services', (req, res) => {
      const services = Array.from(this.services.entries()).map(([name, config]) => ({
        name,
        version: config.version,
        endpoint: `/api/${config.version}/${name}`,
        health: config.healthPath
      }));
      
      res.json({ services });
    });

    // OpenAPI documentation
    this.app.get('/docs', (req, res) => {
      res.json(this.generateOpenAPISpec());
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        requestId: req.requestId,
        availableServices: Array.from(this.services.keys())
      });
    });

    // Global error handler
    this.app.use((err, req, res, next) => {
      console.error('Gateway error:', {
        error: err.message,
        stack: err.stack,
        requestId: req.requestId
      });
      
      res.status(500).json({
        error: 'Internal gateway error',
        requestId: req.requestId
      });
    });
  }

  getHealthStatus() {
    const uptime = Date.now() - this.metrics.uptime;
    const avgLatency = this.metrics.latency.length > 0 
      ? this.metrics.latency.reduce((a, b) => a + b, 0) / this.metrics.latency.length 
      : 0;
    
    const errorRate = this.metrics.requests > 0 
      ? (this.metrics.errors / this.metrics.requests) * 100 
      : 0;

    const status = errorRate < 5 && avgLatency < 1000 ? 'healthy' : 'degraded';

    return {
      status,
      version: this.config.version,
      uptime: uptime,
      metrics: {
        requests: this.metrics.requests,
        errors: this.metrics.errors,
        errorRate: Math.round(errorRate * 100) / 100,
        avgLatency: Math.round(avgLatency * 100) / 100
      },
      services: Array.from(this.services.keys()),
      timestamp: new Date().toISOString()
    };
  }

  getMetrics() {
    const uptime = Date.now() - this.metrics.uptime;
    const avgLatency = this.metrics.latency.length > 0 
      ? this.metrics.latency.reduce((a, b) => a + b, 0) / this.metrics.latency.length 
      : 0;

    return {
      gateway: {
        name: this.config.name,
        version: this.config.version,
        uptime: uptime,
        requests: this.metrics.requests,
        errors: this.metrics.errors,
        errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0,
        avgLatency: avgLatency,
        p95Latency: this.calculatePercentile(this.metrics.latency, 95),
        p99Latency: this.calculatePercentile(this.metrics.latency, 99)
      },
      services: Object.fromEntries(this.services),
      timestamp: new Date().toISOString()
    };
  }

  calculatePercentile(arr, percentile) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  generateOpenAPISpec() {
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'MerajutASA.id API Gateway',
        version: this.config.version,
        description: 'Enterprise API Gateway for MerajutASA.id microservices'
      },
      servers: [
        { url: `http://localhost:${this.config.port}`, description: 'Development' },
        { url: 'https://api.merajutasa.id', description: 'Production' }
      ],
      paths: {
        '/health': {
          get: {
            summary: 'Gateway health check',
            responses: {
              '200': { description: 'Gateway is healthy' },
              '503': { description: 'Gateway is degraded' }
            }
          }
        },
        '/metrics': {
          get: {
            summary: 'Gateway metrics',
            responses: {
              '200': { description: 'Current gateway metrics' }
            }
          }
        },
        '/services': {
          get: {
            summary: 'Available services',
            responses: {
              '200': { description: 'List of registered services' }
            }
          }
        }
      }
    };

    // Add service paths
    for (const [name, config] of this.services) {
      spec.paths[`/api/${config.version}/${name}`] = {
        get: {
          summary: `${name} service endpoints`,
          description: `Proxy to ${name} microservice`,
          responses: {
            '200': { description: 'Success' },
            '502': { description: 'Service unavailable' }
          }
        }
      };
    }

    return spec;
  }

  async start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, () => {
          console.log(`🚪 API Gateway running on port ${this.config.port}`);
          console.log(`📊 Metrics: http://localhost:${this.config.port}/metrics`);
          console.log(`🏥 Health: http://localhost:${this.config.port}/health`);
          console.log(`📚 Docs: http://localhost:${this.config.port}/docs`);
          resolve(this);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('API Gateway stopped');
          resolve();
        });
      });
    }
  }
}

/**
 * Factory function for API Gateway
 */
export function createAPIGateway(config = {}) {
  return new APIGatewayCore(config);
}

/**
 * Default instance getter
 */
let defaultGateway = null;

export function getAPIGateway(config = {}) {
  if (!defaultGateway) {
    defaultGateway = new APIGatewayCore(config);
  }
  return defaultGateway;
}