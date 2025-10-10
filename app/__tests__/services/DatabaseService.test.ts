import { DatabaseService } from '../../lib/services/databaseService';
import { UserRepository } from '../../lib/repositories/userRepository';
import { ProjectRepository } from '../../lib/repositories/projectRepository';
import { ProjectStatus } from '@prisma/client';
import { UserRole } from '../../types/auth';

// Mock repositories
jest.mock('../../lib/repositories/userRepository');
jest.mock('../../lib/repositories/projectRepository');

const mockUserRepository = UserRepository as jest.MockedClass<
  typeof UserRepository
>;
const mockProjectRepository = ProjectRepository as jest.MockedClass<
  typeof ProjectRepository
>;

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  let mockUserRepoInstance: jest.Mocked<UserRepository>;
  let mockProjectRepoInstance: jest.Mocked<ProjectRepository>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockUserRepoInstance =
      new mockUserRepository() as jest.Mocked<UserRepository>;
    mockProjectRepoInstance =
      new mockProjectRepository() as jest.Mocked<ProjectRepository>;

    // Mock the constructors
    mockUserRepository.mockImplementation(() => mockUserRepoInstance);
    mockProjectRepository.mockImplementation(() => mockProjectRepoInstance);

    databaseService = new DatabaseService();
  });

  describe('getUserByWallet', () => {
    test('should return user by wallet address', async () => {
      const mockUser = {
        id: 'user-1',
        walletAddress: 'abc123',
        username: 'testuser',
        email: null,
        phoneNumber: null,
        role: 'FUNDER' as any, // Use uppercase to match Prisma enum
        reputation: 100,
        verified: true,
        avatar: null,
        bio: null,
        website: null,
        socialLinks: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        userStats: {
          id: 'stats-1',
          userId: 'user-1',
          projectsCreated: 5,
          projectsFunded: 10,
          totalFunded: 5000,
          successfulProjects: 2,
          totalEarnings: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockUserRepoInstance.findByWalletAddress.mockResolvedValue(mockUser);

      const result = await databaseService.getUserByWallet('abc123');

      expect(result).toEqual(mockUser);
      expect(mockUserRepoInstance.findByWalletAddress).toHaveBeenCalledWith(
        'abc123'
      );
    });
  });

  describe('createUser', () => {
    test('should create user with wallet address and username', async () => {
      const mockUser = {
        id: 'user-1',
        walletAddress: 'abc123',
        username: 'testuser',
        email: null,
        phoneNumber: null,
        role: 'FUNDER' as any, // Use uppercase to match Prisma enum
        reputation: 0,
        verified: false,
        avatar: null,
        bio: null,
        website: null,
        socialLinks: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        userStats: {
          id: 'stats-1',
          userId: 'user-1',
          projectsCreated: 0,
          projectsFunded: 0,
          totalFunded: 0,
          successfulProjects: 0,
          totalEarnings: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockUserRepoInstance.create.mockResolvedValue(mockUser);

      const result = await databaseService.createUser('abc123', 'testuser');

      expect(result).toEqual(mockUser);
      expect(mockUserRepoInstance.create).toHaveBeenCalledWith({
        walletAddress: 'abc123',
        username: 'testuser',
        role: 'funder' as any, // Use lowercase to match auth enum
      });
    });
  });

  describe('updateUserProfile', () => {
    test('should update user profile', async () => {
      const updateData = {
        username: 'newusername',
        bio: 'New bio',
      };

      const mockUpdatedUser = {
        id: 'user-1',
        walletAddress: 'abc123',
        username: 'newusername',
        email: null,
        phoneNumber: null,
        role: 'FUNDER' as any, // Use uppercase to match Prisma enum
        reputation: 100,
        verified: true,
        avatar: null,
        bio: 'New bio',
        website: null,
        socialLinks: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        userStats: {
          id: 'stats-1',
          userId: 'user-1',
          projectsCreated: 5,
          projectsFunded: 10,
          totalFunded: 5000,
          successfulProjects: 2,
          totalEarnings: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockUserRepoInstance.update.mockResolvedValue(mockUpdatedUser);

      const result = await databaseService.updateUserProfile(
        'user-1',
        updateData
      );

      expect(result).toEqual(mockUpdatedUser);
      expect(mockUserRepoInstance.update).toHaveBeenCalledWith('user-1', {
        username: 'newusername',
        bio: 'New bio',
      });
    });
  });

  describe('createProject', () => {
    test('should create project', async () => {
      const projectData = {
        title: 'New Project',
        description: 'Project description',
        location: 'New Location',
        category: 'Technology',
        tags: ['blockchain'],
        creatorId: 'user-1',
        targetAmount: 1000,
        energyCapacity: 100,
        milestoneCount: 3,
        duration: 30,
        programId: 'program-123',
        projectPDA: 'pda-123',
      };

      const mockCreatedProject = {
        id: 'project-1',
        ...projectData,
        escrowAddress: null,
        status: ProjectStatus.ACTIVE,
        currentAmount: 0,
        images: [],
        videoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        fundedAt: null,
        completedAt: null,
        creator: { id: 'user-1', username: 'creator' },
        milestones: [],
      };

      mockProjectRepoInstance.create.mockResolvedValue(mockCreatedProject);

      const result = await databaseService.createProject(projectData);

      expect(result).toEqual(mockCreatedProject);
      expect(mockProjectRepoInstance.create).toHaveBeenCalledWith(projectData);
    });
  });

  describe('getProjectById', () => {
    test('should return project by ID', async () => {
      const mockProject = {
        id: 'project-1',
        title: 'Test Project',
        description: 'Project description',
        location: 'Test Location',
        category: 'Technology',
        tags: ['blockchain'],
        status: ProjectStatus.ACTIVE,
        creatorId: 'user-1',
        targetAmount: 1000,
        currentAmount: 500,
        energyCapacity: 100,
        milestoneCount: 3,
        duration: 30,
        programId: 'program-123',
        projectPDA: 'pda-123',
        escrowAddress: null,
        images: [],
        videoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        fundedAt: null,
        completedAt: null,
        creator: { id: 'user-1', username: 'creator' },
        milestones: [],
        _count: { fundings: 5, comments: 10, updates: 2 },
      };

      mockProjectRepoInstance.findById.mockResolvedValue(mockProject);

      const result = await databaseService.getProjectById('project-1');

      expect(result).toEqual(mockProject);
      expect(mockProjectRepoInstance.findById).toHaveBeenCalledWith(
        'project-1'
      );
    });
  });

  describe('getProjects', () => {
    test('should return paginated projects', async () => {
      const mockProjects = [
        {
          id: '1',
          title: 'Project 1',
          description: 'Description 1',
          location: 'Location 1',
          category: 'Technology',
          tags: ['blockchain'],
          status: ProjectStatus.ACTIVE,
          creatorId: 'user-1',
          targetAmount: 1000,
          currentAmount: 500,
          energyCapacity: 100,
          milestoneCount: 3,
          duration: 30,
          programId: 'program-123',
          projectPDA: 'pda-123',
          escrowAddress: null,
          images: [],
          videoUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          fundedAt: null,
          completedAt: null,
          creator: { id: 'user-1', username: 'creator' },
          _count: { fundings: 5, comments: 10, updates: 2 },
        },
      ];

      const mockResult = { projects: mockProjects, total: 1 };

      mockProjectRepoInstance.findMany.mockResolvedValue(mockResult);

      const filters = { status: ProjectStatus.ACTIVE };
      const result = await databaseService.getProjects(filters, 1, 10);

      expect(result).toEqual(mockResult);
      expect(mockProjectRepoInstance.findMany).toHaveBeenCalledWith(
        filters,
        1,
        10
      );
    });
  });

  describe('updateProjectFunding', () => {
    test('should update project funding', async () => {
      const mockUpdatedProject = {
        id: 'project-1',
        title: 'Test Project',
        description: 'Project description',
        location: 'Test Location',
        category: 'Technology',
        tags: ['blockchain'],
        status: ProjectStatus.FUNDED,
        creatorId: 'user-1',
        targetAmount: 1000,
        currentAmount: 1500,
        energyCapacity: 100,
        milestoneCount: 3,
        duration: 30,
        programId: 'program-123',
        projectPDA: 'pda-123',
        escrowAddress: null,
        images: [],
        videoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        fundedAt: new Date(),
        completedAt: null,
        creator: { id: 'user-1', username: 'creator' },
      };

      mockProjectRepoInstance.updateFundingAmount.mockResolvedValue(
        mockUpdatedProject
      );

      const result = await databaseService.updateProjectFunding(
        'project-1',
        500
      );

      expect(result).toEqual(mockUpdatedProject);
      expect(mockProjectRepoInstance.updateFundingAmount).toHaveBeenCalledWith(
        'project-1',
        500
      );
    });
  });

  describe('getTrendingProjects', () => {
    test('should return trending projects', async () => {
      const mockProjects = [
        {
          id: '1',
          title: 'Trending Project',
          description: 'Trending description',
          location: 'Trending Location',
          category: 'Technology',
          tags: ['blockchain'],
          status: ProjectStatus.ACTIVE,
          creatorId: 'user-1',
        targetAmount: 1000,
        currentAmount: 5000,
        energyCapacity: 100,
        milestoneCount: 3,
          duration: 30,
          programId: 'program-123',
          projectPDA: 'pda-123',
          escrowAddress: null,
          images: [],
          videoUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          fundedAt: null,
          completedAt: null,
          creator: { id: 'user-1', username: 'creator' },
          _count: { fundings: 10 },
        },
      ];

      mockProjectRepoInstance.getTrending.mockResolvedValue(mockProjects);

      const result = await databaseService.getTrendingProjects(5);

      expect(result).toEqual(mockProjects);
      expect(mockProjectRepoInstance.getTrending).toHaveBeenCalledWith(5);
    });
  });

  describe('updateUserStats', () => {
    test('should update user statistics', async () => {
      const mockUpdatedStats = {
        id: 'stats-1',
        userId: 'user-1',
        projectsCreated: 6,
        projectsFunded: 11,
        totalFunded: 5500,
        successfulProjects: 3,
        totalEarnings: 1500,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepoInstance.updateStats.mockResolvedValue(mockUpdatedStats);

      const stats = { projectsCreated: 1, projectsFunded: 1, totalFunded: 500 };
      const result = await databaseService.updateUserStats('user-1', stats);

      expect(result).toEqual(mockUpdatedStats);
      expect(mockUserRepoInstance.updateStats).toHaveBeenCalledWith(
        'user-1',
        stats
      );
    });
  });

  describe('getUserStats', () => {
    test('should return user statistics', async () => {
      const mockStats = {
        id: 'stats-1',
        userId: 'user-1',
        projectsCreated: 5,
        projectsFunded: 10,
        totalFunded: 5000,
        successfulProjects: 2,
        totalEarnings: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepoInstance.getUserStats.mockResolvedValue(mockStats);

      const result = await databaseService.getUserStats('user-1');

      expect(result).toEqual(mockStats);
      expect(mockUserRepoInstance.getUserStats).toHaveBeenCalledWith('user-1');
    });
  });

  describe('ensureUserExists', () => {
    test('should return existing user if found', async () => {
      const mockUser = {
        id: 'user-1',
        walletAddress: 'abc123',
        username: 'testuser',
        email: null,
        phoneNumber: null,
        role: 'FUNDER' as any, // Use uppercase to match Prisma enum
        reputation: 100,
        verified: true,
        avatar: null,
        bio: null,
        website: null,
        socialLinks: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        userStats: null,
      };

      mockUserRepoInstance.findByWalletAddress.mockResolvedValue(mockUser);

      const result = await databaseService.ensureUserExists('abc123');

      expect(result).toEqual(mockUser);
      expect(mockUserRepoInstance.findByWalletAddress).toHaveBeenCalledWith(
        'abc123'
      );
      expect(mockUserRepoInstance.create).not.toHaveBeenCalled();
    });

    test('should create new user if not found', async () => {
      const mockNewUser = {
        id: 'user-2',
        walletAddress: 'def456',
        username: 'customuser',
        email: null,
        phoneNumber: null,
        role: 'FUNDER' as any, // Use uppercase to match Prisma enum
        reputation: 0,
        verified: false,
        avatar: null,
        bio: null,
        website: null,
        socialLinks: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        userStats: {
          id: 'stats-2',
          userId: 'user-2',
          projectsCreated: 0,
          projectsFunded: 0,
          totalFunded: 0,
          successfulProjects: 0,
          totalEarnings: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockUserRepoInstance.findByWalletAddress.mockResolvedValue(null);
      mockUserRepoInstance.create.mockResolvedValue(mockNewUser);

      const result = await databaseService.ensureUserExists(
        'def456',
        'customuser'
      );

      expect(result).toEqual(mockNewUser);
      expect(mockUserRepoInstance.findByWalletAddress).toHaveBeenCalledWith(
        'def456'
      );
      expect(mockUserRepoInstance.create).toHaveBeenCalledWith({
        walletAddress: 'def456',
        username: 'customuser',
        role: 'funder' as any, // Use lowercase to match auth enum
      });
    });
  });
});
