import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { componentPerformanceMonitor } from '../monitoring/performance';
import { apiResponseCache, reactQueryCache, cacheUtils } from '../cache/cache';
import { logger } from '../logging/logger';

// Performance monitoring hook for components
export function usePerformanceMonitoring(componentName: string) {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef(Date.now());
  const lastRenderTimeRef = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const mountDuration = now - mountTimeRef.current;

    if (renderCountRef.current === 0) {
      // First render - component mounted
      componentPerformanceMonitor.recordMountTime(componentName, mountDuration);
      logger.debug(`Component ${componentName} mounted`, { duration: mountDuration });
    } else {
      // Subsequent renders
      const renderDuration = now - lastRenderTimeRef.current;
      componentPerformanceMonitor.recordRenderTime(componentName, renderDuration);
    }

    renderCountRef.current++;
    lastRenderTimeRef.current = now;
  });

  return {
    renderCount: renderCountRef.current,
  };
}

// Debounced callback hook for performance
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback as T;
}

// Throttled callback hook for performance
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef(0);

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay]);

  return throttledCallback as T;
}

// Cached API hook with automatic cache management
export function useCachedApi<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const {
    ttl = cacheUtils.getOptimalTTL('dynamic'),
    enabled = true,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Check cache first
    const cachedData = apiResponseCache.getResponse(cacheKey, {});
    if (cachedData) {
      setData(cachedData);
      onSuccess?.(cachedData);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);

      // Cache the result
      apiResponseCache.setResponse(cacheKey, {}, result, ttl);

      onSuccess?.(result);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetcher, ttl, enabled, onSuccess, onError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    // Clear cache and refetch
    apiResponseCache.clearEndpoint(cacheKey.split(':')[0]);
    fetchData();
  }, [cacheKey, fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

// Memoized computation hook with performance tracking
export function useMemoizedComputation<T>(
  computation: () => T,
  deps: React.DependencyList,
  computationName?: string
): T {
  const startTime = useRef(Date.now());

  const result = useMemo(() => {
    startTime.current = Date.now();
    const result = computation();
    const duration = Date.now() - startTime.current;

    if (computationName) {
      logger.debug(`Computation ${computationName} completed`, { duration });
    }

    return result;
  }, [computation, computationName, ...deps]);

  return result;
}

// Lazy loading hook for components
export function useLazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  const [Component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadComponent = useCallback(async () => {
    if (Component || loading) return;

    setLoading(true);
    setError(null);

    try {
      const importedModule = await importFunc();
      setComponent(() => importedModule.default);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [Component, loading, importFunc]);

  return {
    Component,
    loading,
    error,
    loadComponent,
  };
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasIntersected, options]);

  return { ref, isIntersecting, hasIntersected };
}

// Virtual scrolling hook for performance
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );

    return {
      start: Math.max(0, start - overscan),
      end,
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
    }));
  }, [items, visibleRange]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: handleScroll,
  };
}

// Resource preloading hook
export function useResourcePreloader() {
  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const preloadScript = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.onload = () => resolve();
      script.onerror = reject;
      script.src = src;
      document.head.appendChild(script);
    });
  }, []);

  const preloadStyle = useCallback((href: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.onload = () => resolve();
      link.onerror = reject;
      link.href = href;
      document.head.appendChild(link);
    });
  }, []);

  return {
    preloadImage,
    preloadScript,
    preloadStyle,
  };
}

// Bundle splitting hook for code splitting
export function useDynamicImport<T>(
  importFunc: () => Promise<T>,
  options: {
    onLoading?: () => void;
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const [result, setResult] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (result || loading) return;

    setLoading(true);
    setError(null);
    options.onLoading?.();

    try {
      const importedModule = await importFunc();
      setResult(importedModule);
      options.onSuccess?.(importedModule);
    } catch (err) {
      const error = err as Error;
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [result, loading, importFunc, options]);

  return {
    result,
    loading,
    error,
    load,
  };
}