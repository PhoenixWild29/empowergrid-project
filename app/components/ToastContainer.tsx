import { useState, useCallback } from 'react';
import Toast, { ToastType, ToastProps } from './Toast';

interface ToastContainerProps {
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center';
}

const positionStyles = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
};

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export default function ToastContainer({
  position = 'top-right',
}: ToastContainerProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = { id, ...toast };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration (handled by Toast component)
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Expose methods via global object for easy access
  if (typeof window !== 'undefined') {
    (window as any).toast = {
      success: (title: string, message?: string, duration?: number) =>
        addToast({ type: 'success', title, message, duration }),
      error: (title: string, message?: string, duration?: number) =>
        addToast({ type: 'error', title, message, duration }),
      warning: (title: string, message?: string, duration?: number) =>
        addToast({ type: 'warning', title, message, duration }),
      info: (title: string, message?: string, duration?: number) =>
        addToast({ type: 'info', title, message, duration }),
      remove: removeToast,
      clear: clearAllToasts,
    };
  }

  return (
    <div
      className={`fixed z-50 ${positionStyles[position]} space-y-2`}
      aria-live='polite'
      aria-label='Toast notifications'
    >
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}

// Helper hook for using toasts in components
export const useToast = () => {
  const showToast = useCallback(
    (type: ToastType, title: string, message?: string, duration?: number) => {
      if (typeof window !== 'undefined' && (window as any).toast) {
        try {
          return (window as any).toast[type](title, message, duration);
        } catch (error) {
          console.warn('Toast error:', error);
          return null;
        }
      }
      return null;
    },
    []
  );

  return {
    success: (title: string, message?: string, duration?: number) =>
      showToast('success', title, message, duration),
    error: (title: string, message?: string, duration?: number) =>
      showToast('error', title, message, duration),
    warning: (title: string, message?: string, duration?: number) =>
      showToast('warning', title, message, duration),
    info: (title: string, message?: string, duration?: number) =>
      showToast('info', title, message, duration),
  };
};
