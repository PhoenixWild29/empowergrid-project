import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface UserReputation {
  id: string;
  username: string;
  email: string | null;
  reputation: number;
  tier: string;
  lastUpdated: Date;
}

interface ReputationLog {
  id: string;
  userId: string;
  username: string;
  oldScore: number;
  newScore: number;
  reason: string;
  adminUsername: string;
  timestamp: Date;
}

/**
 * Administrative Reputation Management Interface
 * 
 * Features:
 * - Searchable list of users with reputation
 * - Manual reputation score adjustment
 * - Activity logs with timestamps
 * - Confirmation dialogs
 * - Filtering and sorting
 * - Admin only access
 */
export default function AdminReputationPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<UserReputation[]>([]);
  const [logs, setLogs] = useState<ReputationLog[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserReputation | null>(null);
  const [newScore, setNewScore] = useState('');
  const [reason, setReason] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'username' | 'reputation' | 'lastUpdated'>('reputation');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check admin access
  useEffect(() => {
    if (!isAuthenticated || user?.role?.toString() !== 'ADMIN') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  // Load data
  useEffect(() => {
    if (isAuthenticated && user?.role?.toString() === 'ADMIN') {
      loadUsers();
      loadLogs();
    }
  }, [isAuthenticated, user]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users.map((u: any) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          reputation: u.reputation,
          tier: getTier(u.reputation),
          lastUpdated: new Date(),
        })));
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    // In production, load from API
    setLogs([]);
  };

  const getTier = (score: number): string => {
    if (score >= 1000) return 'Legend';
    if (score >= 500) return 'Expert';
    if (score >= 250) return 'Advanced';
    if (score >= 100) return 'Intermediate';
    if (score >= 50) return 'Rising';
    return 'Newcomer';
  };

  const getTierColor = (tier: string): string => {
    const colors: Record<string, string> = {
      Legend: '#ffd700',
      Expert: '#9b59b6',
      Advanced: '#3498db',
      Intermediate: '#2ecc71',
      Rising: '#95a5a6',
      Newcomer: '#bdc3c7',
    };
    return colors[tier] || '#bdc3c7';
  };

  // Filter and sort users
  const filteredUsers = users
    .filter(u => {
      const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase()) ||
                           (u.email && u.email.toLowerCase().includes(search.toLowerCase()));
      const matchesMinScore = !minScore || u.reputation >= parseInt(minScore);
      const matchesMaxScore = !maxScore || u.reputation <= parseInt(maxScore);
      return matchesSearch && matchesMinScore && matchesMaxScore;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'username') comparison = a.username.localeCompare(b.username);
      else if (sortBy === 'reputation') comparison = a.reputation - b.reputation;
      else if (sortBy === 'lastUpdated') comparison = a.lastUpdated.getTime() - b.lastUpdated.getTime();
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Handle reputation adjustment
  const handleAdjust = () => {
    if (!selectedUser) return;
    
    const score = parseInt(newScore);
    if (isNaN(score) || score < 0 || score > 10000) {
      alert('Please enter a valid score between 0 and 10000');
      return;
    }

    if (!reason.trim()) {
      alert('Please provide a reason for the adjustment');
      return;
    }

    setShowConfirm(true);
  };

  const confirmAdjustment = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/reputation/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: selectedUser.id,
          reputation: parseInt(newScore),
          reason,
        }),
      });

      if (response.ok) {
        await loadUsers();
        await loadLogs();
        setShowAdjustModal(false);
        setShowConfirm(false);
        setSelectedUser(null);
        setNewScore('');
        setReason('');
        alert('Reputation updated successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update reputation');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  if (!isAuthenticated || user?.role?.toString() !== 'ADMIN') {
    return null;
  }

  return (
    <Layout>
      <div className="admin-reputation-page">
        <div className="page-header">
          <h1>Reputation Management</h1>
          <p>Monitor and adjust user reputation scores</p>
        </div>

        {/* Filters */}
        <div className="filters">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <input
            type="number"
            placeholder="Min score"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="score-filter"
          />
          <input
            type="number"
            placeholder="Max score"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            className="score-filter"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="sort-select"
          >
            <option value="reputation">Sort by Reputation</option>
            <option value="username">Sort by Username</option>
            <option value="lastUpdated">Sort by Last Updated</option>
          </select>
          <button
            onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
            className="sort-direction-btn"
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* User List */}
        <div className="users-table-container">
          {loading ? (
            <div className="loading-state">Loading users...</div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Reputation</th>
                  <th>Tier</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td><strong>{user.username}</strong></td>
                    <td>{user.email || '-'}</td>
                    <td>
                      <span className="reputation-score">{user.reputation}</span>
                    </td>
                    <td>
                      <span 
                        className="tier-badge"
                        style={{ borderColor: getTierColor(user.tier), color: getTierColor(user.tier) }}
                      >
                        {user.tier}
                      </span>
                    </td>
                    <td>{user.lastUpdated.toLocaleDateString()}</td>
                    <td>
                      <button
                        className="adjust-btn"
                        onClick={() => {
                          setSelectedUser(user);
                          setNewScore(user.reputation.toString());
                          setReason('');
                          setShowAdjustModal(true);
                        }}
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Activity Log */}
        <div className="activity-log-section">
          <h2>Recent Reputation Changes</h2>
          <div className="log-container">
            {logs.length === 0 ? (
              <p className="no-logs">No reputation changes recorded yet</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="log-item">
                  <div className="log-header">
                    <strong>{log.username}</strong>
                    <span className="log-timestamp">{log.timestamp.toLocaleString()}</span>
                  </div>
                  <div className="log-details">
                    <span>{log.oldScore} → {log.newScore}</span>
                    <span className="log-admin">by {log.adminUsername}</span>
                  </div>
                  <div className="log-reason">{log.reason}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Adjustment Modal */}
        {showAdjustModal && selectedUser && (
          <>
            <div className="modal-overlay" onClick={() => setShowAdjustModal(false)} />
            <div className="adjust-modal">
              <h3>Adjust Reputation for {selectedUser.username}</h3>
              <p className="current-score">
                Current Score: <strong>{selectedUser.reputation}</strong> ({selectedUser.tier})
              </p>

              <div className="form-group">
                <label htmlFor="newScore">New Reputation Score *</label>
                <input
                  type="number"
                  id="newScore"
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  min="0"
                  max="10000"
                  className="score-input"
                  placeholder="Enter new score (0-10000)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reason">Reason for Adjustment *</label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="reason-input"
                  placeholder="Explain why this adjustment is being made..."
                />
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjust}
                  className="adjust-btn-primary"
                >
                  Adjust Reputation
                </button>
              </div>
            </div>
          </>
        )}

        {/* Confirmation Dialog */}
        {showConfirm && selectedUser && (
          <>
            <div className="modal-overlay" onClick={() => setShowConfirm(false)} />
            <div className="confirm-modal">
              <h3>Confirm Reputation Adjustment</h3>
              <div className="confirm-details">
                <p><strong>User:</strong> {selectedUser.username}</p>
                <p><strong>Current Score:</strong> {selectedUser.reputation} ({selectedUser.tier})</p>
                <p><strong>New Score:</strong> {newScore} ({getTier(parseInt(newScore))})</p>
                <p><strong>Change:</strong> {parseInt(newScore) - selectedUser.reputation > 0 ? '+' : ''}{parseInt(newScore) - selectedUser.reputation} points</p>
                <p><strong>Reason:</strong> {reason}</p>
              </div>

              <div className="confirm-warning">
                ⚠️ This action will be logged and cannot be undone.
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAdjustment}
                  className="confirm-btn"
                >
                  Confirm Adjustment
                </button>
              </div>
            </div>
          </>
        )}

        <style jsx>{`
          .admin-reputation-page {
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

          .filters {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
          }

          .search-input {
            flex: 1;
            min-width: 200px;
            padding: 0.75rem;
            border: 2px solid #e9ecef;
            border-radius: 8px;
          }

          .score-filter,
          .sort-select {
            padding: 0.75rem;
            border: 2px solid #e9ecef;
            border-radius: 8px;
          }

          .sort-direction-btn {
            padding: 0.75rem 1rem;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1.2rem;
          }

          .users-table-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            overflow-x: auto;
            margin-bottom: 2rem;
          }

          .loading-state {
            text-align: center;
            padding: 3rem;
            color: #6c757d;
          }

          .users-table {
            width: 100%;
            border-collapse: collapse;
          }

          .users-table th,
          .users-table td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
          }

          .users-table th {
            background: #f8f9fa;
            font-weight: 700;
          }

          .users-table tbody tr:hover {
            background: #f8f9fa;
          }

          .reputation-score {
            font-weight: 700;
            font-size: 1.1rem;
            color: #0d6efd;
          }

          .tier-badge {
            padding: 0.25rem 0.75rem;
            border: 2px solid;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 700;
          }

          .adjust-btn {
            padding: 0.5rem 1rem;
            background: #0d6efd;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
          }

          .adjust-btn:hover {
            background: #0b5ed7;
          }

          .activity-log-section {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .activity-log-section h2 {
            font-size: 1.25rem;
            margin-bottom: 1rem;
          }

          .log-container {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .no-logs {
            text-align: center;
            padding: 2rem;
            color: #6c757d;
          }

          .log-item {
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
          }

          .log-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
          }

          .log-timestamp {
            color: #6c757d;
            font-size: 0.85rem;
          }

          .log-details {
            display: flex;
            gap: 1rem;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
          }

          .log-admin {
            color: #6c757d;
          }

          .log-reason {
            font-size: 0.9rem;
            color: #495057;
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

          .adjust-modal,
          .confirm-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 12px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            z-index: 9999;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          }

          .adjust-modal h3,
          .confirm-modal h3 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
          }

          .current-score {
            color: #6c757d;
            margin-bottom: 1.5rem;
          }

          .form-group {
            margin-bottom: 1.5rem;
          }

          .form-group label {
            display: block;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }

          .score-input,
          .reason-input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 1rem;
            font-family: inherit;
          }

          .score-input:focus,
          .reason-input:focus {
            outline: none;
            border-color: #0d6efd;
          }

          .confirm-details {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
          }

          .confirm-details p {
            margin: 0.5rem 0;
          }

          .confirm-warning {
            background: #fff3cd;
            color: #664d03;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            font-weight: 600;
          }

          .modal-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
          }

          .cancel-btn,
          .adjust-btn-primary,
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

          .cancel-btn:hover {
            background: #5a6268;
          }

          .adjust-btn-primary,
          .confirm-btn {
            background: #0d6efd;
            color: white;
          }

          .adjust-btn-primary:hover,
          .confirm-btn:hover {
            background: #0b5ed7;
          }
        `}</style>
      </div>
    </Layout>
  );
}




