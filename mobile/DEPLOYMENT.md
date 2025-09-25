# 🚀 EmpowerGRID Mobile App Deployment Guide

This guide covers everything you need to deploy the EmpowerGRID mobile app to iOS App Store and Google Play Store.

## 📋 Prerequisites

### Required Accounts & Tools

1. **Expo Application Services (EAS) Account**
   - Sign up at [expo.dev](https://expo.dev)
   - Install EAS CLI: `npm install -g @expo/eas-cli`

2. **Apple Developer Program** (for iOS)
   - Enroll at [developer.apple.com](https://developer.apple.com/programs/)
   - Create App Store Connect app
   - Generate App Store Connect API Key

3. **Google Play Console** (for Android)
   - Sign up at [play.google.com/console](https://play.google.com/console)
   - Create Google Cloud Service Account
   - Generate JSON key file

4. **GitHub Repository** (for CI/CD)
   - Repository with GitHub Actions enabled

## 🔧 Initial Setup

### 1. Configure EAS

```bash
# Login to EAS
eas login

# Link your project
cd mobile
eas build:configure

# Select your project when prompted
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
```env
EXPO_TOKEN=your_expo_access_token
APPLE_ID=your-apple-id@example.com
APPLE_PASSWORD=your-app-specific-password
APP_STORE_ID=your-app-store-connect-app-id
```

### 3. App Store Configuration

#### iOS Setup

1. **Create App Store Connect App:**
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Create new app with bundle ID: `com.empowergrid.mobile`

2. **Generate App-Specific Password:**
   - Go to [appleid.apple.com](https://appleid.apple.com)
   - Security → App-Specific Passwords → Generate

3. **Update `eas.json`:**
   ```json
   {
     "submit": {
       "production": {
         "ios": {
           "appleId": "your-apple-id@example.com",
           "ascAppId": "your-app-store-connect-app-id"
         }
       }
     }
   }
   ```

#### Android Setup

1. **Create Google Play App:**
   - Go to [play.google.com/console](https://play.google.com/console)
   - Create new app with package name: `com.empowergrid.mobile`

2. **Create Service Account:**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create service account with Play Store permissions
   - Download JSON key file as `google-service-account-key.json`

## 🚀 Deployment Methods

### Method 1: Automated Deployment (Recommended)

#### GitHub Actions Setup

1. **Add Repository Secrets:**
   Go to your GitHub repository → Settings → Secrets and variables → Actions

   Add these secrets:
   ```
   EXPO_TOKEN=your_expo_access_token
   API_BASE_URL=https://your-api-domain.com/api
   SOLANA_NETWORK=mainnet-beta
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   APPLE_ID=your-apple-id@example.com
   APPLE_PASSWORD=your-app-specific-password
   APP_STORE_ID=your-app-store-connect-app-id
   GOOGLE_SERVICE_ACCOUNT_KEY=your-json-key-content
   SLACK_WEBHOOK_URL=your-slack-webhook (optional)
   ```

2. **Trigger Deployment:**
   ```bash
   # Create and push a version tag
   git tag v1.0.0
   git push origin v1.0.0

   # Or use manual trigger in GitHub Actions
   ```

### Method 2: Manual Deployment

#### Build Commands

```bash
cd mobile

# Build for iOS
npm run build:ios

# Build for Android
npm run build:android

# Build preview for both platforms
npm run build:preview
```

#### Submit to Stores

```bash
# Submit iOS to App Store
npm run submit:ios

# Submit Android to Google Play
npm run submit:android
```

#### Using Deployment Script

```bash
# Deploy to both stores
npm run deploy

# Deploy to specific platform
npm run deploy:ios
npm run deploy:android

# Generate release notes
npm run release-notes
```

## 📱 App Store Preparation

### iOS App Store

1. **App Information:**
   - Name: EmpowerGRID
   - Subtitle: Decentralized Energy Investing
   - Description: [Use content from RELEASE_NOTES.md]
   - Keywords: energy, sustainable, investment, blockchain, solana

2. **Screenshots:** (Required - 6.5" display)
   - 5-10 screenshots showing app features
   - Include iPhone 15 Pro frames

3. **App Icons:** (1024x1024 PNG)
   - Place in `assets/app-icon.png`

4. **Privacy Policy URL:**
   - Add your privacy policy URL in App Store Connect

### Android Play Store

1. **Store Listing:**
   - Title: EmpowerGRID
   - Short Description: Decentralized energy investing platform
   - Full Description: [Use content from RELEASE_NOTES.md]

2. **Screenshots:** (Required - 1080x1920)
   - 6-8 screenshots showing app features
   - Include device frames

3. **Feature Graphic:** (1024x500 PNG)
   - Promotional banner for Play Store

4. **App Icons:**
   - Adaptive icons in `android/app/src/main/res/`

## 🔄 Version Management

### Version Bumping

Update version in `app.json` and `package.json`:

```json
{
  "version": "1.1.0",
  "expo": {
    "version": "1.1.0"
  }
}
```

### Release Process

1. **Update version numbers**
2. **Update CHANGELOG.md**
3. **Test thoroughly**
4. **Create git tag**
5. **Push to trigger deployment**

## 🧪 Testing Builds

### Internal Testing

```bash
# Build internal test versions
eas build --platform ios --profile development
eas build --platform android --profile preview
```

### Beta Testing

1. **TestFlight (iOS):**
   - Upload build to App Store Connect
   - Create TestFlight beta group
   - Invite testers

2. **Google Play Beta:**
   - Upload to Play Console Beta track
   - Create beta testing group
   - Invite testers

## 📊 Monitoring & Analytics

### Build Monitoring

```bash
# Check build status
eas build:list

# View build logs
eas build:view <build-id>
```

### Store Analytics

- **App Store Connect:** Sales, downloads, crashes
- **Google Play Console:** Installs, ratings, ANRs
- **Expo Dashboard:** Build metrics, usage stats

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures:**
   ```bash
   # Clear build cache
   eas build:delete

   # Check build logs
   eas build:list --status
   ```

2. **Submission Issues:**
   - Verify credentials in `.env`
   - Check app store configurations
   - Ensure version numbers are incremented

3. **Code Signing:**
   - iOS: Check provisioning profiles
   - Android: Verify keystore and service account

### Getting Help

- **Expo Documentation:** [docs.expo.dev](https://docs.expo.dev)
- **EAS Documentation:** [docs.expo.dev/eas](https://docs.expo.dev/eas)
- **GitHub Issues:** Report bugs in the repository

## 🔒 Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files
   - Use GitHub secrets for sensitive data
   - Rotate credentials regularly

2. **Code Signing:**
   - Secure private keys
   - Use different keystores for different environments

3. **API Security:**
   - Use HTTPS for all API calls
   - Implement proper authentication
   - Validate all inputs

## 📈 Performance Optimization

### Bundle Size

```bash
# Analyze bundle size
npx expo export --platform web
npx @expo/webpack-bundle-analyzer dist
```

### Build Optimization

- Use Hermes engine for Android
- Enable ProGuard/R8 minification
- Optimize images and assets
- Tree-shake unused dependencies

## 🎯 Deployment Checklist

### Pre-Deployment
- [ ] Update version numbers
- [ ] Test on physical devices
- [ ] Update screenshots
- [ ] Verify API endpoints
- [ ] Check wallet integration

### Deployment
- [ ] Configure EAS build profiles
- [ ] Set up app store accounts
- [ ] Add GitHub secrets
- [ ] Test CI/CD pipeline
- [ ] Create release notes

### Post-Deployment
- [ ] Monitor crash reports
- [ ] Track download metrics
- [ ] Gather user feedback
- [ ] Plan next release

---

## 🚀 Quick Start Commands

```bash
# One-time setup
eas login
eas build:configure
cp .env.example .env

# Development builds
npm run build:preview

# Production deployment
npm run deploy

# Check status
eas build:list
```

Happy deploying! 🎉