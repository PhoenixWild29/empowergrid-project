/**
 * POST /api/contracts/[contractId]/upgrade
 * 
 * WO-109: Contract upgrade management API
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';
import {
  initiateContractUpgrade,
  performStateMigration,
  rollbackContractVersion,
  testUpgradeCompatibility,
  getUpgradeHistory,
} from '../../../../lib/services/contractUpgradeService';
import { z } from 'zod';

const UpgradeRequestSchema = z.object({
  action: z.enum(['INITIATE', 'MIGRATE', 'ROLLBACK', 'TEST', 'HISTORY']),
  newVersion: z.string().optional(),
  migrationPlan: z.string().optional(),
  upgradeId: z.string().optional(),
});

async function upgradeHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contractId } = req.query;
  const userId = (req as any).userId;

  if (!contractId || typeof contractId !== 'string') {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'contractId parameter is required',
    });
  }

  try {
    const validatedData = UpgradeRequestSchema.parse(req.body);

    switch (validatedData.action) {
      case 'INITIATE':
        if (!validatedData.newVersion || !validatedData.migrationPlan) {
          return res.status(400).json({
            error: 'Invalid request',
            message: 'newVersion and migrationPlan required for INITIATE',
          });
        }

        const upgradeRecord = await initiateContractUpgrade({
          contractId,
          newVersion: validatedData.newVersion,
          migrationPlan: validatedData.migrationPlan,
          authorizedBy: userId,
        });

        return res.status(201).json({
          success: true,
          message: 'Contract upgrade initiated',
          upgrade: upgradeRecord,
        });

      case 'MIGRATE':
        if (!validatedData.upgradeId) {
          return res.status(400).json({
            error: 'Invalid request',
            message: 'upgradeId required for MIGRATE',
          });
        }

        const migration = await performStateMigration(contractId, validatedData.upgradeId);

        return res.status(200).json({
          success: true,
          message: 'State migration completed',
          migration,
        });

      case 'ROLLBACK':
        if (!validatedData.upgradeId) {
          return res.status(400).json({
            error: 'Invalid request',
            message: 'upgradeId required for ROLLBACK',
          });
        }

        await rollbackContractVersion(contractId, validatedData.upgradeId, userId);

        return res.status(200).json({
          success: true,
          message: 'Contract rolled back to previous version',
        });

      case 'TEST':
        const currentVersion = '1.0.0'; // Would fetch from contract
        const newVersion = validatedData.newVersion || '2.0.0';
        
        const compatibility = await testUpgradeCompatibility(currentVersion, newVersion);

        return res.status(200).json({
          success: true,
          compatibility,
        });

      case 'HISTORY':
        const history = await getUpgradeHistory(contractId);

        return res.status(200).json({
          success: true,
          history,
        });

      default:
        return res.status(400).json({
          error: 'Invalid action',
          message: 'Unknown action type',
        });
    }

  } catch (error) {
    console.error('[WO-109] Upgrade error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to process upgrade request',
    });
  }
}

export default withAuth(upgradeHandler);



