#!/usr/bin/env node
/**
 * Phase 2 Week 2+ Demo Tool
 * Interactive demonstration of performance enhancements
 */

import { getCacheStrategies } from '../infrastructure/performance/cache/cache-strategies.js';
import { getResponseCompression } from '../infrastructure/performance/optimization/response-compression.js';
import { getSLAMonitor } from '../infrastructure/performance/monitoring/sla-monitor.js';
import { getPerformanceMonitor } from '../infrastructure/performance/monitoring/performance-monitor.js';

class Phase2Week2Demo {
  constructor() {
    this.demoSteps = [
      'Cache Strategies Demo',
      'Response Compression Demo', 
      'SLA Monitoring Demo',
      'Performance Monitoring Demo',
      'Integration Demo'
    ];
  }

  async runDemo() {
    console.log('🚀 Phase 2 Week 2+ Performance Enhancement Demo\n');
    console.log('This demo showcases the new performance optimization capabilities:\n');

    for (let i = 0; i < this.demoSteps.length; i++) {
      console.log(`${i + 1}. ${this.demoSteps[i]}`);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    try {
      await this.demoCacheStrategies();
      await this.demoResponseCompression();
      await this.demoSLAMonitoring();
      await this.demoPerformanceMonitoring();
      await this.demoIntegration();
      
      console.log('✅ Demo completed successfully!');
      console.log('\n📋 Next Steps:');
      console.log('   • Run: npm run performance:start');
      console.log('   • Monitor: npm run sla:status'); 
      console.log('   • Report: npm run performance:report');
      
    } catch (error) {
      console.error('❌ Demo failed:', error.message);
    }
  }

  async demoCacheStrategies() {
    console.log('1️⃣ Cache Strategies Demo');
    console.log('   Testing multi-layer caching with different strategies...\n');

    try {
      const cache = getCacheStrategies({
        enableRedisCache: false, // Demo without Redis dependency
        memoryTTL: 60,
        enableMemoryCache: true
      });

      // Simulate cache-aside strategy
      const testKey = 'demo:user:123';
      const dataLoader = async () => {
        console.log('   🔄 Loading data from "database"...');
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate DB delay
        return { id: 123, name: 'Demo User', email: 'demo@merajutasa.id' };
      };

      console.log('   📝 Cache-aside strategy test:');
      
      // First call - cache miss
      const start1 = Date.now();
      const result1 = await cache.cacheAside(testKey, dataLoader);
      const time1 = Date.now() - start1;
      console.log(`   ⏱️  First call: ${time1}ms (cache miss)`);
      console.log(`   📊 Data: ${JSON.stringify(result1)}`);

      // Second call - cache hit
      const start2 = Date.now();
      const result2 = await cache.cacheAside(testKey, dataLoader);
      const time2 = Date.now() - start2;
      console.log(`   ⚡ Second call: ${time2}ms (cache hit - ${Math.round((time1/time2))}x faster)`);

      // Show cache statistics
      const stats = cache.getStats();
      console.log(`   📈 Cache Stats: ${stats.memoryHitRate}% hit rate, ${stats.memoryKeys} keys\n`);

    } catch (error) {
      console.log(`   ❌ Cache demo failed: ${error.message}\n`);
    }
  }

  async demoResponseCompression() {
    console.log('2️⃣ Response Compression Demo');
    console.log('   Testing intelligent response compression...\n');

    try {
      const compression = getResponseCompression({
        threshold: 100, // Lower threshold for demo
        algorithms: ['gzip', 'deflate']
      });

      // Test data of various sizes
      const testData = [
        { name: 'Small JSON', data: JSON.stringify({ message: 'Hello World' }) },
        { name: 'Medium JSON', data: JSON.stringify({ 
          users: Array(50).fill(null).map((_, i) => ({ 
            id: i, 
            name: `User ${i}`, 
            email: `user${i}@example.com` 
          }))
        }) },
        { name: 'Large Text', data: 'Lorem ipsum dolor sit amet, '.repeat(200) }
      ];

      for (const test of testData) {
        console.log(`   📄 Testing ${test.name} (${test.data.length} bytes):`);
        
        const result = await compression.compress(test.data, {
          contentType: 'application/json',
          acceptEncoding: 'gzip, deflate'
        });

        if (result.compressed) {
          const savings = ((result.originalSize - result.compressedSize) / result.originalSize * 100).toFixed(1);
          console.log(`   ✅ Compressed with ${result.algorithm}: ${result.compressedSize} bytes (${savings}% smaller)`);
        } else {
          console.log(`   ⏭️  Skipped compression: Too small or not beneficial`);
        }
      }

      const stats = compression.getStats();
      console.log(`   📊 Compression Stats: ${stats.compressionRate}% compressed, avg ratio: ${stats.averageCompressionRatio}\n`);

    } catch (error) {
      console.log(`   ❌ Compression demo failed: ${error.message}\n`);
    }
  }

  async demoSLAMonitoring() {
    console.log('3️⃣ SLA Monitoring Demo');
    console.log('   Testing service level agreement monitoring...\n');

    try {
      const slaMonitor = getSLAMonitor({
        enableAlerts: false // Demo mode
      });

      // Simulate various service metrics
      const services = ['signing_service', 'chain_service', 'collector_service'];
      
      for (const service of services) {
        console.log(`   🔍 Recording metrics for ${service}:`);
        
        // Simulate good performance
        for (let i = 0; i < 5; i++) {
          slaMonitor.recordMetric(service, {
            responseTime: Math.random() * 100 + 50, // 50-150ms
            success: Math.random() > 0.05, // 95% success rate
            statusCode: Math.random() > 0.05 ? 200 : 500
          });
        }

        // Evaluate SLA
        const slaStatus = await slaMonitor.evaluateSLA(service);
        console.log(`   📊 SLA Status: ${slaStatus.status}`);
        console.log(`   ⏱️  Avg latency: ${slaStatus.metrics.latency_avg?.toFixed(2) || 0}ms`);
        console.log(`   ✅ Availability: ${slaStatus.metrics.availability?.toFixed(2) || 0}%`);
        
        if (slaStatus.violations.length > 0) {
          console.log(`   ⚠️  Violations: ${slaStatus.violations.length}`);
        }
        console.log();
      }

    } catch (error) {
      console.log(`   ❌ SLA monitoring demo failed: ${error.message}\n`);
    }
  }

  async demoPerformanceMonitoring() {
    console.log('4️⃣ Performance Monitoring Demo');
    console.log('   Testing comprehensive performance tracking...\n');

    try {
      const perfMonitor = getPerformanceMonitor({
        enablePersistence: false // Demo mode
      });

      // Simulate some requests
      console.log('   🚀 Simulating request performance tracking:');
      
      for (let i = 0; i < 3; i++) {
        const requestId = `demo-request-${i + 1}`;
        
        perfMonitor.startRequest(requestId, {
          endpoint: `/api/demo/${i + 1}`,
          method: 'GET'
        });

        // Simulate request processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
        
        const success = Math.random() > 0.1; // 90% success rate
        perfMonitor.endRequest(requestId, success, success ? 200 : 500);
        
        console.log(`   ✅ Request ${i + 1} completed ${success ? 'successfully' : 'with error'}`);
      }

      // Get current metrics
      const metrics = perfMonitor.getCurrentMetrics();
      console.log(`   📊 Performance Metrics:`);
      console.log(`   ⏱️  Average response time: ${metrics.stats.averageResponseTime?.toFixed(2) || 0}ms`);
      console.log(`   📈 Throughput: ${metrics.stats.throughput} requests/min`);
      console.log(`   ❌ Error rate: ${metrics.stats.errorRate?.toFixed(2) || 0}%`);
      console.log();

    } catch (error) {
      console.log(`   ❌ Performance monitoring demo failed: ${error.message}\n`);
    }
  }

  async demoIntegration() {
    console.log('5️⃣ Integration Demo');
    console.log('   Testing integration of all performance components...\n');

    try {
      // Simulate a complete request lifecycle with all enhancements
      console.log('   🔄 Simulating enhanced request lifecycle:');
      
      const cache = getCacheStrategies({ enableRedisCache: false });
      const compression = getResponseCompression();
      const slaMonitor = getSLAMonitor({ enableAlerts: false });
      const perfMonitor = getPerformanceMonitor({ enablePersistence: false });

      // Step 1: Start request tracking
      const requestId = 'integrated-demo-request';
      perfMonitor.startRequest(requestId, { endpoint: '/api/integrated-demo' });
      console.log('   1. ✅ Request tracking started');

      // Step 2: Check cache
      const cacheKey = 'demo:integrated:data';
      let data = await cache.get(cacheKey);
      
      if (!data) {
        console.log('   2. 🔄 Cache miss - loading from "database"');
        data = { message: 'Integrated demo data', timestamp: new Date().toISOString() };
        await cache.set(cacheKey, data);
      } else {
        console.log('   2. ⚡ Cache hit - data retrieved instantly');
      }

      // Step 3: Compress response
      const jsonResponse = JSON.stringify(data);
      const compressionResult = await compression.compress(jsonResponse, {
        contentType: 'application/json',
        acceptEncoding: 'gzip'
      });
      console.log(`   3. 🗜️  Response compressed: ${compressionResult.compressedSize} bytes`);

      // Step 4: Record SLA metrics
      slaMonitor.recordMetric('integrated_service', {
        responseTime: 150,
        success: true,
        statusCode: 200
      });
      console.log('   4. 📊 SLA metrics recorded');

      // Step 5: Complete request tracking
      perfMonitor.endRequest(requestId, true, 200);
      console.log('   5. ✅ Request tracking completed');

      console.log('\n   🎉 All performance components working together successfully!');
      
      // Show combined health status
      const cacheHealth = await cache.healthCheck();
      const slaHealth = await slaMonitor.healthCheck();
      const perfHealth = await perfMonitor.healthCheck();
      
      console.log('\n   🏥 Combined Health Status:');
      console.log(`   • Cache System: ${cacheHealth.status}`);
      console.log(`   • SLA Monitoring: ${slaHealth.status}`);
      console.log(`   • Performance Tracking: ${perfHealth.status}`);

    } catch (error) {
      console.log(`   ❌ Integration demo failed: ${error.message}\n`);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const demo = new Phase2Week2Demo();
  demo.runDemo().catch(console.error);
}

export default Phase2Week2Demo;