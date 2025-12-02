import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// Use environment variables if available, otherwise fallback to defaults
// Set these in your .env file or Expo environment:
// EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
// EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://cuzzxgjdxwlswhuzhwgg.supabase.co";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1enp4Z2pkeHdsc3dodXpod2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTc0NDcsImV4cCI6MjA3OTU3MzQ0N30.VlSuDu0sZDXg6Q6-stgUPq3f_vZ86jeH-sY0_ijSSXQ";

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
