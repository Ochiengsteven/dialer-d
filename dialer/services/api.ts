import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Base URL for API requests
// Use the device's IP address instead of localhost for Expo Go
const API_URL = "http://192.168.100.55/api"; // Using device IP instead of localhost

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication API calls
export const authAPI = {
  // Register a new user
  register: async (userData: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    gender: string;
  }) => {
    try {
      const response = await api.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Registration failed");
      }
      throw new Error("Network error during registration");
    }
  },

  // Login user
  login: async (credentials: { email: string; password: string }) => {
    try {
      const response = await api.post("/auth/login", credentials);
      if (response.data.status === "success") {
        // Store token in AsyncStorage
        await AsyncStorage.setItem("token", response.data.data.token);
        await AsyncStorage.setItem(
          "user",
          JSON.stringify(response.data.data.user)
        );
      }
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Login failed");
      }
      throw new Error("Network error during login");
    }
  },

  // Logout user
  logout: async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get("/auth/profile");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Failed to get profile");
      }
      throw new Error("Network error while fetching profile");
    }
  },
};

// Call API calls
export const callAPI = {
  // Get call history
  getCallHistory: async (params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }) => {
    try {
      const response = await api.get("/calls", { params });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Failed to get call history"
        );
      }
      throw new Error("Network error while fetching call history");
    }
  },

  // Get call details
  getCallDetails: async (callId: string) => {
    try {
      const response = await api.get(`/calls/${callId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Failed to get call details"
        );
      }
      throw new Error("Network error while fetching call details");
    }
  },

  // Rate a call
  rateCall: async (callId: string, rating: number) => {
    try {
      const response = await api.post(`/calls/${callId}/rate`, { rating });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Failed to rate call");
      }
      throw new Error("Network error while rating call");
    }
  },
};

export default api;
