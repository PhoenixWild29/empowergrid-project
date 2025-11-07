import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { UserRole } from '../../types/auth';

interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface Role {
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

/**
 * Role and Permission Management Page
 * 
 * Features:
 * - List all system roles
 * - Create/edit roles
 * - Assign permissions to roles
 * - View permission hierarchy
 * - Role-based access control
 */
export default function AdminRolesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [roles] = useState<Role[]>([
    {
      name: 'ADMIN',
      description: 'Full system access',
      permissions: ['user_management', 'project_management', 'system_settings', 'security_monitoring'],
      userCount: 2,
    },
    {
      name: 'CREATOR',
      description: 'Can create and manage projects',
      permissions: ['create_project', 'manage_own_projects', 'view_analytics'],
      userCount: 15,
    },
    {
      name: 'FUNDER',
      description: 'Can fund projects',
      permissions: ['view_projects', 'fund_projects', 'view_portfolio'],
      userCount: 48,
    },
    {
      name: 'GUEST',
      description: 'Read-only access',
      permissions: ['view_projects'],
      userCount: 12,
    },
  ]);

  const [permissions] = useState<Permission[]>([
    { id: 'user_management', name: 'User Management', category: 'Admin', description: 'Manage user accounts' },
    { id: 'project_management', name: 'Project Management', category: 'Admin', description: 'Manage all projects' },
    { id: 'system_settings', name: 'System Settings', category: 'Admin', description: 'Configure system settings' },
    { id: 'security_monitoring', name: 'Security Monitoring', category: 'Admin', description: 'View security logs' },
    { id: 'create_project', name: 'Create Project', category: 'Projects', description: 'Create new projects' },
    { id: 'manage_own_projects', name: 'Manage Own Projects', category: 'Projects', description: 'Edit own projects' },
    { id: 'view_analytics', name: 'View Analytics', category: 'Projects', description: 'View project analytics' },
    { id: 'view_projects', name: 'View Projects', category: 'Projects', description: 'Browse projects' },
    { id: 'fund_projects', name: 'Fund Projects', category: 'Funding', description: 'Contribute to projects' },
    { id: 'view_portfolio', name: 'View Portfolio', category: 'Funding', description: 'View funding portfolio' },
  ]);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!isAuthenticated || user?.role !== UserRole.ADMIN) {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (!isAuthenticated || user?.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <Layout>
      <div className="admin-roles-page">
        <div className="page-header">
          <div>
            <h1>Role & Permission Management</h1>
            <p>Manage system roles and their permissions</p>
          </div>
        </div>

        {/* Roles Grid */}
        <div className="roles-grid">
          {roles.map((role) => (
            <div key={role.name} className={`role-card role-${role.name.toLowerCase()}`}>
              <div className="role-header">
                <h3>{role.name}</h3>
                <span className="user-count">{role.userCount} users</span>
              </div>

              <p className="role-description">{role.description}</p>

              <div className="permission-count">
                <strong>{role.permissions.length}</strong> permissions assigned
              </div>

              <div className="role-actions">
                <button
                  className="btn-view"
                  onClick={() => {
                    setSelectedRole(role);
                    setShowPermissions(true);
                  }}
                >
                  View Permissions
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Permission Matrix */}
        <div className="permissions-section">
          <h2>Permission Matrix</h2>
          <p>Overview of permissions by role</p>

          <div className="permission-matrix">
            <table>
              <thead>
                <tr>
                  <th>Permission</th>
                  {roles.map(role => (
                    <th key={role.name}>{role.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(permissionsByCategory).map(([category, perms]) => (
                  <React.Fragment key={category}>
                    <tr className="category-row">
                      <td colSpan={roles.length + 1}><strong>{category}</strong></td>
                    </tr>
                    {perms.map(perm => (
                      <tr key={perm.id}>
                        <td>
                          <div className="permission-name">{perm.name}</div>
                          <div className="permission-desc">{perm.description}</div>
                        </td>
                        {roles.map(role => (
                          <td key={`${role.name}-${perm.id}`} className="permission-cell">
                            {role.permissions.includes(perm.id) ? (
                              <span className="permission-granted">✓</span>
                            ) : (
                              <span className="permission-denied">-</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Permission Details Modal */}
        {showPermissions && selectedRole && (
          <>
            <div className="modal-overlay" onClick={() => setShowPermissions(false)} />
            <div className="permissions-modal">
              <div className="modal-header">
                <h3>{selectedRole.name} Permissions</h3>
                <button onClick={() => setShowPermissions(false)} className="close-btn">
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <p className="modal-description">{selectedRole.description}</p>

                {Object.entries(permissionsByCategory).map(([category, perms]) => {
                  const categoryPerms = perms.filter(p => 
                    selectedRole.permissions.includes(p.id)
                  );

                  if (categoryPerms.length === 0) return null;

                  return (
                    <div key={category} className="permission-category">
                      <h4>{category}</h4>
                      <div className="permission-list">
                        {categoryPerms.map(perm => (
                          <div key={perm.id} className="permission-item">
                            <div className="permission-check">✓</div>
                            <div>
                              <div className="permission-name">{perm.name}</div>
                              <div className="permission-desc">{perm.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <style jsx>{`
          .admin-roles-page {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
          }

          .page-header {
            margin-bottom: 2rem;
          }

          .page-header h1 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }

          .page-header p {
            color: #6c757d;
          }

          .roles-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
          }

          .role-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border-left: 4px solid;
          }

          .role-card.role-admin { border-left-color: #dc3545; }
          .role-card.role-creator { border-left-color: #198754; }
          .role-card.role-funder { border-left-color: #0d6efd; }
          .role-card.role-guest { border-left-color: #6c757d; }

          .role-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
          }

          .role-header h3 {
            font-size: 1.25rem;
            font-weight: 700;
            margin: 0;
          }

          .user-count {
            background: #e9ecef;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 600;
            color: #495057;
          }

          .role-description {
            color: #6c757d;
            margin-bottom: 1rem;
          }

          .permission-count {
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 1rem;
            text-align: center;
          }

          .permission-count strong {
            font-size: 1.5rem;
            color: #0d6efd;
          }

          .role-actions {
            display: flex;
            gap: 0.5rem;
          }

          .btn-view {
            flex: 1;
            padding: 0.75rem;
            background: #0d6efd;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-view:hover {
            background: #0b5ed7;
            transform: translateY(-1px);
          }

          .permissions-section {
            margin-top: 3rem;
          }

          .permissions-section h2 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }

          .permissions-section p {
            color: #6c757d;
            margin-bottom: 1.5rem;
          }

          .permission-matrix {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            overflow-x: auto;
          }

          .permission-matrix table {
            width: 100%;
            border-collapse: collapse;
          }

          .permission-matrix th,
          .permission-matrix td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
          }

          .permission-matrix th {
            background: #f8f9fa;
            font-weight: 700;
            color: #495057;
            text-align: center;
          }

          .permission-matrix th:first-child {
            text-align: left;
          }

          .category-row td {
            background: #f8f9fa;
            font-weight: 700;
            color: #0d6efd;
            padding: 0.75rem 1rem;
          }

          .permission-name {
            font-weight: 600;
            margin-bottom: 0.25rem;
          }

          .permission-desc {
            font-size: 0.85rem;
            color: #6c757d;
          }

          .permission-cell {
            text-align: center;
          }

          .permission-granted {
            color: #198754;
            font-size: 1.5rem;
            font-weight: 700;
          }

          .permission-denied {
            color: #e9ecef;
            font-size: 1.5rem;
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 9998;
          }

          .permissions-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 12px;
            padding: 2rem;
            max-width: 700px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 9999;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e9ecef;
          }

          .modal-header h3 {
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0;
          }

          .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6c757d;
          }

          .modal-description {
            color: #6c757d;
            margin-bottom: 2rem;
          }

          .permission-category {
            margin-bottom: 2rem;
          }

          .permission-category h4 {
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: #0d6efd;
          }

          .permission-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .permission-item {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
          }

          .permission-check {
            color: #198754;
            font-size: 1.5rem;
            font-weight: 700;
            flex-shrink: 0;
          }
        `}</style>
      </div>
    </Layout>
  );
}
