/**
 * usePermissions Hook
 * 
 * Provides permission checking functionality for role-based access control
 */

import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

// Permission definitions by role
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

export function usePermissions() {
  const { user } = useAuth();

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.role) return false;

    const roleKey = user.role.toUpperCase();
    const rolePermissions = ROLE_PERMISSIONS[roleKey] || [];
    return rolePermissions.includes(permission);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  /**
   * Get all permissions for current user's role
   */
  const getUserPermissions = (): string[] => {
    if (!user || !user.role) return [];
    const roleKey = user.role.toUpperCase();
    return ROLE_PERMISSIONS[roleKey] || [];
  };

  /**
   * Check if user is admin
   */
  const isAdmin = (): boolean => {
    return user?.role === UserRole.ADMIN;
  };

  /**
   * Check if user is creator
   */
  const isCreator = (): boolean => {
    return user?.role === UserRole.CREATOR || user?.role === UserRole.ADMIN;
  };

  /**
   * Check if user is funder
   */
  const isFunder = (): boolean => {
    return user?.role === UserRole.FUNDER || user?.role === UserRole.ADMIN;
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserPermissions,
    isAdmin,
    isCreator,
    isFunder,
  };
}
