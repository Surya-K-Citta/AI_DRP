// @ts-nocheck
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

// Helper function to get user from localStorage - more robust parsing
const getUserFromStorage = () => {
  try {
    const storedAuthData = localStorage.getItem('auth-storage');
    if (storedAuthData) {
      const parsed = JSON.parse(storedAuthData);
      // Zustand persist stores as: { state: { user, token, isAuthenticated }, version: 0 }
      if (parsed?.state?.user) {
        return parsed.state.user;
      }
      // Fallback for different formats
      if (parsed?.user) {
        return parsed.user;
      }
    }
  } catch (e) {
    // Silently handle parse errors
  }
  return null;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, user, token } = useAuthStore();
  
  // Direct synchronous check - no waiting, no delays
  const storedToken = localStorage.getItem('token');
  const storedUser = getUserFromStorage();
  
  // Determine authentication status immediately
  // If token exists in localStorage, user is authenticated (most permissive check)
  const hasAuth = !!(storedToken || token);
  const effectiveUser = user || storedUser;
  const effectiveToken = token || storedToken;

  // If no token exists anywhere, redirect to login
  if (!hasAuth) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirement if specified
  if (requiredRole && effectiveUser?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
};

