/**
 * Frontend Performance Test Tool (Lightweight)
 * Alternative to lighthouse for environments without Chrome
 * Tests frontend performance through API endpoints and basic checks
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FrontendPerformanceTest {
  constructor(options = {}) {
    this.config = {
      // Test targets
      baseUrl: options.baseUrl || 'http://localhost:4620',
      uiPath: options.uiPath || '/ui/',
      apiEndpoints: options.apiEndpoints || [
        '/health',
        '/kpi/h1',
        '/under-served',
        '/weekly-trends',
        '/monthly-rollup',
      ],

      // Performance thresholds
      maxResponseTime: options.maxResponseTime || 500, // 500ms
      maxApiResponseTime: options.maxApiResponseTime || 200, // 200ms
      minApiSuccessRate: options.minApiSuccessRate || 95, // 95%

      // Test configuration
      iterations: options.iterations || 5,
      timeout: options.timeout || 5000, // 5 seconds
      userAgent: options.userAgent || 'MerajutASA-PerformanceTest/1.0',

      // Output settings
      outputPath: options.outputPath || 'artifacts/frontend-performance',
      saveReports: options.saveReports !== false,

      ...options,
    };

    this.results = {
      ui: {},
      api: {},
      summary: {},
      errors: [],
    };
  }

  /**
   * Run comprehensive frontend performance test
   */
  async runPerformanceTest() {
    console.log('🚀 Starting Frontend Performance Test...');

    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory();

      // Test UI accessibility
      console.log('🌐 Testing UI accessibility...');
      await this.testUIAccessibility();

      // Test API performance
      console.log('⚡ Testing API performance...');
      await this.testAPIPerformance();

      // Test frontend assets
      console.log('📦 Testing frontend assets...');
      await this.testFrontendAssets();

      // Generate performance report
      const report = await this.generatePerformanceReport();

      // Save reports if enabled
      if (this.config.saveReports) {
        await this.saveReports(report);
      }

      console.log('✅ Frontend performance test completed');
      return report;

    } catch (error) {
      console.error('❌ Frontend performance test failed:', error.message);
      this.results.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Test UI accessibility and basic functionality
   */
  async testUIAccessibility() {
    const uiUrl = `${this.config.baseUrl}${this.config.uiPath}`;
    const startTime = Date.now();

    try {
      const response = await this.fetchWithTimeout(uiUrl, {
        method: 'GET',
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (!response.ok) {
        throw new Error(`UI request failed with status ${response.status}`);
      }

      const content = await response.text();

      this.results.ui = {
        accessible: true,
        responseTime,
        statusCode: response.status,
        contentLength: content.length,
        hasContent: content.length > 0,
        performance: {
          grade: this.getResponseTimeGrade(responseTime),
          withinThreshold: responseTime <= this.config.maxResponseTime,
        },
        contentAnalysis: this.analyzeUIContent(content),
        headers: Object.fromEntries(response.headers.entries()),
      };

    } catch (error) {
      this.results.ui = {
        accessible: false,
        error: error.message,
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Test API endpoint performance
   */
  async testAPIPerformance() {
    const apiResults = {};

    for (const endpoint of this.config.apiEndpoints) {
      console.log(`  📊 Testing ${endpoint}...`);
      apiResults[endpoint] = await this.testSingleEndpoint(endpoint);
    }

    // Calculate overall API performance
    const allResults = Object.values(apiResults);
    const successfulResults = allResults.filter(r => r.success);

    this.results.api = {
      endpoints: apiResults,
      summary: {
        totalEndpoints: allResults.length,
        successfulEndpoints: successfulResults.length,
        successRate: Math.round((successfulResults.length / allResults.length) * 100),
        avgResponseTime: successfulResults.length > 0
          ? Math.round(successfulResults.reduce((sum, r) => sum + r.avgResponseTime, 0) / successfulResults.length)
          : 0,
        performance: {
          grade: this.getAPIPerformanceGrade(successfulResults),
          meetsThresholds: this.checkAPIThresholds(successfulResults),
        },
      },
    };
  }

  /**
   * Test single API endpoint performance
   */
  async testSingleEndpoint(endpoint) {
    const url = `${this.config.baseUrl}${endpoint}`;
    const responseTimes = [];
    const errors = [];

    for (let i = 0; i < this.config.iterations; i++) {
      const startTime = Date.now();

      try {
        const response = await this.fetchWithTimeout(url, {
          method: 'GET',
          headers: {
            'User-Agent': this.config.userAgent,
            'Accept': 'application/json',
          },
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        if (!response.ok) {
          errors.push(`HTTP ${response.status}: ${response.statusText}`);
        }

      } catch (error) {
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
        errors.push(error.message);
      }
    }

    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
      : 0;

    const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    const successfulRequests = this.config.iterations - errors.length;

    return {
      endpoint,
      success: errors.length === 0,
      successRate: Math.round((successfulRequests / this.config.iterations) * 100),
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      responseTimes,
      errors,
      performance: {
        grade: this.getResponseTimeGrade(avgResponseTime),
        withinThreshold: avgResponseTime <= this.config.maxApiResponseTime,
      },
    };
  }

  /**
   * Test frontend assets (CSS, JS files)
   */
  async testFrontendAssets() {
    const assets = [
      '/ui/app.js',
      '/ui/index.html',
    ];

    const assetResults = {};

    for (const asset of assets) {
      const url = `${this.config.baseUrl}${asset}`;
      const startTime = Date.now();

      try {
        const response = await this.fetchWithTimeout(url, {
          method: 'GET',
          headers: {
            'User-Agent': this.config.userAgent,
          },
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const content = await response.text();

        assetResults[asset] = {
          accessible: response.ok,
          responseTime,
          contentLength: content.length,
          statusCode: response.status,
          mimeType: response.headers.get('content-type') || 'unknown',
        };

      } catch (error) {
        assetResults[asset] = {
          accessible: false,
          error: error.message,
          responseTime: Date.now() - startTime,
        };
      }
    }

    this.results.assets = assetResults;
  }

  /**
   * Analyze UI content for basic checks
   */
  analyzeUIContent(content) {
    return {
      hasTitle: /<title[^>]*>([^<]+)<\/title>/i.test(content),
      hasMetaViewport: /<meta[^>]*name=["\']viewport["\'][^>]*>/i.test(content),
      hasCSS: /<link[^>]*rel=["\']stylesheet["\'][^>]*>/i.test(content) || /<style[^>]*>/i.test(content),
      hasJavaScript: /<script[^>]*>/i.test(content),
      hasMainContent: /<main[^>]*>/i.test(content) || /<div[^>]*id=["\']main["\'][^>]*>/i.test(content),
      estimatedSize: content.length,
      hasEquityDashboard: /equity.*dashboard/i.test(content) || /kpi.*summary/i.test(content),
    };
  }

  /**
   * Get response time performance grade
   */
  getResponseTimeGrade(responseTime) {
    if (responseTime <= 100) {return 'A+';}
    if (responseTime <= 200) {return 'A';}
    if (responseTime <= 500) {return 'B+';}
    if (responseTime <= 1000) {return 'B';}
    if (responseTime <= 2000) {return 'C';}
    return 'D';
  }

  /**
   * Get API performance grade based on multiple endpoints
   */
  getAPIPerformanceGrade(results) {
    if (results.length === 0) {return 'F';}

    const avgResponseTime = results.reduce((sum, r) => sum + r.avgResponseTime, 0) / results.length;
    const avgSuccessRate = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;

    // Consider both response time and success rate
    if (avgResponseTime <= 100 && avgSuccessRate >= 98) {return 'A+';}
    if (avgResponseTime <= 200 && avgSuccessRate >= 95) {return 'A';}
    if (avgResponseTime <= 500 && avgSuccessRate >= 90) {return 'B+';}
    if (avgResponseTime <= 1000 && avgSuccessRate >= 85) {return 'B';}
    if (avgResponseTime <= 2000 && avgSuccessRate >= 75) {return 'C';}
    return 'D';
  }

  /**
   * Check if API results meet configured thresholds
   */
  checkAPIThresholds(results) {
    if (results.length === 0) {return false;}

    const avgResponseTime = results.reduce((sum, r) => sum + r.avgResponseTime, 0) / results.length;
    const avgSuccessRate = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;

    return avgResponseTime <= this.config.maxApiResponseTime &&
           avgSuccessRate >= this.config.minApiSuccessRate;
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport() {
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        config: this.config,
        testType: 'lightweight_frontend_performance',
      },
      ui: this.results.ui,
      api: this.results.api,
      assets: this.results.assets,
      summary: {
        overallGrade: this.calculateOverallGrade(),
        recommendations: this.generateRecommendations(),
        status: this.determineOverallStatus(),
      },
      errors: this.results.errors,
    };

    return report;
  }

  /**
   * Calculate overall performance grade
   */
  calculateOverallGrade() {
    const grades = [];

    if (this.results.ui?.performance?.grade) {
      grades.push(this.gradeToNumber(this.results.ui.performance.grade));
    }

    if (this.results.api?.summary?.performance?.grade) {
      grades.push(this.gradeToNumber(this.results.api.summary.performance.grade));
    }

    if (grades.length === 0) {return 'F';}

    const avgGrade = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
    return this.numberToGrade(avgGrade);
  }

  /**
   * Convert grade letter to number for calculation
   */
  gradeToNumber(grade) {
    const gradeMap = { 'A+': 4.3, 'A': 4.0, 'B+': 3.3, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0 };
    return gradeMap[grade] || 0.0;
  }

  /**
   * Convert number back to grade letter
   */
  numberToGrade(number) {
    if (number >= 4.2) {return 'A+';}
    if (number >= 3.8) {return 'A';}
    if (number >= 3.2) {return 'B+';}
    if (number >= 2.8) {return 'B';}
    if (number >= 1.8) {return 'C';}
    if (number >= 0.8) {return 'D';}
    return 'F';
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // UI recommendations
    if (this.results.ui?.responseTime > this.config.maxResponseTime) {
      recommendations.push({
        type: 'ui_performance',
        priority: 'high',
        message: `UI response time (${this.results.ui.responseTime}ms) exceeds threshold (${this.config.maxResponseTime}ms)`,
        action: 'Optimize HTML rendering and reduce initial page load time',
      });
    }

    // API recommendations
    if (this.results.api?.summary?.successRate < this.config.minApiSuccessRate) {
      recommendations.push({
        type: 'api_reliability',
        priority: 'critical',
        message: `API success rate (${this.results.api.summary.successRate}%) is below threshold (${this.config.minApiSuccessRate}%)`,
        action: 'Investigate API failures and improve error handling',
      });
    }

    if (this.results.api?.summary?.avgResponseTime > this.config.maxApiResponseTime) {
      recommendations.push({
        type: 'api_performance',
        priority: 'high',
        message: `API average response time (${this.results.api.summary.avgResponseTime}ms) exceeds threshold (${this.config.maxApiResponseTime}ms)`,
        action: 'Optimize database queries and implement caching',
      });
    }

    // Content recommendations
    if (this.results.ui?.contentAnalysis && !this.results.ui.contentAnalysis.hasMetaViewport) {
      recommendations.push({
        type: 'mobile_optimization',
        priority: 'medium',
        message: 'Missing viewport meta tag for mobile optimization',
        action: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to HTML head',
      });
    }

    return recommendations;
  }

  /**
   * Determine overall test status
   */
  determineOverallStatus() {
    if (this.results.errors.length > 0) {return 'ERROR';}

    const uiAccessible = this.results.ui?.accessible !== false;
    const apiHealthy = this.results.api?.summary?.successRate >= this.config.minApiSuccessRate;

    if (uiAccessible && apiHealthy) {return 'PASS';}
    if (uiAccessible || apiHealthy) {return 'PARTIAL';}
    return 'FAIL';
  }

  /**
   * Fetch with timeout support
   */
  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Save performance reports to files
   */
  async saveReports(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    // Save JSON report
    const jsonPath = path.join(this.config.outputPath, `frontend-performance-test-${timestamp}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
    console.log(`📄 Performance test report saved: ${jsonPath}`);

    // Save latest report
    const latestPath = path.join(this.config.outputPath, 'latest-frontend-performance-test.json');
    await fs.writeFile(latestPath, JSON.stringify(report, null, 2));
  }

  /**
   * Ensure output directory exists
   */
  async ensureOutputDirectory() {
    try {
      await fs.access(this.config.outputPath);
    } catch {
      await fs.mkdir(this.config.outputPath, { recursive: true });
    }
  }

  /**
   * Health check for performance testing capability
   */
  async healthCheck() {
    try {
      const healthUrl = `${this.config.baseUrl}/health`;
      const response = await this.fetchWithTimeout(healthUrl);

      return {
        status: 'healthy',
        baseUrl: this.config.baseUrl,
        healthEndpointAccessible: response.ok,
        timestamp: new Date().toISOString(),
        capabilities: {
          uiTesting: true,
          apiTesting: true,
          assetTesting: true,
          performanceAnalysis: true,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Static factory method
export function getFrontendPerformanceTest(options = {}) {
  return new FrontendPerformanceTest(options);
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new FrontendPerformanceTest({
    baseUrl: process.env.BASE_URL || 'http://localhost:4620',
  });

  const command = process.argv[2] || 'test';

  switch (command) {
  case 'test':
    await test.runPerformanceTest();
    break;
  case 'health':
    const health = await test.healthCheck();
    console.log('Health Check:', JSON.stringify(health, null, 2));
    break;
  default:
    console.log('Available commands: test, health');
    process.exit(1);
  }
}
