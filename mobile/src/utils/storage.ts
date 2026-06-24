import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const AUTH_KEY = 'engine_auth_user';

// Store authentication token securely
export const storeAuthToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(AUTH_KEY, token);
};

// Retrieve authentication token securely
export const getAuthToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(AUTH_KEY);
};

// Remove authentication token
export const removeAuthToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(AUTH_KEY);
};

// Store user data (non-sensitive) in regular AsyncStorage
export const storeUserData = async (key: string, value: any): Promise<void> => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

// Get user data from AsyncStorage
export const getUserData = async (key: string): Promise<any | null> => {
  const value = await AsyncStorage.getItem(key);
  return value ? JSON.parse(value) : null;
};

// Clear all app data (useful for logout)
export const clearAllData = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(AUTH_KEY);
  await AsyncStorage.clear();
};