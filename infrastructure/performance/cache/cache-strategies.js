/**
 * Multi-Layer Cache Strategies for Phase 2 Week 2 Performance Enhancement
 * Implements intelligent caching with multiple strategies and automatic invalidation
 */

import { getRedisManager } from './redis-manager.js';

// Lightweight NodeCache fallback for demo
class LightweightCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttlMap = new Map();
    this.maxKeys = options.maxKeys || 1000;
    this.stdTTL = options.stdTTL || 300;
  }

  get(key) {
    if (this.ttlMap.has(key) && Date.now() > this.ttlMap.get(key)) {
      this.cache.delete(key);
      this.ttlMap.delete(key);
      return undefined;
    }
    return this.cache.get(key);
  }

  set(key, value, ttl = this.stdTTL) {
    if (this.cache.size >= this.maxKeys) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.ttlMap.delete(firstKey);
    }
    this.cache.set(key, value);
    this.ttlMap.set(key, Date.now() + (ttl * 1000));
    return true;
  }

  del(key) {
    this.cache.delete(key);
    this.ttlMap.delete(key);
  }

  keys() {
    return Array.from(this.cache.keys());
  }
}

export class CacheStrategies {
  constructor(options = {}) {
    this.config = {
      // Memory cache settings
      memoryTTL: options.memoryTTL || 300, // 5 minutes
      memoryCheckPeriod: options.memoryCheckPeriod || 120, // 2 minutes
      
      // Redis cache settings  
      redisTTL: options.redisTTL || 3600, // 1 hour
      
      // Strategy settings
      enableMemoryCache: options.enableMemoryCache !== false,
      enableRedisCache: options.enableRedisCache !== false,
      enableWriteThrough: options.enableWriteThrough || true,
      enableWriteBehind: options.enableWriteBehind || false,
      
      // Performance settings
      compressionThreshold: options.compressionThreshold || 1024, // 1KB
      maxMemoryItems: options.maxMemoryItems || 1000,
      ...options
    };

    // Initialize memory cache
    this.memoryCache = this.config.enableMemoryCache ? 
      new LightweightCache({
        stdTTL: this.config.memoryTTL,
        maxKeys: this.config.maxMemoryItems
      }) : null;

    // Redis manager will be initialized when needed
    this.redisManager = null;
    this.isRedisAvailable = false;

    // Cache statistics
    this.stats = {
      memoryHits: 0,
      memoryMisses: 0,
      redisHits: 0,
      redisMisses: 0,
      writeThrough: 0,
      writeBehind: 0,
      errors: 0,
      compressions: 0
    };

    // Strategy handlers (define basic methods)
    this.strategies = {
      'cache-aside': this.cacheAside.bind(this)
    };

    this.initializeRedis();
  }

  async initializeRedis() {
    if (!this.config.enableRedisCache) return;

    try {
      this.redisManager = getRedisManager();
      await this.redisManager.initialize();
      this.isRedisAvailable = true;
      console.log('✅ Cache strategies initialized with Redis support');
    } catch (error) {
      console.warn('⚠️ Redis not available, using memory cache only:', error.message);
      this.isRedisAvailable = false;
    }
  }

  // ==================== CACHE-ASIDE STRATEGY ====================
  async cacheAside(key, dataLoader, options = {}) {
    const { 
      ttl = this.config.redisTTL,
      memoryTTL = this.config.memoryTTL,
      useCompression = false 
    } = options;

    try {
      // Level 1: Check memory cache first
      if (this.memoryCache) {
        const memoryValue = this.memoryCache.get(key);
        if (memoryValue !== undefined) {
          this.stats.memoryHits++;
          return memoryValue;
        }
        this.stats.memoryMisses++;
      }

      // Level 2: Check Redis cache
      if (this.isRedisAvailable) {
        const redisValue = await this.redisManager.get(key);
        if (redisValue !== null) {
          this.stats.redisHits++;
          
          // Store in memory cache for faster access
          if (this.memoryCache) {
            this.memoryCache.set(key, redisValue, memoryTTL);
          }
          
          return redisValue;
        }
        this.stats.redisMisses++;
      }

      // Level 3: Load from data source
      const data = await dataLoader();
      if (data !== null && data !== undefined) {
        // Store in both caches
        await this.set(key, data, { ttl, memoryTTL, useCompression });
      }

      return data;
    } catch (error) {
      this.stats.errors++;
      console.error('Cache-aside strategy error:', error.message);
      
      // Fallback to direct data loading
      try {
        return await dataLoader();
      } catch (loaderError) {
        throw new Error(`Cache and data loader both failed: ${error.message}, ${loaderError.message}`);
      }
    }
  }

  // ==================== WRITE-THROUGH STRATEGY ====================
  async writeThrough(key, data, dataPersister, options = {}) {
    const { 
      ttl = this.config.redisTTL,
      memoryTTL = this.config.memoryTTL,
      useCompression = false 
    } = options;

    try {
      // First persist to data store
      const result = await dataPersister(data);
      
      // Then update caches
      await this.set(key, result, { ttl, memoryTTL, useCompression });
      
      this.stats.writeThrough++;
      return result;
    } catch (error) {
      this.stats.errors++;
      console.error('Write-through strategy error:', error.message);
      throw error;
    }
  }

  // ==================== CORE CACHE OPERATIONS ====================
  async get(key) {
    try {
      // Check memory cache first
      if (this.memoryCache) {
        const memoryValue = this.memoryCache.get(key);
        if (memoryValue !== undefined) {
          this.stats.memoryHits++;
          return memoryValue;
        }
        this.stats.memoryMisses++;
      }

      // Check Redis cache
      if (this.isRedisAvailable) {
        const redisValue = await this.redisManager.get(key);
        if (redisValue !== null) {
          this.stats.redisHits++;
          
          // Store in memory cache
          if (this.memoryCache) {
            this.memoryCache.set(key, redisValue);
          }
          
          return redisValue;
        }
        this.stats.redisMisses++;
      }

      return null;
    } catch (error) {
      this.stats.errors++;
      console.error('Cache get error:', error.message);
      return null;
    }
  }

  async set(key, value, options = {}) {
    const { 
      ttl = this.config.redisTTL,
      memoryTTL = this.config.memoryTTL,
      useCompression = false 
    } = options;

    try {
      let processedValue = value;
      
      // Apply compression if needed
      if (useCompression && this.shouldCompress(value)) {
        processedValue = await this.compress(value);
        this.stats.compressions++;
      }

      // Store in memory cache
      if (this.memoryCache) {
        this.memoryCache.set(key, processedValue, memoryTTL);
      }

      // Store in Redis cache
      if (this.isRedisAvailable) {
        await this.redisManager.set(key, processedValue, ttl);
      }

      return true;
    } catch (error) {
      this.stats.errors++;
      console.error('Cache set error:', error.message);
      return false;
    }
  }

  async del(key) {
    try {
      // Remove from memory cache
      if (this.memoryCache) {
        this.memoryCache.del(key);
      }

      // Remove from Redis cache
      if (this.isRedisAvailable) {
        await this.redisManager.del(key);
      }

      return true;
    } catch (error) {
      this.stats.errors++;
      console.error('Cache delete error:', error.message);
      return false;
    }
  }

  // ==================== UTILITY METHODS ====================
  shouldCompress(value) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    return serialized.length > this.config.compressionThreshold;
  }

  async compress(value) {
    // Simple compression placeholder - could use zlib or other compression
    return {
      __compressed: true,
      data: value,
      originalSize: JSON.stringify(value).length
    };
  }

  // ==================== MONITORING & STATISTICS ====================
  getStats() {
    const memoryTotal = this.stats.memoryHits + this.stats.memoryMisses;
    const redisTotal = this.stats.redisHits + this.stats.redisMisses;
    
    return {
      ...this.stats,
      memoryHitRate: memoryTotal > 0 ? (this.stats.memoryHits / memoryTotal * 100).toFixed(2) : 0,
      redisHitRate: redisTotal > 0 ? (this.stats.redisHits / redisTotal * 100).toFixed(2) : 0,
      overallHitRate: (memoryTotal + redisTotal) > 0 ? 
        ((this.stats.memoryHits + this.stats.redisHits) / (memoryTotal + redisTotal) * 100).toFixed(2) : 0,
      cacheHealth: {
        memoryEnabled: !!this.memoryCache,
        redisEnabled: this.isRedisAvailable,
        memoryKeys: this.memoryCache ? this.memoryCache.keys().length : 0
      }
    };
  }

  async healthCheck() {
    const health = {
      status: 'healthy',
      memory: !!this.memoryCache,
      redis: this.isRedisAvailable,
      stats: this.getStats()
    };

    if (this.isRedisAvailable) {
      const redisHealth = await this.redisManager.healthCheck();
      health.redisStatus = redisHealth.status;
      health.redisLatency = redisHealth.latency;
    }

    return health;
  }
}

// Singleton instance
let cacheStrategies = null;

export function getCacheStrategies(options = {}) {
  if (!cacheStrategies) {
    cacheStrategies = new CacheStrategies(options);
  }
  return cacheStrategies;
}

export default { CacheStrategies, getCacheStrategies };