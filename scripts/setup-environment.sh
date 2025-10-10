#!/bin/bash

###############################################################################
# EmpowerGRID Platform - Environment Setup Script
# Version: 1.0.0
# Description: Interactive environment configuration setup
###############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}EmpowerGRID Environment Setup${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Function to prompt for input with default value
prompt() {
    local prompt_text="$1"
    local default_value="$2"
    local result
    
    if [ -n "$default_value" ]; then
        read -p "$(echo -e ${GREEN}${prompt_text}${NC} [${default_value}]: )" result
        echo "${result:-$default_value}"
    else
        read -p "$(echo -e ${GREEN}${prompt_text}${NC}: )" result
        echo "$result"
    fi
}

# Function to prompt for sensitive input (hidden)
prompt_secret() {
    local prompt_text="$1"
    local result
    
    read -s -p "$(echo -e ${GREEN}${prompt_text}${NC}: )" result
    echo ""
    echo "$result"
}

# Generate random secret
generate_secret() {
    openssl rand -base64 32
}

echo -e "${YELLOW}This script will help you configure your environment variables.${NC}"
echo ""

# Database Configuration
echo -e "${BLUE}=== Database Configuration ===${NC}"
DB_HOST=$(prompt "PostgreSQL Host" "localhost")
DB_PORT=$(prompt "PostgreSQL Port" "5432")
DB_NAME=$(prompt "Database Name" "empowergrid")
DB_USER=$(prompt "Database User" "postgres")
DB_PASSWORD=$(prompt_secret "Database Password")
DB_SSL=$(prompt "Enable SSL? (require/prefer/disable)" "require")

DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=${DB_SSL}"

echo ""

# Solana Configuration
echo -e "${BLUE}=== Solana Configuration ===${NC}"
SOLANA_NETWORK=$(prompt "Solana Network (mainnet-beta/devnet)" "mainnet-beta")
SOLANA_RPC_URL=$(prompt "Solana RPC URL" "https://api.mainnet-beta.solana.com")
PROGRAM_ID=$(prompt "Program ID" "")

echo ""

# Switchboard Oracle Configuration
echo -e "${BLUE}=== Oracle Configuration ===${NC}"
SWITCHBOARD_PROGRAM_ID=$(prompt "Switchboard Program ID" "SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f")
SWITCHBOARD_FEED_ADDRESS=$(prompt "Switchboard Feed Address" "")

echo ""

# API Configuration
echo -e "${BLUE}=== API Configuration ===${NC}"
API_URL=$(prompt "API URL" "https://api.empowergrid.com")

echo ""

# Security Configuration
echo -e "${BLUE}=== Security Configuration ===${NC}"
echo -e "${YELLOW}Generating secure secrets...${NC}"
JWT_SECRET=$(generate_secret)
ENCRYPTION_KEY=$(generate_secret)
echo -e "${GREEN}✓ Secrets generated${NC}"

echo ""

# Admin Configuration
echo -e "${BLUE}=== Admin Configuration ===${NC}"
ADMIN_WALLET=$(prompt "Admin Wallet Address" "")

echo ""

# Node Environment
echo -e "${BLUE}=== Node Environment ===${NC}"
NODE_ENV=$(prompt "Node Environment (production/development)" "production")

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${YELLOW}Review your configuration:${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "Database:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Name: $DB_NAME"
echo "  User: $DB_USER"
echo "  SSL: $DB_SSL"
echo ""
echo "Solana:"
echo "  Network: $SOLANA_NETWORK"
echo "  RPC URL: $SOLANA_RPC_URL"
echo "  Program ID: $PROGRAM_ID"
echo ""
echo "Oracle:"
echo "  Switchboard Program: $SWITCHBOARD_PROGRAM_ID"
echo "  Feed Address: $SWITCHBOARD_FEED_ADDRESS"
echo ""
echo "API:"
echo "  URL: $API_URL"
echo ""
echo "Admin:"
echo "  Wallet: $ADMIN_WALLET"
echo ""
echo "Environment: $NODE_ENV"
echo ""

read -p "$(echo -e ${GREEN}Is this correct? [y/N]:${NC} )" -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Setup cancelled${NC}"
    exit 1
fi

# Create .env file
ENV_FILE="app/.env"

echo -e "${YELLOW}Creating $ENV_FILE...${NC}"

cat > "$ENV_FILE" << EOF
# EmpowerGRID Environment Configuration
# Generated: $(date)
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

# Node Environment
NODE_ENV=$NODE_ENV

# Database Configuration
DATABASE_URL="$DATABASE_URL"

# Solana Configuration
SOLANA_NETWORK="$SOLANA_NETWORK"
SOLANA_RPC_URL="$SOLANA_RPC_URL"
PROGRAM_ID="$PROGRAM_ID"

# Switchboard Oracle Configuration
SWITCHBOARD_PROGRAM_ID="$SWITCHBOARD_PROGRAM_ID"
SWITCHBOARD_FEED_ADDRESS="$SWITCHBOARD_FEED_ADDRESS"

# API Configuration
NEXT_PUBLIC_API_URL="$API_URL"

# Security Configuration
JWT_SECRET="$JWT_SECRET"
ENCRYPTION_KEY="$ENCRYPTION_KEY"

# Admin Configuration
ADMIN_WALLET_ADDRESS="$ADMIN_WALLET"

# Optional: Add these if needed
# NEXTAUTH_URL="https://empowergrid.com"
# NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
# SENTRY_DSN=""
# REDIS_URL=""
EOF

echo -e "${GREEN}✓ Environment file created at $ENV_FILE${NC}"
echo ""

# Secure the file
chmod 600 "$ENV_FILE"
echo -e "${GREEN}✓ File permissions set to 600 (owner read/write only)${NC}"
echo ""

# Create .env.example for reference
ENV_EXAMPLE="app/.env.example"
echo -e "${YELLOW}Creating $ENV_EXAMPLE (template)...${NC}"

cat > "$ENV_EXAMPLE" << 'EOF'
# EmpowerGRID Environment Configuration Template
# Copy this file to .env and fill in your values

# Node Environment
NODE_ENV=production

# Database Configuration
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"

# Solana Configuration
SOLANA_NETWORK="mainnet-beta"
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
PROGRAM_ID="Your_Program_ID"

# Switchboard Oracle Configuration
SWITCHBOARD_PROGRAM_ID="SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f"
SWITCHBOARD_FEED_ADDRESS="Your_Feed_Address"

# API Configuration
NEXT_PUBLIC_API_URL="https://api.empowergrid.com"

# Security Configuration (generate with: openssl rand -base64 32)
JWT_SECRET="your-jwt-secret-min-32-chars"
ENCRYPTION_KEY="your-encryption-key-32-chars"

# Admin Configuration
ADMIN_WALLET_ADDRESS="Your_Admin_Wallet_Address"
EOF

echo -e "${GREEN}✓ Template file created at $ENV_EXAMPLE${NC}"
echo ""

echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}Environment setup complete! ✓${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review the .env file: cat $ENV_FILE"
echo "  2. Run database migrations: cd app && npx prisma migrate deploy"
echo "  3. Build the application: cd app && npm run build"
echo "  4. Start the application: cd app && npm start"
echo ""
echo -e "${RED}IMPORTANT: Keep your .env file secure and never commit it to version control!${NC}"

