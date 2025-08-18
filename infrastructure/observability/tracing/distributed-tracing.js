/**
 * MerajutASA.id - Phase 2 Week 3: Distributed Tracing System
 * 
 * Advanced distributed tracing implementation with OpenTelemetry
 * Provides end-to-end request tracking across all microservices
 * 
 * Features:
 * - OpenTelemetry-compatible tracing
 * - Jaeger export for visualization
 * - Service dependency mapping
 * - Performance bottleneck identification
 * - Cross-service correlation
 * 
 * @version 1.0.0
 * @since Phase 2 Week 3
 */

import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { v4 as uuidv4 } from 'uuid';

export class DistributedTracing {
  constructor(config = {}) {
    this.config = {
      serviceName: config.serviceName || 'merajutasa-service',
      serviceVersion: config.serviceVersion || '2.0.0',
      jaegerEndpoint: config.jaegerEndpoint || process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
      environment: config.environment || process.env.NODE_ENV || 'development',
      enableAutoInstrumentation: config.enableAutoInstrumentation !== false,
      ...config
    };
    
    this.tracer = null;
    this.sdk = null;
    this.isInitialized = false;
    this.activeSpans = new Map();
    
    this.initialize();
  }

  /**
   * Initialize the distributed tracing system
   */
  initialize() {
    try {
      // Create resource with service metadata
      const resource = Resource.default().merge(
        new Resource({
          [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
          [SemanticResourceAttributes.SERVICE_VERSION]: this.config.serviceVersion,
          [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.config.environment,
          'service.instance.id': uuidv4(),
          'service.namespace': 'merajutasa.id'
        })
      );

      // Setup Jaeger exporter
      const jaegerExporter = new JaegerExporter({
        endpoint: this.config.jaegerEndpoint,
        headers: {
          'X-Service-Name': this.config.serviceName
        }
      });

      // Create SDK with auto-instrumentation
      this.sdk = new NodeSDK({
        resource,
        spanProcessors: [new BatchSpanProcessor(jaegerExporter)],
        instrumentations: this.config.enableAutoInstrumentation ? [] : undefined
      });

      // Initialize SDK
      this.sdk.start();
      
      // Get tracer instance
      this.tracer = trace.getTracer(this.config.serviceName, this.config.serviceVersion);
      
      this.isInitialized = true;
      console.log(`Distributed tracing initialized for ${this.config.serviceName}`);
      
    } catch (error) {
      console.error('Failed to initialize distributed tracing:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Create a new span for service operation
   */
  async traceServiceCall(operationName, fn, options = {}) {
    if (!this.isInitialized) {
      console.warn('Tracing not initialized, executing without tracing');
      return await fn();
    }

    const spanName = options.spanName || `${this.config.serviceName}.${operationName}`;
    const span = this.tracer.startSpan(spanName, {
      kind: options.kind || SpanKind.SERVER,
      attributes: {
        'operation.name': operationName,
        'service.name': this.config.serviceName,
        'service.version': this.config.serviceVersion,
        'operation.type': options.type || 'business_logic',
        ...options.attributes
      }
    });

    const spanId = uuidv4();
    this.activeSpans.set(spanId, span);

    return context.with(trace.setSpan(context.active(), span), async () => {
      try {
        // Add span to metadata for downstream services
        const spanContext = {
          spanId,
          traceId: span.spanContext().traceId,
          parentSpanId: span.spanContext().spanId
        };

        const result = await fn(span, spanContext);
        
        // Mark span as successful
        span.setStatus({ code: SpanStatusCode.OK });
        
        // Add result metadata if provided
        if (options.recordResult && result) {
          span.setAttributes({
            'operation.result.type': typeof result,
            'operation.result.size': JSON.stringify(result).length
          });
        }

        return result;
        
      } catch (error) {
        // Record error in span
        span.setStatus({ 
          code: SpanStatusCode.ERROR, 
          message: error.message 
        });
        
        span.recordException(error);
        span.setAttributes({
          'error.name': error.name,
          'error.message': error.message,
          'error.stack': error.stack?.substring(0, 1000) // Truncate for performance
        });

        throw error;
        
      } finally {
        span.end();
        this.activeSpans.delete(spanId);
      }
    });
  }

  /**
   * Create a child span for internal operations
   */
  createChildSpan(operationName, options = {}) {
    if (!this.isInitialized) {
      return null;
    }

    const span = this.tracer.startSpan(operationName, {
      parent: trace.getActiveSpan(),
      kind: options.kind || SpanKind.INTERNAL,
      attributes: {
        'operation.name': operationName,
        'span.type': 'child',
        ...options.attributes
      }
    });

    return span;
  }

  /**
   * Trace database operations
   */
  async traceDatabaseOperation(operation, query, fn) {
    return this.traceServiceCall(`db.${operation}`, async (span) => {
      span.setAttributes({
        'db.operation': operation,
        'db.statement': query?.substring(0, 500), // Truncate long queries
        'component': 'database'
      });

      const startTime = Date.now();
      try {
        const result = await fn();
        
        span.setAttributes({
          'db.duration_ms': Date.now() - startTime,
          'db.rows_affected': Array.isArray(result) ? result.length : 1
        });

        return result;
      } catch (error) {
        span.setAttributes({
          'db.error': error.message,
          'db.duration_ms': Date.now() - startTime
        });
        throw error;
      }
    }, { 
      kind: SpanKind.CLIENT,
      type: 'database'
    });
  }

  /**
   * Trace HTTP client requests
   */
  async traceHttpRequest(method, url, fn, options = {}) {
    return this.traceServiceCall(`http.${method.toLowerCase()}`, async (span) => {
      span.setAttributes({
        'http.method': method,
        'http.url': url,
        'http.scheme': new URL(url).protocol.slice(0, -1),
        'http.host': new URL(url).host,
        'component': 'http'
      });

      const startTime = Date.now();
      try {
        const response = await fn();
        
        span.setAttributes({
          'http.status_code': response.status || response.statusCode || 200,
          'http.response_size': response.data ? JSON.stringify(response.data).length : 0,
          'http.duration_ms': Date.now() - startTime
        });

        return response;
      } catch (error) {
        span.setAttributes({
          'http.error': error.message,
          'http.status_code': error.response?.status || 0,
          'http.duration_ms': Date.now() - startTime
        });
        throw error;
      }
    }, { 
      kind: SpanKind.CLIENT,
      type: 'http'
    });
  }

  /**
   * Add custom attributes to current span
   */
  addSpanAttributes(attributes) {
    const currentSpan = trace.getActiveSpan();
    if (currentSpan) {
      currentSpan.setAttributes(attributes);
    }
  }

  /**
   * Add an event to current span
   */
  addSpanEvent(name, attributes = {}) {
    const currentSpan = trace.getActiveSpan();
    if (currentSpan) {
      currentSpan.addEvent(name, {
        timestamp: Date.now(),
        ...attributes
      });
    }
  }

  /**
   * Get current trace and span IDs for correlation
   */
  getCurrentTraceContext() {
    const currentSpan = trace.getActiveSpan();
    if (currentSpan) {
      const spanContext = currentSpan.spanContext();
      return {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
        isValid: spanContext.isValid
      };
    }
    return null;
  }

  /**
   * Create correlation ID for request tracking
   */
  generateCorrelationId() {
    const traceContext = this.getCurrentTraceContext();
    if (traceContext) {
      return `${traceContext.traceId}-${Date.now()}`;
    }
    return uuidv4();
  }

  /**
   * Get service dependency information
   */
  getServiceDependencies() {
    return {
      upstreamServices: [],
      downstreamServices: [
        'signer-service',
        'chain-service', 
        'collector-service',
        'backup-service'
      ],
      databases: ['governance-db', 'chain-db'],
      externalAPIs: ['jaeger-collector']
    };
  }

  /**
   * Health check for tracing system
   */
  async healthCheck() {
    try {
      const isHealthy = this.isInitialized && this.tracer !== null;
      const activeSpanCount = this.activeSpans.size;
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        service: this.config.serviceName,
        activeSpans: activeSpanCount,
        jaegerEndpoint: this.config.jaegerEndpoint,
        autoInstrumentation: this.config.enableAutoInstrumentation,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Gracefully shutdown tracing
   */
  async shutdown() {
    try {
      if (this.sdk) {
        await this.sdk.shutdown();
      }
      this.activeSpans.clear();
      console.log('Distributed tracing shutdown complete');
    } catch (error) {
      console.error('Error during tracing shutdown:', error);
    }
  }
}

// Singleton instance for global use
let globalTracing = null;

/**
 * Get or create global tracing instance
 */
export function getDistributedTracing(config = {}) {
  if (!globalTracing) {
    globalTracing = new DistributedTracing(config);
  }
  return globalTracing;
}

/**
 * Initialize tracing for service
 */
export function initializeTracing(serviceName, options = {}) {
  return getDistributedTracing({
    serviceName,
    ...options
  });
}

export default DistributedTracing;