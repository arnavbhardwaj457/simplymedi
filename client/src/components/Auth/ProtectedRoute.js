import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../UI/LoadingSpinner';

const ProtectedRoute = ({ children, requireDoctor = false }) => {
  const { isAuthenticated, isLoading, doctor } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireDoctor && !doctor) {
    // Redirect to user dashboard if doctor access is required but user is not a doctor
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
