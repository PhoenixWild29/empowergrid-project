/**
 * Solflare Wallet Connector
 * 
 * Provider-specific connection logic for Solflare wallet
 */

import { PublicKey } from '@solana/web3.js';

export interface SolflareConnectionOptions {
  preferredMethod?: 'extension' | 'web';
  timeout?: number;
}

export interface SolflareConnectionResult {
  success: boolean;
  publicKey?: PublicKey;
  method: 'extension' | 'web' | 'none';
  error?: string;
}

/**
 * Connect to Solflare wallet
 * 
 * Supports:
 * - Browser extension
 * - Web wallet (solflare.com)
 */
export class SolflareConnector {
  private timeout: number;

  constructor(timeout: number = 30000) {
    this.timeout = timeout;
  }

  /**
   * Attempt connection to Solflare wallet
   */
  async connect(options: SolflareConnectionOptions = {}): Promise<SolflareConnectionResult> {
    // Check for browser extension
    if (this.isExtensionAvailable() && options.preferredMethod !== 'web') {
      return this.connectExtension();
    }

    // Fallback to web wallet
    return this.connectWebWallet();
  }

  /**
   * Connect via browser extension
   */
  private async connectExtension(): Promise<SolflareConnectionResult> {
    try {
      const { solflare } = window as any;

      if (!solflare || !solflare.isSolflare) {
        return {
          success: false,
          method: 'extension',
          error: 'Solflare extension not found',
        };
      }

      const connectPromise = solflare.connect();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), this.timeout)
      );

      const response = await Promise.race([connectPromise, timeoutPromise]);
      const publicKey = new PublicKey(response.publicKey.toString());

      return {
        success: true,
        publicKey,
        method: 'extension',
      };
    } catch (error) {
      return {
        success: false,
        method: 'extension',
        error: error instanceof Error ? error.message : 'Extension connection failed',
      };
    }
  }

  /**
   * Connect via web wallet
   */
  private connectWebWallet(): SolflareConnectionResult {
    try {
      // Open Solflare web wallet
      const returnUrl = encodeURIComponent(window.location.href);
      const webWalletUrl = `https://solflare.com/access-wallet?return_url=${returnUrl}`;
      
      window.open(webWalletUrl, '_blank', 'noopener,noreferrer');

      return {
        success: true,
        method: 'web',
      };
    } catch (error) {
      return {
        success: false,
        method: 'web',
        error: 'Failed to open web wallet',
      };
    }
  }

  /**
   * Check if Solflare extension is available
   */
  private isExtensionAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    const { solflare } = window as any;
    return solflare?.isSolflare || false;
  }
}

export const solflareConnector = new SolflareConnector();




