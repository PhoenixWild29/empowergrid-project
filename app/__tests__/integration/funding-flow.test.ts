/**
 * Integration test for the complete funding flow
 * This test simulates the end-to-end process of funding a project
 */

import { createMocks } from 'node-mocks-http'
import meterHandler from '../../pages/api/meter/latest'
import fundingHandler from '../../pages/api/actions/fund/[project]'

// Mock blockchain interactions
jest.mock('@solana/web3.js')
jest.mock('@coral-xyz/anchor')

describe('Funding Flow Integration', () => {
  const mockProjectId = 'test-project-address'
  const mockWalletAddress = 'user-wallet-address'

  it('completes full funding workflow', async () => {
    // Step 1: Get meter reading
    const { req: meterReq, res: meterRes } = createMocks({
      method: 'GET',
    })

    await meterHandler(meterReq, meterRes)
    expect(meterRes._getStatusCode()).toBe(200)

    const meterData = JSON.parse(meterRes._getData())
    expect(meterData).toHaveProperty('kwh')
    expect(meterData).toHaveProperty('co2')

    // Step 2: Get funding action metadata
    const { req: actionReq, res: actionRes } = createMocks({
      method: 'GET',
      query: { project: mockProjectId },
    })

    await fundingHandler(actionReq, actionRes)
    expect(actionRes._getStatusCode()).toBe(200)

    const actionData = JSON.parse(actionRes._getData())
    expect(actionData.type).toBe('action')
    expect(actionData.links.actions).toHaveLength(3)

    // Step 3: Create funding transaction
    const { req: fundingReq, res: fundingRes } = createMocks({
      method: 'POST',
      query: { project: mockProjectId, amount: '0.5' },
      body: { account: mockWalletAddress },
    })

    await fundingHandler(fundingReq, fundingRes)
    expect(fundingRes._getStatusCode()).toBe(200)

    const fundingData = JSON.parse(fundingRes._getData())
    expect(fundingData).toHaveProperty('transaction')
    expect(fundingData.message).toContain('0.5 SOL')

    // Verify transaction structure (mocked)
    expect(fundingData.transaction).toBe('mock-serialized-tx')
  })

  it('handles invalid funding amounts', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { project: mockProjectId, amount: '0' },
      body: { account: mockWalletAddress },
    })

    await fundingHandler(req, res)
    expect(res._getStatusCode()).toBe(400)

    const errorData = JSON.parse(res._getData())
    expect(errorData.message).toBe('Invalid amount')
  })

  it('requires wallet connection for funding', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { project: mockProjectId, amount: '0.1' },
      body: {}, // Missing account
    })

    await fundingHandler(req, res)
    expect(res._getStatusCode()).toBe(400)

    const errorData = JSON.parse(res._getData())
    expect(errorData.message).toBe('Missing account')
  })

  it('validates project addresses', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { project: '' }, // Empty project
    })

    await fundingHandler(req, res)
    expect(res._getStatusCode()).toBe(400)

    const errorData = JSON.parse(res._getData())
    expect(errorData.message).toBe('Bad project')
  })
})