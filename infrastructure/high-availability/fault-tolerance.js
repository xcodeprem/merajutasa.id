/**
 * Fault Tolerance System
 * Advanced circuit breakers, retry mechanisms, and fault isolation
 * Phase 2 Week 5: High Availability & Infrastructure Resilience
 */

import { EventEmitter } from 'events';

export class FaultToleranceSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      // Circuit breaker default settings
      failureThreshold: 5,
      timeoutThreshold: 30000, // 30 seconds
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 30000, // 30 seconds

      // Retry mechanism settings
      maxRetries: 3,
      retryDelay: 1000, // 1 second
      retryBackoffMultiplier: 2,
      maxRetryDelay: 30000, // 30 seconds

      // Bulkhead settings
      maxConcurrentCalls: 100,
      queueSize: 1000,

      // Health check settings
      healthCheckInterval: 10000, // 10 seconds
      healthCheckTimeout: 5000, // 5 seconds

      ...config,
    };

    this.circuitBreakers = new Map();
    this.retryManagers = new Map();
    this.bulkheads = new Map();
    this.healthCheckers = new Map();
    this.faultMetrics = new Map();

    this.initializeFaultTolerance();
  }

  async initializeFaultTolerance() {
    this.startMetricsCollection();
    this.startHealthMonitoring();

    this.emit('fault-tolerance-initialized', {
      circuitBreakers: this.circuitBreakers.size,
      retryManagers: this.retryManagers.size,
      bulkheads: this.bulkheads.size,
    });
  }

  // Circuit Breaker Implementation
  createCircuitBreaker(name, options = {}) {
    const config = { ...this.config, ...options };

    const circuitBreaker = {
      name,
      state: 'closed', // closed, open, half-open
      failureCount: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      callCount: 0,
      successCount: 0,
      config,
      metrics: {
        totalCalls: 0,
        totalFailures: 0,
        totalSuccesses: 0,
        averageResponseTime: 0,
        lastResetTime: Date.now(),
      },
    };

    this.circuitBreakers.set(name, circuitBreaker);
    this.initializeFaultMetrics(name);

    this.emit('circuit-breaker-created', { name, config });
    return circuitBreaker;
  }

  async executeWithCircuitBreaker(breakerName, operation, fallback = null) {
    const breaker = this.circuitBreakers.get(breakerName);

    if (!breaker) {
      throw new Error(`Circuit breaker ${breakerName} not found`);
    }

    const startTime = Date.now();

    // Check circuit breaker state
    this.updateCircuitBreakerState(breaker);

    if (breaker.state === 'open') {
      this.emit('circuit-breaker-rejected', { breakerName, reason: 'Circuit breaker is open' });

      if (fallback) {
        return await this.executeFallback(breakerName, fallback);
      } else {
        throw new Error(`Circuit breaker ${breakerName} is open`);
      }
    }

    try {
      // Execute the operation with timeout
      const result = await this.executeWithTimeout(operation, breaker.config.timeoutThreshold);

      // Record success
      this.recordSuccess(breaker, startTime);

      return result;

    } catch (error) {
      // Record failure
      this.recordFailure(breaker, startTime, error);

      if (fallback) {
        return await this.executeFallback(breakerName, fallback);
      } else {
        throw error;
      }
    }
  }

  updateCircuitBreakerState(breaker) {
    const now = Date.now();

    switch (breaker.state) {
    case 'closed':
      // Check if we should open the circuit
      if (breaker.failureCount >= breaker.config.failureThreshold) {
        breaker.state = 'open';
        breaker.lastFailureTime = now;
        this.emit('circuit-breaker-opened', { name: breaker.name, failureCount: breaker.failureCount });
      }
      break;

    case 'open':
      // Check if we should try half-open
      if (now - breaker.lastFailureTime >= breaker.config.resetTimeout) {
        breaker.state = 'half-open';
        breaker.failureCount = 0;
        this.emit('circuit-breaker-half-opened', { name: breaker.name });
      }
      break;

    case 'half-open':
      // In half-open state, any failure closes the circuit again
      // Success will be handled in recordSuccess
      break;
    }
  }

  recordSuccess(breaker, startTime) {
    const responseTime = Date.now() - startTime;

    breaker.callCount++;
    breaker.successCount++;
    breaker.lastSuccessTime = Date.now();
    breaker.metrics.totalCalls++;
    breaker.metrics.totalSuccesses++;

    // Update average response time
    const totalResponseTime = breaker.metrics.averageResponseTime * (breaker.metrics.totalSuccesses - 1) + responseTime;
    breaker.metrics.averageResponseTime = totalResponseTime / breaker.metrics.totalSuccesses;

    // Reset failure count on success
    if (breaker.state === 'half-open') {
      breaker.state = 'closed';
      breaker.failureCount = 0;
      this.emit('circuit-breaker-closed', { name: breaker.name });
    } else if (breaker.state === 'closed') {
      breaker.failureCount = 0;
    }

    this.updateFaultMetrics(breaker.name, 'success', responseTime);
    this.emit('circuit-breaker-success', { name: breaker.name, responseTime });
  }

  recordFailure(breaker, startTime, error) {
    const responseTime = Date.now() - startTime;

    breaker.callCount++;
    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();
    breaker.metrics.totalCalls++;
    breaker.metrics.totalFailures++;

    this.updateFaultMetrics(breaker.name, 'failure', responseTime, error);
    this.emit('circuit-breaker-failure', { name: breaker.name, error: error.message, responseTime });
  }

  async executeWithTimeout(operation, timeout) {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      try {
        const result = await operation();
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  async executeFallback(breakerName, fallback) {
    try {
      const result = await fallback();
      this.emit('fallback-executed', { breakerName, success: true });
      return result;
    } catch (error) {
      this.emit('fallback-executed', { breakerName, success: false, error: error.message });
      throw error;
    }
  }

  // Retry Mechanism Implementation
  createRetryManager(name, options = {}) {
    const config = { ...this.config, ...options };

    const retryManager = {
      name,
      config,
      metrics: {
        totalAttempts: 0,
        totalRetries: 0,
        totalSuccesses: 0,
        totalFailures: 0,
      },
    };

    this.retryManagers.set(name, retryManager);

    this.emit('retry-manager-created', { name, config });
    return retryManager;
  }

  async executeWithRetry(managerName, operation, isRetriable = () => true) {
    const manager = this.retryManagers.get(managerName);

    if (!manager) {
      throw new Error(`Retry manager ${managerName} not found`);
    }

    let attempt = 0;
    let lastError = null;

    while (attempt <= manager.config.maxRetries) {
      try {
        manager.metrics.totalAttempts++;

        if (attempt > 0) {
          manager.metrics.totalRetries++;
          this.emit('operation-retry', { managerName, attempt, maxRetries: manager.config.maxRetries });
        }

        const result = await operation();

        manager.metrics.totalSuccesses++;
        this.emit('retry-success', { managerName, attempt });

        return result;

      } catch (error) {
        lastError = error;
        attempt++;

        // Check if error is retriable
        if (!isRetriable(error)) {
          this.emit('retry-non-retriable', { managerName, error: error.message });
          break;
        }

        // If this was the last attempt, break
        if (attempt > manager.config.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          manager.config.retryDelay * Math.pow(manager.config.retryBackoffMultiplier, attempt - 1),
          manager.config.maxRetryDelay,
        );

        this.emit('retry-delay', { managerName, attempt, delay });
        await this.sleep(delay);
      }
    }

    manager.metrics.totalFailures++;
    this.emit('retry-exhausted', { managerName, attempts: attempt, error: lastError.message });
    throw lastError;
  }

  // Bulkhead Implementation
  createBulkhead(name, options = {}) {
    const config = { ...this.config, ...options };

    const bulkhead = {
      name,
      config,
      activeCalls: 0,
      queue: [],
      metrics: {
        totalCalls: 0,
        totalRejected: 0,
        totalQueued: 0,
        averageWaitTime: 0,
        maxConcurrentCalls: 0,
      },
    };

    this.bulkheads.set(name, bulkhead);

    this.emit('bulkhead-created', { name, config });
    return bulkhead;
  }

  async executeWithBulkhead(bulkheadName, operation) {
    const bulkhead = this.bulkheads.get(bulkheadName);

    if (!bulkhead) {
      throw new Error(`Bulkhead ${bulkheadName} not found`);
    }

    bulkhead.metrics.totalCalls++;

    // Check if we can execute immediately
    if (bulkhead.activeCalls < bulkhead.config.maxConcurrentCalls) {
      return await this.executeBulkheadOperation(bulkhead, operation);
    }

    // Check if queue has space
    if (bulkhead.queue.length >= bulkhead.config.queueSize) {
      bulkhead.metrics.totalRejected++;
      this.emit('bulkhead-rejected', { bulkheadName, reason: 'Queue full' });
      throw new Error(`Bulkhead ${bulkheadName} queue is full`);
    }

    // Queue the operation
    return await this.queueBulkheadOperation(bulkhead, operation);
  }

  async executeBulkheadOperation(bulkhead, operation) {
    bulkhead.activeCalls++;
    bulkhead.metrics.maxConcurrentCalls = Math.max(
      bulkhead.metrics.maxConcurrentCalls,
      bulkhead.activeCalls,
    );

    const startTime = Date.now();

    try {
      const result = await operation();
      return result;
    } finally {
      bulkhead.activeCalls--;

      // Process next item in queue
      if (bulkhead.queue.length > 0) {
        const nextItem = bulkhead.queue.shift();
        setImmediate(() => this.processBulkheadQueueItem(bulkhead, nextItem));
      }
    }
  }

  async queueBulkheadOperation(bulkhead, operation) {
    const queueItem = {
      operation,
      queueTime: Date.now(),
      resolve: null,
      reject: null,
    };

    const promise = new Promise((resolve, reject) => {
      queueItem.resolve = resolve;
      queueItem.reject = reject;
    });

    bulkhead.queue.push(queueItem);
    bulkhead.metrics.totalQueued++;

    this.emit('bulkhead-queued', { bulkheadName: bulkhead.name, queueSize: bulkhead.queue.length });

    return promise;
  }

  async processBulkheadQueueItem(bulkhead, queueItem) {
    const waitTime = Date.now() - queueItem.queueTime;

    // Update average wait time
    const totalWaitTime = bulkhead.metrics.averageWaitTime * (bulkhead.metrics.totalQueued - 1) + waitTime;
    bulkhead.metrics.averageWaitTime = totalWaitTime / bulkhead.metrics.totalQueued;

    try {
      const result = await this.executeBulkheadOperation(bulkhead, queueItem.operation);
      queueItem.resolve(result);
    } catch (error) {
      queueItem.reject(error);
    }
  }

  // Health Check Implementation
  createHealthChecker(name, healthCheckFunction, options = {}) {
    const config = { ...this.config, ...options };

    const healthChecker = {
      name,
      healthCheckFunction,
      config,
      isHealthy: true,
      lastCheckTime: null,
      lastHealthyTime: Date.now(),
      lastUnhealthyTime: null,
      consecutiveFailures: 0,
      metrics: {
        totalChecks: 0,
        totalFailures: 0,
        totalSuccesses: 0,
        averageResponseTime: 0,
        uptime: 100,
      },
    };

    this.healthCheckers.set(name, healthChecker);
    this.startHealthChecker(healthChecker);

    this.emit('health-checker-created', { name, config });
    return healthChecker;
  }

  startHealthChecker(healthChecker) {
    const checkHealth = async () => {
      const startTime = Date.now();
      healthChecker.metrics.totalChecks++;

      try {
        await this.executeWithTimeout(
          healthChecker.healthCheckFunction,
          healthChecker.config.healthCheckTimeout,
        );

        const responseTime = Date.now() - startTime;

        // Update metrics
        const totalResponseTime = healthChecker.metrics.averageResponseTime *
          (healthChecker.metrics.totalSuccesses) + responseTime;
        healthChecker.metrics.totalSuccesses++;
        healthChecker.metrics.averageResponseTime = totalResponseTime / healthChecker.metrics.totalSuccesses;

        // Update health status
        const wasUnhealthy = !healthChecker.isHealthy;
        healthChecker.isHealthy = true;
        healthChecker.lastCheckTime = Date.now();
        healthChecker.lastHealthyTime = Date.now();
        healthChecker.consecutiveFailures = 0;

        if (wasUnhealthy) {
          this.emit('health-recovered', { name: healthChecker.name });
        }

        this.emit('health-check-success', {
          name: healthChecker.name,
          responseTime,
          consecutiveFailures: 0,
        });

      } catch (error) {
        healthChecker.metrics.totalFailures++;
        healthChecker.consecutiveFailures++;
        healthChecker.lastCheckTime = Date.now();

        const wasHealthy = healthChecker.isHealthy;
        healthChecker.isHealthy = false;
        healthChecker.lastUnhealthyTime = Date.now();

        if (wasHealthy) {
          this.emit('health-degraded', {
            name: healthChecker.name,
            error: error.message,
          });
        }

        this.emit('health-check-failure', {
          name: healthChecker.name,
          error: error.message,
          consecutiveFailures: healthChecker.consecutiveFailures,
        });
      }

      // Update uptime percentage
      const totalChecks = healthChecker.metrics.totalChecks;
      const successfulChecks = healthChecker.metrics.totalSuccesses;
      healthChecker.metrics.uptime = (successfulChecks / totalChecks) * 100;
    };

    // Initial check
    checkHealth();

    // Schedule periodic checks
    const intervalId = setInterval(checkHealth, healthChecker.config.healthCheckInterval);
    healthChecker.intervalId = intervalId;
  }

  // Metrics and Monitoring
  initializeFaultMetrics(name) {
    this.faultMetrics.set(name, {
      name,
      successes: 0,
      failures: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      errorTypes: new Map(),
      lastUpdated: Date.now(),
    });
  }

  updateFaultMetrics(name, type, responseTime, error = null) {
    const metrics = this.faultMetrics.get(name);
    if (!metrics) {return;}

    if (type === 'success') {
      metrics.successes++;
    } else {
      metrics.failures++;

      if (error) {
        const errorType = error.constructor.name || 'UnknownError';
        const count = metrics.errorTypes.get(errorType) || 0;
        metrics.errorTypes.set(errorType, count + 1);
      }
    }

    metrics.totalResponseTime += responseTime;
    const totalCalls = metrics.successes + metrics.failures;
    metrics.averageResponseTime = metrics.totalResponseTime / totalCalls;
    metrics.lastUpdated = Date.now();
  }

  startMetricsCollection() {
    const metricsInterval = setInterval(() => {
      this.collectAndEmitMetrics();
    }, 30000); // Every 30 seconds

    this.metricsInterval = metricsInterval;
  }

  collectAndEmitMetrics() {
    const systemMetrics = {
      timestamp: Date.now(),
      circuitBreakers: this.getCircuitBreakerMetrics(),
      retryManagers: this.getRetryManagerMetrics(),
      bulkheads: this.getBulkheadMetrics(),
      healthCheckers: this.getHealthCheckerMetrics(),
      faultMetrics: Object.fromEntries(this.faultMetrics),
    };

    this.emit('fault-tolerance-metrics', systemMetrics);
  }

  getCircuitBreakerMetrics() {
    const metrics = {};

    for (const [name, breaker] of this.circuitBreakers) {
      metrics[name] = {
        state: breaker.state,
        failureCount: breaker.failureCount,
        successRate: breaker.metrics.totalCalls > 0
          ? (breaker.metrics.totalSuccesses / breaker.metrics.totalCalls) * 100
          : 0,
        averageResponseTime: breaker.metrics.averageResponseTime,
        totalCalls: breaker.metrics.totalCalls,
        totalFailures: breaker.metrics.totalFailures,
        totalSuccesses: breaker.metrics.totalSuccesses,
      };
    }

    return metrics;
  }

  getRetryManagerMetrics() {
    const metrics = {};

    for (const [name, manager] of this.retryManagers) {
      metrics[name] = {
        ...manager.metrics,
        retryRate: manager.metrics.totalAttempts > 0
          ? (manager.metrics.totalRetries / manager.metrics.totalAttempts) * 100
          : 0,
        successRate: manager.metrics.totalAttempts > 0
          ? (manager.metrics.totalSuccesses / manager.metrics.totalAttempts) * 100
          : 0,
      };
    }

    return metrics;
  }

  getBulkheadMetrics() {
    const metrics = {};

    for (const [name, bulkhead] of this.bulkheads) {
      metrics[name] = {
        activeCalls: bulkhead.activeCalls,
        queueSize: bulkhead.queue.length,
        ...bulkhead.metrics,
        rejectionRate: bulkhead.metrics.totalCalls > 0
          ? (bulkhead.metrics.totalRejected / bulkhead.metrics.totalCalls) * 100
          : 0,
      };
    }

    return metrics;
  }

  getHealthCheckerMetrics() {
    const metrics = {};

    for (const [name, checker] of this.healthCheckers) {
      metrics[name] = {
        isHealthy: checker.isHealthy,
        consecutiveFailures: checker.consecutiveFailures,
        lastCheckTime: checker.lastCheckTime,
        ...checker.metrics,
      };
    }

    return metrics;
  }

  startHealthMonitoring() {
    // This method can be extended to add system-wide health monitoring
    // For now, individual health checkers handle their own monitoring
  }

  async getFaultToleranceStatus() {
    const circuitBreakerStates = {};
    for (const [name, breaker] of this.circuitBreakers) {
      circuitBreakerStates[name] = breaker.state;
    }

    const healthStatus = {};
    for (const [name, checker] of this.healthCheckers) {
      healthStatus[name] = {
        isHealthy: checker.isHealthy,
        consecutiveFailures: checker.consecutiveFailures,
        uptime: checker.metrics.uptime,
      };
    }

    return {
      circuitBreakers: {
        total: this.circuitBreakers.size,
        states: circuitBreakerStates,
      },
      retryManagers: {
        total: this.retryManagers.size,
      },
      bulkheads: {
        total: this.bulkheads.size,
      },
      healthCheckers: {
        total: this.healthCheckers.size,
        healthy: Array.from(this.healthCheckers.values()).filter(c => c.isHealthy).length,
        status: healthStatus,
      },
      systemHealth: this.calculateSystemHealth(),
    };
  }

  calculateSystemHealth() {
    const healthCheckers = Array.from(this.healthCheckers.values());
    const openCircuitBreakers = Array.from(this.circuitBreakers.values())
      .filter(b => b.state === 'open').length;

    // If no health checkers are configured, the system is healthy but idle
    if (healthCheckers.length === 0) {
      return openCircuitBreakers === 0 ? 'healthy' : 'degraded';
    }

    const healthyCheckers = healthCheckers.filter(c => c.isHealthy).length;
    const healthPercentage = (healthyCheckers / healthCheckers.length) * 100;

    if (healthPercentage === 100 && openCircuitBreakers === 0) {
      return 'healthy';
    } else if (healthPercentage >= 80 && openCircuitBreakers <= 1) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  async healthCheck() {
    const status = await this.getFaultToleranceStatus();

    return {
      service: 'fault-tolerance',
      status: status.systemHealth,
      circuitBreakers: status.circuitBreakers.total,
      openCircuitBreakers: Object.values(status.circuitBreakers.states)
        .filter(state => state === 'open').length,
      healthCheckers: status.healthCheckers.total,
      healthyComponents: status.healthCheckers.healthy,
      timestamp: Date.now(),
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cleanup
  destroy() {
    if (this.metricsInterval) {clearInterval(this.metricsInterval);}

    for (const [name, checker] of this.healthCheckers) {
      if (checker.intervalId) {clearInterval(checker.intervalId);}
    }
  }
}

// Singleton instance
let faultToleranceInstance = null;

export function getFaultToleranceSystem(config) {
  if (!faultToleranceInstance) {
    faultToleranceInstance = new FaultToleranceSystem(config);
  }
  return faultToleranceInstance;
}

export default { FaultToleranceSystem, getFaultToleranceSystem };
