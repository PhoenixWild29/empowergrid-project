jest.mock('../../lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { ProjectRepository } from '../../lib/repositories/projectRepository';
import { ProjectStatus } from '@prisma/client';

// Get references to the mocked functions
const mockPrisma = require('../../lib/prisma').prisma as jest.Mocked<any>;
const mockProjectFindUnique = mockPrisma.project
  .findUnique as jest.MockedFunction<any>;
const mockProjectCreate = mockPrisma.project.create as jest.MockedFunction<any>;
const mockProjectUpdate = mockPrisma.project.update as jest.MockedFunction<any>;
const mockProjectDelete = mockPrisma.project.delete as jest.MockedFunction<any>;
const mockProjectFindMany = mockPrisma.project
  .findMany as jest.MockedFunction<any>;
const mockProjectAggregate = mockPrisma.project
  .aggregate as jest.MockedFunction<any>;
const mockProjectCount = mockPrisma.project.count as jest.MockedFunction<any>;

describe('ProjectRepository', () => {
  let projectRepository: ProjectRepository;

  beforeEach(() => {
    projectRepository = new ProjectRepository();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    test('should return project with relations', async () => {
      const mockProject = {
        id: 'project-1',
        title: 'Test Project',
        creator: { id: 'user-1', username: 'creator' },
        milestones: [],
        _count: { fundings: 5, comments: 10, updates: 2 },
      };

      mockProjectFindUnique.mockResolvedValue(mockProject);

      const result = await projectRepository.findById('project-1');

      expect(result).toEqual(mockProject);
      expect(mockProjectFindUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              reputation: true,
              verified: true,
            },
          },
          milestones: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              fundings: true,
              comments: true,
              updates: true,
            },
          },
        },
      });
    });
  });

  describe('create', () => {
    test('should create project with data', async () => {
      const projectData = {
        title: 'New Project',
        description: 'Project description',
        category: 'Technology',
        tags: ['blockchain', 'solana'],
        creatorId: 'user-1',
        targetAmount: 1000,
        milestoneCount: 3,
        duration: 30,
        programId: 'program-123',
        projectPDA: 'pda-123',
      };

      const mockCreatedProject = {
        id: 'project-1',
        ...projectData,
        creator: { id: 'user-1' },
        milestones: [],
      };

      mockProjectCreate.mockResolvedValue(mockCreatedProject);

      const result = await projectRepository.create(projectData);

      expect(result).toEqual(mockCreatedProject);
      expect(mockProjectCreate).toHaveBeenCalledWith({
        data: projectData,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              reputation: true,
              verified: true,
            },
          },
          milestones: true,
        },
      });
    });
  });

  describe('findMany', () => {
    test('should find projects with filters and pagination', async () => {
      const mockProjects = [
        { id: '1', title: 'Project 1' },
        { id: '2', title: 'Project 2' },
      ];

      mockProjectFindMany.mockResolvedValue(mockProjects);
      mockProjectCount.mockResolvedValue(2);

      const filters = { status: ProjectStatus.ACTIVE, category: 'Technology' };
      const result = await projectRepository.findMany(filters, 1, 10);

      expect(result).toEqual({ projects: mockProjects, total: 2 });
      expect(mockProjectFindMany).toHaveBeenCalledWith({
        where: {
          status: ProjectStatus.ACTIVE,
          category: 'Technology',
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              reputation: true,
              verified: true,
            },
          },
          _count: {
            select: {
              fundings: true,
              comments: true,
              updates: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    test('should handle search queries', async () => {
      mockProjectFindMany.mockResolvedValue([]);
      mockProjectCount.mockResolvedValue(0);

      await projectRepository.findMany({ search: 'blockchain' });

      expect(mockProjectFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { title: { contains: 'blockchain', mode: 'insensitive' } },
              { description: { contains: 'blockchain', mode: 'insensitive' } },
              {
                creator: {
                  username: { contains: 'blockchain', mode: 'insensitive' },
                },
              },
            ],
          },
        })
      );
    });
  });

  describe('updateFundingAmount', () => {
    test('should update funding and mark as funded when target reached', async () => {
      const mockProject = {
        currentAmount: 500,
        targetAmount: 1000,
        status: ProjectStatus.ACTIVE,
        fundedAt: null,
      };

      const mockUpdatedProject = {
        ...mockProject,
        currentAmount: 1000,
        status: ProjectStatus.FUNDED,
        fundedAt: new Date(),
        creator: { id: 'user-1' },
      };

      mockProjectFindUnique.mockResolvedValue(mockProject);
      mockProjectUpdate.mockResolvedValue(mockUpdatedProject);

      const result = await projectRepository.updateFundingAmount(
        'project-1',
        500
      );

      expect(result).toEqual(mockUpdatedProject);
      expect(mockProjectUpdate).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        data: {
          currentAmount: 1000,
          status: ProjectStatus.FUNDED,
          fundedAt: expect.any(Date),
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              reputation: true,
              verified: true,
            },
          },
        },
      });
    });

    test('should not change status if not reaching target', async () => {
      const mockProject = {
        currentAmount: 300,
        targetAmount: 1000,
        status: ProjectStatus.ACTIVE,
      };

      mockProjectFindUnique.mockResolvedValue(mockProject);
      mockProjectUpdate.mockResolvedValue({
        ...mockProject,
        currentAmount: 500,
      });

      await projectRepository.updateFundingAmount('project-1', 200);

      expect(mockProjectUpdate).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        data: {
          currentAmount: 500,
          status: ProjectStatus.ACTIVE,
          fundedAt: undefined,
        },
        include: expect.any(Object),
      });
    });
  });

  describe('getTrending', () => {
    test('should get trending projects', async () => {
      const mockProjects = [
        { id: '1', title: 'Trending Project', currentAmount: 5000 },
      ];

      mockProjectFindMany.mockResolvedValue(mockProjects);

      const result = await projectRepository.getTrending(5);

      expect(result).toEqual(mockProjects);
      expect(mockProjectFindMany).toHaveBeenCalledWith({
        where: {
          status: {
            in: [ProjectStatus.ACTIVE, ProjectStatus.FUNDED],
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              reputation: true,
              verified: true,
            },
          },
          _count: {
            select: { fundings: true },
          },
        },
        orderBy: { currentAmount: 'desc' },
        take: 5,
      });
    });
  });

  describe('getStats', () => {
    test('should return project statistics', async () => {
      mockProjectCount
        .mockResolvedValueOnce(100) // totalProjects
        .mockResolvedValueOnce(50) // activeProjects
        .mockResolvedValueOnce(25) // fundedProjects
        .mockResolvedValueOnce(10); // completedProjects

      mockProjectAggregate.mockResolvedValue({
        _sum: { currentAmount: 50000 },
      });

      const result = await projectRepository.getStats();

      expect(result).toEqual({
        totalProjects: 100,
        activeProjects: 50,
        fundedProjects: 25,
        completedProjects: 10,
        totalFunding: 50000,
      });
    });
  });
});
