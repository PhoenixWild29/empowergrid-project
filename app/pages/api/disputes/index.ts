/**
 * POST /api/disputes
 * GET /api/disputes
 * 
 * WO-116: Dispute creation and retrieval
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { createDispute } from '../../../lib/services/disputeService';
import { z } from 'zod';

const CreateDisputeSchema = z.object({
  contractId: z.string(),
  milestoneId: z.string().optional(),
  disputeType: z.enum(['MILESTONE_VERIFICATION', 'FUND_ALLOCATION', 'ORACLE_DATA', 'CONTRACT_BREACH', 'OTHER']),
  title: z.string().min(10).max(200),
  description: z.string().min(20),
  respondent: z.string(),
});

async function disputeHandler(req: NextApiRequest, res: NextApiResponse) {
  const userId = (req as any).userId;

  if (req.method === 'POST') {
    // Create dispute
    try {
      const validatedData = CreateDisputeSchema.parse(req.body);

      const dispute = await createDispute({
        ...validatedData,
        initiatedBy: userId,
      });

      return res.status(201).json({
        success: true,
        message: 'Dispute created successfully',
        dispute,
      });
    } catch (error) {
      console.error('[WO-116] Create dispute error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create dispute',
      });
    }
  } else if (req.method === 'GET') {
    // Get disputes for user
    try {
      const disputes = await (prisma as any).dispute.findMany({
        where: {
          OR: [
            { initiatedBy: userId },
            { respondent: userId },
            { arbitratorId: userId },
          ],
        },
        include: {
          evidence: {
            select: { id: true, fileName: true, createdAt: true },
          },
          communications: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        disputes,
      });
    } catch (error) {
      console.error('[WO-116] Get disputes error:', error);
      
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve disputes',
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Need to import prisma for GET method
import { prisma } from '../../../lib/prisma';

export default withAuth(disputeHandler);



