# Security Best Practices & Guidelines

## Overview

This document outlines the security measures, best practices, and guidelines implemented in the EmpowerGRID platform to ensure the protection of user funds, data privacy, and system integrity.

## Authentication & Authorization

### Wallet-Based Authentication

**Implementation Details:**
- Uses Solana wallet (Phantom) for user authentication
- Message signing verification for secure login
- JWT tokens for session management with 24-hour expiration
- Automatic session invalidation on wallet disconnection

**Security Benefits:**
- No password storage or management
- Cryptographic signature verification
- Decentralized identity management
- Protection against phishing attacks

### Role-Based Access Control (RBAC)

**User Roles:**
- **FUNDER**: Can view projects, fund projects, track investments
- **CREATOR**: Can create/manage projects, update milestones
- **ADMIN**: Full system access for maintenance and moderation

**Access Control Implementation:**
```typescript
// lib/auth/rbac.ts
export const PERMISSIONS = {
  CREATE_PROJECT: ['CREATOR', 'ADMIN'],
  FUND_PROJECT: ['FUNDER', 'ADMIN'],
  UPDATE_MILESTONE: ['CREATOR', 'ADMIN'],
  VIEW_ANALYTICS: ['FUNDER', 'CREATOR', 'ADMIN'],
  ADMIN_ACTIONS: ['ADMIN']
} as const;

export function hasPermission(userRole: UserRole, permission: string): boolean {
  return PERMISSIONS[permission]?.includes(userRole) ?? false;
}
```

## Input Validation & Sanitization

### Schema Validation with Zod

**API Input Validation:**
```typescript
// lib/validation/project.ts
import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(3).max(255).trim(),
  description: z.string().min(10).max(5000).trim(),
  category: z.enum(['SOLAR', 'WIND', 'HYDRO', 'GEOTHERMAL', 'BIOMASS']),
  targetAmount: z.number().positive().max(1000000), // Max 1M SOL
  milestones: z.array(milestoneSchema).min(1).max(10)
});

export const milestoneSchema = z.object({
  title: z.string().min(3).max(255).trim(),
  description: z.string().min(10).max(1000).trim(),
  targetValue: z.number().positive(),
  rewardAmount: z.number().positive()
});
```

**Benefits:**
- Type-safe input validation
- Automatic sanitization
- Clear error messages
- Protection against injection attacks

### File Upload Security

**Security Measures:**
- File type validation (images only)
- Size limits (max 5MB per file)
- Content scanning for malware
- Secure file naming with UUIDs
- CDN storage with access controls

```typescript
// lib/upload/security.ts
export const UPLOAD_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  scanForMalware: true,
  generateSecureName: true
};
```

## API Security

### Rate Limiting

**Implementation:**
```typescript
// lib/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // stricter limit for auth endpoints
  message: 'Too many authentication attempts, please try again later.',
});
```

**Rate Limits by Endpoint:**
- Authentication: 5 requests per 15 minutes
- Project creation: 10 requests per hour
- Funding operations: 20 requests per hour
- General API: 100 requests per 15 minutes

### CORS Configuration

**Secure CORS Setup:**
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGINS || 'https://empowergrid.com'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type,Authorization,X-Requested-With'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          }
        ]
      }
    ];
  },
};
```

### Security Headers

**Implemented Headers:**
```typescript
// lib/middleware/security.ts
export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self';
    connect-src 'self' https://api.mainnet-beta.solana.com;
    frame-ancestors 'none';
  `.replace(/\s+/g, ' ').trim()
};
```

## Database Security

### Connection Security

**PostgreSQL Configuration:**
```typescript
// lib/db/config.ts
export const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    require: true,
    rejectUnauthorized: true,
    ca: process.env.DB_SSL_CA
  },
  max: 20, // connection pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

### Row Level Security (RLS)

**RLS Policies:**
```sql
-- Enable RLS on tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Projects: Users can view all, creators can modify their own
CREATE POLICY "Projects are viewable by everyone" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their projects" ON projects
  FOR UPDATE USING (auth.uid() = creator_id);

-- Fundings: Users can view their own, creators can view project fundings
CREATE POLICY "Users can view their fundings" ON fundings
  FOR SELECT USING (auth.uid() = funder_id);

CREATE POLICY "Creators can view project fundings" ON fundings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = fundings.project_id
      AND projects.creator_id = auth.uid()
    )
  );
```

### Query Parameterization

**Prisma ORM Security:**
```typescript
// Secure query examples
const user = await prisma.user.findUnique({
  where: { id: userId }, // Automatically parameterized
  select: {
    id: true,
    username: true,
    // Exclude sensitive fields like email, wallet_address
  }
});

// Avoid raw SQL when possible
// If raw SQL is necessary, use parameterized queries
const projects = await prisma.$queryRaw`
  SELECT * FROM projects
  WHERE category = $1 AND status = $2
`, category, status;
```

## Blockchain Security

### Smart Contract Security

**Audit Considerations:**
- Code reviewed by certified auditors
- Formal verification of critical functions
- Comprehensive test coverage (>95%)
- Emergency pause functionality

**Key Security Features:**
```rust
// Emergency pause mechanism
#[derive(Accounts)]
pub struct PauseProgram<'info> {
    #[account(mut)]
    pub program_data: Account<'info, ProgramData>,
    #[account(
        constraint = program_data.authority == authority.key()
    )]
    pub authority: Signer<'info>,
}

pub fn pause_program(ctx: Context<PauseProgram>) -> Result<()> {
    let program_data = &mut ctx.accounts.program_data;
    program_data.paused = true;
    Ok(())
}
```

### Oracle Integration Security

**Switchboard Oracle Security:**
- Decentralized oracle network
- Cryptographic proof verification
- SLA guarantees for data accuracy
- Multi-source data aggregation

```typescript
// lib/oracles/switchboard.ts
export class SwitchboardClient {
  async verifyData(feedAddress: string, data: any): Promise<boolean> {
    const feed = new Feed(this.program, new PublicKey(feedAddress));
    const latestValue = await feed.fetchLatestValue();

    // Verify data integrity
    return this.verifySignature(latestValue);
  }
}
```

## Error Handling & Logging

### Secure Error Messages

**Error Response Format:**
```typescript
// lib/errors/apiErrors.ts
export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Safe error responses
export const errorHandler = (error: any) => {
  // Log full error details internally
  logger.error('API Error:', {
    error: error.message,
    stack: error.stack,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Return safe error to client
  if (error instanceof APIError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      // Include additional context only for operational errors
      ...(error.isOperational && { details: error.details })
    });
  }

  // Generic error for unknown errors
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};
```

### Logging Security

**Winston Configuration:**
```typescript
// lib/logging/config.ts
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Separate error log
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.transports.File.format.printf(info => {
          // Sanitize sensitive data
          const sanitized = { ...info };
          delete sanitized.password;
          delete sanitized.token;
          delete sanitized.walletKey;
          return JSON.stringify(sanitized);
        })
      )
    }),
    // General application log
    new winston.transports.File({ filename: 'logs/app.log' }),
    // Console for development
    ...(process.env.NODE_ENV === 'development' ? [
      new winston.transports.Console({
        format: winston.format.simple()
      })
    ] : [])
  ]
});
```

## Dependency Security

### Vulnerability Scanning

**Automated Security Checks:**
```yaml
# .github/workflows/security.yml
name: Security Scan
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1' # Weekly on Mondays

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level moderate

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Run CodeQL Analysis
        uses: github/codeql-action/init@v2
        with:
          languages: javascript

      - name: Autobuild
        uses: github/codeql-action/autobuild@v2

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
```

### Dependency Management

**Package Lock Security:**
- Use `package-lock.json` for reproducible builds
- Regular dependency updates with `npm audit fix`
- Automated PRs for dependency updates using Dependabot

**Dependency Review:**
```yaml
# .github/workflows/dependency-review.yml
name: Dependency Review
on: [pull_request]

permissions:
  contents: read

jobs:
  dependency-review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v3
      - name: Dependency Review
        uses: actions/dependency-review-action@v2
```

## Infrastructure Security

### Container Security

**Docker Security Best Practices:**
```dockerfile
# Use official base images
FROM node:18-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY --chown=nextjs:nodejs . .

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
```

### Cloud Security (Azure)

**Azure Security Configuration:**
- Azure Front Door with WAF (Web Application Firewall)
- Azure Key Vault for secrets management
- Azure Monitor for security monitoring
- Network security groups (NSGs)
- Azure Defender for cloud security

**Infrastructure as Code Security:**
```bicep
// infrastructure/main.bicep
resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    enabledForDeployment: false
    enabledForTemplateDeployment: false
    enabledForDiskEncryption: true
    enableRbacAuthorization: true
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenantId
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
    }
  }
}
```

## Monitoring & Incident Response

### Security Monitoring

**Key Security Metrics:**
- Failed authentication attempts
- Unusual API usage patterns
- Database access anomalies
- File upload attempts
- Rate limit violations

**Alert Configuration:**
```typescript
// lib/monitoring/security.ts
export const securityAlerts = {
  // Authentication failures
  authFailures: {
    threshold: 5,
    window: '5m',
    alert: 'High authentication failure rate detected'
  },

  // Suspicious API usage
  apiAbuse: {
    threshold: 1000,
    window: '1h',
    alert: 'Potential API abuse detected'
  },

  // Database anomalies
  dbAnomalies: {
    threshold: 10,
    window: '10m',
    alert: 'Database access anomaly detected'
  }
};
```

### Incident Response Plan

**Response Procedures:**
1. **Detection**: Automated monitoring alerts
2. **Assessment**: Security team evaluation within 15 minutes
3. **Containment**: Isolate affected systems
4. **Recovery**: Restore from clean backups
5. **Lessons Learned**: Post-incident review and improvements

**Communication Plan:**
- Internal security team notification
- User communication for data breaches
- Regulatory reporting as required
- Public disclosure timeline

## Compliance & Regulatory

### Data Protection

**GDPR Compliance:**
- Data minimization principles
- Right to erasure implementation
- Consent management for data processing
- Data portability features

**Data Retention:**
```typescript
// lib/privacy/dataRetention.ts
export const DATA_RETENTION = {
  userData: '7 years',      // Legal requirement
  transactionData: '10 years', // Financial records
  logs: '1 year',          // Security logs
  analytics: '2 years'     // Business analytics
};
```

### Financial Compliance

**Know Your Customer (KYC):**
- Wallet address verification
- Transaction monitoring
- Suspicious activity reporting
- AML compliance measures

## Security Testing

### Automated Security Testing

**Security Test Suite:**
```typescript
// tests/security.test.ts
describe('Security Tests', () => {
  test('SQL Injection Protection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const response = await request(app)
      .post('/api/projects')
      .send({ title: maliciousInput });

    expect(response.status).toBe(400);
  });

  test('XSS Protection', async () => {
    const xssPayload = '<script>alert("xss")</script>';
    const response = await request(app)
      .post('/api/projects')
      .send({ description: xssPayload });

    expect(response.body.description).not.toContain('<script>');
  });

  test('Rate Limiting', async () => {
    const requests = Array(101).fill().map(() =>
      request(app).get('/api/projects')
    );

    const responses = await Promise.all(requests);
    const tooManyRequests = responses.filter(r => r.status === 429);

    expect(tooManyRequests.length).toBeGreaterThan(0);
  });
});
```

### Penetration Testing

**Regular Testing Schedule:**
- Quarterly external penetration testing
- Monthly internal security assessments
- Continuous automated security scanning
- Code review security checks

## Security Training & Awareness

### Developer Security Training

**Required Training:**
- Secure coding practices
- OWASP Top 10 awareness
- Blockchain security fundamentals
- Incident response procedures

### Security Champions Program

**Program Structure:**
- Security champions in each development team
- Monthly security knowledge sharing
- Security tool training and best practices
- Bug bounty program participation

This comprehensive security framework ensures the EmpowerGRID platform maintains the highest standards of security for user funds and data protection.