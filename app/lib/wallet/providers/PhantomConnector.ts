/**
 * Phantom Wallet Connector
 * 
 * Provider-specific connection logic for Phantom wallet
 */

import { PublicKey } from '@solana/web3.js';

export interface PhantomConnectionOptions {
  onlyIfTrusted?: boolean;
  timeout?: number;
}

export interface PhantomConnectionResult {
  success: boolean;
  publicKey?: PublicKey;
  method: 'extension' | 'mobile' | 'none';
  error?: string;
}

/**
 * Connect to Phantom wallet
 * 
 * Supports:
 * - Browser extension (primary)
 * - Mobile app deep linking (fallback)
 */
export class PhantomConnector {
  private timeout: number;

  constructor(timeout: number = 30000) {
    this.timeout = timeout;
  }

  /**
   * Attempt connection to Phantom wallet
   */
  async connect(options: PhantomConnectionOptions = {}): Promise<PhantomConnectionResult> {
    // Check if browser extension is available
    if (this.isExtensionAvailable()) {
      return this.connectExtension(options);
    }

    // Fallback to mobile deep linking
    if (this.isMobileDevice()) {
      return this.connectMobile();
    }

    return {
      success: false,
      method: 'none',
      error: 'Phantom wallet not found. Please install Phantom.',
    };
  }

  /**
   * Connect via browser extension
   */
  private async connectExtension(options: PhantomConnectionOptions): Promise<PhantomConnectionResult> {
    try {
      const { solana } = window as any;

      if (!solana || !solana.isPhantom) {
        return {
          success: false,
          method: 'extension',
          error: 'Phantom extension not found',
        };
      }

      // Connect with timeout
      const connectPromise = solana.connect(options);
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
   * Connect via mobile deep linking
   */
  private connectMobile(): PhantomConnectionResult {
    try {
      const currentUrl = window.location.href;
      const deepLink = `https://phantom.app/ul/v1/connect?app_url=${encodeURIComponent(currentUrl)}`;
      
      window.location.href = deepLink;

      return {
        success: true,
        method: 'mobile',
      };
    } catch (error) {
      return {
        success: false,
        method: 'mobile',
        error: 'Failed to initiate mobile deep link',
      };
    }
  }

  /**
   * Check if Phantom extension is available
   */
  private isExtensionAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    const { solana } = window as any;
    return solana?.isPhantom || false;
  }

  /**
   * Check if on mobile device
   */
  private isMobileDevice(): boolean {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }

  /**
   * Get Phantom version
   */
  getVersion(): string | null {
    if (typeof window === 'undefined') return null;
    const { solana } = window as any;
    return solana?.version || null;
  }
}

export const phantomConnector = new PhantomConnector();




