import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks';
import { getDashboardForRole } from '../types/roles';
import { RootState } from '../store';

interface RoleBasedRouteProps {
  children?: React.ReactNode;
}

/**
 * Component that routes users to their role-specific dashboard
 * Place this at your main dashboard route
 */
export function RoleBasedRoute({ children }: RoleBasedRouteProps) {
  const navigate = useNavigate();
  const user = useAppSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    // If user has roles, navigate to their primary dashboard
    if (user?.roles && user.roles.length > 0) {
      // Get the first role (highest priority role)
      const primaryRole = user.roles[0];
      const dashboard = getDashboardForRole(primaryRole as string);
      
      // Only redirect if not already on a dashboard
      if (window.location.pathname === '/' || window.location.pathname === '/dashboard/') {
        navigate(dashboard, { replace: true });
      }
    }
  }, [user, navigate]);

  return <>{children}</>;
}

/**
 * Hook to get user's primary role
 */
export function useUserRole() {
  const user = useAppSelector((state: RootState) => state.auth.user);
  return user?.roles?.[0] || null;
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(role: string): boolean {
  const user = useAppSelector((state: RootState) => state.auth.user);
  return user?.roles?.includes(role) || false;
}

/**
 * Hook to get all user roles
 */
export function useUserRoles() {
  const user = useAppSelector((state: RootState) => state.auth.user);
  return user?.roles || [];
}
