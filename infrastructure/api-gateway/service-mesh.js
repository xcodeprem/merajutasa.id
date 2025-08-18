import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

/**
 * Service Mesh Integration
 * Provides service discovery, load balancing, circuit breaking,
 * and inter-service communication management
 */
export class ServiceMeshIntegration extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      serviceName: 'unknown-service',
      healthCheckInterval: 30000,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      loadBalancing: 'round-robin', // round-robin, weighted, least-connections
      retryAttempts: 3,
      retryDelay: 1000,
      enableMetrics: true,
      ...config
    };

    this.services = new Map();
    this.circuitBreakers = new Map();
    this.loadBalancers = new Map();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      services: new Map()
    };

    this.healthCheckTimer = null;
    this.startHealthChecking();
  }

  /**
   * Register a service instance
   */
  registerService(serviceName, instance) {
    const serviceInstance = {
      id: `${serviceName}-${Date.now()}`,
      name: serviceName,
      host: instance.host || 'localhost',
      port: instance.port || 3000,
      healthPath: instance.healthPath || '/health',
      weight: instance.weight || 1,
      status: 'unknown',
      lastHealthCheck: null,
      metadata: instance.metadata || {},
      registeredAt: new Date().toISOString()
    };

    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, []);
    }
    
    this.services.get(serviceName).push(serviceInstance);
    
    // Initialize circuit breaker for this service
    if (!this.circuitBreakers.has(serviceName)) {
      this.initializeCircuitBreaker(serviceName);
    }
    
    // Initialize load balancer for this service
    if (!this.loadBalancers.has(serviceName)) {
      this.initializeLoadBalancer(serviceName);
    }
    
    this.emit('serviceRegistered', { serviceName, instance: serviceInstance });
    
    return serviceInstance.id;
  }

  /**
   * Deregister a service instance
   */
  deregisterService(serviceName, instanceId) {
    const instances = this.services.get(serviceName);
    if (instances) {
      const index = instances.findIndex(i => i.id === instanceId);
      if (index !== -1) {
        const removed = instances.splice(index, 1)[0];
        this.emit('serviceDeregistered', { serviceName, instance: removed });
        return true;
      }
    }
    return false;
  }

  /**
   * Discover and select a healthy service instance
   */
  discoverService(serviceName) {
    const instances = this.services.get(serviceName);
    if (!instances || instances.length === 0) {
      throw new Error(`No instances found for service: ${serviceName}`);
    }

    // Filter healthy instances
    const healthyInstances = instances.filter(i => i.status === 'healthy');
    if (healthyInstances.length === 0) {
      throw new Error(`No healthy instances found for service: ${serviceName}`);
    }

    // Use load balancer to select instance
    const loadBalancer = this.loadBalancers.get(serviceName);
    return loadBalancer.selectInstance(healthyInstances);
  }

  /**
   * Make a service call with circuit breaker protection
   */
  async callService(serviceName, callFunction, options = {}) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    
    if (circuitBreaker && circuitBreaker.state === 'open') {
      throw new Error(`Circuit breaker is open for service: ${serviceName}`);
    }

    const startTime = performance.now();
    let attempt = 0;
    const maxAttempts = options.retryAttempts || this.config.retryAttempts;

    while (attempt < maxAttempts) {
      try {
        const instance = this.discoverService(serviceName);
        const result = await callFunction(instance);
        
        // Record success
        this.recordServiceCall(serviceName, true, performance.now() - startTime);
        if (circuitBreaker) {
          circuitBreaker.recordSuccess();
        }
        
        return result;
      } catch (error) {
        attempt++;
        
        // Record failure
        this.recordServiceCall(serviceName, false, performance.now() - startTime);
        if (circuitBreaker) {
          circuitBreaker.recordFailure();
        }
        
        if (attempt >= maxAttempts) {
          throw error;
        }
        
        // Wait before retry
        await this.delay(options.retryDelay || this.config.retryDelay);
      }
    }
  }

  initializeCircuitBreaker(serviceName) {
    const circuitBreaker = {
      state: 'closed', // closed, open, half-open
      failureCount: 0,
      lastFailureTime: null,
      successCount: 0,
      
      recordSuccess: function() {
        this.successCount++;
        if (this.state === 'half-open' && this.successCount >= 3) {
          this.state = 'closed';
          this.failureCount = 0;
        }
      },
      
      recordFailure: function() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        
        if (this.failureCount >= this.threshold) {
          this.state = 'open';
        }
      },
      
      canAttempt: function() {
        if (this.state === 'closed') return true;
        if (this.state === 'open') {
          if (Date.now() - this.lastFailureTime > this.timeout) {
            this.state = 'half-open';
            this.successCount = 0;
            return true;
          }
          return false;
        }
        return this.state === 'half-open';
      },
      
      threshold: this.config.circuitBreakerThreshold,
      timeout: this.config.circuitBreakerTimeout
    };

    this.circuitBreakers.set(serviceName, circuitBreaker);
  }

  initializeLoadBalancer(serviceName) {
    const loadBalancer = {
      strategy: this.config.loadBalancing,
      currentIndex: 0,
      
      selectInstance: function(instances) {
        if (instances.length === 0) return null;
        
        switch (this.strategy) {
          case 'round-robin':
            const instance = instances[this.currentIndex % instances.length];
            this.currentIndex++;
            return instance;
            
          case 'weighted':
            return this.selectWeighted(instances);
            
          case 'least-connections':
            return this.selectLeastConnections(instances);
            
          default:
            return instances[0];
        }
      },
      
      selectWeighted: function(instances) {
        const totalWeight = instances.reduce((sum, i) => sum + i.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const instance of instances) {
          random -= instance.weight;
          if (random <= 0) {
            return instance;
          }
        }
        
        return instances[0];
      },
      
      selectLeastConnections: function(instances) {
        // For simplicity, return the first instance
        // In a real implementation, this would track active connections
        return instances.reduce((least, current) => 
          (current.connections || 0) < (least.connections || 0) ? current : least
        );
      }
    };

    this.loadBalancers.set(serviceName, loadBalancer);
  }

  startHealthChecking() {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  async performHealthChecks() {
    for (const [serviceName, instances] of this.services) {
      for (const instance of instances) {
        try {
          const isHealthy = await this.checkInstanceHealth(instance);
          const previousStatus = instance.status;
          instance.status = isHealthy ? 'healthy' : 'unhealthy';
          instance.lastHealthCheck = new Date().toISOString();
          
          if (previousStatus !== instance.status) {
            this.emit('serviceStatusChanged', {
              serviceName,
              instance,
              previousStatus,
              currentStatus: instance.status
            });
          }
        } catch (error) {
          instance.status = 'unhealthy';
          instance.lastHealthCheck = new Date().toISOString();
        }
      }
    }
  }

  async checkInstanceHealth(instance) {
    try {
      // Simulate health check - in real implementation, make HTTP request
      const response = await fetch(`http://${instance.host}:${instance.port}${instance.healthPath}`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  recordServiceCall(serviceName, success, latency) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average latency
    this.metrics.averageLatency = (
      (this.metrics.averageLatency * (this.metrics.totalRequests - 1) + latency) / 
      this.metrics.totalRequests
    );

    // Update service-specific metrics
    if (!this.metrics.services.has(serviceName)) {
      this.metrics.services.set(serviceName, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0
      });
    }

    const serviceMetrics = this.metrics.services.get(serviceName);
    serviceMetrics.totalRequests++;
    
    if (success) {
      serviceMetrics.successfulRequests++;
    } else {
      serviceMetrics.failedRequests++;
    }

    serviceMetrics.averageLatency = (
      (serviceMetrics.averageLatency * (serviceMetrics.totalRequests - 1) + latency) / 
      serviceMetrics.totalRequests
    );
  }

  getServiceTopology() {
    const topology = {
      services: [],
      connections: [],
      circuitBreakers: {},
      loadBalancers: {}
    };

    for (const [serviceName, instances] of this.services) {
      topology.services.push({
        name: serviceName,
        instances: instances.map(i => ({
          id: i.id,
          host: i.host,
          port: i.port,
          status: i.status,
          weight: i.weight,
          lastHealthCheck: i.lastHealthCheck
        }))
      });

      const circuitBreaker = this.circuitBreakers.get(serviceName);
      if (circuitBreaker) {
        topology.circuitBreakers[serviceName] = {
          state: circuitBreaker.state,
          failureCount: circuitBreaker.failureCount,
          successCount: circuitBreaker.successCount
        };
      }

      const loadBalancer = this.loadBalancers.get(serviceName);
      if (loadBalancer) {
        topology.loadBalancers[serviceName] = {
          strategy: loadBalancer.strategy,
          currentIndex: loadBalancer.currentIndex
        };
      }
    }

    return topology;
  }

  getMetrics() {
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
      : 0;

    return {
      overview: {
        totalRequests: this.metrics.totalRequests,
        successfulRequests: this.metrics.successfulRequests,
        failedRequests: this.metrics.failedRequests,
        successRate: Math.round(successRate * 100) / 100,
        averageLatency: Math.round(this.metrics.averageLatency * 100) / 100
      },
      services: Object.fromEntries(
        Array.from(this.metrics.services.entries()).map(([name, metrics]) => [
          name,
          {
            ...metrics,
            successRate: metrics.totalRequests > 0 
              ? Math.round((metrics.successfulRequests / metrics.totalRequests) * 10000) / 100
              : 0,
            averageLatency: Math.round(metrics.averageLatency * 100) / 100
          }
        ])
      ),
      timestamp: new Date().toISOString()
    };
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async healthCheck() {
    const totalServices = this.services.size;
    const healthyServices = Array.from(this.services.values())
      .filter(instances => instances.some(i => i.status === 'healthy')).length;

    return {
      status: healthyServices === totalServices ? 'healthy' : 'degraded',
      totalServices,
      healthyServices,
      circuitBreakers: Object.fromEntries(
        Array.from(this.circuitBreakers.entries()).map(([name, cb]) => [name, cb.state])
      ),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  async stop() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    this.emit('serviceMeshStopped');
  }
}

/**
 * Factory function for Service Mesh
 */
export function createServiceMesh(config = {}) {
  return new ServiceMeshIntegration(config);
}

/**
 * Default instance getter
 */
let defaultServiceMesh = null;

export function getServiceMesh(config = {}) {
  if (!defaultServiceMesh) {
    defaultServiceMesh = new ServiceMeshIntegration(config);
  }
  return defaultServiceMesh;
}