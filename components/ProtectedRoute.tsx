import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Permission } from '../types';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredPermission: Permission;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
  const { user, isAuthenticated, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user || !hasPermission(requiredPermission)) {
    // Redirect them to the home page if they don't have access
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
