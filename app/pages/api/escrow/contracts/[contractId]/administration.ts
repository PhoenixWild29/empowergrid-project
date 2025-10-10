/**
 * GET /api/escrow/contracts/[contractId]/administration
 * 
 * WO-105: Contract Administration Data Retrieval API
 * 
 * Features:
 * - Comprehensive contract administration visibility
 * - Governance information and approval workflows
 * - Modification tracking and administrative history
 * - Authorization validation
 * - Filtering and pagination support
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../../lib/middleware/authMiddleware';
import {
  getContractAdministrationData,
  isAuthorizedForAdministration,
  getFilteredAdministrativeHistory,
  type PaginationParams,
  type FilterParams,
} from '../../../../../lib/services/contractAdministrationService';

async function getAdministrationHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { contractId } = req.query;
    const userId = (req as any).userId;

    if (!contractId || typeof contractId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'contractId parameter is required',
      });
    }

    console.log('[WO-105] Fetching administration data for contract:', contractId);

    // WO-105: Authorization validation
    const isAuthorized = await isAuthorizedForAdministration(contractId, userId);

    if (!isAuthorized) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to access this contract administration data',
      });
    }

    // WO-105: Parse pagination parameters
    const pagination: PaginationParams = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    // Validate pagination parameters
    if (pagination.page! < 1) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Page number must be greater than 0',
      });
    }

    if (pagination.limit! < 1 || pagination.limit! > 100) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Limit must be between 1 and 100',
      });
    }

    // WO-105: Parse filter parameters
    const filters: FilterParams = {
      actionType: req.query.actionType as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      authorizedBy: req.query.authorizedBy as string | undefined,
      status: req.query.status as string | undefined,
    };

    // WO-105: Retrieve comprehensive administration data
    const administrationData = await getContractAdministrationData(
      contractId,
      userId,
      pagination,
      filters
    );

    // WO-105: If specific filters are applied, get filtered history
    let filteredHistoryData;
    if (Object.values(filters).some(v => v !== undefined)) {
      filteredHistoryData = await getFilteredAdministrativeHistory(
        contractId,
        filters,
        pagination
      );
    }

    const responseTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      data: {
        ...administrationData,
        // Override with filtered history if filters were applied
        ...(filteredHistoryData && {
          administrativeHistory: filteredHistoryData.data,
          pagination: {
            page: filteredHistoryData.page,
            limit: pagination.limit,
            total: filteredHistoryData.total,
            totalPages: filteredHistoryData.totalPages,
          },
        }),
      },
      metadata: {
        requestedBy: userId,
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
        },
        filtersApplied: Object.keys(filters).filter(
          key => filters[key as keyof FilterParams] !== undefined
        ),
      },
    });

  } catch (error) {
    console.error('[WO-105] Administration data retrieval error:', error);

    if (error instanceof Error && error.message === 'Contract not found') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Contract not found',
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve contract administration data',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(getAdministrationHandler);



