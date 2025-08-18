/**
 * Response Compression Manager for Phase 2 Week 2 Performance Enhancement
 * Provides intelligent response compression with performance optimization
 */

import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const deflate = promisify(zlib.deflate);
const brotliCompress = promisify(zlib.brotliCompress);

export class ResponseCompression {
  constructor(options = {}) {
    this.config = {
      // Compression settings
      threshold: options.threshold || 1024, // 1KB minimum
      level: options.level || 6, // zlib compression level (1-9)
      windowBits: options.windowBits || 15,
      memLevel: options.memLevel || 8,
      
      // Supported algorithms
      algorithms: options.algorithms || ['br', 'gzip', 'deflate'],
      defaultAlgorithm: options.defaultAlgorithm || 'gzip',
      
      // Content type filtering
      compressibleTypes: options.compressibleTypes || [
        'text/html',
        'text/css',
        'text/javascript',
        'application/javascript',
        'application/json',
        'application/xml',
        'text/xml',
        'text/plain',
        'image/svg+xml'
      ],
      
      // Performance settings
      enableCaching: options.enableCaching !== false,
      cacheSize: options.cacheSize || 100,
      maxCacheEntrySize: options.maxCacheEntrySize || 1024 * 1024, // 1MB
      
      // Quality settings for Brotli
      brotliQuality: options.brotliQuality || 4,
      brotliWindowSize: options.brotliWindowSize || 22,
      
      ...options
    };

    // Compression cache
    this.cache = new Map();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      compressedRequests: 0,
      skippedRequests: 0,
      totalOriginalBytes: 0,
      totalCompressedBytes: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageCompressionRatio: 0,
      averageCompressionTime: 0,
      algorithmUsage: {
        'br': 0,
        'gzip': 0,
        'deflate': 0
      }
    };

    // Prepare compression options
    this.compressionOptions = {
      gzip: {
        level: this.config.level,
        windowBits: this.config.windowBits,
        memLevel: this.config.memLevel
      },
      deflate: {
        level: this.config.level,
        windowBits: this.config.windowBits,
        memLevel: this.config.memLevel
      },
      br: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: this.config.brotliQuality,
        [zlib.constants.BROTLI_PARAM_LGWIN]: this.config.brotliWindowSize
      }
    };
  }

  // Determine if content should be compressed
  shouldCompress(content, contentType, headers = {}) {
    // Check minimum size threshold
    if (!content || content.length < this.config.threshold) {
      return false;
    }

    // Check if already compressed
    if (headers['content-encoding']) {
      return false;
    }

    // Check content type
    if (contentType && !this.isCompressibleType(contentType)) {
      return false;
    }

    // Check cache-control headers
    const cacheControl = headers['cache-control'];
    if (cacheControl && cacheControl.includes('no-transform')) {
      return false;
    }

    return true;
  }

  // Check if content type is compressible
  isCompressibleType(contentType) {
    const type = contentType.split(';')[0].toLowerCase();
    return this.config.compressibleTypes.some(compressibleType => 
      type === compressibleType || type.startsWith(compressibleType + '/')
    );
  }

  // Select best compression algorithm based on Accept-Encoding header
  selectAlgorithm(acceptEncoding) {
    if (!acceptEncoding) {
      return this.config.defaultAlgorithm;
    }

    const accepted = acceptEncoding.toLowerCase().split(',').map(s => s.trim());
    
    // Check algorithms in order of preference
    for (const algorithm of this.config.algorithms) {
      const algorithmName = algorithm === 'br' ? 'br' : algorithm;
      if (accepted.some(encoding => encoding.includes(algorithmName))) {
        return algorithm;
      }
    }

    return this.config.defaultAlgorithm;
  }

  // Generate cache key for compressed content
  generateCacheKey(content, algorithm, options = {}) {
    // Simple hash for demo without crypto dependency
    const contentStr = typeof content === 'string' ? content : content.toString();
    let hash = 0;
    for (let i = 0; i < Math.min(contentStr.length, 1000); i++) {
      const char = contentStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `${algorithm}:${Math.abs(hash).toString(16)}:${JSON.stringify(options)}`;
  }

  // Get compressed content from cache
  getCachedCompression(cacheKey) {
    if (!this.config.enableCaching) {
      return null;
    }

    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.cacheHits++;
      this.stats.cacheHits++;
      
      // Update LRU - move to end
      this.cache.delete(cacheKey);
      this.cache.set(cacheKey, cached);
      
      return cached;
    }

    this.cacheMisses++;
    this.stats.cacheMisses++;
    return null;
  }

  // Store compressed content in cache
  setCachedCompression(cacheKey, compressedContent) {
    if (!this.config.enableCaching || 
        compressedContent.length > this.config.maxCacheEntrySize) {
      return;
    }

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.cacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(cacheKey, compressedContent);
  }

  // Compress content using specified algorithm
  async compressWithAlgorithm(content, algorithm, options = {}) {
    const startTime = Date.now();
    let compressed;

    try {
      switch (algorithm) {
        case 'br':
          compressed = await brotliCompress(content, {
            ...this.compressionOptions.br,
            ...options
          });
          break;
        case 'gzip':
          compressed = await gzip(content, {
            ...this.compressionOptions.gzip,
            ...options
          });
          break;
        case 'deflate':
          compressed = await deflate(content, {
            ...this.compressionOptions.deflate,
            ...options
          });
          break;
        default:
          throw new Error(`Unsupported compression algorithm: ${algorithm}`);
      }

      const compressionTime = Date.now() - startTime;
      const compressionRatio = content.length / compressed.length;

      // Update statistics
      this.stats.algorithmUsage[algorithm]++;
      this.updateCompressionStats(content.length, compressed.length, compressionTime, compressionRatio);

      return {
        data: compressed,
        algorithm,
        originalSize: content.length,
        compressedSize: compressed.length,
        compressionRatio,
        compressionTime
      };

    } catch (error) {
      console.error(`Compression failed with ${algorithm}:`, error.message);
      throw error;
    }
  }

  // Main compression method
  async compress(content, options = {}) {
    const {
      contentType = 'text/plain',
      acceptEncoding = '',
      headers = {},
      forceAlgorithm = null
    } = options;

    this.stats.totalRequests++;

    // Convert content to buffer if it's a string
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');

    // Check if compression should be applied
    if (!this.shouldCompress(buffer, contentType, headers)) {
      this.stats.skippedRequests++;
      return {
        data: buffer,
        algorithm: null,
        originalSize: buffer.length,
        compressedSize: buffer.length,
        compressionRatio: 1,
        compressed: false
      };
    }

    // Select compression algorithm
    const algorithm = forceAlgorithm || this.selectAlgorithm(acceptEncoding);

    // Check cache
    const cacheKey = this.generateCacheKey(buffer, algorithm, options);
    const cached = this.getCachedCompression(cacheKey);
    
    if (cached) {
      return {
        ...cached,
        fromCache: true
      };
    }

    // Perform compression
    try {
      const result = await this.compressWithAlgorithm(buffer, algorithm, options);
      
      // Cache the result
      this.setCachedCompression(cacheKey, {
        data: result.data,
        algorithm: result.algorithm,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        compressionRatio: result.compressionRatio,
        compressed: true
      });

      this.stats.compressedRequests++;
      return {
        ...result,
        compressed: true,
        fromCache: false
      };

    } catch (error) {
      console.error('Compression failed:', error.message);
      this.stats.skippedRequests++;
      
      // Return original content on compression failure
      return {
        data: buffer,
        algorithm: null,
        originalSize: buffer.length,
        compressedSize: buffer.length,
        compressionRatio: 1,
        compressed: false,
        error: error.message
      };
    }
  }

  // Update compression statistics
  updateCompressionStats(originalSize, compressedSize, compressionTime, compressionRatio) {
    this.stats.totalOriginalBytes += originalSize;
    this.stats.totalCompressedBytes += compressedSize;
    
    // Update average compression ratio
    const totalCompressed = this.stats.compressedRequests;
    this.stats.averageCompressionRatio = 
      (this.stats.averageCompressionRatio * (totalCompressed - 1) + compressionRatio) / totalCompressed;
    
    // Update average compression time
    this.stats.averageCompressionTime = 
      (this.stats.averageCompressionTime * (totalCompressed - 1) + compressionTime) / totalCompressed;
  }

  // Express.js middleware
  middleware() {
    return async (req, res, next) => {
      const originalSend = res.send;
      const originalJson = res.json;
      const originalEnd = res.end;

      // Override res.send
      res.send = async function(data) {
        if (res.headersSent) {
          return originalSend.call(this, data);
        }

        try {
          const result = await this.compress(data, {
            contentType: res.get('Content-Type'),
            acceptEncoding: req.get('Accept-Encoding'),
            headers: res.getHeaders()
          });

          if (result.compressed) {
            res.set('Content-Encoding', result.algorithm);
            res.set('Content-Length', result.compressedSize.toString());
            res.set('X-Compression-Ratio', result.compressionRatio.toFixed(2));
            res.set('X-Original-Size', result.originalSize.toString());
          }

          return originalSend.call(this, result.data);
        } catch (error) {
          console.error('Middleware compression error:', error.message);
          return originalSend.call(this, data);
        }
      }.bind(this);

      // Override res.json
      res.json = async function(obj) {
        if (res.headersSent) {
          return originalJson.call(this, obj);
        }

        const data = JSON.stringify(obj);
        return res.send(data);
      };

      // Override res.end
      res.end = async function(chunk, encoding) {
        if (chunk && !res.headersSent) {
          return res.send(chunk);
        }
        return originalEnd.call(this, chunk, encoding);
      };

      next();
    };
  }

  // Get compression statistics
  getStats() {
    const totalBytes = this.stats.totalOriginalBytes;
    const compressedBytes = this.stats.totalCompressedBytes;
    const totalSavings = totalBytes - compressedBytes;
    const overallCompressionRatio = totalBytes > 0 ? totalBytes / compressedBytes : 1;
    const compressionRate = this.stats.totalRequests > 0 ? 
      (this.stats.compressedRequests / this.stats.totalRequests * 100) : 0;

    return {
      ...this.stats,
      overallCompressionRatio: overallCompressionRatio.toFixed(2),
      totalSavingsBytes: totalSavings,
      totalSavingsPercentage: totalBytes > 0 ? ((totalSavings / totalBytes) * 100).toFixed(2) : 0,
      compressionRate: compressionRate.toFixed(2),
      cacheStats: {
        size: this.cache.size,
        maxSize: this.config.cacheSize,
        hitRate: this.cacheHits + this.cacheMisses > 0 ? 
          (this.cacheHits / (this.cacheHits + this.cacheMisses) * 100).toFixed(2) : 0
      },
      timestamp: new Date().toISOString()
    };
  }

  // Health check
  async healthCheck() {
    const stats = this.getStats();
    
    return {
      status: 'healthy',
      configuration: {
        threshold: this.config.threshold,
        algorithms: this.config.algorithms,
        cachingEnabled: this.config.enableCaching
      },
      performance: {
        averageCompressionTime: stats.averageCompressionTime,
        averageCompressionRatio: stats.averageCompressionRatio,
        cacheHitRate: stats.cacheStats.hitRate
      },
      stats
    };
  }

  // Clear compression cache
  clearCache() {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.stats.cacheHits = 0;
    this.stats.cacheMisses = 0;
  }

  // Reset statistics
  resetStats() {
    this.stats = {
      totalRequests: 0,
      compressedRequests: 0,
      skippedRequests: 0,
      totalOriginalBytes: 0,
      totalCompressedBytes: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageCompressionRatio: 0,
      averageCompressionTime: 0,
      algorithmUsage: {
        'br': 0,
        'gzip': 0,
        'deflate': 0
      }
    };
  }
}

// Singleton instance
let responseCompression = null;

export function getResponseCompression(options = {}) {
  if (!responseCompression) {
    responseCompression = new ResponseCompression(options);
  }
  return responseCompression;
}

export default { ResponseCompression, getResponseCompression };