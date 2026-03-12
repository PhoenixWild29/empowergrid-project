# EmpowerGrid
Smart contract milestone-based payment and project management platform on Solana.

## Overview
Escrow-based milestone release for decentralized project funding and delivery.

## Architecture
- **Smart Contracts**: Anchor (Rust) on Solana (/programs/escrow)
- **Backend API**: FastAPI (Python) (/app)
- **Frontend**: Web3 DApp (/web)
- **Tests**: Anchor tests (/tests/*.test.ts), API tests (/tests/api)

## Local Setup
### Solana/Anchor
1. Install Rust + Solana CLI + Anchor: https://www.anchor-lang.com/docs/installation
2. `solana-keygen new` (save phrase)
3. `anchor build`
4. `anchor test`

### Backend
```
cd app
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Docker
`docker-compose up`

## Deployment
TBD