import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * PermissionGuard Component
 * 
 * Conditionally renders children based on user permissions
 * 
 * Usage:
 * ```tsx
 * <PermissionGuard permission="user_management">
 *   <AdminPanel />
 * </PermissionGuard>
 * 
 * <PermissionGuard permissions={['create_project', 'view_analytics']} requireAll={false}>
 *   <ProjectTools />
 * </PermissionGuard>
 * ```
 */
export default function PermissionGuard({
  permission,
  permissions = [],
  requireAll = true,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // Single permission check
  if (permission) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // Multiple permissions check
  if (permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // No permission specified - render children
  return <>{children}</>;
}




