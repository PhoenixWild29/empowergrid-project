# 🚀 EmpowerGRID Codebase Overview

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Directory Structure](#directory-structure)
4. [Core Components](#core-components)
5. [API Reference](#api-reference)
6. [Database Schema](#database-schema)
7. [Blockchain Integration](#blockchain-integration)
8. [Mobile Application](#mobile-application)
9. [Deployment & Infrastructure](#deployment--infrastructure)
10. [Development Setup](#development-setup)
11. [Contributing Guidelines](#contributing-guidelines)

---

## 🎯 Project Overview

**EmpowerGRID** is a decentralized energy project platform that connects sustainable energy project creators with investors through blockchain technology. The platform enables:

- **Project Discovery**: Browse and fund renewable energy projects
- **Decentralized Governance**: Community-driven decision making
- **Portfolio Management**: Track investments and returns
- **Real-time Analytics**: Performance metrics and insights
- **Multi-Oracle Support**: Reliable data aggregation
- **Cross-Platform Access**: Web and mobile applications

### Key Features
- 🔐 **Wallet Authentication**: Solana-based wallet integration
- 💰 **Project Funding**: Direct investment in energy projects
- 🏛️ **DAO Governance**: Proposal creation and voting
- 📊 **Analytics Dashboard**: Real-time metrics and reporting
- 📱 **Mobile App**: Native iOS/Android experience
- 🔄 **Multi-Oracle System**: Decentralized data validation
- 🌐 **Cross-Platform**: Web + Mobile unified experience

---

## 🏗️ Architecture & Technology Stack

### Frontend (Web)
- **Framework**: Next.js 13 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + Zustand
- **UI Components**: Material-UI (MUI) + Custom Components
- **Charts**: Chart.js + React-Chartjs-2
- **Forms**: React Hook Form + Zod validation

### Backend & APIs
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Solana wallet adapter
- **API**: RESTful with GraphQL support
- **Caching**: Redis (planned)
- **File Storage**: AWS S3 or IPFS

### Blockchain
- **Network**: Solana
- **Framework**: Anchor
- **Language**: Rust
- **Wallet Integration**: Phantom, Solflare
- **Smart Contracts**: Energy project funding, governance tokens
- **Oracles**: Custom multi-oracle system for energy data

### Mobile
- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: React Context
- **UI Components**: React Native Paper
- **Wallet**: Solana Mobile Wallet Adapter
- **Build System**: Expo Application Services (EAS)

### DevOps & Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes (planned)
- **CI/CD**: GitHub Actions
- **Hosting**: Vercel (web), EAS (mobile)
- **Monitoring**: Winston logging, error tracking
- **Database Hosting**: Supabase or Railway

### Development Tools
- **Package Manager**: npm
- **Version Control**: Git
- **Code Quality**: ESLint, Prettier
- **Testing**: Jest, React Testing Library
- **Documentation**: TypeDoc, MDX

---

## 📁 Directory Structure

```
empowergrid_project/
├── app/                          # Next.js web application
│   ├── actions/                  # Server actions
│   ├── api/                      # API routes
│   ├── components/               # React components
│   ├── contexts/                 # React contexts
│   ├── hooks/                    # Custom hooks
│   ├── lib/                      # Utility libraries
│   ├── pages/                    # Next.js pages (App Router)
│   ├── styles/                   # Global styles
│   ├── types/                    # TypeScript definitions
│   └── utils/                    # Helper functions
├── mobile/                       # React Native mobile app
│   ├── components/               # React Native components
│   ├── contexts/                 # React contexts
│   ├── navigation/               # Navigation configuration
│   ├── screens/                  # App screens
│   ├── services/                 # API services
│   └── utils/                    # Helper functions
├── programs/                     # Solana programs (Anchor)
│   └── empower_grid/
│       ├── src/
│       │   ├── lib.rs           # Main program logic
│       │   ├── instructions/    # Program instructions
│       │   ├── state/           # Program state structs
│       │   └── errors.rs        # Custom errors
│       ├── Anchor.toml          # Anchor configuration
│       └── Cargo.toml           # Rust dependencies
├── idl/                         # Program interface definitions
│   └── empower_grid.json        # Anchor IDL file
├── scripts/                      # Build and deployment scripts
│   ├── anchor/                  # Solana program scripts
│   └── switchboard/             # Oracle integration scripts
├── docs/                        # Documentation (planned)
├── tests/                       # Test suites (planned)
├── docker/                      # Docker configurations
├── .github/                     # GitHub configurations
│   └── workflows/               # CI/CD pipelines
├── package.json                 # Root dependencies
├── turbo.json                   # Monorepo configuration
└── README.md                    # Project documentation
```

---

## 🧩 Core Components

### Web Application (`app/`)

#### Authentication System
- **Location**: `app/components/auth/`, `app/contexts/AuthContext.tsx`
- **Purpose**: Wallet-based user authentication
- **Key Components**:
  - `WalletConnectButton`: Connect Phantom/Solflare wallets
  - `AuthGuard`: Protect authenticated routes
  - `UserProfile`: Display user information
- **Features**: Session persistence, role-based access

#### Project Management
- **Location**: `app/components/projects/`, `app/pages/projects/`
- **Purpose**: Project discovery, creation, and management
- **Key Components**:
  - `ProjectCard`: Display project information
  - `ProjectDetails`: Detailed project view
  - `ProjectForm`: Create/edit projects
  - `FundingProgress`: Visual funding status
- **Features**: Search, filtering, milestone tracking

#### Governance System
- **Location**: `app/components/governance/`, `app/pages/governance/`
- **Purpose**: Decentralized decision making
- **Key Components**:
  - `ProposalCard`: Display governance proposals
  - `VotingInterface`: Cast votes on proposals
  - `ProposalForm`: Create new proposals
  - `GovernanceStats`: Voting participation metrics
- **Features**: Proposal types, quorum requirements, voting power

#### Analytics Dashboard
- **Location**: `app/components/analytics/`, `app/pages/analytics/`
- **Purpose**: Platform and user performance metrics
- **Key Components**:
  - `MetricsChart`: Data visualization
  - `KPICard`: Key performance indicators
  - `ExportTools`: Data export functionality
  - `RealTimeUpdates`: Live data feeds
- **Features**: Custom date ranges, multiple chart types

#### Portfolio Management
- **Location**: `app/components/portfolio/`, `app/pages/portfolio/`
- **Purpose**: Investment tracking and returns
- **Key Components**:
  - `PortfolioOverview`: Total value and performance
  - `InvestmentList`: Individual investments
  - `ReturnsCalculator`: Performance calculations
  - `AssetAllocation`: Portfolio distribution
- **Features**: Real-time valuations, historical data

### Mobile Application (`mobile/`)

#### Core Screens
- **HomeScreen**: Dashboard with key metrics
- **ProjectsScreen**: Browse and fund projects
- **GovernanceScreen**: Vote on proposals
- **ProfileScreen**: User profile and settings
- **PortfolioScreen**: Investment tracking
- **NotificationsScreen**: Push notifications
- **WalletScreen**: Wallet management

#### Navigation
- **AppNavigator**: Main tab navigation
- **ProjectsStack**: Project detail navigation
- **Theme Integration**: Dark/light mode support

#### Services
- **WalletContext**: Solana wallet integration
- **ThemeContext**: App theming
- **NotificationService**: Push notification handling

### Blockchain Programs (`programs/`)

#### Main Program (`empower_grid/`)
- **Location**: `programs/empower_grid/src/`
- **Purpose**: Core platform smart contracts
- **Modules**:
  - `lib.rs`: Program entry point
  - `instructions/`: Business logic functions
  - `state/`: Account data structures
  - `errors.rs`: Custom error types

#### Key Instructions
- `initialize_platform`: Set up platform accounts
- `create_project`: Register new energy projects
- `fund_project`: Process investments
- `create_proposal`: Submit governance proposals
- `cast_vote`: Record votes
- `distribute_returns`: Pay out investment returns

---

## 🔌 API Reference

### REST API Endpoints

#### Authentication
```
POST   /api/auth/connect        # Connect wallet
POST   /api/auth/disconnect     # Disconnect wallet
GET    /api/auth/session        # Get session info
```

#### Projects
```
GET    /api/projects            # List projects
GET    /api/projects/:id        # Get project details
POST   /api/projects            # Create project
PUT    /api/projects/:id        # Update project
POST   /api/projects/:id/fund   # Fund project
```

#### Governance
```
GET    /api/governance/proposals          # List proposals
GET    /api/governance/proposals/:id      # Get proposal details
POST   /api/governance/proposals          # Create proposal
POST   /api/governance/proposals/:id/vote # Cast vote
```

#### Users
```
GET    /api/users/:address              # Get user profile
GET    /api/users/:address/portfolio    # Get user portfolio
GET    /api/users/:address/activities   # Get user activity
PUT    /api/users/:address/settings     # Update user settings
```

#### Analytics
```
GET    /api/analytics/overview          # Platform overview
GET    /api/analytics/projects          # Project analytics
GET    /api/analytics/users             # User analytics
GET    /api/analytics/export            # Export data
```

#### Wallet
```
GET    /api/wallet/:address/balance     # Get wallet balance
GET    /api/wallet/:address/transactions # Get transactions
POST   /api/wallet/transfer             # Transfer tokens
```

### WebSocket Events
```
project:updated     # Real-time project updates
proposal:created    # New governance proposals
vote:cast          # Vote cast notifications
funding:received   # Funding confirmations
```

---

## 🗄️ Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(44) UNIQUE NOT NULL,
  username VARCHAR(50),
  email VARCHAR(255),
  bio TEXT,
  avatar_url VARCHAR(500),
  reputation_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  creator_id UUID REFERENCES users(id),
  category VARCHAR(50) NOT NULL,
  funding_goal DECIMAL(20,2) NOT NULL,
  current_funding DECIMAL(20,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  location VARCHAR(100),
  contract_address VARCHAR(44),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### investments
```sql
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  amount DECIMAL(20,2) NOT NULL,
  tokens_received DECIMAL(20,2),
  invested_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active'
);
```

#### governance_proposals
```sql
CREATE TABLE governance_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  proposer_id UUID REFERENCES users(id),
  proposal_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  quorum_required INTEGER,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### votes
```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES governance_proposals(id),
  voter_id UUID REFERENCES users(id),
  vote_type VARCHAR(10) NOT NULL, -- 'for' or 'against'
  voting_power INTEGER DEFAULT 1,
  voted_at TIMESTAMP DEFAULT NOW()
);
```

### Analytics Tables

#### metrics
```sql
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(50) NOT NULL,
  value DECIMAL(20,2),
  metadata JSONB,
  recorded_at TIMESTAMP DEFAULT NOW()
);
```

#### transactions
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  transaction_type VARCHAR(50) NOT NULL,
  amount DECIMAL(20,2),
  currency VARCHAR(10) DEFAULT 'SOL',
  transaction_hash VARCHAR(88),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ⛓️ Blockchain Integration

### Solana Program Structure

#### Program ID
```
empower_grid: [Program Public Key]
```

#### Account Types

##### Platform Account
```rust
#[account]
pub struct Platform {
    pub authority: Pubkey,
    pub total_projects: u64,
    pub total_funding: u64,
    pub governance_enabled: bool,
}
```

##### Project Account
```rust
#[account]
pub struct Project {
    pub creator: Pubkey,
    pub title: [u8; 200],
    pub funding_goal: u64,
    pub current_funding: u64,
    pub status: ProjectStatus,
    pub created_at: i64,
}
```

##### Investment Account
```rust
#[account]
pub struct Investment {
    pub investor: Pubkey,
    pub project: Pubkey,
    pub amount: u64,
    pub tokens_received: u64,
    pub invested_at: i64,
}
```

### Key Instructions

#### Initialize Platform
```rust
pub fn initialize_platform(ctx: Context<InitializePlatform>) -> Result<()>
```

#### Create Project
```rust
pub fn create_project(
    ctx: Context<CreateProject>,
    title: String,
    funding_goal: u64,
) -> Result<()>
```

#### Fund Project
```rust
pub fn fund_project(
    ctx: Context<FundProject>,
    amount: u64,
) -> Result<()>
```

#### Governance Functions
```rust
pub fn create_proposal(
    ctx: Context<CreateProposal>,
    title: String,
    description: String,
) -> Result<()>

pub fn cast_vote(
    ctx: Context<CastVote>,
    vote_type: VoteType,
) -> Result<()>
```

### Multi-Oracle System

#### Oracle Integration
- **Switchboard**: Decentralized data feeds
- **Pyth Network**: Price feeds
- **Custom Oracles**: Energy-specific data
- **Consensus Mechanism**: Multi-source validation

#### Data Sources
- Energy generation metrics
- Carbon credit calculations
- Weather data for solar/wind
- Grid stability indicators
- Equipment performance data

---

## 📱 Mobile Application

### Architecture
- **Framework**: React Native 0.72.6 with Expo
- **Navigation**: React Navigation 6 with Stack and Tab navigators
- **State**: React Context for global state
- **Styling**: React Native Paper + Custom styles

### Key Screens

#### HomeScreen
- Platform overview metrics
- Recent projects and activity
- Quick actions (fund, vote, browse)

#### ProjectsScreen
- Project discovery with search/filtering
- Project cards with funding progress
- Navigation to detailed project views

#### ProjectDetailsScreen
- Comprehensive project information
- Funding interface with quick amounts
- Team information and milestones
- Investment action buttons

#### GovernanceScreen
- Active proposals listing
- Voting interface for each proposal
- Proposal filtering (active, passed, rejected)

#### PortfolioScreen
- Investment overview and performance
- Individual investment tracking
- Asset allocation visualization
- Returns calculation and display

#### NotificationsScreen
- Push notification management
- Notification history
- Settings for notification preferences

#### WalletScreen
- Wallet balance and address display
- Transaction history
- NFT showcase
- Quick actions (send, receive, swap)

### Navigation Structure
```
Tab Navigator
├── Home (Stack)
├── Projects (Stack)
│   ├── Projects List
│   └── Project Details
├── Portfolio (Screen)
├── Governance (Screen)
└── Profile (Screen)
```

### Key Features
- **Wallet Integration**: Phantom wallet connectivity
- **Real-time Updates**: Live data synchronization
- **Offline Support**: Cached data for offline viewing
- **Push Notifications**: Expo notifications service
- **Biometric Authentication**: Device security integration
- **Theme Support**: Dark/light mode switching

---

## 🚀 Deployment & Infrastructure

### Build System
- **EAS Build**: Expo Application Services
- **Multi-platform**: iOS, Android, Web
- **Build Profiles**: Development, Preview, Production

### CI/CD Pipeline
- **GitHub Actions**: Automated workflows
- **Build Triggers**: Push to main, version tags
- **Testing**: Automated test execution
- **Deployment**: App store submissions

### App Store Deployment

#### iOS (App Store Connect)
- Bundle ID: `com.empowergrid.mobile`
- Build submission via EAS
- Review process: 1-3 days
- TestFlight for beta testing

#### Android (Google Play)
- Package name: `com.empowergrid.mobile`
- Bundle submission via EAS
- Review process: Hours to days
- Internal/Alpha/Beta testing tracks

### Environment Configuration
```env
# API
API_BASE_URL=https://api.empowergrid.com
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Authentication
EXPO_TOKEN=expo_access_token
APPLE_ID=apple_developer_id
APPLE_PASSWORD=app_specific_password
APP_STORE_ID=app_store_connect_id

# Analytics
ANALYTICS_KEY=analytics_service_key
```

### Monitoring & Logging
- **Winston**: Structured logging
- **Error Tracking**: Sentry integration
- **Performance Monitoring**: Custom metrics
- **Crash Reporting**: Platform-specific services

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Expo CLI
- EAS CLI (for mobile deployment)

### Local Development

#### Web Application
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Start development server
npm run dev

# Build for production
npm run build
```

#### Mobile Application
```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on specific platform
npm run ios    # iOS simulator
npm run android # Android emulator
npm run web    # Web browser
```

#### Blockchain Programs
```bash
cd programs/empower_grid

# Install Anchor
npm i -g @project-serum/anchor-cli

# Build program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### Database Setup
```bash
# Install Prisma CLI
npm install -g prisma

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- components/auth
```

### Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

---

## 🤝 Contributing Guidelines

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb config with React rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Structured commit messages

### Testing Requirements
- **Unit Tests**: Minimum 80% coverage
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Critical user flows
- **Mobile Tests**: iOS and Android device testing

### Documentation
- **Code Comments**: JSDoc for functions and classes
- **README Updates**: Feature documentation
- **API Documentation**: OpenAPI/Swagger specs
- **Changelog**: Keep CHANGELOG.md updated

### Security
- **Dependency Scanning**: Regular security audits
- **Code Reviews**: Required for all PRs
- **Secrets Management**: Never commit sensitive data
- **Vulnerability Disclosure**: Responsible disclosure policy

### Release Process
1. **Version Bump**: Update version in package.json
2. **Changelog**: Document changes
3. **Testing**: Full test suite passes
4. **Code Review**: Approved by maintainers
5. **Deployment**: Automated via CI/CD
6. **Announcement**: Release notes published

---

## 📊 Project Metrics

### Codebase Statistics
- **Lines of Code**: ~15,000+ (TypeScript/React)
- **Test Coverage**: Target 80%+
- **Performance**: Lighthouse score >90
- **Bundle Size**: <200KB (web), <50MB (mobile)

### Architecture Principles
- **Modular**: Component-based architecture
- **Scalable**: Microservices-ready design
- **Secure**: Defense-in-depth security
- **Maintainable**: Clean code principles
- **Testable**: Comprehensive test coverage

### Technology Choices Rationale
- **Next.js**: Full-stack React framework with excellent DX
- **TypeScript**: Type safety and better developer experience
- **Solana**: High-performance blockchain for DeFi applications
- **React Native**: Cross-platform mobile development
- **PostgreSQL**: Robust relational database for complex queries
- **Tailwind CSS**: Utility-first CSS for rapid UI development

---

## 🔮 Future Roadmap

### Phase 2 Features
- **AI-Powered Analytics**: Machine learning insights
- **Cross-Chain Support**: Multi-blockchain integration
- **NFT Marketplace**: Energy asset tokenization
- **DeFi Integration**: Yield farming and staking
- **IoT Integration**: Smart meter connectivity

### Technical Improvements
- **GraphQL API**: More flexible data fetching
- **Microservices**: Backend service decomposition
- **Advanced Caching**: Redis implementation
- **Real-time Updates**: WebSocket optimization
- **Progressive Web App**: Enhanced web experience

### Community Features
- **Social Features**: Project discussions and reviews
- **Referral Program**: User acquisition incentives
- **Educational Content**: Learning resources for users
- **API Access**: Third-party integrations

---

## 📞 Support & Resources

### Documentation
- [API Documentation](./docs/api.md)
- [Deployment Guide](./mobile/DEPLOYMENT.md)
- [Contributing Guide](./CONTRIBUTING.md)

### Community
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: General questions and community support
- **Discord**: Real-time community chat

### Development Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [React Native Docs](https://reactnative.dev/docs)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Solana Docs](https://docs.solana.com/)

---

*This document is automatically updated with each major release. Last updated: September 24, 2025*

---

## 📝 Quick Reference

### Useful Commands
```bash
# Development
npm run dev              # Start web development server
npm run mobile:start     # Start mobile development server
npm run build           # Build for production

# Testing
npm test                # Run test suite
npm run test:coverage   # Run tests with coverage
npm run type-check      # TypeScript type checking

# Deployment
npm run deploy          # Deploy mobile app
npm run build:web       # Build web app for deployment

# Database
npx prisma migrate dev  # Run database migrations
npx prisma studio       # Open database GUI

# Blockchain
anchor build            # Build Solana programs
anchor deploy           # Deploy to blockchain
```

### Key Files
- `app/package.json` - Web app dependencies
- `mobile/package.json` - Mobile app dependencies
- `eas.json` - Mobile build configuration
- `prisma/schema.prisma` - Database schema
- `programs/empower_grid/src/lib.rs` - Main Solana program

### Environment Variables
- `.env` - Local development
- `.env.production` - Production environment
- `.env.staging` - Staging environment

This comprehensive overview should provide everything needed to understand, develop, and contribute to the EmpowerGRID platform. The codebase is designed for scalability, maintainability, and developer experience.