/**
 * POST /api/escrow/create
 * 
 * WO-78: Create and deploy escrow contract
 * 
 * Features:
 * - Project specification validation
 * - Anchor program deployment
 * - Escrow account initialization
 * - Multi-signature setup
 * - Oracle configuration
 * - Emergency recovery mechanisms
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { getAnchorClient } from '../../../lib/blockchain/anchorClient';
import { z } from 'zod';

// WO-78: Validation schema for escrow contract creation
const CreateEscrowSchema = z.object({
  projectId: z.string().cuid(),
  fundingTarget: z.number().positive().min(100).max(10000000),
  milestones: z.array(z.object({
    id: z.string(),
    title: z.string().min(3).max(100),
    fundingAmount: z.number().positive(),
    order: z.number().int().min(0),
  })).min(1).max(20),
  signers: z.array(z.string()).min(1).max(10), // Wallet addresses
  requiredSignatures: z.number().int().min(1),
  oracleAuthority: z.string().optional(),
  emergencyContact: z.string().optional(),
}).refine((data) => {
  // Validate required signatures <= total signers
  return data.requiredSignatures <= data.signers.length;
}, {
  message: 'requiredSignatures cannot exceed number of signers',
  path: ['requiredSignatures'],
}).refine((data) => {
  // Validate milestones sum to funding target
  const totalMilestoneFunding = data.milestones.reduce((sum, m) => sum + m.fundingAmount, 0);
  const difference = Math.abs(totalMilestoneFunding - data.fundingTarget);
  return difference < 0.01; // Allow for floating point precision
}, {
  message: 'Sum of milestone funding amounts must equal funding target',
  path: ['milestones'],
});

async function createEscrowContract(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const userId = (req as any).userId;
    const userWallet = (req as any).userWallet;

    // WO-78: Validate request parameters
    const validatedData = CreateEscrowSchema.parse(req.body);

    console.log('[WO-78] Creating escrow contract for project:', validatedData.projectId);

    // Verify project exists and user is the creator
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      include: {
        creator: {
          select: { id: true, walletAddress: true, username: true },
        },
        milestones: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        message: 'The specified project does not exist',
      });
    }

    if (project.creatorId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the project creator can create an escrow contract',
      });
    }

    // Check if escrow contract already exists
    const existingContract = await prisma.escrowContract.findUnique({
      where: { projectId: validatedData.projectId },
    });

    if (existingContract) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Escrow contract already exists for this project',
        contractId: existingContract.contractId,
      });
    }

    // WO-78: Deploy Anchor program and initialize escrow accounts
    const anchorClient = getAnchorClient();
    
    const deployedContract = await anchorClient.deployEscrowContract({
      projectId: validatedData.projectId,
      fundingTarget: validatedData.fundingTarget,
      milestones: validatedData.milestones,
      signers: validatedData.signers,
      requiredSignatures: validatedData.requiredSignatures,
      oracleAuthority: validatedData.oracleAuthority,
      emergencyContact: validatedData.emergencyContact,
    }, userWallet);

    // WO-78: Store contract metadata in database
    const escrowContract = await prisma.escrowContract.create({
      data: {
        contractId: deployedContract.contractId,
        projectId: validatedData.projectId,
        programId: deployedContract.programId,
        escrowAccount: deployedContract.escrowAccount,
        authorityAccount: deployedContract.authorityAccount,
        deploymentTxHash: deployedContract.deploymentTxHash,
        fundingTarget: validatedData.fundingTarget,
        currentBalance: 0,
        signers: validatedData.signers,
        requiredSignatures: validatedData.requiredSignatures,
        oracleAuthority: validatedData.oracleAuthority || null,
        oracleData: validatedData.oracleAuthority ? {
          authority: validatedData.oracleAuthority,
          configuredAt: new Date().toISOString(),
        } : undefined,
        emergencyContact: validatedData.emergencyContact || null,
        recoveryEnabled: true,
        status: 'INITIALIZED',
        createdBy: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            targetAmount: true,
            currentAmount: true,
            status: true,
          },
        },
      },
    });

    const responseTime = Date.now() - startTime;
    console.log(`[WO-78] Escrow contract created in ${responseTime}ms:`, escrowContract.contractId);

    // WO-78: Return contract details with proper HTTP status
    return res.status(201).json({
      success: true,
      message: 'Escrow contract created successfully',
      contract: {
        id: escrowContract.id,
        contractId: escrowContract.contractId,
        projectId: escrowContract.projectId,
        programId: escrowContract.programId,
        escrowAccount: escrowContract.escrowAccount,
        authorityAccount: escrowContract.authorityAccount,
        deploymentTxHash: escrowContract.deploymentTxHash,
        fundingTarget: escrowContract.fundingTarget,
        currentBalance: escrowContract.currentBalance,
        status: escrowContract.status,
        signers: escrowContract.signers,
        requiredSignatures: escrowContract.requiredSignatures,
        oracleAuthority: escrowContract.oracleAuthority,
        emergencyContact: escrowContract.emergencyContact,
        recoveryEnabled: escrowContract.recoveryEnabled,
        createdAt: escrowContract.createdAt,
      },
      performance: {
        responseTime,
        blockchainInteraction: true,
      },
    });

  } catch (error) {
    console.error('[WO-78] Escrow contract creation failed:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid contract parameters',
        details: error.errors,
      });
    }

    // Handle blockchain errors
    if (error instanceof Error && error.message.includes('Failed to deploy')) {
      return res.status(503).json({
        error: 'Blockchain error',
        message: 'Failed to deploy contract to blockchain',
        details: error.message,
      });
    }

    // Generic error
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create escrow contract',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(createEscrowContract);

