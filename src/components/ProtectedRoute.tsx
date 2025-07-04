import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  userType?: 'client' | 'counselor';
}

export const ProtectedRoute = ({ children, userType }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If userType is specified, check if user has the correct type
  if (userType) {
    const userData = user.user_metadata;
    if (userData?.user_type !== userType) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};