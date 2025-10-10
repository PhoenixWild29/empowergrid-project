/**
 * Intelligent Notification Center
 * 
 * WO-139: Centralized notification management
 * 
 * Features:
 * - All release notifications
 * - Automation status updates
 * - Stakeholder communications
 * - Read/unread tracking
 * - Multi-channel delivery
 * - Notification preferences
 * - Delivery tracking
 * - Analytics
 */

import { useEffect, useState } from 'react';

interface Notification {
  id: string;
  type: 'RELEASE' | 'AUTOMATION' | 'ALERT' | 'UPDATE';
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  isRead: boolean;
  createdAt: string;
  channels: string[];
  deliveryStatus: Record<string, 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'>;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      
      if (data.success) {
        const filtered = filter === 'unread'
          ? data.notifications.filter((n: Notification) => !n.isRead)
          : data.notifications;
        setNotifications(filtered);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Notifications</h2>
            
            <div className="flex gap-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded ${filter === 'unread' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Unread ({notifications.filter(n => !n.isRead).length})
              </button>
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Mark All Read
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading notifications...</div>
          ) : notifications.length > 0 ? (
            notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={markAsRead}
              />
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              No {filter === 'unread' ? 'unread' : ''} notifications
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const severityStyles = {
    INFO: 'bg-blue-100 text-blue-800',
    WARNING: 'bg-yellow-100 text-yellow-800',
    ERROR: 'bg-red-100 text-red-800',
    SUCCESS: 'bg-green-100 text-green-800',
  };

  const typeIcons = {
    RELEASE: '💰',
    AUTOMATION: '🤖',
    ALERT: '⚠️',
    UPDATE: '📢',
  };

  return (
    <div
      className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
      onClick={() => !notification.isRead && onRead(notification.id)}
    >
      <div className="flex items-start gap-4">
        <div className="text-2xl">{typeIcons[notification.type]}</div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-semibold">{notification.title}</h3>
            <span className={`text-xs px-2 py-1 rounded ${severityStyles[notification.severity]}`}>
              {notification.severity}
            </span>
          </div>
          
          <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
          
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{new Date(notification.createdAt).toLocaleString()}</span>
            
            <div className="flex gap-2">
              {notification.channels.map(channel => (
                <span
                  key={channel}
                  className={`px-2 py-1 rounded ${
                    notification.deliveryStatus[channel] === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                    notification.deliveryStatus[channel] === 'FAILED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}
                >
                  {channel}: {notification.deliveryStatus[channel]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



