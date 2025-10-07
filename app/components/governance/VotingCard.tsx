import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import {
  Vote,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../lib/logging/logger';
import { VoteOption, VoterInfo } from '../../types/governance';

interface VotingCardProps {
  proposalId: string;
  voterInfo: VoterInfo | null;
  canVote: boolean;
  onVoteCast: () => void;
}

export const VotingCard: React.FC<VotingCardProps> = ({
  proposalId,
  voterInfo,
  canVote,
  onVoteCast,
}) => {
  const { walletAddress } = useAuth();
  const [selectedOption, setSelectedOption] = useState<VoteOption | null>(null);
  const [reason, setReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async () => {
    if (!selectedOption || !walletAddress) return;

    try {
      setVoting(true);
      setError(null);

      const response = await fetch('/api/governance/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress.toString(),
        },
        body: JSON.stringify({
          proposalId,
          option: selectedOption,
          reason: reason.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cast vote');
      }

      logger.info('Vote cast successfully', {
        proposalId,
        option: selectedOption,
      });
      onVoteCast();

      // Reset form
      setSelectedOption(null);
      setReason('');
      setShowReasonInput(false);
    } catch (err) {
      logger.error('Failed to cast vote', {
        error: (err as Error).message,
        proposalId,
        option: selectedOption,
      });
      setError((err as Error).message);
    } finally {
      setVoting(false);
    }
  };

  const getVoteButtonStyle = (option: VoteOption) => {
    if (selectedOption === option) {
      switch (option) {
        case VoteOption.YES:
          return 'bg-green-600 hover:bg-green-700 text-white';
        case VoteOption.NO:
          return 'bg-red-600 hover:bg-red-700 text-white';
        case VoteOption.ABSTAIN:
          return 'bg-gray-600 hover:bg-gray-700 text-white';
        default:
          return '';
      }
    }
    return 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300';
  };

  const getVoteIcon = (option: VoteOption) => {
    switch (option) {
      case VoteOption.YES:
        return <CheckCircle className='w-4 h-4' />;
      case VoteOption.NO:
        return <XCircle className='w-4 h-4' />;
      case VoteOption.ABSTAIN:
        return <AlertTriangle className='w-4 h-4' />;
      default:
        return null;
    }
  };

  // Already voted
  if (voterInfo?.hasVoted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Vote className='w-5 h-5' />
            Vote Submitted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center space-y-3'>
            <Badge
              className={`text-lg px-4 py-2 ${
                voterInfo.voteOption === VoteOption.YES
                  ? 'bg-green-100 text-green-800'
                  : voterInfo.voteOption === VoteOption.NO
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
              }`}
            >
              {getVoteIcon(voterInfo.voteOption!)}
              <span className='ml-2 font-medium'>
                {voterInfo.voteOption?.toUpperCase()}
              </span>
            </Badge>
            <p className='text-sm text-gray-600'>
              Voted on{' '}
              {new Date(voterInfo.lastVoteTime!).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Cannot vote
  if (!canVote) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Vote className='w-5 h-5' />
            Voting Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-gray-600 text-center'>
            {!walletAddress
              ? 'Please connect your wallet to vote'
              : 'Voting is not currently available for this proposal'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Vote className='w-5 h-5' />
          Cast Your Vote
        </CardTitle>
        <CardDescription>
          Your voting power: {voterInfo?.votingPower.toLocaleString() || 0}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {error && (
          <div className='bg-red-50 border border-red-200 rounded-md p-3'>
            <p className='text-red-800 text-sm'>{error}</p>
          </div>
        )}

        {/* Vote Options */}
        <div className='grid grid-cols-1 gap-3'>
          <button
            onClick={() => setSelectedOption(VoteOption.YES)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedOption === VoteOption.YES
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <div className='flex items-center gap-3'>
              <CheckCircle
                className={`w-6 h-6 ${
                  selectedOption === VoteOption.YES
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}
              />
              <div className='text-left'>
                <h3 className='font-medium text-green-700'>Yes</h3>
                <p className='text-sm text-gray-600'>Approve this proposal</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedOption(VoteOption.NO)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedOption === VoteOption.NO
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-red-300'
            }`}
          >
            <div className='flex items-center gap-3'>
              <XCircle
                className={`w-6 h-6 ${
                  selectedOption === VoteOption.NO
                    ? 'text-red-600'
                    : 'text-gray-400'
                }`}
              />
              <div className='text-left'>
                <h3 className='font-medium text-red-700'>No</h3>
                <p className='text-sm text-gray-600'>Reject this proposal</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedOption(VoteOption.ABSTAIN)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedOption === VoteOption.ABSTAIN
                ? 'border-gray-500 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className='flex items-center gap-3'>
              <AlertTriangle
                className={`w-6 h-6 ${
                  selectedOption === VoteOption.ABSTAIN
                    ? 'text-gray-600'
                    : 'text-gray-400'
                }`}
              />
              <div className='text-left'>
                <h3 className='font-medium text-gray-700'>Abstain</h3>
                <p className='text-sm text-gray-600'>
                  Neither approve nor reject
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Reason Input */}
        {selectedOption && (
          <div className='space-y-2'>
            <button
              onClick={() => setShowReasonInput(!showReasonInput)}
              className='text-sm text-blue-600 hover:text-blue-800'
            >
              {showReasonInput ? 'Hide' : 'Add'} optional reason
            </button>

            {showReasonInput && (
              <Textarea
                value={reason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setReason(e.target.value)
                }
                placeholder='Explain your vote (optional)'
                rows={3}
                className='resize-none'
              />
            )}
          </div>
        )}

        {/* Submit Button */}
        {selectedOption && (
          <Button onClick={handleVote} disabled={voting} className='w-full'>
            {voting && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
            Submit Vote
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
