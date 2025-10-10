/**
 * GET /api/milestones/[milestoneId]/verifications
 * 
 * WO-111: Query all verification attempts for a specific milestone
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../lib/prisma';

async function milestoneVerificationsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { milestoneId } = req.query;

    if (!milestoneId || typeof milestoneId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'milestoneId parameter is required',
      });
    }

    // WO-111: Fetch all verification attempts for milestone
    const verifications = await (prisma as any).milestoneVerification.findMany({
      where: { milestoneId },
      orderBy: { verificationTimestamp: 'desc' },
      include: {
        milestone: {
          select: {
            id: true,
            title: true,
            energyTarget: true,
          },
        },
      },
    });

    // Calculate statistics
    const stats = {
      total: verifications.length,
      verified: verifications.filter((v: any) => v.verified).length,
      failed: verifications.filter((v: any) => v.status === 'FAILED').length,
      pending: verifications.filter((v: any) => v.status === 'PENDING' || v.status === 'IN_PROGRESS').length,
    };

    return res.status(200).json({
      success: true,
      verifications,
      stats,
      milestoneId,
    });

  } catch (error) {
    console.error('[WO-111] Verifications query error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve verification history',
    });
  }
}

export default withAuth(milestoneVerificationsHandler);



