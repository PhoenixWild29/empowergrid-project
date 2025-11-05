/**
 * Comprehensive Mock Utilities for EmpowerGRID Testing
 * Provides mocks for blockchain, database, and external services
 */

import { PublicKey, Connection, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';

// Mock Prisma Client
export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  proposal: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  vote: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  escrowContract: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  milestone: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  session: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
};

// Mock Solana Connection
export const mockConnection = {
  getBalance: jest.fn(),
  getAccountInfo: jest.fn(),
  getLatestBlockhash: jest.fn(),
  sendTransaction: jest.fn(),
  confirmTransaction: jest.fn(),
  getTransaction: jest.fn(),
  getProgramAccounts: jest.fn(),
  onAccountChange: jest.fn(),
  removeAccountChangeListener: jest.fn(),
} as unknown as Connection;

// Mock Anchor Program
export const mockProgram = {
  account: {
    project: {
      fetch: jest.fn(),
      fetchMultiple: jest.fn(),
      all: jest.fn(),
    },
    escrow: {
      fetch: jest.fn(),
      fetchMultiple: jest.fn(),
    },
  },
  methods: {
    initializePlatform: jest.fn(),
    createProject: jest.fn(),
    fundProject: jest.fn(),
    createProposal: jest.fn(),
    castVote: jest.fn(),
    releaseFunds: jest.fn(),
  },
  provider: {
    connection: mockConnection,
    wallet: {
      publicKey: new PublicKey('TestWallet111111111111111111111111111111111'),
    },
  },
} as unknown as Program;

// Mock Anchor Provider
export const mockProvider = {
  connection: mockConnection,
  wallet: {
    publicKey: new PublicKey('TestWallet111111111111111111111111111111111'),
    signTransaction: jest.fn(),
    signAllTransactions: jest.fn(),
  },
  sendAndConfirm: jest.fn(),
} as unknown as AnchorProvider;

// Mock Wallet Adapter
export const mockWallet = {
  publicKey: new PublicKey('TestWallet111111111111111111111111111111111'),
  signTransaction: jest.fn(),
  signAllTransactions: jest.fn(),
  signMessage: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
};

// Mock Logger
export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  logSecurityEvent: jest.fn(),
};

// Mock Fetch Response Helper
export const createMockFetchResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  headers: new Headers(),
});

// Mock User Data
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  walletAddress: 'HXtBm8XZbxaTt41uqaKhwUAa6Z1aPyvJdsZVENiWsetg', // Valid base58 Solana address
  username: 'testuser',
  email: 'test@example.com',
  role: 'FUNDER' as const,
  reputationScore: 100,
  verified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Mock Project Data
export const createMockProject = (overrides = {}) => ({
  id: 'project-123',
  name: 'Test Solar Project',
  description: 'A test renewable energy project',
  creatorId: 'user-123',
  status: 'ACTIVE' as const,
  fundingGoal: 1000000000, // 1 SOL in lamports
  fundedAmount: 500000000, // 0.5 SOL
  category: 'SOLAR',
  location: 'Test Location',
  createdAt: new Date(),
  updatedAt: new Date(),
  milestones: [],
  ...overrides,
});

// Mock Proposal Data
export const createMockProposal = (overrides = {}) => ({
  id: 'proposal-123',
  title: 'Test Proposal',
  description: 'Test proposal description',
  type: 'PROJECT_FUNDING' as const,
  status: 'ACTIVE' as const,
  creatorId: 'user-123',
  votesFor: 100,
  votesAgainst: 50,
  totalVotingPower: 150,
  startDate: new Date(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Mock Escrow Contract Data
export const createMockEscrowContract = (overrides = {}) => ({
  id: 'escrow-123',
  contractId: 'contract-123',
  projectId: 'project-123',
  creatorId: 'user-123',
  funderId: 'user-456',
  totalAmount: 1000000000,
  releasedAmount: 0,
  status: 'ACTIVE' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  milestones: [],
  ...overrides,
});

// Mock Session Data
export const createMockSession = (overrides = {}) => ({
  id: 'session-123',
  userId: 'user-123',
  token: 'mock-jwt-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
  createdAt: new Date(),
  ...overrides,
});

// Mock Oracle Data
export const createMockOracleData = (overrides = {}) => ({
  feedId: 'feed-123',
  value: 1000,
  timestamp: Date.now(),
  confidence: 0.95,
  signature: 'mock-signature',
  ...overrides,
});

// Reset all mocks
export const resetAllMocks = () => {
  jest.clearAllMocks();
  Object.values(mockPrisma).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((method) => {
        if (jest.isMockFunction(method)) {
          method.mockClear();
        }
      });
    }
  });
};

// Setup default mock implementations
export const setupDefaultMocks = () => {
  // Default Prisma mocks
  mockPrisma.user.findUnique.mockResolvedValue(null);
  mockPrisma.user.findFirst.mockResolvedValue(null);
  mockPrisma.user.findMany.mockResolvedValue([]);
  mockPrisma.user.create.mockResolvedValue(createMockUser());
  mockPrisma.user.update.mockResolvedValue(createMockUser());
  
  mockPrisma.project.findUnique.mockResolvedValue(null);
  mockPrisma.project.findMany.mockResolvedValue([]);
  mockPrisma.project.create.mockResolvedValue(createMockProject());
  mockPrisma.project.update.mockResolvedValue(createMockProject());
  
  // Default Connection mocks
  mockConnection.getBalance.mockResolvedValue(1000000000); // 1 SOL
  mockConnection.getLatestBlockhash.mockResolvedValue({
    blockhash: 'mock-blockhash',
    lastValidBlockHeight: 100,
  });
  mockConnection.sendTransaction.mockResolvedValue('mock-signature');
  mockConnection.confirmTransaction.mockResolvedValue({
    value: { err: null },
  });
  
  // Default Program mocks
  mockProgram.account.project.fetch.mockResolvedValue(null);
  mockProgram.account.project.fetchMultiple.mockResolvedValue([]);
  mockProgram.account.project.all.mockResolvedValue([]);
  
  // Default Fetch mock
  (global.fetch as jest.Mock) = jest.fn().mockResolvedValue(
    createMockFetchResponse({})
  );
};

