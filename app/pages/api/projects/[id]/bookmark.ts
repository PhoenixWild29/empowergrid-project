/**
 * Project Bookmark API
 * 
 * POST /api/projects/[id]/bookmark - Bookmark project
 * DELETE /api/projects/[id]/bookmark - Remove bookmark
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const userId = (req as any).userId;

  if (typeof id !== 'string') {
    return res.status(400).json({
      error: 'Invalid project ID',
    });
  }

  try {
    if (req.method === 'POST') {
      // Add bookmark
      // In production, store in database
      // For now, return success
      
      return res.status(200).json({
        success: true,
        message: 'Project bookmarked successfully',
        projectId: id,
        userId,
      });
    } else if (req.method === 'DELETE') {
      // Remove bookmark
      // In production, delete from database

      return res.status(200).json({
        success: true,
        message: 'Bookmark removed successfully',
        projectId: id,
        userId,
      });
    } else {
      return res.status(405).json({
        error: 'Method not allowed',
      });
    }
  } catch (error) {
    console.error('Bookmark error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update bookmark',
    });
  }
}

export default withAuth(handler);

