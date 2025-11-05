/**
 * User Profile Type Definitions
 * 
 * TypeScript interfaces for user profile operations
 */

/**
 * User Profile Data
 */
export interface UserProfile {
  id: string;
  walletAddress: string;
  username: string;
  email: string | null;
  phoneNumber: string | null;
  role: 'GUEST' | 'FUNDER' | 'CREATOR' | 'ADMIN';
  reputation: number;
  verified: boolean;
  avatar: string | null;
  bio: string | null;
  website: string | null;
  socialLinks: Record<string, string> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Public User Profile
 * Excludes sensitive information like email and phone
 */
export interface PublicUserProfile {
  id: string;
  username: string;
  role: string;
  reputation: number;
  verified: boolean;
  avatar: string | null;
  bio: string | null;
  website: string | null;
  createdAt: Date;
}

/**
 * Create Profile Request
 */
export interface CreateProfileRequest {
  walletAddress: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  bio?: string;
  website?: string;
  avatar?: string;
  socialLinks?: Record<string, string>;
  role?: 'GUEST' | 'FUNDER' | 'CREATOR' | 'ADMIN';
}

/**
 * Update Profile Request
 */
export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  phoneNumber?: string;
  bio?: string;
  website?: string;
  avatar?: string;
  socialLinks?: Record<string, string>;
}

/**
 * User Profile with Statistics
 */
export interface UserProfileWithStats extends UserProfile {
  stats: {
    projectsCreated: number;
    projectsFunded: number;
    totalFunded: number;
    successfulProjects: number;
    totalEarnings: number;
  };
}

/**
 * Profile Validation Errors
 */
export interface ProfileValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Profile API Response
 */
export interface ProfileApiResponse<T = UserProfile> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  validationErrors?: ProfileValidationError[];
}






