import { describe, test, expect } from '@jest/globals';
import {
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
  hasPermission,
  canCreateProject,
  canFundProject,
  canEditProject,
  canReleaseMilestone,
  isAdmin,
} from '../../types/auth';
import { PublicKey } from '@solana/web3.js';

describe('Authentication Types', () => {
  describe('UserRole enum', () => {
    test('should have correct role values', () => {
      expect(UserRole.GUEST).toBe('guest');
      expect(UserRole.FUNDER).toBe('funder');
      expect(UserRole.CREATOR).toBe('creator');
      expect(UserRole.ADMIN).toBe('admin');
    });
  });

  describe('Permission enum', () => {
    test('should have correct permission values', () => {
      expect(Permission.CREATE_PROJECT).toBe('create_project');
      expect(Permission.FUND_PROJECT).toBe('fund_project');
      expect(Permission.VIEW_PROJECT).toBe('view_project');
      expect(Permission.EDIT_PROJECT).toBe('edit_project');
      expect(Permission.DELETE_PROJECT).toBe('delete_project');
      expect(Permission.RELEASE_MILESTONE).toBe('release_milestone');
      expect(Permission.SUBMIT_METRICS).toBe('submit_metrics');
    });
  });

  describe('ROLE_PERMISSIONS mapping', () => {
    test('guest should have limited permissions', () => {
      expect(ROLE_PERMISSIONS[UserRole.GUEST]).toEqual([
        Permission.VIEW_PROJECT,
        Permission.FUND_PROJECT,
      ]);
    });

    test('funder should have basic permissions', () => {
      expect(ROLE_PERMISSIONS[UserRole.FUNDER]).toEqual([
        Permission.VIEW_PROJECT,
        Permission.FUND_PROJECT,
      ]);
    });

    test('creator should have extended permissions', () => {
      expect(ROLE_PERMISSIONS[UserRole.CREATOR]).toEqual([
        Permission.VIEW_PROJECT,
        Permission.FUND_PROJECT,
        Permission.CREATE_PROJECT,
        Permission.EDIT_PROJECT,
        Permission.SUBMIT_METRICS,
      ]);
    });

    test('admin should have all permissions', () => {
      expect(ROLE_PERMISSIONS[UserRole.ADMIN]).toEqual([
        Permission.VIEW_PROJECT,
        Permission.FUND_PROJECT,
        Permission.CREATE_PROJECT,
        Permission.EDIT_PROJECT,
        Permission.DELETE_PROJECT,
        Permission.RELEASE_MILESTONE,
        Permission.SUBMIT_METRICS,
        Permission.MANAGE_USERS,
        Permission.VIEW_ANALYTICS,
        Permission.SYSTEM_CONFIG,
      ]);
    });
  });

  describe('hasPermission function', () => {
    test('should return true for valid permissions', () => {
      expect(hasPermission(UserRole.CREATOR, Permission.CREATE_PROJECT)).toBe(
        true
      );
      expect(hasPermission(UserRole.ADMIN, Permission.DELETE_PROJECT)).toBe(
        true
      );
    });

    test('should return false for invalid permissions', () => {
      expect(hasPermission(UserRole.GUEST, Permission.CREATE_PROJECT)).toBe(
        false
      );
      expect(hasPermission(UserRole.FUNDER, Permission.DELETE_PROJECT)).toBe(
        false
      );
    });

    test('should return false for non-existent permissions', () => {
      expect(hasPermission(UserRole.ADMIN, 'non_existent' as Permission)).toBe(
        false
      );
    });
  });

  describe('canCreateProject function', () => {
    test('should allow creators and admins to create projects', () => {
      expect(canCreateProject(UserRole.CREATOR)).toBe(true);
      expect(canCreateProject(UserRole.ADMIN)).toBe(true);
    });

    test('should not allow guests and funders to create projects', () => {
      expect(canCreateProject(UserRole.GUEST)).toBe(false);
      expect(canCreateProject(UserRole.FUNDER)).toBe(false);
    });
  });

  describe('canFundProject function', () => {
    test('should allow all roles to fund projects', () => {
      expect(canFundProject(UserRole.GUEST)).toBe(true);
      expect(canFundProject(UserRole.FUNDER)).toBe(true);
      expect(canFundProject(UserRole.CREATOR)).toBe(true);
      expect(canFundProject(UserRole.ADMIN)).toBe(true);
    });
  });

  describe('canEditProject function', () => {
    const mockProjectCreator = new PublicKey(
      '11111111111111111111111111111112'
    );
    const mockUserWallet = new PublicKey('22222222222222222222222222222222');
    const mockOtherWallet = new PublicKey('33333333333333333333333333333333');

    test('should allow project creator to edit their own project', () => {
      expect(
        canEditProject(UserRole.FUNDER, mockProjectCreator, mockProjectCreator)
      ).toBe(true);
    });

    test('should allow admin to edit any project', () => {
      expect(
        canEditProject(UserRole.ADMIN, mockProjectCreator, mockOtherWallet)
      ).toBe(true);
    });

    test('should not allow non-creator non-admin to edit project', () => {
      expect(
        canEditProject(UserRole.FUNDER, mockProjectCreator, mockOtherWallet)
      ).toBe(false);
    });

    test('should return false when user wallet is not provided', () => {
      expect(
        canEditProject(UserRole.CREATOR, mockProjectCreator, undefined)
      ).toBe(false);
    });
  });

  describe('canReleaseMilestone function', () => {
    test('should only allow admins to release milestones', () => {
      expect(canReleaseMilestone(UserRole.ADMIN)).toBe(true);
      expect(canReleaseMilestone(UserRole.CREATOR)).toBe(false);
      expect(canReleaseMilestone(UserRole.FUNDER)).toBe(false);
      expect(canReleaseMilestone(UserRole.GUEST)).toBe(false);
    });
  });

  describe('isAdmin function', () => {
    test('should return true only for admin role', () => {
      expect(isAdmin(UserRole.ADMIN)).toBe(true);
      expect(isAdmin(UserRole.CREATOR)).toBe(false);
      expect(isAdmin(UserRole.FUNDER)).toBe(false);
      expect(isAdmin(UserRole.GUEST)).toBe(false);
    });
  });
});
