/**
 * MerajutASA.id - Phase 2 Week 3: Observability Benchmark Tool
 * 
 * Performance benchmarking for observability infrastructure
 * Measures throughput, latency, and resource usage
 * 
 * @version 1.0.0
 * @since Phase 2 Week 3
 */

import { getAdvancedObservabilitySystem } from '../infrastructure/observability/advanced-observability-system.js';
import { performance } from 'perf_hooks';
import { promises as fs } from 'fs';
import path from 'path';

class ObservabilityBenchmark {
  constructor() {
    this.observability = null;
    this.results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      node_version: process.version,
      platform: process.platform,
      benchmarks: {},
      summary: {}
    };
  }

  async runBenchmark() {
    console.log('⚡ MerajutASA.id Observability Performance Benchmark');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 Testing observability infrastructure performance and scalability\n');

    await this.initializeSystem();
    
    const benchmarks = [
      { name: 'Metrics Collection', method: 'benchmarkMetrics' },
      { name: 'Distributed Tracing', method: 'benchmarkTracing' },
      { name: 'Log Generation', method: 'benchmarkLogging' },
      { name: 'Alert Processing', method: 'benchmarkAlerting' },
      { name: 'Anomaly Detection', method: 'benchmarkAnomalyDetection' },
      { name: 'Dashboard Updates', method: 'benchmarkDashboards' },
      { name: 'System Integration', method: 'benchmarkIntegration' }
    ];

    for (const benchmark of benchmarks) {
      await this.runBenchmarkTest(benchmark);
    }

    this.generateSummary();
    await this.saveResults();
    await this.cleanup();
  }

  async initializeSystem() {
    console.log('🏗️  Initializing observability system for benchmarking...');
    
    this.observability = getAdvancedObservabilitySystem({
      serviceName: 'merajutasa-benchmark',
      environment: 'benchmark',
      enableAllComponents: true,
      autoCorrelation: false, // Disable for cleaner benchmarks
      dashboardPort: 3001
    });

    await this.observability.initialize();
    console.log('✅ System initialized\n');
  }

  async runBenchmarkTest(benchmark) {
    console.log(`\n🔄 Running ${benchmark.name} Benchmark...`);
    console.log('─'.repeat(50));
    
    try {
      const result = await this[benchmark.method]();
      this.results.benchmarks[benchmark.name] = result;
      
      console.log(`✅ ${benchmark.name}: ${result.ops_per_second.toLocaleString()} ops/sec`);
      console.log(`   Latency: P50=${result.latency.p50}ms, P95=${result.latency.p95}ms, P99=${result.latency.p99}ms`);
      console.log(`   Memory: ${result.memory_usage.toFixed(2)}MB`);
      
    } catch (error) {
      console.error(`❌ ${benchmark.name} failed:`, error.message);
      this.results.benchmarks[benchmark.name] = { error: error.message };
    }
  }

  async benchmarkMetrics() {
    const iterations = 1000;
    const latencies = [];
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const iterationStart = performance.now();
      
      // Generate various metric types
      this.observability.recordUnifiedMetric('benchmark_counter', 1, {
        iteration: i,
        type: 'counter'
      });
      
      this.observability.recordUnifiedMetric('benchmark_gauge', Math.random() * 100, {
        iteration: i,
        type: 'gauge'
      });
      
      const metrics = this.observability.components.get('metrics');
      if (metrics) {
        metrics.recordHttpRequest('GET', '/api/test', 200, Math.random() * 100);
        metrics.recordSigningOperation('sign', 'success', 'rsa', Math.random() * 50);
        metrics.recordChainOperation('append', 'success', { integrityScore: 99 });
      }
      
      const iterationEnd = performance.now();
      latencies.push(iterationEnd - iterationStart);
    }
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    const totalDuration = endTime - startTime;
    const opsPerSecond = (iterations / totalDuration) * 1000;
    
    return {
      ops_per_second: Math.round(opsPerSecond),
      total_duration_ms: totalDuration.toFixed(2),
      iterations,
      latency: this.calculateLatencyStats(latencies),
      memory_usage: endMemory - startMemory,
      throughput_metrics: {
        http_requests: iterations,
        signing_operations: iterations,
        chain_operations: iterations,
        custom_metrics: iterations * 2
      }
    };
  }

  async benchmarkTracing() {
    const iterations = 500;
    const latencies = [];
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const iterationStart = performance.now();
      
      await this.observability.traceBusinessOperation(`benchmark_trace_${i}`, async (span) => {
        // Simulate nested operations
        const tracing = this.observability.components.get('tracing');
        if (tracing && span) {
          const childSpan = tracing.createChildSpan('child_operation', {
            attributes: { child_id: i }
          });
          
          if (childSpan) {
            childSpan.setAttributes({
              'operation.type': 'benchmark',
              'iteration': i
            });
            childSpan.end();
          }
        }
        
        return { success: true, iteration: i };
      }, {
        operationId: `bench_${i}`,
        requestId: `req_${i}`
      });
      
      const iterationEnd = performance.now();
      latencies.push(iterationEnd - iterationStart);
    }
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    const totalDuration = endTime - startTime;
    const opsPerSecond = (iterations / totalDuration) * 1000;
    
    return {
      ops_per_second: Math.round(opsPerSecond),
      total_duration_ms: totalDuration.toFixed(2),
      iterations,
      latency: this.calculateLatencyStats(latencies),
      memory_usage: endMemory - startMemory,
      trace_details: {
        total_spans: iterations * 2, // Parent + child spans
        correlation_ids: iterations,
        span_attributes: iterations * 3
      }
    };
  }

  async benchmarkLogging() {
    const iterations = 2000;
    const latencies = [];
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    const logging = this.observability.components.get('logging');
    if (!logging) {
      throw new Error('Logging component not available');
    }
    
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const iterationStart = performance.now();
      
      // Generate various log levels and types
      const logTypes = ['info', 'warn', 'error', 'debug'];
      const logType = logTypes[i % logTypes.length];
      
      logging.log(logType, `Benchmark log entry ${i}`, {
        iteration: i,
        benchmark: true,
        timestamp: Date.now(),
        requestId: `req_${i}`,
        userId: `user_${i % 100}`
      }, {
        correlationId: `corr_${i}`,
        logType: 'application'
      });
      
      // Occasionally log structured events
      if (i % 10 === 0) {
        logging.audit('benchmark_action', 'system', 'test_resource', 'success', {
          iteration: i,
          actionType: 'benchmark'
        });
      }
      
      const iterationEnd = performance.now();
      latencies.push(iterationEnd - iterationStart);
    }
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    const totalDuration = endTime - startTime;
    const opsPerSecond = (iterations / totalDuration) * 1000;
    
    return {
      ops_per_second: Math.round(opsPerSecond),
      total_duration_ms: totalDuration.toFixed(2),
      iterations,
      latency: this.calculateLatencyStats(latencies),
      memory_usage: endMemory - startMemory,
      log_details: {
        total_entries: iterations,
        audit_entries: Math.floor(iterations / 10),
        structured_entries: iterations,
        log_levels: {
          info: Math.floor(iterations / 4),
          warn: Math.floor(iterations / 4),
          error: Math.floor(iterations / 4),
          debug: Math.floor(iterations / 4)
        }
      }
    };
  }

  async benchmarkAlerting() {
    const iterations = 300;
    const latencies = [];
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    const alerting = this.observability.components.get('alerting');
    if (!alerting) {
      throw new Error('Alerting component not available');
    }
    
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const iterationStart = performance.now();
      
      // Create test alert rule
      const ruleName = `benchmark_alert_${i}`;
      alerting.addAlertRule(ruleName, {
        name: `Benchmark Alert ${i}`,
        condition: () => true, // Always trigger for benchmark
        severity: i % 2 === 0 ? 'medium' : 'high',
        description: `Benchmark alert ${i}`,
        channels: ['console']
      });
      
      // Generate metrics that trigger alerts
      const testMetrics = {
        error_rate: i % 3 === 0 ? 15 : 2, // Occasionally high
        avg_response_time: i % 5 === 0 ? 2000 : 150, // Occasionally slow
        system_health_score: i % 7 === 0 ? 50 : 95 // Occasionally unhealthy
      };
      
      alerting.evaluateMetrics(testMetrics);
      
      const iterationEnd = performance.now();
      latencies.push(iterationEnd - iterationStart);
    }
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    const totalDuration = endTime - startTime;
    const opsPerSecond = (iterations / totalDuration) * 1000;
    
    const activeAlerts = alerting.getActiveAlerts();
    
    return {
      ops_per_second: Math.round(opsPerSecond),
      total_duration_ms: totalDuration.toFixed(2),
      iterations,
      latency: this.calculateLatencyStats(latencies),
      memory_usage: endMemory - startMemory,
      alert_details: {
        rules_created: iterations,
        alerts_triggered: activeAlerts.length,
        evaluations_performed: iterations,
        channels_used: ['console']
      }
    };
  }

  async benchmarkAnomalyDetection() {
    const iterations = 200;
    const latencies = [];
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    const anomalyDetection = this.observability.components.get('anomalyDetection');
    if (!anomalyDetection) {
      throw new Error('Anomaly detection component not available');
    }
    
    const startTime = performance.now();
    
    // Build baseline first
    for (let i = 0; i < 50; i++) {
      const baselineMetrics = {
        avg_response_time: 100 + Math.random() * 20,
        error_rate: 1 + Math.random() * 2,
        throughput: 50 + Math.random() * 10,
        cpu_usage_percent: 40 + Math.random() * 10,
        memory_usage_percent: 60 + Math.random() * 10
      };
      
      await anomalyDetection.detectAnomalies(baselineMetrics);
    }
    
    // Now run benchmark with anomaly detection
    for (let i = 0; i < iterations; i++) {
      const iterationStart = performance.now();
      
      // Generate metrics with occasional anomalies
      const metrics = {
        avg_response_time: i % 10 === 0 ? 500 : 100 + Math.random() * 20,
        error_rate: i % 15 === 0 ? 10 : 1 + Math.random() * 2,
        throughput: i % 8 === 0 ? 20 : 50 + Math.random() * 10,
        cpu_usage_percent: i % 12 === 0 ? 90 : 40 + Math.random() * 10,
        memory_usage_percent: i % 20 === 0 ? 95 : 60 + Math.random() * 10,
        signing_failures: i % 25 === 0 ? 20 : Math.floor(Math.random() * 3),
        chain_integrity_score: i % 30 === 0 ? 85 : 95 + Math.random() * 5
      };
      
      await anomalyDetection.detectAnomalies(metrics);
      
      const iterationEnd = performance.now();
      latencies.push(iterationEnd - iterationStart);
    }
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    const totalDuration = endTime - startTime;
    const opsPerSecond = (iterations / totalDuration) * 1000;
    
    const currentAnomalies = anomalyDetection.getCurrentAnomalies();
    const stats = anomalyDetection.getAnomalyStatistics();
    
    return {
      ops_per_second: Math.round(opsPerSecond),
      total_duration_ms: totalDuration.toFixed(2),
      iterations,
      latency: this.calculateLatencyStats(latencies),
      memory_usage: endMemory - startMemory,
      anomaly_details: {
        baseline_iterations: 50,
        detection_iterations: iterations,
        anomalies_detected: currentAnomalies.length,
        statistical_detectors: stats.detectors.statistical,
        business_detectors: stats.detectors.business
      }
    };
  }

  async benchmarkDashboards() {
    const iterations = 400;
    const latencies = [];
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    const dashboards = this.observability.components.get('dashboards');
    if (!dashboards) {
      throw new Error('Dashboards component not available');
    }
    
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const iterationStart = performance.now();
      
      // Generate metrics updates for dashboards
      const metricsUpdate = {
        system_health_score: 80 + Math.random() * 20,
        avg_response_time: 100 + Math.random() * 100,
        error_rate: Math.random() * 5,
        requests_per_second: 40 + Math.random() * 30,
        cpu_usage_percent: 50 + Math.random() * 30,
        memory_usage_percent: 60 + Math.random() * 20,
        cache_hit_ratio: 0.8 + Math.random() * 0.2,
        active_users: Math.floor(Math.random() * 1000)
      };
      
      dashboards.updateMetrics(metricsUpdate);
      
      // Occasionally update alerts
      if (i % 5 === 0) {
        const alertUpdate = [{
          id: `alert_${i}`,
          name: `Test Alert ${i}`,
          severity: 'medium',
          status: 'active',
          timestamp: new Date().toISOString()
        }];
        
        dashboards.updateAlerts(alertUpdate);
      }
      
      const iterationEnd = performance.now();
      latencies.push(iterationEnd - iterationStart);
    }
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    const totalDuration = endTime - startTime;
    const opsPerSecond = (iterations / totalDuration) * 1000;
    
    const healthCheck = await dashboards.healthCheck();
    
    return {
      ops_per_second: Math.round(opsPerSecond),
      total_duration_ms: totalDuration.toFixed(2),
      iterations,
      latency: this.calculateLatencyStats(latencies),
      memory_usage: endMemory - startMemory,
      dashboard_details: {
        metrics_updates: iterations,
        alert_updates: Math.floor(iterations / 5),
        dashboards: healthCheck.dashboards,
        widgets: healthCheck.widgets,
        real_time_streaming: healthCheck.realTimeStreaming
      }
    };
  }

  async benchmarkIntegration() {
    const iterations = 100;
    const latencies = [];
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const iterationStart = performance.now();
      
      // Test full integration: trace → metrics → logs → alerts → dashboards
      await this.observability.traceBusinessOperation(`integration_test_${i}`, async (span) => {
        // Record metrics
        this.observability.recordUnifiedMetric('integration_test_metric', Math.random() * 100, {
          testId: i,
          logLevel: 'info'
        });
        
        // Generate log
        const logging = this.observability.components.get('logging');
        if (logging) {
          logging.info(`Integration test ${i} executed`, {
            testId: i,
            traceId: span?.spanContext?.()?.traceId
          });
        }
        
        // Trigger alert condition occasionally
        if (i % 10 === 0) {
          this.observability.createUnifiedAlert(
            `integration_test_alert_${i}`,
            'medium',
            `Integration test alert ${i}`,
            { testId: i, channels: ['console'] }
          );
        }
        
        return { success: true, testId: i };
      }, {
        operationId: `integration_${i}`,
        testType: 'full_integration'
      });
      
      const iterationEnd = performance.now();
      latencies.push(iterationEnd - iterationStart);
    }
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    const totalDuration = endTime - startTime;
    const opsPerSecond = (iterations / totalDuration) * 1000;
    
    return {
      ops_per_second: Math.round(opsPerSecond),
      total_duration_ms: totalDuration.toFixed(2),
      iterations,
      latency: this.calculateLatencyStats(latencies),
      memory_usage: endMemory - startMemory,
      integration_details: {
        traces_created: iterations,
        metrics_recorded: iterations,
        log_entries: iterations,
        alerts_created: Math.floor(iterations / 10),
        cross_component_operations: iterations * 4
      }
    };
  }

  calculateLatencyStats(latencies) {
    const sorted = latencies.sort((a, b) => a - b);
    
    return {
      min: sorted[0].toFixed(2),
      max: sorted[sorted.length - 1].toFixed(2),
      p50: sorted[Math.floor(sorted.length * 0.5)].toFixed(2),
      p95: sorted[Math.floor(sorted.length * 0.95)].toFixed(2),
      p99: sorted[Math.floor(sorted.length * 0.99)].toFixed(2),
      avg: (sorted.reduce((sum, val) => sum + val, 0) / sorted.length).toFixed(2)
    };
  }

  generateSummary() {
    console.log('\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 OBSERVABILITY PERFORMANCE BENCHMARK RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const benchmarks = Object.entries(this.results.benchmarks)
      .filter(([name, result]) => !result.error);
    
    const totalOpsPerSec = benchmarks.reduce((sum, [name, result]) => sum + result.ops_per_second, 0);
    const avgLatency = benchmarks.reduce((sum, [name, result]) => sum + parseFloat(result.latency.avg), 0) / benchmarks.length;
    const totalMemoryUsage = benchmarks.reduce((sum, [name, result]) => sum + result.memory_usage, 0);
    
    console.log(`🎯 Overall Performance: ${totalOpsPerSec.toLocaleString()} total ops/sec`);
    console.log(`⚡ Average Latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`💾 Total Memory Usage: ${totalMemoryUsage.toFixed(2)}MB`);
    console.log(`✅ Successful Benchmarks: ${benchmarks.length}/${Object.keys(this.results.benchmarks).length}`);
    
    console.log('\n🏆 TOP PERFORMERS:');
    benchmarks
      .sort(([, a], [, b]) => b.ops_per_second - a.ops_per_second)
      .slice(0, 3)
      .forEach(([name, result], index) => {
        const medal = ['🥇', '🥈', '🥉'][index];
        console.log(`  ${medal} ${name}: ${result.ops_per_second.toLocaleString()} ops/sec`);
      });
    
    console.log('\n📈 SCALABILITY ASSESSMENT:');
    if (totalOpsPerSec > 10000) {
      console.log('  🚀 EXCELLENT: High-throughput production ready');
    } else if (totalOpsPerSec > 5000) {
      console.log('  ✅ GOOD: Production ready for moderate loads');
    } else if (totalOpsPerSec > 1000) {
      console.log('  ⚠️  FAIR: Suitable for low-to-medium loads');
    } else {
      console.log('  ❌ POOR: Performance optimization required');
    }
    
    this.results.summary = {
      total_ops_per_sec: totalOpsPerSec,
      avg_latency_ms: parseFloat(avgLatency.toFixed(2)),
      total_memory_mb: parseFloat(totalMemoryUsage.toFixed(2)),
      successful_benchmarks: benchmarks.length,
      total_benchmarks: Object.keys(this.results.benchmarks).length,
      performance_grade: this.getPerformanceGrade(totalOpsPerSec)
    };
    
    console.log('\n🔧 OPTIMIZATION RECOMMENDATIONS:');
    this.generateOptimizationRecommendations();
  }

  getPerformanceGrade(totalOpsPerSec) {
    if (totalOpsPerSec > 10000) return 'A';
    if (totalOpsPerSec > 5000) return 'B';
    if (totalOpsPerSec > 1000) return 'C';
    return 'D';
  }

  generateOptimizationRecommendations() {
    const benchmarks = Object.entries(this.results.benchmarks)
      .filter(([name, result]) => !result.error);
    
    benchmarks.forEach(([name, result]) => {
      if (result.ops_per_second < 1000) {
        console.log(`  ⚡ ${name}: Consider performance optimization (${result.ops_per_second} ops/sec)`);
      }
      
      if (result.memory_usage > 50) {
        console.log(`  💾 ${name}: High memory usage detected (${result.memory_usage.toFixed(2)}MB)`);
      }
      
      if (parseFloat(result.latency.p99) > 100) {
        console.log(`  🐌 ${name}: High P99 latency (${result.latency.p99}ms)`);
      }
    });
    
    console.log('  📊 Monitor production performance with real workloads');
    console.log('  🔄 Consider horizontal scaling for higher throughput');
    console.log('  📈 Implement performance monitoring and alerting');
  }

  async saveResults() {
    try {
      const artifactsDir = path.resolve('artifacts');
      await fs.mkdir(artifactsDir, { recursive: true });
      
      const resultsPath = path.join(artifactsDir, 'observability-benchmark-results.json');
      await fs.writeFile(resultsPath, JSON.stringify(this.results, null, 2));
      
      console.log(`\n💾 Benchmark results saved to: ${resultsPath}`);
    } catch (error) {
      console.error('Failed to save benchmark results:', error.message);
    }
  }

  async cleanup() {
    if (this.observability) {
      console.log('\n🧹 Cleaning up benchmark resources...');
      await this.observability.shutdown();
      console.log('✅ Cleanup completed');
    }
  }
}

// Main execution
async function main() {
  const benchmark = new ObservabilityBenchmark();
  
  try {
    await benchmark.runBenchmark();
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Benchmark interrupted by user');
  process.exit(0);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ObservabilityBenchmark;