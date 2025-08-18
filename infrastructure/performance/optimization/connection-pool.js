/**
 * Connection Pool Manager for Phase 2 Week 2 Performance Enhancement
 * Provides intelligent connection pooling with resource optimization
 */

import EventEmitter from 'events';

export class ConnectionPoolManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Pool configuration
      minConnections: options.minConnections || 2,
      maxConnections: options.maxConnections || 20,
      acquireTimeoutMillis: options.acquireTimeoutMillis || 10000,
      idleTimeoutMillis: options.idleTimeoutMillis || 30000,
      
      // Health check settings
      enableHealthCheck: options.enableHealthCheck !== false,
      healthCheckInterval: options.healthCheckInterval || 60000,
      maxHealthCheckFailures: options.maxHealthCheckFailures || 3,
      
      // Resource optimization
      enableConnectionRecycling: options.enableConnectionRecycling !== false,
      recycleInterval: options.recycleInterval || 300000, // 5 minutes
      maxConnectionAge: options.maxConnectionAge || 3600000, // 1 hour
      
      // Performance monitoring
      enableMetrics: options.enableMetrics !== false,
      metricsWindow: options.metricsWindow || 300000, // 5 minutes
      
      ...options
    };

    // Pool state
    this.pools = new Map(); // service -> pool mapping
    this.connectionFactories = new Map(); // service -> factory mapping
    this.poolStats = new Map(); // service -> stats mapping
    
    // Timers
    this.healthCheckTimer = null;
    this.recycleTimer = null;
    this.metricsTimer = null;
    
    // Global statistics
    this.globalStats = {
      totalConnections: 0,
      activeConnections: 0,
      pooledConnections: 0,
      totalAcquisitions: 0,
      totalReleases: 0,
      totalTimeouts: 0,
      totalErrors: 0,
      averageAcquisitionTime: 0
    };

    this.initialize();
  }

  async initialize() {
    console.log('🔗 Initializing Connection Pool Manager...');
    
    if (this.config.enableHealthCheck) {
      this.startHealthChecks();
    }
    
    if (this.config.enableConnectionRecycling) {
      this.startConnectionRecycling();
    }
    
    if (this.config.enableMetrics) {
      this.startMetricsCollection();
    }
    
    console.log('✅ Connection Pool Manager initialized successfully');
  }

  // Register a connection factory for a service
  registerConnectionFactory(service, factory) {
    if (typeof factory !== 'function') {
      throw new Error('Connection factory must be a function');
    }
    
    this.connectionFactories.set(service, factory);
    
    // Initialize pool for this service
    this.pools.set(service, {
      available: [],
      active: new Set(),
      pending: [],
      creating: 0
    });
    
    // Initialize stats for this service
    this.poolStats.set(service, {
      created: 0,
      destroyed: 0,
      acquired: 0,
      released: 0,
      timeouts: 0,
      errors: 0,
      healthCheckFailures: 0,
      averageAcquisitionTime: 0,
      lastHealthCheck: null
    });
    
    console.log(`📊 Registered connection factory for service: ${service}`);
  }

  // Acquire a connection from the pool
  async acquireConnection(service, timeout = this.config.acquireTimeoutMillis) {
    if (!this.connectionFactories.has(service)) {
      throw new Error(`No connection factory registered for service: ${service}`);
    }

    const startTime = Date.now();
    const pool = this.pools.get(service);
    const stats = this.poolStats.get(service);

    try {
      // Check if we have available connections
      if (pool.available.length > 0) {
        const connection = pool.available.pop();
        pool.active.add(connection);
        
        // Update statistics
        stats.acquired++;
        const acquisitionTime = Date.now() - startTime;
        stats.averageAcquisitionTime = 
          (stats.averageAcquisitionTime * (stats.acquired - 1) + acquisitionTime) / stats.acquired;
        
        this.emit('connection:acquired', { service, connectionId: connection.id, acquisitionTime });
        return connection;
      }

      // Check if we can create more connections
      const totalConnections = pool.active.size + pool.available.length + pool.creating;
      if (totalConnections < this.config.maxConnections) {
        return await this.createConnection(service, startTime);
      }

      // Wait for a connection to become available
      return await this.waitForConnection(service, timeout, startTime);
      
    } catch (error) {
      stats.errors++;
      this.globalStats.totalErrors++;
      
      if (error.name === 'TimeoutError') {
        stats.timeouts++;
        this.globalStats.totalTimeouts++;
      }
      
      throw error;
    }
  }

  // Create a new connection
  async createConnection(service, startTime) {
    const pool = this.pools.get(service);
    const stats = this.poolStats.get(service);
    const factory = this.connectionFactories.get(service);

    pool.creating++;
    
    try {
      const connection = await factory();
      
      // Add metadata to connection
      connection.id = `${service}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      connection.service = service;
      connection.createdAt = Date.now();
      connection.lastUsed = Date.now();
      connection.healthCheckFailures = 0;
      
      // Add to active pool
      pool.active.add(connection);
      pool.creating--;
      
      // Update statistics
      stats.created++;
      stats.acquired++;
      this.globalStats.totalConnections++;
      this.globalStats.activeConnections++;
      
      const acquisitionTime = Date.now() - startTime;
      stats.averageAcquisitionTime = 
        (stats.averageAcquisitionTime * (stats.acquired - 1) + acquisitionTime) / stats.acquired;
      
      this.emit('connection:created', { service, connectionId: connection.id });
      this.emit('connection:acquired', { service, connectionId: connection.id, acquisitionTime });
      
      return connection;
      
    } catch (error) {
      pool.creating--;
      throw error;
    }
  }

  // Wait for an available connection
  async waitForConnection(service, timeout, startTime) {
    const pool = this.pools.get(service);
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        // Remove from pending queue
        const index = pool.pending.findIndex(p => p.resolve === resolve);
        if (index !== -1) {
          pool.pending.splice(index, 1);
        }
        
        reject(new Error(`Connection acquisition timeout after ${timeout}ms for service: ${service}`));
      }, timeout);

      // Add to pending queue
      pool.pending.push({
        resolve: (connection) => {
          clearTimeout(timeoutId);
          resolve(connection);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        service,
        startTime
      });
    });
  }

  // Release a connection back to the pool
  async releaseConnection(connection) {
    const service = connection.service;
    const pool = this.pools.get(service);
    const stats = this.poolStats.get(service);

    if (!pool.active.has(connection)) {
      console.warn(`⚠️ Attempting to release connection not in active pool: ${connection.id}`);
      return;
    }

    // Remove from active pool
    pool.active.delete(connection);
    connection.lastUsed = Date.now();
    
    // Update statistics
    stats.released++;
    this.globalStats.totalReleases++;
    this.globalStats.activeConnections--;

    // Check if there are pending requests
    if (pool.pending.length > 0) {
      const pending = pool.pending.shift();
      pool.active.add(connection);
      
      // Update pending request statistics
      const acquisitionTime = Date.now() - pending.startTime;
      stats.averageAcquisitionTime = 
        (stats.averageAcquisitionTime * stats.acquired + acquisitionTime) / (stats.acquired + 1);
      stats.acquired++;
      
      this.emit('connection:acquired', { 
        service: pending.service, 
        connectionId: connection.id, 
        acquisitionTime 
      });
      
      pending.resolve(connection);
      return;
    }

    // Check pool size and connection health
    if (pool.available.length >= this.config.minConnections || 
        this.shouldRecycleConnection(connection)) {
      // Destroy excess or unhealthy connections
      await this.destroyConnection(connection);
    } else {
      // Return to available pool
      pool.available.push(connection);
      this.globalStats.pooledConnections++;
      
      this.emit('connection:released', { service, connectionId: connection.id });
    }
  }

  // Destroy a connection
  async destroyConnection(connection) {
    const service = connection.service;
    const pool = this.pools.get(service);
    const stats = this.poolStats.get(service);

    try {
      // Remove from all pools
      pool.active.delete(connection);
      const availableIndex = pool.available.indexOf(connection);
      if (availableIndex !== -1) {
        pool.available.splice(availableIndex, 1);
        this.globalStats.pooledConnections--;
      }

      // Call connection cleanup if available
      if (typeof connection.destroy === 'function') {
        await connection.destroy();
      } else if (typeof connection.close === 'function') {
        await connection.close();
      } else if (typeof connection.end === 'function') {
        await connection.end();
      }

      // Update statistics
      stats.destroyed++;
      this.globalStats.totalConnections--;
      
      this.emit('connection:destroyed', { service, connectionId: connection.id });
      
    } catch (error) {
      console.error(`Error destroying connection ${connection.id}:`, error.message);
    }
  }

  // Check if connection should be recycled
  shouldRecycleConnection(connection) {
    const age = Date.now() - connection.createdAt;
    const idle = Date.now() - connection.lastUsed;
    
    return age > this.config.maxConnectionAge || 
           idle > this.config.idleTimeoutMillis ||
           connection.healthCheckFailures >= this.config.maxHealthCheckFailures;
  }

  // Health check for connections
  async performHealthCheck(connection) {
    try {
      // Default health check - can be overridden by connection-specific logic
      if (typeof connection.ping === 'function') {
        await connection.ping();
      } else if (typeof connection.query === 'function') {
        await connection.query('SELECT 1');
      } else if (typeof connection.healthCheck === 'function') {
        await connection.healthCheck();
      }
      
      connection.healthCheckFailures = 0;
      return true;
    } catch (error) {
      connection.healthCheckFailures++;
      console.warn(`Health check failed for connection ${connection.id}:`, error.message);
      return false;
    }
  }

  // Start health check timer
  startHealthChecks() {
    this.healthCheckTimer = setInterval(async () => {
      for (const [service, pool] of this.pools) {
        const stats = this.poolStats.get(service);
        stats.lastHealthCheck = new Date().toISOString();
        
        // Check available connections
        const unhealthyConnections = [];
        for (const connection of pool.available) {
          const isHealthy = await this.performHealthCheck(connection);
          if (!isHealthy) {
            unhealthyConnections.push(connection);
          }
        }
        
        // Remove unhealthy connections
        for (const connection of unhealthyConnections) {
          await this.destroyConnection(connection);
        }
      }
    }, this.config.healthCheckInterval);
  }

  // Start connection recycling timer
  startConnectionRecycling() {
    this.recycleTimer = setInterval(async () => {
      for (const [service, pool] of this.pools) {
        const connectionsToRecycle = [];
        
        // Check available connections for recycling
        for (const connection of pool.available) {
          if (this.shouldRecycleConnection(connection)) {
            connectionsToRecycle.push(connection);
          }
        }
        
        // Recycle old connections
        for (const connection of connectionsToRecycle) {
          await this.destroyConnection(connection);
        }
      }
    }, this.config.recycleInterval);
  }

  // Start metrics collection
  startMetricsCollection() {
    this.metricsTimer = setInterval(() => {
      this.updateGlobalStats();
      this.emit('metrics:updated', this.getMetrics());
    }, this.config.metricsWindow);
  }

  // Update global statistics
  updateGlobalStats() {
    let totalActive = 0;
    let totalPooled = 0;
    
    for (const [service, pool] of this.pools) {
      totalActive += pool.active.size;
      totalPooled += pool.available.length;
    }
    
    this.globalStats.activeConnections = totalActive;
    this.globalStats.pooledConnections = totalPooled;
  }

  // Get comprehensive metrics
  getMetrics() {
    const serviceMetrics = {};
    
    for (const [service, stats] of this.poolStats) {
      const pool = this.pools.get(service);
      serviceMetrics[service] = {
        ...stats,
        pool: {
          active: pool.active.size,
          available: pool.available.length,
          pending: pool.pending.length,
          creating: pool.creating
        }
      };
    }
    
    return {
      global: this.globalStats,
      services: serviceMetrics,
      timestamp: new Date().toISOString()
    };
  }

  // Health check for the pool manager
  async healthCheck() {
    const metrics = this.getMetrics();
    const totalConnections = this.globalStats.activeConnections + this.globalStats.pooledConnections;
    
    return {
      status: 'healthy',
      totalServices: this.pools.size,
      totalConnections,
      activeConnections: this.globalStats.activeConnections,
      pooledConnections: this.globalStats.pooledConnections,
      metrics,
      configuration: {
        minConnections: this.config.minConnections,
        maxConnections: this.config.maxConnections,
        acquireTimeout: this.config.acquireTimeoutMillis,
        idleTimeout: this.config.idleTimeoutMillis
      }
    };
  }

  // Graceful shutdown
  async shutdown() {
    console.log('🛑 Shutting down Connection Pool Manager...');
    
    // Clear timers
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    if (this.recycleTimer) {
      clearInterval(this.recycleTimer);
    }
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }
    
    // Close all connections
    for (const [service, pool] of this.pools) {
      console.log(`Closing connections for service: ${service}`);
      
      // Destroy active connections
      for (const connection of pool.active) {
        await this.destroyConnection(connection);
      }
      
      // Destroy available connections
      for (const connection of pool.available) {
        await this.destroyConnection(connection);
      }
      
      // Reject pending requests
      for (const pending of pool.pending) {
        pending.reject(new Error('Connection pool shutting down'));
      }
    }
    
    console.log('✅ Connection Pool Manager shutdown complete');
  }
}

// Singleton instance
let connectionPoolManager = null;

export function getConnectionPoolManager(options = {}) {
  if (!connectionPoolManager) {
    connectionPoolManager = new ConnectionPoolManager(options);
  }
  return connectionPoolManager;
}

export default { ConnectionPoolManager, getConnectionPoolManager };