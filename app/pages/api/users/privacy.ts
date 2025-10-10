import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { z } from 'zod';

/**
 * Privacy Settings Schema
 */
const PrivacySettingSchema = z.object({
  settingId: z.string(),
  enabled: z.boolean(),
});

/**
 * GET /api/users/privacy
 * 
 * Retrieve user privacy settings
 */
async function getPrivacySettings(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = (req as any).userId;

    // In production, fetch from database
    // For now, return default settings
    const settings = {
      profile_visible: true,
      show_email: false,
      show_stats: true,
      activity_tracking: true,
      analytics_cookies: true,
      searchable: true,
      show_activity_feed: false,
    };

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Get privacy settings error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve privacy settings',
    });
  }
}

/**
 * PUT /api/users/privacy
 * 
 * Update user privacy setting
 */
async function updatePrivacySetting(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = (req as any).userId;

    // Validate request
    const validationResult = PrivacySettingSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validationResult.error.errors,
      });
    }

    const { settingId, enabled } = validationResult.data;

    // In production, update in database
    // await updateUserPrivacySetting(userId, settingId, enabled);

    return res.status(200).json({
      success: true,
      message: 'Privacy setting updated successfully',
      setting: {
        id: settingId,
        enabled,
      },
    });
  } catch (error) {
    console.error('Update privacy setting error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update privacy setting',
    });
  }
}

/**
 * Main handler
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getPrivacySettings(req, res);
  } else if (req.method === 'PUT') {
    return updatePrivacySetting(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Apply authentication middleware
export default withAuth(handler);

