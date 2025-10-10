import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { createUserProfile, listUserProfiles } from '../../../lib/services/userProfileService';

/**
 * POST /api/profiles
 * 
 * Create new user profile
 * 
 * Features:
 * - Accepts personal information
 * - Validation of all fields
 * - Returns profile ID
 * - Creates associated stats
 */
async function createProfile(req: NextApiRequest, res: NextApiResponse) {
  try {
    const profile = await createUserProfile(req.body);

    return res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      profile: {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        role: profile.role,
        createdAt: profile.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'User already exists') {
      return res.status(409).json({
        error: 'Conflict',
        message: error.message,
      });
    }

    console.error('Create profile error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create profile',
    });
  }
}

/**
 * GET /api/profiles
 * 
 * List user profiles with pagination and filtering
 */
async function listProfiles(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      page = '1',
      limit = '25',
      role,
      verified,
      search,
    } = req.query;

    const result = await listUserProfiles({
      page: parseInt(page as string, 10),
      limit: Math.min(parseInt(limit as string, 10), 100),
      role: role as string | undefined,
      verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
      search: search as string | undefined,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('List profiles error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to list profiles',
    });
  }
}

/**
 * Main handler
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return createProfile(req, res);
  } else if (req.method === 'GET') {
    return listProfiles(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// POST requires authentication, GET is public
export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return withAuth(handler)(req, res);
  } else {
    return handler(req, res);
  }
}

