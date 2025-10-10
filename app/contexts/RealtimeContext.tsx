/**
 * Realtime Context
 * 
 * WO-89: Real-time Project Status Updates
 * Provides WebSocket connection and real-time data to components
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getWebSocketClient, ConnectionStatus, WebSocketEvent, WebSocketEventHandler } from '../lib/websocket/WebSocketClient';

interface RealtimeContextValue {
  connectionStatus: ConnectionStatus;
  subscribe: (event: WebSocketEvent, handler: WebSocketEventHandler) => () => void;
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [wsClient] = useState(() => getWebSocketClient());

  useEffect(() => {
    // Connect on mount
    wsClient.connect();

    // Subscribe to status changes
    const unsubscribe = wsClient.onStatusChange(setConnectionStatus);

    // Cleanup on unmount
    return () => {
      unsubscribe();
      // Don't disconnect here - keep connection alive for other components
    };
  }, [wsClient]);

  const subscribe = (event: WebSocketEvent, handler: WebSocketEventHandler) => {
    return wsClient.on(event, handler);
  };

  const value: RealtimeContextValue = {
    connectionStatus,
    subscribe,
    isConnected: connectionStatus === 'connected',
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}

