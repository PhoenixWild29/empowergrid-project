import { NextRequest, NextResponse } from 'next/server';
import {
  applySecurityHeaders,
  handleRateLimit,
  handleCors,
  sanitizeInput,
  isSqlInjectionAttempt,
  containsXssPayload,
  securityMonitor
} from './lib/middleware/security';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS preflight requests
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return applySecurityHeaders(corsResponse);
  }

  // Apply rate limiting based on endpoint type
  let rateLimitResult;

  if (pathname.startsWith('/api/auth/')) {
    rateLimitResult = handleRateLimit(request, 'AUTH');
  } else if (pathname.includes('/api/actions/fund/')) {
    rateLimitResult = handleRateLimit(request, 'FUNDING');
  } else if (pathname.startsWith('/api/')) {
    rateLimitResult = handleRateLimit(request, 'API');
  }

  if (rateLimitResult && !rateLimitResult.allowed) {
    // Log rate limit violation
    securityMonitor.logEvent({
      type: 'rate_limit',
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || '',
      path: pathname
    });

    return applySecurityHeaders(rateLimitResult.response!);
  }

  // Input validation for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      // Clone the request to read body
      const clonedRequest = request.clone();
      const body = await clonedRequest.json().catch(() => ({}));

      // Check for suspicious input patterns
      const checkInput = (obj: any, path = ''): boolean => {
        if (typeof obj === 'string') {
          const sanitized = sanitizeInput(obj);
          if (isSqlInjectionAttempt(obj) || containsXssPayload(obj)) {
            securityMonitor.logEvent({
              type: 'suspicious_input',
              ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
              userAgent: request.headers.get('user-agent') || '',
              path: pathname,
              details: { field: path, original: obj, sanitized }
            });
            return true;
          }
        } else if (typeof obj === 'object' && obj !== null) {
          for (const [key, value] of Object.entries(obj)) {
            if (checkInput(value, path ? `${path}.${key}` : key)) {
              return true;
            }
          }
        }
        return false;
      };

      if (checkInput(body)) {
        return applySecurityHeaders(
          NextResponse.json(
            { success: false, message: 'Invalid input detected' },
            { status: 400 }
          )
        );
      }
    } catch (error) {
      // If body parsing fails, continue (might be file upload)
    }
  }

  // Create response and apply security headers
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};