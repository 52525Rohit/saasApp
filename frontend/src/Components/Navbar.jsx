import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, Home, CreditCard } from "lucide-react";
import useAuthStore from "../context/authStore";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 h-16 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">
          SaaS App
        </Link>

        <div className="flex items-center gap-5">
          {isAuthenticated ? (
            <>
              <Link
                className="flex items-center gap-1 text-gray-700 hover:text-blue-600"
                to="/dashboard"
              >
                <Home size={18} /> Dashboard
              </Link>

              <Link
                className="flex items-center gap-1 text-gray-700 hover:text-blue-600"
                to="/profile"
              >
                <User size={18} /> Profile
              </Link>

              <Link
                className="flex items-center gap-1 text-gray-700 hover:text-blue-600"
                to="/billing"
              >
                <CreditCard size={18} /> Billing
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-red-600 hover:text-red-700"
              >
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-blue-600">
                Login
              </Link>

              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
