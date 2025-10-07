'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertTriangle, Activity, Database, Zap, Shield, TrendingUp } from 'lucide-react';
import {
  performanceMonitor,
  databasePerformanceMonitor,
  apiPerformanceMonitor,
  componentPerformanceMonitor,
  memoryMonitor
} from '../../lib/monitoring/performance';
import { alertManager, AlertSeverity, AlertType } from '../../lib/monitoring/alerts';
import { enhancedLogger } from '../../lib/logging/logger';
import { memoryCache, apiResponseCache, queryCache } from '../../lib/cache/cache';

interface MonitoringDashboardProps {
  className?: string;
}

export function MonitoringDashboard({ className }: MonitoringDashboardProps) {
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [logStats, setLogStats] = useState<any>(null);
  const [alertStats, setAlertStats] = useState<any>(null);

  useEffect(() => {
    // Update stats every 5 seconds
    const updateStats = () => {
      setPerformanceStats({
        performance: performanceMonitor.getAllMetrics(),
        database: (databasePerformanceMonitor as any).getAllMetrics?.() || {},
        api: (apiPerformanceMonitor as any).getAllMetrics?.() || {},
        component: (componentPerformanceMonitor as any).getAllMetrics?.() || {},
        memory: memoryMonitor.getMemoryUsage(),
      });

      setAlerts(alertManager.getAlerts({ limit: 10 }));
      setCacheStats({
        memory: memoryCache.getStats(),
        api: apiResponseCache.getStats(),
        query: queryCache.getStats(),
      });

      setLogStats(enhancedLogger.getLogStats());
      setAlertStats(alertManager.getAlertStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL: return 'bg-red-500';
      case AlertSeverity.HIGH: return 'bg-orange-500';
      case AlertSeverity.MEDIUM: return 'bg-yellow-500';
      case AlertSeverity.LOW: return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <div className="flex items-center space-x-2">
          <Badge variant={alertStats?.unresolved > 0 ? 'destructive' : 'secondary'}>
            {alertStats?.unresolved || 0} Active Alerts
          </Badge>
          <Badge variant="outline">
            {logStats?.total || 0} Log Entries
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Performance Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceStats?.performance?.['api.response.time']?.average
                    ? formatDuration(performanceStats.performance['api.response.time'].average)
                    : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {performanceStats?.performance?.['api.response.time']?.count || 0} requests
                </p>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceStats?.memory?.heapUsed
                    ? formatBytes(performanceStats.memory.heapUsed)
                    : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Heap: {performanceStats?.memory?.heapTotal
                    ? formatBytes(performanceStats.memory.heapTotal)
                    : 'N/A'}
                </p>
              </CardContent>
            </Card>

            {/* Cache Hit Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cacheStats?.memory?.hitRate?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {cacheStats?.memory?.hits || 0} hits, {cacheStats?.memory?.misses || 0} misses
                </p>
              </CardContent>
            </Card>

            {/* Active Alerts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {alertStats?.unresolved || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {alertStats?.unacknowledged || 0} unacknowledged
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.slice(0, 5).map((alert: any) => (
                  <div key={alert.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`} />
                      <span className="font-medium">{alert.title}</span>
                    </div>
                    <Badge variant="outline">{alert.severity}</Badge>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No recent alerts</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* API Performance */}
            <Card>
              <CardHeader>
                <CardTitle>API Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(performanceStats?.api || {}).map(([key, stats]: [string, any]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm">{key}</span>
                      <span className="text-sm font-mono">
                        {formatDuration(stats.average)} avg ({stats.count} calls)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Database Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Database Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(performanceStats?.database || {}).map(([key, stats]: [string, any]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm">{key}</span>
                      <span className="text-sm font-mono">
                        {formatDuration(stats.average)} avg ({stats.count} queries)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Component Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Component Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(performanceStats?.component || {}).map(([key, stats]: [string, any]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm">{key}</span>
                      <span className="text-sm font-mono">
                        {formatDuration(stats.average)} avg ({stats.count} renders)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Memory Details */}
            <Card>
              <CardHeader>
                <CardTitle>Memory Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {performanceStats?.memory && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm">Heap Used</span>
                        <span className="text-sm font-mono">
                          {formatBytes(performanceStats.memory.heapUsed)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Heap Total</span>
                        <span className="text-sm font-mono">
                          {formatBytes(performanceStats.memory.heapTotal)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">External</span>
                        <span className="text-sm font-mono">
                          {formatBytes(performanceStats.memory.external)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">RSS</span>
                        <span className="text-sm font-mono">
                          {formatBytes(performanceStats.memory.rss)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Alert Management</h3>
            <div className="flex space-x-2">
              <Badge variant="outline">
                Total: {alertStats?.total || 0}
              </Badge>
              <Badge variant="destructive">
                Unresolved: {alertStats?.unresolved || 0}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            {alerts.map((alert: any) => (
              <Card key={alert.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`w-3 h-3 rounded-full mt-1 ${getSeverityColor(alert.severity)}`} />
                      <div>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{alert.type}</Badge>
                          <Badge variant="outline">{alert.severity}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!alert.acknowledged && (
                        <Button size="sm" variant="outline">
                          Acknowledge
                        </Button>
                      )}
                      {!alert.resolved && (
                        <Button size="sm" variant="outline">
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Memory Cache */}
            <Card>
              <CardHeader>
                <CardTitle>Memory Cache</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Hit Rate</span>
                    <span className="text-sm font-mono">{cacheStats?.memory?.hitRate?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Size</span>
                    <span className="text-sm font-mono">{cacheStats?.memory?.size || 0} entries</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Hits</span>
                    <span className="text-sm font-mono">{cacheStats?.memory?.hits || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Misses</span>
                    <span className="text-sm font-mono">{cacheStats?.memory?.misses || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Response Cache */}
            <Card>
              <CardHeader>
                <CardTitle>API Cache</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Hit Rate</span>
                    <span className="text-sm font-mono">{cacheStats?.api?.hitRate?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Size</span>
                    <span className="text-sm font-mono">{cacheStats?.api?.size || 0} entries</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Hits</span>
                    <span className="text-sm font-mono">{cacheStats?.api?.hits || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Misses</span>
                    <span className="text-sm font-mono">{cacheStats?.api?.misses || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Query Cache */}
            <Card>
              <CardHeader>
                <CardTitle>Query Cache</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Hit Rate</span>
                    <span className="text-sm font-mono">{cacheStats?.query?.hitRate?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Size</span>
                    <span className="text-sm font-mono">{cacheStats?.query?.size || 0} entries</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Hits</span>
                    <span className="text-sm font-mono">{cacheStats?.query?.hits || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Misses</span>
                    <span className="text-sm font-mono">{cacheStats?.query?.misses || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Log Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Log Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Logs</span>
                    <span className="text-sm font-mono">{logStats?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Error Logs</span>
                    <span className="text-sm font-mono text-red-600">{logStats?.byLevel?.error || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Warning Logs</span>
                    <span className="text-sm font-mono text-yellow-600">{logStats?.byLevel?.warn || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Info Logs</span>
                    <span className="text-sm font-mono text-blue-600">{logStats?.byLevel?.info || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Debug Logs</span>
                    <span className="text-sm font-mono text-gray-600">{logStats?.byLevel?.debug || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Logs */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {enhancedLogger.getAggregatedLogs({ limit: 20 }).map((log: any, index: number) => (
                    <div key={index} className="text-xs font-mono p-2 bg-muted rounded">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {log.level}
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-1">{log.message}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}