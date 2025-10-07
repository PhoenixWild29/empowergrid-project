# EmpowerGRID Platform Architecture

## Overview

EmpowerGRID is a comprehensive milestone-based escrow system for renewable energy projects built on the Solana blockchain. The platform enables secure, transparent funding and milestone-gated releases for community-owned microgrid projects.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   Next.js API   │    │  Solana Program │
│   (React/TS)    │◄──►│   Routes        │◄──►│   (Anchor)      │
│                 │    │                 │    │                 │
│ - Dashboard     │    │ - Auth          │    │ - Escrow Logic  │
│ - Project Mgmt  │    │ - Projects      │    │ - Milestone Mgmt│
│ - User Profile  │    │ - Analytics     │    │ - Oracle Intg   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Database      │
                    │                 │
                    │ - Users         │
                    │ - Projects      │
                    │ - Transactions  │
                    │ - Analytics     │
                    └─────────────────┘
```

## Component Architecture

### Frontend Architecture

#### Technology Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI Library**: React 18 with custom components
- **Styling**: Tailwind CSS
- **State Management**: React Context + useReducer
- **Forms**: React Hook Form with Zod validation

#### Component Structure

```
components/
├── ui/                    # Reusable UI components
│   ├── button.tsx        # Button component
│   ├── card.tsx          # Card component
│   ├── tabs.tsx          # Tab navigation
│   └── ...
├── analytics/            # Analytics dashboard components
│   ├── AnalyticsDashboard.tsx
│   ├── MetricCard.tsx
│   ├── ProjectAnalyticsChart.tsx
│   └── ...
├── auth/                 # Authentication components
├── dashboard/            # Dashboard components
├── governance/           # Governance components
└── oracles/              # Oracle health components
```

#### Key Components

**AnalyticsDashboard**
- Main analytics interface
- Displays key metrics and charts
- Integrates with analytics service
- Handles loading and error states

**Error Boundaries**
- `ErrorBoundary`: Catches React errors
- `AsyncErrorBoundary`: Handles async operation errors
- `NetworkErrorBoundary`: Manages network failures
- `SuspenseBoundary`: Handles loading states

### Backend Architecture

#### API Routes Structure

```
pages/api/
├── auth/                 # Authentication endpoints
│   ├── login.ts         # Wallet authentication
│   ├── logout.ts        # Session termination
│   └── session.ts       # Session management
├── projects/            # Project management
│   ├── index.ts         # List/create projects
│   └── [id]/            # Project-specific operations
├── users/               # User management
├── analytics/           # Analytics data
├── governance/          # DAO governance
├── meter/               # Energy meter readings
└── actions/             # Solana Actions
```

#### Service Layer

```
lib/services/
├── analyticsService.ts   # Analytics data aggregation
├── authService.ts       # Authentication logic
├── projectService.ts    # Project business logic
└── userService.ts       # User management
```

### Database Architecture

#### Schema Design

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  wallet_address VARCHAR(44) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(255),
  role user_role NOT NULL DEFAULT 'FUNDER',
  reputation DECIMAL(10,2) DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  status project_status DEFAULT 'ACTIVE',
  target_amount DECIMAL(20,2) NOT NULL,
  current_amount DECIMAL(20,2) DEFAULT 0,
  creator_id UUID REFERENCES users(id),
  program_id VARCHAR(44),
  project_pda VARCHAR(44),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Milestones table
CREATE TABLE milestones (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_value DECIMAL(10,2),
  reward_amount DECIMAL(20,2),
  status milestone_status DEFAULT 'PENDING',
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Fundings table
CREATE TABLE fundings (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  funder_id UUID REFERENCES users(id),
  amount DECIMAL(20,2) NOT NULL,
  transaction_hash VARCHAR(88),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Database Relationships

```
Users (1) ──── (M) Projects
   │                │
   │                │
   └── (1) ──── (M) Fundings
                     │
                     │
Projects (1) ──── (M) Milestones
```

### Blockchain Architecture

#### Solana Program Structure

```
programs/empower_grid/
├── Anchor.toml              # Anchor configuration
├── Cargo.toml              # Rust dependencies
└── src/
    ├── lib.rs              # Program entry point
    ├── instructions/       # Program instructions
    │   ├── create_project.rs
    │   ├── fund_project.rs
    │   ├── release_milestone.rs
    │   └── claim_refund.rs
    ├── state/              # Program state accounts
    │   ├── project.rs
    │   ├── milestone.rs
    │   └── escrow.rs
    └── errors.rs           # Custom error types
```

#### Program Accounts

**Project Account**
```rust
#[account]
pub struct Project {
    pub creator: Pubkey,
    pub title: String,
    pub description: String,
    pub target_amount: u64,
    pub current_amount: u64,
    pub milestone_count: u8,
    pub status: ProjectStatus,
    pub created_at: i64,
    pub bump: u8,
}
```

**Escrow Account**
```rust
#[account]
pub struct Escrow {
    pub project: Pubkey,
    pub funder: Pubkey,
    pub amount: u64,
    pub released: bool,
    pub bump: u8,
}
```

#### Program Instructions

1. **Create Project**: Initialize project account and PDAs
2. **Fund Project**: Transfer SOL to escrow account
3. **Release Milestone**: Transfer funds to creator (oracle verified)
4. **Claim Refund**: Return funds to funder (project failed)

### Security Architecture

#### Authentication & Authorization

**Wallet-Based Authentication**
- Phantom/Solana wallet integration
- Message signing for verification
- Session management with JWT tokens
- Role-based access control (FUNDER, CREATOR, ADMIN)

**Security Measures**
- Input validation with Zod schemas
- SQL injection prevention with Prisma
- XSS protection with Next.js built-ins
- CSRF protection with NextAuth.js
- Rate limiting on API endpoints

#### Data Protection

**Encryption**
- Sensitive data encrypted at rest
- TLS 1.3 for data in transit
- Secure key management for blockchain operations

**Access Control**
- Row Level Security (RLS) in PostgreSQL
- API endpoint authorization checks
- File upload restrictions and validation

### Monitoring & Observability

#### Application Monitoring

**Winston Logging**
```javascript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/app.log' }),
    new winston.transports.Console()
  ]
});
```

**Error Tracking**
- Custom error boundary components
- Centralized error logging
- User-friendly error messages
- Error reporting system

#### Performance Monitoring

**Key Metrics**
- Response times
- Database query performance
- Memory usage
- API endpoint usage
- Blockchain transaction success rates

### Deployment Architecture

#### Containerized Deployment

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://db:5432/empowergrid
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=empowergrid
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
```

#### Cloud Architecture (Azure)

```
┌─────────────────┐    ┌─────────────────┐
│   Azure Front   │    │  Azure Database │
│   Door          │    │  for PostgreSQL │
│                 │    │                 │
│ - CDN           │    │ - Users         │
│ - WAF           │    │ - Projects      │
│ - Load Balancer │    │ - Transactions  │
└─────────────────┘    └─────────────────┘
         │                       │
         │                       │
┌─────────────────┐    ┌─────────────────┐
│ Azure Container │    │   Azure Cache   │
│   Apps          │    │   for Redis     │
│                 │    │                 │
│ - Next.js App   │    │ - Session cache │
│ - API Routes    │    │ - API responses │
└─────────────────┘    └─────────────────┘
```

### Scalability Considerations

#### Horizontal Scaling
- Stateless API design
- Database connection pooling
- Redis caching layer
- CDN for static assets

#### Performance Optimizations
- Database indexing strategy
- Query optimization with Prisma
- Image optimization with Next.js
- Code splitting and lazy loading

### Development Workflow

#### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:ci

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit --audit-level high
      - run: npm run security-scan
```

#### Development Environment

**Local Development Setup**
```bash
# Install dependencies
npm install

# Setup database
npm run setup:db
npm run prisma:generate

# Generate types
npm run gen:types

# Start development server
npm run dev
```

**Code Quality Tools**
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type checking
- Jest for unit testing
- Playwright for E2E testing

This architecture provides a robust, scalable foundation for the EmpowerGRID platform, enabling secure and transparent renewable energy project funding on the Solana blockchain.