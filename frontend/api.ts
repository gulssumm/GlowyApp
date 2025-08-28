import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL =
  Constants.expoConfig?.extra?.API_URL ??
  Constants.manifest2?.extra?.expoClient?.extra?.API_URL ??
  'http://192.168.1.130:5000/api';

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

// ===== CART FUNCTIONS =====

export const getCart = async () => {
  try {
    console.log("=== GETTING CART ===");
    const res = await api.get('/cart');
    console.log("Cart fetched successfully:", res.data);
    return res.data;
  } catch (err: any) {
    console.error('Get cart error:', err);
    console.error('Error response:', err.response?.data);
    throw err;
  }
};

export const addToCart = async (jewelleryId: number, quantity: number = 1) => {
  try {
    console.log(`=== ADDING TO CART ===`);
    console.log(`Jewellery ID: ${jewelleryId}, Quantity: ${quantity}`);
    
    const res = await api.post('/cart/add', {
      jewelleryId,
      quantity
    });
    
    console.log("Added to cart successfully:", res.data);
    return res.data;
  } catch (err: any) {
    console.error('Add to cart error:', err);
    console.error('Error response:', err.response?.data);
    throw err;
  }
};

export const updateCartItem = async (itemId: number, quantity: number) => {
  try {
    console.log(`=== UPDATING CART ITEM ===`);
    console.log(`Item ID: ${itemId}, New Quantity: ${quantity}`);
    
    const res = await api.put(`/cart/update/${itemId}`, { quantity });
    console.log("Cart item updated successfully:", res.data);
    return res.data;
  } catch (err: any) {
    console.error('Update cart item error:', err);
    console.error('Error response:', err.response?.data);
    throw err;
  }
};

export const removeFromCart = async (itemId: number) => {
  try {
    console.log(`=== REMOVING FROM CART ===`);
    console.log(`Item ID: ${itemId}`);
    
    const res = await api.delete(`/cart/${itemId}`);
    console.log("Removed from cart successfully:", res.data);
    return res.data;
  } catch (err: any) {
    console.error('Remove from cart error:', err);
    console.error('Error response:', err.response?.data);
    throw err;
  }
};

export const clearCart = async () => {
  try {
    console.log("=== CLEARING CART ===");
    const res = await api.delete('/cart/clear');
    console.log("Cart cleared successfully:", res.data);
    return res.data;
  } catch (err: any) {
    console.error('Clear cart error:', err);
    console.error('Error response:', err.response?.data);
    throw err;
  }
};

// ===== ADDRESS FUNCTIONS =====

export const getUserAddresses = async () => {
  try {
    console.log("=== GETTING USER ADDRESSES ===");
    const res = await api.get('/address');
    console.log("Addresses fetched successfully:", res.data);
    return res.data;
  } catch (err: any) {
    console.error('Get addresses error:', err);
    console.error('Error response:', err.response?.data);
    throw err;
  }
};

export const createAddress = async (addressData: {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}) => {
  try {
    console.log("=== CREATING ADDRESS ===");
    console.log("Address data:", addressData);
    
    const res = await api.post('/address', {
      street: addressData.street,
      city: addressData.city,
      state: addressData.state,
      postalCode: addressData.postalCode,
      country: addressData.country,
      isDefault: addressData.isDefault || false
    });
    
    console.log("Address created successfully:", res.data);
    return res.data;
  } catch (err: any) {
    console.error('Create address error:', err);
    console.error('Error response:', err.response?.data);
    throw err;
  }
};

export const updateAddress = async (addressId: number, addressData: {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}) => {
  try {
    console.log("=== UPDATING ADDRESS ===");
    console.log("Address ID:", addressId);
    console.log("Address data:", addressData);
    
    const res = await api.put(`/address/${addressId}`, {
      street: addressData.street,
      city: addressData.city,
      state: addressData.state,
      postalCode: addressData.postalCode,
      country: addressData.country,
      isDefault: addressData.isDefault || false
    });
    
    console.log("Address updated successfully:", res.data);
    return res.data;
  } catch (err: any) {
    console.error('Update address error:', err);
    console.error('Error response:', err.response?.data);
    throw err;
  }
};

export const deleteAddress = async (addressId: number) => {
  try {
    console.log("=== DELETING ADDRESS ===");
    console.log("Address ID:", addressId);
    
    const res = await api.delete(`/address/${addressId}`);
    console.log("Address deleted successfully:", res.data);
    return res.data;
  } catch (err: any) {
    console.error('Delete address error:', err);
    console.error('Error response:', err.response?.data);
    throw err;
  }
};

// ===== ORDER FUNCTIONS =====

export const createOrder = async (orderData: {
  addressId: number;
  paymentMethod: string;
}) => {
  try {
    console.log("=== CREATING ORDER ===");
    console.log("Order data:", orderData);
    
    const res = await api.post('/order/create', {
      addressId: orderData.addressId,
      paymentMethod: orderData.paymentMethod
    });
    
    console.log("Order created successfully:", res.data);
    return res.data;
  } catch (err: any) {
    console.error('Create order error:', err);
    console.error('Error response:', err.response?.data);
    throw err;
  }
};

export const getUserOrders = async () => {
  try {
    console.log("=== GETTING USER ORDERS ===");
    const res = await api.get('/order');
    console.log("Orders fetched successfully:", res.data);
    return res.data;
  } catch (err: any) {
    console.error('Get orders error:', err);
    console.error('Error response:', err.response?.data);
    throw err;
  }
};

export const getOrderById = async (orderId: number) => {
  try {
    console.log(`=== GETTING ORDER ${orderId} ===`);
    const res = await api.get(`/order/${orderId}`);
    console.log("Order fetched successfully:", res.data);
    return res.data;
  } catch (err: any) {
    console.error('Get order error:', err);
    console.error('Error response:', err.response?.data);
    throw err;
  }
};