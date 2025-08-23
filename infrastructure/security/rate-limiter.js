#!/usr/bin/env node
/**
 * rate-limiter.js
 * Advanced rate limiting middleware for MerajutASA.id services
 * Implements token bucket, sliding window, and adaptive rate limiting
 */

import { createHash } from 'crypto';

/**
 * IPv6-safe IP extraction - similar to express-rate-limit's ipKeyGenerator
 */
function getClientIP(req) {
  // Use req.ip first (trust proxy should be configured)
  if (req.ip) {
    return req.ip;
  }

  // Fallback to connection info
  if (req.connection && req.connection.remoteAddress) {
    return req.connection.remoteAddress;
  }

  // Extract from forwarded headers (be careful with proxy configuration)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // Take the first IP in the chain
    return forwarded.split(',')[0].trim();
  }

  return 'unknown';
}

// Rate limiting configurations for different endpoints
const RATE_LIMIT_CONFIGS = {
  // Signer service - cryptographic operations are expensive
  '/api/signer/sign': {
    windowMs: 60000,     // 1 minute
    maxRequests: 10,     // 10 signatures per minute
    algorithm: 'token-bucket',
    skipFailedRequests: false,
    keyGenerator: 'ip+user',
  },

  '/api/signer/rotate': {
    windowMs: 3600000,   // 1 hour
    maxRequests: 1,      // 1 rotation per hour
    algorithm: 'sliding-window',
    keyGenerator: 'user',
  },

  // Chain service - moderate limits
  '/api/chain/append': {
    windowMs: 60000,     // 1 minute
    maxRequests: 20,     // 20 appends per minute
    algorithm: 'token-bucket',
    skipFailedRequests: true,
    keyGenerator: 'ip+user',
  },

  // Collector service - high volume ingestion
  '/api/collector/ingest': {
    windowMs: 60000,     // 1 minute
    maxRequests: 100,    // 100 events per minute
    algorithm: 'sliding-window',
    burstLimit: 50,      // Allow bursts up to 50
    keyGenerator: 'ip+user',
  },

  // Equity service - read-heavy
  '/api/equity/metrics': {
    windowMs: 60000,     // 1 minute
    maxRequests: 50,     // 50 requests per minute
    algorithm: 'fixed-window',
    keyGenerator: 'ip',
  },

  // General API limits
  'default': {
    windowMs: 60000,     // 1 minute
    maxRequests: 30,     // 30 requests per minute
    algorithm: 'sliding-window',
    keyGenerator: 'ip',
  },
};

// Global rate limiting state
const rateLimitState = new Map();

/**
 * Generate rate limiting key based on strategy
 */
function generateKey(req, strategy) {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const user = req.user?.id || 'anonymous';

  switch (strategy) {
  case 'ip':
    return `ip:${ip}`;
  case 'user':
    return `user:${user}`;
  case 'ip+user':
    return `ip+user:${ip}:${user}`;
  case 'ip+ua':
    const uaHash = createHash('sha256').update(userAgent).digest('hex').substring(0, 8);
    return `ip+ua:${ip}:${uaHash}`;
  default:
    return `default:${ip}`;
  }
}

/**
 * Fixed window rate limiting
 */
function fixedWindowLimiter(key, config) {
  const now = Date.now();
  const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
  const windowKey = `${key}:${windowStart}`;

  const current = rateLimitState.get(windowKey) || 0;

  if (current >= config.maxRequests) {
    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: windowStart + config.windowMs,
      retryAfter: Math.ceil((windowStart + config.windowMs - now) / 1000),
    };
  }

  rateLimitState.set(windowKey, current + 1);

  // Cleanup old windows
  setTimeout(() => rateLimitState.delete(windowKey), config.windowMs);

  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - current - 1,
    resetTime: windowStart + config.windowMs,
    retryAfter: 0,
  };
}

/**
 * Sliding window rate limiting
 */
function slidingWindowLimiter(key, config) {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Get or create request log for this key
  let requestLog = rateLimitState.get(key);
  if (!requestLog || !Array.isArray(requestLog)) {
    requestLog = [];
    rateLimitState.set(key, requestLog);
  }

  // Remove requests outside the window
  const validRequests = requestLog.filter(timestamp => timestamp > windowStart);
  rateLimitState.set(key, validRequests);

  if (validRequests.length >= config.maxRequests) {
    const oldestRequest = Math.min(...validRequests);
    const resetTime = oldestRequest + config.windowMs;

    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: resetTime,
      retryAfter: Math.ceil((resetTime - now) / 1000),
    };
  }

  // Add current request
  validRequests.push(now);
  rateLimitState.set(key, validRequests);

  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - validRequests.length,
    resetTime: now + config.windowMs,
    retryAfter: 0,
  };
}

/**
 * Token bucket rate limiting
 */
function tokenBucketLimiter(key, config) {
  const now = Date.now();

  // Get or create bucket for this key
  let bucket = rateLimitState.get(key);
  if (!bucket) {
    bucket = {
      tokens: config.maxRequests,
      lastRefill: now,
    };
    rateLimitState.set(key, bucket);
  }

  // Refill tokens based on elapsed time
  const timePassed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor(timePassed / config.windowMs * config.maxRequests);

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(config.maxRequests, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  if (bucket.tokens < 1) {
    const timeUntilToken = Math.ceil((config.windowMs / config.maxRequests) / 1000);

    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: now + (timeUntilToken * 1000),
      retryAfter: timeUntilToken,
    };
  }

  // Consume a token
  bucket.tokens--;

  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: bucket.tokens,
    resetTime: bucket.lastRefill + config.windowMs,
    retryAfter: 0,
  };
}

/**
 * Adaptive rate limiting based on system load
 */
function adaptiveRateLimiter(key, config, systemLoad = 0.5) {
  // Adjust limits based on system load
  const loadFactor = Math.max(0.1, 1 - systemLoad);
  const adjustedConfig = {
    ...config,
    maxRequests: Math.floor(config.maxRequests * loadFactor),
  };

  // Use sliding window as base algorithm
  return slidingWindowLimiter(key, adjustedConfig);
}

/**
 * Get system load (simplified version)
 */
function getSystemLoad() {
  // In a real implementation, this would check:
  // - CPU usage
  // - Memory usage
  // - Request queue length
  // - Database connection pool
  // - Response times

  const memUsage = process.memoryUsage();
  const memLoadFactor = memUsage.heapUsed / memUsage.heapTotal;

  // Simplified load calculation (0-1 scale)
  return Math.min(1, memLoadFactor);
}

/**
 * Create rate limiting middleware
 */
export function createRateLimitMiddleware(endpoint = null) {
  return function rateLimitMiddleware(req, res, next) {
    try {
      // Determine configuration to use
      const path = endpoint || req.route?.path || req.url.split('?')[0];
      const config = RATE_LIMIT_CONFIGS[path] || RATE_LIMIT_CONFIGS.default;

      // Generate rate limiting key
      const key = generateKey(req, config.keyGenerator);

      // Apply rate limiting algorithm
      let result;
      const systemLoad = getSystemLoad();

      switch (config.algorithm) {
      case 'fixed-window':
        result = fixedWindowLimiter(key, config);
        break;
      case 'sliding-window':
        result = slidingWindowLimiter(key, config);
        break;
      case 'token-bucket':
        result = tokenBucketLimiter(key, config);
        break;
      case 'adaptive':
        result = adaptiveRateLimiter(key, config, systemLoad);
        break;
      default:
        result = slidingWindowLimiter(key, config);
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', result.limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
      res.setHeader('X-RateLimit-Policy', `${result.limit};w=${config.windowMs}`);

      if (!result.allowed) {
        res.setHeader('Retry-After', result.retryAfter);
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          limit: result.limit,
          remaining: result.remaining,
          resetTime: new Date(result.resetTime).toISOString(),
          retryAfter: result.retryAfter,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Continue without rate limiting on error (fail open)
      next();
    }
  };
}

/**
 * Rate limiting status endpoint
 */
export function createRateLimitStatusEndpoint() {
  return function rateLimitStatus(req, res) {
    try {
      const limits = {};

      // Get status for each configured endpoint
      for (const [endpoint, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
        if (endpoint === 'default') {continue;}

        const key = generateKey(req, config.keyGenerator);

        // Get current status without modifying counters
        const status = {
          endpoint,
          algorithm: config.algorithm,
          limit: config.maxRequests,
          windowMs: config.windowMs,
        };

        const stateData = rateLimitState.get(key);
        if (stateData) {
          if (Array.isArray(stateData)) {
            // Sliding window
            const now = Date.now();
            const validRequests = stateData.filter(ts => ts > now - config.windowMs);
            status.remaining = config.maxRequests - validRequests.length;
          } else if (stateData.tokens !== undefined) {
            // Token bucket
            status.remaining = stateData.tokens;
          } else {
            // Fixed window or other
            status.remaining = config.maxRequests - (stateData || 0);
          }
        } else {
          status.remaining = config.maxRequests;
        }

        limits[endpoint] = status;
      }

      res.json({
        rateLimits: limits,
        systemLoad: getSystemLoad(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Rate limit status error:', error);
      res.status(500).json({
        error: 'Failed to get rate limit status',
      });
    }
  };
}

/**
 * Clean up expired rate limit data
 */
export function cleanupRateLimitData() {
  const now = Date.now();
  const maxAge = 3600000; // 1 hour

  for (const [key, value] of rateLimitState.entries()) {
    let shouldDelete = false;

    if (Array.isArray(value)) {
      // Sliding window - check if all timestamps are expired
      const validRequests = value.filter(ts => ts > now - maxAge);
      if (validRequests.length === 0) {
        shouldDelete = true;
      } else {
        rateLimitState.set(key, validRequests);
      }
    } else if (value.lastRefill) {
      // Token bucket - check if last refill was too long ago
      if (now - value.lastRefill > maxAge) {
        shouldDelete = true;
      }
    } else if (typeof value === 'number') {
      // Fixed window - delete keys that look expired
      if (key.includes(':') && parseInt(key.split(':').pop()) < now - maxAge) {
        shouldDelete = true;
      }
    }

    if (shouldDelete) {
      rateLimitState.delete(key);
    }
  }
}

// Cleanup expired data every 10 minutes
setInterval(cleanupRateLimitData, 600000);

export default createRateLimitMiddleware;
