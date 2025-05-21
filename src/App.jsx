import { Routes, Route } from "react-router-dom";
AuthProvider;
import ProtectedRoute from "./components/ProtectedRoute";

import SignIn from "./components/SignIn";
import { AuthProvider } from "./authContext";
import Home from "./components/Home";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/signin" element={<SignIn />} />
      </Routes>
    </AuthProvider>
  );
}
