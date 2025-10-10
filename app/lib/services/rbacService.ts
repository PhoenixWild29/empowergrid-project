/**
 * Role-Based Access Control Service
 * 
 * Business logic for RBAC operations
 */

import { prisma } from '../prisma';

/**
 * Role-Permission mappings
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
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
 * Assign role to user
 */
export async function assignRoleToUser(
  userId: string,
  role: 'GUEST' | 'FUNDER' | 'CREATOR' | 'ADMIN',
  assignedByUserId: string
): Promise<any> {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Update role
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  // Log the role assignment for audit
  console.log(`Role ${role} assigned to user ${userId} by ${assignedByUserId}`);

  return updatedUser;
}

/**
 * Get user roles and permissions
 */
export async function getUserRolesAndPermissions(userId: string): Promise<{
  role: string;
  permissions: string[];
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const permissions = ROLE_PERMISSIONS[user.role] || [];

  return {
    role: user.role,
    permissions,
  };
}

/**
 * Check if user has permission
 */
export async function checkUserPermission(
  userId: string,
  permission: string,
  resource?: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return false;
  }

  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  const hasPermission = rolePermissions.includes(permission);

  // In production, implement resource-level checks
  // For now, just check base permission
  return hasPermission;
}

/**
 * Remove role from user (reset to GUEST)
 */
export async function removeRoleFromUser(userId: string, removedByUserId: string): Promise<any> {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Reset to GUEST role
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: 'GUEST' },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  // Log the role removal for audit
  console.log(`Role removed from user ${userId} by ${removedByUserId}`);

  return updatedUser;
}

/**
 * List all available roles
 */
export function listAvailableRoles(): Array<{
  id: string;
  name: string;
  description: string;
  permissions: string[];
}> {
  return [
    {
      id: 'ADMIN',
      name: 'Administrator',
      description: 'Full system access with administrative privileges',
      permissions: ROLE_PERMISSIONS.ADMIN,
    },
    {
      id: 'CREATOR',
      name: 'Project Creator',
      description: 'Can create and manage renewable energy projects',
      permissions: ROLE_PERMISSIONS.CREATOR,
    },
    {
      id: 'FUNDER',
      name: 'Project Funder',
      description: 'Can fund projects and view portfolio',
      permissions: ROLE_PERMISSIONS.FUNDER,
    },
    {
      id: 'GUEST',
      name: 'Guest',
      description: 'Read-only access to browse projects',
      permissions: ROLE_PERMISSIONS.GUEST,
    },
  ];
}

/**
 * Get role details by ID
 */
export function getRoleById(roleId: string): {
  id: string;
  name: string;
  description: string;
  permissions: string[];
} | null {
  const roles = listAvailableRoles();
  return roles.find(r => r.id === roleId) || null;
}




