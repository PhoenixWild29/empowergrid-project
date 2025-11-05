import React from 'react';

interface Role {
  id: string;
  name: string;
  description: string;
  parentRoleId?: string;
  userCount: number;
  permissionCount: number;
}

interface RoleHierarchyViewProps {
  roles: Role[];
  selectedRole?: Role;
}

/**
 * Role Hierarchy Visualization
 * 
 * Displays role parent-child relationships in a tree structure
 */
export default function RoleHierarchyView({ roles, selectedRole }: RoleHierarchyViewProps) {
  // Build hierarchy tree
  const buildTree = (): Role[] => {
    // For simple hierarchy, show roles without parents first, then children
    const rootRoles = roles.filter(r => !r.parentRoleId);
    return rootRoles;
  };

  const getChildRoles = (parentId: string): Role[] => {
    return roles.filter(r => r.parentRoleId === parentId);
  };

  const renderRoleNode = (role: Role, level: number = 0): React.ReactNode => {
    const children = getChildRoles(role.id);
    const isSelected = selectedRole?.id === role.id;

    return (
      <div key={role.id} className="role-node" style={{ marginLeft: `${level * 2}rem` }}>
        <div className={`role-card ${isSelected ? 'selected' : ''}`}>
          <div className="role-header">
            <span className="role-icon">{level > 0 ? '↳' : '👑'}</span>
            <div>
              <div className="role-name">{role.name}</div>
              <div className="role-description">{role.description}</div>
            </div>
          </div>
          <div className="role-stats">
            <span>{role.userCount} users</span>
            <span>{role.permissionCount} permissions</span>
          </div>
        </div>

        {children.map(child => renderRoleNode(child, level + 1))}

        <style jsx>{`
          .role-node {
            margin-bottom: 1rem;
          }

          .role-card {
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 1rem;
            transition: all 0.2s;
          }

          .role-card.selected {
            border-color: #0d6efd;
            background: #f0f7ff;
          }

          .role-card:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .role-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 0.75rem;
          }

          .role-icon {
            font-size: 1.5rem;
          }

          .role-name {
            font-weight: 700;
            font-size: 1.1rem;
            color: #212529;
          }

          .role-description {
            color: #6c757d;
            font-size: 0.9rem;
          }

          .role-stats {
            display: flex;
            gap: 1rem;
            font-size: 0.85rem;
            color: #6c757d;
          }

          .role-stats span {
            background: #f8f9fa;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
          }
        `}</style>
      </div>
    );
  };

  const tree = buildTree();

  return (
    <div className="role-hierarchy-view">
      <div className="hierarchy-header">
        <h3>Role Hierarchy</h3>
        <p>Visualization of role parent-child relationships</p>
      </div>

      <div className="hierarchy-tree">
        {tree.map(role => renderRoleNode(role))}
      </div>

      {tree.length === 0 && (
        <div className="no-hierarchy">
          <p>No role hierarchy defined</p>
        </div>
      )}

      <style jsx>{`
        .role-hierarchy-view {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .hierarchy-header {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e9ecef;
        }

        .hierarchy-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .hierarchy-header p {
          color: #6c757d;
          font-size: 0.9rem;
          margin: 0;
        }

        .hierarchy-tree {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .no-hierarchy {
          text-align: center;
          padding: 3rem;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
}






