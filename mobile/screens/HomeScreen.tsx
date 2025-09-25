import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Card, Title, Paragraph, Button, Chip, Avatar } from 'react-native-paper';
import { useWalletContext } from '../contexts/WalletContext';
import { Ionicons } from '@expo/vector-icons';

interface Project {
  id: string;
  title: string;
  description: string;
  creator: string;
  fundingGoal: number;
  currentFunding: number;
  status: 'active' | 'funded' | 'completed';
  category: string;
  image?: string;
}

interface Stats {
  totalProjects: number;
  totalFunding: number;
  activeUsers: number;
  energyGenerated: number;
}

const HomeScreen: React.FC = () => {
  const { connected, publicKey } = useWalletContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load featured projects
      const projectsResponse = await fetch('http://localhost:3000/api/projects?featured=true&limit=5');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.data || []);
      }

      // Load platform stats
      const statsResponse = await fetch('http://localhost:3000/api/analytics/platform');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

    } catch (error) {
      console.error('Failed to load home data:', error);
      Alert.alert('Error', 'Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#00AEEF';
      case 'funded': return '#28a745';
      case 'completed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getFundingProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  if (!connected) {
    return (
      <View style={styles.container}>
        <View style={styles.welcomeContainer}>
          <Ionicons name="leaf" size={64} color="#00AEEF" />
          <Text style={styles.welcomeTitle}>Welcome to EmpowerGRID</Text>
          <Text style={styles.welcomeSubtitle}>
            Connect your wallet to explore sustainable energy projects and participate in decentralized governance.
          </Text>
          <Button
            mode="contained"
            onPress={() => {/* Wallet connection handled by context */}}
            style={styles.connectButton}
          >
            Connect Wallet
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello Explorer!</Text>
        <Text style={styles.subtitle}>Discover and fund sustainable energy projects</Text>
      </View>

      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Title style={styles.statNumber}>{stats.totalProjects}</Title>
              <Paragraph style={styles.statLabel}>Total Projects</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Title style={styles.statNumber}>{formatCurrency(stats.totalFunding)}</Title>
              <Paragraph style={styles.statLabel}>Total Funding</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Title style={styles.statNumber}>{stats.activeUsers}</Title>
              <Paragraph style={styles.statLabel}>Active Users</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Title style={styles.statNumber}>{stats.energyGenerated}MWh</Title>
              <Paragraph style={styles.statLabel}>Energy Generated</Paragraph>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Featured Projects */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Projects</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {projects.map((project) => (
          <Card key={project.id} style={styles.projectCard}>
            <Card.Content>
              <View style={styles.projectHeader}>
                <View style={styles.projectInfo}>
                  <Title style={styles.projectTitle}>{project.title}</Title>
                  <View style={styles.projectMeta}>
                    <Chip style={styles.categoryChip}>{project.category}</Chip>
                    <Chip
                      style={[styles.statusChip, { backgroundColor: getStatusColor(project.status) }]}
                      textStyle={{ color: 'white' }}
                    >
                      {project.status.toUpperCase()}
                    </Chip>
                  </View>
                </View>
                <Avatar.Image
                  size={50}
                  source={{ uri: project.image || 'https://via.placeholder.com/50' }}
                />
              </View>

              <Paragraph style={styles.projectDescription} numberOfLines={2}>
                {project.description}
              </Paragraph>

              <View style={styles.fundingContainer}>
                <View style={styles.fundingProgress}>
                  <View
                    style={[
                      styles.fundingBar,
                      { width: `${getFundingProgress(project.currentFunding, project.fundingGoal)}%` }
                    ]}
                  />
                </View>
                <View style={styles.fundingText}>
                  <Text style={styles.fundingAmount}>
                    {formatCurrency(project.currentFunding)} / {formatCurrency(project.fundingGoal)}
                  </Text>
                  <Text style={styles.fundingPercent}>
                    {getFundingProgress(project.currentFunding, project.fundingGoal).toFixed(1)}% funded
                  </Text>
                </View>
              </View>

              <View style={styles.projectFooter}>
                <Text style={styles.creatorText}>by {project.creator}</Text>
                <Button mode="outlined" compact>
                  View Details
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))}

        {projects.length === 0 && !loading && (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Ionicons name="bulb-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No featured projects available</Text>
              <Text style={styles.emptySubtext}>Check back later for new sustainable energy projects</Text>
            </Card.Content>
          </Card>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-circle" size={24} color="#00AEEF" />
            <Text style={styles.actionText}>Create Project</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="people" size={24} color="#00AEEF" />
            <Text style={styles.actionText}>Join Governance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="analytics" size={24} color="#00AEEF" />
            <Text style={styles.actionText}>View Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  connectButton: {
    marginTop: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#00AEEF',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00AEEF',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#00AEEF',
    fontSize: 16,
  },
  projectCard: {
    marginBottom: 15,
    elevation: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  projectInfo: {
    flex: 1,
    marginRight: 10,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  projectMeta: {
    flexDirection: 'row',
    gap: 5,
  },
  categoryChip: {
    backgroundColor: '#e3f2fd',
  },
  statusChip: {
    height: 24,
  },
  projectDescription: {
    color: '#666',
    marginBottom: 15,
  },
  fundingContainer: {
    marginBottom: 15,
  },
  fundingProgress: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 5,
  },
  fundingBar: {
    height: '100%',
    backgroundColor: '#00AEEF',
    borderRadius: 4,
  },
  fundingText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fundingAmount: {
    fontSize: 12,
    color: '#666',
  },
  fundingPercent: {
    fontSize: 12,
    color: '#00AEEF',
    fontWeight: 'bold',
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorText: {
    fontSize: 12,
    color: '#666',
  },
  emptyCard: {
    marginTop: 20,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
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
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 2,
    minWidth: 80,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default HomeScreen;