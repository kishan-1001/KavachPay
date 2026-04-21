import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ─── Backend URL Configuration ────────────────────────────────────────────────
//
//  Priority:
//   1. EXPO_PUBLIC_API_URL env var  → set in .env.local for production/staging
//   2. Android emulator             → 10.0.2.2 maps to host machine's localhost
//   3. Physical device / iOS sim    → set your machine's LAN IP here
//
//  Your machine's LAN IP (WiFi): 10.65.5.128
//  Backend port: 5000
//
const PHYSICAL_DEVICE_URL = 'http://10.65.5.128:5000'; // change if IP changes
const EMULATOR_URL        = 'http://10.0.2.2:5000';    // Android emulator only

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? EMULATOR_URL : PHYSICAL_DEVICE_URL);

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
