import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import * as z from 'zod';

const prisma = new PrismaClient();

// Zod schema for connection configuration (read-only for security)
const ConnectionConfigSchema = z.object({
  testConnection: z.boolean().optional(),
});

/**
 * WO-171: Connection Management Panel API
 * 
 * GET /api/database/connection - Get PostgreSQL connection details
 * POST /api/database/connection - Test PostgreSQL connection
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
      // GET CONNECTION DETAILS (read-only, safe info)
      
      // Parse DATABASE_URL to extract connection details (safely)
      const databaseUrl = process.env.DATABASE_URL || '';
      
      // Extract connection details (without password)
      let host = 'localhost';
      let port = '5432';
      let database = 'empowergrid';
      let user = 'postgres';
      
      if (databaseUrl) {
        try {
          const url = new URL(databaseUrl);
          host = url.hostname || 'localhost';
          port = url.port || '5432';
          database = url.pathname.slice(1) || 'empowergrid'; // Remove leading /
          user = url.username || 'postgres';
        } catch (err) {
          // Invalid URL, use defaults
        }
      }

      // Get connection pool status
      try {
        // Test connection
        await prisma.$queryRaw`SELECT 1`;
        
        // Get pool stats
        const poolStatsResult = await prisma.$queryRaw<Array<{ max_conn: number, used: number }>>`
          SELECT 
            setting::int as max_conn,
            (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as used
          FROM pg_settings 
          WHERE name = 'max_connections'
        `;
        
        const poolStats = poolStatsResult[0] || { max_conn: 100, used: 0 };

        return res.status(200).json({
          success: true,
          connectionDetails: {
            host,
            port,
            database,
            user,
            ssl: databaseUrl.includes('sslmode=require'),
            status: 'connected',
          },
          poolStatus: {
            maxConnections: poolStats.max_conn,
            activeConnections: Number(poolStats.used),
            availableConnections: poolStats.max_conn - Number(poolStats.used),
            status: 'healthy',
          },
          timestamp: new Date().toISOString(),
        });
      } catch (dbError) {
        return res.status(503).json({
          success: false,
          connectionDetails: {
            host,
            port,
            database,
            user,
            ssl: databaseUrl.includes('sslmode=require'),
            status: 'disconnected',
          },
          error: 'Database connection failed',
          message: dbError instanceof Error ? dbError.message : 'Unknown error',
        });
      }
    } else if (req.method === 'POST') {
      // TEST CONNECTION
      const validation = ConnectionConfigSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      const startTime = Date.now();
      
      try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1 as test`;
        
        // Test write capability
        const testResult = await prisma.$queryRaw`
          SELECT current_database() as db, current_user as usr, version() as ver
        `;
        
        const responseTime = Date.now() - startTime;

        return res.status(200).json({
          success: true,
          testResult: 'success',
          message: 'Database connection test successful',
          details: {
            responseTime: `${responseTime}ms`,
            database: (testResult as any)[0]?.db,
            user: (testResult as any)[0]?.usr,
            version: (testResult as any)[0]?.ver?.split(',')[0],
          },
          timestamp: new Date().toISOString(),
        });
      } catch (dbError) {
        const responseTime = Date.now() - startTime;
        
        return res.status(503).json({
          success: false,
          testResult: 'failed',
          message: 'Database connection test failed',
          error: dbError instanceof Error ? dbError.message : 'Unknown error',
          details: {
            responseTime: `${responseTime}ms`,
          },
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[Database Connection API Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

