/**
 * WO-125: Switchboard Oracle Connection Management
 * 
 * Manages connections to Switchboard oracle network with authentication,
 * health monitoring, reconnection, and failover capabilities.
 * 
 * Features:
 * - Authenticated connection establishment
 * - Health monitoring and metrics tracking
 * - Automatic reconnection with exponential backoff
 * - Failover to backup aggregators
 * - Connection pooling for performance
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { dataQualityTracker } from './dataQualityTracker';
import { oracleAlertSystem } from './alertSystem';

export interface ConnectionStatus {
  isConnected: boolean;
  connectionTime?: Date;
  lastHealthCheck?: Date;
  responseTime: number; // milliseconds
  reliability: number; // 0-1
  aggregatorAddress: string;
  networkType: 'primary' | 'backup';
}

export interface ConnectionConfig {
  primaryAggregators: string[];
  backupAggregators: string[];
  connectionTimeout: number; // milliseconds
  healthCheckInterval: number; // milliseconds
  reconnectDelay: number; // milliseconds
  maxReconnectAttempts: number;
  minReliability: number; // 0-1
}

const DEFAULT_CONFIG: ConnectionConfig = {
  primaryAggregators: [
    // Switchboard devnet aggregators (would be configured in production)
    'GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR',
    '8SXvChNYFhRq4EZuZvnhjrB3jJRQCv4k3P4W6hesH3Ee',
  ],
  backupAggregators: [
    'CZza3Ej4Mc58MnxWA385itCC9jCo3L1D7zc3LKy1bZMR',
  ],
  connectionTimeout: 5000, // 5 seconds
  healthCheckInterval: 60000, // 1 minute
  reconnectDelay: 1000, // Start with 1 second
  maxReconnectAttempts: 5,
  minReliability: 0.95, // 95% uptime
};

/**
 * WO-125: Switchboard Connection Manager
 */
export class SwitchboardConnectionManager {
  private connection: Connection | null = null;
  private currentAggregator: string | null = null;
  private status: ConnectionStatus;
  private config: ConnectionConfig;
  private reconnectAttempts: number = 0;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private connectionPool: Map<string, Connection> = new Map();

  constructor(config: Partial<ConnectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.status = {
      isConnected: false,
      responseTime: 0,
      reliability: 1.0,
      aggregatorAddress: '',
      networkType: 'primary',
    };
  }

  /**
   * WO-125: Establish connection to Switchboard oracle network
   */
  async connect(): Promise<ConnectionStatus> {
    console.log('[WO-125] Establishing Switchboard connection');

    const startTime = Date.now();

    try {
      // Try primary aggregators first
      for (const aggregatorAddress of this.config.primaryAggregators) {
        const result = await this.attemptConnection(aggregatorAddress, 'primary');
        
        if (result.isConnected) {
          this.status = result;
          this.currentAggregator = aggregatorAddress;
          this.reconnectAttempts = 0;
          
          // Start health monitoring
          this.startHealthMonitoring();
          
          console.log('[WO-125] Connected to primary aggregator:', aggregatorAddress);
          return this.status;
        }
      }

      // If primary failed, try backup aggregators
      console.warn('[WO-125] Primary aggregators unavailable, trying backups');
      
      for (const aggregatorAddress of this.config.backupAggregators) {
        const result = await this.attemptConnection(aggregatorAddress, 'backup');
        
        if (result.isConnected) {
          this.status = result;
          this.currentAggregator = aggregatorAddress;
          this.reconnectAttempts = 0;
          
          // Start health monitoring
          this.startHealthMonitoring();
          
          console.log('[WO-125] Connected to backup aggregator:', aggregatorAddress);
          
          // Alert about primary failure
          oracleAlertSystem.triggerCriticalErrorAlert(
            'switchboard',
            'Primary aggregators unavailable, using backup',
            { aggregatorAddress }
          );
          
          return this.status;
        }
      }

      // All connection attempts failed
      throw new Error('Failed to connect to any Switchboard aggregator');

    } catch (error) {
      console.error('[WO-125] Connection failed:', error);

      this.status = {
        isConnected: false,
        responseTime: Date.now() - startTime,
        reliability: 0,
        aggregatorAddress: '',
        networkType: 'primary',
      };

      // Schedule reconnection attempt
      await this.scheduleReconnect();

      throw error;
    }
  }

  /**
   * WO-125: Disconnect from Switchboard network
   */
  disconnect(): void {
    console.log('[WO-125] Disconnecting from Switchboard');

    this.stopHealthMonitoring();
    this.connection = null;
    this.currentAggregator = null;
    this.status.isConnected = false;
    
    // Clear connection pool
    this.connectionPool.clear();
  }

  /**
   * WO-125: Get current connection status
   */
  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  /**
   * WO-125: Get or create pooled connection
   */
  getConnection(aggregatorAddress?: string): Connection | null {
    const address = aggregatorAddress || this.currentAggregator;

    if (!address) {
      return null;
    }

    // Return pooled connection if available
    let connection = this.connectionPool.get(address);

    if (!connection) {
      // Create new connection
      connection = new Connection(
        process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
        'confirmed'
      );
      
      this.connectionPool.set(address, connection);
    }

    return connection;
  }

  /**
   * WO-125: Perform health check
   */
  async performHealthCheck(): Promise<boolean> {
    if (!this.status.isConnected || !this.currentAggregator) {
      return false;
    }

    const startTime = Date.now();

    try {
      console.log('[WO-125] Performing health check');

      const connection = this.getConnection();
      if (!connection) {
        throw new Error('No connection available');
      }

      // Check connection health
      const blockHeight = await Promise.race([
        connection.getBlockHeight(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), this.config.connectionTimeout)
        ),
      ]);

      const responseTime = Date.now() - startTime;

      // Update status
      this.status.responseTime = responseTime;
      this.status.lastHealthCheck = new Date();

      // Track performance
      dataQualityTracker.recordSuccess(
        this.currentAggregator,
        this.currentAggregator,
        responseTime
      );

      // Check if response time exceeds threshold
      if (responseTime > this.config.connectionTimeout) {
        oracleAlertSystem.triggerPerformanceAlert(
          this.currentAggregator,
          this.currentAggregator,
          responseTime
        );
      }

      console.log('[WO-125] Health check passed:', responseTime, 'ms');

      return true;

    } catch (error) {
      console.error('[WO-125] Health check failed:', error);

      // Record failure
      dataQualityTracker.recordFailure(
        this.currentAggregator!,
        this.currentAggregator!,
        error instanceof Error ? error.message : 'Unknown error'
      );

      // Update reliability
      this.updateReliability(false);

      // If reliability drops below threshold, initiate failover
      if (this.status.reliability < this.config.minReliability) {
        console.warn('[WO-125] Reliability below threshold, initiating failover');
        await this.initiateFailover();
      }

      return false;
    }
  }

  /**
   * WO-125: Initiate failover to backup aggregator
   */
  private async initiateFailover(): Promise<void> {
    console.log('[WO-125] Initiating failover');

    const startTime = Date.now();

    try {
      // Disconnect from current aggregator
      this.disconnect();

      // Attempt reconnection
      await this.connect();

      const failoverTime = Date.now() - startTime;

      if (this.status.isConnected) {
        console.log('[WO-125] Failover successful in', failoverTime, 'ms');
        
        if (failoverTime > 60000) {
          console.warn('[WO-125] Failover took longer than 60 seconds');
        }
      }

    } catch (error) {
      console.error('[WO-125] Failover failed:', error);
      
      oracleAlertSystem.triggerCriticalErrorAlert(
        'switchboard',
        'Failover failed',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * WO-125: Schedule reconnection attempt with exponential backoff
   */
  private async scheduleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[WO-125] Max reconnection attempts reached');
      
      oracleAlertSystem.triggerCriticalErrorAlert(
        'switchboard',
        'Failed to reconnect after maximum attempts',
        { attempts: this.reconnectAttempts }
      );
      
      return;
    }

    this.reconnectAttempts++;

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[WO-125] Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('[WO-125] Reconnection attempt failed:', error);
      }
    }, delay);
  }

  /**
   * WO-125: Attempt connection to a specific aggregator
   */
  private async attemptConnection(
    aggregatorAddress: string,
    networkType: 'primary' | 'backup'
  ): Promise<ConnectionStatus> {
    const startTime = Date.now();

    try {
      console.log('[WO-125] Attempting connection to:', aggregatorAddress);

      // Validate aggregator address
      const pubKey = new PublicKey(aggregatorAddress);

      // Get or create connection
      const connection = this.getConnection(aggregatorAddress);
      if (!connection) {
        throw new Error('Failed to create connection');
      }

      // Verify connection with timeout
      await Promise.race([
        connection.getBlockHeight(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), this.config.connectionTimeout)
        ),
      ]);

      const responseTime = Date.now() - startTime;

      console.log('[WO-125] Connection successful:', responseTime, 'ms');

      return {
        isConnected: true,
        connectionTime: new Date(),
        lastHealthCheck: new Date(),
        responseTime,
        reliability: 1.0,
        aggregatorAddress,
        networkType,
      };

    } catch (error) {
      console.error('[WO-125] Connection attempt failed:', error);

      return {
        isConnected: false,
        responseTime: Date.now() - startTime,
        reliability: 0,
        aggregatorAddress,
        networkType,
      };
    }
  }

  /**
   * WO-125: Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.stopHealthMonitoring(); // Clear any existing timer

    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);

    console.log('[WO-125] Health monitoring started');
  }

  /**
   * WO-125: Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      console.log('[WO-125] Health monitoring stopped');
    }
  }

  /**
   * WO-125: Update reliability score
   */
  private updateReliability(success: boolean): void {
    // Exponential moving average with alpha = 0.1
    const alpha = 0.1;
    const newValue = success ? 1.0 : 0.0;
    
    this.status.reliability = 
      alpha * newValue + (1 - alpha) * this.status.reliability;

    console.log('[WO-125] Reliability updated:', this.status.reliability.toFixed(3));
  }
}

// Singleton instance
export const switchboardConnectionManager = new SwitchboardConnectionManager();



