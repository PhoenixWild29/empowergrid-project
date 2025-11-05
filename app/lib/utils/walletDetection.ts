/**
 * Wallet Detection Utilities
 * 
 * Client-side utilities for detecting wallet availability
 */

export interface PhantomDetectionResult {
  detected: boolean;
  isExtension: boolean;
  isMobile: boolean;
  version: string | null;
  features: string[];
}

/**
 * Detect Phantom wallet availability
 * 
 * @returns Detection result
 */
export function detectPhantomWallet(): PhantomDetectionResult {
  if (typeof window === 'undefined') {
    return {
      detected: false,
      isExtension: false,
      isMobile: false,
      version: null,
      features: [],
    };
  }

  const { solana } = window as any;

  const isPhantom = solana?.isPhantom || false;
  const version = solana?.version || null;

  // Detect mobile via user agent
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return {
    detected: isPhantom,
    isExtension: isPhantom && !isMobile,
    isMobile: isPhantom && isMobile,
    version,
    features: isPhantom ? [
      'signTransaction',
      'signAllTransactions',
      'signMessage',
      'signAndSendTransaction',
    ] : [],
  };
}

/**
 * Detect all supported wallets
 */
export function detectAllWallets() {
  if (typeof window === 'undefined') {
    return {
      phantom: false,
      solflare: false,
      ledger: false,
      glow: false,
      backpack: false,
    };
  }

  return {
    phantom: !!(window as any).solana?.isPhantom,
    solflare: !!(window as any).solflare?.isSolflare,
    ledger: false, // Ledger requires manual setup
    glow: !!(window as any).glow,
    backpack: !!(window as any).backpack,
  };
}






