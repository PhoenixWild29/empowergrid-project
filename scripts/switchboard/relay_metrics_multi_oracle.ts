import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import fetch from 'node-fetch';
import idl from '../../idl/empower_grid.json';

// Relay metrics from multi-oracle consensus to the EmpowerGrid program.
// This script fetches aggregated readings from multiple oracle sources
// and submits only high-confidence consensus data to the blockchain.

async function main() {
  const rpcUrl = process.env.RPC_URL || 'https://api.devnet.solana.com';
  const programId = new PublicKey(process.env.PROGRAM_ID || 'YourProgramIdHereReplaceThisWithActualID');
  const payer = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(process.env.RELAYER || '[0,0,0,0]')),
  );
  const projectPk = new PublicKey(process.env.PROJECT || '');
  const multiOracleUrl = process.env.MULTI_ORACLE_URL || 'http://localhost:3000/api/meter/multi-oracle';
  const minConfidence = parseFloat(process.env.MIN_CONFIDENCE || '0.8'); // Minimum confidence threshold
  const maxRetries = parseInt(process.env.MAX_RETRIES || '3'); // Maximum retry attempts

  const connection = new Connection(rpcUrl, 'confirmed');
  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const program = new anchor.Program(idl as any, programId, provider);

  if (!projectPk) {
    throw new Error('PROJECT env var required');
  }

  console.log('Starting multi-oracle metrics relay...');
  console.log(`Project: ${projectPk.toString()}`);
  console.log(`Multi-oracle endpoint: ${multiOracleUrl}`);
  console.log(`Minimum confidence: ${minConfidence}`);

  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // Fetch aggregated reading from multi-oracle system
      const response = await fetch(`${multiOracleUrl}?projectId=${projectPk.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Multi-oracle API error: ${response.status} - ${data.error}`);
      }

      // Validate consensus data
      if (!data.consensus) {
        console.warn('No consensus reached among oracles, skipping submission');
        console.log(`Sources: ${data.sources?.length || 0}, Outliers: ${data.outlierSources?.length || 0}`);
        retryCount++;
        continue;
      }

      if (data.confidence < minConfidence) {
        console.warn(`Confidence too low: ${data.confidence} < ${minConfidence}, skipping submission`);
        retryCount++;
        continue;
      }

      // Convert aggregated values to blockchain format
      const kwhDelta = Math.round(data.kwh * 1000); // Convert to Wh
      const co2Delta = Math.round(data.co2 * 1000); // Convert to gCO2

      console.log('Submitting multi-oracle consensus metrics...');
      console.log(`kWh delta: ${data.kwh} (${kwhDelta} Wh)`);
      console.log(`CO2 delta: ${data.co2} (${co2Delta} gCO2)`);
      console.log(`Confidence: ${(data.confidence * 100).toFixed(1)}%`);
      console.log(`Sources used: ${data.sources?.length || 0}`);
      console.log(`Outliers detected: ${data.outlierSources?.length || 0}`);

      // Submit to blockchain with oracle metadata
      await program.methods
        .submitMetrics(
          new anchor.BN(kwhDelta),
          new anchor.BN(co2Delta),
          {
            confidence: Math.round(data.confidence * 100), // Store as percentage
            sourceCount: data.sources?.length || 0,
            outlierCount: data.outlierSources?.length || 0,
            timestamp: new anchor.BN(data.timestamp),
          }
        )
        .accounts({
          project: projectPk,
          oracleAuthority: wallet.publicKey
        })
        .signers([payer])
        .rpc();

      console.log('✅ Successfully submitted multi-oracle metrics to blockchain');
      console.log(`Transaction confirmed for project ${projectPk.toString()}`);

      // Reset retry count on success
      retryCount = 0;

      // Wait before next submission (configurable interval)
      const intervalSeconds = parseInt(process.env.SUBMISSION_INTERVAL || '300'); // Default 5 minutes
      console.log(`Waiting ${intervalSeconds} seconds before next submission...`);
      await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));

    } catch (error) {
      console.error(`Error during metrics relay (attempt ${retryCount + 1}/${maxRetries}):`, error);

      retryCount++;

      if (retryCount < maxRetries) {
        const retryDelay = parseInt(process.env.RETRY_DELAY || '30'); // Default 30 seconds
        console.log(`Retrying in ${retryDelay} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * 1000));
      } else {
        console.error('Max retries exceeded, exiting...');
        process.exit(1);
      }
    }
  }
}

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

main().catch((err) => {
  console.error('Fatal error in multi-oracle relay:', err);
  process.exit(1);
});