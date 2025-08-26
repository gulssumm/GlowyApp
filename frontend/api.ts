import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL =
  Constants.expoConfig?.extra?.API_URL ??
  Constants.manifest2?.extra?.expoClient?.extra?.API_URL ??
  'http://172.16.1.20:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  console.log("=== REQUEST DEBUG ===");
  console.log("Request URL:", config.url);
  console.log("Request Method:", config.method);
  console.log("Sending token:", token);
  console.log("Token length:", token?.length || 0);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("Authorization header set:", config.headers.Authorization?.substring(0, 20) + "...");
  } else {
    console.log("No token found in storage");
  }
  return config;
});

// Handle token expiration globally
api.interceptors.response.use(
  (response) => {
    console.log("=== RESPONSE SUCCESS ===");
    console.log("Response status:", response.status);
    return response;
  },
  async (error) => {
    console.log("=== RESPONSE ERROR ===");
    console.log("Error status:", error.response?.status);
    console.log("Error data:", error.response?.data);
    console.log("Error message:", error.message);
    console.log("Full error response:", JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.status === 401) {
      console.log('Token expired or invalid. Error details:', error.response?.data);
      // Don't clear storage here - let the component handle it
    }
    return Promise.reject(error);
  }
);

export default api;

// ===== AUTH FUNCTIONS =====

const clearSession = async () => {
  await AsyncStorage.multiRemove(['userToken', 'userData']);
};

export const loginUser = async (email: string, password: string) => {
  try {
    await clearSession();
    const res = await api.post('/user/login', { email, password });

    const token = res.data?.token;
    const user = res.data?.user;

    if (!token || !user) {
      console.log('Login response:', res.data);
      throw new Error('No user data in response');
    }

    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(user));
    
    console.log("Token stored successfully. Length:", token.length);

    return { token, user };
  } catch (err: any) {
    console.error('Login error:', err);
    throw err?.response?.data?.message || err?.message || 'Login failed';
  }
};

export const registerUser = async (username: string, email: string, password: string) => {
  try {
    await clearSession();
    const res = await api.post('/user/register', { username, email, password });

    const token = res.data?.token;
    const user = res.data?.user;

    if (!token || !user) {
      console.log('Register response:', res.data);
      throw new Error('No user data in response');
    }

    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(user));

    return { token, user };
  } catch (err: any) {
    console.error('Register error:', err);
    throw err?.response?.data?.message || err?.message || 'Registration failed';
  }
};

export const getUserProfile = async (userId: number) => {
  try {
    console.log(`=== GETTING USER PROFILE FOR ID: ${userId} ===`);
    const res = await api.get(`/user/${userId}`);
    console.log("Get user profile response:", res.data);
    return res.data;
  } catch (err: any) {
    console.error('Get user profile error:', err);
    console.error('Error response:', err.response?.data);
    throw err;
  }
};

// Add this new function to test token validation
export const testTokenValidation = async () => {
  try {
    console.log("=== TESTING TOKEN VALIDATION ===");
    const res = await api.get('/user/debug-claims');
    console.log("Debug claims response:", res.data);
    return res.data;
  } catch (err: any) {
    console.error('Token validation test failed:', err);
    throw err;
  }
};

export const updateUserProfile = async (userId: number, updateData: { username: string; email: string }) => {
  try {
    console.log("=== UPDATE PROFILE ATTEMPT ===");
    console.log("User ID:", userId);
    console.log("Update data:", updateData);
    
    // Validate input data
    if (!updateData.username?.trim() || !updateData.email?.trim()) {
      throw new Error("Username and email are required");
    }

    const res = await api.put(`/user/${userId}`, {
      username: updateData.username.trim(),
      email: updateData.email.trim()
    });
    
    console.log("Update profile response:", res.data);
    
    const userData = res.data?.user || res.data;
    if (userData) {
      console.log("Updating local storage with new user data:", userData);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } else {
      console.warn("No user data in update response:", res.data);
    }

    return userData;
  } catch (err: any) {
    console.error('Update user profile error:', err);
    console.error('Error response status:', err.response?.status);
    console.error('Error response data:', err.response?.data);
    console.error('Error message:', err.message);
    throw err;
  }
};

export const logoutUser = async () => {
  await AsyncStorage.multiRemove(['userToken', 'userData']);
};

export const getAllJewelries = async () => {
  try {
    console.log("=== FETCHING ALL JEWELRIES ===");
    const res = await api.get('/jewellery');
    console.log("Jewelries fetched successfully:", res.data.length, "items");
    return res.data;
  } catch (err: any) {
    console.error('Get jewelries error:', err);
    console.error('Error response:', err.response?.data);
    throw err;
  }
};

export const changePassword = async (email: string, oldPassword: string, newPassword: string) => {
  try {
    console.log("=== CHANGING PASSWORD ===");
    console.log("Email:", email);
    
    const res = await api.post('/user/change-password', {
      email,
      oldPassword,
      newPassword
    });
    
    console.log("Password changed successfully:", res.data);
    return res.data;
  } catch (err: any) {
    console.error('Change password error:', err);
    console.error('Error response:', err.response?.data);
    throw err?.response?.data?.message || err?.message || 'Failed to change password';
  }
};