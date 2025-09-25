// Central export file for all TypeScript types

export * from './program';
export * from './api';

// Re-export commonly used types from external libraries
export type { PublicKey } from '@solana/web3.js';

// ---- Utility Functions ----

import { PublicKey } from '@solana/web3.js';

/**
 * Convert lamports to SOL
 */
export const lamportsToSol = (lamports: number): number => {
  return lamports / 1_000_000_000;
};

/**
 * Convert SOL to lamports
 */
export const solToLamports = (sol: number): number => {
  return Math.floor(sol * 1_000_000_000);
};

/**
 * Format a public key for display
 */
export const formatPublicKey = (key: PublicKey | string, length: number = 5): string => {
  const keyStr = typeof key === 'string' ? key : key.toString();
  if (keyStr.length <= 40) return keyStr;
  return `${keyStr.slice(0, length)}...${keyStr.slice(-length)}`;
};

/**
 * Validate a Solana public key string
 */
export const isValidPublicKey = (key: string): boolean => {
  if (!key || key.length !== 32 && key.length !== 44) return false;
  try {
    new PublicKey(key);
    return true;
  } catch {
    return false;
  }
};

/**
 * Calculate project funding progress
 */
export const calculateFundingProgress = (
  fundedAmount: number,
  numMilestones: number,
  avgMilestoneAmount: number = 1 * 1_000_000_000 // 1 SOL in lamports
): number => {
  if (numMilestones === 0) return 0;
  const targetAmount = numMilestones * avgMilestoneAmount;
  return Math.min((fundedAmount / targetAmount) * 100, 100);
};

/**
 * Format large numbers with appropriate units
 */
export const formatNumber = (num: number, decimals: number = 2): string => {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(decimals)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(decimals)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(decimals)}K`;
  }
  return num.toString();
};

/**
 * Sleep utility for async operations
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry utility for async operations
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  attempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (attempts <= 1) throw error;
    await sleep(delay);
    return retry(fn, attempts - 1, delay * 2);
  }
};