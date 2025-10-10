/**
 * Governance Settings Display
 * 
 * WO-151: Read-only governance parameters
 * 
 * Features:
 * - Minimum quorum display
 * - Voting period display
 * - Proposal requirements
 * - Token configuration
 * - Clear labels & descriptions
 */

import { useEffect, useState } from 'react';

export default function GovernanceSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/governance/settings');
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading governance settings...</div>;
  }

  if (!settings) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">Failed to load governance settings</p>
        <button
          onClick={fetchSettings}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Governance Settings</h1>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="space-y-6">
            {/* WO-151: Minimum Quorum */}
            <SettingItem
              label="Minimum Quorum"
              value={`${settings.minQuorum}%`}
              description="Minimum percentage of total voting power required for a proposal to pass"
            />

            {/* WO-151: Voting Period */}
            <SettingItem
              label="Voting Period"
              value={`${settings.votingPeriodDays} days`}
              description="Duration for which a proposal remains open for voting"
            />

            {/* WO-151: Proposal Requirements */}
            <SettingItem
              label="Proposal Creation Threshold"
              value={`${settings.proposalThreshold} GRID`}
              description="Minimum governance tokens required to create a new proposal"
            />

            <SettingItem
              label="Minimum Tokens to Vote"
              value={`${settings.minTokensToVote} GRID`}
              description="Minimum governance tokens required to participate in voting"
            />

            {/* WO-151: Token Configuration */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Token Configuration</h3>
              
              <SettingItem
                label="Governance Token"
                value={settings.governanceToken ? `${settings.governanceToken.substring(0, 16)}...` : 'Not configured'}
                description="Solana token mint address used for governance voting power"
              />

              <SettingItem
                label="Token Decimals"
                value={settings.tokenDecimals}
                description="Number of decimal places for the governance token"
              />
            </div>

            {/* Advanced Settings */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Advanced Settings</h3>
              
              <SettingItem
                label="Execution Delay"
                value={`${Math.round(settings.executionDelay / 3600)} hours`}
                description="Time delay between proposal passage and execution"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingItem({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{label}</h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      <div className="ml-6 text-right">
        <span className="text-lg font-bold text-blue-600">{value}</span>
      </div>
    </div>
  );
}



