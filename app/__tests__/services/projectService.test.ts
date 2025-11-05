/**
 * Project Service Tests
 */

import {
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectsByCreator,
  getProjectsByStatus,
} from '../../lib/services/projectService';
import { prisma } from '../../lib/prisma';
import { createMockProject, createMockUser, resetAllMocks } from '../utils/mocks';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    project: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('ProjectService', () => {
  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create a new project successfully', async () => {
      const mockUser = createMockUser();
      const mockProject = createMockProject({ creatorId: mockUser.id });
      const projectData = {
        title: 'Test Project',
        description: 'Test description',
        location: 'Test Location',
        category: 'SOLAR',
        tags: ['solar', 'renewable'],
        targetAmount: 1000000000,
        creatorId: mockUser.id,
      };

      (prisma.project.create as jest.Mock).mockResolvedValue({
        ...mockProject,
        creator: {
          id: mockUser.id,
          username: mockUser.username,
          reputation: mockUser.reputationScore,
        },
      });

      const result = await createProject(projectData);

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: projectData.title,
          description: projectData.description,
          location: projectData.location,
          category: projectData.category,
          tags: projectData.tags,
          targetAmount: projectData.targetAmount,
          creatorId: projectData.creatorId,
          status: 'DRAFT',
        }),
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              reputation: true,
            },
          },
        },
      });
      expect(result).toBeDefined();
      expect(result.creatorId).toBe(mockUser.id);
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        title: 'Test',
        description: 'Test',
        location: 'Test',
        category: 'SOLAR',
        tags: [],
        targetAmount: 1000,
        creatorId: '',
      };

      await expect(createProject(incompleteData as any)).rejects.toThrow();
    });
  });

  describe('getProjectById', () => {
    it('should retrieve a project by ID', async () => {
      const mockProject = createMockProject();
      const mockUser = createMockUser({ id: mockProject.creatorId });

      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        ...mockProject,
        creator: {
          id: mockUser.id,
          username: mockUser.username,
          reputation: mockUser.reputationScore,
          verified: mockUser.verified,
          avatar: null,
        },
        milestones: [],
        fundings: [],
        updates: [],
        comments: [],
      });

      const result = await getProjectById(mockProject.id);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        include: expect.objectContaining({
          creator: expect.any(Object),
          milestones: expect.any(Object),
          fundings: expect.any(Object),
        }),
      });
      expect(result).toBeDefined();
      expect(result.id).toBe(mockProject.id);
    });

    it('should throw error if project not found', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getProjectById('non-existent-id')).rejects.toThrow(
        'Project not found'
      );
    });
  });

  describe('updateProject', () => {
    it('should update a project successfully', async () => {
      const mockUser = createMockUser();
      const mockProject = createMockProject({ creatorId: mockUser.id });
      const updates = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.project.update as jest.Mock).mockResolvedValue({
        ...mockProject,
        ...updates,
      });

      const result = await updateProject(mockProject.id, mockUser.id, updates);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: mockProject.id },
      });
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        data: updates,
      });
      expect(result.title).toBe(updates.title);
    });

    it('should throw error if user is not the creator', async () => {
      const mockUser = createMockUser();
      const otherUser = createMockUser({ id: 'other-user-id' });
      const mockProject = createMockProject({ creatorId: mockUser.id });

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

      await expect(
        updateProject(mockProject.id, otherUser.id, { title: 'Updated' })
      ).rejects.toThrow('Unauthorized to update this project');
    });

    it('should throw error if project not found', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        updateProject('non-existent', 'user-id', { title: 'Updated' })
      ).rejects.toThrow('Project not found');
    });
  });

  describe('deleteProject', () => {
    it('should delete a project successfully', async () => {
      const mockUser = createMockUser();
      const mockProject = createMockProject({
        creatorId: mockUser.id,
      });

      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        ...mockProject,
        fundings: [],
      });
      (prisma.project.delete as jest.Mock).mockResolvedValue(mockProject);

      const result = await deleteProject(mockProject.id, mockUser.id);

      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: mockProject.id },
      });
      expect(result).toBeDefined();
    });

    it('should allow admin to delete any project', async () => {
      const mockUser = createMockUser();
      const adminUser = createMockUser({ id: 'admin-id', role: 'ADMIN' });
      const mockProject = createMockProject({ creatorId: mockUser.id });

      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        ...mockProject,
        fundings: [],
      });
      (prisma.project.delete as jest.Mock).mockResolvedValue(mockProject);

      await deleteProject(mockProject.id, adminUser.id, true);

      expect(prisma.project.delete).toHaveBeenCalled();
    });

    it('should prevent deletion of funded projects by non-admin', async () => {
      const mockUser = createMockUser();
      const mockProject = createMockProject({ creatorId: mockUser.id });

      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        ...mockProject,
        fundings: [{ id: 'funding-1' }],
      });

      await expect(
        deleteProject(mockProject.id, mockUser.id, false)
      ).rejects.toThrow('Cannot delete project with existing funding');
    });
  });

  describe('getProjectsByCreator', () => {
    it('should retrieve all projects by creator', async () => {
      const mockUser = createMockUser();
      const mockProjects = [
        createMockProject({ creatorId: mockUser.id }),
        createMockProject({ creatorId: mockUser.id }),
      ];

      (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

      const result = await getProjectsByCreator(mockUser.id);

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { creatorId: mockUser.id },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              fundings: true,
              milestones: true,
            },
          },
        },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('getProjectsByStatus', () => {
    it('should retrieve projects by status', async () => {
      const mockProjects = [
        createMockProject({ status: 'ACTIVE' }),
        createMockProject({ status: 'ACTIVE' }),
      ];

      (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

      const result = await getProjectsByStatus('ACTIVE');

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              username: true,
              reputation: true,
            },
          },
        },
      });
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.status === 'ACTIVE')).toBe(true);
    });
  });
});

