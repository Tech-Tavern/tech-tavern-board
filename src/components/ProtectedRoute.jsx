// src/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../authContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; 
  if (!user) return <Navigate to="/signin" replace />;
  return children;
}
