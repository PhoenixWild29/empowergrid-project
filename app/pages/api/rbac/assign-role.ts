import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';

/**
 * Assign Role Schema
 */
const AssignRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['GUEST', 'FUNDER', 'CREATOR', 'ADMIN']),
});

/**
 * POST /api/rbac/assign-role
 * 
 * Assign a role to a user
 * 
 * Features:
 * - Requires admin authentication
 * - Validates user exists
 * - Updates user role
 * - Returns success/failure status
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const requestingUserRole = (req as any).userRole;

    // Only admins can assign roles
    if (requestingUserRole !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only administrators can assign roles',
      });
    }

    // Validate request
    const validationResult = AssignRoleSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { userId, role } = validationResult.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with ID: ${userId}`,
      });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Role assigned successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Assign role error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to assign role',
    });
  }
}

export default withAuth(handler);






