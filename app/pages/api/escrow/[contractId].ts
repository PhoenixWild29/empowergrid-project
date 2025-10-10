/**
 * GET /api/escrow/[contractId]
 * 
 * WO-78: Retrieve comprehensive escrow contract information
 * 
 * Features:
 * - Fund balances from blockchain
 * - Milestone status aggregation
 * - Transaction history
 * - Real-time blockchain state
 * - Access control based on user roles
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { withOptionalAuth } from '../../../lib/middleware/authMiddleware';
import { getAnchorClient } from '../../../lib/blockchain/anchorClient';

async function getEscrowContract(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { contractId } = req.query;
    const userId = (req as any).userId; // May be undefined for public access

    if (!contractId || typeof contractId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'contractId parameter is required',
      });
    }

    console.log('[WO-78] Fetching escrow contract:', contractId);

    // WO-78: Fetch contract from database with all relations
    const contract = await prisma.escrowContract.findUnique({
      where: { contractId },
      include: {
        project: {
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                walletAddress: true,
                reputation: true,
                verified: true,
              },
            },
            milestones: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                targetAmount: true,
                order: true,
                status: true,
                submittedAt: true,
                releasedAt: true,
              },
            },
          },
        },
        deposits: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Last 50 deposits
          select: {
            id: true,
            depositorWallet: true,
            amount: true,
            transactionHash: true,
            transactionStatus: true,
            confirmedAt: true,
            createdAt: true,
            networkFee: true,
            platformFee: true,
          },
        },
      },
    });

    if (!contract) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Escrow contract not found',
      });
    }

    // WO-78: Determine user access level
    const isCreator = userId === contract.project.creatorId;
    const isFunder = contract.deposits.some(d => d.depositorWallet === (req as any).userWallet);
    const hasAccess = !userId || isCreator || isFunder; // Public read access

    // WO-78: Get real-time blockchain state
    const anchorClient = getAnchorClient();
    
    let blockchainState = null;
    let blockchainBalance = contract.currentBalance;
    let transactionHistory: any[] = [];

    try {
      // Fetch real-time data from blockchain
      blockchainState = await anchorClient.getContractState(contractId, contract.escrowAccount);
      blockchainBalance = await anchorClient.getContractBalance(contract.escrowAccount);
      
      // Get transaction history only for authorized users
      if (isCreator || isFunder) {
        transactionHistory = await anchorClient.getTransactionHistory(contract.escrowAccount, 20);
      }
    } catch (blockchainError) {
      console.error('[WO-78] Blockchain data fetch failed:', blockchainError);
      // Continue with database data
    }

    // WO-78: Calculate milestone statistics
    const milestones = contract.project.milestones;
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.status === 'RELEASED').length;
    const pendingMilestones = milestones.filter(m => m.status === 'PENDING' || m.status === 'SUBMITTED').length;
    const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

    // WO-78: Calculate funding statistics
    const deposits = contract.deposits;
    const totalDeposits = deposits.length;
    const confirmedDeposits = deposits.filter(d => d.transactionStatus === 'CONFIRMED');
    const totalFunded = confirmedDeposits.reduce((sum, d) => sum + d.amount, 0);
    const fundingProgress = (totalFunded / contract.fundingTarget) * 100;
    const averageDepositAmount = totalDeposits > 0 ? totalFunded / totalDeposits : 0;

    // Calculate unique depositors
    const uniqueDepositors = new Set(deposits.map(d => d.depositorWallet)).size;

    const responseTime = Date.now() - startTime;
    console.log(`[WO-78] Contract fetched in ${responseTime}ms:`, contractId);

    // WO-78: Return comprehensive contract information with structured JSON
    return res.status(200).json({
      success: true,
      contract: {
        // Basic info
        id: contract.id,
        contractId: contract.contractId,
        projectId: contract.projectId,
        
        // Blockchain details
        programId: contract.programId,
        escrowAccount: contract.escrowAccount,
        authorityAccount: contract.authorityAccount,
        deploymentTxHash: contract.deploymentTxHash,
        
        // Funding info
        fundingTarget: contract.fundingTarget,
        currentBalance: contract.currentBalance,
        blockchainBalance, // Real-time from blockchain
        fundingProgress: fundingProgress.toFixed(2) + '%',
        
        // Status
        status: contract.status,
        activatedAt: contract.activatedAt,
        completedAt: contract.completedAt,
        
        // Configuration
        signers: contract.signers,
        requiredSignatures: contract.requiredSignatures,
        oracleAuthority: contract.oracleAuthority,
        oracleData: contract.oracleData,
        emergencyContact: contract.emergencyContact,
        recoveryEnabled: contract.recoveryEnabled,
        
        // Timestamps
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
        
        // Project info
        project: {
          id: contract.project.id,
          title: contract.project.title,
          status: contract.project.status,
          creator: contract.project.creator,
        },
        
        // Milestone statistics
        milestones: {
          total: totalMilestones,
          completed: completedMilestones,
          pending: pendingMilestones,
          progress: milestoneProgress.toFixed(2) + '%',
          details: milestones,
        },
        
        // Deposit statistics
        deposits: {
          total: totalDeposits,
          confirmed: confirmedDeposits.length,
          totalFunded,
          uniqueDepositors,
          averageAmount: averageDepositAmount,
          recentDeposits: deposits.slice(0, 10), // Last 10 deposits
        },
      },
      
      // WO-78: Real-time blockchain state (for authorized users)
      blockchainState: (isCreator || isFunder) ? blockchainState : null,
      transactionHistory: (isCreator || isFunder) ? transactionHistory : [],
      
      // Access info
      access: {
        isCreator,
        isFunder,
        hasFullAccess: isCreator,
      },
      
      // Performance metrics
      performance: {
        responseTime,
        dataSource: {
          database: true,
          blockchain: blockchainState !== null,
        },
      },
    });

  } catch (error) {
    console.error('[WO-78] Failed to fetch escrow contract:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve escrow contract',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withOptionalAuth(getEscrowContract);


