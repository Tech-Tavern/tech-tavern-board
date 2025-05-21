// src/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../authContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  console.log("PROTECTED: ", user, loading);
  if (loading) return null; // or a spinner
  // if (user) return <Navigate to="/" replace />;
  if (!user) return <Navigate to="/signin" replace />;
  return children;
}
