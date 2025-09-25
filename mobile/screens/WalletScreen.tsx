import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Clipboard,
  RefreshControl,
} from 'react-native';
import { Card, Title, Paragraph, Button, Chip, Avatar, Divider, List } from 'react-native-paper';
import { useWalletContext } from '../contexts/WalletContext';
import { Ionicons } from '@expo/vector-icons';

interface WalletBalance {
  sol: number;
  usd: number;
  change24h: number;
}

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'funding' | 'governance' | 'reward';
  amount: number;
  currency: 'SOL' | 'USD';
  timestamp: string;
  status: 'confirmed' | 'pending' | 'failed';
  to?: string;
  from?: string;
  description: string;
  txHash?: string;
}

interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  attributes: { trait_type: string; value: string }[];
}

const WalletScreen: React.FC = () => {
  const { connected, publicKey, disconnect, balance } = useWalletContext();
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    if (connected && publicKey) {
      loadWalletData();
    } else {
      setWalletBalance(null);
      setTransactions([]);
      setNfts([]);
      setLoading(false);
    }
  }, [connected, publicKey]);

  const loadWalletData = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);

      // Load balance
      const balanceResponse = await fetch(`http://localhost:3000/api/wallet/${publicKey.toString()}/balance`);
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setWalletBalance(balanceData.data);
      }

      // Load transactions
      const txResponse = await fetch(`http://localhost:3000/api/wallet/${publicKey.toString()}/transactions?limit=20`);
      if (txResponse.ok) {
        const txData = await txResponse.json();
        setTransactions(txData.data || []);
      }

      // Load NFTs (if any)
      const nftResponse = await fetch(`http://localhost:3000/api/wallet/${publicKey.toString()}/nfts`);
      if (nftResponse.ok) {
        const nftData = await nftResponse.json();
        setNfts(nftData.data || []);
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setString(text);
    Alert.alert('Copied', 'Address copied to clipboard');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'SOL' ? 'USD' : currency,
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send': return 'arrow-up-outline';
      case 'receive': return 'arrow-down-outline';
      case 'funding': return 'cash-outline';
      case 'governance': return 'people-outline';
      case 'reward': return 'trophy-outline';
      default: return 'swap-horizontal-outline';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'send': return '#dc3545';
      case 'receive': return '#28a745';
      case 'funding': return '#00AEEF';
      case 'governance': return '#ffc107';
      case 'reward': return '#ff6b35';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#28a745';
      case 'pending': return '#ffc107';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
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

  const renderBalanceCard = () => (
    <Card style={styles.balanceCard}>
      <Card.Content>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
            <Ionicons
              name={showBalance ? 'eye-outline' : 'eye-off-outline'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceAmount}>
          <Text style={styles.solAmount}>
            {showBalance ? `${walletBalance?.sol.toFixed(4) || '0.0000'} SOL` : '••••••'}
          </Text>
          <Text style={styles.usdAmount}>
            {showBalance ? formatCurrency(walletBalance?.usd || 0) : '••••••'}
          </Text>
        </View>

        {walletBalance && (
          <View style={styles.balanceChange}>
            <Text style={[
              styles.changeText,
              { color: (walletBalance.change24h || 0) >= 0 ? '#28a745' : '#dc3545' }
            ]}>
              {(walletBalance.change24h || 0) >= 0 ? '+' : ''}{(walletBalance.change24h || 0).toFixed(2)}% (24h)
            </Text>
          </View>
        )}

        <View style={styles.walletAddress}>
          <Text style={styles.addressLabel}>Wallet Address</Text>
          <TouchableOpacity
            style={styles.addressContainer}
            onPress={() => copyToClipboard(publicKey?.toString() || '')}
          >
            <Text style={styles.addressText}>
              {publicKey ? formatAddress(publicKey.toString()) : ''}
            </Text>
            <Ionicons name="copy-outline" size={16} color="#00AEEF" />
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="send-outline" size={24} color="#00AEEF" />
        <Text style={styles.actionText}>Send</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="qr-code-outline" size={24} color="#00AEEF" />
        <Text style={styles.actionText}>Receive</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="swap-horizontal-outline" size={24} color="#00AEEF" />
        <Text style={styles.actionText}>Swap</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={handleDisconnect}>
        <Ionicons name="log-out-outline" size={24} color="#dc3545" />
        <Text style={[styles.actionText, { color: '#dc3545' }]}>Disconnect</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTransactions = () => (
    <Card style={styles.transactionsCard}>
      <Card.Title
        title="Recent Transactions"
        right={(props) => (
          <Button
            mode="text"
            compact
            onPress={() => {/* Navigate to full transaction history */}}
          >
            View All
          </Button>
        )}
      />
      <Card.Content>
        {transactions.length > 0 ? (
          transactions.slice(0, 5).map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={styles.transactionItem}
              onPress={() => {/* Show transaction details */}}
            >
              <View style={styles.transactionIcon}>
                <Ionicons
                  name={getTransactionIcon(transaction.type)}
                  size={20}
                  color={getTransactionColor(transaction.type)}
                />
              </View>

              <View style={styles.transactionInfo}>
                <Text style={styles.transactionDescription}>
                  {transaction.description}
                </Text>
                <Text style={styles.transactionTime}>
                  {new Date(transaction.timestamp).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.transactionAmount}>
                <Text style={[
                  styles.amountText,
                  { color: transaction.type === 'send' ? '#dc3545' : '#28a745' }
                ]}>
                  {transaction.type === 'send' ? '-' : '+'}
                  {transaction.amount.toFixed(4)} {transaction.currency}
                </Text>
                <Chip
                  style={[styles.statusChip, { backgroundColor: getStatusColor(transaction.status) + '20' }]}
                  textStyle={{ color: getStatusColor(transaction.status), fontSize: 10 }}
                >
                  {transaction.status.toUpperCase()}
                </Chip>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyTransactions}>
            <Ionicons name="receipt-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>
              Your transaction history will appear here
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderNFTs = () => {
    if (nfts.length === 0) return null;

    return (
      <Card style={styles.nftsCard}>
        <Card.Title title="NFTs" />
        <Card.Content>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {nfts.map((nft) => (
              <TouchableOpacity key={nft.id} style={styles.nftItem}>
                <Avatar.Image size={80} source={{ uri: nft.image }} />
                <Text style={styles.nftName} numberOfLines={1}>
                  {nft.name}
                </Text>
                <Text style={styles.nftCollection} numberOfLines={1}>
                  {nft.collection}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };

  if (!connected) {
    return (
      <View style={styles.notConnectedContainer}>
        <Ionicons name="wallet-outline" size={64} color="#ccc" />
        <Text style={styles.notConnectedText}>Wallet Not Connected</Text>
        <Text style={styles.notConnectedSubtext}>
          Connect your wallet to view your balance, transactions, and manage your assets.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading wallet data...</Text>
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
      {/* Balance Card */}
      {renderBalanceCard()}

      {/* Quick Actions */}
      {renderQuickActions()}

      {/* NFTs */}
      {renderNFTs()}

      {/* Transactions */}
      {renderTransactions()}
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
  balanceCard: {
    margin: 15,
    elevation: 2,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  balanceAmount: {
    marginBottom: 10,
  },
  solAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00AEEF',
  },
  usdAmount: {
    fontSize: 16,
    color: '#666',
  },
  balanceChange: {
    marginBottom: 20,
  },
  changeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  walletAddress: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  addressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'monospace',
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  nftsCard: {
    margin: 15,
    marginTop: 0,
    elevation: 2,
  },
  nftItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 80,
  },
  nftName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
  nftCollection: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  transactionsCard: {
    margin: 15,
    marginTop: 0,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionIcon: {
    marginRight: 15,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusChip: {
    height: 18,
    marginTop: 5,
  },
  emptyTransactions: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default WalletScreen;