import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';

/**
 * Role definitions with permissions
 */
const SYSTEM_ROLES = [
  {
    id: 'ADMIN',
    name: 'ADMIN',
    description: 'Full system access with administrative privileges',
    permissions: [
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
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'CREATOR',
    name: 'CREATOR',
    description: 'Can create and manage renewable energy projects',
    permissions: [
      'create_project',
      'manage_own_projects',
      'view_analytics',
      'view_projects',
      'fund_projects',
      'view_portfolio',
    ],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FUNDER',
    name: 'FUNDER',
    description: 'Can fund projects and view portfolio',
    permissions: [
      'view_projects',
      'fund_projects',
      'view_portfolio',
    ],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'GUEST',
    name: 'GUEST',
    description: 'Read-only access to browse projects',
    permissions: [
      'view_projects',
    ],
    createdAt: '2025-01-01T00:00:00Z',
  },
];

/**
 * GET /api/rbac/roles
 * 
 * List all available roles in the system
 * 
 * Features:
 * - Returns all roles with descriptions
 * - Includes associated permissions
 * - Requires authentication
 */
async function getRoles(req: NextApiRequest, res: NextApiResponse) {
  try {
    return res.status(200).json({
      success: true,
      roles: SYSTEM_ROLES,
    });
  } catch (error) {
    console.error('Get roles error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve roles',
    });
  }
}

/**
 * Main handler
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getRoles(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(handler);






