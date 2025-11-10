/**
 * Socket.io Server Setup
 * 
 * Real-time notification server for milestone updates and transaction status
 * 
 * This server can be run alongside Next.js or integrated into a custom server.
 * For Next.js, we'll use API routes to emit events.
 */

import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
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

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.io server
 */
export function initializeSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    logger.info('Socket.io client connected', { socketId: socket.id });

    // Handle authentication
    socket.on('authenticate', async (data: { userId: string; token?: string }) => {
      try {
        // In production, verify JWT token here
        socket.data.userId = data.userId;
        socket.join(`user:${data.userId}`);
        logger.info('Socket.io client authenticated', { socketId: socket.id, userId: data.userId });
        socket.emit('authenticated', { success: true });
      } catch (error) {
        logger.error('Socket.io authentication failed', { socketId: socket.id, error });
        socket.emit('authenticated', { success: false, error: 'Authentication failed' });
      }
    });

    // Handle room subscriptions (e.g., project-specific updates)
    socket.on('subscribe', (room: string) => {
      socket.join(room);
      logger.debug('Socket.io client subscribed to room', { socketId: socket.id, room });
    });

    socket.on('unsubscribe', (room: string) => {
      socket.leave(room);
      logger.debug('Socket.io client unsubscribed from room', { socketId: socket.id, room });
    });

    socket.on('disconnect', () => {
      logger.info('Socket.io client disconnected', { socketId: socket.id });
    });
  });

  logger.info('Socket.io server initialized');
  return io;
}

/**
 * Get the Socket.io server instance
 */
export function getSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * Emit a notification to a specific user
 */
export function emitToUser(userId: string, notification: NotificationPayload): void {
  if (!io) {
    logger.warn('Socket.io server not initialized, cannot emit notification');
    return;
  }

  io.to(`user:${userId}`).emit('notification', notification);
  logger.debug('Emitted notification to user', { userId, type: notification.type });
}

/**
 * Emit a notification to all users in a room (e.g., project followers)
 */
export function emitToRoom(room: string, notification: NotificationPayload): void {
  if (!io) {
    logger.warn('Socket.io server not initialized, cannot emit notification');
    return;
  }

  io.to(room).emit('notification', notification);
  logger.debug('Emitted notification to room', { room, type: notification.type });
}

/**
 * Emit a notification to all connected clients
 */
export function emitToAll(notification: NotificationPayload): void {
  if (!io) {
    logger.warn('Socket.io server not initialized, cannot emit notification');
    return;
  }

  io.emit('notification', notification);
  logger.debug('Emitted notification to all clients', { type: notification.type });
}

