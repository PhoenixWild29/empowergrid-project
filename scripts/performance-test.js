#!/usr/bin/env node

/**
 * Performance Testing Script for EmpowerGRID
 *
 * This script runs comprehensive performance tests including:
 * - Bundle size analysis
 * - Memory usage monitoring
 * - API response time testing
 * - Component render performance
 * - Database query performance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

class PerformanceTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {},
    };
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }

  async runAllTests() {
    this.log('Starting comprehensive performance tests...');

    try {
      // Test 1: Bundle Size Analysis
      await this.testBundleSize();

      // Test 2: Memory Usage
      await this.testMemoryUsage();

      // Test 3: API Performance
      await this.testApiPerformance();

      // Test 4: Component Render Performance
      await this.testComponentPerformance();

      // Test 5: Database Performance
      await this.testDatabasePerformance();

      // Generate summary
      this.generateSummary();

      // Save results
      this.saveResults();

      this.log('Performance tests completed successfully!');
      return this.results;

    } catch (error) {
      this.log(`Performance tests failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testBundleSize() {
    this.log('Testing bundle size...');

    try {
      // Run Next.js build with bundle analyzer
      execSync('npm run build:analyze', { stdio: 'inherit' });

      // Read bundle analysis results
      const bundleReportPath = path.join(process.cwd(), '.next', 'analyze', 'client.html');

      if (fs.existsSync(bundleReportPath)) {
        const stats = fs.statSync(bundleReportPath);
        this.results.tests.bundleSize = {
          status: 'pass',
          bundleSize: stats.size,
          message: `Bundle analysis completed. Report size: ${(stats.size / 1024).toFixed(2)} KB`,
        };
      } else {
        this.results.tests.bundleSize = {
          status: 'warn',
          message: 'Bundle analysis report not found',
        };
      }

    } catch (error) {
      this.results.tests.bundleSize = {
        status: 'fail',
        error: error.message,
        message: 'Bundle size analysis failed',
      };
    }
  }

  async testMemoryUsage() {
    this.log('Testing memory usage...');

    try {
      // Make requests to health endpoint to trigger memory monitoring
      const healthResponses = [];

      for (let i = 0; i < 10; i++) {
        const response = await this.makeRequest('/api/monitoring/health');
        healthResponses.push(response);
        await this.sleep(100); // Small delay between requests
      }

      // Get memory metrics
      const metricsResponse = await this.makeRequest('/api/monitoring/metrics');
      const memoryUsage = metricsResponse?.memory;

      if (memoryUsage) {
        const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

        this.results.tests.memoryUsage = {
          status: heapUsedPercent > 90 ? 'fail' : heapUsedPercent > 80 ? 'warn' : 'pass',
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          percentage: heapUsedPercent,
          message: `Memory usage: ${heapUsedPercent.toFixed(1)}%`,
        };
      } else {
        this.results.tests.memoryUsage = {
          status: 'warn',
          message: 'Memory metrics not available',
        };
      }

    } catch (error) {
      this.results.tests.memoryUsage = {
        status: 'fail',
        error: error.message,
        message: 'Memory usage test failed',
      };
    }
  }

  async testApiPerformance() {
    this.log('Testing API performance...');

    const endpoints = [
      '/api/monitoring/health',
      '/api/monitoring/metrics',
      '/api/meter/latest',
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await this.makeRequest(endpoint);
        const responseTime = Date.now() - startTime;

        results.push({
          endpoint,
          responseTime,
          status: responseTime > 5000 ? 'slow' : responseTime > 2000 ? 'moderate' : 'fast',
          success: true,
        });
      } catch (error) {
        results.push({
          endpoint,
          error: error.message,
          success: false,
        });
      }
    }

    const avgResponseTime = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.success).length;

    const slowRequests = results.filter(r => r.status === 'slow').length;

    this.results.tests.apiPerformance = {
      status: slowRequests > 0 ? 'fail' : avgResponseTime > 2000 ? 'warn' : 'pass',
      endpoints: results,
      averageResponseTime: avgResponseTime,
      slowRequests,
      message: `API performance: ${avgResponseTime.toFixed(0)}ms avg, ${slowRequests} slow requests`,
    };
  }

  async testComponentPerformance() {
    this.log('Testing component render performance...');

    try {
      // This would require browser automation or React testing
      // For now, we'll check if performance hooks are working
      const metricsResponse = await this.makeRequest('/api/monitoring/metrics');
      const componentMetrics = metricsResponse?.performance?.components;

      if (componentMetrics) {
        const avgRenderTime = Object.values(componentMetrics).reduce((sum, comp) =>
          sum + (comp.averageRenderTime || 0), 0
        ) / Object.keys(componentMetrics).length;

        this.results.tests.componentPerformance = {
          status: avgRenderTime > 100 ? 'warn' : 'pass',
          averageRenderTime: avgRenderTime,
          components: Object.keys(componentMetrics).length,
          message: `Component render time: ${avgRenderTime.toFixed(2)}ms average`,
        };
      } else {
        this.results.tests.componentPerformance = {
          status: 'warn',
          message: 'Component performance metrics not available',
        };
      }

    } catch (error) {
      this.results.tests.componentPerformance = {
        status: 'fail',
        error: error.message,
        message: 'Component performance test failed',
      };
    }
  }

  async testDatabasePerformance() {
    this.log('Testing database performance...');

    try {
      // Test database operations through API
      const metricsResponse = await this.makeRequest('/api/monitoring/metrics');
      const dbMetrics = metricsResponse?.performance?.database;

      if (dbMetrics) {
        const avgQueryTime = Object.values(dbMetrics).reduce((sum, op) =>
          sum + (op.averageTime || 0), 0
        ) / Object.keys(dbMetrics).length;

        const errorRate = Object.values(dbMetrics).reduce((sum, op) =>
          sum + (op.errors || 0), 0
        ) / Object.values(dbMetrics).reduce((sum, op) => sum + (op.count || 0), 0);

        this.results.tests.databasePerformance = {
          status: avgQueryTime > 1000 ? 'fail' : avgQueryTime > 500 ? 'warn' : 'pass',
          averageQueryTime: avgQueryTime,
          errorRate: errorRate * 100,
          operations: Object.keys(dbMetrics).length,
          message: `DB performance: ${avgQueryTime.toFixed(2)}ms avg query time, ${(errorRate * 100).toFixed(1)}% error rate`,
        };
      } else {
        this.results.tests.databasePerformance = {
          status: 'warn',
          message: 'Database performance metrics not available',
        };
      }

    } catch (error) {
      this.results.tests.databasePerformance = {
        status: 'fail',
        error: error.message,
        message: 'Database performance test failed',
      };
    }
  }

  generateSummary() {
    const tests = this.results.tests;
    const passed = Object.values(tests).filter(t => t.status === 'pass').length;
    const warned = Object.values(tests).filter(t => t.status === 'warn').length;
    const failed = Object.values(tests).filter(t => t.status === 'fail').length;
    const total = Object.keys(tests).length;

    this.results.summary = {
      totalTests: total,
      passed,
      warned,
      failed,
      successRate: ((passed + warned) / total) * 100,
      overallStatus: failed > 0 ? 'fail' : warned > 0 ? 'warn' : 'pass',
      recommendations: this.generateRecommendations(),
    };
  }

  generateRecommendations() {
    const recommendations = [];
    const tests = this.results.tests;

    if (tests.bundleSize?.status === 'fail') {
      recommendations.push('Consider code splitting and lazy loading to reduce bundle size');
    }

    if (tests.memoryUsage?.status !== 'pass') {
      recommendations.push('Monitor memory leaks and consider garbage collection optimization');
    }

    if (tests.apiPerformance?.status !== 'pass') {
      recommendations.push('Optimize API endpoints and consider caching for slow responses');
    }

    if (tests.componentPerformance?.status !== 'pass') {
      recommendations.push('Optimize React components with memoization and reduce re-renders');
    }

    if (tests.databasePerformance?.status !== 'pass') {
      recommendations.push('Add database indexes and optimize queries for better performance');
    }

    return recommendations;
  }

  saveResults() {
    const outputPath = path.join(process.cwd(), 'performance-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    this.log(`Performance report saved to: ${outputPath}`);
  }

  async makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${endpoint}`;
      const req = https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            resolve(data); // Return raw data if not JSON
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
async function main() {
  const tester = new PerformanceTester();

  try {
    const results = await tester.runAllTests();
    console.log('\n=== Performance Test Summary ===');
    console.log(`Status: ${results.summary.overallStatus.toUpperCase()}`);
    console.log(`Tests: ${results.summary.passed} passed, ${results.summary.warned} warned, ${results.summary.failed} failed`);
    console.log(`Success Rate: ${results.summary.successRate.toFixed(1)}%`);

    if (results.summary.recommendations.length > 0) {
      console.log('\nRecommendations:');
      results.summary.recommendations.forEach(rec => console.log(`- ${rec}`));
    }

    process.exit(results.summary.overallStatus === 'pass' ? 0 : 1);
  } catch (error) {
    console.error('Performance testing failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = PerformanceTester;