import { logger } from '../logging/logger';
import { errorTracker, ErrorSeverity, ErrorCategory } from '../monitoring/errorTracker';
import { performanceMonitor } from '../monitoring/performance';

export interface OracleData {
  source: string;
  timestamp: number;
  kwh: number;
  co2: number;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface AggregatedReading {
  timestamp: number;
  kwh: number;
  co2: number;
  confidence: number;
  sources: OracleData[];
  consensus: boolean;
  outlierSources: string[];
}

export interface OracleProvider {
  name: string;
  endpoint: string;
  weight: number; // 0-1, higher weight = more trusted
  timeout: number; // milliseconds
  retryAttempts: number;
  enabled: boolean;
  lastSuccess?: number;
  lastFailure?: number;
  consecutiveFailures: number;
  reputation: number; // 0-100, based on accuracy and reliability
}

export interface ConsensusConfig {
  minSources: number;
  requiredConfidence: number;
  outlierThreshold: number; // standard deviations
  consensusThreshold: number; // percentage of sources that must agree
}

export class OracleManager {
  private static instance: OracleManager;
  private providers: Map<string, OracleProvider> = new Map();
  private consensusConfig: ConsensusConfig;
  private readings: Map<string, OracleData[]> = new Map(); // projectId -> readings

  private constructor() {
    this.consensusConfig = {
      minSources: 3,
      requiredConfidence: 0.8,
      outlierThreshold: 2.0,
      consensusThreshold: 0.7,
    };

    // Initialize default oracle providers
    this.initializeDefaultProviders();
  }

  static getInstance(): OracleManager {
    if (!OracleManager.instance) {
      OracleManager.instance = new OracleManager();
    }
    return OracleManager.instance;
  }

  private initializeDefaultProviders(): void {
    // Primary Switchboard oracle
    this.addProvider({
      name: 'switchboard-primary',
      endpoint: process.env.SWITCHBOARD_ENDPOINT || 'http://localhost:3000/api/meter/latest',
      weight: 1.0,
      timeout: 5000,
      retryAttempts: 3,
      enabled: true,
      reputation: 95,
      consecutiveFailures: 0,
    });

    // Secondary backup oracle
    this.addProvider({
      name: 'switchboard-secondary',
      endpoint: process.env.SWITCHBOARD_BACKUP_ENDPOINT || 'http://localhost:3000/api/meter/mock-oracle',
      weight: 0.9,
      timeout: 5000,
      retryAttempts: 3,
      enabled: true,
      reputation: 90,
      consecutiveFailures: 0,
    });

    // Third-party oracle (simulated)
    this.addProvider({
      name: 'external-oracle-1',
      endpoint: process.env.EXTERNAL_ORACLE_1_ENDPOINT || 'http://localhost:3000/api/meter/external-oracle',
      weight: 0.8,
      timeout: 8000,
      retryAttempts: 2,
      enabled: true,
      reputation: 85,
      consecutiveFailures: 0,
    });

    // IoT device direct reading (simulated)
    this.addProvider({
      name: 'iot-direct',
      endpoint: process.env.IOT_DIRECT_ENDPOINT || 'http://iot-gateway.local:8080/metrics',
      weight: 0.7,
      timeout: 3000,
      retryAttempts: 5,
      enabled: true,
      reputation: 80,
      consecutiveFailures: 0,
    });
  }

  addProvider(provider: OracleProvider): void {
    this.providers.set(provider.name, provider);
    logger.info(`Added oracle provider: ${provider.name}`, { provider });
  }

  removeProvider(name: string): void {
    if (this.providers.delete(name)) {
      logger.info(`Removed oracle provider: ${name}`);
    }
  }

  updateProvider(name: string, updates: Partial<OracleProvider>): void {
    const provider = this.providers.get(name);
    if (provider) {
      Object.assign(provider, updates);
      logger.info(`Updated oracle provider: ${name}`, { updates });
    }
  }

  getProvider(name: string): OracleProvider | undefined {
    return this.providers.get(name);
  }

  getAllProviders(): OracleProvider[] {
    return Array.from(this.providers.values());
  }

  getEnabledProviders(): OracleProvider[] {
    return Array.from(this.providers.values()).filter(p => p.enabled);
  }

  async fetchFromProvider(provider: OracleProvider): Promise<OracleData | null> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), provider.timeout);

      const response = await fetch(provider.endpoint, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'EmpowerGrid-MultiOracle/1.0',
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform the response to our standard format
      const reading: OracleData = {
        source: provider.name,
        timestamp: data.ts || Date.now(),
        kwh: data.kwh || 0,
        co2: data.co2 || 0,
        confidence: provider.reputation / 100, // Convert reputation to confidence
        metadata: {
          raw_wh: data.raw_wh,
          responseTime: Date.now() - startTime,
          provider: provider.name,
        },
      };

      // Update provider success metrics
      provider.lastSuccess = Date.now();
      provider.consecutiveFailures = 0;

      // Record performance
      performanceMonitor.recordMetric(`oracle.${provider.name}.response_time`, Date.now() - startTime);

      logger.info(`Successfully fetched data from ${provider.name}`, {
        kwh: reading.kwh,
        co2: reading.co2,
        responseTime: Date.now() - startTime,
      });

      return reading;

    } catch (error) {
      // Update provider failure metrics
      provider.lastFailure = Date.now();
      provider.consecutiveFailures++;

      // Reduce reputation on consecutive failures
      if (provider.consecutiveFailures > 3) {
        provider.reputation = Math.max(10, provider.reputation - 5);
        logger.warn(`Reduced reputation for ${provider.name} due to consecutive failures`, {
          consecutiveFailures: provider.consecutiveFailures,
          newReputation: provider.reputation,
        });
      }

      // Record error
      errorTracker.trackError(
        error as Error,
        ErrorSeverity.MEDIUM,
        ErrorCategory.EXTERNAL_API,
        {
          component: 'OracleManager',
          action: 'fetchFromProvider',
          metadata: {
            provider: provider.name,
            consecutiveFailures: provider.consecutiveFailures,
          },
        }
      );

      logger.error(`Failed to fetch data from ${provider.name}`, {
        error: (error as Error).message,
        consecutiveFailures: provider.consecutiveFailures,
      });

      return null;
    }
  }

  async fetchAllReadings(projectId: string): Promise<OracleData[]> {
    const enabledProviders = this.getEnabledProviders();
    const readings: OracleData[] = [];

    logger.info(`Fetching readings from ${enabledProviders.length} oracle providers for project ${projectId}`);

    // Fetch from all providers concurrently
    const promises = enabledProviders.map(provider =>
      this.fetchFromProvider(provider).then(reading => {
        if (reading) {
          readings.push(reading);
        }
      })
    );

    await Promise.allSettled(promises);

    // Store readings for this project
    this.readings.set(projectId, readings);

    logger.info(`Collected ${readings.length} readings for project ${projectId}`, {
      sources: readings.map(r => r.source),
    });

    return readings;
  }

  calculateConsensus(readings: OracleData[]): AggregatedReading | null {
    if (readings.length < this.consensusConfig.minSources) {
      logger.warn(`Insufficient readings for consensus: ${readings.length}/${this.consensusConfig.minSources}`);
      return null;
    }

    // Calculate weighted averages
    let totalWeight = 0;
    let weightedKwh = 0;
    let weightedCo2 = 0;
    let totalConfidence = 0;

    readings.forEach(reading => {
      const weight = reading.confidence;
      totalWeight += weight;
      weightedKwh += reading.kwh * weight;
      weightedCo2 += reading.co2 * weight;
      totalConfidence += reading.confidence;
    });

    const avgKwh = totalWeight > 0 ? weightedKwh / totalWeight : 0;
    const avgCo2 = totalWeight > 0 ? weightedCo2 / totalWeight : 0;
    const avgConfidence = totalConfidence / readings.length;

    // Detect outliers using standard deviation
    const kwhValues = readings.map(r => r.kwh);
    const co2Values = readings.map(r => r.co2);

    const kwhStdDev = this.calculateStandardDeviation(kwhValues);
    const co2StdDev = this.calculateStandardDeviation(co2Values);

    const outlierSources: string[] = [];

    readings.forEach(reading => {
      const kwhDeviation = Math.abs(reading.kwh - avgKwh);
      const co2Deviation = Math.abs(reading.co2 - avgCo2);

      if (kwhDeviation > this.consensusConfig.outlierThreshold * kwhStdDev ||
          co2Deviation > this.consensusConfig.outlierThreshold * co2StdDev) {
        outlierSources.push(reading.source);
      }
    });

    // Filter out outliers for final consensus
    const validReadings = readings.filter(r => !outlierSources.includes(r.source));

    if (validReadings.length < this.consensusConfig.minSources) {
      logger.warn(`Too many outliers detected, insufficient valid readings for consensus`);
      return null;
    }

    // Recalculate with valid readings only
    totalWeight = 0;
    weightedKwh = 0;
    weightedCo2 = 0;
    totalConfidence = 0;

    validReadings.forEach(reading => {
      const weight = reading.confidence;
      totalWeight += weight;
      weightedKwh += reading.kwh * weight;
      weightedCo2 += reading.co2 * weight;
      totalConfidence += reading.confidence;
    });

    const finalKwh = totalWeight > 0 ? weightedKwh / totalWeight : 0;
    const finalCo2 = totalWeight > 0 ? weightedCo2 / totalWeight : 0;
    const finalConfidence = totalConfidence / validReadings.length;

    // Check consensus threshold
    const consensusRatio = validReadings.length / readings.length;
    const hasConsensus = consensusRatio >= this.consensusConfig.consensusThreshold &&
                        finalConfidence >= this.consensusConfig.requiredConfidence;

    const result: AggregatedReading = {
      timestamp: Date.now(),
      kwh: finalKwh,
      co2: finalCo2,
      confidence: finalConfidence,
      sources: readings,
      consensus: hasConsensus,
      outlierSources,
    };

    logger.info(`Consensus calculation completed`, {
      totalReadings: readings.length,
      validReadings: validReadings.length,
      outliers: outlierSources.length,
      consensus: hasConsensus,
      finalKwh,
      finalCo2,
      confidence: finalConfidence,
    });

    return result;
  }

  async getAggregatedReading(projectId: string): Promise<AggregatedReading | null> {
    const readings = await this.fetchAllReadings(projectId);

    if (readings.length === 0) {
      logger.error(`No readings available for project ${projectId}`);
      return null;
    }

    return this.calculateConsensus(readings);
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
  }

  // Health monitoring
  getHealthStatus(): {
    totalProviders: number;
    enabledProviders: number;
    healthyProviders: number;
    averageReputation: number;
    lastUpdate: number;
  } {
    const providers = Array.from(this.providers.values());
    const enabledProviders = providers.filter(p => p.enabled);
    const healthyProviders = enabledProviders.filter(p =>
      p.consecutiveFailures === 0 ||
      (p.lastSuccess && Date.now() - p.lastSuccess < 300000) // Healthy if successful in last 5 minutes
    );

    const averageReputation = enabledProviders.length > 0
      ? enabledProviders.reduce((sum, p) => sum + p.reputation, 0) / enabledProviders.length
      : 0;

    return {
      totalProviders: providers.length,
      enabledProviders: enabledProviders.length,
      healthyProviders: healthyProviders.length,
      averageReputation,
      lastUpdate: Date.now(),
    };
  }

  // Configuration management
  updateConsensusConfig(config: Partial<ConsensusConfig>): void {
    Object.assign(this.consensusConfig, config);
    logger.info('Updated consensus configuration', { config: this.consensusConfig });
  }

  getConsensusConfig(): ConsensusConfig {
    return { ...this.consensusConfig };
  }

  // Cleanup old readings (keep last 24 hours)
  cleanupOldReadings(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    for (const [projectId, readings] of this.readings) {
      const filteredReadings = readings.filter(r => r.timestamp > cutoffTime);
      if (filteredReadings.length !== readings.length) {
        this.readings.set(projectId, filteredReadings);
        logger.info(`Cleaned up ${readings.length - filteredReadings.length} old readings for project ${projectId}`);
      }
    }
  }
}

// Export singleton instance
export const oracleManager = OracleManager.getInstance();