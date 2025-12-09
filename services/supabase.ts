import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// Get Supabase credentials from environment variables
// In production, these MUST be set via Render environment variables
// Set these in your .env file or Expo environment:
// EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
// EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

// Development fallbacks (only for local development)
const DEV_SUPABASE_URL = __DEV__ ? "https://cuzzxgjdxwlswhuzhwgg.supabase.co" : undefined;
const DEV_SUPABASE_KEY = __DEV__ ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1enp4Z2pkeHdsc3dodXpod2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTc0NDcsImV4cCI6MjA3OTU3MzQ0N30.VlSuDu0sZDXg6Q6-stgUPq3f_vZ86jeH-sY0_ijSSXQ" : undefined;

const finalSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || DEV_SUPABASE_URL;
const finalSupabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEV_SUPABASE_KEY;

if (!finalSupabaseUrl || !finalSupabaseKey) {
    if (__DEV__) {
        console.warn('⚠️ Supabase credentials not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
    } else {
        throw new Error('Missing required Supabase credentials. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    }
}

// Create a web-compatible storage adapter
const getStorage = () => {
    if (Platform.OS === 'web') {
        // For web, use localStorage directly
        return {
            getItem: async (key: string) => {
                if (typeof window !== 'undefined') {
                    return window.localStorage.getItem(key);
                }
                return null;
            },
            setItem: async (key: string, value: string) => {
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, value);
                }
            },
            removeItem: async (key: string) => {
                if (typeof window !== 'undefined') {
                    window.localStorage.removeItem(key);
                }
            },
        };
    }
    return AsyncStorage;
};

export const supabase = createClient(finalSupabaseUrl!, finalSupabaseKey!, {
    auth: {
        storage: getStorage(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
    },
});

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated. This should only be registered once.
if (Platform.OS !== 'web' && AppState.addEventListener) {
    AppState.addEventListener('change', (state) => {
        if (state === 'active') {
            supabase.auth.startAutoRefresh();
        } else {
            supabase.auth.stopAutoRefresh();
        }
    });
}
