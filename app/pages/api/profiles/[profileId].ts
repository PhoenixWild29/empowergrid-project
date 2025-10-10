import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
} from '../../../lib/services/userProfileService';

/**
 * GET /api/profiles/[profileId]
 * 
 * Retrieve user profile by ID
 * 
 * Features:
 * - Public profiles (filtered data for non-owners)
 * - Full profile for owner
 * - Visibility-based filtering
 */
async function getProfile(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { profileId } = req.query;
    const requestingUserId = (req as any).userId;

    if (typeof profileId !== 'string') {
      return res.status(400).json({
        error: 'Invalid profile ID',
      });
    }

    const profile = await getUserProfile(profileId, requestingUserId);

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      return res.status(404).json({
        error: 'Profile not found',
      });
    }

    console.error('Get profile error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve profile',
    });
  }
}

/**
 * PUT /api/profiles/[profileId]
 * 
 * Update user profile
 * 
 * Features:
 * - Partial or complete updates
 * - Validation confirmation
 * - Authorization checks
 */
async function updateProfile(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { profileId } = req.query;
    const requestingUserId = (req as any).userId;

    if (typeof profileId !== 'string') {
      return res.status(400).json({
        error: 'Invalid profile ID',
      });
    }

    if (!requestingUserId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const updatedProfile = await updateUserProfile(profileId, req.body, requestingUserId);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: 'Profile not found',
        });
      }
      if (error.message === 'Unauthorized to update this profile') {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }
      if (error.message.includes('already taken') || error.message.includes('already in use')) {
        return res.status(409).json({
          error: 'Conflict',
          message: error.message,
        });
      }
    }

    console.error('Update profile error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update profile',
    });
  }
}

/**
 * DELETE /api/profiles/[profileId]
 * 
 * Delete user profile
 * 
 * Features:
 * - Soft delete (anonymization)
 * - Authorization checks
 * - Admin override
 */
async function deleteProfile(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { profileId } = req.query;
    const requestingUserId = (req as any).userId;
    const requestingUserRole = (req as any).userRole;

    if (typeof profileId !== 'string') {
      return res.status(400).json({
        error: 'Invalid profile ID',
      });
    }

    if (!requestingUserId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const result = await deleteUserProfile(profileId, requestingUserId, requestingUserRole);

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: 'Profile not found',
        });
      }
      if (error.message === 'Unauthorized to delete this profile') {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }
    }

    console.error('Delete profile error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete profile',
    });
  }
}

/**
 * Main handler
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getProfile(req, res);
  } else if (req.method === 'PUT') {
    return updateProfile(req, res);
  } else if (req.method === 'DELETE') {
    return deleteProfile(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Apply authentication middleware for PUT and DELETE
export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // GET can be called without auth (returns public profile)
    return handler(req, res);
  } else {
    // PUT and DELETE require authentication
    return withAuth(handler)(req, res);
  }
}

