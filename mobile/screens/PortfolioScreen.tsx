import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Card, Title, Paragraph, Button, Chip, ProgressBar } from 'react-native-paper';
import { useWalletContext } from '../contexts/WalletContext';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';

interface PortfolioData {
  totalInvested: number;
  totalValue: number;
  totalReturns: number;
  returnPercentage: number;
  investments: Investment[];
  assetAllocation: AssetAllocation[];
}

interface Investment {
  id: string;
  projectId: string;
  projectTitle: string;
  projectCategory: string;
  amountInvested: number;
  currentValue: number;
  returns: number;
  returnPercentage: number;
  status: 'active' | 'completed' | 'liquidated';
  investedAt: string;
  lastUpdated: string;
}

interface AssetAllocation {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

const PortfolioScreen: React.FC = () => {
  const { connected, publicKey } = useWalletContext();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('3M');

  const periods = ['1M', '3M', '6M', '1Y', 'ALL'];

  useEffect(() => {
    if (connected && publicKey) {
      loadPortfolio();
    } else {
      setPortfolio(null);
      setLoading(false);
    }
  }, [connected, publicKey]);

  const loadPortfolio = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/users/${publicKey.toString()}/portfolio`);
      if (response.ok) {
        const data = await response.json();
        setPortfolio(data.data);
      } else {
        // If no portfolio exists yet, create empty one
        setPortfolio({
          totalInvested: 0,
          totalValue: 0,
          totalReturns: 0,
          returnPercentage: 0,
          investments: [],
          assetAllocation: [],
        });
      }
    } catch (error) {
      console.error('Failed to load portfolio:', error);
      Alert.alert('Error', 'Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
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
      case 'completed': return '#28a745';
      case 'liquidated': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getReturnColor = (percentage: number) => {
    if (percentage > 0) return '#28a745';
    if (percentage < 0) return '#dc3545';
    return '#6c757d';
  };

  const renderPortfolioOverview = () => (
    <Card style={styles.overviewCard}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Portfolio Overview</Title>

        <View style={styles.overviewStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Invested</Text>
            <Text style={styles.statValue}>{formatCurrency(portfolio?.totalInvested || 0)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Current Value</Text>
            <Text style={styles.statValue}>{formatCurrency(portfolio?.totalValue || 0)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Returns</Text>
            <Text style={[styles.statValue, { color: getReturnColor(portfolio?.returnPercentage || 0) }]}>
              {formatCurrency(portfolio?.totalReturns || 0)} ({(portfolio?.returnPercentage || 0).toFixed(2)}%)
            </Text>
          </View>
        </View>

        {/* Performance Indicator */}
        <View style={styles.performanceIndicator}>
          <View style={styles.performanceBar}>
            <View
              style={[
                styles.performanceFill,
                {
                  width: `${Math.min(Math.abs(portfolio?.returnPercentage || 0) * 10, 100)}%`,
                  backgroundColor: getReturnColor(portfolio?.returnPercentage || 0)
                }
              ]}
            />
          </View>
          <Text style={[styles.performanceText, { color: getReturnColor(portfolio?.returnPercentage || 0) }]}>
            {portfolio?.returnPercentage || 0 >= 0 ? '+' : ''}{(portfolio?.returnPercentage || 0).toFixed(2)}% this period
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderAssetAllocation = () => {
    if (!portfolio?.assetAllocation || portfolio.assetAllocation.length === 0) {
      return null;
    }

    const chartData = portfolio.assetAllocation.map((asset) => ({
      name: asset.category,
      amount: asset.amount,
      color: asset.color,
      legendFontColor: '#666',
      legendFontSize: 12,
    }));

    return (
      <Card style={styles.allocationCard}>
        <Card.Title title="Asset Allocation" />
        <Card.Content>
          <View style={styles.chartContainer}>
            <PieChart
              data={chartData}
              width={Dimensions.get('window').width - 60}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 174, 239, ${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
            />
          </View>

          <View style={styles.allocationList}>
            {portfolio.assetAllocation.map((asset) => (
              <View key={asset.category} style={styles.allocationItem}>
                <View style={styles.allocationIndicator}>
                  <View style={[styles.allocationDot, { backgroundColor: asset.color }]} />
                  <Text style={styles.allocationCategory}>{asset.category}</Text>
                </View>
                <View style={styles.allocationValues}>
                  <Text style={styles.allocationAmount}>{formatCurrency(asset.amount)}</Text>
                  <Text style={styles.allocationPercentage}>{asset.percentage.toFixed(1)}%</Text>
                </View>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderInvestments = () => (
    <Card style={styles.investmentsCard}>
      <Card.Title title="Your Investments" />
      <Card.Content>
        {portfolio?.investments && portfolio.investments.length > 0 ? (
          portfolio.investments.map((investment) => (
            <TouchableOpacity
              key={investment.id}
              style={styles.investmentItem}
              onPress={() => {/* Navigate to project details */}}
            >
              <View style={styles.investmentHeader}>
                <View style={styles.investmentInfo}>
                  <Text style={styles.investmentTitle}>{investment.projectTitle}</Text>
                  <View style={styles.investmentMeta}>
                    <Chip style={styles.categoryChip}>{investment.projectCategory}</Chip>
                    <Chip
                      style={[styles.statusChip, { backgroundColor: getStatusColor(investment.status) }]}
                      textStyle={{ color: 'white', fontSize: 10 }}
                    >
                      {investment.status.toUpperCase()}
                    </Chip>
                  </View>
                </View>
                <View style={styles.investmentReturns}>
                  <Text style={[styles.returnAmount, { color: getReturnColor(investment.returnPercentage) }]}>
                    {investment.returnPercentage >= 0 ? '+' : ''}{formatCurrency(investment.returns)}
                  </Text>
                  <Text style={[styles.returnPercentage, { color: getReturnColor(investment.returnPercentage) }]}>
                    ({investment.returnPercentage.toFixed(2)}%)
                  </Text>
                </View>
              </View>

              <View style={styles.investmentDetails}>
                <Text style={styles.investedAmount}>
                  Invested: {formatCurrency(investment.amountInvested)}
                </Text>
                <Text style={styles.currentValue}>
                  Current Value: {formatCurrency(investment.currentValue)}
                </Text>
                <Text style={styles.investedDate}>
                  Invested: {new Date(investment.investedAt).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.investmentProgress}>
                <ProgressBar
                  progress={investment.currentValue / investment.amountInvested}
                  color={getReturnColor(investment.returnPercentage)}
                  style={styles.progressBar}
                />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyInvestments}>
            <Ionicons name="wallet-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No investments yet</Text>
            <Text style={styles.emptySubtext}>
              Start funding sustainable energy projects to build your portfolio
            </Text>
            <Button
              mode="contained"
              onPress={() => {/* Navigate to projects */}}
              style={styles.exploreButton}
            >
              Explore Projects
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (!connected) {
    return (
      <View style={styles.notConnectedContainer}>
        <Ionicons name="pie-chart-outline" size={64} color="#ccc" />
        <Text style={styles.notConnectedText}>Portfolio Not Available</Text>
        <Text style={styles.notConnectedSubtext}>
          Connect your wallet to view your investment portfolio and returns.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading portfolio...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period as any)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive
            ]}>
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Portfolio Overview */}
      {renderPortfolioOverview()}

      {/* Asset Allocation Chart */}
      {renderAssetAllocation()}

      {/* Investments List */}
      {renderInvestments()}
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 10,
    margin: 15,
    borderRadius: 10,
    elevation: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#00AEEF',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
  },
  periodButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  overviewCard: {
    margin: 15,
    marginTop: 0,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  overviewStats: {
    marginBottom: 20,
  },
  statItem: {
    marginBottom: 15,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00AEEF',
  },
  performanceIndicator: {
    marginTop: 10,
  },
  performanceBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 5,
  },
  performanceFill: {
    height: '100%',
    borderRadius: 2,
  },
  performanceText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  allocationCard: {
    margin: 15,
    marginTop: 0,
    elevation: 2,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  allocationList: {
    marginTop: 10,
  },
  allocationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  allocationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  allocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  allocationCategory: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  allocationValues: {
    alignItems: 'flex-end',
  },
  allocationAmount: {
    fontSize: 14,
    color: '#666',
  },
  allocationPercentage: {
    fontSize: 12,
    color: '#00AEEF',
    fontWeight: 'bold',
  },
  investmentsCard: {
    margin: 15,
    marginTop: 0,
    elevation: 2,
  },
  investmentItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  investmentInfo: {
    flex: 1,
  },
  investmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  investmentMeta: {
    flexDirection: 'row',
    gap: 5,
  },
  categoryChip: {
    height: 20,
    backgroundColor: '#e3f2fd',
  },
  statusChip: {
    height: 20,
  },
  investmentReturns: {
    alignItems: 'flex-end',
  },
  returnAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  returnPercentage: {
    fontSize: 12,
  },
  investmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  investedAmount: {
    fontSize: 12,
    color: '#666',
  },
  currentValue: {
    fontSize: 12,
    color: '#666',
  },
  investedDate: {
    fontSize: 12,
    color: '#666',
  },
  investmentProgress: {
    marginTop: 5,
  },
  progressBar: {
    height: 3,
  },
  emptyInvestments: {
    alignItems: 'center',
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
    marginBottom: 20,
    textAlign: 'center',
  },
  exploreButton: {
    backgroundColor: '#00AEEF',
  },
});

export default PortfolioScreen;