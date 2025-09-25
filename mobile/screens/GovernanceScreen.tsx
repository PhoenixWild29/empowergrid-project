import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Card, Title, Paragraph, Button, Chip, FAB } from 'react-native-paper';
import { useWalletContext } from '../contexts/WalletContext';
import { Ionicons } from '@expo/vector-icons';

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  type: 'funding' | 'parameter' | 'upgrade' | 'emergency';
  status: 'active' | 'passed' | 'rejected' | 'executed';
  votesFor: number;
  votesAgainst: number;
  quorum: number;
  endTime: string;
  createdAt: string;
  totalVotes: number;
}

const GovernanceScreen: React.FC = () => {
  const { connected, publicKey } = useWalletContext();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('active');

  const filters = ['active', 'passed', 'rejected', 'all'];

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/governance/proposals');
      if (response.ok) {
        const data = await response.json();
        setProposals(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load proposals:', error);
      Alert.alert('Error', 'Failed to load proposals. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProposals();
    setRefreshing(false);
  };

  const getFilteredProposals = () => {
    if (selectedFilter === 'all') return proposals;
    return proposals.filter(proposal => proposal.status === selectedFilter);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'funding': return '#28a745';
      case 'parameter': return '#007bff';
      case 'upgrade': return '#ffc107';
      case 'emergency': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#00AEEF';
      case 'passed': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'executed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getVotingProgress = (votesFor: number, votesAgainst: number) => {
    const total = votesFor + votesAgainst;
    if (total === 0) return 0;
    return (votesFor / total) * 100;
  };

  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const handleVote = async (proposalId: string, vote: 'for' | 'against') => {
    if (!connected || !publicKey) {
      Alert.alert('Wallet Required', 'Please connect your wallet to vote.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/governance/proposals/${proposalId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voter: publicKey.toString(),
          vote,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Your vote has been recorded!');
        loadProposals(); // Refresh proposals
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Failed to submit vote.');
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
    }
  };

  const renderProposal = ({ item }: { item: Proposal }) => (
    <Card style={styles.proposalCard}>
      <Card.Content>
        <View style={styles.proposalHeader}>
          <View style={styles.proposalInfo}>
            <Title style={styles.proposalTitle}>{item.title}</Title>
            <View style={styles.proposalMeta}>
              <Chip
                style={[styles.typeChip, { backgroundColor: getTypeColor(item.type) }]}
                textStyle={{ color: 'white', fontSize: 10 }}
              >
                {item.type.toUpperCase()}
              </Chip>
              <Chip
                style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
                textStyle={{ color: 'white', fontSize: 10 }}
              >
                {item.status.toUpperCase()}
              </Chip>
            </View>
          </View>
        </View>

        <Paragraph style={styles.proposalDescription} numberOfLines={3}>
          {item.description}
        </Paragraph>

        <View style={styles.votingContainer}>
          <View style={styles.votingProgress}>
            <View
              style={[
                styles.votingBar,
                { width: `${getVotingProgress(item.votesFor, item.votesAgainst)}%` }
              ]}
            />
          </View>
          <View style={styles.votingStats}>
            <Text style={styles.votingText}>
              For: {item.votesFor.toLocaleString()} | Against: {item.votesAgainst.toLocaleString()}
            </Text>
            <Text style={styles.votingPercent}>
              {getVotingProgress(item.votesFor, item.votesAgainst).toFixed(1)}% approval
            </Text>
          </View>
        </View>

        <View style={styles.proposalFooter}>
          <View style={styles.proposalDetails}>
            <Text style={styles.proposerText}>by {item.proposer}</Text>
            <Text style={styles.timeText}>
              <Ionicons name="time-outline" size={12} color="#666" /> {getTimeRemaining(item.endTime)}
            </Text>
            <Text style={styles.quorumText}>
              Quorum: {item.totalVotes}/{item.quorum}
            </Text>
          </View>

          {item.status === 'active' && connected && (
            <View style={styles.voteButtons}>
              <Button
                mode="contained"
                compact
                style={[styles.voteButton, styles.voteFor]}
                onPress={() => handleVote(item.id, 'for')}
              >
                For
              </Button>
              <Button
                mode="contained"
                compact
                style={[styles.voteButton, styles.voteAgainst]}
                onPress={() => handleVote(item.id, 'against')}
              >
                Against
              </Button>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === filter && styles.filterButtonTextActive
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Proposals List */}
      <FlatList
        data={getFilteredProposals()}
        keyExtractor={(item) => item.id}
        renderItem={renderProposal}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No proposals found</Text>
              <Text style={styles.emptySubtext}>
                {selectedFilter !== 'all'
                  ? `No ${selectedFilter} proposals at this time`
                  : 'Be the first to create a governance proposal!'
                }
              </Text>
            </View>
          ) : null
        }
      />

      {/* Create Proposal FAB */}
      {connected && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => {/* Navigate to create proposal */}}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#00AEEF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  proposalCard: {
    marginBottom: 15,
    elevation: 2,
  },
  proposalHeader: {
    marginBottom: 10,
  },
  proposalInfo: {
    flex: 1,
  },
  proposalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  proposalMeta: {
    flexDirection: 'row',
    gap: 5,
  },
  typeChip: {
    height: 20,
  },
  statusChip: {
    height: 20,
  },
  proposalDescription: {
    color: '#666',
    marginBottom: 15,
  },
  votingContainer: {
    marginBottom: 15,
  },
  votingProgress: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 5,
  },
  votingBar: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 4,
  },
  votingStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  votingText: {
    fontSize: 12,
    color: '#666',
  },
  votingPercent: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: 'bold',
  },
  proposalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  proposalDetails: {
    flex: 1,
  },
  proposerText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  quorumText: {
    fontSize: 12,
    color: '#666',
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  voteButton: {
    minWidth: 60,
  },
  voteFor: {
    backgroundColor: '#28a745',
  },
  voteAgainst: {
    backgroundColor: '#dc3545',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#00AEEF',
  },
});

export default GovernanceScreen;