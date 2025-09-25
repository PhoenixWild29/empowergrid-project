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
import { Card, Title, Paragraph, Button, Chip, Searchbar, FAB } from 'react-native-paper';
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
  location?: string;
  createdAt: string;
  image?: string;
}

interface RouteProps {
  navigation: any;
}

const ProjectsScreen: React.FC<RouteProps> = ({ navigation }) => {
  const { connected } = useWalletContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'solar', 'wind', 'hydro', 'biomass', 'geothermal'];

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery, selectedCategory]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/projects?limit=50');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      Alert.alert('Error', 'Failed to load projects. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.creator.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(project =>
        project.category.toLowerCase() === selectedCategory
      );
    }

    setFilteredProjects(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
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

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id })}
    >
      <Card.Content>
        <View style={styles.projectHeader}>
          <View style={styles.projectInfo}>
            <Title style={styles.projectTitle}>{item.title}</Title>
            <View style={styles.projectMeta}>
              <Chip style={styles.categoryChip}>{item.category}</Chip>
              <Chip
                style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
                textStyle={{ color: 'white' }}
              >
                {item.status.toUpperCase()}
              </Chip>
            </View>
          </View>
        </View>

        <Paragraph style={styles.projectDescription} numberOfLines={3}>
          {item.description}
        </Paragraph>

        <View style={styles.fundingContainer}>
          <View style={styles.fundingProgress}>
            <View
              style={[
                styles.fundingBar,
                { width: `${getFundingProgress(item.currentFunding, item.fundingGoal)}%` }
              ]}
            />
          </View>
          <View style={styles.fundingText}>
            <Text style={styles.fundingAmount}>
              {formatCurrency(item.currentFunding)} / {formatCurrency(item.fundingGoal)}
            </Text>
            <Text style={styles.fundingPercent}>
              {getFundingProgress(item.currentFunding, item.fundingGoal).toFixed(1)}% funded
            </Text>
          </View>
        </View>

        <View style={styles.projectFooter}>
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorText}>by {item.creator}</Text>
            {item.location && (
              <Text style={styles.locationText}>
                <Ionicons name="location" size={12} color="#666" /> {item.location}
              </Text>
            )}
          </View>
          <Button
            mode="outlined"
            compact
            onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id })}
          >
            View Details
          </Button>
        </View>
      </Card.Content>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search projects..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <View style={styles.categoryFilter}>
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  selectedCategory === item && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === item && styles.categoryButtonTextActive
                  ]}
                >
                  {item === 'all' ? 'All' : item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      </View>

      {/* Projects List */}
      <FlatList
        data={filteredProjects}
        keyExtractor={(item) => item.id}
        renderItem={renderProject}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bulb-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No projects found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to create a sustainable energy project!'
                }
              </Text>
            </View>
          ) : null
        }
      />

      {/* Create Project FAB */}
      {connected && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => {/* Navigate to create project */}}
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
  searchContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchbar: {
    marginBottom: 10,
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  categoryFilter: {
    marginBottom: 5,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  categoryButtonActive: {
    backgroundColor: '#00AEEF',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  categoryButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  projectCard: {
    marginBottom: 15,
    elevation: 2,
  },
  projectHeader: {
    marginBottom: 10,
  },
  projectInfo: {
    flex: 1,
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
  creatorInfo: {
    flex: 1,
  },
  creatorText: {
    fontSize: 12,
    color: '#666',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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

export default ProjectsScreen;