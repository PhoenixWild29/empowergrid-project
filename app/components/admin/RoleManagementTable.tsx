import React, { useState } from 'react';

export interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissionCount: number;
  createdAt: string;
  parentRoleId?: string;
}

interface RoleManagementTableProps {
  roles: Role[];
  onEdit: (role: Role) => void;
  onDelete: (roleId: string) => void;
  onViewHierarchy: (role: Role) => void;
}

/**
 * Role Management Table
 * 
 * Features:
 * - Sortable table
 * - Search functionality
 * - Filter by user count
 * - Edit/Delete actions
 * - View hierarchy
 */
export default function RoleManagementTable({
  roles,
  onEdit,
  onDelete,
  onViewHierarchy,
}: RoleManagementTableProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'userCount' | 'createdAt'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter and sort roles
  const filteredRoles = roles
    .filter(role =>
      role.name.toLowerCase().includes(search.toLowerCase()) ||
      role.description.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'userCount') {
        comparison = a.userCount - b.userCount;
      } else if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDirection(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  return (
    <div className="role-management-table">
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search roles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <table className="roles-table">
        <thead>
          <tr>
            <th onClick={() => toggleSort('name')} className="sortable">
              Role Name {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th>Description</th>
            <th onClick={() => toggleSort('userCount')} className="sortable">
              Users {sortBy === 'userCount' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th>Permissions</th>
            <th onClick={() => toggleSort('createdAt')} className="sortable">
              Created {sortBy === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRoles.map((role) => (
            <tr key={role.id}>
              <td className="role-name">
                <strong>{role.name}</strong>
                {role.parentRoleId && <span className="hierarchy-indicator">↳</span>}
              </td>
              <td className="role-description">{role.description}</td>
              <td className="user-count">
                <span className="count-badge">{role.userCount}</span>
              </td>
              <td className="permission-count">
                <span className="count-badge">{role.permissionCount}</span>
              </td>
              <td>{new Date(role.createdAt).toLocaleDateString()}</td>
              <td className="actions">
                <button
                  className="btn-edit"
                  onClick={() => onEdit(role)}
                  title="Edit role"
                >
                  ✏️
                </button>
                <button
                  className="btn-hierarchy"
                  onClick={() => onViewHierarchy(role)}
                  title="View hierarchy"
                >
                  🌳
                </button>
                <button
                  className="btn-delete"
                  onClick={() => onDelete(role.id)}
                  title="Delete role"
                  disabled={role.userCount > 0}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredRoles.length === 0 && (
        <div className="no-results">
          <p>No roles found matching your search.</p>
        </div>
      )}

      <style jsx>{`
        .role-management-table {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .table-controls {
          padding: 1.5rem;
          border-bottom: 2px solid #e9ecef;
        }

        .search-input {
          width: 100%;
          max-width: 400px;
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
        }

        .search-input:focus {
          outline: none;
          border-color: #0d6efd;
        }

        .roles-table {
          width: 100%;
          border-collapse: collapse;
        }

        .roles-table th,
        .roles-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }

        .roles-table th {
          background: #f8f9fa;
          font-weight: 700;
          color: #495057;
        }

        .roles-table th.sortable {
          cursor: pointer;
          user-select: none;
        }

        .roles-table th.sortable:hover {
          background: #e9ecef;
        }

        .roles-table tbody tr:hover {
          background: #f8f9fa;
        }

        .role-name {
          font-weight: 600;
        }

        .hierarchy-indicator {
          color: #0d6efd;
          margin-left: 0.5rem;
        }

        .role-description {
          color: #6c757d;
          max-width: 300px;
        }

        .count-badge {
          background: #e9ecef;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-edit,
        .btn-hierarchy,
        .btn-delete {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0.25rem;
          transition: transform 0.2s;
        }

        .btn-edit:hover,
        .btn-hierarchy:hover,
        .btn-delete:hover:not(:disabled) {
          transform: scale(1.2);
        }

        .btn-delete:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .no-results {
          text-align: center;
          padding: 3rem;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
}






