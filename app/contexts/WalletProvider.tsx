import React, { useMemo, useCallback, useEffect } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletError } from '@solana/wallet-adapter-base';
import { getWalletAdapters, WALLET_CONFIG, WALLET_ERRORS } from '../lib/config/walletProviders';
import { logger } from '../lib/logging/logger';

// Default styles for wallet adapter
require('@solana/wallet-adapter-react-ui/styles.css');

interface WalletProviderWrapperProps {
  children: React.ReactNode;
}

/**
 * WalletProviderWrapper Component
 * 
 * Wraps the application with Solana Wallet Adapter providers
 * 
 * Features:
 * - Multi-wallet support (Phantom, Solflare, Ledger, Glow, Backpack)
 * - Automatic wallet detection
 * - Connection persistence
 * - Network management
 * - Error handling
 * - Event listeners for wallet changes
 */
export default function WalletProviderWrapper({ children }: WalletProviderWrapperProps) {
  const network = WALLET_CONFIG.network;
  const endpoint = useMemo(() => WALLET_CONFIG.endpoint, []);
  
  // Initialize wallet adapters
  const wallets = useMemo(() => getWalletAdapters(network), [network]);

  // Error handler
  const onError = useCallback((error: WalletError) => {
    let errorMessage = WALLET_ERRORS.UNKNOWN_ERROR;

    if (error.message?.includes('User rejected')) {
      errorMessage = WALLET_ERRORS.CONNECTION_REJECTED;
    } else if (error.message?.includes('not installed')) {
      errorMessage = WALLET_ERRORS.NOT_INSTALLED;
    }

    logger.error('Wallet error', {
      error: error.message,
      name: error.name,
    });

    console.error('Wallet error:', errorMessage, error);
  }, []);

  // Log wallet adapter initialization
  useEffect(() => {
    logger.info('Wallet adapters initialized', {
      network,
      endpoint,
      walletCount: wallets.length,
      wallets: wallets.map(w => w.name),
    });
  }, [network, endpoint, wallets]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider
        wallets={wallets}
        onError={onError}
        autoConnect={WALLET_CONFIG.autoConnect}
        localStorageKey={WALLET_CONFIG.localStorageKey}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}




