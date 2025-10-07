import type { NextApiRequest, NextApiResponse } from 'next';
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

// Use environment variables for the RPC endpoint and program ID.  If not set,
// defaults fall back to Solana devnet.  In production, override these with
// your cluster and deployed program.
const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || 'YourProgramIdHereReplaceThisWithActualID'
);

/**
 * Simplified fund project API endpoint
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { project } = req.query;

  if (typeof project !== 'string' || !project.trim()) {
    return res.status(400).json({ message: 'Bad project' });
  }

  try {
    if (req.method === 'OPTIONS') {
      // Handle CORS preflight
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(200).end();
    }

    if (req.method === 'GET') {
      // Return action metadata
      const response = {
        type: 'action',
        icon: 'https://uploads-ssl.webflow.com/64d58c3e305bd643dc4f9ecb/64d5a945d7dcf901f512bf4f_energy.png',
        title: 'Fund an EmpowerGRID Project',
        description: `Send SOL to project ${project.slice(0, 4)}…${project.slice(-4)} (escrowed until milestones).`,
        label: 'Fund with SOL',
        links: {
          actions: [
            {
              label: 'Fund 0.1 SOL',
              href: `/api/actions/fund/${project}?amount=0.1`,
            },
            {
              label: 'Fund 1 SOL',
              href: `/api/actions/fund/${project}?amount=1`,
            },
            {
              label: 'Custom',
              href: `/api/actions/fund/${project}?amount={amount}`,
            },
          ],
        },
      };
      return res.status(200).json(response);
    }

    if (req.method === 'POST') {
      // Validate amount
      const amountStr = req.query.amount as string;
      const amount = amountStr ? parseFloat(amountStr) : 0.1;

      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }

      // Validate account
      const { account } = req.body;
      if (!account) {
        return res.status(400).json({ message: 'Missing account' });
      }

      // Create a simple transaction for funding
      const connection = new Connection(RPC_URL);
      const projectPubkey = new PublicKey(project);

      // For now, return a simple success response with transaction
      // In production, this would create and return a proper transaction
      const response = {
        transaction: 'mock-serialized-tx',
        message: `Funding project with ${amount} SOL`,
      };

      return res.status(200).json(response);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
