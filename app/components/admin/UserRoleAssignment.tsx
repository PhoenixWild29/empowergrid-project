import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string | null;
  role: string;
  permissions: string[];
}

interface RoleOption {
  id: string;
  name: string;
  description: string;
  permissionCount: number;
}

interface RoleAssignmentHistory {
  id: string;
  userId: string;
  roleName: string;
  action: 'assigned' | 'removed';
  assignedBy: string;
  assignedAt: string;
}

/**
 * User-Role Assignment Interface
 * 
 * Features:
 * - Searchable user list
 * - Assign/remove roles
 * - View user permissions
 * - Bulk role assignment
 * - Assignment history
 * - Conflict detection
 * - Search and filter
 */
export default function UserRoleAssignment() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const availableRoles: RoleOption[] = [
    { id: 'ADMIN', name: 'Administrator', description: 'Full system access', permissionCount: 10 },
    { id: 'CREATOR', name: 'Project Creator', description: 'Create and manage projects', permissionCount: 6 },
    { id: 'FUNDER', name: 'Project Funder', description: 'Fund projects', permissionCount: 3 },
    { id: 'GUEST', name: 'Guest', description: 'Read-only access', permissionCount: 1 },
  ];

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users.map((u: any) => ({
          ...u,
          permissions: [], // Will be populated from API
        })));
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(search.toLowerCase()) ||
                          (user.email && user.email.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Handle role assignment
  const handleAssignRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/rbac/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (response.ok) {
        await loadUsers();
        setShowAssignModal(false);
        setSelectedUser(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to assign role');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  // Handle bulk assignment
  const handleBulkAssign = async (roleId: string) => {
    if (selectedUsers.size === 0) return;

    let successCount = 0;
    let failCount = 0;

    for (const userId of selectedUsers) {
      try {
        const response = await fetch('/api/rbac/assign-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId, role: roleId }),
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    alert(`Assigned role to ${successCount} user(s). ${failCount} failed.`);
    setSelectedUsers(new Set());
    setShowBulkAssignModal(false);
    await loadUsers();
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  return (
    <div className="user-role-assignment">
      <div className="assignment-header">
        <div>
          <h2>User-Role Assignment</h2>
          <p>Manage user access levels by assigning roles</p>
        </div>
        {selectedUsers.size > 0 && (
          <button
            className="bulk-assign-btn"
            onClick={() => setShowBulkAssignModal(true)}
          >
            Assign Role to {selectedUsers.size} User(s)
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="controls">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="role-filter"
        >
          <option value="">All Roles</option>
          {availableRoles.map(role => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
      </div>

      {/* User Table */}
      <div className="user-table-container">
        {loading ? (
          <div className="loading-state">Loading users...</div>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                      } else {
                        setSelectedUsers(new Set());
                      }
                    }}
                  />
                </th>
                <th>Username</th>
                <th>Email</th>
                <th>Current Role</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                    />
                  </td>
                  <td><strong>{user.username}</strong></td>
                  <td>{user.email || '-'}</td>
                  <td>
                    <span className={`role-badge role-${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <button
                      className="view-permissions-btn"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowHistory(false);
                      }}
                    >
                      View Permissions
                    </button>
                  </td>
                  <td>
                    <button
                      className="assign-btn"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowAssignModal(true);
                      }}
                    >
                      Change Role
                    </button>
                    <button
                      className="history-btn"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowHistory(true);
                      }}
                    >
                      📋
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Assign Role Modal */}
      {showAssignModal && selectedUser && (
        <>
          <div className="modal-overlay" onClick={() => setShowAssignModal(false)} />
          <div className="assign-modal">
            <h3>Assign Role to {selectedUser.username}</h3>
            <p className="current-role">Current role: <strong>{selectedUser.role}</strong></p>

            <div className="role-options">
              {availableRoles.map(role => (
                <div key={role.id} className="role-option">
                  <button
                    className={`role-option-btn ${selectedUser.role === role.id ? 'current' : ''}`}
                    onClick={() => handleAssignRole(selectedUser.id, role.id)}
                    disabled={selectedUser.role === role.id}
                  >
                    <div className="role-option-header">
                      <strong>{role.name}</strong>
                      <span className="permission-count">{role.permissionCount} permissions</span>
                    </div>
                    <div className="role-option-desc">{role.description}</div>
                  </button>
                </div>
              ))}
            </div>

            <button className="close-btn" onClick={() => setShowAssignModal(false)}>
              Cancel
            </button>
          </div>
        </>
      )}

      {/* Bulk Assign Modal */}
      {showBulkAssignModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowBulkAssignModal(false)} />
          <div className="bulk-modal">
            <h3>Bulk Assign Role</h3>
            <p>Assign a role to {selectedUsers.size} selected user(s)</p>

            <div className="role-options">
              {availableRoles.map(role => (
                <button
                  key={role.id}
                  className="role-option-btn"
                  onClick={() => handleBulkAssign(role.id)}
                >
                  <strong>{role.name}</strong>
                  <span>{role.description}</span>
                </button>
              ))}
            </div>

            <button className="close-btn" onClick={() => setShowBulkAssignModal(false)}>
              Cancel
            </button>
          </div>
        </>
      )}

      {/* User Permissions/History View */}
      {selectedUser && !showAssignModal && !showBulkAssignModal && (
        <>
          <div className="modal-overlay" onClick={() => setSelectedUser(null)} />
          <div className="details-modal">
            <h3>{selectedUser.username}&apos;s {showHistory ? 'Role History' : 'Permissions'}</h3>

            {showHistory ? (
              <div className="history-list">
                <p className="placeholder">Assignment history will be displayed here</p>
              </div>
            ) : (
              <div className="permissions-list">
                <div className="current-role">
                  Current Role: <strong>{selectedUser.role}</strong>
                </div>
                <div className="permissions-grid">
                  {/* Permissions would be displayed here */}
                  <p className="placeholder">User permissions will be displayed here</p>
                </div>
              </div>
            )}

            <button className="close-btn" onClick={() => setSelectedUser(null)}>
              Close
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .user-role-assignment {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .assignment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .assignment-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .assignment-header p {
          color: #6c757d;
        }

        .bulk-assign-btn {
          padding: 0.75rem 1.5rem;
          background: #0d6efd;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .bulk-assign-btn:hover {
          background: #0b5ed7;
        }

        .controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .search-input {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
        }

        .search-input:focus {
          outline: none;
          border-color: #0d6efd;
        }

        .role-filter {
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          cursor: pointer;
        }

        .user-table-container {
          overflow-x: auto;
          border: 2px solid #e9ecef;
          border-radius: 8px;
        }

        .user-table {
          width: 100%;
          border-collapse: collapse;
        }

        .user-table th,
        .user-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }

        .user-table th {
          background: #f8f9fa;
          font-weight: 700;
        }

        .user-table tbody tr:hover {
          background: #f8f9fa;
        }

        .role-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .role-badge.role-admin { background: #f8d7da; color: #842029; }
        .role-badge.role-creator { background: #d1e7dd; color: #0f5132; }
        .role-badge.role-funder { background: #cfe2ff; color: #084298; }
        .role-badge.role-guest { background: #e9ecef; color: #495057; }

        .view-permissions-btn,
        .assign-btn,
        .history-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          margin-right: 0.5rem;
        }

        .view-permissions-btn {
          background: #0d6efd;
          color: white;
          font-size: 0.85rem;
        }

        .assign-btn {
          background: #198754;
          color: white;
          font-size: 0.85rem;
        }

        .history-btn {
          background: #6c757d;
          color: white;
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

        .assign-modal,
        .bulk-modal,
        .details-modal {
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

        .assign-modal h3,
        .bulk-modal h3,
        .details-modal h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .current-role {
          color: #6c757d;
          margin-bottom: 1.5rem;
        }

        .role-options {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .role-option-btn {
          width: 100%;
          padding: 1rem;
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }

        .role-option-btn:hover:not(:disabled) {
          border-color: #0d6efd;
          background: #f0f7ff;
        }

        .role-option-btn.current {
          border-color: #198754;
          background: #d1e7dd;
        }

        .role-option-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .role-option-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .permission-count {
          font-size: 0.85rem;
          color: #6c757d;
        }

        .role-option-desc {
          color: #6c757d;
          font-size: 0.9rem;
        }

        .close-btn {
          padding: 0.75rem 1.5rem;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .close-btn:hover {
          background: #5a6268;
        }

        .loading-state {
          text-align: center;
          padding: 3rem;
          color: #6c757d;
        }

        .placeholder {
          text-align: center;
          padding: 2rem;
          color: #6c757d;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}

