import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

const CounselorRoute: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/counselor-login" replace />;
  }

  if (user.role !== 'counselor') {
    // Not a counselor, redirect to client dashboard or a generic error page
    return <Navigate to="/dashboard" replace />;
  }



  return <Outlet />;
};

export default CounselorRoute;
