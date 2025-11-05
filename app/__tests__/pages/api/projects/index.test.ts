/**
 * Projects API Endpoint Tests
 */

import { createMocks } from 'node-mocks-http';
import { createMockUser, createMockProject, resetAllMocks } from '../../../utils/mocks';

// Mock prisma - use path alias for consistency
jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('@/lib/middleware/authMiddleware', () => ({
  withAuth: jest.fn((handler) => handler),
  withOptionalAuth: jest.fn((handler) => handler),
}));

// Import handler and prisma after mocks
import handler from '@/pages/api/projects/index';
import { prisma } from '@/lib/prisma';

describe('/api/projects', () => {
  const mockUser = createMockUser({ role: 'CREATOR' });
  const mockProject = createMockProject({ creatorId: mockUser.id });

  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
  });

  describe('POST /api/projects', () => {
    it('should create a project successfully', async () => {
      const projectData = {
        title: 'Test Solar Project',
        description: 'A test renewable energy project that meets the minimum length requirement',
        location: 'Test Location',
        category: 'SOLAR',
        tags: ['solar', 'renewable'],
        fundingTarget: 1000000, // 1 million (within 10 million max)
        energyCapacity: 1000,
        duration: 90,
        milestones: [
          {
            title: 'Installation',
            description: 'Install solar panels',
            targetAmount: 500000,
            energyTarget: 500,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          },
        ],
      };

      (prisma.project.create as jest.Mock).mockResolvedValue({
        ...mockProject,
        title: projectData.title,
        description: projectData.description,
        location: projectData.location,
        category: projectData.category,
        tags: projectData.tags,
        targetAmount: projectData.fundingTarget,
        energyCapacity: projectData.energyCapacity,
        duration: projectData.duration,
        status: 'DRAFT',
        creatorId: mockUser.id,
        creator: {
          id: mockUser.id,
          username: mockUser.username,
          reputation: mockUser.reputationScore,
        },
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: projectData,
        headers: {
          'content-type': 'application/json',
        },
      });
      (req as any).userId = mockUser.id;
      (req as any).userRole = 'CREATOR';
      (req as any).body = projectData;

      await handler(req, res);

      const statusCode = res._getStatusCode();
      if (statusCode !== 201) {
        const errorData = JSON.parse(res._getData());
        console.log('Validation error:', errorData);
      }
      expect(statusCode).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.project).toBeDefined();
      expect(data.project.id).toBeDefined();
      expect(data.project.status).toBe('DRAFT');
    });

    it('should reject project creation for non-creator users', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Project',
          description: 'Test',
          location: 'Test',
          category: 'SOLAR',
        },
      });
      (req as any).userId = mockUser.id;
      (req as any).userRole = 'FUNDER';

      await handler(req, res);

      expect(res._getStatusCode()).toBe(403);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Forbidden');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        title: '',
        description: '',
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: invalidData,
      });
      (req as any).userId = mockUser.id;
      (req as any).userRole = 'CREATOR';

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Invalid input');
    });

    it('should handle database errors', async () => {
      (prisma.project.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Project',
          description: 'Test description that is long enough to pass validation',
          location: 'Test Location',
          category: 'SOLAR',
          tags: ['solar'],
          fundingTarget: 1000000,
          energyCapacity: 1000,
          milestones: [
            {
              order: 1,
              title: 'Installation',
              description: 'Install solar panels',
              targetAmount: 500000,
              energyTarget: 500,
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            },
          ],
        },
      });
      (req as any).userId = mockUser.id;
      (req as any).userRole = 'CREATOR';

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });
  });

  describe('GET /api/projects', () => {
    it('should list projects with pagination', async () => {
      const projectsWithRelations = [
        {
          ...mockProject,
          creator: {
            id: mockUser.id,
            username: mockUser.username,
            reputation: mockUser.reputationScore || 0,
            verified: false,
          },
          _count: {
            fundings: 0,
            milestones: 0,
          },
        },
        {
          ...createMockProject(),
          creator: {
            id: mockUser.id,
            username: mockUser.username,
            reputation: mockUser.reputationScore || 0,
            verified: false,
          },
          _count: {
            fundings: 0,
            milestones: 0,
          },
        },
      ];
      (prisma.project.findMany as jest.Mock).mockResolvedValue(projectsWithRelations);
      (prisma.project.count as jest.Mock).mockResolvedValue(2);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          page: '1',
          limit: '10',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.projects).toBeDefined();
      expect(data.projects.length).toBe(2);
    });

    it('should filter projects by status', async () => {
      const activeProjects = [{
        ...createMockProject({ status: 'ACTIVE' }),
        creator: {
          id: mockUser.id,
          username: mockUser.username,
          reputation: mockUser.reputationScore || 0,
          verified: false,
        },
        _count: {
          fundings: 0,
          milestones: 0,
        },
      }];
      (prisma.project.findMany as jest.Mock).mockResolvedValue(activeProjects);
      (prisma.project.count as jest.Mock).mockResolvedValue(1);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          status: 'ACTIVE',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.projects.every((p: any) => p.status === 'ACTIVE')).toBe(true);
    });

    it('should filter projects by category', async () => {
      const solarProjects = [{
        ...createMockProject({ category: 'SOLAR' }),
        creator: {
          id: mockUser.id,
          username: mockUser.username,
          reputation: mockUser.reputationScore || 0,
          verified: false,
        },
        _count: {
          fundings: 0,
          milestones: 0,
        },
      }];
      (prisma.project.findMany as jest.Mock).mockResolvedValue(solarProjects);
      (prisma.project.count as jest.Mock).mockResolvedValue(1);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          category: 'SOLAR',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should search projects by query', async () => {
      const searchResults = [{
        ...mockProject,
        creator: {
          id: mockUser.id,
          username: mockUser.username,
          reputation: mockUser.reputationScore || 0,
          verified: false,
        },
        _count: {
          fundings: 0,
          milestones: 0,
        },
      }];
      (prisma.project.findMany as jest.Mock).mockResolvedValue(searchResults);
      (prisma.project.count as jest.Mock).mockResolvedValue(1);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          search: 'solar',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });
  });
});

