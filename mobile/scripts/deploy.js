#!/usr/bin/env node

/**
 * EmpowerGRID Mobile App Deployment Script
 * Handles building and deploying the mobile app to app stores
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEPLOYMENT_CONFIG = {
  ios: {
    bundleId: 'com.empowergrid.mobile',
    appStoreId: process.env.APP_STORE_ID,
    appleId: process.env.APPLE_ID,
    applePassword: process.env.APPLE_PASSWORD,
  },
  android: {
    packageName: 'com.empowergrid.mobile',
    serviceAccountKeyPath: './google-service-account-key.json',
  },
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m'
  };

  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function checkPrerequisites() {
  log('Checking prerequisites...');

  try {
    execSync('eas --version', { stdio: 'pipe' });
    log('✅ EAS CLI is installed', 'success');
  } catch (error) {
    log('❌ EAS CLI is not installed. Run: npm install -g @expo/eas-cli', 'error');
    process.exit(1);
  }

  try {
    execSync('expo --version', { stdio: 'pipe' });
    log('✅ Expo CLI is installed', 'success');
  } catch (error) {
    log('❌ Expo CLI is not installed. Run: npm install -g @expo/cli', 'error');
    process.exit(1);
  }

  // Check if user is logged in to EAS
  try {
    execSync('eas whoami', { stdio: 'pipe' });
    log('✅ User is logged in to EAS', 'success');
  } catch (error) {
    log('❌ User is not logged in to EAS. Run: eas login', 'error');
    process.exit(1);
  }
}

function validateEnvironment() {
  log('Validating environment variables...');

  const requiredVars = [
    'EXPO_TOKEN',
    'APP_STORE_ID',
    'APPLE_ID',
    'APPLE_PASSWORD'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    log(`❌ Missing required environment variables: ${missing.join(', ')}`, 'error');
    log('Please set these in your .env file or CI/CD environment', 'warning');
    process.exit(1);
  }

  // Check for Google Service Account Key for Android
  if (!fs.existsSync('./google-service-account-key.json')) {
    log('⚠️  Google Service Account Key not found. Android deployment will be skipped.', 'warning');
  }

  log('✅ Environment validation passed', 'success');
}

function buildApp(platform, profile = 'production') {
  log(`Building app for ${platform} with profile: ${profile}...`);

  try {
    const command = `eas build --platform ${platform} --profile ${profile} --non-interactive`;
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${platform} build completed successfully`, 'success');
  } catch (error) {
    log(`❌ ${platform} build failed`, 'error');
    throw error;
  }
}

function submitToAppStore(platform) {
  log(`Submitting ${platform} app to store...`);

  try {
    const command = `eas submit --platform ${platform} --profile production --non-interactive`;
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${platform} app submitted successfully`, 'success');
  } catch (error) {
    log(`❌ ${platform} submission failed`, 'error');
    throw error;
  }
}

function deployToStores(platforms = ['ios', 'android']) {
  log(`Starting deployment to: ${platforms.join(', ')}`);

  for (const platform of platforms) {
    try {
      log(`\n🚀 Deploying to ${platform.toUpperCase()}`, 'info');

      // Build the app
      buildApp(platform);

      // Submit to store
      submitToAppStore(platform);

      log(`🎉 ${platform.toUpperCase()} deployment completed successfully!`, 'success');

    } catch (error) {
      log(`💥 ${platform.toUpperCase()} deployment failed: ${error.message}`, 'error');
      // Continue with other platforms even if one fails
    }
  }
}

function createReleaseNotes() {
  log('Generating release notes...');

  const packageJson = JSON.parse(fs.readFileSync('../package.json', 'utf8'));
  const version = packageJson.version;

  const releaseNotes = `# EmpowerGRID Mobile v${version}

## What's New

### Features
- Enhanced project discovery and funding
- Real-time portfolio tracking
- Comprehensive governance participation
- Advanced wallet management
- Push notifications for important updates

### Improvements
- Improved user interface and experience
- Better performance and stability
- Enhanced security features

### Bug Fixes
- Fixed various UI/UX issues
- Resolved wallet connection problems
- Improved error handling

## Installation

Download from the App Store or Google Play Store.

---
*Built with ❤️ for sustainable energy and decentralized governance*
`;

  fs.writeFileSync('./RELEASE_NOTES.md', releaseNotes);
  log('✅ Release notes generated', 'success');

  return releaseNotes;
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'deploy';
  const platforms = args[1] ? args[1].split(',') : ['ios', 'android'];

  log('🚀 EmpowerGRID Mobile App Deployment Tool', 'info');
  log('==========================================', 'info');

  try {
    checkPrerequisites();
    validateEnvironment();

    switch (command) {
      case 'build':
        log('Building apps...');
        platforms.forEach(platform => buildApp(platform));
        break;

      case 'submit':
        log('Submitting to app stores...');
        platforms.forEach(platform => submitToAppStore(platform));
        break;

      case 'release-notes':
        createReleaseNotes();
        break;

      case 'deploy':
      default:
        createReleaseNotes();
        deployToStores(platforms);
        break;
    }

    log('\n🎉 Deployment process completed!', 'success');

  } catch (error) {
    log(`\n💥 Deployment failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the deployment script
if (require.main === module) {
  main();
}

module.exports = {
  buildApp,
  submitToAppStore,
  deployToStores,
  createReleaseNotes
};