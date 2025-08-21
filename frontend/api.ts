import axios from "axios";
import { Alert } from "react-native";

const API_BASE = "http://192.168.1.130:5000/api"; 

export const loginUser = async (username:string, email: string, password: string) => {
  try {
    const res = await axios.post(`${API_BASE}/user/login`, {
      username,
      password,
      email
    });
    return res.data; // Returns user object or later JWT
  } catch (err: any) {
    // throw err.response?.data || "Login failed";
    console.error("Login error:", err.response?.data || err.message);
    Alert.alert("Error", JSON.stringify(err.response?.data || err.message));
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
  } catch (err: any) {
    throw err.response?.data || "Registration failed";
  }
};
