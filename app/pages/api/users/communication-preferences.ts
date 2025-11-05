import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { z } from 'zod';

/**
 * Communication Preference Schema
 */
const CommunicationPreferenceSchema = z.object({
  preferenceId: z.string(),
  enabled: z.boolean().optional(),
  frequency: z.enum(['immediate', 'daily', 'weekly', 'never']).optional(),
});

/**
 * GET /api/users/communication-preferences
 * 
 * Retrieve user communication preferences
 */
async function getPreferences(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = (req as any).userId;

    // In production, fetch from database
    // For now, return default preferences
    const preferences = {
      email_account_security: { enabled: true, frequency: 'immediate' },
      email_account_changes: { enabled: true, frequency: 'immediate' },
      email_promotional_newsletter: { enabled: false, frequency: 'weekly' },
      email_promotional_offers: { enabled: false, frequency: 'weekly' },
      email_system_maintenance: { enabled: true, frequency: 'immediate' },
      push_system_updates: { enabled: true, frequency: 'immediate' },
      email_social_comments: { enabled: true, frequency: 'daily' },
      email_social_followers: { enabled: false, frequency: 'weekly' },
    };

    return res.status(200).json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Get communication preferences error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve communication preferences',
    });
  }
}

/**
 * PUT /api/users/communication-preferences
 * 
 * Update communication preference
 */
async function updatePreference(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = (req as any).userId;

    // Validate request
    const validationResult = CommunicationPreferenceSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validationResult.error.errors,
      });
    }

    const { preferenceId, enabled, frequency } = validationResult.data;

    // In production, update in database
    // await updateUserCommunicationPreference(userId, preferenceId, { enabled, frequency });

    return res.status(200).json({
      success: true,
      message: 'Communication preference updated successfully',
      preference: {
        id: preferenceId,
        enabled,
        frequency,
      },
    });
  } catch (error) {
    console.error('Update communication preference error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update communication preference',
    });
  }
}

/**
 * Main handler
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getPreferences(req, res);
  } else if (req.method === 'PUT') {
    return updatePreference(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Apply authentication middleware
export default withAuth(handler);






