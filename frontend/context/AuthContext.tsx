import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

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

// Auth Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      // Clear potentially corrupted data
      await AsyncStorage.multiRemove(['userToken', 'userData']);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (userData: User) => {
    try {
      setUser(userData);
      // Note: Token and userData are already stored in AsyncStorage by the loginUser API call
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      // Still set user to null even if AsyncStorage fails
      setUser(null);
    }
  };

  // Update user function (for profile updates)
  const updateUser = async (userData: User) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  // Check auth state on component mount
  useEffect(() => {
    checkAuthState();
  }, []);

  // Derived state
  const isLoggedIn = user !== null;

  const value: AuthContextType = {
    user,
    isLoggedIn,
    loading,
    login,
    logout,
    updateUser,
    checkAuthState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};