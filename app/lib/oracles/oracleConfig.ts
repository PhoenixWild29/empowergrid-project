// Oracle configuration for multi-oracle system
export const oracleConfig = {
  // Consensus parameters
  consensus: {
    minSources: 3, // Minimum number of sources required for consensus
    requiredConfidence: 0.8, // Minimum confidence level (0-1)
    outlierThreshold: 2.0, // Standard deviations for outlier detection
    consensusThreshold: 0.7, // Percentage of sources that must agree (0-1)
  },

  // Oracle providers configuration
  providers: {
    'switchboard-primary': {
      endpoint: process.env.SWITCHBOARD_ENDPOINT || 'http://localhost:3000/api/meter/latest',
      weight: 1.0,
      timeout: 5000,
      retryAttempts: 3,
      enabled: true,
      initialReputation: 95,
    },
    'switchboard-secondary': {
      endpoint: process.env.SWITCHBOARD_BACKUP_ENDPOINT || 'http://localhost:3000/api/meter/mock-oracle',
      weight: 0.9,
      timeout: 5000,
      retryAttempts: 3,
      enabled: true,
      initialReputation: 90,
    },
    'external-oracle-1': {
      endpoint: process.env.EXTERNAL_ORACLE_1_ENDPOINT || 'http://localhost:3000/api/meter/external-oracle',
      weight: 0.8,
      timeout: 8000,
      retryAttempts: 2,
      enabled: true,
      initialReputation: 85,
    },
    'iot-direct': {
      endpoint: process.env.IOT_DIRECT_ENDPOINT || 'http://iot-gateway.local:8080/metrics',
      weight: 0.7,
      timeout: 3000,
      retryAttempts: 5,
      enabled: false, // Disabled by default until IoT gateway is available
      initialReputation: 80,
    },
  },

  // Reputation management
  reputation: {
    maxReputation: 100,
    minReputation: 10,
    failurePenalty: 5, // Points deducted per consecutive failure
    successBonus: 1, // Points added per successful reading
    recoveryRate: 2, // Points recovered per successful reading after failures
    maxConsecutiveFailures: 10, // Maximum consecutive failures before disabling
  },

  // Performance monitoring
  monitoring: {
    healthCheckInterval: 30000, // 30 seconds
    cleanupInterval: 3600000, // 1 hour
    maxReadingsPerProject: 1000, // Maximum readings to keep per project
    readingRetentionHours: 24, // Hours to keep readings
  },

  // Circuit breaker settings
  circuitBreaker: {
    failureThreshold: 5, // Failures before opening circuit
    recoveryTimeout: 60000, // 1 minute before attempting recovery
    monitoringPeriod: 300000, // 5 minutes monitoring window
  },
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
  // Stricter settings for production
  oracleConfig.consensus.minSources = 3;
  oracleConfig.consensus.requiredConfidence = 0.85;
  oracleConfig.monitoring.healthCheckInterval = 15000; // 15 seconds
}

if (process.env.NODE_ENV === 'development') {
  // Relaxed settings for development
  oracleConfig.consensus.minSources = 2;
  oracleConfig.consensus.requiredConfidence = 0.7;
}