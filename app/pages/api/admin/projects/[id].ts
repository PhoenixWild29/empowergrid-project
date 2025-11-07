import type { NextApiResponse } from 'next';
import { ProjectStatus } from '@prisma/client';
import * as z from 'zod';
import {
  withRole,
  type AuthenticatedRequest,
} from '../../../../lib/middleware/authMiddleware';
import { UserRole } from '../../../../types/auth';
import { prisma } from '../../../../lib/prisma';

const UpdateProjectSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  category: z.string().min(2).max(100).optional(),
  location: z.string().min(2).max(200).optional(),
  energyCapacity: z.number().positive().optional(),
  targetAmount: z.number().positive().optional(),
  duration: z.number().int().positive().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'FUNDED', 'COMPLETED', 'CANCELLED']).optional(),
});

/**
 * WO-169: Project Management API Endpoints
 * 
 * GET /api/admin/projects/[id] - Get project by ID
 * PUT /api/admin/projects/[id] - Update project
 * DELETE /api/admin/projects/[id] - Delete project
 */
async function adminProjectHandler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  try {
    if (req.method === 'GET') {
      // GET PROJECT BY ID
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
              walletAddress: true,
            },
          },
          milestones: {
            select: {
              id: true,
              title: true,
              description: true,
              targetAmount: true,
              dueDate: true,
              status: true,
              createdAt: true,
            },
            orderBy: { order: 'asc' },
          },
          fundings: {
            select: {
              id: true,
              amount: true,
              funder: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
              createdAt: true,
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              fundings: true,
              milestones: true,
            },
          },
        },
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      return res.status(200).json({
        success: true,
        project,
      });
    } else if (req.method === 'PUT') {
      // UPDATE PROJECT
      const validation = UpdateProjectSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      const updateData: any = { ...validation.data };

      // Check if project exists
      const existingProject = await prisma.project.findUnique({
        where: { id },
      });

      if (!existingProject) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Update project
      const updatedProject = await prisma.project.update({
        where: { id },
        data: updateData,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      return res.status(200).json({
        success: true,
        project: updatedProject,
      });
    } else if (req.method === 'DELETE') {
      // DELETE PROJECT
      // Check if project exists
      const existingProject = await prisma.project.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              fundings: true,
              milestones: true,
            },
          },
        },
      });

      if (!existingProject) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check for dependencies
      if (existingProject._count.fundings > 0) {
        return res.status(400).json({
          error: 'Cannot delete project',
          message: 'Project has associated fundings. Please remove all fundings first.',
        });
      }

      // Delete project (cascade will handle milestones)
      await prisma.project.delete({
        where: { id },
      });

      return res.status(204).end();
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[Project Management API Error]:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withRole([UserRole.ADMIN], adminProjectHandler);
