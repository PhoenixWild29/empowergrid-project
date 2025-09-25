#!/usr/bin/env node

/**
 * EmpowerGRID Mobile App Deployment Setup Script
 * Automates the initial deployment configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function checkPrerequisites() {
  log('Checking prerequisites...');

  try {
    execSync('node --version', { stdio: 'pipe' });
    log('✅ Node.js is installed', 'success');
  } catch (error) {
    log('❌ Node.js is not installed. Please install Node.js 18+', 'error');
    process.exit(1);
  }

  try {
    execSync('npm --version', { stdio: 'pipe' });
    log('✅ npm is installed', 'success');
  } catch (error) {
    log('❌ npm is not installed', 'error');
    process.exit(1);
  }

  try {
    execSync('expo --version', { stdio: 'pipe' });
    log('✅ Expo CLI is installed', 'success');
  } catch (error) {
    log('📦 Installing Expo CLI...', 'info');
    execSync('npm install -g @expo/cli', { stdio: 'inherit' });
    log('✅ Expo CLI installed', 'success');
  }

  try {
    execSync('eas --version', { stdio: 'pipe' });
    log('✅ EAS CLI is installed', 'success');
  } catch (error) {
    log('📦 Installing EAS CLI...', 'info');
    execSync('npm install -g @expo/eas-cli', { stdio: 'inherit' });
    log('✅ EAS CLI installed', 'success');
  }
}

async function setupEAS() {
  log('Setting up Expo Application Services (EAS)...');

  try {
    // Check if already logged in
    execSync('eas whoami', { stdio: 'pipe' });
    log('✅ Already logged in to EAS', 'success');
  } catch (error) {
    log('🔐 Please login to EAS:', 'info');
    execSync('eas login', { stdio: 'inherit' });
  }

  // Configure EAS for the project
  log('🔧 Configuring EAS for the project...');
  try {
    execSync('eas build:configure', { stdio: 'inherit' });
    log('✅ EAS configured successfully', 'success');
  } catch (error) {
    log('⚠️  EAS configuration may have failed. Please run manually: eas build:configure', 'warning');
  }
}

function createEnvFile() {
  log('Creating environment configuration...');

  const envPath = '.env';
  const envExamplePath = '.env.example';

  if (fs.existsSync(envPath)) {
    log('⚠️  .env file already exists. Skipping...', 'warning');
    return;
  }

  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    log('✅ .env file created from template', 'success');
    log('📝 Please edit .env file with your actual values', 'info');
  } else {
    log('❌ .env.example template not found', 'error');
  }
}

async function setupAppStores() {
  log('Setting up App Store configurations...');

  const hasIOS = await askQuestion('Do you want to configure iOS deployment? (y/n): ');
  const hasAndroid = await askQuestion('Do you want to configure Android deployment? (y/n): ');

  const easConfigPath = 'eas.json';
  let easConfig = {};

  if (fs.existsSync(easConfigPath)) {
    easConfig = JSON.parse(fs.readFileSync(easConfigPath, 'utf8'));
  }

  if (!easConfig.submit) {
    easConfig.submit = {};
  }

  if (hasIOS.toLowerCase() === 'y') {
    log('📱 Configuring iOS deployment...', 'info');

    const appleId = await askQuestion('Enter your Apple ID: ');
    const appStoreId = await askQuestion('Enter your App Store Connect App ID: ');

    easConfig.submit.production = easConfig.submit.production || {};
    easConfig.submit.production.ios = {
      appleId: appleId,
      ascAppId: appStoreId
    };

    log('✅ iOS configuration added to eas.json', 'success');
    log('🔐 Remember to set APPLE_PASSWORD environment variable for deployment', 'warning');
  }

  if (hasAndroid.toLowerCase() === 'y') {
    log('🤖 Configuring Android deployment...', 'info');
    log('✅ Android configuration will use google-service-account-key.json', 'success');
    log('🔐 Place your Google Service Account JSON key in the mobile directory', 'warning');
  }

  fs.writeFileSync(easConfigPath, JSON.stringify(easConfig, null, 2));
  log('✅ eas.json updated with deployment configurations', 'success');
}

async function setupGitHubActions() {
  log('Setting up GitHub Actions for CI/CD...');

  const hasGitHub = await askQuestion('Do you want to set up GitHub Actions for automated deployment? (y/n): ');

  if (hasGitHub.toLowerCase() === 'y') {
    const githubDir = '.github';
    const workflowsDir = path.join(githubDir, 'workflows');

    if (!fs.existsSync(githubDir)) {
      fs.mkdirSync(githubDir);
    }

    if (!fs.existsSync(workflowsDir)) {
      fs.mkdirSync(workflowsDir);
    }

    log('✅ GitHub Actions workflow directory created', 'success');
    log('📝 GitHub Actions workflow is already configured in .github/workflows/deploy.yml', 'info');
    log('🔐 Set up the following secrets in your GitHub repository:', 'warning');
    console.log('  - EXPO_TOKEN');
    console.log('  - API_BASE_URL');
    console.log('  - SOLANA_NETWORK');
    console.log('  - SOLANA_RPC_URL');
    console.log('  - APPLE_ID (for iOS)');
    console.log('  - APPLE_PASSWORD (for iOS)');
    console.log('  - APP_STORE_ID (for iOS)');
    console.log('  - GOOGLE_SERVICE_ACCOUNT_KEY (for Android)');
  }
}

function createDeploymentSummary() {
  log('Creating deployment summary...');

  const summary = `# 🚀 Deployment Setup Complete!

## Next Steps

### 1. Environment Configuration
Edit the \`.env\` file with your actual values:
- API_BASE_URL
- EXPO_TOKEN
- App Store credentials

### 2. App Store Setup
- **iOS:** Create app in App Store Connect with bundle ID \`com.empowergrid.mobile\`
- **Android:** Create app in Google Play Console with package name \`com.empowergrid.mobile\`

### 3. Test Deployment
\`\`\`bash
# Test build
npm run build:preview

# Full deployment
npm run deploy
\`\`\`

### 4. CI/CD (Optional)
Push version tags to trigger automated deployment:
\`\`\`bash
git tag v1.0.0
git push origin v1.0.0
\`\`\`

## Useful Commands

- \`npm run build:ios\` - Build iOS app
- \`npm run build:android\` - Build Android app
- \`npm run deploy\` - Deploy to both stores
- \`eas build:list\` - Check build status
- \`eas submit --help\` - Submission help

## Support

- 📖 [Deployment Guide](DEPLOYMENT.md)
- 🐛 [Troubleshooting](DEPLOYMENT.md#troubleshooting)
- 📞 [Expo Documentation](https://docs.expo.dev)

---
*Generated on ${new Date().toISOString()}*
`;

  fs.writeFileSync('DEPLOYMENT_SETUP.md', summary);
  log('✅ Deployment setup summary created: DEPLOYMENT_SETUP.md', 'success');
}

async function main() {
  log('🚀 EmpowerGRID Mobile App Deployment Setup', 'info');
  log('============================================', 'info');

  try {
    await checkPrerequisites();
    await setupEAS();
    createEnvFile();
    await setupAppStores();
    await setupGitHubActions();
    createDeploymentSummary();

    log('\n🎉 Deployment setup completed successfully!', 'success');
    log('📖 Check DEPLOYMENT_SETUP.md for next steps', 'info');

  } catch (error) {
    log(`\n💥 Setup failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the setup script
if (require.main === module) {
  main();
}