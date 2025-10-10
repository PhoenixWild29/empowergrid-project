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

  // Initialize Validator Feedback error tracking
  useEffect(() => {
    initializeErrorTracking();
    monitorWebVitals();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProjectProvider>
          <ErrorBoundary>
            <Component {...pageProps} />
            <ToastContainer position='top-right' />
            <FeedbackButton />
          </ErrorBoundary>
        </ProjectProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
