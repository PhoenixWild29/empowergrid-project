import { createMocks } from 'node-mocks-http'
import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/actions/fund/[project]'

// Mock the Solana web3.js and Anchor dependencies
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getLatestBlockhash: jest.fn().mockResolvedValue({
      blockhash: 'test-blockhash',
      lastValidBlockHeight: 100000,
    }),
  })),
  PublicKey: jest.fn().mockImplementation((key) => ({
    toString: () => key,
    toBuffer: () => Buffer.from(key, 'hex'),
    findProgramAddressSync: jest.fn().mockReturnValue([{}, 255]),
  })),
  SystemProgram: {
    programId: '11111111111111111111111111111112',
  },
  ComputeBudgetProgram: {
    setComputeUnitLimit: jest.fn().mockReturnValue({
      keys: [],
      programId: 'ComputeBudget111111111111111111111111111111',
      data: Buffer.alloc(0),
    }),
  },
  Transaction: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    serialize: jest.fn().mockReturnValue({
      toString: jest.fn().mockReturnValue('mock-serialized-tx'),
    }),
  })),
}))

jest.mock('@coral-xyz/anchor', () => ({
  AnchorProvider: jest.fn().mockImplementation(() => ({})),
  Program: jest.fn().mockImplementation(() => ({
    account: {
      project: {
        fetch: jest.fn().mockResolvedValue({
          vault: 'vault-address',
          vaultBump: 255,
        }),
      },
    },
    methods: {
      fundProject: jest.fn().mockReturnValue({
        accounts: jest.fn().mockReturnValue({
          instruction: jest.fn().mockReturnValue({
            keys: [],
            programId: 'program-id',
            data: Buffer.alloc(0),
          }),
        }),
      }),
    },
  })),
  BN: jest.fn().mockImplementation((value) => ({ toString: () => value.toString() })),
}))

describe('/api/actions/fund/[project]', () => {
  const mockProjectId = 'test-project-address'

  describe('GET requests', () => {
    it('returns action metadata for valid project', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { project: mockProjectId },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)

      const data = JSON.parse(res._getData())
      expect(data.type).toBe('action')
      expect(data.title).toBe('Fund an EmpowerGRID Project')
      expect(data.description).toContain(mockProjectId.slice(0, 4))
      expect(data.label).toBe('Fund with SOL')
      expect(data.links.actions).toHaveLength(3)
    })

    it('returns different funding amounts in actions', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { project: mockProjectId },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      const actions = data.links.actions

      expect(actions[0].label).toBe('Fund 0.1 SOL')
      expect(actions[1].label).toBe('Fund 1 SOL')
      expect(actions[2].label).toBe('Custom')
      expect(actions[2].href).toContain('amount={amount}')
    })

    it('returns 400 for missing project parameter', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.message).toBe('Bad project')
    })
  })

  describe('POST requests', () => {
    const validPostBody = {
      account: 'user-wallet-address',
    }

    it('creates funding transaction successfully', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        query: { project: mockProjectId, amount: '0.5' },
        body: validPostBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)

      const data = JSON.parse(res._getData())
      expect(data.transaction).toBe('mock-serialized-tx')
      expect(data.message).toContain('Funding project')
      expect(data.message).toContain('0.5 SOL')
    })

    it('uses default amount when not specified', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        query: { project: mockProjectId },
        body: validPostBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.message).toContain('0.1 SOL') // default amount
    })

    it('validates amount parameter', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        query: { project: mockProjectId, amount: 'invalid' },
        body: validPostBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.message).toBe('Invalid amount')
    })

    it('rejects zero amount', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        query: { project: mockProjectId, amount: '0' },
        body: validPostBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.message).toBe('Invalid amount')
    })

    it('rejects negative amount', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        query: { project: mockProjectId, amount: '-1' },
        body: validPostBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.message).toBe('Invalid amount')
    })

    it('requires account in request body', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        query: { project: mockProjectId, amount: '0.1' },
        body: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.message).toBe('Missing account')
    })

    it('sets CORS headers', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'OPTIONS',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      // CORS headers should be set
      expect(res._getHeaders()).toHaveProperty('access-control-allow-origin')
    })
  })

  describe('Unsupported methods', () => {
    it('returns 405 for PUT requests', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'PUT',
        query: { project: mockProjectId },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const data = JSON.parse(res._getData())
      expect(data.message).toBe('Method not allowed')
    })
  })
})