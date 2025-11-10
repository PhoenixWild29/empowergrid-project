import '../styles/globals.css';
import type { AppProps } from 'next/app';
import ErrorBoundary from '../components/ErrorBoundary';
import ToastContainer from '../components/ToastContainer';
import { AuthProvider } from '../contexts/AuthContext';
import { ProjectProvider } from '../contexts/ProjectContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import FeedbackButton from '../components/feedback/FeedbackButton';
import { initializeErrorTracking, monitorWebVitals } from '../lib/utils/errorTracking';
import { errorLogger } from '../lib/utils/comprehensiveErrorLogger';
import ErrorLoggerPanel from '../components/ErrorLoggerPanel';
import { TransactionFeedbackProvider } from '../contexts/TransactionFeedbackContext';
import TransactionFeedbackPanel from '../components/transactions/TransactionFeedbackPanel';
import { SocketProvider } from '../contexts/SocketContext';
import { NotificationToast } from '../components/notifications/NotificationToast';

export default function App({ Component, pageProps }: AppProps) {
  // Create a client instance for React Query
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30000, // 30 seconds
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 1,
      },
    },
  }));

  // Initialize comprehensive error logging (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (errorLogger) {
          const stats = errorLogger.getStats();
          console.log('[App] Error logger initialized. Current stats:', stats);
        }
      } catch (error) {
        console.error('[App] Error logger initialization check failed:', error);
      }

      // Log Next.js errors if they occur
      // The error logger already wraps console.error, so we need to get the wrapped version
      const currentConsoleError = console.error;
      if (!(currentConsoleError as any).__nextJsWrapped) {
        const wrappedConsoleError = (...args: any[]) => {
          try {
            // Call the current console.error (which may be wrapped by error logger)
            currentConsoleError.apply(console, args);
            
            // Check if this is a Next.js error
            const errorString = args.map(a => String(a)).join(' ');
            if (errorString.includes('Fast Refresh') || errorString.includes('Next.js') || errorString.includes('runtime error')) {
              const error = args.find(a => a instanceof Error) || new Error(errorString);
              try {
                if (errorLogger) {
                  errorLogger.logNextJSError(error, {
                    args: args.map(a => {
                      if (a instanceof Error) {
                        return { name: a.name, message: a.message, stack: a.stack };
                      }
                      return typeof a === 'object' ? JSON.stringify(a) : String(a);
                    }),
                  });
                }
              } catch (logErr) {
                // If logging fails, don't throw - just continue
                console.warn('Failed to log Next.js error:', logErr);
              }
            }
          } catch (err) {
            // If anything fails, just continue - don't throw
            console.warn('Error in console.error wrapper:', err);
          }
        };
        
        (wrappedConsoleError as any).__nextJsWrapped = true;
        console.error = wrappedConsoleError;
      }

      // Display helpful debugging commands
      console.log('%c🔍 Error Logger Commands:', 'color: #3b82f6; font-weight: bold; font-size: 14px;');
      console.log('%c  showErrors() - Show error statistics', 'color: #6b7280;');
      console.log('%c  getErrors() - Get all errors', 'color: #6b7280;');
      console.log('%c  clearErrors() - Clear error logs', 'color: #6b7280;');
      console.log('%c  exportErrors() - Download error logs as JSON', 'color: #6b7280;');
      console.log('%c  errorLogger - Access the error logger instance', 'color: #6b7280;');
      
      return () => {
        // Don't restore - let the error logger handle it
      };
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <ProjectProvider>
            <TransactionFeedbackProvider>
              <ErrorBoundary>
                <Component {...pageProps} />
                <ToastContainer position='top-right' />
                <NotificationToast />
                <FeedbackButton />
                <TransactionFeedbackPanel />
                <ErrorLoggerPanel />
              </ErrorBoundary>
            </TransactionFeedbackProvider>
          </ProjectProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
