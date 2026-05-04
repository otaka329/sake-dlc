import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * 認証ガード
 * BR-06-01: 未認証ユーザーはログイン/登録画面のみアクセス可能
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
