import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_RPC_URL = 'https://api.devnet.solana.com';
process.env.NEXT_PUBLIC_PROGRAM_ID =
  'TestProgramId11111111111111111111111111111111';
process.env.NEXT_PUBLIC_CLUSTER = 'devnet';

// Mock fetch for tests
global.fetch = jest.fn();

// Mock window.solana for Phantom wallet
Object.defineProperty(window, 'solana', {
  writable: true,
  value: {
    isPhantom: true,
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Add TextEncoder and TextDecoder for Solana web3.js
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill for setImmediate (needed for winston logger in tests)
global.setImmediate = global.setImmediate || ((fn, ...args) => setTimeout(fn, 0, ...args));

// Mock crypto for Solana
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: jest.fn().mockReturnValue(new Uint8Array(32)),
  },
});

// Mock uuid to avoid ES module issues - return proper UUID format with variation
let uuidCounter = 0;
jest.mock('uuid', () => ({
  v4: jest.fn(() => {
    uuidCounter++;
    // Return different UUIDs by varying the last part
    const hex = uuidCounter.toString(16).padStart(12, '0');
    return `12345678-1234-1234-1234-${hex}`;
  }),
  v1: jest.fn(() => {
    uuidCounter++;
    const hex = uuidCounter.toString(16).padStart(12, '0');
    return `12345678-1234-1234-1234-${hex}`;
  }),
}));

// Mock nanoid to avoid ES module issues - return different values each call
let nanoidCounter = 0;
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => {
    nanoidCounter++;
    return `mock-nanoid-${nanoidCounter.toString().padStart(4, '0')}`;
  }),
  customAlphabet: jest.fn(() => {
    let customCounter = 0;
    return jest.fn(() => {
      customCounter++;
      return `mock-nanoid-custom-${customCounter}`;
    });
  }),
}));

// Mock @solana/web3.js to avoid ES module issues
jest.mock('@solana/web3.js', () => ({
  PublicKey: jest.fn().mockImplementation(value => ({
    value,
    toString: () => value || 'mock-public-key',
    toBase58: () => value || 'mock-public-key',
    equals: jest.fn(other => other && other.value === value),
  })),
  Connection: jest.fn(),
  clusterApiUrl: jest.fn(() => 'https://api.mainnet-beta.solana.com'),
}));
