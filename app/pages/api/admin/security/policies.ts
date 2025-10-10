/**
 * GET/POST/PUT/DELETE /api/admin/security/policies
 * 
 * WO-157: Security Policy Management API
 * 
 * Features:
 * - Create security policies
 * - Retrieve policies (individual & bulk)
 * - Update policies
 * - Delete policies
 * - Admin authentication required
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';
import { z } from 'zod';

const SecurityPolicySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  policyType: z.enum(['INPUT_VALIDATION', 'RATE_LIMITING', 'SECURITY_HEADERS', 'AUTHENTICATION']),
  rules: z.record(z.any()),
  isActive: z.boolean().default(true),
});

// In-memory storage (production would use database)
const policies: Map<string, any> = new Map();

async function securityPoliciesHandler(req: NextApiRequest, res: NextApiResponse) {
  // Verify admin role
  const userRole = (req as any).user?.role;
  if (userRole !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required for security policy management',
    });
  }

  if (req.method === 'POST') {
    // WO-157: Create policy
    try {
      const validatedData = SecurityPolicySchema.parse(req.body);
      
      const policyId = `policy_${Date.now()}`;
      const policy = {
        id: policyId,
        ...validatedData,
        createdAt: new Date().toISOString(),
        createdBy: (req as any).user?.id,
      };

      policies.set(policyId, policy);

      return res.status(201).json({
        success: true,
        message: 'Security policy created successfully',
        policy,
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }

  } else if (req.method === 'GET') {
    // WO-157: Retrieve policies
    const policyId = req.query.id as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    if (policyId) {
      const policy = policies.get(policyId);
      
      if (!policy) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Security policy not found',
        });
      }

      return res.status(200).json({
        success: true,
        policy,
      });
    }

    // Bulk retrieval with pagination
    const allPolicies = Array.from(policies.values());
    const start = (page - 1) * limit;
    const paginatedPolicies = allPolicies.slice(start, start + limit);

    return res.status(200).json({
      success: true,
      policies: paginatedPolicies,
      pagination: {
        page,
        limit,
        total: allPolicies.length,
        totalPages: Math.ceil(allPolicies.length / limit),
      },
    });

  } else if (req.method === 'PUT') {
    // WO-157: Update policy
    const policyId = req.query.id as string;
    
    if (!policyId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Policy ID is required for updates',
      });
    }

    const existingPolicy = policies.get(policyId);
    if (!existingPolicy) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Security policy not found',
      });
    }

    try {
      const validatedData = SecurityPolicySchema.partial().parse(req.body);
      
      const updatedPolicy = {
        ...existingPolicy,
        ...validatedData,
        updatedAt: new Date().toISOString(),
        updatedBy: (req as any).user?.id,
      };

      policies.set(policyId, updatedPolicy);

      return res.status(200).json({
        success: true,
        message: 'Security policy updated successfully',
        policy: updatedPolicy,
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }

  } else if (req.method === 'DELETE') {
    // WO-157: Delete policy
    const policyId = req.query.id as string;
    
    if (!policyId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Policy ID is required for deletion',
      });
    }

    const policy = policies.get(policyId);
    if (!policy) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Security policy not found',
      });
    }

    policies.delete(policyId);

    return res.status(200).json({
      success: true,
      message: 'Security policy deleted successfully',
    });

  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(securityPoliciesHandler);



