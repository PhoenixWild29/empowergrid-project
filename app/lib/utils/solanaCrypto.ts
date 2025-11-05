import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { WalletProvider } from '../config/auth';

/**
 * Signature Verification Result
 */
export interface SignatureVerificationResult {
  isValid: boolean;
  error?: string;
  walletAddress?: string;
  provider?: WalletProvider;
}

/**
 * Message Encoding Format
 */
export enum MessageEncoding {
  UTF8 = 'utf8',
  HEX = 'hex',
  BASE58 = 'base58',
  BASE64 = 'base64',
}

/**
 * Verify a Solana wallet signature using ed25519
 * 
 * This function verifies that a message was signed by the private key
 * corresponding to the given public key (wallet address).
 * 
 * @param message - The original message that was signed
 * @param signature - The signature in base58 format
 * @param walletAddress - The wallet's public key address
 * @param encoding - Message encoding format (default: UTF8)
 * @returns Verification result with status and error if any
 */
export function verifySignature(
  message: string,
  signature: string,
  walletAddress: string,
  encoding: MessageEncoding = MessageEncoding.UTF8
): SignatureVerificationResult {
  try {
    // Validate inputs
    if (!message || !signature || !walletAddress) {
      return {
        isValid: false,
        error: 'Missing required parameters: message, signature, or wallet address',
      };
    }

    // Parse wallet address (public key)
    let publicKey: PublicKey;
    try {
      publicKey = new PublicKey(walletAddress);
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid wallet address format',
      };
    }

    // Decode signature from base58
    let signatureBytes: Uint8Array;
    try {
      signatureBytes = bs58.decode(signature);
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid signature format. Expected base58 encoded signature.',
      };
    }

    // Validate signature length (ed25519 signatures are 64 bytes)
    if (signatureBytes.length !== 64) {
      return {
        isValid: false,
        error: `Invalid signature length. Expected 64 bytes, got ${signatureBytes.length}`,
      };
    }

    // Encode message to bytes
    const messageBytes = encodeMessage(message, encoding);

    // Get public key bytes
    const publicKeyBytes = publicKey.toBytes();

    // Verify signature using ed25519
    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!isValid) {
      return {
        isValid: false,
        error: 'Signature verification failed. The signature does not match the message and wallet address.',
      };
    }

    return {
      isValid: true,
      walletAddress,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error during signature verification',
    };
  }
}

/**
 * Verify a signature with provider-specific handling
 * 
 * Different wallet providers may have slight variations in how they
 * sign messages. This function handles those variations.
 * 
 * @param message - Original message
 * @param signature - Signature string
 * @param walletAddress - Wallet public key
 * @param provider - Wallet provider type
 * @returns Verification result
 */
export function verifySignatureWithProvider(
  message: string,
  signature: string,
  walletAddress: string,
  provider: WalletProvider = WalletProvider.UNKNOWN
): SignatureVerificationResult {
  // For most providers, standard verification works
  // Add provider-specific handling if needed in the future
  
  const result = verifySignature(message, signature, walletAddress);
  
  return {
    ...result,
    provider,
  };
}

/**
 * Encode message to bytes based on encoding format
 * 
 * @param message - Message string
 * @param encoding - Encoding format
 * @returns Uint8Array of message bytes
 */
function encodeMessage(
  message: string,
  encoding: MessageEncoding
): Uint8Array {
  switch (encoding) {
    case MessageEncoding.UTF8:
      return new TextEncoder().encode(message);
    
    case MessageEncoding.HEX:
      return hexToBytes(message);
    
    case MessageEncoding.BASE58:
      return bs58.decode(message);
    
    case MessageEncoding.BASE64:
      return base64ToBytes(message);
    
    default:
      return new TextEncoder().encode(message);
  }
}

/**
 * Convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Convert base64 string to bytes
 */
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Validate that a string is a valid Solana wallet address
 * 
 * @param address - Address string to validate
 * @returns boolean indicating validity
 */
export function isValidWalletAddress(address: string): boolean {
  try {
    const publicKey = new PublicKey(address);
    return PublicKey.isOnCurve(publicKey.toBytes());
  } catch {
    return false;
  }
}

/**
 * Validate signature format (base58 encoded, 64 bytes when decoded)
 * 
 * @param signature - Signature string
 * @returns boolean indicating validity
 */
export function isValidSignatureFormat(signature: string): boolean {
  try {
    const decoded = bs58.decode(signature);
    return decoded.length === 64;
  } catch {
    return false;
  }
}

/**
 * Create a message prefix (some wallets add prefixes)
 * 
 * @param message - Original message
 * @param prefix - Prefix to add
 * @returns Prefixed message
 */
export function addMessagePrefix(message: string, prefix?: string): string {
  if (!prefix) {
    return message;
  }
  return `${prefix}${message}`;
}

/**
 * Prepare a message for signing (adds standard Solana message prefix)
 * This matches what many Solana wallets expect
 * 
 * @param message - Message to prepare
 * @returns Prepared message
 */
export function prepareMessageForSigning(message: string): string {
  // Some wallets prepend a standard message
  // For now, return as-is since we control the challenge format
  return message;
}

/**
 * Verify multiple signatures (batch verification)
 * Useful for validating multiple authentication attempts
 * 
 * @param verifications - Array of verification requests
 * @returns Array of verification results
 */
export function verifySignatureBatch(
  verifications: Array<{
    message: string;
    signature: string;
    walletAddress: string;
    provider?: WalletProvider;
  }>
): SignatureVerificationResult[] {
  return verifications.map(({ message, signature, walletAddress, provider }) =>
    verifySignatureWithProvider(message, signature, walletAddress, provider)
  );
}

/**
 * Extract wallet provider from signature metadata
 * This is a heuristic approach - not always accurate
 * 
 * @param userAgent - User agent string
 * @param metadata - Additional metadata
 * @returns Detected wallet provider
 */
export function detectWalletProviderFromSignature(
  userAgent?: string,
  metadata?: Record<string, any>
): WalletProvider {
  if (!userAgent && !metadata) {
    return WalletProvider.UNKNOWN;
  }

  const ua = (userAgent || '').toLowerCase();
  
  // Check user agent
  if (ua.includes('phantom')) return WalletProvider.PHANTOM;
  if (ua.includes('solflare')) return WalletProvider.SOLFLARE;
  if (ua.includes('ledger')) return WalletProvider.LEDGER;
  if (ua.includes('sollet')) return WalletProvider.SOLLET;
  if (ua.includes('glow')) return WalletProvider.GLOW;
  if (ua.includes('backpack')) return WalletProvider.BACKPACK;

  // Check metadata if provided
  if (metadata) {
    const provider = metadata.provider || metadata.walletProvider || metadata.wallet;
    if (typeof provider === 'string') {
      const providerLower = provider.toLowerCase();
      if (providerLower === 'phantom') return WalletProvider.PHANTOM;
      if (providerLower === 'solflare') return WalletProvider.SOLFLARE;
      if (providerLower === 'ledger') return WalletProvider.LEDGER;
      if (providerLower === 'sollet') return WalletProvider.SOLLET;
      if (providerLower === 'glow') return WalletProvider.GLOW;
      if (providerLower === 'backpack') return WalletProvider.BACKPACK;
    }
  }

  return WalletProvider.UNKNOWN;
}

/**
 * Normalize wallet address to standard format
 * 
 * @param address - Wallet address
 * @returns Normalized address string
 */
export function normalizeWalletAddress(address: string): string {
  try {
    const publicKey = new PublicKey(address);
    return publicKey.toBase58();
  } catch {
    return address;
  }
}

/**
 * Compare two wallet addresses for equality
 * 
 * @param address1 - First address
 * @param address2 - Second address
 * @returns boolean indicating if addresses are equal
 */
export function compareWalletAddresses(
  address1: string,
  address2: string
): boolean {
  try {
    const pubKey1 = new PublicKey(address1);
    const pubKey2 = new PublicKey(address2);
    return pubKey1.equals(pubKey2);
  } catch {
    return address1 === address2;
  }
}

/**
 * Generate a random challenge message for testing
 * DO NOT use in production - use the challenge endpoint
 * 
 * @returns Random challenge message
 */
export function generateTestChallenge(): {
  message: string;
  timestamp: number;
} {
  const timestamp = Date.now();
  const message = `Test authentication for EmpowerGRID\nTimestamp: ${timestamp}`;
  
  return {
    message,
    timestamp,
  };
}

/**
 * Export for testing
 */
export const __TEST__ = {
  encodeMessage,
  hexToBytes,
  base64ToBytes,
};






