import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import {
  ArrowLeft,
  Vote,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  User,
  Calendar,
  DollarSign,
  Target,
  Settings,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../lib/logging/logger';
import {
  Proposal,
  ProposalStatus,
  ProposalType,
  VoterInfo,
  VoteOption,
} from '../../types/governance';
import { VotingCard } from './VotingCard';

interface ProposalDetailProps {
  proposalId: string;
  onBack?: () => void;
}

export const ProposalDetail: React.FC<ProposalDetailProps> = ({
  proposalId,
  onBack,
}) => {
  const { user, walletAddress } = useAuth();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [voterInfo, setVoterInfo] = useState<VoterInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    loadProposalData();
  }, [proposalId, walletAddress]);

  const loadProposalData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load proposal details
      const proposalResponse = await fetch(`/api/governance/proposals/${proposalId}`);
      if (!proposalResponse.ok) {
        throw new Error('Failed to load proposal');
      }
      const proposalData = await proposalResponse.json();
      setProposal(proposalData.data);

      // Load voter info if user is connected
      if (walletAddress) {
        const voterResponse = await fetch(
          `/api/governance/votes?proposalId=${proposalId}&walletAddress=${walletAddress}`
        );
        if (voterResponse.ok) {
          const voterData = await voterResponse.json();
          setVoterInfo(voterData.data);
        }
      }

    } catch (err) {
      logger.error('Failed to load proposal data', { error: (err as Error).message, proposalId });
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (option: VoteOption, reason?: string) => {
    if (!walletAddress || !proposal) return;

    try {
      setVoting(true);

      const response = await fetch('/api/governance/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress.toString(),
        },
        body: JSON.stringify({
          proposalId,
          option,
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cast vote');
      }

      // Refresh proposal data
      await loadProposalData();

      logger.info('Vote cast successfully', { proposalId, option });

    } catch (err) {
      logger.error('Failed to cast vote', { error: (err as Error).message, proposalId, option });
      setError((err as Error).message);
    } finally {
      setVoting(false);
    }
  };

  const getStatusColor = (status: ProposalStatus) => {
    switch (status) {
      case ProposalStatus.ACTIVE:
        return 'bg-blue-500';
      case ProposalStatus.SUCCEEDED:
        return 'bg-green-500';
      case ProposalStatus.DEFEATED:
        return 'bg-red-500';
      case ProposalStatus.CANCELLED:
        return 'bg-gray-500';
      case ProposalStatus.EXECUTED:
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: ProposalStatus) => {
    switch (status) {
      case ProposalStatus.SUCCEEDED:
        return <CheckCircle className="w-5 h-5" />;
      case ProposalStatus.DEFEATED:
        return <XCircle className="w-5 h-5" />;
      case ProposalStatus.ACTIVE:
        return <Clock className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getTypeIcon = (type: ProposalType) => {
    switch (type) {
      case ProposalType.PROJECT_FUNDING:
        return <DollarSign className="w-5 h-5" />;
      case ProposalType.MILESTONE_APPROVAL:
        return <Target className="w-5 h-5" />;
      case ProposalType.PARAMETER_CHANGE:
        return <Settings className="w-5 h-5" />;
      case ProposalType.TREASURY_ALLOCATION:
        return <DollarSign className="w-5 h-5" />;
      case ProposalType.EMERGENCY_ACTION:
        return <Zap className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: ProposalType) => {
    switch (type) {
      case ProposalType.PROJECT_FUNDING:
        return 'Project Funding';
      case ProposalType.MILESTONE_APPROVAL:
        return 'Milestone Approval';
      case ProposalType.PARAMETER_CHANGE:
        return 'Parameter Change';
      case ProposalType.TREASURY_ALLOCATION:
        return 'Treasury Allocation';
      case ProposalType.EMERGENCY_ACTION:
        return 'Emergency Action';
      default:
        return type;
    }
  };

  const formatTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getVotePercentage = (votes: number, total: number) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="space-y-4">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Governance
          </Button>
        )}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Proposal not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const canVote = proposal.status === ProposalStatus.ACTIVE &&
                   walletAddress &&
                   !voterInfo?.hasVoted &&
                   new Date() < proposal.endTime;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        )}
        <div className="flex items-center gap-3">
          {getTypeIcon(proposal.type)}
          <div>
            <h1 className="text-2xl font-bold">{proposal.title}</h1>
            <p className="text-gray-600">Proposal #{proposal.id.slice(-8)}</p>
          </div>
        </div>
      </div>

      {/* Status and Type */}
      <div className="flex items-center gap-2">
        <Badge className={getStatusColor(proposal.status)}>
          {getStatusIcon(proposal.status)}
          <span className="ml-1">{proposal.status}</span>
        </Badge>
        <Badge variant="outline">
          {getTypeIcon(proposal.type)}
          <span className="ml-1">{getTypeLabel(proposal.type)}</span>
        </Badge>
        {proposal.tags.map((tag, index) => (
          <Badge key={index} variant="secondary">{tag}</Badge>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proposal Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{proposal.description}</p>
              {proposal.discussionUrl && (
                <div className="mt-4">
                  <a
                    href={proposal.discussionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Discussion Link
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Type-specific Details */}
          {renderTypeSpecificDetails(proposal)}

          {/* Voting Results */}
          <Card>
            <CardHeader>
              <CardTitle>Voting Results</CardTitle>
              <CardDescription>
                Total voting power: {proposal.totalVotingPower.toLocaleString()}
                {proposal.quorumReached && (
                  <span className="text-green-600 ml-2">✓ Quorum reached</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Yes Votes */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Yes ({getVotePercentage(proposal.votes.yes, proposal.totalVotingPower)}%)
                  </span>
                  <span>{proposal.votes.yes.toLocaleString()}</span>
                </div>
                <Progress
                  value={getVotePercentage(proposal.votes.yes, proposal.totalVotingPower)}
                  className="h-2"
                />
              </div>

              {/* No Votes */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    No ({getVotePercentage(proposal.votes.no, proposal.totalVotingPower)}%)
                  </span>
                  <span>{proposal.votes.no.toLocaleString()}</span>
                </div>
                <Progress
                  value={getVotePercentage(proposal.votes.no, proposal.totalVotingPower)}
                  className="h-2"
                />
              </div>

              {/* Abstain Votes */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-gray-600" />
                    Abstain ({getVotePercentage(proposal.votes.abstain, proposal.totalVotingPower)}%)
                  </span>
                  <span>{proposal.votes.abstain.toLocaleString()}</span>
                </div>
                <Progress
                  value={getVotePercentage(proposal.votes.abstain, proposal.totalVotingPower)}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium">{formatDate(proposal.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Voting Starts</p>
                <p className="font-medium">{formatDate(proposal.startTime)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Voting Ends</p>
                <p className="font-medium">{formatDate(proposal.endTime)}</p>
              </div>
              {proposal.status === ProposalStatus.ACTIVE && (
                <div>
                  <p className="text-sm text-gray-600">Time Remaining</p>
                  <p className="font-medium text-blue-600">{formatTimeRemaining(proposal.endTime)}</p>
                </div>
              )}
              {proposal.executedAt && (
                <div>
                  <p className="text-sm text-gray-600">Executed</p>
                  <p className="font-medium">{formatDate(proposal.executedAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Proposer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Proposer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-sm">
                {proposal.proposerAddress.slice(0, 4)}...{proposal.proposerAddress.slice(-4)}
              </p>
            </CardContent>
          </Card>

          {/* Your Voting Power */}
          {voterInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Your Voting Power</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Voting Power:</span>
                  <span className="font-medium">{voterInfo.votingPower.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Reputation:</span>
                  <span className="font-medium">{voterInfo.reputation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Token Balance:</span>
                  <span className="font-medium">{voterInfo.tokenBalance.toLocaleString()}</span>
                </div>
                {voterInfo.hasVoted && (
                  <div className="flex justify-between">
                    <span className="text-sm">Your Vote:</span>
                    <Badge variant={voterInfo.voteOption === 'yes' ? 'default' : 'secondary'}>
                      {voterInfo.voteOption}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Voting Interface */}
          <VotingCard
            proposalId={proposalId}
            voterInfo={voterInfo}
            canVote={canVote || false}
            onVoteCast={loadProposalData}
          />
        </div>
      </div>
    </div>
  );
};

// Helper function to render type-specific details
function renderTypeSpecificDetails(proposal: Proposal) {
  switch (proposal.type) {
    case ProposalType.PROJECT_FUNDING:
      return (
        <Card>
          <CardHeader>
            <CardTitle>Funding Request</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Project ID:</span>
                <span className="font-mono">{proposal.projectId}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Requested:</span>
                <span className="font-medium">{proposal.fundingAmount} SOL</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case ProposalType.MILESTONE_APPROVAL:
      return (
        <Card>
          <CardHeader>
            <CardTitle>Milestone Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Project ID:</span>
                <span className="font-mono">{proposal.projectId}</span>
              </div>
              <div className="flex justify-between">
                <span>Milestone ID:</span>
                <span className="font-mono">{proposal.milestoneId}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case ProposalType.PARAMETER_CHANGE:
      return (
        <Card>
          <CardHeader>
            <CardTitle>Parameter Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Target Contract:</span>
                <span className="font-mono text-sm">{proposal.targetContract?.toString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Target Function:</span>
                <span className="font-mono">{proposal.targetFunction}</span>
              </div>
              {proposal.parameters && proposal.parameters.length > 0 && (
                <div>
                  <span className="block mb-1">Parameters:</span>
                  <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                    {JSON.stringify(proposal.parameters, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );

    case ProposalType.TREASURY_ALLOCATION:
      return (
        <Card>
          <CardHeader>
            <CardTitle>Treasury Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-medium">{proposal.fundingAmount} SOL</span>
            </div>
          </CardContent>
        </Card>
      );

    case ProposalType.EMERGENCY_ACTION:
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Emergency Action</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This is an emergency proposal that requires immediate attention and has shorter voting periods.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );

    default:
      return null;
  }
}