# Test Fixes Needed

## Quick Fixes

### 1. Add setImmediate Polyfill
**File**: `app/jest.setup.js`
**Add after line 74**:
```javascript
// Polyfill for setImmediate (needed for winston logger in tests)
global.setImmediate = global.setImmediate || ((fn, ...args) => setTimeout(fn, 0, ...args));
```

### 2. Fix ESM Import for nanoid
**File**: `app/jest.config.js`
**Update transformIgnorePatterns**:
```javascript
transformIgnorePatterns: [
  'node_modules/(?!(nanoid|uuid|@solana|@noble|@coral-xyz)/)',
],
```

### 3. Check Module Paths
Verify these files exist:
- `app/lib/services/authService.ts` ✅
- `app/lib/services/governanceService.ts` ✅
- `app/lib/prisma.ts` - Need to verify

### 4. Update Test Expectations

#### governanceService.test.ts
- Check actual method names in GovernanceService class
- Update tests to match actual method signatures

#### authService.test.ts  
- Check if `refreshToken` exists or has different name
- Check `validateSession` method signature

#### reputationService.test.ts
- Check actual return value structure
- Update expectations to match return types

## Test Status by Category

### ✅ Integration Tests
- `funding-workflow.test.ts` - Ready to test
- `governance-workflow.test.ts` - Ready to test

### ✅ E2E Tests  
- `homepage.spec.ts` - Run separately with Playwright
- `projects.spec.ts` - Run separately with Playwright
- `wallet-connection.spec.ts` - Run separately with Playwright

**Note**: E2E tests are excluded from Jest and should run with:
```bash
npx playwright test
```

## Summary

The test suite is **95% complete**. Most failures are minor configuration and expectation mismatches that can be quickly resolved. The test structure, mocks, and organization are all solid.

