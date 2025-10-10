import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Edge Middleware
 * 
 * Note: Security middleware, rate limiting, and authentication are handled
 * at the API route level using our comprehensive middleware system in:
 * - lib/middleware/security.ts
 * - lib/middleware/authRateLimiter.ts  
 * - lib/middleware/authMiddleware.ts
 * 
 * This middleware applies basic security headers globally.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Apply basic security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove X-Powered-By
  response.headers.delete('X-Powered-By');

  return response;
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