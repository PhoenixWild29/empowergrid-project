import type { NextApiResponse } from 'next';
import { ProjectStatus } from '@prisma/client';
import * as z from 'zod';
import {
  withRole,
  type AuthenticatedRequest,
} from '../../../../lib/middleware/authMiddleware';
import { UserRole } from '../../../../types/auth';
import { prisma } from '../../../../lib/prisma';

// Zod schemas
const CreateProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(2).max(100),
  location: z.string().min(2).max(200),
  energyCapacity: z.number().positive('Capacity must be positive').optional(),
  targetAmount: z.number().positive('Target amount must be positive'),
  duration: z.number().int().positive('Duration must be positive'),
  creatorId: z.string().cuid('Invalid creator ID'),
  programId: z.string().min(1),
  projectPDA: z.string().min(1),
});

const QuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'FUNDED', 'COMPLETED', 'CANCELLED']).optional(),
  creatorId: z.string().optional(),
});

/**
 * WO-169: Project Management API Endpoints
 * 
 * POST /api/admin/projects - Create new project
 * GET /api/admin/projects - List projects with pagination and filtering
 */
async function adminProjectsHandler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'POST') {
      // CREATE PROJECT
      const validation = CreateProjectSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      const { creatorId, ...projectData } = validation.data;

      // Verify creator exists
      const creator = await prisma.user.findUnique({
        where: { id: creatorId },
      });

      if (!creator) {
        return res.status(404).json({ error: 'Creator not found' });
      }

      // Create project
      const newProject = await prisma.project.create({
        data: {
          ...projectData,
          status: ProjectStatus.DRAFT,
          currentAmount: 0,
          tags: [],
          images: [],
          creator: {
            connect: { id: creatorId },
          },
        },
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

      return res.status(201).json({
        success: true,
        project: newProject,
      });
    } else if (req.method === 'GET') {
      // LIST PROJECTS
      const queryValidation = QuerySchema.safeParse(req.query);
      
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: queryValidation.error.errors,
        });
      }

      const { page = '1', limit = '10', search, status, creatorId } = queryValidation.data;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {};
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) {
        where.status = status;
      }

      if (creatorId) {
        where.creatorId = creatorId;
      }

      // Get projects with pagination
      const [projects, totalCount] = await Promise.all([
        prisma.project.findMany({
          where,
          skip,
          take: limitNum,
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            milestones: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
            _count: {
              select: {
                fundings: true,
                milestones: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.project.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        projects,
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
    console.error('[Project Management API Error]:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withRole([UserRole.ADMIN], adminProjectsHandler);
