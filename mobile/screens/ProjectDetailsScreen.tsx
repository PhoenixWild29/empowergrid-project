import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Share,
} from 'react-native';
import { Card, Title, Paragraph, Button, Chip, Avatar, ProgressBar, Divider } from 'react-native-paper';
import { useWalletContext } from '../contexts/WalletContext';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

interface ProjectDetails {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  creator: string;
  creatorName?: string;
  fundingGoal: number;
  currentFunding: number;
  status: 'active' | 'funded' | 'completed';
  category: string;
  location?: string;
  createdAt: string;
  endDate?: string;
  images: string[];
  milestones: Milestone[];
  team: TeamMember[];
  metrics: ProjectMetrics;
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: number;
  contractAddress?: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  completed: boolean;
  completedAt?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  linkedin?: string;
}

interface ProjectMetrics {
  energyGenerated: number;
  co2Reduced: number;
  householdsPowered: number;
  timeline: number;
  roi: number;
}

interface RouteProps {
  route: {
    params: {
      projectId: string;
    };
  };
  navigation: any;
}

const ProjectDetailsScreen: React.FC<RouteProps> = ({ route, navigation }) => {
  const { projectId } = route.params;
  const { connected, publicKey } = useWalletContext();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);

  const quickAmounts = [10, 50, 100, 500, 1000];

  useEffect(() => {
    loadProjectDetails();
  }, [projectId]);

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.data);
      } else {
        Alert.alert('Error', 'Failed to load project details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      Alert.alert('Error', 'Failed to load project details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleFundProject = async () => {
    if (!connected || !publicKey) {
      Alert.alert('Wallet Required', 'Please connect your wallet to fund this project.');
      return;
    }

    if (selectedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please select or enter a funding amount.');
      return;
    }

    try {
      setFunding(true);
      const response = await fetch(`http://localhost:3000/api/projects/${projectId}/fund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: selectedAmount,
          funder: publicKey.toString(),
        }),
      });

      if (response.ok) {
        Alert.alert('Success!', `Successfully funded $${selectedAmount} to ${project?.title}`);
        loadProjectDetails(); // Refresh project data
        setSelectedAmount(0);
      } else {
        const error = await response.json();
        Alert.alert('Funding Failed', error.message || 'Failed to fund project');
      }
    } catch (error) {
      console.error('Funding error:', error);
      Alert.alert('Error', 'Failed to process funding. Please try again.');
    } finally {
      setFunding(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing sustainable energy project: ${project?.title}\n\n${project?.description}\n\nFunded: $${project?.currentFunding} / $${project?.fundingGoal}`,
        url: `empowergrid://project/${projectId}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getFundingProgress = () => {
    if (!project) return 0;
    return Math.min((project.currentFunding / project.fundingGoal) * 100, 100);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#28a745';
      case 'medium': return '#ffc107';
      case 'high': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const renderMilestones = () => (
    <Card style={styles.sectionCard}>
      <Card.Title title="Project Milestones" />
      <Card.Content>
        {project?.milestones.map((milestone, index) => (
          <View key={milestone.id} style={styles.milestoneItem}>
            <View style={styles.milestoneHeader}>
              <View style={styles.milestoneIndicator}>
                {milestone.completed ? (
                  <Ionicons name="checkmark-circle" size={20} color="#28a745" />
                ) : (
                  <View style={styles.milestoneDot} />
                )}
              </View>
              <View style={styles.milestoneContent}>
                <Text style={[styles.milestoneTitle, milestone.completed && styles.completedText]}>
                  {milestone.title}
                </Text>
                <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                <Text style={styles.milestoneAmount}>
                  Target: {formatCurrency(milestone.targetAmount)}
                </Text>
              </View>
            </View>
            {index < (project?.milestones.length || 0) - 1 && (
              <View style={styles.milestoneConnector} />
            )}
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  const renderTeam = () => (
    <Card style={styles.sectionCard}>
      <Card.Title title="Project Team" />
      <Card.Content>
        {project?.team.map((member) => (
          <View key={member.id} style={styles.teamMember}>
            <Avatar.Image size={50} source={member.avatar ? { uri: member.avatar } : undefined} />
            <View style={styles.teamMemberInfo}>
              <Text style={styles.teamMemberName}>{member.name}</Text>
              <Text style={styles.teamMemberRole}>{member.role}</Text>
            </View>
            {member.linkedin && (
              <TouchableOpacity
                onPress={() => {/* Open LinkedIn */}}
                style={styles.linkedinButton}
              >
                <Ionicons name="logo-linkedin" size={20} color="#0077b5" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  const renderMetrics = () => (
    <Card style={styles.sectionCard}>
      <Card.Title title="Project Impact & Metrics" />
      <Card.Content>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Ionicons name="flash" size={24} color="#00AEEF" />
            <Text style={styles.metricValue}>{project?.metrics.energyGenerated} MWh</Text>
            <Text style={styles.metricLabel}>Energy Generated</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="leaf" size={24} color="#28a745" />
            <Text style={styles.metricValue}>{project?.metrics.co2Reduced} tons</Text>
            <Text style={styles.metricLabel}>CO₂ Reduced</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="home" size={24} color="#ffc107" />
            <Text style={styles.metricValue}>{project?.metrics.householdsPowered}</Text>
            <Text style={styles.metricLabel}>Households Powered</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="trending-up" size={24} color="#dc3545" />
            <Text style={styles.metricValue}>{project?.metrics.roi}%</Text>
            <Text style={styles.metricLabel}>Expected ROI</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading project details...</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.errorContainer}>
        <Text>Project not found</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Project Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerTop}>
            <View style={styles.headerInfo}>
              <Chip style={[styles.categoryChip, { backgroundColor: '#e3f2fd' }]}>
                {project.category}
              </Chip>
              <Chip
                style={[styles.statusChip, { backgroundColor: getRiskColor(project.riskLevel) }]}
                textStyle={{ color: 'white' }}
              >
                {project.riskLevel.toUpperCase()} RISK
              </Chip>
            </View>
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Ionicons name="share-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Title style={styles.projectTitle}>{project.title}</Title>
          <Paragraph style={styles.projectDescription}>{project.description}</Paragraph>

          <View style={styles.creatorInfo}>
            <Text style={styles.creatorLabel}>by {project.creatorName || project.creator}</Text>
            {project.location && (
              <Text style={styles.locationText}>
                <Ionicons name="location" size={14} color="#666" /> {project.location}
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Funding Progress */}
      <Card style={styles.fundingCard}>
        <Card.Content>
          <View style={styles.fundingHeader}>
            <Text style={styles.fundingTitle}>Funding Progress</Text>
            <Text style={styles.fundingPercent}>{getFundingProgress().toFixed(1)}% funded</Text>
          </View>

          <ProgressBar progress={getFundingProgress() / 100} color="#00AEEF" style={styles.progressBar} />

          <View style={styles.fundingStats}>
            <Text style={styles.fundingAmount}>
              {formatCurrency(project.currentFunding)} raised of {formatCurrency(project.fundingGoal)}
            </Text>
            <Text style={styles.timeLeft}>
              {project.endDate ? `${Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left` : 'Ongoing'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Funding Section */}
      {project.status === 'active' && (
        <Card style={styles.fundingSection}>
          <Card.Title title="Support This Project" />
          <Card.Content>
            <Text style={styles.fundingSubtitle}>Choose an amount to fund:</Text>

            <View style={styles.quickAmounts}>
              {quickAmounts.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.amountButton,
                    selectedAmount === amount && styles.amountButtonSelected
                  ]}
                  onPress={() => setSelectedAmount(amount)}
                >
                  <Text style={[
                    styles.amountButtonText,
                    selectedAmount === amount && styles.amountButtonTextSelected
                  ]}>
                    ${amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              mode="contained"
              onPress={handleFundProject}
              loading={funding}
              disabled={!connected || selectedAmount <= 0}
              style={styles.fundButton}
            >
              {funding ? 'Processing...' : `Fund $${selectedAmount || 0}`}
            </Button>

            {!connected && (
              <Text style={styles.connectWalletText}>
                Connect your wallet to fund this project
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Detailed Description */}
      <Card style={styles.sectionCard}>
        <Card.Title title="About This Project" />
        <Card.Content>
          <Paragraph style={styles.detailedDescription}>
            {project.detailedDescription}
          </Paragraph>
        </Card.Content>
      </Card>

      {/* Metrics */}
      {renderMetrics()}

      {/* Milestones */}
      {renderMilestones()}

      {/* Team */}
      {renderTeam()}

      {/* Contract Info */}
      {project.contractAddress && (
        <Card style={styles.sectionCard}>
          <Card.Title title="Smart Contract" />
          <Card.Content>
            <Text style={styles.contractLabel}>Contract Address:</Text>
            <Text style={styles.contractAddress}>{project.contractAddress}</Text>
            <TouchableOpacity style={styles.viewContractButton}>
              <Text style={styles.viewContractText}>View on Solana Explorer</Text>
              <Ionicons name="open-outline" size={16} color="#00AEEF" />
            </TouchableOpacity>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  headerCard: {
    margin: 15,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    height: 24,
  },
  statusChip: {
    height: 24,
  },
  shareButton: {
    padding: 5,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  projectDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  creatorInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorLabel: {
    fontSize: 14,
    color: '#666',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  fundingCard: {
    margin: 15,
    marginTop: 0,
    elevation: 2,
  },
  fundingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  fundingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  fundingPercent: {
    fontSize: 16,
    color: '#00AEEF',
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    marginBottom: 10,
  },
  fundingStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fundingAmount: {
    fontSize: 14,
    color: '#666',
  },
  timeLeft: {
    fontSize: 14,
    color: '#666',
  },
  fundingSection: {
    margin: 15,
    marginTop: 0,
    elevation: 2,
  },
  fundingSubtitle: {
    fontSize: 16,
    marginBottom: 15,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  amountButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    margin: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  amountButtonSelected: {
    backgroundColor: '#00AEEF',
    borderColor: '#00AEEF',
  },
  amountButtonText: {
    fontSize: 16,
    color: '#666',
  },
  amountButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  fundButton: {
    marginTop: 10,
    backgroundColor: '#00AEEF',
  },
  connectWalletText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
  },
  sectionCard: {
    margin: 15,
    marginTop: 0,
    elevation: 2,
  },
  detailedDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 15,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00AEEF',
    marginTop: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  milestoneItem: {
    marginBottom: 20,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  milestoneIndicator: {
    marginRight: 15,
    marginTop: 2,
  },
  milestoneDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  milestoneAmount: {
    fontSize: 12,
    color: '#00AEEF',
    fontWeight: 'bold',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  milestoneConnector: {
    position: 'absolute',
    left: 5.5,
    top: 20,
    bottom: -20,
    width: 2,
    backgroundColor: '#e0e0e0',
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  teamMemberInfo: {
    flex: 1,
    marginLeft: 15,
  },
  teamMemberName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  teamMemberRole: {
    fontSize: 14,
    color: '#666',
  },
  linkedinButton: {
    padding: 10,
  },
  contractLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  contractAddress: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  viewContractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  viewContractText: {
    fontSize: 14,
    color: '#00AEEF',
    marginRight: 5,
  },
});

export default ProjectDetailsScreen;