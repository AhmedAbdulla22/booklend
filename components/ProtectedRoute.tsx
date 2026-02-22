import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  // 1. Loading State: Return spinner, DO NOT redirect yet
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-full bg-gray-50 transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-blue-600 font-medium animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // 2. Auth Check: If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Role Check: If user has wrong role, redirect to their dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === Role.ADMIN ? '/admin' : '/dashboard'} replace />;
  }

  // 4. Render Content: Render children if provided, otherwise render Outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
};