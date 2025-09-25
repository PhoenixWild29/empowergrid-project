import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Card, Title, Paragraph, Button, Chip, Switch, Divider } from 'react-native-paper';
import { useWalletContext } from '../contexts/WalletContext';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

interface NotificationItem {
  id: string;
  type: 'governance' | 'project' | 'funding' | 'system' | 'achievement';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  metadata?: any;
}

interface NotificationSettings {
  governance: boolean;
  projectUpdates: boolean;
  funding: boolean;
  achievements: boolean;
  system: boolean;
  pushEnabled: boolean;
}

const NotificationsScreen: React.FC = () => {
  const { connected, publicKey } = useWalletContext();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    governance: true,
    projectUpdates: true,
    funding: true,
    achievements: true,
    system: true,
    pushEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const tabs = ['all', 'unread'];

  useEffect(() => {
    if (connected && publicKey) {
      loadNotifications();
      loadSettings();
      setupNotifications();
    } else {
      setNotifications([]);
      setLoading(false);
    }
  }, [connected, publicKey]);

  const setupNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Notifications Permission',
        'Please enable notifications to receive important updates about your investments and governance proposals.'
      );
    }
  };

  const loadNotifications = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/users/${publicKey.toString()}/notifications`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`http://localhost:3000/api/users/${publicKey.toString()}/notification-settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data.data || settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    if (!publicKey) return;

    try {
      const response = await fetch(`http://localhost:3000/api/users/${publicKey.toString()}/notification-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        setSettings(newSettings);
      } else {
        Alert.alert('Error', 'Failed to save notification settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!publicKey) return;

    try {
      const response = await fetch(`http://localhost:3000/api/users/${publicKey.toString()}/notifications/${notificationId}/read`, {
        method: 'PUT',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`http://localhost:3000/api/users/${publicKey.toString()}/notifications/mark-all-read`, {
        method: 'PUT',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const getFilteredNotifications = () => {
    if (activeTab === 'unread') {
      return notifications.filter(notif => !notif.read);
    }
    return notifications;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'governance': return 'people-outline';
      case 'project': return 'bulb-outline';
      case 'funding': return 'cash-outline';
      case 'achievement': return 'trophy-outline';
      case 'system': return 'settings-outline';
      default: return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'governance': return '#00AEEF';
      case 'project': return '#28a745';
      case 'funding': return '#ffc107';
      case 'achievement': return '#ff6b35';
      case 'system': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleNotificationPress = (notification: NotificationItem) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Handle navigation based on notification type
    if (notification.actionUrl) {
      // Navigate to the relevant screen
      console.log('Navigate to:', notification.actionUrl);
    }
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationIcon}>
        <Ionicons
          name={getNotificationIcon(item.type)}
          size={24}
          color={getNotificationColor(item.type)}
        />
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, !item.read && styles.unreadText]}>
            {item.title}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTimeAgo(item.timestamp)}
          </Text>
        </View>

        <Text style={[styles.notificationMessage, !item.read && styles.unreadText]}>
          {item.message}
        </Text>

        <View style={styles.notificationFooter}>
          <Chip
            style={[styles.typeChip, { backgroundColor: getNotificationColor(item.type) + '20' }]}
            textStyle={{ color: getNotificationColor(item.type), fontSize: 10 }}
          >
            {item.type.toUpperCase()}
          </Chip>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSettings = () => (
    <Card style={styles.settingsCard}>
      <Card.Title title="Notification Settings" />
      <Card.Content>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive notifications on your device
            </Text>
          </View>
          <Switch
            value={settings.pushEnabled}
            onValueChange={(value) => saveSettings({ ...settings, pushEnabled: value })}
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Governance Updates</Text>
            <Text style={styles.settingDescription}>
              New proposals and voting results
            </Text>
          </View>
          <Switch
            value={settings.governance}
            onValueChange={(value) => saveSettings({ ...settings, governance: value })}
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Project Updates</Text>
            <Text style={styles.settingDescription}>
              Milestones and progress updates
            </Text>
          </View>
          <Switch
            value={settings.projectUpdates}
            onValueChange={(value) => saveSettings({ ...settings, projectUpdates: value })}
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Funding Alerts</Text>
            <Text style={styles.settingDescription}>
              Investment opportunities and funding status
            </Text>
          </View>
          <Switch
            value={settings.funding}
            onValueChange={(value) => saveSettings({ ...settings, funding: value })}
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Achievements</Text>
            <Text style={styles.settingDescription}>
              Badges and milestone celebrations
            </Text>
          </View>
          <Switch
            value={settings.achievements}
            onValueChange={(value) => saveSettings({ ...settings, achievements: value })}
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>System Notifications</Text>
            <Text style={styles.settingDescription}>
              Platform updates and maintenance
            </Text>
          </View>
          <Switch
            value={settings.system}
            onValueChange={(value) => saveSettings({ ...settings, system: value })}
          />
        </View>
      </Card.Content>
    </Card>
  );

  if (!connected) {
    return (
      <View style={styles.notConnectedContainer}>
        <Ionicons name="notifications-outline" size={64} color="#ccc" />
        <Text style={styles.notConnectedText}>Notifications Unavailable</Text>
        <Text style={styles.notConnectedSubtext}>
          Connect your wallet to receive personalized notifications about your investments and governance activity.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab as 'all' | 'unread')}
          >
            <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
              {tab === 'all' ? 'All' : 'Unread'} ({getFilteredNotifications().length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mark All as Read Button */}
      {getFilteredNotifications().length > 0 && (
        <View style={styles.headerActions}>
          <Button
            mode="text"
            onPress={markAllAsRead}
            compact
          >
            Mark All as Read
          </Button>
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        data={getFilteredNotifications()}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'unread'
                  ? 'You\'re all caught up!'
                  : 'Notifications about your investments and governance activity will appear here.'
                }
              </Text>
            </View>
          ) : null
        }
      />

      {/* Settings */}
      {renderSettings()}
    </View>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 10,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#00AEEF',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#666',
  },
  tabButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  headerActions: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  listContainer: {
    padding: 15,
  },
  notificationItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#00AEEF',
  },
  notificationIcon: {
    marginRight: 15,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  unreadText: {
    color: '#000',
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeChip: {
    height: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00AEEF',
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
  settingsCard: {
    margin: 15,
    marginTop: 0,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    marginVertical: 5,
  },
});

export default NotificationsScreen;