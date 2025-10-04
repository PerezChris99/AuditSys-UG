
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { role } = useAuth();

  if (!allowedRoles.includes(role)) {
    // Redirect them to the home page if they don't have access
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
