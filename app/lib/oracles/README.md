# Multi-Oracle System

This directory contains the implementation of a redundant, multi-oracle data aggregation system for EmpowerGRID meter readings and project metrics.

## Overview

The multi-oracle system provides resilience against single points of failure by aggregating data from multiple independent oracle sources. It uses consensus algorithms to validate data integrity and detect outliers.

## Key Components

### OracleManager (`oracleManager.ts`)

Central orchestrator for the multi-oracle system:

- Manages multiple oracle providers
- Implements consensus algorithms
- Handles provider health monitoring and reputation
- Provides aggregated readings with confidence scores

### OracleConfig (`oracleConfig.ts`)

Configuration settings for the oracle network:

- Consensus parameters (minimum sources, confidence thresholds)
- Provider configurations (endpoints, weights, timeouts)
- Reputation management rules
- Circuit breaker settings

### API Endpoints

- `/api/meter/multi-oracle` - Get aggregated readings from multiple oracles
- `/api/meter/oracle-health` - Monitor oracle network health
- `/api/meter/mock-oracle` - Secondary oracle simulation
- `/api/meter/external-oracle` - Third-party oracle simulation

## Consensus Algorithm

The system uses a weighted consensus approach:

1. **Data Collection**: Fetch readings from all enabled oracle providers
2. **Outlier Detection**: Remove readings that deviate significantly from the mean
3. **Weighted Aggregation**: Calculate weighted averages based on provider reputation
4. **Confidence Scoring**: Determine overall confidence in the aggregated result
5. **Consensus Validation**: Ensure sufficient agreement among sources

## Provider Management

### Adding Providers

```typescript
oracleManager.addProvider({
  name: 'my-oracle',
  endpoint: 'https://my-oracle.com/api/metrics',
  weight: 0.8,
  timeout: 5000,
  retryAttempts: 3,
  enabled: true,
  reputation: 85,
  consecutiveFailures: 0,
});
```

### Provider Health

Each provider tracks:

- Success/failure rates
- Response times
- Reputation scores
- Consecutive failure counts
- Last success/failure timestamps

## Configuration

### Environment Variables

```bash
# Oracle endpoints
SWITCHBOARD_ENDPOINT=http://localhost:3000/api/meter/latest
SWITCHBOARD_BACKUP_ENDPOINT=http://localhost:3000/api/meter/mock-oracle
EXTERNAL_ORACLE_1_ENDPOINT=http://localhost:3000/api/meter/external-oracle
IOT_DIRECT_ENDPOINT=http://iot-gateway.local:8080/metrics

# Consensus settings
ORACLE_MIN_SOURCES=3
ORACLE_REQUIRED_CONFIDENCE=0.8
ORACLE_OUTLIER_THRESHOLD=2.0
ORACLE_CONSENSUS_THRESHOLD=0.7
```

### Runtime Configuration

The system supports dynamic configuration updates:

```typescript
oracleManager.updateConsensusConfig({
  minSources: 4,
  requiredConfidence: 0.85,
});
```

## Usage Examples

### Get Aggregated Reading

```typescript
const aggregatedReading =
  await oracleManager.getAggregatedReading('project-123');
if (aggregatedReading.consensus) {
  console.log(
    'Consensus reached:',
    aggregatedReading.kwh,
    aggregatedReading.co2
  );
} else {
  console.log('No consensus - insufficient agreement');
}
```

### Monitor Health

```typescript
const health = oracleManager.getHealthStatus();
console.log(
  `${health.healthyProviders}/${health.totalProviders} providers healthy`
);
```

## Relay Script

The `relay_metrics_multi_oracle.ts` script submits only high-confidence consensus data to the blockchain:

```bash
# Set environment variables
export PROJECT="YourProjectPublicKey"
export RELAYER="[0,0,0,0]"  # Relayer keypair
export MULTI_ORACLE_URL="http://localhost:3000/api/meter/multi-oracle"
export MIN_CONFIDENCE=0.8

# Run the relay
npx ts-node scripts/switchboard/relay_metrics_multi_oracle.ts
```

## Testing

### Mock Oracles

The system includes mock oracle endpoints for testing:

- `/api/meter/mock-oracle` - Secondary oracle with different baseline
- `/api/meter/external-oracle` - External service simulation with delays/failures

### Health Dashboard

Monitor oracle health through the analytics dashboard at `/analytics` (admin only).

## Security Considerations

1. **Provider Authentication**: Implement API key authentication for oracle endpoints
2. **Data Validation**: Validate incoming data formats and ranges
3. **Rate Limiting**: Implement rate limiting on oracle endpoints
4. **Audit Logging**: Log all oracle interactions for audit trails
5. **Circuit Breakers**: Automatically disable failing providers

## Performance

- Concurrent fetching from multiple providers
- Configurable timeouts and retry logic
- Automatic cleanup of old readings
- Performance monitoring integration

## Monitoring

The system integrates with the existing monitoring infrastructure:

- Error tracking for failed oracle requests
- Performance metrics for response times
- Health status exposed via API endpoints
- Real-time dashboard in analytics section

## Future Enhancements

1. **Cryptographic Proofs**: Add cryptographic proofs for data authenticity
2. **Staking Mechanism**: Implement oracle staking for reputation
3. **Cross-Chain Oracles**: Support oracles from different blockchains
4. **Machine Learning**: Use ML for better outlier detection
5. **Decentralized Governance**: Community governance for oracle management
