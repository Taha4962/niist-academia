import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user.is_first_login && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles.length > 0) {
    if (allowedRoles.includes('hod') && user.role === 'faculty' && user.is_hod) {
      return children;
    }
    if (!allowedRoles.includes(user.role)) {
      if (user.role === 'faculty' && user.is_hod) return <Navigate to="/hod/dashboard" replace />;
      if (user.role === 'faculty') return <Navigate to="/faculty/dashboard" replace />;
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
