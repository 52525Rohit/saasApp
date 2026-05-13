import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  // Initialize auth state from localStorage
  init: () => {
    const token = localStorage.getItem("accessToken");
    const user = localStorage.getItem("user");
    if (token && user) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      set({ user: JSON.parse(user), isAuthenticated: true });
    }
  },

  // Login
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      const { user, accessToken, refreshToken } = response.data.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      set({ user, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || "Login failed";
      return { success: false, message };
    }
  },

  // Register
  register: async (userData) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      set({ isLoading: false });
      return { success: true, message: response.data.message };
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || "Registration failed";
      return { success: false, message };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    set({ user: null, isAuthenticated: false });
    toast.success("Logged out successfully");
  },

  // Get current user
  fetchUser: async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      const user = response.data.data;
      localStorage.setItem("user", JSON.stringify(user));
      set({ user });
      return user;
    } catch (error) {
      get().logout();
      throw error;
    }
  },

  // Update user
  updateUser: async (userData) => {
    set({ isLoading: true });
    try {
      const response = await axios.put(`${API_URL}/user/profile`, userData);
      const updatedUser = response.data.data;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      set({ user: updatedUser, isLoading: false });
      toast.success("Profile updated successfully");
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || "Update failed";
      toast.error(message);
      return { success: false, message };
    }
  },
}));

export default useAuthStore;
