# 🚀 EmpowerGRID Platform - Complete Deployment Guide

**Version**: 1.0.0  
**Date**: October 10, 2025  
**Status**: Production Ready

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Blockchain Configuration](#blockchain-configuration)
5. [Application Deployment](#application-deployment)
6. [Phase-by-Phase Verification](#phase-by-phase-verification)
7. [Post-Deployment Tasks](#post-deployment-tasks)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **Solana CLI**: v1.16.0 or higher
- **Anchor**: v0.28.0 or higher
- **Git**: Latest version

### Required Accounts
- Solana wallet with SOL for deployment
- PostgreSQL database instance
- (Optional) Switchboard Oracle account
- (Optional) Realms DAO account

### System Requirements
- **Development**: 8GB RAM, 20GB disk space
- **Production**: 16GB RAM, 50GB disk space
- **Network**: Stable internet connection

---

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/empowergrid_project.git
cd empowergrid_project
```

### 2. Install Dependencies

#### Backend (Next.js)
```bash
cd app
npm install
```

#### Blockchain (Solana/Anchor)
```bash
cd programs/empower_grid
cargo build-bpf
```

### 3. Configure Environment Variables

Create `.env` file in `app/` directory:

```env
# Database Configuration
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"

# Solana Configuration
SOLANA_NETWORK="mainnet-beta"  # or "devnet" for testing
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
PROGRAM_ID="Your_Program_ID_Here"

# Switchboard Oracle (Phase 8)
SWITCHBOARD_PROGRAM_ID="SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f"
SWITCHBOARD_FEED_ADDRESS="Your_Feed_Address"

# API Keys (Optional)
NEXT_PUBLIC_API_URL="https://api.empowergrid.com"

# Security (Phase 11)
JWT_SECRET="your-secure-jwt-secret-min-32-chars"
ENCRYPTION_KEY="your-encryption-key-32-chars"

# Admin Configuration
ADMIN_WALLET_ADDRESS="Your_Admin_Wallet_Address"
```

---

## Database Configuration

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE empowergrid;

# Create user (if needed)
CREATE USER empowergrid_user WITH PASSWORD 'secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE empowergrid TO empowergrid_user;

# Exit
\q
```

### 2. Run Prisma Migrations

```bash
cd app

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

### 3. Verify Database Schema

```bash
# Check all tables created
npx prisma studio

# Or use psql
psql -U empowergrid_user -d empowergrid -c "\dt"
```

**Expected Tables** (from all phases):
- users
- projects
- fundings
- milestones
- escrow_contracts (Phase 7)
- fund_releases (Phase 7)
- disputes (Phase 7)
- oracle_feeds (Phase 8)
- verification_algorithms (Phase 8)
- fund_allocations (Phase 9)
- automated_transactions (Phase 9)
- proposals (Phase 10)
- votes (Phase 10)
- governance_settings (Phase 10)
- notifications (Phase 10)

---

## Blockchain Configuration

### 1. Deploy Solana Program

```bash
cd programs/empower_grid

# Build the program
anchor build

# Deploy to devnet (testing)
anchor deploy --provider.cluster devnet

# Deploy to mainnet (production)
anchor deploy --provider.cluster mainnet
```

**Note the Program ID** from deployment output.

### 2. Initialize Program Accounts

```bash
# Run initialization script
anchor run initialize
```

### 3. Configure Program Settings

Update `Anchor.toml`:
```toml
[programs.mainnet]
empower_grid = "YOUR_PROGRAM_ID"

[provider]
cluster = "mainnet"
wallet = "~/.config/solana/id.json"
```

---

## Application Deployment

### 1. Build Application

```bash
cd app

# Type check
npm run type-check

# Build for production
npm run build
```

### 2. Deploy Options

#### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

#### Option B: Docker
```bash
# Build Docker image
docker build -t empowergrid-app .

# Run container
docker run -p 3000:3000 --env-file .env empowergrid-app
```

#### Option C: Self-Hosted
```bash
# Use PM2 for process management
npm install -g pm2

# Start application
pm2 start npm --name "empowergrid" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

### 3. Configure Nginx (Self-Hosted)

```nginx
server {
    listen 80;
    server_name empowergrid.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Phase-by-Phase Verification

### Phase 7: Escrow System ✅

**Test Checklist**:
- [ ] Create escrow contract via API
- [ ] Deposit funds to contract
- [ ] Update contract parameters (multi-sig)
- [ ] Initiate emergency release
- [ ] Create and resolve dispute
- [ ] Verify contract upgrades
- [ ] Check admin dashboard

**API Endpoints to Test**:
```bash
# Create escrow
POST /api/escrow/create

# Deposit funds
POST /api/escrow/{contractId}/deposit

# Get contract details
GET /api/escrow/{contractId}

# Admin panel
GET /admin/dashboard
```

### Phase 8: Oracle Integration ✅

**Test Checklist**:
- [ ] Configure Switchboard feed
- [ ] Fetch oracle data
- [ ] Verify milestone with oracle
- [ ] Check oracle health status
- [ ] Test fallback mechanisms
- [ ] Monitor oracle reliability

**API Endpoints to Test**:
```bash
# Oracle feeds
GET /api/oracle/feeds

# Oracle data
GET /api/oracle/data/{feedId}

# Verify milestone
POST /api/oracle/verify-milestone

# Health check
GET /api/oracle/health
```

### Phase 9: Automated Releases ✅

**Test Checklist**:
- [ ] Configure automation rules
- [ ] Execute automated release
- [ ] Check release analytics
- [ ] Verify compliance report
- [ ] Test audit trail
- [ ] Monitor release status

**API Endpoints to Test**:
```bash
# Configure automation
POST /api/escrow/releases/configure-automation

# Execute release
POST /api/escrow/releases/{contractId}/execute

# Analytics
GET /api/escrow/releases/analytics

# Monitor
GET /escrow/releases/monitor
```

### Phase 10: Governance System ✅

**Test Checklist**:
- [ ] Create governance proposal
- [ ] Cast votes on proposal
- [ ] Check voting results
- [ ] Approve milestones via governance
- [ ] Test token-gated voting
- [ ] Verify Realms integration

**API Endpoints to Test**:
```bash
# Create proposal
POST /api/governance/proposals

# Vote
POST /api/governance/proposals/{id}/vote

# Get results
GET /api/projects/{id}/governance/results

# Governance UI
GET /governance/proposals
```

### Phase 11: Security & Admin Management ✅

**Test Checklist**:
- [ ] Test rate limiting
- [ ] Verify security headers
- [ ] Manage security policies
- [ ] Test validation rules
- [ ] Run security scan
- [ ] Admin user management
- [ ] Admin project management
- [ ] Admin transaction management

**API Endpoints to Test**:
```bash
# Security policies
GET /api/admin/security/policies

# Rate limits
GET /api/admin/security/rate-limits

# User management
GET /api/admin/users

# Projects
GET /api/admin/projects

# Transactions
GET /api/admin/transactions
```

### Phase 12: Database Management ✅

**Test Checklist**:
- [ ] Check database status widget
- [ ] View connection details
- [ ] Test database connection
- [ ] Monitor active sessions
- [ ] Track database size
- [ ] Verify connection pool

**API Endpoints to Test**:
```bash
# Database status
GET /api/database/status

# Connection details
GET /api/database/connection

# Test connection
POST /api/database/connection

# Admin panel
GET /admin/database
```

---

## Post-Deployment Tasks

### 1. Security Configuration

```bash
# Enable HTTPS (Let's Encrypt)
sudo certbot --nginx -d empowergrid.com

# Configure firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Set up SSL/TLS for PostgreSQL
# Add to postgresql.conf:
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
```

### 2. Monitoring Setup

#### Application Monitoring
```bash
# Install monitoring tools
npm install @sentry/nextjs

# Configure Sentry
npx @sentry/wizard -i nextjs
```

#### Database Monitoring
```bash
# Install pg_stat_statements
CREATE EXTENSION pg_stat_statements;

# Enable in postgresql.conf
shared_preload_libraries = 'pg_stat_statements'
```

#### Server Monitoring
```bash
# Install monitoring agent
sudo apt-get install prometheus-node-exporter
```

### 3. Backup Configuration

```bash
# Database backups (cron job)
0 2 * * * pg_dump empowergrid > /backups/empowergrid_$(date +\%Y\%m\%d).sql

# Application backups
0 3 * * * tar -czf /backups/app_$(date +\%Y\%m\%d).tar.gz /path/to/app
```

### 4. Create Admin User

```bash
# Using Prisma Studio or SQL
INSERT INTO users (id, username, email, wallet_address, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin',
  'admin@empowergrid.com',
  'YOUR_ADMIN_WALLET_ADDRESS',
  'ADMIN',
  NOW(),
  NOW()
);
```

### 5. Test All Features

Use the comprehensive test suite:
```bash
# Run all tests
npm run test

# E2E tests
npm run test:e2e

# Load tests
npm run test:load
```

---

## Troubleshooting

### Database Connection Issues

**Problem**: `Error: P1001: Can't reach database server`

**Solution**:
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check firewall
sudo ufw status
```

### Solana Program Deployment Fails

**Problem**: `Error: Insufficient funds`

**Solution**:
```bash
# Check wallet balance
solana balance

# Airdrop SOL (devnet only)
solana airdrop 2

# Check network
solana config get
```

### Build Errors

**Problem**: TypeScript errors during build

**Solution**:
```bash
# Clear cache
rm -rf .next node_modules

# Reinstall dependencies
npm install

# Regenerate Prisma
npx prisma generate

# Type check
npm run type-check
```

### High Memory Usage

**Problem**: Application consuming too much memory

**Solution**:
```javascript
// Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start

// Or in package.json
"scripts": {
  "start": "NODE_OPTIONS='--max-old-space-size=4096' next start"
}
```

### Rate Limiting Issues

**Problem**: Too many 429 responses

**Solution**:
```typescript
// Adjust rate limits in:
// app/lib/middleware/rateLimitMiddleware.ts

const rateLimitConfig = {
  general: { limit: 200, window: 15 * 60 * 1000 }, // Increase from 100
  // ...
};
```

---

## Performance Optimization

### 1. Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_fundings_project ON fundings(project_id);
CREATE INDEX idx_milestones_project ON milestones(project_id);

-- Analyze tables
ANALYZE projects;
ANALYZE fundings;
ANALYZE milestones;

-- Vacuum database
VACUUM ANALYZE;
```

### 2. Application Optimization

```bash
# Enable Next.js optimizations
# In next.config.js:
module.exports = {
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    domains: ['your-cdn.com'],
  },
}
```

### 3. CDN Configuration

Use a CDN for static assets:
- Vercel CDN (automatic with Vercel)
- Cloudflare CDN
- AWS CloudFront

---

## Maintenance

### Daily Tasks
- [ ] Monitor error logs
- [ ] Check database size
- [ ] Verify backup completion
- [ ] Review security alerts

### Weekly Tasks
- [ ] Review application metrics
- [ ] Check for dependency updates
- [ ] Analyze slow queries
- [ ] Review user feedback

### Monthly Tasks
- [ ] Security audit
- [ ] Performance review
- [ ] Database optimization
- [ ] Backup testing
- [ ] Update dependencies

---

## Support & Resources

### Documentation
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Solana: https://docs.solana.com
- Anchor: https://www.anchor-lang.com

### Community
- Discord: [Your Discord Link]
- GitHub: [Your GitHub Repo]
- Email: support@empowergrid.com

---

## Conclusion

Congratulations! 🎉 Your EmpowerGRID platform is now deployed and ready for production use.

**Next Steps**:
1. Complete all verification checklists
2. Set up monitoring and alerts
3. Configure backups
4. Train your team
5. Launch! 🚀

For issues or questions, refer to the troubleshooting section or contact support.

---

**Document Version**: 1.0.0  
**Last Updated**: October 10, 2025  
**Maintained By**: EmpowerGRID DevOps Team

