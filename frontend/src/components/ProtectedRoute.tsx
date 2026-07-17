import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="form-error">Loading...</p>;
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  return <>{children}</>;
}
