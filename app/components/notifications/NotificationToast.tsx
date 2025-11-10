/**
 * Notification Toast Component
 * 
 * Displays toast notifications for real-time events
 */

import { useEffect, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import clsx from 'clsx';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

export function NotificationToast() {
  const { notifications } = useSocket();
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    // Get the most recent notification
    const latest = notifications[0];
    if (!latest) return;

    const toastId = `${latest.type}-${latest.timestamp}`;
    
    // Check if we've already shown this toast
    if (toasts.some((t) => t.id === toastId)) return;

    // Add new toast
    const newToast: ToastNotification = {
      id: toastId,
      title: latest.title,
      message: latest.message,
      severity: latest.severity || 'info',
      timestamp: latest.timestamp,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 5000);
  }, [notifications, toasts]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircle className='h-5 w-5 text-emerald-500' />;
      case 'warning':
        return <AlertTriangle className='h-5 w-5 text-amber-500' />;
      case 'error':
        return <AlertCircle className='h-5 w-5 text-red-500' />;
      default:
        return <Info className='h-5 w-5 text-blue-500' />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  return (
    <div className='fixed bottom-4 right-4 z-50 space-y-2'>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            'flex items-start gap-3 rounded-2xl border p-4 shadow-lg transition animate-in slide-in-from-right',
            getSeverityStyles(toast.severity)
          )}
        >
          <div className='flex-shrink-0'>{getSeverityIcon(toast.severity)}</div>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-semibold'>{toast.title}</p>
            <p className='mt-1 text-xs opacity-90'>{toast.message}</p>
          </div>
          <button
            type='button'
            onClick={() => dismissToast(toast.id)}
            className='flex-shrink-0 rounded-full p-1 opacity-60 hover:opacity-100'
            aria-label='Dismiss'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      ))}
    </div>
  );
}

