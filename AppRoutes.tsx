import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AdminDashboard } from './pages/AdminDashboard';
import { MemberDashboard } from './pages/MemberDashboard';
import { UserManagement } from './pages/UserManagement';
import { ProfilePage } from './pages/ProfilePage';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useOutletContext } from 'react-router-dom';
import { Role, Loan } from './types';

// Wrapper for ProfilePage to pass context data
const ProfilePageWrapper = () => {
    const { myLoans } = useOutletContext<{ myLoans: Loan[] }>();
    return <ProfilePage loans={myLoans} />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* 0. Root Redirect - Explicitly send / to /login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* 1. Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* 2. Protected Routes Wrapper */}
      <Route element={<ProtectedRoute />}>
        {/* Layout Wrapper */}
        <Route element={<Layout />}>
          
          {/* Default Redirect (Index Route) - acts as fallback within the layout */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Member Routes */}
          <Route 
            path="dashboard" 
            element={
              <ProtectedRoute allowedRoles={[Role.MEMBER]}>
                <MemberDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="admin" 
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="admin/users" 
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                <UserManagement />
              </ProtectedRoute>
            } 
          />

          {/* Shared Routes */}
          <Route path="profile" element={<ProfilePageWrapper />} />
        
        </Route>
      </Route>

      {/* 3. Catch all - Redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
