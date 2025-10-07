import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock QueryClient for React Query
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    const queryClient = createTestQueryClient();
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  return render(ui, { wrapper: TestWrapper, ...options });
};

// Mock wallet hook
export const mockWalletHook = {
  address: 'TestWalletAddress11111111111111111111111111111111',
  connected: true,
  connecting: false,
  connect: jest.fn(),
  disconnect: jest.fn(),
  publicKey: null, // Will be set in tests
};

// Mock program utilities
export const mockProgramUtils = {
  getConnection: jest.fn(),
  getProvider: jest.fn(),
  getProgram: jest.fn(),
  fetchProjects: jest.fn(),
  fetchProject: jest.fn(),
  createProject: jest.fn(),
};

// Test data generators
export const createMockProject = (overrides = {}) => ({
  id: 1,
  name: 'Test Solar Project',
  description: 'A test renewable energy project',
  creator: 'CreatorAddress11111111111111111111111111111111',
  governanceAuthority: 'GovernanceAddress11111111111111111111111111111111',
  oracleAuthority: 'OracleAddress11111111111111111111111111111111',
  vault: 'VaultAddress11111111111111111111111111111111',
  vaultBump: 255,
  fundedAmount: 1000000000, // 1 SOL
  kwhTotal: 1000,
  co2Total: 400,
  lastMetricsRoot: new Array(32).fill(0),
  numMilestones: 3,
  ...overrides,
});

export const createMockMilestone = (overrides = {}) => ({
  project: 'ProjectAddress11111111111111111111111111111111',
  index: 0,
  amountLamports: 500000000, // 0.5 SOL
  kwhTarget: 500,
  co2Target: 200,
  payee: 'PayeeAddress11111111111111111111111111111111',
  released: false,
  ...overrides,
});

// Export custom render as default
export { customRender as render };

// Re-export everything from testing-library
export * from '@testing-library/react';
export * from '@testing-library/jest-dom';

describe('testUtils', () => {
  it('should export custom render function', () => {
    expect(typeof customRender).toBe('function');
  });

  it('should export mock utilities', () => {
    expect(mockWalletHook).toBeDefined();
    expect(mockProgramUtils).toBeDefined();
  });

  it('should export test data generators', () => {
    expect(typeof createMockProject).toBe('function');
    expect(typeof createMockMilestone).toBe('function');
  });
});
