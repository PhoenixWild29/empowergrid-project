/**
 * RBAC Repository
 * 
 * Data access layer for Role-Based Access Control
 */

import { prisma } from '../prisma';

/**
 * Role Repository Functions
 */

export async function findRoleById(roleId: string) {
  // In production with RBAC tables, use:
  // return prisma.role.findUnique({ where: { id: roleId } });
  
  // Current implementation with enum
  return { id: roleId, name: roleId };
}

export async function findRoleByName(roleName: string) {
  // In production with RBAC tables, use:
  // return prisma.role.findUnique({ where: { name: roleName } });
  
  return { id: roleName, name: roleName };
}

export async function getAllRoles() {
  // In production with RBAC tables, use:
  // return prisma.role.findMany();
  
  return [
    { id: 'ADMIN', name: 'ADMIN', description: 'Administrator' },
    { id: 'CREATOR', name: 'CREATOR', description: 'Project Creator' },
    { id: 'FUNDER', name: 'FUNDER', description: 'Project Funder' },
    { id: 'GUEST', name: 'GUEST', description: 'Guest User' },
  ];
}

/**
 * Permission Repository Functions
 */

export async function findPermissionById(permissionId: string) {
  // In production with RBAC tables
  return { id: permissionId, name: permissionId };
}

export async function findPermissionByName(permissionName: string) {
  return { id: permissionName, name: permissionName };
}

export async function getAllPermissions() {
  return [
    { id: 'user_management', name: 'user_management', category: 'admin' },
    { id: 'project_management', name: 'project_management', category: 'admin' },
    { id: 'system_settings', name: 'system_settings', category: 'admin' },
    { id: 'security_monitoring', name: 'security_monitoring', category: 'admin' },
    { id: 'create_project', name: 'create_project', category: 'project' },
    { id: 'manage_own_projects', name: 'manage_own_projects', category: 'project' },
    { id: 'view_analytics', name: 'view_analytics', category: 'project' },
    { id: 'view_projects', name: 'view_projects', category: 'project' },
    { id: 'fund_projects', name: 'fund_projects', category: 'funding' },
    { id: 'view_portfolio', name: 'view_portfolio', category: 'funding' },
  ];
}

/**
 * RolePermission Repository Functions
 */

export async function getRolePermissions(roleId: string) {
  // In production with RBAC tables, use:
  // return prisma.rolePermission.findMany({
  //   where: { roleId },
  //   include: { permission: true },
  // });

  const rolePermissionsMap: Record<string, string[]> = {
    ADMIN: ['user_management', 'project_management', 'system_settings', 'security_monitoring', 
            'create_project', 'manage_own_projects', 'view_analytics', 'view_projects', 
            'fund_projects', 'view_portfolio'],
    CREATOR: ['create_project', 'manage_own_projects', 'view_analytics', 'view_projects', 
              'fund_projects', 'view_portfolio'],
    FUNDER: ['view_projects', 'fund_projects', 'view_portfolio'],
    GUEST: ['view_projects'],
  };

  const permissionNames = rolePermissionsMap[roleId] || [];
  return permissionNames.map(name => ({ id: name, name, roleId }));
}

export async function assignPermissionToRole(roleId: string, permissionId: string) {
  // In production with RBAC tables, use:
  // return prisma.rolePermission.create({
  //   data: { roleId, permissionId },
  // });
  
  return { roleId, permissionId, assignedAt: new Date() };
}

export async function removePermissionFromRole(roleId: string, permissionId: string) {
  // In production with RBAC tables, use:
  // return prisma.rolePermission.delete({
  //   where: {
  //     roleId_permissionId: { roleId, permissionId },
  //   },
  // });
  
  return true;
}

/**
 * UserRole Repository Functions
 */

export async function getUserRoles(userId: string) {
  // Current implementation uses single role from User table
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return [];

  return [{ id: user.role, name: user.role, userId }];
}

export async function assignRoleToUser(userId: string, roleId: string, assignedBy?: string) {
  // Current implementation updates User.role
  await prisma.user.update({
    where: { id: userId },
    data: { role: roleId as any },
  });

  return {
    userId,
    roleId,
    assignedAt: new Date(),
    assignedBy: assignedBy || null,
  };
}

export async function removeRoleFromUser(userId: string, roleId: string) {
  // In current implementation, reset to GUEST
  await prisma.user.update({
    where: { id: userId },
    data: { role: 'GUEST' },
  });

  return true;
}

export async function getUsersWithRole(roleId: string) {
  return prisma.user.findMany({
    where: { role: roleId as any },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
    },
  });
}

/**
 * Permission Checking Functions
 */

export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return [];

  // Get permissions for role
  const permissions = await getRolePermissions(user.role);
  return permissions.map(p => p.name);
}

export async function userHasPermission(userId: string, permissionName: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permissionName);
}




