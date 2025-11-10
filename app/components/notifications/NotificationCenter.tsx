/**
 * Notification Center Component
 * 
 * Displays real-time notifications with filtering and actions
 */

import { useState, useMemo } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import clsx from 'clsx';
import {
  Bell,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
} from 'lucide-react';

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, clearNotifications } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'milestone' | 'transaction'>('all');

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (filter === 'unread') {
      filtered = notifications.filter((n) => {
        const id = `${n.type}-${n.timestamp}`;
        return !notifications.some((read) => read === n); // Simplified check
      });
    } else if (filter === 'milestone') {
      filtered = notifications.filter((n) => n.type.startsWith('milestone:'));
    } else if (filter === 'transaction') {
      filtered = notifications.filter((n) => n.type.startsWith('transaction:'));
    }

    return filtered;
  }, [notifications, filter]);

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircle className='h-4 w-4 text-emerald-500' />;
      case 'warning':
        return <AlertTriangle className='h-4 w-4 text-amber-500' />;
      case 'error':
        return <AlertCircle className='h-4 w-4 text-red-500' />;
      default:
        return <Info className='h-4 w-4 text-blue-500' />;
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className='relative'>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='relative rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        aria-label='Notifications'
      >
        <Bell className='h-5 w-5' />
        {unreadCount > 0 && (
          <span className='absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white'>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className='fixed inset-0 z-40'
            onClick={() => setIsOpen(false)}
            aria-hidden='true'
          />
          <div className='absolute right-0 top-12 z-50 w-96 rounded-3xl border border-slate-200 bg-white shadow-xl'>
            <div className='flex items-center justify-between border-b border-slate-200 p-4'>
              <h2 className='text-lg font-semibold text-slate-900'>Notifications</h2>
              <div className='flex items-center gap-2'>
                {notifications.length > 0 && (
                  <button
                    type='button'
                    onClick={clearNotifications}
                    className='text-xs font-semibold text-slate-600 hover:text-slate-900'
                  >
                    Clear all
                  </button>
                )}
                <button
                  type='button'
                  onClick={() => setIsOpen(false)}
                  className='rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            </div>

            <div className='flex border-b border-slate-200'>
              {(['all', 'unread', 'milestone', 'transaction'] as const).map((f) => (
                <button
                  key={f}
                  type='button'
                  onClick={() => setFilter(f)}
                  className={clsx(
                    'flex-1 px-4 py-2 text-xs font-semibold capitalize transition',
                    filter === f
                      ? 'border-b-2 border-emerald-600 text-emerald-600'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className='max-h-96 overflow-y-auto'>
              {filteredNotifications.length === 0 ? (
                <div className='p-8 text-center text-sm text-slate-500'>
                  <Bell className='mx-auto mb-2 h-8 w-8 text-slate-300' />
                  <p>No notifications</p>
                </div>
              ) : (
                <ul className='divide-y divide-slate-100'>
                  {filteredNotifications.map((notification, index) => {
                    const notificationId = `${notification.type}-${notification.timestamp}`;
                    const isRead = false; // Simplified - would check against readNotifications

                    return (
                      <li
                        key={notificationId}
                        className={clsx(
                          'group relative p-4 transition hover:bg-slate-50',
                          !isRead && 'bg-emerald-50/50'
                        )}
                      >
                        <div className='flex items-start gap-3'>
                          <div className='mt-0.5 flex-shrink-0'>
                            {getSeverityIcon(notification.severity)}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-semibold text-slate-900'>{notification.title}</p>
                            <p className='mt-1 text-xs text-slate-600'>{notification.message}</p>
                            <div className='mt-2 flex items-center gap-2 text-xs text-slate-500'>
                              <Clock className='h-3 w-3' />
                              {formatTime(notification.timestamp)}
                            </div>
                          </div>
                          {!isRead && (
                            <button
                              type='button'
                              onClick={() => markAsRead(notificationId)}
                              className='flex-shrink-0 rounded-full p-1 text-slate-400 opacity-0 transition hover:bg-slate-200 hover:text-slate-600 group-hover:opacity-100'
                              aria-label='Mark as read'
                            >
                              <Check className='h-4 w-4' />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
