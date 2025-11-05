// Global type declarations for EmpowerGRID

import { PhantomWallet } from './types/api';

declare global {
  interface Window {
    solana?: any; // Phantom or other wallet providers
  }
}

export {};






