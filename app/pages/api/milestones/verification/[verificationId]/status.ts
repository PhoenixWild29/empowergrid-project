/**
 * GET /api/milestones/verification/[verificationId]/status
 * 
 * WO-111: Query verification status by verification request ID
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../../lib/prisma';

async function verificationStatusHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { verificationId } = req.query;

    if (!verificationId || typeof verificationId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'verificationId parameter is required',
      });
    }

    // WO-111: Fetch verification record
    const verification = await (prisma as any).milestoneVerification.findUnique({
      where: { id: verificationId },
      include: {
        milestone: {
          select: {
            id: true,
            title: true,
            energyTarget: true,
            status: true,
          },
        },
      },
    });

    if (!verification) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Verification request not found',
      });
    }

    return res.status(200).json({
      success: true,
      verification: {
        id: verification.id,
        status: verification.status,
        verified: verification.verified,
        energyProduced: verification.energyProduced,
        oracleConfidence: verification.oracleConfidence,
        verificationResult: verification.verificationResult,
        rejectionReason: verification.rejectionReason,
        verificationTimestamp: verification.verificationTimestamp,
        verifiedAt: verification.verifiedAt,
        milestone: verification.milestone,
        metadata: verification.metadata,
      },
    });

  } catch (error) {
    console.error('[WO-111] Status query error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve verification status',
    });
  }
}

export default withAuth(verificationStatusHandler);



