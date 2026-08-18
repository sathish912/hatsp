import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's assigned dashboard
    switch (user.role) {
      case 'company_admin': return <Navigate to="/admin" replace />;
      case 'hr_manager': return <Navigate to="/hr" replace />;
      case 'recruiter': return <Navigate to="/recruiter" replace />;
      case 'candidate': return <Navigate to="/candidate" replace />;
      default: return <Navigate to="/" replace />;
    }
  }

  return children;
}
