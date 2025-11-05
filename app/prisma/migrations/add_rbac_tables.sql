-- Migration: Add RBAC Tables for Enhanced Role-Based Access Control
-- This migration creates separate tables for Roles, Permissions, and their relationships
-- allowing for more flexible RBAC beyond the simple enum-based approach

-- Create Roles table
CREATE TABLE IF NOT EXISTS "roles" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "roles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "roles_name_unique" UNIQUE ("name")
);

-- Create Permissions table
CREATE TABLE IF NOT EXISTS "permissions" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "category" VARCHAR(100) NOT NULL DEFAULT 'general',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "permissions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "permissions_name_unique" UNIQUE ("name")
);

-- Create RolePermission junction table (many-to-many)
CREATE TABLE IF NOT EXISTS "role_permissions" (
  "role_id" TEXT NOT NULL,
  "permission_id" TEXT NOT NULL,
  "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id"),
  CONSTRAINT "role_permissions_role_fkey" FOREIGN KEY ("role_id") 
    REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "role_permissions_permission_fkey" FOREIGN KEY ("permission_id") 
    REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create UserRole junction table (many-to-many)
CREATE TABLE IF NOT EXISTS "user_roles" (
  "user_id" TEXT NOT NULL,
  "role_id" TEXT NOT NULL,
  "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "assigned_by" TEXT,
  
  CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id"),
  CONSTRAINT "user_roles_user_fkey" FOREIGN KEY ("user_id") 
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_roles_role_fkey" FOREIGN KEY ("role_id") 
    REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") 
    REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS "idx_roles_name" ON "roles"("name");
CREATE INDEX IF NOT EXISTS "idx_permissions_name" ON "permissions"("name");
CREATE INDEX IF NOT EXISTS "idx_permissions_category" ON "permissions"("category");
CREATE INDEX IF NOT EXISTS "idx_role_permissions_role" ON "role_permissions"("role_id");
CREATE INDEX IF NOT EXISTS "idx_role_permissions_permission" ON "role_permissions"("permission_id");
CREATE INDEX IF NOT EXISTS "idx_user_roles_user" ON "user_roles"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_roles_role" ON "user_roles"("role_id");

-- Insert default roles
INSERT INTO "roles" ("id", "name", "description") VALUES
  ('role_admin', 'ADMIN', 'Full system access with administrative privileges'),
  ('role_creator', 'CREATOR', 'Can create and manage renewable energy projects'),
  ('role_funder', 'FUNDER', 'Can fund projects and view portfolio'),
  ('role_guest', 'GUEST', 'Read-only access to browse projects')
ON CONFLICT ("name") DO NOTHING;

-- Insert default permissions
INSERT INTO "permissions" ("id", "name", "description", "category") VALUES
  -- Admin permissions
  ('perm_user_management', 'user_management', 'Manage user accounts', 'admin'),
  ('perm_project_management', 'project_management', 'Manage all projects', 'admin'),
  ('perm_system_settings', 'system_settings', 'Configure system settings', 'admin'),
  ('perm_security_monitoring', 'security_monitoring', 'View security logs and alerts', 'admin'),
  
  -- Project permissions
  ('perm_create_project', 'create_project', 'Create new projects', 'project'),
  ('perm_manage_own_projects', 'manage_own_projects', 'Edit and manage own projects', 'project'),
  ('perm_view_analytics', 'view_analytics', 'View project analytics', 'project'),
  ('perm_view_projects', 'view_projects', 'Browse and view projects', 'project'),
  
  -- Funding permissions
  ('perm_fund_projects', 'fund_projects', 'Contribute funds to projects', 'funding'),
  ('perm_view_portfolio', 'view_portfolio', 'View funding portfolio', 'funding')
ON CONFLICT ("name") DO NOTHING;

-- Assign permissions to roles
-- ADMIN: All permissions
INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
  ('role_admin', 'perm_user_management'),
  ('role_admin', 'perm_project_management'),
  ('role_admin', 'perm_system_settings'),
  ('role_admin', 'perm_security_monitoring'),
  ('role_admin', 'perm_create_project'),
  ('role_admin', 'perm_manage_own_projects'),
  ('role_admin', 'perm_view_analytics'),
  ('role_admin', 'perm_view_projects'),
  ('role_admin', 'perm_fund_projects'),
  ('role_admin', 'perm_view_portfolio')
ON CONFLICT DO NOTHING;

-- CREATOR: Project and funding permissions
INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
  ('role_creator', 'perm_create_project'),
  ('role_creator', 'perm_manage_own_projects'),
  ('role_creator', 'perm_view_analytics'),
  ('role_creator', 'perm_view_projects'),
  ('role_creator', 'perm_fund_projects'),
  ('role_creator', 'perm_view_portfolio')
ON CONFLICT DO NOTHING;

-- FUNDER: Funding permissions
INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
  ('role_funder', 'perm_view_projects'),
  ('role_funder', 'perm_fund_projects'),
  ('role_funder', 'perm_view_portfolio')
ON CONFLICT DO NOTHING;

-- GUEST: View only
INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
  ('role_guest', 'perm_view_projects')
ON CONFLICT DO NOTHING;

-- Function to get user permissions through roles
CREATE OR REPLACE FUNCTION get_user_permissions(user_id_param TEXT)
RETURNS TABLE (
  permission_id TEXT,
  permission_name VARCHAR(255),
  permission_category VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.id, p.name, p.category
  FROM permissions p
  INNER JOIN role_permissions rp ON p.id = rp.permission_id
  INNER JOIN user_roles ur ON rp.role_id = ur.role_id
  WHERE ur.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(user_id_param TEXT, permission_name_param VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM permissions p
    INNER JOIN role_permissions rp ON p.id = rp.permission_id
    INNER JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = user_id_param AND p.name = permission_name_param
  );
END;
$$ LANGUAGE plpgsql;






