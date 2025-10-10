/**
 * POST /api/disputes/[disputeId]/evidence
 * GET /api/disputes/[disputeId]/evidence
 * 
 * WO-116: Evidence submission and retrieval
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';
import { submitEvidence } from '../../../../lib/services/disputeService';
import { z } from 'zod';
import { prisma } from '../../../../lib/prisma';

const SubmitEvidenceSchema = z.object({
  fileName: z.string(),
  fileUrl: z.string().url(),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024),
  fileType: z.string(),
  description: z.string().min(10),
});

async function evidenceHandler(req: NextApiRequest, res: NextApiResponse) {
  const { disputeId } = req.query;
  const userId = (req as any).userId;

  if (!disputeId || typeof disputeId !== 'string') {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'disputeId parameter is required',
    });
  }

  if (req.method === 'POST') {
    // Submit evidence
    try {
      const validatedData = SubmitEvidenceSchema.parse(req.body);

      const evidence = await submitEvidence({
        disputeId,
        submittedBy: userId,
        ...validatedData,
      });

      return res.status(201).json({
        success: true,
        message: 'Evidence submitted successfully',
        evidence,
      });
    } catch (error) {
      console.error('[WO-116] Submit evidence error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to submit evidence',
      });
    }
  } else if (req.method === 'GET') {
    // Get evidence for dispute
    try {
      const evidence = await (prisma as any).disputeEvidence.findMany({
        where: { disputeId },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        evidence,
      });
    } catch (error) {
      console.error('[WO-116] Get evidence error:', error);
      
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve evidence',
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(evidenceHandler);



