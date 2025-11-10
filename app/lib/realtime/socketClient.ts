/**
 * Socket.io Client
 * 
 * Client-side Socket.io connection manager for real-time notifications
 */

import { io, Socket } from 'socket.io-client';
import { logger } from '../logging/logger';

export type NotificationEvent =
  | 'milestone:verified'
  | 'milestone:delayed'
  | 'milestone:released'
  | 'transaction:confirmed'
  | 'transaction:failed'
  | 'project:funded'
  | 'project:statusChanged'
  | 'governance:proposalCreated'
  | 'governance:voteCast';

export interface NotificationPayload {
  userId?: string;
  projectId?: string;
  milestoneId?: string;
  transactionHash?: string;
  type: NotificationEvent;
  title: string;
  message: string;
  severity?: 'info' | 'success' | 'warning' | 'error';
  metadata?: Record<string, any>;
  timestamp: number;
}

type NotificationHandler = (notification: NotificationPayload) => void;
type ConnectionStatusHandler = (status: 'connected' | 'connecting' | 'disconnected' | 'error') => void;

class SocketClient {
  private socket: Socket | null = null;
  private notificationHandlers: Set<NotificationHandler> = new Set();
  private statusHandlers: Set<ConnectionStatusHandler> = new Set();
  private status: 'connected' | 'connecting' | 'disconnected' | 'error' = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    this.socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      logger.info('[Socket.io] Connected to server', { socketId: this.socket?.id });
      this.updateStatus('connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      logger.warn('[Socket.io] Disconnected from server', { reason });
      this.updateStatus('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      logger.error('[Socket.io] Connection error', { error: error.message });
      this.updateStatus('error');
      this.reconnectAttempts++;
    });

    this.socket.on('notification', (notification: NotificationPayload) => {
      logger.debug('[Socket.io] Received notification', { type: notification.type });
      this.notificationHandlers.forEach((handler) => {
        try {
          handler(notification);
        } catch (error) {
          logger.error('[Socket.io] Error in notification handler', { error });
        }
      });
    });

    this.socket.on('authenticated', (data: { success: boolean; error?: string }) => {
      if (data.success) {
        logger.info('[Socket.io] Authentication successful');
      } else {
        logger.error('[Socket.io] Authentication failed', { error: data.error });
      }
    });
  }

  /**
   * Connect to the Socket.io server
   */
  connect(): void {
    if (!this.socket) {
      logger.warn('[Socket.io] Cannot connect: socket not initialized (server-side)');
      return;
    }

    if (this.socket.connected) {
      logger.debug('[Socket.io] Already connected');
      return;
    }

    this.updateStatus('connecting');
    this.socket.connect();
  }

  /**
   * Disconnect from the Socket.io server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.updateStatus('disconnected');
    }
  }

  /**
   * Authenticate with the server
   */
  authenticate(userId: string, token?: string): void {
    if (!this.socket || !this.socket.connected) {
      logger.warn('[Socket.io] Cannot authenticate: not connected');
      return;
    }

    this.socket.emit('authenticate', { userId, token });
  }

  /**
   * Subscribe to a room (e.g., project updates)
   */
  subscribe(room: string): void {
    if (!this.socket || !this.socket.connected) {
      logger.warn('[Socket.io] Cannot subscribe: not connected');
      return;
    }

    this.socket.emit('subscribe', room);
  }

  /**
   * Unsubscribe from a room
   */
  unsubscribe(room: string): void {
    if (!this.socket || !this.socket.connected) {
      logger.warn('[Socket.io] Cannot unsubscribe: not connected');
      return;
    }

    this.socket.emit('unsubscribe', room);
  }

  /**
   * Register a handler for notifications
   */
  onNotification(handler: NotificationHandler): () => void {
    this.notificationHandlers.add(handler);
    return () => {
      this.notificationHandlers.delete(handler);
    };
  }

  /**
   * Register a handler for connection status changes
   */
  onStatusChange(handler: ConnectionStatusHandler): () => void {
    this.statusHandlers.add(handler);
    handler(this.status); // Immediately call with current status
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  /**
   * Get current connection status
   */
  getStatus(): 'connected' | 'connecting' | 'disconnected' | 'error' {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  private updateStatus(status: 'connected' | 'connecting' | 'disconnected' | 'error'): void {
    this.status = status;
    this.statusHandlers.forEach((handler) => {
      try {
        handler(status);
      } catch (error) {
        logger.error('[Socket.io] Error in status handler', { error });
      }
    });
  }
}

// Singleton instance
let socketClient: SocketClient | null = null;

/**
 * Get the Socket.io client instance
 */
export function getSocketClient(): SocketClient {
  if (typeof window === 'undefined') {
    throw new Error('Socket.io client can only be used on the client side');
  }

  if (!socketClient) {
    socketClient = new SocketClient();
  }

  return socketClient;
}

