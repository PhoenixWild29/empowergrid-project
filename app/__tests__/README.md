# Testing Suite

This directory contains comprehensive tests for the EmpowerGRID application.

## Test Structure

```
__tests__/
├── components/          # React component tests
├── pages/
│   └── api/            # API endpoint tests
├── utils/              # Utility function tests
├── utils/
│   └── test-utils.tsx  # Testing utilities and mocks
├── jest.config.js      # Jest configuration
├── jest.setup.js       # Jest setup file
└── README.md           # This file
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Categories

### 1. **Utility Function Tests** (`utils/program.test.ts`)

- **lamportsToSol / solToLamports**: SOL conversion functions
- **formatPublicKey**: Address formatting and validation
- **isValidPublicKey**: Public key validation
- **calculateFundingProgress**: Progress calculation logic
- **formatNumber**: Number formatting utilities

### 2. **Component Tests** (`components/ProjectCard.test.tsx`)

- **ProjectCard**: Project display component
  - Renders project information correctly
  - Displays funding progress
  - Shows active status
  - Handles edge cases (no funding, zero milestones)
  - Large number formatting

### 3. **API Endpoint Tests**

- **`/api/meter/latest`**: Meter reading API
  - Returns correct data structure
  - Increments readings on multiple calls
  - Realistic energy values
  - Proper HTTP method handling
  - CO2/kWh ratio consistency

- **`/api/actions/fund/[project]`**: Solana Actions funding
  - GET: Returns action metadata
  - POST: Creates funding transactions
  - Input validation (amount, account)
  - CORS headers
  - Error handling

## Testing Utilities

### **Test Utils** (`utils/test-utils.tsx`)

- Custom render function with providers
- Mock data generators (`createMockProject`, `createMockMilestone`)
- Wallet and program mocks
- React Query test client

### **Mock Setup** (`jest.setup.js`)

- Next.js router mocking
- Environment variables
- Window.solana (Phantom wallet) mocking
- LocalStorage mocking
- MatchMedia mocking

## Mock Strategy

### **Blockchain Mocks**

- **@solana/web3.js**: Connection, PublicKey, Transaction mocks
- **@coral-xyz/anchor**: Program, Provider, BN mocks
- **Phantom Wallet**: Window.solana mock with connect/disconnect

### **API Mocks**

- **fetch**: Global fetch mocking for API calls
- **node-mocks-http**: HTTP request/response mocking for API tests

## Coverage Goals

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Test Patterns

### **Component Testing**

```typescript
import { render, screen } from '../utils/test-utils'

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName prop={value} />)
    expect(screen.getByText('expected text')).toBeInTheDocument()
  })
})
```

### **API Testing**

```typescript
import { createMocks } from 'node-mocks-http';

describe('/api/endpoint', () => {
  it('returns correct response', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
  });
});
```

### **Utility Testing**

```typescript
describe('utilityFunction', () => {
  it('handles normal case', () => {
    expect(utilityFunction(input)).toBe(expected);
  });

  it('handles edge cases', () => {
    expect(utilityFunction(edgeCase)).toBe(expected);
  });
});
```

## Test Coverage

### Services Tests
- ✅ **AuthService**: Authentication and session management
- ✅ **ProjectService**: Project CRUD operations
- ✅ **GovernanceService**: Proposals and voting
- ✅ **OracleService**: Oracle data fetching and verification
- ✅ **ReputationService**: User reputation management

### API Endpoint Tests
- ✅ **Projects API**: Create, list, filter projects
- ✅ **Auth API**: Login, logout, session management
- ✅ **Governance API**: Proposals and voting endpoints

### Integration Tests
- ✅ **Funding Workflow**: Complete funding flow from creation to release
- ✅ **Governance Workflow**: Proposal creation, voting, execution
- ✅ **Oracle Verification**: Milestone verification with oracles

### E2E Tests (Playwright)
- ✅ **Homepage**: Navigation and UI elements
- ✅ **Projects Page**: Listing, filtering, search
- ✅ **Wallet Connection**: Authentication flow

## Additional Test Resources

- **Contract Tests**: Anchor program instruction testing (planned)
- **Performance Tests**: Load and stress testing (planned)
- **Accessibility Tests**: a11y compliance (planned)

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing documentation.

## CI/CD Integration

Tests are configured to run in CI/CD pipelines with:

- Automated test execution
- Coverage reporting
- Failure notifications
- Branch protection rules
