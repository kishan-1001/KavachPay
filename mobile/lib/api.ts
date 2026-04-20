import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change this to your machine's local IP when testing on a physical device
// e.g., '192.168.1.X:5000' — localhost won't work on Android emulators
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:5000';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('kavach_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token helpers
export const saveToken  = (t: string) => SecureStore.setItemAsync('kavach_token', t);
export const getToken   = ()          => SecureStore.getItemAsync('kavach_token');
export const clearToken = ()          => SecureStore.deleteItemAsync('kavach_token');

export default api;
