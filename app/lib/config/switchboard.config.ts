/**
 * Switchboard Oracle Configuration
 * 
 * Configuration for Switchboard oracle network aggregators,
 * connection settings, and operational parameters.
 * 
 * Environment Variables Required:
 * - SOLANA_RPC_URL: Solana RPC endpoint
 * - SWITCHBOARD_NETWORK: devnet | mainnet-beta
 */

export interface SwitchboardConfig {
  network: 'devnet' | 'mainnet-beta';
  rpcUrl: string;
  primaryAggregators: string[];
  backupAggregators: string[];
  connectionTimeout: number;
  healthCheckInterval: number;
  reconnectDelay: number;
  maxReconnectAttempts: number;
  minReliability: number;
}

/**
 * Production Switchboard Aggregators (Devnet)
 * 
 * To find production aggregators:
 * 1. Visit https://app.switchboard.xyz/
 * 2. Select your network (devnet/mainnet)
 * 3. Browse available feeds
 * 4. Copy the aggregator public key
 */
const DEVNET_AGGREGATORS = {
  primary: [
    // Example: Solar Energy Production Feed (Replace with actual aggregator addresses)
    'GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR',
    '8SXvChNYFhRq4EZuZvnhjrB3jJRQCv4k3P4W6hesH3Ee',
  ],
  backup: [
    'CZza3Ej4Mc58MnxWA385itCC9jCo3L1D7zc3LKy1bZMR',
  ],
};

/**
 * Production Switchboard Aggregators (Mainnet)
 * 
 * Update these addresses with actual mainnet aggregators before deploying to production
 */
const MAINNET_AGGREGATORS = {
  primary: [
    // TODO: Add production mainnet aggregators
    'REPLACE_WITH_MAINNET_AGGREGATOR_1',
    'REPLACE_WITH_MAINNET_AGGREGATOR_2',
  ],
  backup: [
    'REPLACE_WITH_MAINNET_BACKUP_AGGREGATOR',
  ],
};

/**
 * Get Switchboard configuration based on environment
 */
export function getSwitchboardConfig(): SwitchboardConfig {
  const network = (process.env.SWITCHBOARD_NETWORK || 'devnet') as 'devnet' | 'mainnet-beta';
  const aggregators = network === 'mainnet-beta' ? MAINNET_AGGREGATORS : DEVNET_AGGREGATORS;

  return {
    network,
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    primaryAggregators: aggregators.primary,
    backupAggregators: aggregators.backup,
    connectionTimeout: 5000, // 5 seconds
    healthCheckInterval: 60000, // 1 minute
    reconnectDelay: 1000, // Start with 1 second
    maxReconnectAttempts: 5,
    minReliability: 0.95, // 95% uptime
  };
}

/**
 * Oracle Feed Types and their typical aggregator requirements
 */
export const FEED_TYPE_CONFIG = {
  ENERGY_PRODUCTION: {
    updateFrequency: 300, // 5 minutes
    minConfidence: 0.85,
    maxStaleness: 600, // 10 minutes
    description: 'Solar/wind energy production data',
  },
  WEATHER: {
    updateFrequency: 600, // 10 minutes
    minConfidence: 0.9,
    maxStaleness: 900, // 15 minutes
    description: 'Weather data for energy forecasting',
  },
  EQUIPMENT_STATUS: {
    updateFrequency: 60, // 1 minute
    minConfidence: 0.95,
    maxStaleness: 180, // 3 minutes
    description: 'Equipment health and status monitoring',
  },
};

/**
 * Switchboard SDK Configuration
 * 
 * For actual Switchboard integration, install and configure:
 * npm install @switchboard-xyz/solana.js
 */
export const SWITCHBOARD_PROGRAM_ID = {
  devnet: '2TfB33aLaneQb5TNVwyDz3jSZXS6jdW2ARw1Dgf84XCG',
  'mainnet-beta': 'SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f',
};

export default getSwitchboardConfig;



