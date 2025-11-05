/**
 * File Upload API Endpoint - Individual File Operations
 * 
 * DELETE /api/upload/[id] - Delete specific file
 */

import { NextApiRequest, NextApiResponse} from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';

/**
 * DELETE /api/upload/[id]
 * 
 * Delete uploaded file
 */
async function handleFileOperation(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      const userId = (req as any).userId;

      if (typeof id !== 'string') {
        return res.status(400).json({
          error: 'Invalid file ID',
        });
      }

      // In production, delete file from storage and database
      // For now, return success

      return res.status(200).json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      console.error('Delete file error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete file',
      });
    }
  } else {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }
}

export default withAuth(handleFileOperation);






