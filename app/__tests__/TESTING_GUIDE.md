# Comprehensive Testing Guide for EmpowerGRID

## Overview

This document provides a complete guide to the testing infrastructure for the EmpowerGRID platform. The test suite covers unit tests, integration tests, and end-to-end (E2E) tests.

## Test Structure

```
app/__tests__/
├── components/          # React component unit tests
├── contexts/           # Context provider tests
├── e2e/                # End-to-end tests (Playwright)
├── integration/        # Integration workflow tests
├── pages/              # Page component tests
│   └── api/           # API endpoint tests
├── repositories/       # Repository layer tests
├── services/           # Service layer tests
├── types/              # Type validation tests
├── utils/              # Utility function tests
│   ├── mocks.ts       # Mock utilities
│   └── testUtils.tsx  # Test helpers
└── README.md           # Test documentation
```

## Test Types

### 1. Unit Tests

Unit tests focus on individual functions, components, and services in isolation.

**Location**: `__tests__/services/`, `__tests__/utils/`, `__tests__/components/`

**Examples**:
- Service functions (auth, project, governance)
- Utility functions (formatting, validation)
- React components
- Type definitions

**Run unit tests**:
```bash
npm run test:unit
```

### 2. Integration Tests

Integration tests verify that multiple components work together correctly.

**Location**: `__tests__/integration/`

**Coverage**:
- Funding workflow (project creation → funding → milestone release)
- Governance workflow (proposal → voting → execution)
- Oracle verification workflow
- Authentication flow

**Run integration tests**:
```bash
npm run test:integration
```

### 3. API Endpoint Tests

API tests verify that API endpoints handle requests correctly.

**Location**: `__tests__/pages/api/`

**Coverage**:
- Request validation
- Authentication/authorization
- Error handling
- Response formatting
- Status codes

**Run API tests**:
```bash
npm test -- __tests__/pages/api
```

### 4. End-to-End (E2E) Tests

E2E tests simulate real user interactions in the browser.

**Location**: `__tests__/e2e/`

**Coverage**:
- User flows (signup, login, project creation)
- Navigation and routing
- UI interactions
- Form submissions
- Wallet connections

**Run E2E tests**:
```bash
npm run test:e2e
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Specific Test File
```bash
npm test -- path/to/test/file.test.ts
```

### E2E Tests
```bash
# Run in headless mode
npm run test:e2e

# Run with UI
npx playwright test --ui

# Run specific browser
npx playwright test --project=chromium
```

## Test Coverage Goals

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Mock Utilities

The test suite includes comprehensive mock utilities in `__tests__/utils/mocks.ts`:

### Available Mocks

- **Prisma Client**: Database operations
- **Solana Connection**: Blockchain interactions
- **Anchor Program**: Smart contract operations
- **Logger**: Logging operations
- **Fetch**: HTTP requests

### Usage Example

```typescript
import { createMockUser, createMockProject, mockPrisma } from '../utils/mocks';

describe('MyTest', () => {
  it('should work', () => {
    const user = createMockUser();
    const project = createMockProject({ creatorId: user.id });
    
    mockPrisma.project.findUnique.mockResolvedValue(project);
    // ... test code
  });
});
```

## Test Data Generators

### User Data
```typescript
createMockUser({
  id: 'custom-id',
  role: 'CREATOR',
  reputationScore: 100,
})
```

### Project Data
```typescript
createMockProject({
  id: 'project-123',
  status: 'ACTIVE',
  fundedAmount: 500000000,
})
```

### Proposal Data
```typescript
createMockProposal({
  type: 'PROJECT_FUNDING',
  status: 'ACTIVE',
  votesFor: 100,
})
```

## Writing Tests

### Component Test Example

```typescript
import { render, screen } from '../utils/testUtils';
import { MyComponent } from '../../components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### API Test Example

```typescript
import { createMocks } from 'node-mocks-http';
import handler from '../../../pages/api/endpoint';

describe('/api/endpoint', () => {
  it('handles GET request', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
  });
});
```

### Service Test Example

```typescript
import { myService } from '../../lib/services/myService';
import { mockPrisma } from '../utils/mocks';

describe('MyService', () => {
  it('processes data correctly', async () => {
    mockPrisma.model.findMany.mockResolvedValue([{ id: '1' }]);
    const result = await myService.getData();
    expect(result).toBeDefined();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('user can create project', async ({ page }) => {
  await page.goto('/projects/new');
  await page.fill('input[name="title"]', 'Test Project');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*projects\/.*/);
});
```

## Test Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Clear Naming**: Test names should clearly describe what they test
3. **Arrange-Act-Assert**: Structure tests with clear sections
4. **Mock External Dependencies**: Mock database, API calls, and blockchain interactions
5. **Test Edge Cases**: Include tests for error conditions and edge cases
6. **Keep Tests Fast**: Avoid unnecessary delays and async operations
7. **Clean Up**: Reset mocks and state between tests

## CI/CD Integration

Tests are automatically run in CI/CD pipelines:

- **Unit & Integration**: Run on every commit
- **E2E**: Run on pull requests and before deployment
- **Coverage**: Must meet minimum thresholds before merging

## Debugging Tests

### Jest Tests
```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright Tests
```bash
# Run with debugger
npx playwright test --debug

# Run with headed browser
npx playwright test --headed
```

## Common Issues

### Mock Not Working
- Ensure mocks are reset in `beforeEach`
- Check that mocks are imported correctly
- Verify mock setup matches actual implementation

### Async Test Failures
- Use `await` for async operations
- Wait for elements with `waitFor` or `waitForSelector`
- Check for race conditions

### E2E Test Timeouts
- Increase timeout for slow operations
- Use `waitFor` instead of `sleep`
- Check network conditions

## Test Maintenance

1. **Update tests when code changes**
2. **Remove obsolete tests**
3. **Keep test data up to date**
4. **Review coverage reports regularly**
5. **Refactor tests for clarity**

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Next.js Testing](https://nextjs.org/docs/testing)

## Support

For questions or issues with tests, please:
1. Check this guide first
2. Review existing test examples
3. Consult the test README in `__tests__/README.md`
4. Open an issue or contact the team

