#!/bin/bash

# EmpowerGRID Mobile App Setup Script
# This script sets up the React Native/Expo mobile app for EmpowerGRID

echo "🚀 Setting up EmpowerGRID Mobile App..."
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (version 18 or higher) first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI globally..."
    npm install -g @expo/cli
fi

echo "✅ Expo CLI version: $(expo --version)"

# Install dependencies
echo "📦 Installing project dependencies..."
npm install

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies. Please check the error messages above."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOL
# EmpowerGRID Mobile App Environment Variables

# API Configuration
API_BASE_URL=http://localhost:3000/api

# Wallet Configuration
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# App Configuration
APP_NAME=EmpowerGRID
APP_VERSION=1.0.0

# Optional: Analytics
# ANALYTICS_ENABLED=true
# ANALYTICS_KEY=your_analytics_key
EOL
    echo "✅ .env file created!"
fi

echo ""
echo "🎉 Setup complete!"
echo "=================="
echo ""
echo "To start the development server:"
echo "  npm start"
echo ""
echo "Or run on specific platform:"
echo "  npm run ios      (macOS only)"
echo "  npm run android  (requires Android Studio)"
echo "  npm run web      (runs in browser)"
echo ""
echo "Make sure your backend API is running on http://localhost:3000"
echo "for the mobile app to connect properly."
echo ""
echo "📱 Happy coding!"