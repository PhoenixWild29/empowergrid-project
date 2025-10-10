/**
 * Solana Wallet Adapter Configuration
 * 
 * Configures supported wallet providers for EmpowerGRID
 */

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { LedgerWalletAdapter } from '@solana/wallet-adapter-ledger';
import { GlowWalletAdapter } from '@solana/wallet-adapter-glow';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import { clusterApiUrl } from '@solana/web3.js';

/**
 * Wallet provider configuration
 */
export const WALLET_CONFIG = {
  network: (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork) || WalletAdapterNetwork.Devnet,
  endpoint: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(WalletAdapterNetwork.Devnet),
  autoConnect: true, // Automatically connect to previously used wallet
  localStorageKey: 'empowergrid_wallet_adapter',
};

/**
 * Initialize wallet adapters
 * 
 * @param network - Solana network (devnet, mainnet-beta, testnet)
 * @returns Array of wallet adapters
 */
export function getWalletAdapters(network: WalletAdapterNetwork = WALLET_CONFIG.network) {
  return [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network }),
    new LedgerWalletAdapter(),
    new GlowWalletAdapter(),
    new BackpackWalletAdapter(),
  ];
}

/**
 * Wallet provider metadata
 */
export const WALLET_METADATA = {
  phantom: {
    name: 'Phantom',
    icon: '👻',
    description: 'Popular Solana wallet with best-in-class UX',
    url: 'https://phantom.app/',
    features: ['signTransaction', 'signMessage', 'signAllTransactions'],
  },
  solflare: {
    name: 'Solflare',
    icon: '🔥',
    description: 'Secure Solana wallet for web and mobile',
    url: 'https://solflare.com/',
    features: ['signTransaction', 'signMessage', 'signAllTransactions'],
  },
  ledger: {
    name: 'Ledger',
    icon: '🔐',
    description: 'Hardware wallet for maximum security',
    url: 'https://www.ledger.com/',
    features: ['signTransaction', 'signAllTransactions'],
  },
  glow: {
    name: 'Glow',
    icon: '✨',
    description: 'Mobile-first Solana wallet',
    url: 'https://glow.app/',
    features: ['signTransaction', 'signMessage'],
  },
  backpack: {
    name: 'Backpack',
    icon: '🎒',
    description: 'Multi-chain wallet with Solana support',
    url: 'https://backpack.app/',
    features: ['signTransaction', 'signMessage'],
  },
};

/**
 * Wallet error messages
 */
export const WALLET_ERRORS = {
  NOT_INSTALLED: 'Wallet extension not found. Please install it from the official website.',
  CONNECTION_REJECTED: 'Wallet connection rejected. Please try again.',
  SIGNATURE_REJECTED: 'Signature request rejected. Authentication cannot proceed without approval.',
  DISCONNECTED: 'Wallet was disconnected. Please reconnect to continue.',
  NETWORK_MISMATCH: 'Wallet network does not match application network. Please switch networks.',
  ACCOUNT_CHANGED: 'Wallet account changed. Please authenticate with the new account.',
  UNKNOWN_ERROR: 'An unexpected wallet error occurred. Please try again.',
};




