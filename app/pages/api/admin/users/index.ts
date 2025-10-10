import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import * as z from 'zod';

const prisma = new PrismaClient();

// Zod schemas for validation
const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  username: z.string().min(2, 'Username must be at least 2 characters').max(100),
  walletAddress: z.string().min(32, 'Invalid wallet address'),
  role: z.enum(['ADMIN', 'CREATOR', 'FUNDER']).optional(),
});

const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(2).max(100).optional(),
  walletAddress: z.string().optional(),
  role: z.enum(['ADMIN', 'CREATOR', 'FUNDER']).optional(),
});

const QuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  role: z.string().optional(),
});

/**
 * WO-164: User Management API Endpoints
 * 
 * POST /api/admin/users - Create new user
 * GET /api/admin/users - List users with pagination and filtering
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Note: In production, add authentication middleware here
  // const user = await getAuthenticatedUser(req);
  // if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  try {
    if (req.method === 'POST') {
      // CREATE USER
      const validation = CreateUserSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      const { email, username, walletAddress, role } = validation.data;

      // Check for duplicate wallet address
      const existingUser = await prisma.user.findUnique({
        where: { walletAddress },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'User with this wallet address already exists' });
      }

      // Create user
      const newUser = await prisma.user.create({
        data: {
          email,
          username,
          walletAddress,
          role: role || 'FUNDER',
        },
        select: {
          id: true,
          email: true,
          username: true,
          walletAddress: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(201).json({
        success: true,
        user: newUser,
      });
    } else if (req.method === 'GET') {
      // LIST USERS
      const queryValidation = QuerySchema.safeParse(req.query);
      
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: queryValidation.error.errors,
        });
      }

      const { page = '1', limit = '10', search, role } = queryValidation.data;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {};
      
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get users with pagination
      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limitNum,
          select: {
            id: true,
            email: true,
            username: true,
            walletAddress: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[User Management API Error]:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

