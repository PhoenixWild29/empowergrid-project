import React, { useState, useEffect } from 'react';
import { getSecurityMetrics } from '../lib/security/securityDashboard';

type AlertSeverity = 'low' | 'medium' | 'high' | 'critical' | 'info';
type AlertType = 'concurrent_sessions' | 'ip_change' | 'rapid_refresh' | 'anomaly_detected' | 'login_failed' | 'suspicious_activity';

interface SecurityAlert {
  id: string;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  message: string;
  timestamp: Date;
  location?: string;
  acknowledged: boolean;
  recommendedAction: string;
}

/**
 * SecurityAlertPanel Component
 * 
 * Comprehensive security alert interface for session monitoring
 * 
 * Features:
 * - Severity-based categorization and styling
 * - Session-specific security events
 * - Detailed alert information with timestamps
 * - Actionable response options
 * - Alert history with filtering
 * - Real-time security status indicator
 * - Alert acknowledgment tracking
 * - Quick session termination access
 */
export default function SecurityAlertPanel() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<SecurityAlert[]>([]);
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [securityStatus, setSecurityStatus] = useState<'secure' | 'warning' | 'critical'>('secure');

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [alerts, severityFilter, showAcknowledged]);

  const loadAlerts = async () => {
    try {
      // Load security metrics
      const metrics = await getSecurityMetrics('day');
      
      // Convert to alerts format
      const newAlerts: SecurityAlert[] = metrics.recentAlerts.map((alert: any) => ({
        id: alert.id,
        severity: alert.severity as AlertSeverity,
        type: alert.eventType,
        title: formatAlertTitle(alert.eventType),
        message: formatAlertMessage(alert),
        timestamp: new Date(alert.timestamp),
        acknowledged: false,
        recommendedAction: getRecommendedAction(alert.eventType),
      }));

      setAlerts(newAlerts);
      
      // Update security status
      if (metrics.suspiciousActivities > 5) {
        setSecurityStatus('critical');
      } else if (metrics.suspiciousActivities > 0) {
        setSecurityStatus('warning');
      } else {
        setSecurityStatus('secure');
      }
    } catch (error) {
      console.error('Failed to load security alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = alerts;

    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }

    if (!showAcknowledged) {
      filtered = filtered.filter(alert => !alert.acknowledged);
    }

    setFilteredAlerts(filtered);
  };

  const handleAcknowledge = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  const handleDismissAll = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, acknowledged: true })));
  };

  const handleLogoutAllSessions = async () => {
    if (!confirm('Are you sure you want to logout all sessions? This cannot be undone.')) {
      return;
    }

    try {
      await fetch('/api/auth/logout-all', {
        method: 'POST',
        credentials: 'include',
      });

      window.location.href = '/';
    } catch (error) {
      console.error('Failed to logout all sessions:', error);
      alert('Failed to logout all sessions. Please try again.');
    }
  };

  const formatAlertTitle = (type: string): string => {
    const titles: Record<string, string> = {
      concurrent_sessions: 'Multiple Active Sessions Detected',
      ip_change: 'Unusual IP Address Change',
      rapid_refresh: 'Rapid Token Refresh Detected',
      anomaly_detected: 'Suspicious Activity Detected',
      login_failed: 'Failed Login Attempt',
      suspicious_activity: 'Suspicious Activity',
    };
    return titles[type] || 'Security Alert';
  };

  const formatAlertMessage = (alert: any): string => {
    if (alert.metadata) {
      const meta = alert.metadata;
      if (meta.sessionCount) {
        return `You have ${meta.sessionCount} concurrent sessions active.`;
      }
      if (meta.currentIP) {
        return `Your IP address changed to ${meta.currentIP}.`;
      }
      if (meta.refreshCount) {
        return `${meta.refreshCount} token refreshes detected in ${meta.timeWindow}.`;
      }
    }
    return 'Security event detected. Please review your account activity.';
  };

  const getRecommendedAction = (type: string): string => {
    const actions: Record<string, string> = {
      concurrent_sessions: 'Review active sessions and logout unfamiliar devices',
      ip_change: 'Verify your current location and recent activity',
      rapid_refresh: 'Check for unauthorized access or malware',
      anomaly_detected: 'Review recent account activity and change password if needed',
      login_failed: 'Verify if this was you, otherwise secure your account',
      suspicious_activity: 'Review recent activity and consider resetting credentials',
    };
    return actions[type] || 'Review your account activity';
  };

  const getSeverityConfig = (severity: AlertSeverity) => {
    const configs = {
      critical: { icon: '🔴', color: '#dc3545', bg: '#f8d7da', label: 'Critical' },
      high: { icon: '🟠', color: '#fd7e14', bg: '#ffe5d9', label: 'High' },
      medium: { icon: '🟡', color: '#ffc107', bg: '#fff3cd', label: 'Medium' },
      low: { icon: '🟢', color: '#198754', bg: '#d1e7dd', label: 'Low' },
      info: { icon: '🔵', color: '#0d6efd', bg: '#cfe2ff', label: 'Info' },
    };
    return configs[severity];
  };

  const getStatusConfig = () => {
    const configs = {
      secure: { icon: '🛡️', color: '#198754', label: 'Secure' },
      warning: { icon: '⚠️', color: '#ffc107', label: 'Warning' },
      critical: { icon: '🚨', color: '#dc3545', label: 'Critical' },
    };
    return configs[securityStatus];
  };

  if (loading) {
    return <div className="loading">Loading security alerts...</div>;
  }

  const statusConfig = getStatusConfig();
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="security-alert-panel">
      <div className="panel-header">
        <div className="header-title">
          <h2>Security Alerts</h2>
          <div className="status-badge" style={{ borderColor: statusConfig.color }}>
            <span className="status-icon">{statusConfig.icon}</span>
            <span style={{ color: statusConfig.color }}>{statusConfig.label}</span>
          </div>
        </div>

        {unacknowledgedCount > 0 && (
          <div className="header-actions">
            <span className="alert-count">{unacknowledgedCount} new alert{unacknowledgedCount !== 1 ? 's' : ''}</span>
            <button className="btn-dismiss-all" onClick={handleDismissAll}>
              Dismiss All
            </button>
            <button className="btn-logout-all" onClick={handleLogoutAllSessions}>
              🔒 Logout All Sessions
            </button>
          </div>
        )}
      </div>

      <div className="panel-filters">
        <div className="filter-group">
          <label htmlFor="severity-filter">Severity:</label>
          <select
            id="severity-filter"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity | 'all')}
          >
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
        </div>

        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={showAcknowledged}
            onChange={(e) => setShowAcknowledged(e.target.checked)}
          />
          <span>Show acknowledged</span>
        </label>
      </div>

      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <div className="no-alerts">
            <div className="no-alerts-icon">✓</div>
            <h3>No security alerts</h3>
            <p>Your account security is looking good!</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const config = getSeverityConfig(alert.severity);
            return (
              <div
                key={alert.id}
                className={`alert-item ${alert.acknowledged ? 'acknowledged' : ''}`}
                style={{ borderLeftColor: config.color }}
              >
                <div className="alert-header">
                  <div className="alert-severity" style={{ background: config.bg, color: config.color }}>
                    <span className="severity-icon">{config.icon}</span>
                    <span className="severity-label">{config.label}</span>
                  </div>
                  <div className="alert-timestamp">
                    {alert.timestamp.toLocaleString()}
                  </div>
                </div>

                <div className="alert-body">
                  <h4>{alert.title}</h4>
                  <p className="alert-message">{alert.message}</p>
                  <div className="alert-recommendation">
                    <strong>Recommended Action:</strong> {alert.recommendedAction}
                  </div>
                </div>

                {!alert.acknowledged && (
                  <div className="alert-actions">
                    <button
                      className="btn-acknowledge"
                      onClick={() => handleAcknowledge(alert.id)}
                    >
                      ✓ Acknowledge
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        .security-alert-panel {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e9ecef;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-title h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.875rem;
          border: 2px solid;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .alert-count {
          font-weight: 600;
          color: #dc3545;
        }

        .btn-dismiss-all,
        .btn-logout-all {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-dismiss-all {
          background: #6c757d;
          color: white;
        }

        .btn-dismiss-all:hover {
          background: #5a6268;
        }

        .btn-logout-all {
          background: #dc3545;
          color: white;
        }

        .btn-logout-all:hover {
          background: #bb2d3b;
        }

        .panel-filters {
          display: flex;
          gap: 1.5rem;
          align-items: center;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-group label {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .filter-group select {
          padding: 0.5rem;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .filter-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .no-alerts {
          text-align: center;
          padding: 3rem;
          color: #6c757d;
        }

        .no-alerts-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .no-alerts h3 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .alert-item {
          background: white;
          border: 1px solid #e9ecef;
          border-left: 4px solid;
          border-radius: 8px;
          padding: 1rem;
          transition: all 0.2s;
        }

        .alert-item:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .alert-item.acknowledged {
          opacity: 0.6;
        }

        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .alert-severity {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.8rem;
        }

        .alert-timestamp {
          font-size: 0.85rem;
          color: #6c757d;
        }

        .alert-body h4 {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .alert-message {
          color: #495057;
          margin-bottom: 0.75rem;
        }

        .alert-recommendation {
          background: #e7f3ff;
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.9rem;
          color: #084298;
        }

        .alert-actions {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e9ecef;
        }

        .btn-acknowledge {
          padding: 0.5rem 1rem;
          background: #198754;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-acknowledge:hover {
          background: #157347;
        }

        .loading {
          text-align: center;
          padding: 3rem;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
}






