/**
 * Socket.io Context
 * 
 * Provides Socket.io connection and notification handling throughout the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getSocketClient, NotificationPayload, NotificationEvent } from '../lib/realtime/socketClient';

interface SocketContextValue {
  isConnected: boolean;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  notifications: NotificationPayload[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  clearNotifications: () => void;
  subscribeToProject: (projectId: string) => void;
  unsubscribeFromProject: (projectId: string) => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined' || !isAuthenticated) {
      return;
    }

    const client = getSocketClient();
    
    // Connect to server
    client.connect();

    // Authenticate when connected
    const statusUnsubscribe = client.onStatusChange((newStatus) => {
      setStatus(newStatus);
      setIsConnected(newStatus === 'connected');
      
      if (newStatus === 'connected' && user?.id) {
        client.authenticate(user.id);
      }
    });

    // Handle notifications
    const notificationUnsubscribe = client.onNotification((notification) => {
      setNotifications((prev) => {
        // Avoid duplicates (check by timestamp + type)
        const exists = prev.some(
          (n) => n.type === notification.type && n.timestamp === notification.timestamp
        );
        if (exists) return prev;
        
        // Add to beginning and keep only last 100
        return [notification, ...prev].slice(0, 100);
      });
    });

    return () => {
      statusUnsubscribe();
      notificationUnsubscribe();
      client.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  const markAsRead = useCallback((notificationId: string) => {
    setReadNotifications((prev) => new Set([...prev, notificationId]));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setReadNotifications(new Set());
  }, []);

  const subscribeToProject = useCallback((projectId: string) => {
    if (typeof window === 'undefined' || !isConnected) return;
    const client = getSocketClient();
    client.subscribe(`project:${projectId}`);
  }, [isConnected]);

  const unsubscribeFromProject = useCallback((projectId: string) => {
    if (typeof window === 'undefined' || !isConnected) return;
    const client = getSocketClient();
    client.unsubscribe(`project:${projectId}`);
  }, [isConnected]);

  const unreadCount = notifications.filter(
    (n) => !readNotifications.has(`${n.type}-${n.timestamp}`)
  ).length;

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        status,
        notifications,
        unreadCount,
        markAsRead,
        clearNotifications,
        subscribeToProject,
        unsubscribeFromProject,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

