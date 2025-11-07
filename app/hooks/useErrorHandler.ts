import { useCallback } from 'react';
import {
  handleError,
  createError,
  AppError,
  ErrorCode,
  ERROR_CODES,
  getErrorSeverity,
  shouldShowToast,
  logError,
} from '../utils/errorHandler';
import { useToast } from '../components/ToastContainer';

interface UseErrorHandlerOptions {
  showToast?: boolean;
  logErrors?: boolean;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { showToast: defaultShowToast = true, logErrors = true } = options;
  const toast = useToast();

  const handleAppError = useCallback(
    (error: unknown, customMessage?: string) => {
      const appError = handleError(error);

      if (logErrors) {
        logError(appError);
      }

      const severity = getErrorSeverity(appError.code as ErrorCode);
      const shouldToast = defaultShowToast && shouldShowToast(severity);

      if (shouldToast && toast) {
        try {
          const message = customMessage || appError.message;

          // Safely call toast methods - they may not be available if window.toast isn't set up yet
          if (toast.error && toast.warning && toast.info) {
            switch (severity) {
              case 'critical':
              case 'high':
                toast.error('Error', message);
                break;
              case 'medium':
                toast.warning('Warning', message);
                break;
              case 'low':
                toast.info('Info', message);
                break;
            }
          }
        } catch (toastError) {
          // Toast failed, just log to console
          console.error('Toast error:', toastError);
        }
      }

      return appError;
    },
    [defaultShowToast, logErrors, toast]
  );

  const createAppError = useCallback((code: ErrorCode, details?: any) => {
    return createError(code, details);
  }, []);

  const handleAsyncOperation = useCallback(
    async <T>(
      operation: () => Promise<T>,
      options: {
        successMessage?: string;
        errorMessage?: string;
        showSuccessToast?: boolean;
      } = {}
    ): Promise<T | null> => {
      const {
        successMessage,
        errorMessage,
        showSuccessToast = false,
      } = options;

      try {
        const result = await operation();

        if (showSuccessToast && toast && successMessage) {
          toast.success('Success', successMessage);
        }

        return result;
      } catch (error) {
        handleAppError(error, errorMessage);
        return null;
      }
    },
    [handleAppError, toast]
  );

  const wrapAsyncFunction = useCallback(
    <T extends any[], R>(
      fn: (...args: T) => Promise<R>,
      options: {
        successMessage?: string;
        errorMessage?: string;
        showSuccessToast?: boolean;
      } = {}
    ) => {
      return async (...args: T): Promise<R | null> => {
        return handleAsyncOperation(() => fn(...args), options);
      };
    },
    [handleAsyncOperation]
  );

  return {
    handleError: handleAppError,
    createError: createAppError,
    handleAsync: handleAsyncOperation,
    wrapAsync: wrapAsyncFunction,

    // Convenience methods for common errors
    handleWalletError: (error: unknown) =>
      handleAppError(error, 'Wallet operation failed'),

    handleTransactionError: (error: unknown) =>
      handleAppError(error, 'Transaction failed'),

    handleValidationError: (error: unknown) =>
      handleAppError(error, 'Please check your input'),

    handleNetworkError: (error: unknown) =>
      handleAppError(error, 'Network connection failed'),

    // Success handlers
    showSuccess: (message: string) => {
      if (toast) toast.success('Success', message);
    },

    showInfo: (message: string) => {
      if (toast) toast.info('Info', message);
    },
  };
}
