import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { Card, Title, Paragraph, Button, Avatar, Divider, List } from 'react-native-paper';
import { useWalletContext } from '../contexts/WalletContext';
import { Ionicons } from '@expo/vector-icons';

interface UserProfile {
  id: string;
  walletAddress: string;
  username?: string;
  email?: string;
  bio?: string;
  avatar?: string;
  reputation: number;
  projectsCreated: number;
  projectsFunded: number;
  totalInvested: number;
  joinedAt: string;
  badges: string[];
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

interface UserActivity {
  id: string;
  type: 'project_created' | 'project_funded' | 'vote_cast' | 'proposal_created';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
}

const ProfileScreen: React.FC = () => {
  const { connected, publicKey, disconnect } = useWalletContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (connected && publicKey) {
      loadProfile();
      loadActivities();
    } else {
      setProfile(null);
      setActivities([]);
      setLoading(false);
    }
  }, [connected, publicKey]);

  const loadProfile = async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`http://localhost:3000/api/users/${publicKey.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
      } else if (response.status === 404) {
        // User doesn't exist yet, create default profile
        setProfile({
          id: publicKey.toString(),
          walletAddress: publicKey.toString(),
          reputation: 0,
          projectsCreated: 0,
          projectsFunded: 0,
          totalInvested: 0,
          joinedAt: new Date().toISOString(),
          badges: [],
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please check your connection.');
    }
  };

  const loadActivities = async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`http://localhost:3000/api/users/${publicKey.toString()}/activities`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            disconnect();
            Alert.alert('Success', 'Wallet disconnected successfully.');
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_created': return 'bulb-outline';
      case 'project_funded': return 'cash-outline';
      case 'vote_cast': return 'checkmark-circle-outline';
      case 'proposal_created': return 'document-text-outline';
      default: return 'ellipse-outline';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'project_created': return '#00AEEF';
      case 'project_funded': return '#28a745';
      case 'vote_cast': return '#ffc107';
      case 'proposal_created': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const renderActivity = (activity: UserActivity) => (
    <List.Item
      key={activity.id}
      title={activity.title}
      description={activity.description}
      left={(props) => (
        <List.Icon
          {...props}
          icon={getActivityIcon(activity.type)}
          color={getActivityColor(activity.type)}
        />
      )}
      right={(props) => (
        <View style={styles.activityRight}>
          {activity.amount && (
            <Text style={styles.activityAmount}>
              {formatCurrency(activity.amount)}
            </Text>
          )}
          <Text style={styles.activityTime}>
            {new Date(activity.timestamp).toLocaleDateString()}
          </Text>
        </View>
      )}
      style={styles.activityItem}
    />
  );

  if (!connected) {
    return (
      <View style={styles.notConnectedContainer}>
        <Ionicons name="wallet-outline" size={64} color="#ccc" />
        <Text style={styles.notConnectedText}>Wallet Not Connected</Text>
        <Text style={styles.notConnectedSubtext}>
          Connect your wallet to view your profile and activity.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileHeader}>
          <Avatar.Image
            size={80}
            source={profile?.avatar ? { uri: profile.avatar } : undefined}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Title style={styles.username}>
              {profile?.username || `User ${profile?.walletAddress?.slice(0, 8)}...`}
            </Title>
            <Text style={styles.walletAddress}>
              {profile?.walletAddress?.slice(0, 8)}...{profile?.walletAddress?.slice(-8)}
            </Text>
            {profile?.bio && (
              <Paragraph style={styles.bio}>{profile.bio}</Paragraph>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={styles.statValue}>{profile?.reputation || 0}</Text>
            <Text style={styles.statLabel}>Reputation</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={styles.statValue}>{profile?.projectsCreated || 0}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={styles.statValue}>{profile?.projectsFunded || 0}</Text>
            <Text style={styles.statLabel}>Investments</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={styles.statValue}>
              {formatCurrency(profile?.totalInvested || 0)}
            </Text>
            <Text style={styles.statLabel}>Total Invested</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Badges */}
      {profile?.badges && profile.badges.length > 0 && (
        <Card style={styles.badgesCard}>
          <Card.Title title="Achievements" />
          <Card.Content>
            <View style={styles.badgesContainer}>
              {profile.badges.map((badge, index) => (
                <View key={index} style={styles.badge}>
                  <Ionicons name="ribbon-outline" size={20} color="#ffc107" />
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Social Links */}
      {profile?.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
        <Card style={styles.socialCard}>
          <Card.Title title="Social Links" />
          <Card.Content>
            {profile.socialLinks.twitter && (
              <TouchableOpacity
                style={styles.socialLink}
                onPress={() => Linking.openURL(`https://twitter.com/${profile.socialLinks!.twitter}`)}
              >
                <Ionicons name="logo-twitter" size={20} color="#1da1f2" />
                <Text style={styles.socialLinkText}>@{profile.socialLinks.twitter}</Text>
              </TouchableOpacity>
            )}
            {profile.socialLinks.linkedin && (
              <TouchableOpacity
                style={styles.socialLink}
                onPress={() => Linking.openURL(profile.socialLinks.linkedin!)}
              >
                <Ionicons name="logo-linkedin" size={20} color="#0077b5" />
                <Text style={styles.socialLinkText}>LinkedIn</Text>
              </TouchableOpacity>
            )}
            {profile.socialLinks.github && (
              <TouchableOpacity
                style={styles.socialLink}
                onPress={() => Linking.openURL(`https://github.com/${profile.socialLinks!.github}`)}
              >
                <Ionicons name="logo-github" size={20} color="#333" />
                <Text style={styles.socialLinkText}>@{profile.socialLinks.github}</Text>
              </TouchableOpacity>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Recent Activity */}
      <Card style={styles.activityCard}>
        <Card.Title title="Recent Activity" />
        <Card.Content>
          {activities.length > 0 ? (
            activities.slice(0, 10).map(renderActivity)
          ) : (
            <Text style={styles.noActivityText}>No recent activity</Text>
          )}
        </Card.Content>
      </Card>

      {/* Account Info */}
      <Card style={styles.accountCard}>
        <Card.Title title="Account Information" />
        <Card.Content>
          <View style={styles.accountInfo}>
            <Text style={styles.accountLabel}>Member since:</Text>
            <Text style={styles.accountValue}>
              {profile?.joinedAt ? formatDate(profile.joinedAt) : 'Unknown'}
            </Text>
          </View>
          <Divider style={styles.divider} />
          <Button
            mode="outlined"
            onPress={handleDisconnect}
            style={styles.disconnectButton}
            textColor="#dc3545"
          >
            Disconnect Wallet
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  notConnectedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  notConnectedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  notConnectedSubtext: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    margin: 15,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  walletAddress: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  bio: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00AEEF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  badgesCard: {
    margin: 15,
    elevation: 2,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    margin: 2,
  },
  badgeText: {
    fontSize: 12,
    color: '#856404',
    marginLeft: 5,
  },
  socialCard: {
    margin: 15,
    elevation: 2,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  socialLinkText: {
    fontSize: 14,
    color: '#007bff',
    marginLeft: 10,
  },
  activityCard: {
    margin: 15,
    elevation: 2,
  },
  activityItem: {
    paddingVertical: 5,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: 'bold',
  },
  activityTime: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  noActivityText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  accountCard: {
    margin: 15,
    marginBottom: 30,
    elevation: 2,
  },
  accountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  accountLabel: {
    fontSize: 14,
    color: '#666',
  },
  accountValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 10,
  },
  disconnectButton: {
    borderColor: '#dc3545',
  },
});

export default ProfileScreen;