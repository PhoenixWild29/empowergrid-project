/**
 * Multi-Provider Wallet Connection Manager
 * 
 * Orchestrates connection flows for all supported wallet providers
 */

import { PublicKey } from '@solana/web3.js';
import { phantomConnector, PhantomConnectionResult } from './providers/PhantomConnector';
import { solflareConnector, SolflareConnectionResult } from './providers/SolflareConnector';
import { ledgerConnector, LedgerConnectionResult } from './providers/LedgerConnector';

export type WalletProviderType = 'phantom' | 'solflare' | 'ledger' | 'glow' | 'backpack';

export interface ConnectionManagerOptions {
  provider: WalletProviderType;
  timeout?: number;
  preferredMethod?: 'extension' | 'web' | 'mobile';
}

export interface UnifiedConnectionResult {
  success: boolean;
  provider: WalletProviderType;
  publicKey?: PublicKey;
  method: 'extension' | 'web' | 'mobile' | 'hardware' | 'none';
  error?: string;
  requiresSetup?: boolean;
  setupSteps?: any[];
}

/**
 * ConnectionManager Class
 * 
 * Central manager for all wallet connection flows
 */
export class ConnectionManager {
  /**
   * Connect to wallet provider
   * 
   * @param options - Connection options
   * @returns Unified connection result
   */
  async connect(options: ConnectionManagerOptions): Promise<UnifiedConnectionResult> {
    switch (options.provider) {
      case 'phantom':
        return this.connectPhantom(options);
      
      case 'solflare':
        return this.connectSolflare(options);
      
      case 'ledger':
        return this.connectLedger(options);
      
      default:
        return {
          success: false,
          provider: options.provider,
          method: 'none',
          error: `Provider ${options.provider} not supported yet`,
        };
    }
  }

  /**
   * Connect to Phantom
   */
  private async connectPhantom(options: ConnectionManagerOptions): Promise<UnifiedConnectionResult> {
    const result = await phantomConnector.connect({
      timeout: options.timeout,
    });

    return {
      success: result.success,
      provider: 'phantom',
      publicKey: result.publicKey,
      method: result.method as 'extension' | 'web' | 'mobile',
      error: result.error,
    };
  }

  /**
   * Connect to Solflare
   */
  private async connectSolflare(options: ConnectionManagerOptions): Promise<UnifiedConnectionResult> {
    const result = await solflareConnector.connect({
      preferredMethod: options.preferredMethod as 'extension' | 'web' | undefined,
      timeout: options.timeout,
    });

    return {
      success: result.success,
      provider: 'solflare',
      publicKey: result.publicKey,
      method: result.method as 'extension' | 'web' | 'mobile' | 'hardware' | 'none',
      error: result.error,
    };
  }

  /**
   * Connect to Ledger
   */
  private async connectLedger(options: ConnectionManagerOptions): Promise<UnifiedConnectionResult> {
    const result = await ledgerConnector.connect({
      timeout: options.timeout,
    });

    return {
      success: result.success,
      provider: 'ledger',
      publicKey: result.publicKey,
      method: 'hardware',
      error: result.error,
      requiresSetup: true,
      setupSteps: ledgerConnector.getSetupInstructions(),
    };
  }

  /**
   * Get recommended connection method for provider
   */
  getRecommendedMethod(provider: WalletProviderType): 'extension' | 'web' | 'mobile' | 'hardware' {
    const recommendations: Record<WalletProviderType, any> = {
      phantom: 'extension',
      solflare: 'extension',
      ledger: 'hardware',
      glow: 'mobile',
      backpack: 'extension',
    };

    return recommendations[provider] || 'extension';
  }
}

export const connectionManager = new ConnectionManager();

