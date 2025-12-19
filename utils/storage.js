/**
 * Centralized AsyncStorage utilities with error handling
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Safe wrapper for AsyncStorage.getItem with error handling
 */
export const getStorageItem = async (key, defaultValue = null) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    if (__DEV__) {
      console.error(`[Storage] Failed to get item "${key}":`, error);
    }
    return defaultValue;
  }
};

/**
 * Safe wrapper for AsyncStorage.setItem with error handling
 */
export const setStorageItem = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    if (__DEV__) {
      console.error(`[Storage] Failed to set item "${key}":`, error);
    }
    return false;
  }
};

/**
 * Safe wrapper for AsyncStorage.removeItem with error handling
 */
export const removeStorageItem = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    if (__DEV__) {
      console.error(`[Storage] Failed to remove item "${key}":`, error);
    }
    return false;
  }
};

/**
 * Batch get multiple storage items
 */
export const getMultipleStorageItems = async (keys) => {
  try {
    const values = await AsyncStorage.multiGet(keys);
    return values.reduce((acc, [key, value]) => {
      acc[key] = value ? JSON.parse(value) : null;
      return acc;
    }, {});
  } catch (error) {
    if (__DEV__) {
      console.error("[Storage] Failed to get multiple items:", error);
    }
    return {};
  }
};

/**
 * Batch set multiple storage items
 */
export const setMultipleStorageItems = async (items) => {
  try {
    const serialized = Object.entries(items).map(([key, value]) => [
      key,
      JSON.stringify(value),
    ]);
    await AsyncStorage.multiSet(serialized);
    return true;
  } catch (error) {
    if (__DEV__) {
      console.error("[Storage] Failed to set multiple items:", error);
    }
    return false;
  }
};

/**
 * Clear all storage (for development/testing)
 */
export const clearAllStorage = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    if (__DEV__) {
      console.error("[Storage] Failed to clear storage:", error);
    }
    return false;
  }
};























