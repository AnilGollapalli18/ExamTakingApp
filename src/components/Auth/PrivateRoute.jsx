import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

/*
  Usage:
    <Route element={<PrivateRoute><Dashboard/></PrivateRoute>} />
*/
export default function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // while auth state is resolving, show nothing (or a spinner)
  if (loading) return null; // or return <LoadingSpinner />

  // not authenticated -> redirect to login once (no setState here)
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // authenticated -> render children
  return children;
}
