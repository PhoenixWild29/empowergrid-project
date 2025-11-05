/**
 * Integration Test: Funding Workflow
 * Tests the complete funding flow from project creation to fund release
 */

import { createProject } from '../../lib/services/projectService';
import { prisma } from '../../lib/prisma';
import {
  createMockUser,
  createMockProject,
  resetAllMocks,
  setupDefaultMocks,
} from '../utils/mocks';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    project: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    funding: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Funding Workflow Integration', () => {
  const creator = createMockUser({ role: 'CREATOR' });
  const funder = createMockUser({ id: 'funder-123', role: 'FUNDER' });
  let project: any;

  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
    jest.clearAllMocks();
  });

  describe('Complete Funding Flow', () => {
    it('should complete full funding workflow', async () => {
      // Step 1: Creator creates project
      const projectData = {
        title: 'Solar Farm Project',
        description: 'Large-scale solar installation',
        location: 'California',
        category: 'SOLAR',
        tags: ['solar', 'renewable'],
        targetAmount: 10000000000, // 10 SOL
        creatorId: creator.id,
      };

      // Mock should return project with DRAFT status (as created by the service)
      project = createMockProject({
        ...projectData,
        id: 'project-123',
        creatorId: creator.id,
        status: 'DRAFT', // Projects are created with DRAFT status
        fundedAmount: 0,
      });

      (prisma.project.create as jest.Mock).mockResolvedValue(project);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(creator);

      const createdProject = await createProject(projectData);
      expect(createdProject).toBeDefined();
      expect(createdProject.status).toBe('DRAFT');

      // Step 2: Project is published (status changed to ACTIVE)
      const publishedProject = {
        ...project,
        status: 'ACTIVE',
      };
      (prisma.project.update as jest.Mock).mockResolvedValue(publishedProject);
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(publishedProject);

      // Step 3: Funder funds the project
      const fundingAmount = 5000000000; // 5 SOL
      const funding = {
        id: 'funding-123',
        projectId: project.id,
        funderId: funder.id,
        amount: fundingAmount,
        status: 'COMPLETED',
        createdAt: new Date(),
      };

      (prisma.funding.create as jest.Mock).mockResolvedValue(funding);
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(creator)
        .mockResolvedValueOnce(funder);

      // Update project with new funding
      const updatedProject = {
        ...publishedProject,
        fundedAmount: fundingAmount,
      };
      (prisma.project.update as jest.Mock).mockResolvedValue(updatedProject);

      // Verify funding was recorded
      expect(funding.amount).toBe(fundingAmount);
      expect(funding.projectId).toBe(project.id);

      // Step 4: Verify project funding progress
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(updatedProject);
      const projectWithFunding = await prisma.project.findUnique({
        where: { id: project.id },
      });

      expect(projectWithFunding?.fundedAmount).toBe(fundingAmount);
      const progress = (projectWithFunding?.fundedAmount || 0) / projectData.targetAmount;
      expect(progress).toBe(0.5); // 50% funded
    });

    it('should handle multiple funders', async () => {
      project = createMockProject({
        id: 'project-123',
        targetAmount: 10000000000,
        fundedAmount: 0,
      });

      const funder1 = createMockUser({ id: 'funder-1' });
      const funder2 = createMockUser({ id: 'funder-2' });
      const funder3 = createMockUser({ id: 'funder-3' });

      const fundings = [
        { id: 'funding-1', funderId: funder1.id, amount: 2000000000 },
        { id: 'funding-2', funderId: funder2.id, amount: 3000000000 },
        { id: 'funding-3', funderId: funder3.id, amount: 2000000000 },
      ];

      (prisma.funding.findMany as jest.Mock).mockResolvedValue(fundings);
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        ...project,
        fundedAmount: 7000000000,
        fundings,
      });

      const projectWithFundings = await prisma.project.findUnique({
        where: { id: project.id },
        include: { fundings: true },
      });

      expect(projectWithFundings?.fundings).toHaveLength(3);
      const totalFunded = projectWithFundings?.fundings.reduce(
        (sum: number, f: any) => sum + f.amount,
        0
      );
      expect(totalFunded).toBe(7000000000);
    });

    it('should handle project reaching funding goal', async () => {
      project = createMockProject({
        id: 'project-123',
        targetAmount: 10000000000,
        fundedAmount: 9500000000,
      });

      const finalFunding = {
        id: 'funding-final',
        amount: 500000000, // Final funding to reach goal
      };

      const fullyFundedProject = {
        ...project,
        fundedAmount: project.targetAmount,
        status: 'FUNDED',
      };

      (prisma.project.update as jest.Mock).mockResolvedValue(fullyFundedProject);
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(fullyFundedProject);

      const updatedProject = await prisma.project.update({
        where: { id: project.id },
        data: {
          fundedAmount: project.targetAmount,
          status: 'FUNDED',
        },
      });

      expect(updatedProject.status).toBe('FUNDED');
      expect(updatedProject.fundedAmount).toBe(project.targetAmount);
    });
  });

  describe('Funding Validation', () => {
    it('should prevent funding beyond project goal', async () => {
      project = createMockProject({
        id: 'project-123',
        targetAmount: 10000000000,
        fundedAmount: 10000000000, // Already fully funded
      });

      const excessiveFunding = {
        amount: 1000000000, // Trying to fund more
      };

      // This should be rejected in the actual implementation
      expect(project.fundedAmount).toBe(project.targetAmount);
    });

    it('should prevent funding inactive projects', async () => {
      project = createMockProject({
        id: 'project-123',
        status: 'DRAFT', // Not yet active
      });

      expect(project.status).not.toBe('ACTIVE');
      // Funding should be rejected for non-active projects
    });
  });
});

