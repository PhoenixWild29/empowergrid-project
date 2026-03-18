# EmpowerGrid

[![CI](https://github.com/PhoenixWild29/empowergrid-project/actions/workflows/ci.yml/badge.svg)](https://github.com/PhoenixWild29/empowergrid-project/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![Solana](https://img.shields.io/badge/Solana-1.14+-purple.svg)](https://solana.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Smart contract milestone-based payment and project management platform on Solana.

## Overview

EmpowerGrid enables decentralized project funding and delivery through escrow-based milestone releases. Projects define milestones, investors fund them, and payments are automatically released upon milestone completion, verified via smart contracts on Solana.

## Architecture

- **Smart Contracts**: Anchor (Rust) escrow program on Solana for secure, trustless milestone releases
- **Backend API**: FastAPI (Python) REST API with JWT authentication and rate limiting
- **Frontend**: Web3 DApp for project creation, funding, and milestone management
- **Database**: In-memory storage (PostgreSQL migration planned)
- **Tests**: Anchor tests for contracts, Pytest for API

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- Rust + Solana CLI + Anchor

### Installation
```bash
git clone https://github.com/PhoenixWild29/empowergrid-project.git
cd empowergrid-project
make install
cp .env.example .env  # Configure environment variables
```

### Development
```bash
# Start backend API
make dev

# Run tests
make test

# Lint code
make lint
```

### Smart Contracts
```bash
# Build and test contracts
anchor build
anchor test
```

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | API root | No |
| GET | `/docs` | API documentation | No |
| GET | `/health` | Health check | No |
| POST | `/api/auth/nonce` | Get authentication nonce | No |
| POST | `/api/auth/login` | Login with Solana signature | No |
| GET | `/api/projects` | List projects | No |
| POST | `/api/projects` | Create project | Yes |
| GET | `/api/projects/{id}` | Get project details | No |
| GET | `/api/projects/{id}/milestones` | List project milestones | No |
| POST | `/api/milestones/{id}/complete` | Complete milestone | Yes |
| POST | `/api/escrow/fund` | Fund project escrow | Yes |
| POST | `/api/escrow/release` | Release escrow funds | Yes |
| GET | `/api/escrow/{id}/status` | Get escrow status | No |
| GET | `/api/investors/{wallet}/portfolio` | Get investor portfolio | No |
| GET | `/api/investors/{wallet}/returns` | Get investor returns | No |

## Development Setup

### Backend
1. Install dependencies: `make install`
2. Set environment variables in `.env`
3. Run development server: `make dev`
4. API available at http://localhost:8000

### Smart Contracts
1. Install Solana CLI and Anchor
2. Configure Solana network: `solana config set --url devnet`
3. Build contracts: `anchor build`
4. Run tests: `anchor test`

### Testing
- Backend tests: `make test`
- Contract tests: `anchor test`
- Lint: `make lint`

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
JWT_SECRET=your-secret-key
SOLANA_RPC_URL=https://api.devnet.solana.com
PORT=8000
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.