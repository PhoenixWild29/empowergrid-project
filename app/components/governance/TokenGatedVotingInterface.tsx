/**
 * Token-Gated Voting Interface
 * 
 * WO-150: Verify token holdings & enable voting
 * 
 * Features:
 * - Token balance display
 * - Voting eligibility status
 * - Clear eligibility feedback
 * - Vote submission prevention
 * - Loading states
 */

import { useEffect, useState } from 'react';

interface TokenGatedVotingInterfaceProps {
  proposalId: string;
  onVote: (support: boolean) => Promise<void>;
  voting: boolean;
  timeRemaining?: number;
}

export default function TokenGatedVotingInterface({
  proposalId,
  onVote,
  voting,
  timeRemaining,
}: TokenGatedVotingInterfaceProps) {
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [isEligible, setIsEligible] = useState(false);
  const [ineligibilityReason, setIneligibilityReason] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  useEffect(() => {
    fetchTokenBalance();
  }, []);

  const fetchTokenBalance = async () => {
    setLoadingBalance(true);
    try {
      // Simulated token balance check
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const balance = 100; // Simulated GRID token balance
      const requiredTokens = 1; // Minimum tokens to vote

      setTokenBalance(balance);
      
      if (balance >= requiredTokens) {
        setIsEligible(true);
        setIneligibilityReason(null);
      } else {
        setIsEligible(false);
        setIneligibilityReason(`Insufficient tokens. You need at least ${requiredTokens} GRID tokens to vote.`);
      }
    } catch (error) {
      setIsEligible(false);
      setIneligibilityReason('Failed to verify token balance');
    } finally {
      setLoadingBalance(false);
    }
  };

  // WO-150: Format token amount with proper decimals
  const formatTokenAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate time remaining display
  const timeRemainingDisplay = timeRemaining
    ? {
        days: Math.floor(timeRemaining / (1000 * 60 * 60 * 24)),
        hours: Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      }
    : null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Cast Your Vote</h3>

      {/* WO-150: Token balance display */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Your GRID Token Balance</span>
          {loadingBalance ? (
            <div className="animate-pulse bg-gray-300 h-6 w-24 rounded"></div>
          ) : (
            <span className="text-2xl font-bold text-blue-600">
              {tokenBalance !== null ? formatTokenAmount(tokenBalance) : '---'} GRID
            </span>
          )}
        </div>

        {/* WO-150: Eligibility status */}
        {!loadingBalance && (
          <div className="mt-3">
            {isEligible ? (
              <div className="flex items-center text-green-700">
                <span className="text-xl mr-2">✓</span>
                <span className="text-sm font-medium">Eligible to vote</span>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
                <div className="flex items-center text-red-700 mb-1">
                  <span className="text-xl mr-2">✗</span>
                  <span className="text-sm font-semibold">Not eligible to vote</span>
                </div>
                {/* WO-150: Specific ineligibility reason */}
                <p className="text-sm text-red-600 ml-7">{ineligibilityReason}</p>
                <a
                  href="/governance/tokens"
                  className="text-sm text-red-700 underline ml-7 mt-1 inline-block"
                >
                  Get GRID tokens →
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Voting deadline */}
      {timeRemainingDisplay && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-yellow-800">
            Voting ends in {timeRemainingDisplay.days}d {timeRemainingDisplay.hours}h
          </p>
        </div>
      )}

      {/* Voting buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onVote(true)}
          disabled={!isEligible || voting || loadingBalance}
          className="px-6 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {voting ? 'Voting...' : 'Vote FOR'}
        </button>
        
        <button
          onClick={() => onVote(false)}
          disabled={!isEligible || voting || loadingBalance}
          className="px-6 py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {voting ? 'Voting...' : 'Vote AGAINST'}
        </button>
      </div>

      {!isEligible && !loadingBalance && (
        <p className="text-sm text-gray-500 text-center mt-4">
          Voting is disabled because you don't meet the eligibility requirements
        </p>
      )}
    </div>
  );
}



