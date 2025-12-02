import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { supabase } from '../services/supabase';
import { User } from '../types/models';
import { sessionManager, storage } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: 'student' | 'organizer', rollNo?: string, yearSection?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isOrganizer: boolean;
  refreshUser: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
    
    // Listen to Supabase auth changes (only for OAuth users)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await syncUser(session.access_token);
      } else if (event === 'SIGNED_OUT') {
        // Only clear on explicit sign out, not on initial load
        setUser(null);
        await storage.multiRemove(['token', 'user']);
        await sessionManager.clearSession();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await storage.getItem('token');
      const userStr = await storage.getItem('user');

      if (token && userStr) {
        // Check if session timestamp exists, if not create one (for existing logins)
        const isValid = await sessionManager.isSessionValid();
        
        if (!isValid) {
          // Check if there's no timestamp at all (old login before session tracking)
          const timestampStr = await storage.getItem('session_timestamp');
          if (!timestampStr) {
            // Old login without timestamp, create one now
            console.log('Creating session timestamp for existing login');
            await sessionManager.saveLoginTimestamp();
            const userData = JSON.parse(userStr);
            setUser(userData);
            setLoading(false);
            return;
          }
          
          // Session expired (30 days passed), clear everything
          console.log('Session expired (30 days), logging out');
          await storage.multiRemove(['token', 'user', 'pushToken']);
          await sessionManager.clearSession();
          setUser(null);
          setLoading(false);
          return;
        }

        // Session is valid, restore user
        const userData = JSON.parse(userStr);
        setUser(userData);
      } else {
        // No stored credentials
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const syncUser = async (token: string): Promise<void> => {
    try {
      const response = await api.post('/auth/sync', {}, {
        headers: { 'x-auth-token': token },
      });

      const userData = response.data.user;
      setUser(userData);
      await storage.setItem('user', JSON.stringify(userData));
      // Update session timestamp on sync (user is still active)
      await sessionManager.saveLoginTimestamp();
    } catch (error: any) {
      console.error('Error syncing user:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', { email, password });
      
      const { token, user: userData } = response.data;
      await storage.setItem('token', token);
      await storage.setItem('user', JSON.stringify(userData));
      await sessionManager.saveLoginTimestamp(); // Save login timestamp for 30-day session
      setUser(userData); // Set user state immediately
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: 'student' | 'organizer',
    rollNo?: string,
    yearSection?: string
  ): Promise<void> => {
    try {
      setLoading(true);
      const response = await api.post('/auth/signup', {
        email,
        password,
        name,
        role,
        ...(role === 'student' && { rollNo, yearSection }),
      });

      const { token, user: userData } = response.data;
      await storage.setItem('token', token);
      await storage.setItem('user', JSON.stringify(userData));
      await sessionManager.saveLoginTimestamp(); // Save login timestamp
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.msg || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      await storage.multiRemove(['token', 'user', 'pushToken']);
      await sessionManager.clearSession(); // Clear session timestamp
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      // Still clear local state
      await storage.multiRemove(['token', 'user', 'pushToken']);
      await sessionManager.clearSession(); // Clear session timestamp
      setUser(null);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const token = await storage.getItem('token');
      if (!token) return;

      const userStr = await storage.getItem('user');
      if (!userStr) return;

      const userData = JSON.parse(userStr);
      
      // Optionally refresh from backend
      try {
        const response = await api.get('/users/me', {
          headers: { 'x-auth-token': token },
        });
        const updatedUser = response.data;
        setUser(updatedUser);
        await storage.setItem('user', JSON.stringify(updatedUser));
      } catch (error) {
        // Use cached user if refresh fails
        setUser(userData);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const refreshAuthState = async (): Promise<void> => {
    // Re-check auth state from storage
    await checkAuthState();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        isOrganizer: user?.role === 'organizer',
        refreshUser,
        refreshAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

