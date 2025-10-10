/**
 * Contract Upgrade Management Interface
 * 
 * WO-109: Version management and migration UI
 * 
 * Features:
 * - Upgrade initiation
 * - Compatibility testing
 * - Migration monitoring
 * - Rollback procedures
 * - Upgrade history
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';

export default function ContractUpgradePage() {
  const router = useRouter();
  const { contractId } = router.query;
  const { user } = useAuth();

  const [currentVersion, setCurrentVersion] = useState('1.0.0');
  const [newVersion, setNewVersion] = useState('');
  const [migrationPlan, setMigrationPlan] = useState('');
  const [upgradeHistory, setUpgradeHistory] = useState<any[]>([]);
  const [compatibilityTest, setCompatibilityTest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upgrade' | 'history' | 'test'>('upgrade');

  // WO-109: Fetch upgrade history
  useEffect(() => {
    async function fetchHistory() {
      if (!contractId) return;

      try {
        const response = await fetch(`/api/contracts/${contractId}/upgrade`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'HISTORY' }),
        });

        const data = await response.json();
        if (data.success) {
          setUpgradeHistory(data.history);
        }
      } catch (error) {
        console.error('[WO-109] Failed to fetch history:', error);
      }
    }

    fetchHistory();
  }, [contractId]);

  // WO-109: Test compatibility
  const handleTestCompatibility = async () => {
    if (!newVersion) {
      alert('Please enter new version');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/contracts/${contractId}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST',
          newVersion,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCompatibilityTest(data.compatibility);
      }
    } catch (error) {
      console.error('[WO-109] Compatibility test error:', error);
      alert('Failed to test compatibility');
    } finally {
      setIsLoading(false);
    }
  };

  // WO-109: Initiate upgrade
  const handleInitiateUpgrade = async () => {
    if (!newVersion || !migrationPlan) {
      alert('Please fill in all required fields');
      return;
    }

    if (!confirm('Are you sure you want to initiate contract upgrade? This requires stakeholder approval.')) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/contracts/${contractId}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'INITIATE',
          newVersion,
          migrationPlan,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Contract upgrade initiated successfully!');
        setNewVersion('');
        setMigrationPlan('');
        // Reload history
        window.location.reload();
      } else {
        alert(data.message || 'Failed to initiate upgrade');
      }
    } catch (error) {
      console.error('[WO-109] Upgrade initiation error:', error);
      alert('Failed to initiate upgrade');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Contract Upgrade Management</h1>
            <p className="mt-2 text-gray-600">
              Manage contract versions, test upgrades, and perform migrations
            </p>
          </div>

          {/* Current Version Display */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Current Version</div>
                <div className="text-3xl font-bold text-gray-900">{currentVersion}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Contract ID</div>
                <div className="font-mono text-sm text-gray-900">{contractId}</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('upgrade')}
                  className={'px-6 py-4 text-sm font-medium ' + (
                    activeTab === 'upgrade'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  Upgrade
                </button>
                <button
                  onClick={() => setActiveTab('test')}
                  className={'px-6 py-4 text-sm font-medium ' + (
                    activeTab === 'test'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  Compatibility Test
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={'px-6 py-4 text-sm font-medium ' + (
                    activeTab === 'history'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  History
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Upgrade Tab */}
              {activeTab === 'upgrade' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Initiate Contract Upgrade</h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Version *
                      </label>
                      <input
                        type="text"
                        value={newVersion}
                        onChange={(e) => setNewVersion(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 2.0.0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Migration Plan *
                      </label>
                      <textarea
                        value={migrationPlan}
                        onChange={(e) => setMigrationPlan(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        rows={6}
                        placeholder="Describe the migration plan and changes..."
                      />
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <span className="text-yellow-600 text-xl">⚠️</span>
                        <div>
                          <div className="font-medium text-yellow-800">Important</div>
                          <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                            <li>• All stakeholders will be notified</li>
                            <li>• Stakeholder approval required before execution</li>
                            <li>• State migration will preserve all existing data</li>
                            <li>• Rollback capability available if issues detected</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleInitiateUpgrade}
                      disabled={isLoading}
                      className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {isLoading ? 'Processing...' : 'Initiate Upgrade'}
                    </button>
                  </div>
                </div>
              )}

              {/* Compatibility Test Tab */}
              {activeTab === 'test' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Compatibility Testing</h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Version to Test
                      </label>
                      <input
                        type="text"
                        value={newVersion}
                        onChange={(e) => setNewVersion(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 2.0.0"
                      />
                    </div>

                    <button
                      onClick={handleTestCompatibility}
                      disabled={isLoading}
                      className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                      Run Compatibility Test
                    </button>

                    {compatibilityTest && (
                      <div className={'border-2 rounded-lg p-6 ' + (
                        compatibilityTest.compatible ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                      )}>
                        <div className="flex items-center space-x-3 mb-4">
                          <span className="text-3xl">{compatibilityTest.compatible ? '✓' : '✗'}</span>
                          <div>
                            <div className="font-bold text-lg">
                              {compatibilityTest.compatible ? 'Compatible' : 'Incompatible'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {currentVersion} → {newVersion}
                            </div>
                          </div>
                        </div>

                        {compatibilityTest.issues.length > 0 && (
                          <div className="mb-4">
                            <div className="font-medium text-red-800 mb-2">Issues:</div>
                            <ul className="list-disc list-inside space-y-1">
                              {compatibilityTest.issues.map((issue: string, idx: number) => (
                                <li key={idx} className="text-red-700 text-sm">{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {compatibilityTest.warnings.length > 0 && (
                          <div>
                            <div className="font-medium text-yellow-800 mb-2">Warnings:</div>
                            <ul className="list-disc list-inside space-y-1">
                              {compatibilityTest.warnings.map((warning: string, idx: number) => (
                                <li key={idx} className="text-yellow-700 text-sm">{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Upgrade History</h3>

                  {upgradeHistory.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No upgrades have been performed on this contract
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upgradeHistory.map((upgrade: any) => (
                        <div key={upgrade.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="text-sm text-gray-600">Upgrade</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {upgrade.fromVersion} → {upgrade.toVersion}
                              </div>
                            </div>
                            <span className={'px-3 py-1 text-xs font-medium rounded-full ' + (
                              upgrade.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              upgrade.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                              upgrade.status === 'ROLLED_BACK' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            )}>
                              {upgrade.status}
                            </span>
                          </div>

                          <div className="text-sm text-gray-600 mb-2">
                            Authorized by: {upgrade.authorizedBy}
                          </div>

                          <div className="text-xs text-gray-500">
                            {new Date(upgrade.upgradedAt).toLocaleString()}
                          </div>

                          {upgrade.migrationLogs && upgrade.migrationLogs.length > 0 && (
                            <div className="mt-4 p-3 bg-gray-50 rounded">
                              <div className="text-xs font-medium text-gray-700 mb-2">Migration Logs</div>
                              <div className="space-y-1">
                                {upgrade.migrationLogs.map((log: string, idx: number) => (
                                  <div key={idx} className="text-xs text-gray-600">• {log}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}



