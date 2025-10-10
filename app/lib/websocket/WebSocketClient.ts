/**
 * WebSocket Client
 * 
 * WO-89: Real-time Project Status Updates
 * Manages WebSocket connection for real-time data
 * 
 * Features:
 * - Automatic reconnection
 * - Connection status tracking
 * - Event subscription system
 * - Rate limiting
 * - Message batching
 */

export type WebSocketEvent = 
  | 'project:funded'
  | 'project:statusChanged'
  | 'milestone:completed'
  | 'project:created'
  | 'funding:received'
  | 'energy:produced';

export interface WebSocketMessage {
  event: WebSocketEvent;
  data: any;
  timestamp: number;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export type WebSocketEventHandler = (data: any) => void;

/**
 * WebSocket Client Class
 * Manages connection and event subscriptions
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<WebSocketEvent, Set<WebSocketEventHandler>> = new Map();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private status: ConnectionStatus = 'disconnected';
  private messageQueue: WebSocketMessage[] = [];
  private isProcessingQueue = false;

  constructor(url: string) {
    this.url = url || `ws://${window.location.host}/ws`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[WO-89] Already connected');
      return;
    }

    try {
      this.updateStatus('connecting');
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WO-89] WebSocket connected');
        this.reconnectAttempts = 0;
        this.updateStatus('connected');
        this.processMessageQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('[WO-89] Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WO-89] WebSocket error:', error);
        this.updateStatus('error');
      };

      this.ws.onclose = () => {
        console.log('[WO-89] WebSocket disconnected');
        this.updateStatus('disconnected');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('[WO-89] Failed to connect:', error);
      this.updateStatus('error');
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.updateStatus('disconnected');
    }
  }

  /**
   * Subscribe to WebSocket events
   */
  on(event: WebSocketEvent, handler: WebSocketEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(handler: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(handler);
    
    // Immediately call with current status
    handler(this.status);

    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(handler);
    };
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Send message to server (if needed in future)
   */
  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WO-89] Cannot send message: not connected');
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    // Add to queue for rate limiting
    this.messageQueue.push(message);
    
    if (!this.isProcessingQueue) {
      this.processMessageQueue();
    }
  }

  /**
   * Process message queue with rate limiting
   * Prevents overwhelming the UI with rapid updates
   */
  private async processMessageQueue(): Promise<void> {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.messageQueue.length > 0) {
      // Process in batches of 10 messages
      const batch = this.messageQueue.splice(0, 10);
      
      for (const message of batch) {
        const handlers = this.listeners.get(message.event);
        
        if (handlers) {
          handlers.forEach(handler => {
            try {
              handler(message.data);
            } catch (error) {
              console.error('[WO-89] Error in event handler:', error);
            }
          });
        }
      }

      // Small delay between batches (50ms)
      if (this.messageQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WO-89] Max reconnection attempts reached');
      this.updateStatus('error');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`[WO-89] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Update connection status and notify listeners
   */
  private updateStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('[WO-89] Error in status listener:', error);
      }
    });
  }
}

/**
 * Singleton WebSocket client instance
 */
let wsClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient {
  if (!wsClient) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 
      (typeof window !== 'undefined' ? `ws://${window.location.host}/ws` : '');
    wsClient = new WebSocketClient(wsUrl);
  }
  return wsClient;
}

/**
 * Initialize WebSocket connection
 * Call this once in your app (e.g., in _app.tsx or layout)
 */
export function initializeWebSocket(): void {
  if (typeof window !== 'undefined') {
    const client = getWebSocketClient();
    client.connect();
  }
}

/**
 * Cleanup WebSocket connection
 */
export function cleanupWebSocket(): void {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
}

