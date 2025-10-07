import {
  logger,
  logPerformance,
  logDatabaseOperation,
} from '../logging/logger';

// Performance monitoring system for EmpowerGRID

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Start timing an operation
  startTimer(operation: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric(operation, duration);
      logPerformance(operation, duration);
    };
  }

  // Record a metric
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last 1000 measurements
    if (values.length > 1000) {
      values.shift();
    }
  }

  // Get statistics for a metric
  getMetricStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const average = sum / count;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return { count, average, min, max, p95, p99 };
  }

  // Get all metrics
  getAllMetrics(): Record<
    string,
    ReturnType<PerformanceMonitor['getMetricStats']>
  > {
    const result: Record<
      string,
      ReturnType<PerformanceMonitor['getMetricStats']>
    > = {};

    for (const [name] of this.metrics) {
      result[name] = this.getMetricStats(name);
    }

    return result;
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Database operation performance monitoring
export class DatabasePerformanceMonitor {
  private static instance: DatabasePerformanceMonitor;

  private constructor() {}

  static getInstance(): DatabasePerformanceMonitor {
    if (!DatabasePerformanceMonitor.instance) {
      DatabasePerformanceMonitor.instance = new DatabasePerformanceMonitor();
    }
    return DatabasePerformanceMonitor.instance;
  }

  // Monitor database operations
  async monitorOperation<T>(
    operation: string,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      logDatabaseOperation(operation, table, duration, true);
      PerformanceMonitor.getInstance().recordMetric(
        `db.${table}.${operation}`,
        duration
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logDatabaseOperation(operation, table, duration, false, error as Error);
      PerformanceMonitor.getInstance().recordMetric(
        `db.${table}.${operation}.error`,
        duration
      );

      throw error;
    }
  }
}

// API performance monitoring
export class ApiPerformanceMonitor {
  private static instance: ApiPerformanceMonitor;

  private constructor() {}

  static getInstance(): ApiPerformanceMonitor {
    if (!ApiPerformanceMonitor.instance) {
      ApiPerformanceMonitor.instance = new ApiPerformanceMonitor();
    }
    return ApiPerformanceMonitor.instance;
  }

  // Monitor API endpoints
  async monitorEndpoint<T>(
    method: string,
    path: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      PerformanceMonitor.getInstance().recordMetric(
        `api.${method}.${path}`,
        duration
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      PerformanceMonitor.getInstance().recordMetric(
        `api.${method}.${path}.error`,
        duration
      );

      throw error;
    }
  }
}

// React component performance monitoring
export class ComponentPerformanceMonitor {
  private static instance: ComponentPerformanceMonitor;

  private constructor() {}

  static getInstance(): ComponentPerformanceMonitor {
    if (!ComponentPerformanceMonitor.instance) {
      ComponentPerformanceMonitor.instance = new ComponentPerformanceMonitor();
    }
    return ComponentPerformanceMonitor.instance;
  }

  // Monitor component render time
  recordRenderTime(componentName: string, duration: number): void {
    PerformanceMonitor.getInstance().recordMetric(
      `component.${componentName}.render`,
      duration
    );
  }

  // Monitor component mount time
  recordMountTime(componentName: string, duration: number): void {
    PerformanceMonitor.getInstance().recordMetric(
      `component.${componentName}.mount`,
      duration
    );
  }
}

// Memory usage monitoring
export class MemoryMonitor {
  private static instance: MemoryMonitor;

  private constructor() {
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      this.recordMemoryUsage();
    }, 30000);
  }

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  private recordMemoryUsage(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();

      PerformanceMonitor.getInstance().recordMetric(
        'memory.heapUsed',
        usage.heapUsed
      );
      PerformanceMonitor.getInstance().recordMetric(
        'memory.heapTotal',
        usage.heapTotal
      );
      PerformanceMonitor.getInstance().recordMetric(
        'memory.external',
        usage.external
      );
      PerformanceMonitor.getInstance().recordMetric('memory.rss', usage.rss);
    }
  }

  getMemoryUsage(): NodeJS.MemoryUsage | null {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    return null;
  }
}

// Export singleton instances
export const performanceMonitor = PerformanceMonitor.getInstance();
export const databasePerformanceMonitor =
  DatabasePerformanceMonitor.getInstance();
export const apiPerformanceMonitor = ApiPerformanceMonitor.getInstance();
export const componentPerformanceMonitor =
  ComponentPerformanceMonitor.getInstance();
export const memoryMonitor = MemoryMonitor.getInstance();
