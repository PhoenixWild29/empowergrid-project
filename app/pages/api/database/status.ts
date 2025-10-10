import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * WO-167 & WO-166: PostgreSQL Integration Layer - Database Status API
 * 
 * GET /api/database/status - Get PostgreSQL database health metrics
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Note: In production, add admin authentication middleware
  // const user = await getAuthenticatedUser(req);
  // if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  try {
    if (req.method === 'GET') {
      // Check database connection
      const startTime = Date.now();
      
      try {
        // Test connection by running a simple query
        await prisma.$queryRaw`SELECT 1 as test`;
        const responseTime = Date.now() - startTime;

        // Get database size (PostgreSQL-specific query)
        const sizeResult = await prisma.$queryRaw<Array<{ size: bigint }>>`
          SELECT pg_database_size(current_database()) as size
        `;
        const dbSizeBytes = Number(sizeResult[0]?.size || 0);
        
        // Convert to appropriate unit (MB/GB/TB)
        let dbSize: string;
        let dbSizeValue: number;
        let dbSizeUnit: string;
        
        if (dbSizeBytes < 1024 * 1024 * 1024) {
          // Less than 1 GB - show in MB
          dbSizeValue = dbSizeBytes / (1024 * 1024);
          dbSizeUnit = 'MB';
          dbSize = `${dbSizeValue.toFixed(2)} MB`;
        } else if (dbSizeBytes < 1024 * 1024 * 1024 * 1024) {
          // Less than 1 TB - show in GB
          dbSizeValue = dbSizeBytes / (1024 * 1024 * 1024);
          dbSizeUnit = 'GB';
          dbSize = `${dbSizeValue.toFixed(2)} GB`;
        } else {
          // Show in TB
          dbSizeValue = dbSizeBytes / (1024 * 1024 * 1024 * 1024);
          dbSizeUnit = 'TB';
          dbSize = `${dbSizeValue.toFixed(2)} TB`;
        }

        // Get active connections count
        const connectionsResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT count(*) as count 
          FROM pg_stat_activity 
          WHERE state = 'active'
        `;
        const activeConnections = Number(connectionsResult[0]?.count || 0);

        // Get total connections
        const totalConnectionsResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT count(*) as count FROM pg_stat_activity
        `;
        const totalConnections = Number(totalConnectionsResult[0]?.count || 0);

        // Get database version
        const versionResult = await prisma.$queryRaw<Array<{ version: string }>>`
          SELECT version() as version
        `;
        const dbVersion = versionResult[0]?.version || 'Unknown';

        return res.status(200).json({
          success: true,
          status: 'connected',
          connectionStatus: 'healthy',
          metrics: {
            responseTime: `${responseTime}ms`,
            databaseSize: dbSize,
            databaseSizeBytes: dbSizeBytes,
            databaseSizeValue: dbSizeValue,
            databaseSizeUnit: dbSizeUnit,
            activeConnections,
            totalConnections,
            maxConnections: 100, // Default PostgreSQL max_connections
            version: dbVersion.split(',')[0], // First part of version string
            uptime: 'N/A', // Would require tracking
          },
          timestamp: new Date().toISOString(),
        });
      } catch (dbError) {
        console.error('[Database Status] Connection error:', dbError);
        return res.status(503).json({
          success: false,
          status: 'disconnected',
          connectionStatus: 'error',
          error: 'Database connection failed',
          message: dbError instanceof Error ? dbError.message : 'Unknown database error',
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[Database Status API Error]:', error);
    return res.status(500).json({
      success: false,
      status: 'error',
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

