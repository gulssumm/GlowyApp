import axios from "axios";
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiBase = () => {
  // For iOS Simulator and Android Emulator
  if (__DEV__ && (Platform.OS === 'ios' || Platform.OS === 'android')) {
    // Check if running on simulator/emulator
    if (Constants.isDevice === false) {
      return "http://localhost:5000/api";
    }
  }
  
  // For physical devices
  return "http://172.16.1.20:5000/api";
};

const API_BASE = getApiBase();

export const loginUser = async (username:string, email: string, password: string) => {
  try {
    const res = await axios.post(`${API_BASE}/user/login`, {
      username,
      password,
      email
    });
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

export const registerUser = async (username: string, email: string, password: string) => {
  try {
    const res = await axios.post(`${API_BASE}/user/register`, {
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

export const changePassword = async (email: string, oldPassword: string, newPassword: string) => {
  try {
    const res = await axios.post(`${API_BASE}/user/change-password`, {
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
