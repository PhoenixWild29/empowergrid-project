# EmpowerGRID Platform

A comprehensive milestone-based escrow system for renewable energy projects on the Solana blockchain. This platform enables secure, transparent funding and milestone-gated releases for community-owned microgrid projects.

## 🚀 Features

### Core Blockchain Features
- **Milestone-Based Escrow**: Secure funding with automatic releases based on verified energy production metrics
- **Solana Integration**: Built on Solana blockchain using Anchor framework for high-performance transactions
- **Oracle Integration**: Switchboard-powered metric verification for trustless milestone validation
- **Governance Integration**: Realms DAO integration for decentralized project governance

### Application Features
- **Wallet Authentication**: Secure authentication using Phantom and other Solana wallets
- **User Management**: Comprehensive user profiles with reputation system and role-based permissions
- **Project Management**: Full project lifecycle management with funding tracking and milestone monitoring
- **Database Integration**: PostgreSQL with Prisma ORM for persistent data storage
- **Real-time Monitoring**: Comprehensive logging, error tracking, and performance monitoring
- **Responsive UI**: Modern React/Next.js interface with Tailwind CSS

### Developer Experience
- **Type Safety**: Full TypeScript implementation with generated types
- **Testing Suite**: Comprehensive unit, integration, and E2E tests
- **CI/CD Pipeline**: Automated testing, building, and deployment with GitHub Actions
- **Docker Support**: Containerized deployment with Docker Compose
- **Monitoring Dashboard**: Real-time system monitoring and error tracking

## 📁 Project Structure

```
empowergrid/
├── programs/empower_grid/        # Anchor program (Rust)
│   ├── Anchor.toml              # Anchor configuration
│   ├── Cargo.toml               # Rust dependencies
│   └── src/lib.rs               # Program logic
├── app/                         # Next.js application
│   ├── components/              # React components
│   ├── lib/                     # Utilities and services
│   │   ├── auth/               # Authentication system
│   │   ├── database/           # Database layer
│   │   ├── monitoring/         # Monitoring and logging
│   │   └── repositories/       # Data access layer
│   ├── pages/                  # Next.js pages and API routes
│   ├── __tests__/              # Test suites
│   ├── prisma/                 # Database schema
│   ├── Dockerfile              # Docker configuration
│   └── package.json            # Node.js dependencies
├── scripts/                    # Utility scripts
├── monitoring/                 # Monitoring configuration
├── .github/workflows/          # CI/CD pipelines
├── docker-compose.yml          # Docker Compose setup
└── README.md                   # This file
```

## 🛠️ Tech Stack

### Backend
- **Blockchain**: Solana, Anchor Framework
- **Database**: PostgreSQL with Prisma ORM
- **API**: Next.js API Routes
- **Authentication**: Custom wallet-based auth with session management

### Frontend
- **Framework**: Next.js 14 with App Router
- **UI**: React 18, Tailwind CSS
- **State Management**: React Context + Reducer pattern
- **Forms**: React Hook Form with Zod validation

### DevOps & Monitoring
- **Testing**: Jest, React Testing Library, Playwright
- **CI/CD**: GitHub Actions
- **Containerization**: Docker, Docker Compose
- **Monitoring**: Winston logging, custom error tracking
- **Deployment**: Azure Web Apps, Azure Container Apps

## 🚀 Getting Started

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install) (for Anchor program)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation)
- Node.js ≥ 18 with npm
- PostgreSQL (local or cloud)
- Docker & Docker Compose (optional)

### 1. Clone and Install
```bash
git clone <repository-url>
cd empowergrid

# Install Node.js dependencies
cd app
npm install
```

### 2. Database Setup
```bash
# Set up PostgreSQL database
npm run setup:db

# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:db:push
```

### 3. Build and Deploy Anchor Program
```bash
cd ../programs/empower_grid
../../scripts/anchor/build_and_deploy.sh
```

### 4. Environment Configuration
Create `.env.local` in the `app` directory:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/empowergrid"

# Solana
RPC_URL="https://api.devnet.solana.com"
PROGRAM_ID="YourDeployedProgramID"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Monitoring
LOG_LEVEL="info"
NEXT_PUBLIC_APP_ENV="development"
```

### 5. Generate Types and Start Development
```bash
# Generate TypeScript types from IDL
npm run gen:types

# Start development server
npm run dev
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Types
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Individual functions and utilities
- **Integration Tests**: Database operations and API endpoints
- **E2E Tests**: Complete user workflows with Playwright

## 🐳 Docker Development

### Start Full Stack with Docker Compose
```bash
# From project root
docker-compose up -d

# Or from app directory
npm run docker:compose:up
```

### Build and Run Individual Services
```bash
# Build application container
npm run docker:build

# Run container
npm run docker:run
```

## 📊 Monitoring & Logging

### View Monitoring Dashboard
The application includes a comprehensive monitoring dashboard accessible to administrators at `/admin/monitoring`.

### Key Metrics Tracked
- **Performance**: Response times, database query performance, memory usage
- **Errors**: Error rates, error categorization, error resolution tracking
- **User Activity**: Authentication events, API usage patterns
- **System Health**: Database connections, external service status

### Log Files
- `logs/app.log`: General application logs
- `logs/error.log`: Error-specific logs
- `logs/exceptions.log`: Uncaught exceptions
- `logs/rejections.log`: Unhandled promise rejections

## 🚀 Deployment

### CI/CD Pipeline
The project includes GitHub Actions workflows for:
- **Automated Testing**: Unit, integration, and E2E tests
- **Security Scanning**: Dependency audits and SAST
- **Build & Deploy**: Automated deployment to staging/production

### Azure Deployment
```bash
# Deploy to Azure Web App
az webapp up --name empowergrid-app --resource-group empowergrid-rg --runtime "NODE:18-lts"
```

### Environment Variables for Production
```env
DATABASE_URL="postgresql://..."
RPC_URL="https://api.mainnet.solana.com"
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://yourdomain.com"
LOG_LEVEL="warn"
NEXT_PUBLIC_APP_ENV="production"
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - Wallet authentication
- `POST /api/auth/logout` - Session termination
- `GET /api/auth/session` - Current session info

### Project Endpoints
- `GET /api/projects` - List projects with filtering
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]/fund` - Fund a project

### User Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/stats` - Get user statistics

### Monitoring Endpoints
- `GET /api/metrics` - Prometheus metrics
- `GET /api/health` - Health check endpoint

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run prisma:studio   # Open Prisma Studio
npm run prisma:migrate  # Run database migrations

# Code Quality
npm run lint           # Run ESLint
npm run lint:fix       # Fix linting issues
npm run type-check     # TypeScript type checking

# Docker
npm run docker:build   # Build Docker image
npm run docker:run     # Run Docker container
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **Linting**: ESLint with Next.js configuration
- **Testing**: Minimum 80% code coverage required
- **Commits**: Conventional commit format

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Anchor Framework](https://www.anchor-lang.com/) for Solana development
- [Switchboard](https://switchboard.xyz/) for oracle services
- [Realms](https://realms.today/) for DAO governance
- [Next.js](https://nextjs.org/) for the React framework
- [Prisma](https://prisma.io/) for database tooling

---

**EmpowerGRID** - Democratizing energy investment through blockchain technology. 🌱⚡