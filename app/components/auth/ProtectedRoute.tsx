import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, Permission } from '../../types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: Permission;
  fallbackPath?: string;
  redirectIfAuthenticated?: boolean;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallbackPath = '/login',
  redirectIfAuthenticated = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Still checking authentication

    if (redirectIfAuthenticated && isAuthenticated) {
      // Redirect authenticated users away from login/signup pages
      // Only redirect if not already on the home page
      if (router.pathname !== '/') {
        router.push('/');
      }
      return;
    }

    if (!redirectIfAuthenticated && !isAuthenticated) {
      // Redirect unauthenticated users to login
      // Only redirect if not already on the fallback path
      if (router.pathname !== fallbackPath) {
        router.push(fallbackPath);
      }
      return;
    }

    // Check role requirements
    if (
      requiredRole &&
      user &&
      user.role !== requiredRole &&
      user.role !== UserRole.ADMIN
    ) {
      if (router.pathname !== '/unauthorized') {
        router.push('/unauthorized');
      }
      return;
    }

    // Check permission requirements
    if (requiredPermission && !hasPermission(requiredPermission)) {
      if (router.pathname !== '/unauthorized') {
        router.push('/unauthorized');
      }
      return;
    }
  }, [
    isAuthenticated,
    isLoading,
    user,
    requiredRole,
    requiredPermission,
    hasPermission,
    router,
    fallbackPath,
    redirectIfAuthenticated,
  ]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div
          role='status'
          aria-label='Loading'
          className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-600'
        ></div>
      </div>
    );
  }

  // Don't render children if authentication checks failed
  if (!redirectIfAuthenticated && !isAuthenticated) {
    return null;
  }

  if (redirectIfAuthenticated && isAuthenticated) {
    return null;
  }

  if (
    requiredRole &&
    user &&
    user.role !== requiredRole &&
    user.role !== UserRole.ADMIN
  ) {
    return null;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  return <>{children}</>;
}
