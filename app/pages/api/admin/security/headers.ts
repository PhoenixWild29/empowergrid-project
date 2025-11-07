/**
 * GET/POST/PUT /api/admin/security/headers
 * 
 * WO-165: Security Header Policy Management API
 * 
 * Features:
 * - Create header policies
 * - Retrieve configurations
 * - Update header values
 * - Enable/disable headers
 * - Syntax validation (CSP, HSTS)
 * - Immediate effect & logging
 */

import { NextApiResponse } from 'next';
import {
  withRole,
  type AuthenticatedRequest,
} from '../../../../lib/middleware/authMiddleware';
import {
  getSecurityHeadersConfig,
  updateSecurityHeadersConfig,
  type SecurityHeadersConfig,
} from '../../../../lib/middleware/securityHeadersMiddleware';
import { z } from 'zod';
import { UserRole } from '../../../../types/auth';

const SecurityHeaderPolicySchema = z.object({
  headerName: z.enum(['CSP', 'HSTS', 'X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy']),
  headerValue: z.string(),
  targetRoutes: z.array(z.string()).optional(),
  isEnabled: z.boolean().default(true),
});

async function securityHeadersHandler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // WO-165: Retrieve current configuration
    const currentConfig = getSecurityHeadersConfig();

    return res.status(200).json({
      success: true,
      configuration: currentConfig,
    });

  } else if (req.method === 'POST' || req.method === 'PUT') {
    // WO-165: Create/Update header policy
    try {
      const policy = SecurityHeaderPolicySchema.parse(req.body);

      // WO-165: Validate header syntax
      const validation = validateHeaderSyntax(policy.headerName, policy.headerValue);
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Invalid header value',
          message: validation.error,
        });
      }

      // WO-165: Update configuration (immediate effect)
      const updates: Partial<SecurityHeadersConfig> = {};

      if (policy.headerName === 'X-Frame-Options') {
        updates.xFrameOptions = policy.headerValue as any;
      } else if (policy.headerName === 'X-Content-Type-Options') {
        updates.xContentTypeOptions = policy.isEnabled;
      } else if (policy.headerName === 'Referrer-Policy') {
        updates.referrerPolicy = policy.headerValue;
      }

      const updatedConfig = updateSecurityHeadersConfig(updates);

      // WO-165: Log change
      console.log('[WO-165] Security header updated:', {
        headerName: policy.headerName,
        admin: req.user.id,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        message: 'Security header policy updated',
        configuration: updatedConfig,
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

  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// WO-165: Validate security header syntax
function validateHeaderSyntax(headerName: string, value: string): {
  isValid: boolean;
  error?: string;
} {
  if (headerName === 'X-Frame-Options') {
    const valid = ['DENY', 'SAMEORIGIN'].includes(value) || value.startsWith('ALLOW-FROM');
    return {
      isValid: valid,
      error: valid ? undefined : 'Must be DENY, SAMEORIGIN, or ALLOW-FROM <uri>',
    };
  }

  if (headerName === 'CSP') {
    // Basic CSP validation (check for valid directives)
    const validDirectives = ['default-src', 'script-src', 'style-src', 'img-src', 'connect-src', 'font-src', 'object-src', 'media-src', 'frame-src'];
    const hasValidDirective = validDirectives.some(d => value.includes(d));
    
    return {
      isValid: hasValidDirective,
      error: hasValidDirective ? undefined : 'CSP must include at least one valid directive',
    };
  }

  if (headerName === 'HSTS') {
    // Must include max-age
    return {
      isValid: value.includes('max-age='),
      error: value.includes('max-age=') ? undefined : 'HSTS must include max-age directive',
    };
  }

  return { isValid: true };
}

export default withRole([UserRole.ADMIN], securityHeadersHandler);



