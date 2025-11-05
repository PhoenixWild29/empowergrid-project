/**
 * User Profile Validation Schemas
 * 
 * Zod schemas for user profile operations
 */

import { z } from 'zod';

/**
 * Phone number validation regex
 * Supports international formats: +1234567890, (123) 456-7890, 123-456-7890
 */
const PHONE_REGEX = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;

/**
 * Create User Profile Request Schema
 * 
 * Required fields:
 * - walletAddress
 * - username
 * 
 * Optional fields:
 * - email
 * - phoneNumber
 * - bio
 * - website
 * - avatar
 * - socialLinks
 */
export const CreateUserProfileSchema = z.object({
  walletAddress: z.string()
    .min(32, 'Wallet address must be at least 32 characters')
    .max(44, 'Wallet address must be at most 44 characters'),
  
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be at most 255 characters')
    .optional(),
  
  phoneNumber: z.string()
    .max(20, 'Phone number must be at most 20 characters')
    .regex(PHONE_REGEX, 'Invalid phone number format')
    .optional(),
  
  bio: z.string()
    .optional(),
  
  website: z.string()
    .url('Invalid website URL')
    .max(500, 'Website URL must be at most 500 characters')
    .optional(),
  
  avatar: z.string()
    .url('Invalid avatar URL')
    .max(500, 'Avatar URL must be at most 500 characters')
    .optional(),
  
  socialLinks: z.record(z.string())
    .optional(),
  
  role: z.enum(['GUEST', 'FUNDER', 'CREATOR', 'ADMIN'])
    .default('FUNDER'),
});

/**
 * Update User Profile Request Schema
 * 
 * All fields optional for partial updates
 * Same validation rules as Create schema
 */
export const UpdateUserProfileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be at most 255 characters')
    .optional(),
  
  phoneNumber: z.string()
    .max(20, 'Phone number must be at most 20 characters')
    .regex(PHONE_REGEX, 'Invalid phone number format')
    .optional()
    .nullable(),
  
  bio: z.string()
    .optional()
    .nullable(),
  
  website: z.string()
    .url('Invalid website URL')
    .max(500, 'Website URL must be at most 500 characters')
    .optional()
    .nullable(),
  
  avatar: z.string()
    .url('Invalid avatar URL')
    .max(500, 'Avatar URL must be at most 500 characters')
    .optional()
    .nullable(),
  
  socialLinks: z.record(z.string())
    .optional()
    .nullable(),
});

/**
 * User Profile Response Schema
 * 
 * Schema for profile data returned from API
 */
export const UserProfileResponseSchema = z.object({
  id: z.string(),
  walletAddress: z.string(),
  username: z.string(),
  email: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  role: z.string(),
  reputation: z.number(),
  verified: z.boolean(),
  avatar: z.string().nullable(),
  bio: z.string().nullable(),
  website: z.string().nullable(),
  socialLinks: z.record(z.string()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Public Profile Response Schema
 * 
 * Schema for public profile data (excludes sensitive info)
 */
export const PublicProfileResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  role: z.string(),
  reputation: z.number(),
  verified: z.boolean(),
  avatar: z.string().nullable(),
  bio: z.string().nullable(),
  website: z.string().nullable(),
  createdAt: z.date(),
});

/**
 * Helper function to validate and parse create profile request
 */
export function validateCreateProfileRequest(data: unknown) {
  return CreateUserProfileSchema.safeParse(data);
}

/**
 * Helper function to validate and parse update profile request
 */
export function validateUpdateProfileRequest(data: unknown) {
  return UpdateUserProfileSchema.safeParse(data);
}

/**
 * Type exports
 */
export type CreateUserProfileRequest = z.infer<typeof CreateUserProfileSchema>;
export type UpdateUserProfileRequest = z.infer<typeof UpdateUserProfileSchema>;
export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;
export type PublicProfileResponse = z.infer<typeof PublicProfileResponseSchema>;






