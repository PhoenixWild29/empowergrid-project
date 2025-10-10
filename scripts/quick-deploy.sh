#!/bin/bash

###############################################################################
# EmpowerGRID Platform - Quick Deploy Script
# Version: 1.0.0
# Description: Fast deployment for minor updates (no migrations)
###############################################################################

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}EmpowerGRID Quick Deploy${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Quick checks
echo "→ Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "Node.js required but not installed"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm required but not installed"; exit 1; }

# Pull code
echo "→ Pulling latest code..."
git pull origin main

# Install dependencies
echo "→ Installing dependencies..."
cd app
npm ci --production=false

# Build
echo "→ Building application..."
npm run build

# Restart
echo "→ Restarting application..."
if command -v pm2 &> /dev/null; then
    pm2 restart empowergrid
    pm2 save
else
    echo "⚠ PM2 not found. Restart application manually."
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Quick deploy complete! ✓${NC}"
echo -e "${GREEN}=========================================${NC}"

