import {
  lamportsToSol,
  solToLamports,
  formatPublicKey,
  isValidPublicKey,
  calculateFundingProgress,
  formatNumber,
} from '../../types'

// Mock PublicKey for testing
jest.mock('@solana/web3.js', () => ({
  PublicKey: jest.fn().mockImplementation((key) => ({
    toString: () => key,
    toBuffer: () => Buffer.from(key, 'hex'),
  })),
}))

describe('Utility Functions', () => {
  describe('lamportsToSol', () => {
    it('converts lamports to SOL correctly', () => {
      expect(lamportsToSol(1000000000)).toBe(1)
      expect(lamportsToSol(500000000)).toBe(0.5)
      expect(lamportsToSol(1000000)).toBe(0.001)
      expect(lamportsToSol(0)).toBe(0)
    })
  })

  describe('solToLamports', () => {
    it('converts SOL to lamports correctly', () => {
      expect(solToLamports(1)).toBe(1000000000)
      expect(solToLamports(0.5)).toBe(500000000)
      expect(solToLamports(0.001)).toBe(1000000)
      expect(solToLamports(0)).toBe(0)
    })
  })

  describe('formatPublicKey', () => {
    const testKey = '11111111111111111111111111111112'

    it('formats short keys without truncation', () => {
      expect(formatPublicKey(testKey)).toBe(testKey)
    })

    it('formats long keys with truncation', () => {
      const longKey = 'VeryLongPublicKeyThatShouldBeTruncated12345678901234567890'
      expect(formatPublicKey(longKey)).toBe('VeryL...67890')
    })

    it('respects custom length parameter', () => {
      const longKey = 'VeryLongPublicKeyThatShouldBeTruncated12345678901234567890'
      expect(formatPublicKey(longKey, 6)).toBe('VeryLo...567890')
    })
  })

  describe('isValidPublicKey', () => {
    it('validates correct public keys', () => {
      expect(isValidPublicKey('11111111111111111111111111111112')).toBe(true)
      expect(isValidPublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')).toBe(true)
    })

    it('rejects invalid public keys', () => {
      expect(isValidPublicKey('invalid@#$%')).toBe(false)
      expect(isValidPublicKey('')).toBe(false)
      expect(isValidPublicKey('1111111111111111111111111111111')).toBe(false) // too short
      expect(isValidPublicKey('111111111111111111111111111111123')).toBe(false) // invalid length
      expect(isValidPublicKey('not-a-valid-base58-string!!!')).toBe(false)
    })
  })

  describe('calculateFundingProgress', () => {
    it('calculates progress correctly', () => {
      expect(calculateFundingProgress(500000000, 2)).toBe(25) // 0.5 SOL funded, 2 milestones * 1 SOL target = 2 SOL target
      expect(calculateFundingProgress(1000000000, 1)).toBe(100) // 1 SOL funded, 1 milestone * 1 SOL target = 1 SOL target
      expect(calculateFundingProgress(2000000000, 2)).toBe(100) // 2 SOL funded, 2 milestones * 1 SOL target = 2 SOL target
    })

    it('caps progress at 100%', () => {
      expect(calculateFundingProgress(3000000000, 2)).toBe(100) // 3 SOL funded, but capped at 100%
    })

    it('handles zero milestones', () => {
      expect(calculateFundingProgress(1000000000, 0)).toBe(0)
    })
  })

  describe('formatNumber', () => {
    it('formats regular numbers', () => {
      expect(formatNumber(1000)).toBe('1.00K')
      expect(formatNumber(500)).toBe('500')
    })

    it('formats thousands', () => {
      expect(formatNumber(1500)).toBe('1.50K')
      expect(formatNumber(2500000)).toBe('2.50M')
    })

    it('formats millions', () => {
      expect(formatNumber(1500000)).toBe('1.50M')
      expect(formatNumber(2500000000)).toBe('2.50B')
    })

    it('respects decimal places', () => {
      expect(formatNumber(1500, 1)).toBe('1.5K')
      expect(formatNumber(1500, 3)).toBe('1.500K')
    })
  })
})