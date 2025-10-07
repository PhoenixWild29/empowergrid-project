// Utility functions for interacting with the EmpowerGRID program

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import {
  EmpowerGridProgram,
  findProjectPDA,
  findVaultPDA,
  findMilestonePDA,
} from '../types';

// Program configuration
const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
    'YourProgramIdHereReplaceThisWithActualID'
);
const CLUSTER = process.env.NEXT_PUBLIC_CLUSTER || 'devnet';

/**
 * Get program connection
 */
export const getConnection = (): Connection => {
  const rpcUrl =
    process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl(CLUSTER as any);
  return new Connection(rpcUrl, 'confirmed');
};

/**
 * Get Anchor provider
 */
export const getProvider = (wallet?: any): anchor.AnchorProvider => {
  const connection = getConnection();
  return new anchor.AnchorProvider(connection, wallet || {}, {});
};

/**
 * Get program instance
 */
export const getProgram = (wallet?: any): anchor.Program => {
  const provider = getProvider(wallet);
  // Note: IDL will be imported when available
  const idl = {} as any; // Placeholder - will be replaced with actual IDL
  return new anchor.Program(idl, PROGRAM_ID, provider);
};

/**
 * Fetch all projects (simplified - in reality you'd need an indexer)
 */
export const fetchProjects = async (): Promise<any[]> => {
  // This is a placeholder implementation
  // In a real app, you'd need to:
  // 1. Use an indexer like Helius or build your own
  // 2. Query for all project accounts
  // 3. Or maintain an off-chain registry

  console.log('Fetching projects... (placeholder implementation)');
  return [];
};

/**
 * Fetch project by ID
 */
export const fetchProject = async (
  projectId: number,
  creator: PublicKey
): Promise<any | null> => {
  try {
    const program = getProgram();
    const [projectPDA] = findProjectPDA(
      new PublicKey(''),
      creator,
      projectId,
      PROGRAM_ID
    ); // Need state PDA
    return await program.account.project.fetch(projectPDA);
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
};

/**
 * Fetch project milestones
 */
export const fetchProjectMilestones = async (
  projectPDA: PublicKey
): Promise<any[]> => {
  try {
    const program = getProgram();
    const milestones = [];

    // Fetch up to a reasonable number of milestones
    for (let i = 0; i < 10; i++) {
      try {
        const [milestonePDA] = findMilestonePDA(projectPDA, i, PROGRAM_ID);
        const milestone = await program.account.milestone.fetch(milestonePDA);
        milestones.push(milestone);
      } catch {
        // Milestone doesn't exist, stop looking
        break;
      }
    }

    return milestones;
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return [];
  }
};

/**
 * Create a new project (placeholder - needs wallet integration)
 */
export const createProject = async (
  name: string,
  description: string,
  governanceAuthority: PublicKey,
  oracleAuthority: PublicKey,
  milestones: any[]
): Promise<string> => {
  // Placeholder implementation
  // In a real app, this would:
  // 1. Connect wallet
  // 2. Build transaction
  // 3. Submit to blockchain

  console.log('Creating project:', {
    name,
    description,
    governanceAuthority,
    oracleAuthority,
    milestones,
  });
  throw new Error('Wallet integration required');
};

/**
 * Fund a project via Solana Actions
 */
export const fundProject = async (
  projectPDA: string,
  amount: number
): Promise<{ transaction: string; message: string }> => {
  const response = await fetch(
    `/api/actions/fund/${projectPDA}?amount=${amount}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: 'placeholder-wallet-address', // Would come from wallet
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to create funding transaction');
  }

  return response.json();
};

/**
 * Get meter reading from API
 */
export const getMeterReading = async (): Promise<any> => {
  const response = await fetch('/api/meter/latest');
  if (!response.ok) {
    throw new Error('Failed to fetch meter reading');
  }
  return response.json();
};

/**
 * Generate Blink QR code
 */
export const generateBlinkQR = async (projectPDA: string): Promise<string> => {
  // This would call the QR generation script
  console.log('Generating QR for project:', projectPDA);
  return `https://your.site/?action=solana-action:http://localhost:3000/api/actions/fund/${projectPDA}`;
};
