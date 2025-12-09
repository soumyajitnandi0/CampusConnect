import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Application Configuration
 * Centralized configuration management for the frontend
 */

interface Config {
  api: {
    baseURL: string;
    timeout: number;
  };
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    name: string;
    version: string;
    environment: 'development' | 'production' | 'staging';
  };
  cache: {
    eventsCacheDuration: number; // milliseconds
    defaultCacheDuration: number; // milliseconds
  };
}

// Get environment variables
const getEnvVar = (key: string, fallback: string): string => {
  return Constants.expoConfig?.extra?.[key] || 
         process.env[key] || 
         fallback;
};

// Determine API base URL
const getApiBaseURL = (): string => {
  if (__DEV__) {
    // Development: use localhost for web, local IP for mobile
    return Platform.OS === 'web' 
      ? 'http://localhost:5000/api'
      : 'http://10.20.21.152:5000/api';
  }
  
  // Production: use environment variable or fallback
  return getEnvVar('EXPO_PUBLIC_API_URL', 'https://api.campusconnect.com/api');
};

export const config: Config = {
  api: {
    baseURL: getApiBaseURL(),
    timeout: 30000, // 30 seconds
  },
  supabase: {
    url: getEnvVar('EXPO_PUBLIC_SUPABASE_URL', 'https://cuzzxgjdxwlswhuzhwgg.supabase.co'),
    anonKey: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1enp4Z2pkeHdsc3dodXpod2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTc0NDcsImV4cCI6MjA3OTU3MzQ0N30.VlSuDu0sZDXg6Q6-stgUPq3f_vZ86jeH-sY0_ijSSXQ'),
  },
  app: {
    name: 'Campus Connect',
    version: '1.0.0',
    environment: __DEV__ ? 'development' : 'production',
  },
  cache: {
    eventsCacheDuration: 5 * 60 * 1000, // 5 minutes
    defaultCacheDuration: 10 * 60 * 1000, // 10 minutes
  },
};

export default config;


