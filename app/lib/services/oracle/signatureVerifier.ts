/**
 * WO-135: Oracle Signature Verification
 * 
 * Validates oracle signatures using Switchboard's cryptographic protocols
 * to ensure data integrity and authenticity.
 * 
 * Features:
 * - Ed25519 signature verification
 * - Public key validation
 * - Signature format checking
 * - Error handling and logging
 */

import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';

export interface SignatureVerificationResult {
  isValid: boolean;
  publicKey?: string;
  error?: string;
  timestamp: Date;
}

/**
 * WO-135: Verify oracle signature using Switchboard's cryptographic protocols
 * 
 * @param signature - Base64 or hex encoded signature
 * @param message - The message/data that was signed
 * @param publicKey - Public key of the oracle (Solana address)
 * @returns Verification result with status and details
 */
export async function verifyOracleSignature(
  signature: string,
  message: string | Buffer,
  publicKey: string
): Promise<SignatureVerificationResult> {
  const timestamp = new Date();

  try {
    console.log('[WO-135] Verifying oracle signature');

    // Validate inputs
    if (!signature || signature.length < 64) {
      return {
        isValid: false,
        error: 'Invalid signature format: signature too short',
        timestamp,
      };
    }

    if (!publicKey) {
      return {
        isValid: false,
        error: 'Public key is required',
        timestamp,
      };
    }

    // Validate Solana public key format
    let pubKey: PublicKey;
    try {
      pubKey = new PublicKey(publicKey);
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid public key format',
        timestamp,
      };
    }

    // Convert message to Uint8Array
    const messageBytes = typeof message === 'string'
      ? Buffer.from(message, 'utf-8')
      : message;

    // Decode signature from base64 or hex
    let signatureBytes: Uint8Array;
    try {
      // Try base64 first
      signatureBytes = Buffer.from(signature, 'base64');
      
      // If too short, try hex
      if (signatureBytes.length < 64) {
        signatureBytes = Buffer.from(signature, 'hex');
      }
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid signature encoding: must be base64 or hex',
        timestamp,
      };
    }

    // Verify signature using Ed25519
    const publicKeyBytes = pubKey.toBytes();
    const isValid = nacl.sign.detached.verify(
      new Uint8Array(messageBytes),
      signatureBytes,
      publicKeyBytes
    );

    console.log('[WO-135] Signature verification result:', isValid);

    return {
      isValid,
      publicKey,
      error: isValid ? undefined : 'Signature verification failed',
      timestamp,
    };

  } catch (error) {
    console.error('[WO-135] Signature verification error:', error);

    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown verification error',
      timestamp,
    };
  }
}

/**
 * WO-135: Verify multiple signatures from different oracle nodes
 * 
 * @param signatures - Array of signatures with their public keys
 * @param message - The message that was signed
 * @param requiredConsensus - Minimum number of valid signatures (default: majority)
 * @returns Verification result with consensus information
 */
export async function verifyMultipleSignatures(
  signatures: Array<{ signature: string; publicKey: string }>,
  message: string | Buffer,
  requiredConsensus?: number
): Promise<{
  isValid: boolean;
  validCount: number;
  totalCount: number;
  consensusReached: boolean;
  results: SignatureVerificationResult[];
}> {
  console.log('[WO-135] Verifying multiple signatures:', signatures.length);

  const results = await Promise.all(
    signatures.map(({ signature, publicKey }) =>
      verifyOracleSignature(signature, message, publicKey)
    )
  );

  const validCount = results.filter(r => r.isValid).length;
  const totalCount = results.length;
  
  // Default to majority consensus
  const required = requiredConsensus ?? Math.ceil(totalCount / 2);
  const consensusReached = validCount >= required;

  console.log('[WO-135] Multi-signature verification:', {
    validCount,
    totalCount,
    required,
    consensusReached,
  });

  return {
    isValid: consensusReached,
    validCount,
    totalCount,
    consensusReached,
    results,
  };
}

/**
 * WO-135: Validate signature format without full verification
 * 
 * Quick format check before expensive cryptographic operations
 */
export function validateSignatureFormat(signature: string): {
  isValid: boolean;
  error?: string;
} {
  if (!signature) {
    return { isValid: false, error: 'Signature is required' };
  }

  if (signature.length < 64) {
    return { isValid: false, error: 'Signature too short (minimum 64 characters)' };
  }

  if (signature.length > 256) {
    return { isValid: false, error: 'Signature too long (maximum 256 characters)' };
  }

  // Check if it's valid base64 or hex
  const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(signature);
  const isHex = /^[0-9a-fA-F]+$/.test(signature);

  if (!isBase64 && !isHex) {
    return { isValid: false, error: 'Signature must be base64 or hex encoded' };
  }

  return { isValid: true };
}



