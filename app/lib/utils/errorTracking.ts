/**
 * Automatic Error Tracking Integration
 * Captures JavaScript errors and reports them to Validator
 */

import { validatorFeedback } from '../services/validatorFeedback';

let isInitialized = false;
let errorCount = 0;
const MAX_ERRORS_PER_SESSION = 10; // Prevent spam

/**
 * Initialize automatic error tracking
 */
export function initializeErrorTracking() {
  if (isInitialized || typeof window === 'undefined') {
    return;
  }

  isInitialized = true;

  // Global error handler
  window.addEventListener('error', (event) => {
    if (errorCount >= MAX_ERRORS_PER_SESSION) {
      return; // Stop reporting after limit
    }

    errorCount++;

    // Report error to Validator
    validatorFeedback.reportError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    }).catch(console.error);
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    if (errorCount >= MAX_ERRORS_PER_SESSION) {
      return;
    }

    errorCount++;

    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));

    validatorFeedback.reportError(error, {
      type: 'unhandled_rejection',
    }).catch(console.error);
  });

  console.log('✓ Validator error tracking initialized');
}

/**
 * Manually track an error
 */
export function trackError(error: Error, context?: Record<string, any>) {
  if (errorCount >= MAX_ERRORS_PER_SESSION) {
    return;
  }

  errorCount++;
  validatorFeedback.reportError(error, context).catch(console.error);
}

/**
 * Track performance issues
 */
export function trackPerformance(metric: string, value: number, threshold: number) {
  if (value > threshold) {
    validatorFeedback.reportPerformance(metric, value, threshold).catch(console.error);
  }
}

/**
 * Monitor Web Vitals
 */
export function monitorWebVitals() {
  if (typeof window === 'undefined') return;

  // Monitor First Contentful Paint
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fcp = entry as PerformanceEntry;
        trackPerformance('First Contentful Paint', fcp.startTime, 1500);
      }
    });
    observer.observe({ entryTypes: ['paint'] });
  } catch (error) {
    console.warn('Performance monitoring not supported');
  }

  // Monitor Long Tasks
  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const duration = entry.duration;
        if (duration > 50) {
          trackPerformance('Long Task', duration, 50);
        }
      }
    });
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    console.warn('Long task monitoring not supported');
  }
}

