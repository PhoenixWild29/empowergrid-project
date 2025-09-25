import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Plus,
  Vote,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../lib/logging/logger';
import {
  Proposal,
  ProposalStatus,
  ProposalType,
  GovernanceStats,
  VoterInfo,
} from '../../types/governance';

interface GovernanceDashboardProps {
  onCreateProposal?: () => void;
  onViewProposal?: (proposalId: string) => void;
}

export const GovernanceDashboard: React.FC<GovernanceDashboardProps> = ({
  onCreateProposal,
  onViewProposal,
}) => {
  const { user, walletAddress } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<GovernanceStats | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [voterInfo, setVoterInfo] = useState<VoterInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGovernanceData();
  }, [walletAddress]);

  const loadGovernanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load governance stats
      const statsResponse = await fetch('/api/governance/proposals/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Load active proposals
      const proposalsResponse = await fetch('/api/governance/proposals/list?status=active&limit=10');
      if (proposalsResponse.ok) {
        const proposalsData = await proposalsResponse.json();
        setProposals(proposalsData.data);
      }

      // Load voter info for the first active proposal if available
      if (walletAddress && proposals.length > 0) {
        const voterResponse = await fetch(
          `/api/governance/votes?proposalId=${proposals[0].id}&walletAddress=${walletAddress}`
        );
        if (voterResponse.ok) {
          const voterData = await voterResponse.json();
          setVoterInfo(voterData.data);
        }
      }

    } catch (err) {
      logger.error('Failed to load governance data', { error: (err as Error).message });
      setError('Failed to load governance data');
    } finally {
      setLoading(false);
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
        return <CheckCircle className="w-4 h-4" />;
      case ProposalStatus.DEFEATED:
        return <XCircle className="w-4 h-4" />;
      case ProposalStatus.ACTIVE:
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
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

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Governance</h1>
          <p className="text-gray-600">Participate in decentralized decision making</p>
        </div>
        <Button onClick={onCreateProposal} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Proposal
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProposals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProposals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              <Vote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVotes.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participation</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.averageParticipation * 100)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Voter Info */}
      {voterInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Your Voting Power
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Voting Power</p>
                <p className="text-lg font-semibold">{voterInfo.votingPower.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reputation</p>
                <p className="text-lg font-semibold">{voterInfo.reputation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Token Balance</p>
                <p className="text-lg font-semibold">{voterInfo.tokenBalance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Has Voted</p>
                <p className="text-lg font-semibold">{voterInfo.hasVoted ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Proposals</CardTitle>
          <CardDescription>Latest governance proposals and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {proposals.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No proposals found</p>
            ) : (
              proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/governance/proposals/${proposal.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{getTypeLabel(proposal.type)}</Badge>
                        <Badge className={getStatusColor(proposal.status)}>
                          {getStatusIcon(proposal.status)}
                          <span className="ml-1">{proposal.status}</span>
                        </Badge>
                      </div>

                      <h3 className="font-semibold text-lg mb-1">{proposal.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{proposal.description}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>By {proposal.proposerAddress.slice(0, 4)}...{proposal.proposerAddress.slice(-4)}</span>
                        {proposal.status === ProposalStatus.ACTIVE && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeRemaining(proposal.endTime)}
                          </span>
                        )}
                      </div>
                    </div>

                    {proposal.status === ProposalStatus.ACTIVE && (
                      <div className="ml-4 text-right">
                        <div className="text-sm text-gray-600 mb-1">Voting Progress</div>
                        <div className="text-lg font-semibold">
                          {proposal.totalVotingPower} / {Math.max(proposal.totalVotingPower, 1000)} votes
                        </div>
                        <Progress
                          value={(proposal.totalVotingPower / Math.max(proposal.totalVotingPower, 1000)) * 100}
                          className="w-24 mt-1"
                        />
                      </div>
                    )}
                  </div>

                  {proposal.status === ProposalStatus.ACTIVE && (
                    <div className="mt-3 flex gap-2">
                      <div className="flex-1 bg-green-50 rounded p-2">
                        <div className="text-sm text-green-700">Yes: {proposal.votes.yes}</div>
                      </div>
                      <div className="flex-1 bg-red-50 rounded p-2">
                        <div className="text-sm text-red-700">No: {proposal.votes.no}</div>
                      </div>
                      <div className="flex-1 bg-gray-50 rounded p-2">
                        <div className="text-sm text-gray-700">Abstain: {proposal.votes.abstain}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};