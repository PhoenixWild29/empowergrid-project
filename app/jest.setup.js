import '@testing-library/jest-dom'

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
    }
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_RPC_URL = 'https://api.devnet.solana.com'
process.env.NEXT_PUBLIC_PROGRAM_ID = 'TestProgramId11111111111111111111111111111111'
process.env.NEXT_PUBLIC_CLUSTER = 'devnet'

// Mock fetch for tests
global.fetch = jest.fn()

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
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

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
})

// Add TextEncoder and TextDecoder for Solana web3.js
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock crypto for Solana
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: jest.fn().mockReturnValue(new Uint8Array(32)),
  },
})

// Mock uuid to avoid ES module issues
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
  v1: jest.fn(() => 'mock-uuid-v1-1234'),
}))

// Mock @solana/web3.js to avoid ES module issues
jest.mock('@solana/web3.js', () => ({
  PublicKey: jest.fn().mockImplementation((value) => ({
    value,
    toString: () => value || 'mock-public-key',
    toBase58: () => value || 'mock-public-key',
    equals: jest.fn((other) => other && other.value === value),
  })),
  Connection: jest.fn(),
  clusterApiUrl: jest.fn(() => 'https://api.mainnet-beta.solana.com'),
}))