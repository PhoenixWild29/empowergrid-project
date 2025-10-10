import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import * as z from 'zod';

const prisma = new PrismaClient();

const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(2).max(100).optional(),
  walletAddress: z.string().optional(),
});

/**
 * WO-164: User Management API Endpoints
 * 
 * GET /api/admin/users/[id] - Get user by ID
 * PUT /api/admin/users/[id] - Update user
 * DELETE /api/admin/users/[id] - Delete user
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  // Note: In production, add authentication middleware here
  // const authUser = await getAuthenticatedUser(req);
  // if (!authUser || (authUser.role !== 'ADMIN' && authUser.id !== id)) {
  //   return res.status(403).json({ error: 'Forbidden' });
  // }

  try {
    if (req.method === 'GET') {
      // GET USER BY ID
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          username: true,
          walletAddress: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          projectsCreated: {
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
            },
            take: 5,
          },
          projectsFunded: {
            select: {
              id: true,
              amount: true,
              createdAt: true,
            },
            take: 5,
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({
        success: true,
        user,
      });
    } else if (req.method === 'PUT') {
      // UPDATE USER
      const validation = UpdateUserSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      const updateData = validation.data;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check for email conflict if email is being updated
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailConflict = await prisma.user.findUnique({
          where: { email: updateData.email },
        });

        if (emailConflict) {
          return res.status(409).json({ error: 'Email already in use' });
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
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

      return res.status(200).json({
        success: true,
        user: updatedUser,
      });
    } else if (req.method === 'DELETE') {
      // DELETE USER
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete user (cascade deletes will handle related records)
      await prisma.user.delete({
        where: { id },
      });

      return res.status(204).end();
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

