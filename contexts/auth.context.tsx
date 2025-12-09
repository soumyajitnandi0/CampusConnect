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
    // Clean up any old Supabase tokens on startup
    const cleanupOldTokens = async () => {
      try {
        const token = await storage.getItem('token');
        if (token) {
          const tokenParts = token.split('.');
          // If token doesn't have 3 parts, it's not a valid JWT
          // Clear it so user can re-authenticate
          if (tokenParts.length !== 3) {
            console.log('[Auth] Cleaning up invalid token format');
            await storage.removeItem('token');
          } else {
            // Decode to check if it's a Supabase token (has email but no user.id)
            try {
              const base64Url = tokenParts[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const payload = JSON.parse(atob(base64));
              // If it's a Supabase token (has email but no user.id), clear it
              if (payload.email && !payload.user?.id) {
                console.log('[Auth] Cleaning up old Supabase token - user needs to re-authenticate');
                await storage.multiRemove(['token', 'user']);
              }
            } catch (e) {
              // If we can't decode, it might be corrupted - clear it
              console.log('[Auth] Token decode failed, clearing token');
              await storage.removeItem('token');
            }
          }
        }
      } catch (error) {
        console.error('[Auth] Error during token cleanup:', error);
      }
    };

    cleanupOldTokens().then(() => {
      checkAuthState();
    });
    
    // Listen to Supabase auth changes (only for OAuth users)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        try {
          await syncUser(session.access_token);
        } catch (error: any) {
          // If sync fails with 400, user needs role selection
          // Don't clear user state - let login screen handle redirect
          if (error.response?.status === 400) {
            console.log('User needs role selection, will be handled by login flow');
            // Keep the token so user can select role
            return;
          }
          // For other errors, clear state
          console.error('Auth state change error:', error);
          setUser(null);
          await storage.multiRemove(['token', 'user']);
        }
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
        // Verify token is a JWT token (not Supabase token)
        // JWT tokens have 3 parts separated by dots
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.warn('[Auth] Invalid token format detected, clearing storage');
          await storage.multiRemove(['token', 'user', 'pushToken']);
          await sessionManager.clearSession();
          setUser(null);
          setLoading(false);
          return;
        }

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
      // Temporarily store the Supabase token so the interceptor can use it
      // This is needed because /auth/sync requires the Supabase token, not the JWT
      const currentToken = await storage.getItem('token');
      await storage.setItem('token', token);
      
      try {
        const response = await api.post('/auth/sync', {});

        // API client extracts data, so response is already the data object
        const { token: jwtToken, user: userData } = response;
        
        if (!userData) {
          throw new Error('User data not found in response');
        }
        
        // Store the JWT token returned from sync (replaces Supabase token)
        if (jwtToken) {
          // Verify it's a JWT token (3 parts separated by dots)
          const tokenParts = jwtToken.split('.');
          if (tokenParts.length !== 3) {
            console.error('[Auth] Invalid JWT token format returned from sync!');
            throw new Error('Invalid token format received from server');
          }
          
          // Clear any old token first
          await storage.removeItem('token');
          
          // Store the new JWT token
          await storage.setItem('token', jwtToken);
          console.log('[Auth] JWT token stored after sync, length:', jwtToken.length);
          
          // Verify token was stored correctly
          const storedToken = await storage.getItem('token');
          if (storedToken !== jwtToken) {
            console.error('[Auth] Token storage verification failed!');
            throw new Error('Token storage failed');
          }
          console.log('[Auth] Token storage verified successfully');
        } else {
          console.warn('[Auth] No JWT token returned from sync!');
          throw new Error('No token returned from sync');
        }
        
        setUser(userData);
        await storage.setItem('user', JSON.stringify(userData));
        // Update session timestamp on sync (user is still active)
        await sessionManager.saveLoginTimestamp();
      } finally {
        // Restore previous token if sync failed (though we'll store JWT on success)
        if (!currentToken) {
          // If there was no previous token, we'll keep whatever was set
        }
      }
    } catch (error: any) {
      // If 400 error, it means user needs to select role - this is expected behavior
      // The login screen will handle redirecting to role selection
      if (error.statusCode === 400 || (error as any).response?.status === 400) {
        const errorMsg = error.message || 'Role selection required';
        // Only log as info, not error, since this is expected for new users
        console.log('[Auth] User needs role selection:', errorMsg);
        // Don't throw - let the login flow handle it
        return;
      }
      
      // For other errors (network, 500, etc.), log as error
      console.error('Error syncing user:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', { email, password });
      
      // API client extracts data, so response is already the data object
      const { token, user: userData } = response;
      if (!token || !userData) {
        throw new Error('Invalid response from server');
      }
      await storage.setItem('token', token);
      await storage.setItem('user', JSON.stringify(userData));
      await sessionManager.saveLoginTimestamp(); // Save login timestamp for 30-day session
      setUser(userData); // Set user state immediately
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
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

      // API client extracts data, so response is already the data object
      const { token, user: userData } = response;
      await storage.setItem('token', token);
      await storage.setItem('user', JSON.stringify(userData));
      await sessionManager.saveLoginTimestamp(); // Save login timestamp
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.message || 'Signup failed');
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
        // API client automatically adds token via interceptor
        const response = await api.get('/users/me');
        // API client extracts data, so response is already the user object
        const updatedUser = response;
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

