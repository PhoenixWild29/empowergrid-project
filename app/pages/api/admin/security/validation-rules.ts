/**
 * GET/POST/PUT /api/admin/security/validation-rules
 * 
 * WO-159: Input Validation Rules Management API
 * 
 * Features:
 * - Create validation rules (regex, length, format)
 * - Retrieve & filter rules
 * - Update rules
 * - Enable/disable rules
 * - Regex syntax validation
 * - Audit logging
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';
import { z } from 'zod';

const ValidationRuleSchema = z.object({
  fieldName: z.string().min(1).max(100),
  validationType: z.enum(['REGEX', 'LENGTH', 'FORMAT', 'RANGE']),
  ruleDefinition: z.any(), // Flexible based on type
  errorMessage: z.string().max(500),
  isEnabled: z.boolean().default(true),
});

// In-memory storage
const validationRules: Map<string, any> = new Map();

async function validationRulesHandler(req: NextApiRequest, res: NextApiResponse) {
  // Admin check
  if ((req as any).user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
  }

  if (req.method === 'POST') {
    // WO-159: Create rule
    try {
      const rule = ValidationRuleSchema.parse(req.body);

      // WO-159: Validate regex syntax if regex type
      if (rule.validationType === 'REGEX') {
        try {
          new RegExp(rule.ruleDefinition);
        } catch (e) {
          return res.status(400).json({
            error: 'Invalid regex pattern',
            message: 'Regex syntax is invalid',
          });
        }
      }

      const ruleId = `rule_${Date.now()}`;
      const newRule = {
        id: ruleId,
        ...rule,
        createdAt: new Date().toISOString(),
        createdBy: (req as any).user?.id,
      };

      validationRules.set(ruleId, newRule);

      // WO-159: Log for audit
      console.log('[WO-159] Validation rule created:', {
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
    // WO-159: Retrieve rules with filtering
    const fieldName = req.query.fieldName as string | undefined;
    const validationType = req.query.validationType as string | undefined;
    const status = req.query.status as string | undefined;

    let filtered = Array.from(validationRules.values());

    if (fieldName) {
      filtered = filtered.filter((r: any) => r.fieldName === fieldName);
    }
    if (validationType) {
      filtered = filtered.filter((r: any) => r.validationType === validationType);
    }
    if (status === 'enabled') {
      filtered = filtered.filter((r: any) => r.isEnabled);
    } else if (status === 'disabled') {
      filtered = filtered.filter((r: any) => !r.isEnabled);
    }

    return res.status(200).json({
      success: true,
      rules: filtered,
      total: filtered.length,
    });

  } else if (req.method === 'PUT') {
    // WO-159: Update rule
    const ruleId = req.query.id as string;
    const existingRule = validationRules.get(ruleId);

    if (!existingRule) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Validation rule not found',
      });
    }

    const updates = req.body;

    // Validate regex if updated
    if (updates.ruleDefinition && existingRule.validationType === 'REGEX') {
      try {
        new RegExp(updates.ruleDefinition);
      } catch (e) {
        return res.status(400).json({
          error: 'Invalid regex pattern',
        });
      }
    }

    const updatedRule = {
      ...existingRule,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: (req as any).user?.id,
    };

    validationRules.set(ruleId, updatedRule);

    // WO-159: Log update
    console.log('[WO-159] Validation rule updated:', {
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

export default withAuth(validationRulesHandler);



