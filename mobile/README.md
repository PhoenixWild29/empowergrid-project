# EmpowerGRID Mobile App

A React Native mobile application for the EmpowerGRID decentralized energy project platform, built with Expo.

## Features

- **🏠 Home Dashboard**: Overview of platform statistics and recent activity
- **💡 Projects**: Browse and fund sustainable energy projects
- **🗳️ Governance**: Participate in platform governance through proposals and voting
- **👤 Profile**: Manage your wallet, view activity, and track investments
- **🔗 Wallet Integration**: Connect with Phantom wallet for Solana blockchain interactions
- **🌙 Dark/Light Theme**: Support for both light and dark themes

## Tech Stack

- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and build service
- **React Navigation** - Navigation between screens
- **React Native Paper** - Material Design components
- **Solana Web3.js** - Blockchain integration
- **TypeScript** - Type-safe development

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- For iOS development: macOS with Xcode
- For Android development: Android Studio

## Quick Start

1. **Clone and navigate to the mobile directory:**
   ```bash
   cd mobile
   ```

2. **Run the setup script:**
   ```bash
   # On macOS/Linux
   chmod +x setup-mobile.sh
   ./setup-mobile.sh

   # On Windows (PowerShell)
   # Run the commands in setup-mobile.sh manually
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on device/emulator:**
   - **iOS**: Press `i` in the terminal or `npm run ios`
   - **Android**: Press `a` in the terminal or `npm run android`
   - **Web**: Press `w` in the terminal or `npm run web`

## Manual Setup (Alternative)

If the setup script doesn't work, you can set up manually:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Expo CLI globally:**
   ```bash
   npm install -g @expo/cli
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development:**
   ```bash
   npm start
   ```

## Project Structure

```
mobile/
├── app.json                 # Expo configuration
├── App.tsx                  # Main app component
├── package.json             # Dependencies and scripts
├── setup-mobile.sh          # Setup script
├── README.md               # This file
├── .env                    # Environment variables
├── contexts/               # React contexts
│   ├── WalletContext.tsx   # Wallet connection state
│   └── ThemeContext.tsx    # Theme management
├── screens/                # App screens
│   ├── HomeScreen.tsx      # Dashboard/home screen
│   ├── ProjectsScreen.tsx  # Projects listing and details
│   ├── GovernanceScreen.tsx# Governance proposals and voting
│   └── ProfileScreen.tsx   # User profile and settings
├── navigation/             # Navigation configuration
│   └── AppNavigator.tsx    # Main navigation setup
└── components/             # Reusable components (future)
```

## Environment Variables

Create a `.env` file in the mobile directory:

```env
# API Configuration
API_BASE_URL=http://localhost:3000/api

# Wallet Configuration
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# App Configuration
APP_NAME=EmpowerGRID
APP_VERSION=1.0.0
```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser
- `npm run build` - Build for production

## Backend Integration

The mobile app connects to the EmpowerGRID backend API. Make sure the backend is running on the configured `API_BASE_URL` (default: `http://localhost:3000/api`).

### API Endpoints Used

- `GET /projects` - Fetch projects list
- `GET /governance/proposals` - Fetch governance proposals
- `POST /governance/proposals/:id/vote` - Cast votes on proposals
- `GET /users/:address` - Get user profile
- `GET /users/:address/activities` - Get user activity history

## Wallet Integration

The app integrates with Phantom wallet for Solana blockchain interactions:

- Connect/disconnect wallet
- Sign transactions for funding and voting
- View wallet balance and transaction history

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow React Native and Expo best practices
- Use functional components with hooks
- Implement proper error handling
- Add loading states for async operations

### State Management

- Use React Context for global state (wallet, theme)
- Use local state for component-specific data
- Implement proper state updates and re-renders

### API Integration

- Use fetch API for HTTP requests
- Handle network errors gracefully
- Implement retry logic for failed requests
- Cache data when appropriate

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Deployment

The mobile app uses Expo Application Services (EAS) for building and deployment. See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment instructions.

### Quick Deployment

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to EAS
eas login

# Configure project
eas build:configure

# Build for production
npm run deploy

# Or build specific platforms
npm run deploy:ios
npm run deploy:android
```

### Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in your API keys and deployment credentials
3. Configure app store accounts (iOS App Store Connect, Google Play Console)

### CI/CD

GitHub Actions workflow is configured for automated deployment. Set up repository secrets and push version tags to trigger releases.

---

## 📱 App Store Links

- **App Store:** [Coming Soon]
- **Google Play:** [Coming Soon]

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the EmpowerGRID platform. See main project license for details.

---

Built with ❤️ for sustainable energy and decentralized governance.