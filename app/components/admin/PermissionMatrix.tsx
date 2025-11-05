import React, { useState, useEffect } from 'react';

interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

interface PermissionChange {
  roleId: string;
  permissionId: string;
  action: 'grant' | 'revoke';
}

/**
 * Permission Assignment Matrix
 * 
 * Features:
 * - Matrix view: roles (rows) x permissions (columns)
 * - Interactive checkboxes for grant/revoke
 * - Bulk selection options
 * - Permission descriptions on hover
 * - Save confirmation with change summary
 * - Search and filter
 * - Error handling
 */
export default function PermissionMatrix() {
  const [roles] = useState<Role[]>([
    {
      id: 'ADMIN',
      name: 'Administrator',
      permissions: ['user_management', 'project_management', 'system_settings', 'security_monitoring',
                    'create_project', 'manage_own_projects', 'view_analytics', 'view_projects',
                    'fund_projects', 'view_portfolio'],
    },
    {
      id: 'CREATOR',
      name: 'Project Creator',
      permissions: ['create_project', 'manage_own_projects', 'view_analytics', 'view_projects',
                    'fund_projects', 'view_portfolio'],
    },
    {
      id: 'FUNDER',
      name: 'Project Funder',
      permissions: ['view_projects', 'fund_projects', 'view_portfolio'],
    },
    {
      id: 'GUEST',
      name: 'Guest',
      permissions: ['view_projects'],
    },
  ]);

  const [permissions] = useState<Permission[]>([
    { id: 'user_management', name: 'User Management', category: 'Admin', description: 'Create, edit, and delete user accounts' },
    { id: 'project_management', name: 'Project Management', category: 'Admin', description: 'Manage all projects on the platform' },
    { id: 'system_settings', name: 'System Settings', category: 'Admin', description: 'Configure system-wide settings' },
    { id: 'security_monitoring', name: 'Security Monitoring', category: 'Admin', description: 'View security logs and alerts' },
    { id: 'create_project', name: 'Create Project', category: 'Project', description: 'Create new renewable energy projects' },
    { id: 'manage_own_projects', name: 'Manage Own Projects', category: 'Project', description: 'Edit and update own projects' },
    { id: 'view_analytics', name: 'View Analytics', category: 'Project', description: 'Access project analytics and insights' },
    { id: 'view_projects', name: 'View Projects', category: 'Project', description: 'Browse and view project listings' },
    { id: 'fund_projects', name: 'Fund Projects', category: 'Funding', description: 'Contribute funds to projects' },
    { id: 'view_portfolio', name: 'View Portfolio', category: 'Funding', description: 'View personal funding portfolio' },
  ]);

  const [pendingChanges, setPendingChanges] = useState<PermissionChange[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [hoveredPermission, setHoveredPermission] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Filter permissions
  const filteredPermissions = permissions.filter(perm => {
    const matchesSearch = perm.name.toLowerCase().includes(search.toLowerCase()) ||
                          perm.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || perm.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const permissionsByCategory = filteredPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Check if role has permission (considering pending changes)
  const hasPermission = (roleId: string, permissionId: string): boolean => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return false;

    const currentlyHas = role.permissions.includes(permissionId);
    const pendingChange = pendingChanges.find(
      c => c.roleId === roleId && c.permissionId === permissionId
    );

    if (pendingChange) {
      return pendingChange.action === 'grant';
    }

    return currentlyHas;
  };

  // Toggle permission
  const togglePermission = (roleId: string, permissionId: string) => {
    const currentlyHas = hasPermission(roleId, permissionId);
    const action = currentlyHas ? 'revoke' : 'grant';

    // Check if there's already a pending change for this
    const existingChangeIndex = pendingChanges.findIndex(
      c => c.roleId === roleId && c.permissionId === permissionId
    );

    if (existingChangeIndex >= 0) {
      // Remove pending change (reverting to original state)
      setPendingChanges(prev => prev.filter((_, i) => i !== existingChangeIndex));
    } else {
      // Add new pending change
      setPendingChanges(prev => [...prev, { roleId, permissionId, action }]);
    }
  };

  // Bulk assign permission to all roles
  const bulkAssignPermission = (permissionId: string) => {
    const newChanges: PermissionChange[] = [];
    
    roles.forEach(role => {
      if (!hasPermission(role.id, permissionId)) {
        newChanges.push({ roleId: role.id, permissionId, action: 'grant' });
      }
    });

    setPendingChanges(prev => [...prev, ...newChanges]);
  };

  // Bulk revoke permission from all roles
  const bulkRevokePermission = (permissionId: string) => {
    const newChanges: PermissionChange[] = [];
    
    roles.forEach(role => {
      if (hasPermission(role.id, permissionId)) {
        newChanges.push({ roleId: role.id, permissionId, action: 'revoke' });
      }
    });

    setPendingChanges(prev => [...prev, ...newChanges]);
  };

  // Handle save
  const handleSave = async () => {
    if (pendingChanges.length === 0) return;
    
    setSaving(true);

    try {
      // In production, call API to save changes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear pending changes
      setPendingChanges([]);
      setShowConfirmation(false);
      
      alert('Permission changes saved successfully!');
    } catch (error) {
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const categories = Array.from(new Set(permissions.map(p => p.category)));

  return (
    <div className="permission-matrix">
      <div className="matrix-header">
        <h2>Permission Assignment Matrix</h2>
        <p>Manage role permissions through an interactive matrix</p>
      </div>

      {/* Search and Filter */}
      <div className="matrix-controls">
        <input
          type="text"
          placeholder="Search permissions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="category-filter"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {pendingChanges.length > 0 && (
          <button
            className="save-changes-btn"
            onClick={() => setShowConfirmation(true)}
          >
            💾 Save Changes ({pendingChanges.length})
          </button>
        )}
      </div>

      {/* Permission Matrix Table */}
      <div className="matrix-container">
        <table className="matrix-table">
          <thead>
            <tr>
              <th className="role-header">Role</th>
              {Object.entries(permissionsByCategory).map(([category, perms]) => (
                <React.Fragment key={category}>
                  <th colSpan={perms.length} className="category-header">
                    {category}
                  </th>
                </React.Fragment>
              ))}
            </tr>
            <tr>
              <th></th>
              {filteredPermissions.map(perm => (
                <th
                  key={perm.id}
                  className="permission-header"
                  onMouseEnter={() => setHoveredPermission(perm.id)}
                  onMouseLeave={() => setHoveredPermission(null)}
                  title={perm.description}
                >
                  <div className="permission-name">{perm.name}</div>
                  <div className="bulk-actions">
                    <button
                      onClick={() => bulkAssignPermission(perm.id)}
                      title="Assign to all roles"
                      className="bulk-btn"
                    >
                      ⬇
                    </button>
                  </div>
                  {hoveredPermission === perm.id && (
                    <div className="permission-tooltip">
                      {perm.description}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id}>
                <td className="role-cell">
                  <strong>{role.name}</strong>
                </td>
                {filteredPermissions.map(perm => {
                  const checked = hasPermission(role.id, perm.id);
                  const hasPendingChange = pendingChanges.some(
                    c => c.roleId === role.id && c.permissionId === perm.id
                  );

                  return (
                    <td key={`${role.id}-${perm.id}`} className="permission-cell">
                      <label className="checkbox-container">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(role.id, perm.id)}
                          className={hasPendingChange ? 'pending' : ''}
                        />
                        <span className="checkmark"></span>
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save Confirmation Modal */}
      {showConfirmation && (
        <>
          <div className="modal-overlay" onClick={() => setShowConfirmation(false)} />
          <div className="confirmation-modal">
            <h3>Confirm Changes</h3>
            <p>You are about to make {pendingChanges.length} permission change(s):</p>

            <div className="changes-summary">
              {pendingChanges.map((change, index) => {
                const role = roles.find(r => r.id === change.roleId);
                const perm = permissions.find(p => p.id === change.permissionId);
                
                return (
                  <div key={index} className="change-item">
                    {change.action === 'grant' ? '✅ Grant' : '❌ Revoke'}{' '}
                    <strong>{perm?.name}</strong> {change.action === 'grant' ? 'to' : 'from'}{' '}
                    <strong>{role?.name}</strong>
                  </div>
                );
              })}
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowConfirmation(false)}
                className="cancel-btn"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="confirm-btn"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .permission-matrix {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .matrix-header {
          margin-bottom: 2rem;
        }

        .matrix-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .matrix-header p {
          color: #6c757d;
        }

        .matrix-controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          align-items: center;
        }

        .search-input {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
        }

        .search-input:focus {
          outline: none;
          border-color: #0d6efd;
        }

        .category-filter {
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          cursor: pointer;
        }

        .save-changes-btn {
          padding: 0.75rem 1.5rem;
          background: #198754;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .save-changes-btn:hover {
          background: #157347;
        }

        .matrix-container {
          overflow-x: auto;
          border: 2px solid #e9ecef;
          border-radius: 8px;
        }

        .matrix-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;
        }

        .matrix-table th,
        .matrix-table td {
          padding: 0.75rem;
          text-align: center;
          border: 1px solid #e9ecef;
        }

        .role-header {
          position: sticky;
          left: 0;
          background: #f8f9fa;
          z-index: 10;
          text-align: left !important;
        }

        .category-header {
          background: #0d6efd;
          color: white;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.85rem;
        }

        .permission-header {
          position: relative;
          background: #f8f9fa;
          font-size: 0.85rem;
          padding: 0.5rem;
          vertical-align: top;
        }

        .permission-name {
          font-weight: 600;
          margin-bottom: 0.5rem;
          max-width: 120px;
          word-wrap: break-word;
        }

        .bulk-actions {
          display: flex;
          justify-content: center;
        }

        .bulk-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .bulk-btn:hover {
          background: #5a6268;
        }

        .permission-tooltip {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: #212529;
          color: white;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-size: 0.85rem;
          white-space: normal;
          max-width: 200px;
          z-index: 100;
          margin-top: 0.5rem;
        }

        .role-cell {
          position: sticky;
          left: 0;
          background: white;
          font-weight: 700;
          text-align: left !important;
          border-right: 2px solid #e9ecef;
        }

        .permission-cell {
          background: white;
        }

        .permission-cell:hover {
          background: #f8f9fa;
        }

        .checkbox-container {
          display: inline-block;
          position: relative;
          cursor: pointer;
        }

        .checkbox-container input {
          opacity: 0;
          position: absolute;
          cursor: pointer;
        }

        .checkmark {
          display: inline-block;
          width: 24px;
          height: 24px;
          background: #fff;
          border: 2px solid #e9ecef;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .checkbox-container input:checked ~ .checkmark {
          background: #198754;
          border-color: #198754;
        }

        .checkbox-container input:checked ~ .checkmark::after {
          content: '✓';
          color: white;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .checkbox-container input.pending ~ .checkmark {
          border-color: #ffc107;
          border-width: 3px;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
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

        .confirmation-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border-radius: 12px;
          padding: 2rem;
          max-width: 600px;
          width: 90%;
          max-height: 70vh;
          overflow-y: auto;
          z-index: 9999;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }

        .confirmation-modal h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .changes-summary {
          max-height: 300px;
          overflow-y: auto;
          margin: 1.5rem 0;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .change-item {
          padding: 0.5rem 0;
          border-bottom: 1px solid #e9ecef;
        }

        .change-item:last-child {
          border-bottom: none;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .cancel-btn,
        .confirm-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .cancel-btn {
          background: #6c757d;
          color: white;
        }

        .cancel-btn:hover:not(:disabled) {
          background: #5a6268;
        }

        .confirm-btn {
          background: #198754;
          color: white;
        }

        .confirm-btn:hover:not(:disabled) {
          background: #157347;
        }

        .cancel-btn:disabled,
        .confirm-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}






