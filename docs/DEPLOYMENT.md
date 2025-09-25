# Deployment Guide

This guide covers deploying the EmpowerGRID platform to various environments including development, staging, and production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Azure Deployment](#azure-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Environment Configuration](#environment-configuration)
- [Monitoring Setup](#monitoring-setup)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (optional, for caching)
- Docker & Docker Compose
- Git

### Cloud Resources
- Azure subscription (for Azure deployment)
- PostgreSQL database (Azure Database for PostgreSQL or AWS RDS)
- Redis cache (optional)
- Azure Container Registry (for containerized deployment)

### Tools
- Azure CLI (`az`)
- GitHub CLI (`gh`) - optional
- Docker CLI
- Node.js and npm

## Local Development

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd empowergrid

# Install dependencies
cd app
npm install

# Setup database
npm run setup:db
npm run prisma:generate
npm run prisma:db:push

# Start development server
npm run dev
```

### Development Environment Variables
Create `.env.local` in the `app` directory:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/empowergrid"

# Solana
RPC_URL="https://api.devnet.solana.com"
PROGRAM_ID="your-devnet-program-id"

# Authentication
NEXTAUTH_SECRET="dev-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Application
NEXT_PUBLIC_APP_ENV="development"
LOG_LEVEL="debug"

# Optional: External Services
REDIS_URL="redis://localhost:6379"
```

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Clone and navigate to project:**
```bash
git clone <repository-url>
cd empowergrid
```

2. **Create environment file:**
```bash
cp app/.env.example app/.env.local
# Edit .env.local with your configuration
```

3. **Start all services:**
```bash
docker-compose up -d
```

4. **Check service status:**
```bash
docker-compose ps
```

5. **View logs:**
```bash
docker-compose logs -f app
```

### Manual Docker Build

```bash
# Build the application
cd app
docker build -t empowergrid-app .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  empowergrid-app
```

### Docker Compose Services

The `docker-compose.yml` includes:
- **app**: Next.js application
- **db**: PostgreSQL database
- **redis**: Redis cache (optional)
- **prometheus**: Metrics collection
- **grafana**: Monitoring dashboard

## Azure Deployment

### Option 1: Azure Web Apps

1. **Login to Azure:**
```bash
az login
```

2. **Create resource group:**
```bash
az group create --name empowergrid-rg --location eastus
```

3. **Create PostgreSQL database:**
```bash
az postgres flexible-server create \
  --resource-group empowergrid-rg \
  --name empowergrid-db \
  --location eastus \
  --admin-user adminuser \
  --admin-password <password> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 15
```

4. **Deploy to Web App:**
```bash
cd app
az webapp up \
  --name empowergrid-app \
  --resource-group empowergrid-rg \
  --runtime "NODE:18-lts" \
  --sku B1
```

5. **Configure environment variables:**
```bash
az webapp config appsettings set \
  --name empowergrid-app \
  --resource-group empowergrid-rg \
  --setting DATABASE_URL="postgresql://..." \
  --setting NEXTAUTH_SECRET="..." \
  --setting RPC_URL="https://api.mainnet.solana.com"
```

### Option 2: Azure Container Apps

1. **Create Container Registry:**
```bash
az acr create \
  --resource-group empowergrid-rg \
  --name empowergridacr \
  --sku Basic
```

2. **Build and push Docker image:**
```bash
az acr build \
  --registry empowergridacr \
  --image empowergrid-app:latest \
  --file Dockerfile \
  .
```

3. **Create Container App:**
```bash
az containerapp create \
  --name empowergrid-app \
  --resource-group empowergrid-rg \
  --image empowergridacr.azurecr.io/empowergrid-app:latest \
  --target-port 3000 \
  --ingress external \
  --environment-variables \
    DATABASE_URL="postgresql://..." \
    NEXTAUTH_SECRET="..."
```

## CI/CD Pipeline

### GitHub Actions Setup

The project includes pre-configured GitHub Actions workflows:

1. **CI Pipeline** (`.github/workflows/ci.yml`):
   - Runs on push/PR to main/develop
   - Executes linting, type checking, and tests
   - Builds application
   - Security scanning

2. **Azure Deploy** (`.github/workflows/azure-deploy.yml`):
   - Deploys to Azure on main branch pushes
   - Supports staging/production environments
   - Includes health checks and rollback

### Required GitHub Secrets

Set these in your repository settings:

```bash
# Azure
AZURE_CREDENTIALS: (JSON with service principal credentials)
AZURE_SUBSCRIPTION_ID: your-subscription-id

# Database
DATABASE_URL: postgresql://...

# Authentication
NEXTAUTH_SECRET: your-secret-key

# Optional
REDIS_URL: redis://...
```

### Manual Deployment

```bash
# Build and test locally
npm run build
npm run test

# Deploy to staging
git push origin develop

# Deploy to production
git push origin main
```

## Environment Configuration

### Production Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"

# Solana
RPC_URL="https://api.mainnet.solana.com"
PROGRAM_ID="your-mainnet-program-id"

# Authentication
NEXTAUTH_SECRET="strong-random-secret-32-chars-min"
NEXTAUTH_URL="https://yourdomain.com"

# Application
NEXT_PUBLIC_APP_ENV="production"
LOG_LEVEL="warn"

# Security
NODE_ENV="production"

# Optional Services
REDIS_URL="redis://cache:6379"
PROMETHEUS_URL="http://prometheus:9090"

# Monitoring
SENTRY_DSN="your-sentry-dsn"  # If using Sentry
```

### Environment-Specific Configurations

#### Development
- Debug logging enabled
- Hot reload enabled
- Local database
- Mock external services

#### Staging
- Production build
- Staging database
- Testnet Solana
- Full monitoring

#### Production
- Optimized build
- Production database
- Mainnet Solana
- Full security
- Comprehensive monitoring

## Monitoring Setup

### Application Monitoring

1. **Enable monitoring in the app:**
```bash
npm run monitoring:start
```

2. **Access Grafana dashboard:**
```
http://localhost:3001
Username: admin
Password: admin
```

3. **View Prometheus metrics:**
```
http://localhost:9090
```

### Azure Monitoring

1. **Enable Application Insights:**
```bash
az monitor app-insights component create \
  --app empowergrid-app \
  --location eastus \
  --resource-group empowergrid-rg
```

2. **Configure logging:**
```bash
az webapp config appsettings set \
  --name empowergrid-app \
  --setting APPINSIGHTS_INSTRUMENTATIONKEY="your-key"
```

### Log Files

Application logs are stored in:
- `logs/app.log`: General application logs
- `logs/error.log`: Error logs
- `logs/exceptions.log`: Uncaught exceptions

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
npm run prisma:studio

# Reset database
npm run prisma:db:push --force-reset
```

#### Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Docker Issues
```bash
# Check container logs
docker-compose logs app

# Restart services
docker-compose restart

# Rebuild containers
docker-compose up --build
```

#### Azure Deployment Issues
```bash
# Check deployment status
az webapp log tail --name empowergrid-app --resource-group empowergrid-rg

# Restart web app
az webapp restart --name empowergrid-app --resource-group empowergrid-rg
```

### Performance Optimization

#### Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_creator ON projects(creator_id);
CREATE INDEX idx_fundings_project ON fundings(project_id);
```

#### Application Optimization
```bash
# Analyze bundle size
npm run build --analyze

# Enable compression
# (Already configured in next.config.js)
```

### Security Checklist

- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] HTTPS enabled
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Security headers set
- [ ] Dependencies updated
- [ ] Secrets management configured

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review application logs
3. Check GitHub Actions workflow runs
4. Open an issue with deployment logs

## Version History

- **v1.0.0**: Initial deployment setup
- **v1.1.0**: Docker and Azure deployment
- **v1.2.0**: CI/CD pipeline and monitoring
- **v1.3.0**: Multi-environment support