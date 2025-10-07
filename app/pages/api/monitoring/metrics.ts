import type { NextApiRequest, NextApiResponse } from 'next';
import {
  performanceMonitor,
  databasePerformanceMonitor,
  apiPerformanceMonitor,
  componentPerformanceMonitor,
  memoryMonitor
} from '../../../lib/monitoring/performance';
import { alertManager } from '../../../lib/monitoring/alerts';
import { enhancedLogger } from '../../../lib/logging/logger';
import { memoryCache, apiResponseCache, queryCache } from '../../../lib/cache/cache';

// Prometheus-compatible metrics endpoint
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const format = req.query.format as string || 'json';

    // Gather all metrics
    const metrics = await gatherMetrics();

    if (format === 'prometheus') {
      // Return Prometheus format
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(formatPrometheus(metrics));
    }

    // Return JSON format
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(metrics);

  } catch (error) {
    console.error('Metrics collection error:', error);
    return res.status(500).json({ error: 'Failed to collect metrics' });
  }
}

async function gatherMetrics() {
  const now = Date.now();

  // Performance metrics
  const performanceMetrics = performanceMonitor.getAllMetrics();
  const memoryUsage = memoryMonitor.getMemoryUsage();

  // Alert metrics
  const alertStats = alertManager.getAlertStats();

  // Cache metrics
  const cacheMetrics = {
    memory: memoryCache.getStats(),
    api: apiResponseCache.getStats(),
    query: queryCache.getStats(),
  };

  // Log metrics
  const logStats = enhancedLogger.getLogStats();

  // System metrics
  const systemMetrics = {
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    memory: memoryUsage,
  };

  return {
    timestamp: now,
    collection_time: new Date(now).toISOString(),
    performance: performanceMetrics,
    alerts: alertStats,
    cache: cacheMetrics,
    logs: logStats,
    system: systemMetrics,
  };
}

function formatPrometheus(metrics: any): string {
  const lines: string[] = [];

  // Add HELP and TYPE comments for Prometheus
  lines.push('# HELP empowergrid_performance_metrics Performance monitoring metrics');
  lines.push('# TYPE empowergrid_performance_metrics gauge');

  // Performance metrics
  if (metrics.performance) {
    Object.entries(metrics.performance).forEach(([key, stats]: [string, any]) => {
      if (stats && typeof stats === 'object') {
        lines.push(`empowergrid_performance_${key}_count{metric="${key}"} ${stats.count || 0}`);
        lines.push(`empowergrid_performance_${key}_average{metric="${key}"} ${stats.average || 0}`);
        lines.push(`empowergrid_performance_${key}_min{metric="${key}"} ${stats.min || 0}`);
        lines.push(`empowergrid_performance_${key}_max{metric="${key}"} ${stats.max || 0}`);
        lines.push(`empowergrid_performance_${key}_p95{metric="${key}"} ${stats.p95 || 0}`);
        lines.push(`empowergrid_performance_${key}_p99{metric="${key}"} ${stats.p99 || 0}`);
      }
    });
  }

  // Alert metrics
  lines.push('# HELP empowergrid_alerts_total Total number of alerts');
  lines.push('# TYPE empowergrid_alerts_total gauge');
  lines.push(`empowergrid_alerts_total ${metrics.alerts?.total || 0}`);

  lines.push('# HELP empowergrid_alerts_unresolved Number of unresolved alerts');
  lines.push('# TYPE empowergrid_alerts_unresolved gauge');
  lines.push(`empowergrid_alerts_unresolved ${metrics.alerts?.unresolved || 0}`);

  lines.push('# HELP empowergrid_alerts_unacknowledged Number of unacknowledged alerts');
  lines.push('# TYPE empowergrid_alerts_unacknowledged gauge');
  lines.push(`empowergrid_alerts_unacknowledged ${metrics.alerts?.unacknowledged || 0}`);

  // Cache metrics
  lines.push('# HELP empowergrid_cache_hit_rate Cache hit rate percentage');
  lines.push('# TYPE empowergrid_cache_hit_rate gauge');
  lines.push(`empowergrid_cache_memory_hit_rate ${metrics.cache?.memory?.hitRate || 0}`);
  lines.push(`empowergrid_cache_api_hit_rate ${metrics.cache?.api?.hitRate || 0}`);
  lines.push(`empowergrid_cache_query_hit_rate ${metrics.cache?.query?.hitRate || 0}`);

  lines.push('# HELP empowergrid_cache_size Cache size in entries');
  lines.push('# TYPE empowergrid_cache_size gauge');
  lines.push(`empowergrid_cache_memory_size ${metrics.cache?.memory?.size || 0}`);
  lines.push(`empowergrid_cache_api_size ${metrics.cache?.api?.size || 0}`);
  lines.push(`empowergrid_cache_query_size ${metrics.cache?.query?.size || 0}`);

  // Memory metrics
  if (metrics.system?.memory) {
    lines.push('# HELP empowergrid_memory_usage_bytes Memory usage in bytes');
    lines.push('# TYPE empowergrid_memory_usage_bytes gauge');
    lines.push(`empowergrid_memory_heap_used_bytes ${metrics.system.memory.heapUsed || 0}`);
    lines.push(`empowergrid_memory_heap_total_bytes ${metrics.system.memory.heapTotal || 0}`);
    lines.push(`empowergrid_memory_external_bytes ${metrics.system.memory.external || 0}`);
    lines.push(`empowergrid_memory_rss_bytes ${metrics.system.memory.rss || 0}`);
  }

  // Log metrics
  lines.push('# HELP empowergrid_logs_total Total number of log entries');
  lines.push('# TYPE empowergrid_logs_total gauge');
  lines.push(`empowergrid_logs_total ${metrics.logs?.total || 0}`);

  lines.push('# HELP empowergrid_logs_by_level Log entries by level');
  lines.push('# TYPE empowergrid_logs_by_level gauge');
  lines.push(`empowergrid_logs_error_total ${metrics.logs?.byLevel?.error || 0}`);
  lines.push(`empowergrid_logs_warn_total ${metrics.logs?.byLevel?.warn || 0}`);
  lines.push(`empowergrid_logs_info_total ${metrics.logs?.byLevel?.info || 0}`);
  lines.push(`empowergrid_logs_debug_total ${metrics.logs?.byLevel?.debug || 0}`);

  // System metrics
  lines.push('# HELP empowergrid_system_uptime_seconds System uptime in seconds');
  lines.push('# TYPE empowergrid_system_uptime_seconds gauge');
  lines.push(`empowergrid_system_uptime_seconds ${metrics.system?.uptime || 0}`);

  return lines.join('\n') + '\n';
}