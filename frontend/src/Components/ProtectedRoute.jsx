import { Navigate } from "react-router-dom";
import useAuthStore from "../context/authStore";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitialized } = useAuthStore();

  // ✅ wait until init() has run before making a decision
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
