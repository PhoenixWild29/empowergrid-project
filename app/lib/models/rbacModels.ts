/**
 * RBAC Data Models
 * 
 * TypeScript interfaces for Role-Based Access Control
 */

/**
 * Role Model
 */
export interface Role {
  id: string;
  name: string; // Unique, max 255 characters
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Permission Model
 */
export interface Permission {
  id: string;
  name: string; // Unique, max 255 characters
  description: string | null;
  category: string; // Category for grouping (e.g., 'user', 'project', 'system')
  createdAt: Date;
  updatedAt: Date;
}

/**
 * RolePermission Junction Model
 * Many-to-many relationship between roles and permissions
 */
export interface RolePermission {
  roleId: string;
  permissionId: string;
  assignedAt: Date;
}

/**
 * UserRole Junction Model
 * Many-to-many relationship between users and roles
 */
export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy: string | null; // User ID who assigned this role
}

/**
 * Extended User with Roles
 */
export interface UserWithRoles {
  userId: string;
  username: string;
  roles: Role[];
  permissions: Permission[];
}

/**
 * Role with Permissions
 */
export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  permissions: Permission[];
  userCount: number;
}

/**
 * Permission Check Result
 */
export interface PermissionCheckResult {
  userId: string;
  permission: string;
  hasPermission: boolean;
  grantedThrough: string[]; // List of role names that grant this permission
}




