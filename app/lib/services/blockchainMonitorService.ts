/**
 * Blockchain Monitoring Service
 * 
 * WO-118: Real-Time Blockchain Monitoring with WebSocket Integration
 * 
 * Features:
 * - Solana blockchain event subscriptions
 * - Oracle data feed integration
 * - Transaction status monitoring
 * - Event filtering for user relevance
 * - Network congestion handling
 * - Comprehensive audit trail
 */

import { Connection, PublicKey, Commitment } from '@solana/web3.js';
import { getOracleData } from './oracleService';

// WO-118: Event types for blockchain monitoring
export type BlockchainEvent =
  | 'escrow:created'
  | 'escrow:funded'
  | 'escrow:milestone_completed'
  | 'escrow:funds_released'
  | 'escrow:status_changed'
  | 'oracle:data_updated';

export interface BlockchainEventData {
  type: BlockchainEvent;
  contractId?: string;
  projectId?: string;
  data: any;
  timestamp: number;
  signature?: string;
}

export interface OracleUpdate {
  contractId: string;
  energyProduction: number;
  confidence: number;
  timestamp: number;
}

export interface TransactionMonitor {
  signature: string;
  contractId: string;
  type: 'deposit' | 'release' | 'create';
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  timestamp: number;
}

type EventCallback = (event: BlockchainEventData) => void;

class BlockchainMonitorService {
  private connection: Connection | null = null;
  private subscriptions: Map<string, number> = new Map();
  private eventCallbacks: Map<BlockchainEvent, EventCallback[]> = new Map();
  private monitoredTransactions: Map<string, TransactionMonitor> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000;
  private isConnected: boolean = false;
  private auditLog: BlockchainEventData[] = [];

  constructor() {
    this.initializeConnection();
  }

  /**
   * WO-118: Initialize Solana connection with auto-reconnect
   */
  private initializeConnection() {
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
      this.connection = new Connection(rpcUrl, {
        commitment: 'confirmed' as Commitment,
        wsEndpoint: rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://'),
      });
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('[WO-118] Blockchain monitoring connected:', rpcUrl);
    } catch (error) {
      console.error('[WO-118] Connection failed:', error);
      this.handleConnectionError();
    }
  }

  /**
   * WO-118: Handle connection errors with retry mechanism
   */
  private handleConnectionError() {
    this.isConnected = false;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`[WO-118] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.initializeConnection();
      }, delay);
    } else {
      console.error('[WO-118] Max reconnection attempts reached');
      this.emitEvent({
        type: 'escrow:status_changed',
        data: { status: 'disconnected', error: 'Failed to connect to blockchain' },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * WO-118: Subscribe to escrow account updates
   */
  async subscribeToEscrowAccount(escrowAccount: string, contractId: string): Promise<void> {
    if (!this.connection) {
      console.error('[WO-118] No connection available');
      return;
    }

    try {
      const accountPubkey = new PublicKey(escrowAccount);
      
      // Subscribe to account changes
      const subscriptionId = this.connection.onAccountChange(
        accountPubkey,
        (accountInfo, context) => {
          console.log('[WO-118] Escrow account changed:', escrowAccount);

          // Emit event
          this.emitEvent({
            type: 'escrow:funded',
            contractId,
            data: {
              balance: accountInfo.lamports / 1e9,
              slot: context.slot,
            },
            timestamp: Date.now(),
          });
        },
        'confirmed'
      );

      this.subscriptions.set(escrowAccount, subscriptionId);
      console.log('[WO-118] Subscribed to escrow account:', escrowAccount);

    } catch (error) {
      console.error('[WO-118] Subscription failed:', error);
    }
  }

  /**
   * WO-118: Monitor transaction status
   */
  async monitorTransaction(
    signature: string,
    contractId: string,
    type: 'deposit' | 'release' | 'create'
  ): Promise<void> {
    if (!this.connection) return;

    const monitor: TransactionMonitor = {
      signature,
      contractId,
      type,
      status: 'pending',
      confirmations: 0,
      timestamp: Date.now(),
    };

    this.monitoredTransactions.set(signature, monitor);

    // WO-118: Poll for transaction confirmation
    const checkStatus = async () => {
      if (!this.connection) return;

      try {
        const status = await this.connection.getSignatureStatus(signature);

        if (status?.value?.confirmationStatus === 'confirmed' || 
            status?.value?.confirmationStatus === 'finalized') {
          
          monitor.status = 'confirmed';
          monitor.confirmations = status.value.confirmationStatus === 'finalized' ? 32 : 1;

          // Emit confirmation event
          this.emitEvent({
            type: type === 'deposit' ? 'escrow:funded' : 
                  type === 'release' ? 'escrow:funds_released' :
                  'escrow:created',
            contractId,
            data: { signature, status: 'confirmed' },
            timestamp: Date.now(),
            signature,
          });

          this.monitoredTransactions.delete(signature);
        } else if (status?.value?.err) {
          monitor.status = 'failed';
          
          this.emitEvent({
            type: 'escrow:status_changed',
            contractId,
            data: { signature, status: 'failed', error: status.value.err },
            timestamp: Date.now(),
          });

          this.monitoredTransactions.delete(signature);
        } else {
          // Still pending, check again
          setTimeout(checkStatus, 2000);
        }
      } catch (error) {
        console.error('[WO-118] Transaction status check failed:', error);
        setTimeout(checkStatus, 5000); // Retry with longer delay
      }
    };

    checkStatus();
  }

  /**
   * WO-118: Start oracle data monitoring
   */
  async startOracleMonitoring(contractId: string, oracleAuthority: string): Promise<void> {
    console.log('[WO-118] Starting oracle monitoring for contract:', contractId);

    // Poll oracle data every 30 seconds
    const pollOracle = async () => {
      try {
        const oracleData = await getOracleData(oracleAuthority, contractId);

        if (oracleData) {
          // WO-118: Timestamp validation
          const dataAge = Date.now() - oracleData.timestamp;
          const isStale = dataAge > 5 * 60 * 1000; // 5 minutes

          if (!isStale && oracleData.confidence >= 0.5) {
            this.emitEvent({
              type: 'oracle:data_updated',
              contractId,
              data: oracleData,
              timestamp: Date.now(),
            });
          }
        }
      } catch (error) {
        console.error('[WO-118] Oracle polling failed:', error);
      }

      // Continue polling
      setTimeout(pollOracle, 30000);
    };

    pollOracle();
  }

  /**
   * WO-118: Register event listener
   */
  on(event: BlockchainEvent, callback: EventCallback): () => void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }

    this.eventCallbacks.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.eventCallbacks.get(event) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * WO-118: Emit event to registered listeners
   */
  private emitEvent(event: BlockchainEventData): void {
    // WO-118: Add to audit trail
    this.auditLog.push(event);
    
    // Keep only last 1000 events
    if (this.auditLog.length > 1000) {
      this.auditLog.shift();
    }

    // Notify listeners
    const callbacks = this.eventCallbacks.get(event.type) || [];
    callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[WO-118] Event callback error:', error);
      }
    });
  }

  /**
   * WO-118: Filter events for user
   */
  filterEventsForUser(userId: string, contractIds: string[]): BlockchainEventData[] {
    return this.auditLog.filter(event => {
      // Filter by contract IDs relevant to user
      if (event.contractId && contractIds.includes(event.contractId)) {
        return true;
      }
      return false;
    });
  }

  /**
   * WO-118: Get audit trail
   */
  getAuditTrail(contractId?: string, limit: number = 100): BlockchainEventData[] {
    let events = this.auditLog;

    if (contractId) {
      events = events.filter(e => e.contractId === contractId);
    }

    return events.slice(-limit);
  }

  /**
   * WO-118: Get monitored transaction status
   */
  getTransactionStatus(signature: string): TransactionMonitor | null {
    return this.monitoredTransactions.get(signature) || null;
  }

  /**
   * WO-118: Get all pending transactions
   */
  getPendingTransactions(): TransactionMonitor[] {
    return Array.from(this.monitoredTransactions.values())
      .filter(tx => tx.status === 'pending');
  }

  /**
   * WO-118: Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    lastSync: number;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      lastSync: this.auditLog.length > 0 
        ? this.auditLog[this.auditLog.length - 1].timestamp 
        : 0,
    };
  }

  /**
   * WO-118: Cleanup subscriptions
   */
  async cleanup(): Promise<void> {
    console.log('[WO-118] Cleaning up subscriptions');

    if (this.connection) {
      for (const [account, subscriptionId] of this.subscriptions.entries()) {
        try {
          await this.connection.removeAccountChangeListener(subscriptionId);
          console.log('[WO-118] Unsubscribed from:', account);
        } catch (error) {
          console.error('[WO-118] Cleanup error:', error);
        }
      }
    }

    this.subscriptions.clear();
    this.eventCallbacks.clear();
  }
}

// WO-118: Singleton instance
let monitorService: BlockchainMonitorService | null = null;

export function getBlockchainMonitor(): BlockchainMonitorService {
  if (!monitorService) {
    monitorService = new BlockchainMonitorService();
  }
  return monitorService;
}

/**
 * WO-118: React Hook for blockchain monitoring
 */
export function useBlockchainMonitoring(contractId?: string) {
  const monitor = getBlockchainMonitor();
  const [events, setEvents] = React.useState<BlockchainEventData[]>([]);
  const [connectionStatus, setConnectionStatus] = React.useState(monitor.getConnectionStatus());

  React.useEffect(() => {
    // Subscribe to all event types
    const unsubscribers = [
      monitor.on('escrow:created', (event) => setEvents(prev => [...prev, event])),
      monitor.on('escrow:funded', (event) => setEvents(prev => [...prev, event])),
      monitor.on('escrow:milestone_completed', (event) => setEvents(prev => [...prev, event])),
      monitor.on('escrow:funds_released', (event) => setEvents(prev => [...prev, event])),
      monitor.on('oracle:data_updated', (event) => setEvents(prev => [...prev, event])),
    ];

    // Update connection status periodically
    const statusInterval = setInterval(() => {
      setConnectionStatus(monitor.getConnectionStatus());
    }, 5000);

    return () => {
      unsubscribers.forEach(unsub => unsub());
      clearInterval(statusInterval);
    };
  }, [monitor]);

  // Filter events for specific contract if provided
  const filteredEvents = contractId
    ? events.filter(e => e.contractId === contractId)
    : events;

  return {
    events: filteredEvents,
    connectionStatus,
    monitor,
  };
}

// Make React available for the hook
import React from 'react';


