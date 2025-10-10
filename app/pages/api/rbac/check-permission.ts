import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { z } from 'zod';

/**
 * Check Permission Schema
 */
const CheckPermissionSchema = z.object({
  userId: z.string(),
  permission: z.string(),
  resource: z.string().optional(),
});

/**
 * Role-Permission mappings
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
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

/**
 * POST /api/rbac/check-permission
 * 
 * Check if user has permission for specific action
 * 
 * Features:
 * - Returns boolean authorization result
 * - Queries user-role-permission relationships
 * - Requires authentication
 * - Resource-based permission checking
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const requestingUserId = (req as any).userId;
    const requestingUserRole = (req as any).userRole;

    // Validate request
    const validationResult = CheckPermissionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { userId, permission, resource } = validationResult.data;

    // Get user role (in production, fetch from database)
    // For now, use the requesting user's role if checking own permissions
    let userRole = requestingUserRole;
    
    if (userId !== requestingUserId) {
      // If checking another user, must be admin
      if (requestingUserRole !== 'ADMIN') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only check your own permissions',
        });
      }

      // Fetch target user's role
      const { prisma } = require('../../../lib/prisma');
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      userRole = user.role;
    }

    // Check if user has permission
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    const hasPermission = rolePermissions.includes(permission);

    // Resource-based checking (if resource provided)
    let resourceAuthorized = true;
    if (resource) {
      // In production, implement resource-level authorization
      // For now, just check if user has the permission
      resourceAuthorized = hasPermission;
    }

    const authorized = hasPermission && resourceAuthorized;

    return res.status(200).json({
      success: true,
      authorized,
      details: {
        userId,
        permission,
        resource,
        userRole,
        hasPermission,
      },
    });
  } catch (error) {
    console.error('Check permission error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to check permission',
    });
  }
}

export default withAuth(handler);




