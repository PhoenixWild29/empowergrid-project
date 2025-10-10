import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

/**
 * Configuration for nonce generation and validation
 */
export const NONCE_CONFIG = {
  EXPIRY_MINUTES: 5, // Challenge expires after 5 minutes
  NONCE_LENGTH: 32, // Length of the random component
  ALGORITHM: 'sha256', // Hash algorithm for additional security
};

/**
 * Interface for a generated nonce with metadata
 */
export interface GeneratedNonce {
  nonce: string;
  timestamp: number;
  expiresAt: Date;
  hash: string; // Additional hash for verification
}

/**
 * Interface for nonce validation result
 */
export interface NonceValidationResult {
  isValid: boolean;
  error?: string;
  nonce?: string;
}

/**
 * In-memory store for active nonces (in production, use Redis or database)
 * Key: nonce, Value: GeneratedNonce
 */
const nonceStore = new Map<string, GeneratedNonce>();

/**
 * Generate a unique cryptographic nonce with timestamp validation
 * 
 * The nonce is composed of:
 * - UUID v4 for global uniqueness
 * - Nanoid for additional entropy
 * - Timestamp for expiry validation
 * - SHA256 hash for verification
 * 
 * @param walletAddress - Optional wallet address to bind nonce to specific user
 * @returns GeneratedNonce object with nonce, timestamp, and expiry
 */
export function generateNonce(walletAddress?: string): GeneratedNonce {
  const timestamp = Date.now();
  const uuid = uuidv4();
  const randomId = nanoid(NONCE_CONFIG.NONCE_LENGTH);
  
  // Combine components to create a unique nonce
  const nonceComponents = [uuid, randomId, timestamp.toString()];
  if (walletAddress) {
    nonceComponents.push(walletAddress);
  }
  
  const nonce = nonceComponents.join(':');
  
  // Create a hash for additional verification
  const hash = crypto
    .createHash(NONCE_CONFIG.ALGORITHM)
    .update(nonce)
    .digest('hex');
  
  const expiresAt = new Date(
    timestamp + NONCE_CONFIG.EXPIRY_MINUTES * 60 * 1000
  );
  
  const generatedNonce: GeneratedNonce = {
    nonce,
    timestamp,
    expiresAt,
    hash,
  };
  
  // Store nonce for validation
  nonceStore.set(nonce, generatedNonce);
  
  // Clean up expired nonces periodically
  cleanupExpiredNonces();
  
  return generatedNonce;
}

/**
 * Validate a nonce for authenticity and expiry
 * 
 * Checks:
 * 1. Nonce exists in store
 * 2. Nonce hasn't expired
 * 3. Hash matches for integrity verification
 * 
 * @param nonce - The nonce to validate
 * @returns NonceValidationResult with validation status and error if any
 */
export function validateNonce(nonce: string): NonceValidationResult {
  // Check if nonce exists
  const storedNonce = nonceStore.get(nonce);
  
  if (!storedNonce) {
    return {
      isValid: false,
      error: 'Nonce not found or already used',
    };
  }
  
  // Check if nonce has expired
  const now = new Date();
  if (now > storedNonce.expiresAt) {
    // Remove expired nonce
    nonceStore.delete(nonce);
    return {
      isValid: false,
      error: 'Nonce has expired',
    };
  }
  
  // Verify hash integrity
  const calculatedHash = crypto
    .createHash(NONCE_CONFIG.ALGORITHM)
    .update(nonce)
    .digest('hex');
  
  if (calculatedHash !== storedNonce.hash) {
    return {
      isValid: false,
      error: 'Nonce integrity check failed',
    };
  }
  
  return {
    isValid: true,
    nonce,
  };
}

/**
 * Mark a nonce as used (consumed) to prevent replay attacks
 * 
 * @param nonce - The nonce to mark as used
 * @returns boolean indicating if nonce was successfully marked as used
 */
export function consumeNonce(nonce: string): boolean {
  const validation = validateNonce(nonce);
  
  if (!validation.isValid) {
    return false;
  }
  
  // Remove nonce from store to prevent reuse
  nonceStore.delete(nonce);
  return true;
}

/**
 * Clean up expired nonces from the store
 * This prevents memory leaks and keeps the store size manageable
 */
export function cleanupExpiredNonces(): void {
  const now = new Date();
  const expiredNonces: string[] = [];
  
  // Find all expired nonces
  nonceStore.forEach((value, key) => {
    if (now > value.expiresAt) {
      expiredNonces.push(key);
    }
  });
  
  // Remove expired nonces
  expiredNonces.forEach(nonce => nonceStore.delete(nonce));
}

/**
 * Get the total number of active nonces in the store
 * Useful for monitoring and debugging
 */
export function getActiveNonceCount(): number {
  cleanupExpiredNonces();
  return nonceStore.size;
}

/**
 * Clear all nonces from the store
 * Use with caution - mainly for testing purposes
 */
export function clearAllNonces(): void {
  nonceStore.clear();
}

/**
 * Create a user-friendly challenge message for wallet signing
 * 
 * @param nonce - The nonce to include in the message
 * @param walletAddress - Optional wallet address to personalize the message
 * @returns Formatted challenge message
 */
export function createChallengeMessage(
  nonce: string,
  walletAddress?: string
): string {
  const timestamp = new Date().toISOString();
  
  let message = `Sign this message to authenticate with EmpowerGRID.\n\n`;
  message += `This request will not trigger any blockchain transaction or cost any gas fees.\n\n`;
  
  if (walletAddress) {
    message += `Wallet: ${walletAddress}\n`;
  }
  
  message += `Timestamp: ${timestamp}\n`;
  message += `Nonce: ${nonce}\n\n`;
  message += `This signature request will expire in ${NONCE_CONFIG.EXPIRY_MINUTES} minutes.`;
  
  return message;
}

/**
 * Export store for testing purposes
 * DO NOT use in production code
 */
export const __TEST__ = {
  nonceStore,
};


