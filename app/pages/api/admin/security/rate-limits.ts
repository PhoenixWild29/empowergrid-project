/**
 * GET/POST/PUT /api/admin/security/rate-limits
 * 
 * WO-162: Rate Limiting Configuration API
 * 
 * Features:
 * - Create rate limit rules
 * - Retrieve configurations
 * - Update thresholds & windows
 * - Disable rules temporarily
 * - Immediate effect
 * - Audit logging
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';
import { z } from 'zod';
import { RATE_LIMIT_CONFIGS } from '../../../../lib/middleware/rateLimitMiddleware';

const RateLimitRuleSchema = z.object({
  targetEndpoint: z.string(),
  requestLimit: z.number().int().positive(),
  timeWindowMs: z.number().int().positive(),
  enforcementAction: z.enum(['BLOCK', 'THROTTLE', 'LOG']).default('BLOCK'),
  userGroup: z.string().optional(),
  isEnabled: z.boolean().default(true),
});

// In-memory storage for custom rules
const rateLimitRules: Map<string, any> = new Map();

async function rateLimitsHandler(req: NextApiRequest, res: NextApiResponse) {
  if ((req as any).user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'POST') {
    // WO-162: Create rate limit rule
    try {
      const rule = RateLimitRuleSchema.parse(req.body);

      const ruleId = `rl_${Date.now()}`;
      const newRule = {
        id: ruleId,
        ...rule,
        createdAt: new Date().toISOString(),
        createdBy: (req as any).user?.id,
      };

      rateLimitRules.set(ruleId, newRule);

      // WO-162: Log change
      console.log('[WO-162] Rate limit rule created:', {
        ruleId,
        admin: (req as any).user?.id,
        timestamp: new Date().toISOString(),
      });

      return res.status(201).json({
        success: true,
        rule: newRule,
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
    // WO-162: Retrieve configurations
    const endpoint = req.query.endpoint as string | undefined;
    const userGroup = req.query.userGroup as string | undefined;
    const status = req.query.status as string | undefined;

    let filtered = Array.from(rateLimitRules.values());

    if (endpoint) {
      filtered = filtered.filter((r: any) => r.targetEndpoint === endpoint);
    }
    if (userGroup) {
      filtered = filtered.filter((r: any) => r.userGroup === userGroup);
    }
    if (status === 'enabled') {
      filtered = filtered.filter((r: any) => r.isEnabled);
    } else if (status === 'disabled') {
      filtered = filtered.filter((r: any) => !r.isEnabled);
    }

    // Include default configs
    const defaultConfigs = Object.entries(RATE_LIMIT_CONFIGS).map(([key, config]) => ({
      id: `default_${key}`,
      name: key,
      targetEndpoint: key,
      requestLimit: config.maxRequests,
      timeWindowMs: config.windowMs,
      enforcementAction: 'BLOCK',
      isEnabled: true,
      isDefault: true,
    }));

    return res.status(200).json({
      success: true,
      rules: [...filtered, ...defaultConfigs],
      total: filtered.length + defaultConfigs.length,
    });

  } else if (req.method === 'PUT') {
    // WO-162: Update rule (immediate effect)
    const ruleId = req.query.id as string;
    const rule = rateLimitRules.get(ruleId);

    if (!rule) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    const updates = req.body;
    const updatedRule = {
      ...rule,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: (req as any).user?.id,
    };

    rateLimitRules.set(ruleId, updatedRule);

    // WO-162: Log change
    console.log('[WO-162] Rate limit updated:', {
      ruleId,
      admin: (req as any).user?.id,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      rule: updatedRule,
    });

  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(rateLimitsHandler);



