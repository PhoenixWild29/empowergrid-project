/**
 * POST /api/disputes/[disputeId]/resolve
 * 
 * WO-116: Dispute resolution with enforcement
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';
import { resolveDispute } from '../../../../lib/services/disputeService';
import { z } from 'zod';

const ResolveDisputeSchema = z.object({
  resolution: z.string().min(20),
  resolutionType: z.enum(['FUND_RELEASE', 'CONTRACT_MODIFICATION', 'CONTRACT_TERMINATION', 'NO_ACTION']),
  fundReleaseTo: z.string().optional(),
  fundReleaseAmount: z.number().positive().optional(),
});

async function resolveDisputeHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { disputeId } = req.query;
  const userId = (req as any).userId;

  if (!disputeId || typeof disputeId !== 'string') {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'disputeId parameter is required',
    });
  }

  try {
    console.log('[WO-116] Resolving dispute:', disputeId);

    // Validate request
    const validatedData = ResolveDisputeSchema.parse(req.body);

    // Check if fund release type requires fund details
    if (validatedData.resolutionType === 'FUND_RELEASE') {
      if (!validatedData.fundReleaseTo || !validatedData.fundReleaseAmount) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Fund release requires fundReleaseTo and fundReleaseAmount',
        });
      }
    }

    // Resolve dispute
    const dispute = await resolveDispute({
      disputeId,
      arbitratorId: userId,
      ...validatedData,
    });

    return res.status(200).json({
      success: true,
      message: 'Dispute resolved successfully',
      dispute,
    });

  } catch (error) {
    console.error('[WO-116] Resolve dispute error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to resolve dispute',
    });
  }
}

export default withAuth(resolveDisputeHandler);



