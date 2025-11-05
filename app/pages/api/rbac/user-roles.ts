import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { prisma } from '../../../lib/prisma';

/**
 * GET /api/rbac/user-roles?userId={userId}
 * 
 * Retrieve all roles assigned to a specific user
 * 
 * Features:
 * - Returns user role and associated permissions
 * - Requires authentication
 * - Admin can view any user, users can view own roles
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    const requestingUserId = (req as any).userId;
    const requestingUserRole = (req as any).userRole;

    if (typeof userId !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'User ID is required',
      });
    }

    // Authorization check - admin can view any, users can view own
    if (userId !== requestingUserId && requestingUserRole !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own roles',
      });
    }

    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with ID: ${userId}`,
      });
    }

    // Get permissions for this role
    const permissions = getRolePermissions(user.role);

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions,
      },
    });
  } catch (error) {
    console.error('Get user roles error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve user roles',
    });
  }
}

/**
 * Get permissions for a role
 */
function getRolePermissions(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    ADMIN: [
      'user_management',
      'project_management',
      'system_settings',
      'security_monitoring',
      'create_project',
      'manage_own_projects',
      'view_analytics',
      'view_projects',
      'fund_projects',
      'view_portfolio',
    ],
    CREATOR: [
      'create_project',
      'manage_own_projects',
      'view_analytics',
      'view_projects',
      'fund_projects',
      'view_portfolio',
    ],
    FUNDER: [
      'view_projects',
      'fund_projects',
      'view_portfolio',
    ],
    GUEST: [
      'view_projects',
    ],
  };

  return rolePermissions[role] || [];
}

export default withAuth(handler);






