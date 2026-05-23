import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = "http://localhost:5000/api/v1";

axios.defaults.withCredentials = true;

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  isInitialized: false, // ✅ prevents redirect before init completes

  init: () => {
    const token = localStorage.getItem("accessToken");
    const user = localStorage.getItem("user");
    if (token && user) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      set({
        user: JSON.parse(user),
        isAuthenticated: true,
        isInitialized: true,
      });
    } else {
      set({ isInitialized: true }); // ✅ mark done even if no session
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { user, accessToken } = response.data.data;

      localStorage.setItem("accessToken", accessToken);
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

  register: async (userData) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      set({ isLoading: false });
      return { success: true, message: response.data.message };
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || "Registration failed";
      const errors = error.response?.data?.errors || []; // ✅ capture validation errors
      return { success: false, message, errors };
    }
  },

  logout: async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (_) {}

    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];

    set({ user: null, isAuthenticated: false });
    toast.success("Logged out successfully");
  },

  refreshAccessToken: async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/refresh`);
      const { accessToken } = response.data.data;

      localStorage.setItem("accessToken", accessToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      return accessToken;
    } catch {
      get().logout();
      return null;
    }
  },

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

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const newToken = await useAuthStore.getState().refreshAccessToken();

      if (newToken) {
        original.headers["Authorization"] = `Bearer ${newToken}`;
        return axios(original);
      }
    }

    return Promise.reject(error);
  },
);

export default useAuthStore;
