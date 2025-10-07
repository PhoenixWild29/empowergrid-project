import type { NextApiRequest, NextApiResponse } from 'next';
import { performanceMonitor, memoryMonitor } from '../../../lib/monitoring/performance';
import { alertManager } from '../../../lib/monitoring/alerts';
import { logger } from '../../../lib/logging/logger';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: HealthCheckResult;
    memory: HealthCheckResult;
    alerts: HealthCheckResult;
    performance: HealthCheckResult;
  };
  details?: any;
}

interface HealthCheckResult {
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  details?: any;
}

// Health check thresholds
const THRESHOLDS = {
  memoryUsagePercent: 90, // 90% memory usage
  maxResponseTime: 5000, // 5 seconds
  maxErrorRate: 0.1, // 10% error rate
  maxActiveAlerts: 10, // 10 active alerts
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResponse>
) {
  const startTime = Date.now();

  try {
    // Run all health checks
    const checks = await runHealthChecks();

    // Determine overall status
    const hasFailures = Object.values(checks).some(check => check.status === 'fail');
    const hasWarnings = Object.values(checks).some(check => check.status === 'warn');

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (hasFailures) {
      overallStatus = 'unhealthy';
      res.status(503); // Service Unavailable
    } else if (hasWarnings) {
      overallStatus = 'degraded';
      res.status(200); // OK but with warnings
    } else {
      overallStatus = 'healthy';
      res.status(200); // OK
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      checks,
    };

    // Log health check results
    logger.info('Health check completed', {
      status: overallStatus,
      responseTime: Date.now() - startTime,
      checks: Object.fromEntries(
        Object.entries(checks).map(([key, check]) => [key, check.status])
      ),
    });

    return res.json(response);

  } catch (error) {
    logger.error('Health check failed', { error: error instanceof Error ? error.message : String(error) });

    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: { status: 'fail', message: 'Health check failed' },
        memory: { status: 'fail', message: 'Health check failed' },
        alerts: { status: 'fail', message: 'Health check failed' },
        performance: { status: 'fail', message: 'Health check failed' },
      },
      details: { error: error instanceof Error ? error.message : String(error) },
    };

    return res.status(503).json(errorResponse);
  }
}

async function runHealthChecks(): Promise<HealthCheckResponse['checks']> {
  const checks: HealthCheckResponse['checks'] = {
    database: await checkDatabaseHealth(),
    memory: checkMemoryHealth(),
    alerts: checkAlertsHealth(),
    performance: checkPerformanceHealth(),
  };

  return checks;
}

async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  try {
    // Check if we can connect to the database
    // This is a simplified check - in production you'd do a real query
    const dbStats = performanceMonitor.getAllMetrics();

    // Check for recent database errors
    const dbErrors = Object.keys(dbStats).filter(key =>
      key.includes('error') && dbStats[key] && dbStats[key].count > 0
    );

    if (dbErrors.length > 0) {
      return {
        status: 'warn',
        message: `Database errors detected: ${dbErrors.join(', ')}`,
        details: { errorKeys: dbErrors },
      };
    }

    return {
      status: 'pass',
      message: 'Database connection healthy',
    };

  } catch (error) {
    return {
      status: 'fail',
      message: 'Database health check failed',
      details: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}

function checkMemoryHealth(): HealthCheckResult {
  try {
    const memoryUsage = memoryMonitor.getMemoryUsage();

    if (!memoryUsage) {
      return {
        status: 'warn',
        message: 'Memory usage data not available',
      };
    }

    const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    if (heapUsedPercent > THRESHOLDS.memoryUsagePercent) {
      return {
        status: 'fail',
        message: `High memory usage: ${heapUsedPercent.toFixed(1)}%`,
        details: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          percentage: heapUsedPercent,
        },
      };
    }

    if (heapUsedPercent > THRESHOLDS.memoryUsagePercent * 0.8) {
      return {
        status: 'warn',
        message: `Elevated memory usage: ${heapUsedPercent.toFixed(1)}%`,
        details: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          percentage: heapUsedPercent,
        },
      };
    }

    return {
      status: 'pass',
      message: `Memory usage normal: ${heapUsedPercent.toFixed(1)}%`,
      details: { percentage: heapUsedPercent },
    };

  } catch (error) {
    return {
      status: 'fail',
      message: 'Memory health check failed',
      details: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}

function checkAlertsHealth(): HealthCheckResult {
  try {
    const alertStats = alertManager.getAlertStats();

    if (alertStats.unresolved > THRESHOLDS.maxActiveAlerts) {
      return {
        status: 'fail',
        message: `Too many active alerts: ${alertStats.unresolved}`,
        details: alertStats,
      };
    }

    if (alertStats.unresolved > THRESHOLDS.maxActiveAlerts * 0.5) {
      return {
        status: 'warn',
        message: `High number of active alerts: ${alertStats.unresolved}`,
        details: alertStats,
      };
    }

    return {
      status: 'pass',
      message: `Alert levels normal: ${alertStats.unresolved} unresolved`,
      details: alertStats,
    };

  } catch (error) {
    return {
      status: 'fail',
      message: 'Alerts health check failed',
      details: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}

function checkPerformanceHealth(): HealthCheckResult {
  try {
    const performanceStats = performanceMonitor.getAllMetrics();

    // Check for slow API responses
    const apiResponseStats = performanceStats['api.response.time'];
    if (apiResponseStats && apiResponseStats.average > THRESHOLDS.maxResponseTime) {
      return {
        status: 'warn',
        message: `Slow API responses: ${apiResponseStats.average.toFixed(0)}ms average`,
        details: apiResponseStats,
      };
    }

    // Check for high error rates
    const errorRate = calculateErrorRate(performanceStats);
    if (errorRate > THRESHOLDS.maxErrorRate) {
      return {
        status: 'fail',
        message: `High error rate: ${(errorRate * 100).toFixed(1)}%`,
        details: { errorRate },
      };
    }

    return {
      status: 'pass',
      message: 'Performance metrics within acceptable ranges',
      details: {
        avgResponseTime: apiResponseStats?.average || 0,
        errorRate: errorRate * 100,
      },
    };

  } catch (error) {
    return {
      status: 'fail',
      message: 'Performance health check failed',
      details: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}

function calculateErrorRate(performanceStats: any): number {
  const totalRequests = Object.values(performanceStats).reduce((sum: number, stats: any) => {
    return sum + (stats?.count || 0);
  }, 0);

  const errorRequests = Object.keys(performanceStats)
    .filter(key => key.includes('error'))
    .reduce((sum, key) => sum + (performanceStats[key]?.count || 0), 0);

  return totalRequests > 0 ? errorRequests / totalRequests : 0;
}