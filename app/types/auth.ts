import { PublicKey } from '@solana/web3.js';

// User roles and permissions
export enum UserRole {
  GUEST = 'guest',
  FUNDER = 'funder',
  CREATOR = 'creator',
  ADMIN = 'admin',
}

export enum Permission {
  // Project permissions
  CREATE_PROJECT = 'create_project',
  FUND_PROJECT = 'fund_project',
  VIEW_PROJECT = 'view_project',
  EDIT_PROJECT = 'edit_project',
  DELETE_PROJECT = 'delete_project',

  // Milestone permissions
  RELEASE_MILESTONE = 'release_milestone',
  SUBMIT_METRICS = 'submit_metrics',

  // Admin permissions
  MANAGE_USERS = 'manage_users',
  VIEW_ANALYTICS = 'view_analytics',
  SYSTEM_CONFIG = 'system_config',
}

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.GUEST]: [Permission.VIEW_PROJECT, Permission.FUND_PROJECT],
  [UserRole.FUNDER]: [Permission.VIEW_PROJECT, Permission.FUND_PROJECT],
  [UserRole.CREATOR]: [
    Permission.VIEW_PROJECT,
    Permission.FUND_PROJECT,
    Permission.CREATE_PROJECT,
    Permission.EDIT_PROJECT,
    Permission.SUBMIT_METRICS,
  ],
  [UserRole.ADMIN]: [
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
  ],
};

// User profile interface
export interface UserProfile {
  id: string;
  walletAddress: PublicKey;
  username?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  role: UserRole;
  reputation: number; // Based on successful projects/funding
  createdAt: Date;
  updatedAt: Date;
  verified: boolean; // KYC/AML verification status
  stats: {
    projectsCreated: number;
    projectsFunded: number;
    totalFunded: number; // in SOL
    successfulProjects: number;
  };
}

// Authentication state
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  walletAddress: PublicKey | null;
  error: string | null;
}

// Authentication actions
export interface AuthActions {
  login: (walletAddress: PublicKey) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  switchRole: (newRole: UserRole) => Promise<void>;
}

// Combined auth context
export interface AuthContextType extends AuthState, AuthActions {}

// Authentication challenge types
export interface AuthChallenge {
  nonce: string;
  message: string;
  expiresAt: Date;
  timestamp: Date;
  walletAddress?: string;
}

export interface ChallengeRequest {
  walletAddress?: string;
}

export interface ChallengeResponse {
  success: boolean;
  nonce: string;
  message: string;
  expiresAt: string; // ISO 8601 format
  expiresIn: number; // seconds
  timestamp: string; // ISO 8601 format
}

// Login request/response types
export interface LoginRequest {
  walletAddress: PublicKey;
  signature?: string; // For message signing verification
  message?: string; // Challenge message to sign
  nonce?: string; // Challenge nonce for verification
}

export interface LoginResponse {
  user: UserProfile;
  token: string; // JWT or session token
  expiresAt: Date;
}

// Session management
export interface SessionData {
  userId: string;
  walletAddress: string;
  token: string;
  refreshToken?: string | null;
  expiresAt: Date;
  createdAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// JWT Token interfaces
export interface JWTPayload {
  userId: string;
  walletAddress: string;
  role: UserRole;
  username?: string;
  sessionId?: string;
  iat?: number; // Issued at
  exp?: number; // Expiration time
  iss?: string; // Issuer
  aud?: string; // Audience
}

export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  expiresAt: Date;
  tokenType: 'Bearer';
}

// Permission checking utility
export function hasPermission(
  userRole: UserRole,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

export function canCreateProject(userRole: UserRole): boolean {
  return hasPermission(userRole, Permission.CREATE_PROJECT);
}

export function canFundProject(userRole: UserRole): boolean {
  return hasPermission(userRole, Permission.FUND_PROJECT);
}

export function canEditProject(
  userRole: UserRole,
  projectCreator: PublicKey,
  userWallet?: PublicKey
): boolean {
  if (!userWallet) return false;

  // Project creator can always edit their own projects
  if (projectCreator.equals(userWallet)) return true;

  // Admins can edit any project
  return hasPermission(userRole, Permission.EDIT_PROJECT);
}

export function canReleaseMilestone(userRole: UserRole): boolean {
  return hasPermission(userRole, Permission.RELEASE_MILESTONE);
}

export function isAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN;
}

// User verification levels
export enum VerificationLevel {
  NONE = 'none',
  BASIC = 'basic', // Email verified
  VERIFIED = 'verified', // KYC completed
  PREMIUM = 'premium', // Enhanced verification
}

// Enhanced user profile with verification
export interface VerifiedUserProfile extends UserProfile {
  verificationLevel: VerificationLevel;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not_required';
  documents: string[]; // URLs to verification documents
  riskScore: number; // 0-100, lower is better
}
