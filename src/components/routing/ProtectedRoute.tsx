// src/components/routing/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Opción 1 — un solo hijo obligatorio:
type ProtectedRouteProps = { children: React.ReactElement };

const ProtectedRoute = ({ children }: ProtectedRouteProps): React.ReactElement => {
  const { authState } = useAuth();
  if (!authState.isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

export default ProtectedRoute;
