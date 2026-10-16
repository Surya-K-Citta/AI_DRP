// @ts-nocheck
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ConsentGate } from '@/components/privacy/ConsentGate';
import { toAppRole } from '@/lib/rbac';
import { Forbidden } from '@/components/auth/Forbidden';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  /** Any of these roles may open the page. Everyone else sees the 403 page. */
  allowedRoles?: string[];
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
  allowedRoles,
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
  const userRole = toAppRole(effectiveUser?.role);
  if (requiredRole && userRole !== toAppRole(requiredRole)) {
    return <Forbidden />;
  }
  if (allowedRoles && !allowedRoles.some((role) => toAppRole(role) === userRole)) {
    return <Forbidden />;
  }

  return (
    <ConsentGate>
      {children}
    </ConsentGate>
  );
};

