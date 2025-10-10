import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { securityMiddleware } from '../../../lib/middleware/security';
import { applyAuthRateLimit } from '../../../lib/middleware/authRateLimiter';
import { z } from 'zod';

/**
 * User Registration Schema
 */
const RegisterSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email().optional(),
  role: z.enum(['GUEST', 'FUNDER', 'CREATOR', 'ADMIN']).default('FUNDER'),
});

/**
 * POST /api/users/register
 * 
 * User registration endpoint
 * 
 * Features:
 * - Validates input format
 * - Checks for existing users
 * - Creates new user account
 * - Returns user data (without sensitive info)
 * - Proper error handling with descriptive messages
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse and validate request body
    const validationResult = RegisterSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { walletAddress, username, email, role } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { walletAddress },
          { username },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        details: [
          {
            field: existingUser.walletAddress === walletAddress ? 'walletAddress' :
                   existingUser.username === username ? 'username' : 'email',
            message: 'This value is already registered',
          },
        ],
      });
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        walletAddress,
        username,
        email: email || null,
        role,
        verified: false,
        reputation: 0,
      },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        email: true,
        role: true,
        reputation: true,
        verified: true,
        createdAt: true,
      },
    });

    // Create user stats
    await prisma.userStats.create({
      data: {
        userId: user.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register user. Please try again later.',
    });
  }
}

// Apply middleware (registration doesn't use rate limiter, uses security middleware only)
export default async function (req: NextApiRequest, res: NextApiResponse) {
  // Apply security middleware
  securityMiddleware(req, res);

  return handler(req, res);
}

