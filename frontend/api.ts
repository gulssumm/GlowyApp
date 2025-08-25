import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import Constants from 'expo-constants';

const API_URL =
  Constants.expoConfig?.extra?.API_URL ??
  Constants.manifest2?.extra?.expoClient?.extra?.API_URL ??
  "http://192.168.1.25:5000/api"; // fallback default


// AXIOS INTERCEPTORS
// Add token to all requests automatically
axios.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      // TODO: Redirect to login screen 
      console.log('Token expired, user logged out');
    }
    return Promise.reject(error);
  }
);

// Login
export const loginUser = async (email: string, password: string) => {
  try {
    const res = await axios.post(`${API_URL}/user/login`, {
      email,
      password,
    });

    // Store JWT token
    if (res.data.Token) {
      await AsyncStorage.setItem('userToken', res.data.Token);
    }
    if (res.data.User) {
      await AsyncStorage.setItem('userData', JSON.stringify(res.data.User));
    }
    
    return res.data; // Returns user object or later JWT
  } catch (err: any) {
    console.error("Login error:", err.response?.data || err.message);
    
    // Handle different error formats like in register
    let message = "Login failed";
    
    if (err.response?.data) {
      // Handle .NET validation errors
      if (err.response.data.errors) {
        message = "Invalid email or password format";
      }
      // Handle custom 401 Unauthorized errors from backend 
      else if (typeof err.response.data === 'string'){
        message = err.response.data;
      }
      // Handle other error formats
      else if (err.response.data.message){
        message = err.response.data.message;
      }
    }
    
    throw message;
  }
};

// Register
export const registerUser = async (username: string, email: string, password: string) => {
  try {
    const res = await axios.post(`${API_URL}/user/register`, {
      username,
      email,
      password
    });
    return res.data;
  }  catch (err: any) {
    console.log("Full error object:", err.response); // Debugging
    
    // Handle different response formats
    let message = "Registration failed";
    
    if (err.response?.data) {
      if (err.response?.data) {
      if (err.response.data.errors) {
        if (err.response.data.errors.Password) {
          message = err.response.data.errors.Password[0];
        } else {
          message = err.response.data.title || "Validation failed";
        }
      } else if (typeof err.response.data === 'string') {
        message = err.response.data;
      } else if (err.response.data.message) {
        message = err.response.data.message;
      } else if (err.response.data.title) {
        message = err.response.data.title;
      }
    }
  }
    throw message;
  }
};

// Change Password
export const changePassword = async (email: string, oldPassword: string, newPassword: string) => {
  try {
    const res = await axios.post(`${API_URL}/user/change-password`, {
      email,
      oldPassword,
      newPassword
    });
    return res.data;
  } catch (err: any) {
    console.error("Change password error:", err.response?.data || err.message);
    
    let message = "Password change failed";
    
    if (err.response?.data) {
      // Handle .NET validation errors
      if (err.response.data.errors) {
        if (err.response.data.errors.NewPassword) {
          message = err.response.data.errors.NewPassword[0];
        } else {
          message = err.response.data.title || "Validation failed";
        }
      }
      // Handle custom errors from backend
      else if (typeof err.response.data === 'string') {
        message = err.response.data;
      }
      // Handle structured error responses
      else if (err.response.data.message) {
        message = err.response.data.message;
      }
    }
    
    throw message;
  }
};

// Logout
export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    console.log('User logged out successfully');
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

// Get current user profile from AsyncStorage
export const getCurrentUser = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    const userToken = await AsyncStorage.getItem('userToken');
    
    if (userData && userToken) {
      return {
        user: JSON.parse(userData),
        isLoggedIn: true,
        token: userToken
      };
    }
    
    return {
      user: null,
      isLoggedIn: false,
      token: null
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return {
      user: null,
      isLoggedIn: false,
      token: null
    };
  }
};

// Check if user is authenticated
export const isUserAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const userData = await AsyncStorage.getItem('userData');
    return !!(token && userData);
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Get user profile by ID 
export const getUserProfile = async (userId: number) => {
  try {
    const res = await axios.get(`${API_URL}/user/${userId}`);
    return res.data;
  } catch (err: any) {
    console.error("Get profile error:", err.response?.data || err.message);
    
    let message = "Failed to load profile";
    
    if (err.response?.data) {
      if (typeof err.response.data === 'string') {
        message = err.response.data;
      } else if (err.response.data.message) {
        message = err.response.data.message;
      }
    }
    
    throw message;
  }
};

// Update user profile
export const updateUserProfile = async (userId: number, userData: { username: string; email: string }) => {
  try {
    const res = await axios.put(`${API_URL}/user/${userId}`, userData);
    
    // Update stored user data
    if (res.data) {
      await AsyncStorage.setItem('userData', JSON.stringify(res.data));
    }
    
    return res.data;
  } catch (err: any) {
    console.error("Update profile error:", err.response?.data || err.message);
    
    let message = "Failed to update profile";
    
    if (err.response?.data) {
      // Handle validation errors
      if (err.response.data.errors) {
        if (err.response.data.errors.Username) {
          message = err.response.data.errors.Username[0];
        } else if (err.response.data.errors.Email) {
          message = err.response.data.errors.Email[0];
        } else {
          message = err.response.data.title || "Validation failed";
        }
      }
      // Handle conflict errors (username/email taken)
      else if (err.response.status === 409 && typeof err.response.data === 'string') {
        message = err.response.data;
      }
      // Handle other error formats
      else if (typeof err.response.data === 'string') {
        message = err.response.data;
      } else if (err.response.data.message) {
        message = err.response.data.message;
      }
    }
    
    throw message;
  }
};

// Refresh user token 
export const refreshUserToken = async () => {
  try {
    const currentToken = await AsyncStorage.getItem('userToken');
    if (!currentToken) {
      throw new Error('No token found');
    }
    
    const res = await axios.post(`${API_URL}/user/refresh-token`, {}, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    
    if (res.data.Token) {
      await AsyncStorage.setItem('userToken', res.data.Token);
    }
    
    return res.data;
  } catch (err: any) {
    console.error("Refresh token error:", err.response?.data || err.message);
    // If refresh fails, logout user
    await logoutUser();
    throw "Session expired, please login again";
  }
};

// Update user data in AsyncStorage
export const updateStoredUserData = async (newUserData: { id: number; username: string; email: string }) => {
  try {
    await AsyncStorage.setItem('userData', JSON.stringify(newUserData));
    return true;
  } catch (error) {
    console.error('Error updating stored user data:', error);
    return false;
  }
};

// Clear all user session data
export const clearUserSession = async () => {
  try {
    await AsyncStorage.multiRemove(['userToken', 'userData']);
    console.log('User session cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing user session:', error);
    return false;
  }
};