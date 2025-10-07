import { logger } from '../logging/logger';

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

// Cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  clears: number;
  hitRate: number;
}

// In-memory cache implementation
export class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    clears: 0,
    hitRate: 0,
  };

  constructor(private defaultTTL: number = 300000) {} // 5 minutes default

  // Get value from cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.deletes++;
      this.updateHitRate();
      return null;
    }

    // Update access statistics
    entry.hits++;
    entry.lastAccessed = Date.now();

    this.stats.hits++;
    this.updateHitRate();

    logger.debug('Cache hit', { key, hits: entry.hits });
    return entry.data;
  }

  // Set value in cache
  set<T>(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);
    this.stats.sets++;
    this.updateHitRate();

    logger.debug('Cache set', { key, ttl: entry.ttl });
  }

  // Delete from cache
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.updateHitRate();
      logger.debug('Cache delete', { key });
    }
    return deleted;
  }

  // Clear all cache entries
  clear(): void {
    this.cache.clear();
    this.stats.clears++;
    this.updateHitRate();
    logger.info('Cache cleared');
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Get cache size
  size(): number {
    // Clean expired entries first
    this.cleanExpired();
    return this.cache.size;
  }

  // Get cache statistics
  getStats(): CacheStats & { size: number; hitRate: number } {
    this.cleanExpired();
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hitRate,
    };
  }

  // Clean expired entries
  private cleanExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    if (expiredKeys.length > 0) {
      logger.debug('Cleaned expired cache entries', { count: expiredKeys.length });
    }
  }

  // Update hit rate
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  // Get all keys
  keys(): string[] {
    this.cleanExpired();
    return Array.from(this.cache.keys());
  }

  // Get cache entry metadata
  getMetadata(key: string): { ttl: number; hits: number; lastAccessed: number; age: number } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return {
      ttl: entry.ttl,
      hits: entry.hits,
      lastAccessed: entry.lastAccessed,
      age: Date.now() - entry.timestamp,
    };
  }
}

// API Response Cache
export class ApiResponseCache {
  private cache: MemoryCache;

  constructor(defaultTTL: number = 300000) { // 5 minutes
    this.cache = new MemoryCache(defaultTTL);
  }

  // Cache API response
  setResponse(endpoint: string, params: Record<string, any>, response: any, ttl?: number): void {
    const key = this.generateKey(endpoint, params);
    this.cache.set(key, response, ttl);
  }

  // Get cached API response
  getResponse(endpoint: string, params: Record<string, any>): any | null {
    const key = this.generateKey(endpoint, params);
    return this.cache.get(key);
  }

  // Clear API cache for specific endpoint
  clearEndpoint(endpoint: string): void {
    const keys = this.cache.keys().filter(key => key.startsWith(`${endpoint}:`));
    keys.forEach(key => this.cache.delete(key));
    logger.info('API cache cleared for endpoint', { endpoint, keysCleared: keys.length });
  }

  // Get cache stats
  getStats() {
    return this.cache.getStats();
  }

  private generateKey(endpoint: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    return `${endpoint}:${sortedParams}`;
  }
}

// Database Query Cache
export class QueryCache {
  private cache: MemoryCache;

  constructor(defaultTTL: number = 600000) { // 10 minutes for DB queries
    this.cache = new MemoryCache(defaultTTL);
  }

  // Cache database query result
  setQuery(query: string, params: any[], result: any, ttl?: number): void {
    const key = this.generateQueryKey(query, params);
    this.cache.set(key, result, ttl);
  }

  // Get cached query result
  getQuery(query: string, params: any[]): any | null {
    const key = this.generateQueryKey(query, params);
    return this.cache.get(key);
  }

  // Clear query cache
  clear(): void {
    this.cache.clear();
  }

  // Get cache stats
  getStats() {
    return this.cache.getStats();
  }

  private generateQueryKey(query: string, params: any[]): string {
    return `query:${query}:${JSON.stringify(params)}`;
  }
}

// React Query integration
export class ReactQueryCache {
  private cache: MemoryCache;

  constructor(defaultTTL: number = 300000) { // 5 minutes
    this.cache = new MemoryCache(defaultTTL);
  }

  // Cache React Query data
  setQueryData(queryKey: string[], data: any, ttl?: number): void {
    const key = `react-query:${JSON.stringify(queryKey)}`;
    this.cache.set(key, data, ttl);
  }

  // Get cached React Query data
  getQueryData(queryKey: string[]): any | null {
    const key = `react-query:${JSON.stringify(queryKey)}`;
    return this.cache.get(key);
  }

  // Invalidate React Query cache
  invalidateQuery(queryKey: string[]): void {
    const key = `react-query:${JSON.stringify(queryKey)}`;
    this.cache.delete(key);
  }

  // Clear all React Query cache
  clear(): void {
    const keys = this.cache.keys().filter(key => key.startsWith('react-query:'));
    keys.forEach(key => this.cache.delete(key));
  }

  getStats() {
    return this.cache.getStats();
  }
}

// Singleton instances
export const memoryCache = new MemoryCache();
export const apiResponseCache = new ApiResponseCache();
export const queryCache = new QueryCache();
export const reactQueryCache = new ReactQueryCache();

// Cache utilities
export const cacheUtils = {
  // Generate cache key from multiple parameters
  generateKey: (...params: any[]): string => {
    return params.map(param => {
      if (typeof param === 'object') {
        return JSON.stringify(param);
      }
      return String(param);
    }).join(':');
  },

  // Check if cache should be bypassed (for development)
  shouldBypassCache: (): boolean => {
    return process.env.NODE_ENV === 'development' &&
           process.env.BYPASS_CACHE === 'true';
  },

  // Get optimal TTL based on data type
  getOptimalTTL: (dataType: 'static' | 'dynamic' | 'volatile'): number => {
    switch (dataType) {
      case 'static':
        return 3600000; // 1 hour
      case 'dynamic':
        return 600000; // 10 minutes
      case 'volatile':
        return 60000; // 1 minute
      default:
        return 300000; // 5 minutes
    }
  },
};