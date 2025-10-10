/**
 * Governance Token Management Dashboard
 * 
 * WO-154: View and manage governance tokens
 * 
 * Features:
 * - Token balance display
 * - Delegation status
 * - Token-related actions
 * - Consistent formatting
 * - Loading & error states
 */

import { useEffect, useState } from 'react';

interface GovernanceToken {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  delegatedTo?: string;
  votingPower: number;
}

export default function GovernanceDashboard() {
  const [tokens, setTokens] = useState<GovernanceToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTokenData();
  }, []);

  const fetchTokenData = async () => {
    try {
      // Simulated token data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTokens([
        {
          symbol: 'GRID',
          name: 'EmpowerGRID Governance Token',
          balance: 1000,
          value: 1000,
          votingPower: 1000,
        },
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch token data:', error);
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading token data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Governance Tokens</h1>

        {/* WO-154: Token Balance Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {tokens.map((token) => (
            <div key={token.symbol} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{token.symbol}</h3>
                  <p className="text-sm text-gray-600">{token.name}</p>
                </div>
                <div className="text-2xl">🪙</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Balance:</span>
                  <span className="font-semibold">{formatNumber(token.balance)} {token.symbol}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Value:</span>
                  <span className="font-semibold">${formatNumber(token.value)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Voting Power:</span>
                  <span className="font-semibold">{formatNumber(token.votingPower)}</span>
                </div>
              </div>

              {/* WO-154: Delegation Status */}
              <div className="mt-4 pt-4 border-t">
                {token.delegatedTo ? (
                  <div className="text-sm">
                    <p className="text-gray-600 mb-1">Delegated to:</p>
                    <p className="font-mono text-xs bg-gray-100 p-2 rounded">
                      {token.delegatedTo}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-green-700">
                    <span className="mr-2">✓</span>
                    <span>Self-delegated</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* WO-154: Token Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Token Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              disabled={tokens.length === 0 || tokens[0].balance < 1}
              className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delegate Tokens
            </button>

            <button
              disabled={tokens.length === 0}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View Delegation History
            </button>

            <button
              disabled={tokens.length === 0}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Token Transactions
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Note: Token delegation and transfer features require wallet connection
          </p>
        </div>

        {/* Token Information */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">About GRID Tokens</h3>
          <p className="text-sm text-blue-800">
            GRID tokens grant voting power in EmpowerGRID governance decisions. Your voting power
            is proportional to your token balance. Tokens can be delegated to other addresses to
            allow them to vote on your behalf.
          </p>
        </div>
      </div>
    </div>
  );
}



