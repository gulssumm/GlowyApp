import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import api from '../api';

// User type definition
export interface User {
  id: number;
  username: string;
  email: string;
}

// Auth context type definition
export interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: User) => Promise<void>;
  checkAuthState: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is logged in on app start
  const checkAuthState = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');

      if (userToken && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (userData: User) => {
    setUser(userData);
  };

  // Logout function
  const logout = async () => {
    await AsyncStorage.multiRemove(['userToken', 'userData']);
    setUser(null);
    router.replace('/login');
  };

  // Update user function
  const updateUser = async (userData: User) => {
    setUser(userData);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
  };

  // Auto logout on 401 responses 
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Only auto-logout if user is logged in AND not on login/signup pages
        if (error.response?.status === 401 && user !== null) {
          const currentPath = window.location?.pathname || '';
          const isOnAuthPage = currentPath.includes('/login') || currentPath.includes('/signup');
          
          if (!isOnAuthPage) {
            console.log('Token expired or invalid, logging out...');
            await logout();
            Alert.alert('Session expired', 'Please login again.');
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [user]);

  // Check auth state on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  const isLoggedIn = user !== null;

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, loading, login, logout, updateUser, checkAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};