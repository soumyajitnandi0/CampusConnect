import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Web-compatible storage utility
// On web, AsyncStorage uses localStorage under the hood
// This wrapper ensures it works properly in all environments

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        // Server-side rendering - return null
        return null;
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        // Server-side rendering - skip
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        // Server-side rendering - skip
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  },

  async multiRemove(keys: string[]): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        // Server-side rendering - skip
        return;
      }
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Storage multiRemove error:', error);
    }
  },
};

// Session management with 30-day expiration
const SESSION_KEY = 'session_timestamp';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export const sessionManager = {
  /**
   * Save login timestamp when user logs in
   */
  async saveLoginTimestamp(): Promise<void> {
    await storage.setItem(SESSION_KEY, Date.now().toString());
  },

  /**
   * Check if session is still valid (within 30 days)
   */
  async isSessionValid(): Promise<boolean> {
    try {
      const timestampStr = await storage.getItem(SESSION_KEY);
      if (!timestampStr) return false;

      const loginTimestamp = parseInt(timestampStr, 10);
      const now = Date.now();
      const age = now - loginTimestamp;

      // Session is valid if less than 30 days old
      return age < SESSION_DURATION;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  },

  /**
   * Clear session (on logout)
   */
  async clearSession(): Promise<void> {
    await storage.removeItem(SESSION_KEY);
  },

  /**
   * Get days remaining in session
   */
  async getDaysRemaining(): Promise<number> {
    try {
      const timestampStr = await storage.getItem(SESSION_KEY);
      if (!timestampStr) return 0;

      const loginTimestamp = parseInt(timestampStr, 10);
      const now = Date.now();
      const age = now - loginTimestamp;
      const remaining = SESSION_DURATION - age;

      return Math.max(0, Math.floor(remaining / (24 * 60 * 60 * 1000)));
    } catch (error) {
      return 0;
    }
  },
};

