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
// Priority: 1. app.json extra, 2. process.env (build-time), 3. window.__ENV__ (runtime), 4. fallback
const getEnvVar = (key: string, fallback: string): string => {
  // Check app.json extra first (injected at build time)
  if (Constants.expoConfig?.extra?.[key]) {
    return Constants.expoConfig.extra[key];
  }
  
  // Check process.env (available during build)
  if (process.env[key]) {
    return process.env[key];
  }
  
  // Check window.__ENV__ for runtime injection (web only)
  if (typeof window !== 'undefined' && (window as any).__ENV__?.[key]) {
    return (window as any).__ENV__[key];
  }
  
  return fallback;
};

// Determine API base URL
const getApiBaseURL = (): string => {
  // Check for environment variable first (for production)
  // Try multiple sources to ensure we get the value
  const envApiUrl = 
    Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    (typeof window !== 'undefined' && (window as any).__ENV__?.EXPO_PUBLIC_API_URL) ||
    '';
  
  // If we have a valid URL from environment, use it
  if (envApiUrl && envApiUrl.startsWith('http')) {
    return envApiUrl;
  }
  
  if (__DEV__) {
    // Development: use localhost for web, local IP for mobile
    // Note: Mobile IP should be configured per developer's network
    return Platform.OS === 'web' 
      ? 'http://localhost:5000/api'
      : 'http://10.20.21.152:5000/api';
  }
  
  // Production: throw error if no API URL is configured
  if (!envApiUrl) {
    console.error('❌ EXPO_PUBLIC_API_URL is not set! Please configure it in Render environment variables.');
    // Return a placeholder that will fail clearly
    return 'https://API_URL_NOT_CONFIGURED.onrender.com/api';
  }
  
  return envApiUrl;
};

export const config: Config = {
  api: {
    baseURL: getApiBaseURL(),
    timeout: 30000, // 30 seconds
  },
  supabase: {
    url: getEnvVar('EXPO_PUBLIC_SUPABASE_URL', __DEV__ ? 'https://cuzzxgjdxwlswhuzhwgg.supabase.co' : ''),
    anonKey: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY', __DEV__ ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1enp4Z2pkeHdsc3dodXpod2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTc0NDcsImV4cCI6MjA3OTU3MzQ0N30.VlSuDu0sZDXg6Q6-stgUPq3f_vZ86jeH-sY0_ijSSXQ' : ''),
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


