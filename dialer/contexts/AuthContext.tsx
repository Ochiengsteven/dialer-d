import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

// Define user type
interface User {
  id: string;
  username: string;
  email: string;
  gender: string;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    gender: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

// Create auth context
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  error: null,
});

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userJson = await AsyncStorage.getItem('user');
        
        if (token && userJson) {
          const userData = JSON.parse(userJson);
          setUser(userData);
          
          // Connect to WebSocket server
          await connectSocket();
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
    
    // Clean up on unmount
    return () => {
      disconnectSocket();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.login({ email, password });
      
      if (response.status === 'success') {
        setUser(response.data.user);
        
        // Connect to WebSocket server
        await connectSocket();
        
        // Navigate to home screen
        router.replace('/(tabs)');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    gender: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.register(userData);
      
      if (response.status === 'success') {
        // Auto login after successful registration
        await login(userData.email, userData.password);
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Disconnect from WebSocket server
      disconnectSocket();
      
      // Clear auth data
      await authAPI.logout();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auth context value
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
