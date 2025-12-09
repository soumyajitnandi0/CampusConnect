import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform } from 'react-native';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { storage } from '../utils/storage';

export default function Index() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Handle OAuth callback on web first (before auth check)
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                // OAuth callback detected - redirect to login page to handle it
                // Use router to navigate to login with hash preserved
                const loginPath = '/login' + hash;
                router.replace(loginPath as any);
                return;
            }
        }
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Check for stored token and user
            const token = await storage.getItem('token');
            const userStr = await storage.getItem('user');

            if (token && userStr) {
                try {
                    const user = JSON.parse(userStr);

                    // Check if session is still valid (30 days)
                    const { sessionManager } = await import('../utils/storage');
                    const isValid = await sessionManager.isSessionValid();

                    if (!isValid) {
                        // Check if there's no timestamp at all (old login before session tracking)
                        const timestampStr = await storage.getItem('session_timestamp');
                        if (!timestampStr) {
                            // Old login without timestamp, create one now and allow access
                            console.log('Creating session timestamp for existing login');
                            await sessionManager.saveLoginTimestamp();
                        } else {
                            // Session expired, clear and go to login
                            console.log('Session expired, redirecting to login');
                            await storage.multiRemove(['token', 'user']);
                            await sessionManager.clearSession();
                            router.replace('/(auth)/login');
                            setLoading(false);
                            return;
                        }
                    }

                    // Session is valid and user has role, route accordingly
                    if (user && user.role) {
                        if (user.role === 'organizer') {
                            router.replace('/(organizer)');
                        } else {
                            router.replace('/(student)');
                        }
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    // Token might be invalid, clear storage and go to login
                    console.error('Auth check error:', err);
                    await storage.multiRemove(['token', 'user']);
                }
            }

            // No valid auth, go to login
            router.replace('/(auth)/login');
            setLoading(false);
        } catch (err) {
            console.error('Auth check error:', err);
            // Clear any corrupted data
            try {
                await storage.multiRemove(['token', 'user']);
            } catch (clearErr) {
                console.error('Error clearing storage:', clearErr);
            }
            router.replace('/(auth)/login');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <ActivityIndicator size="large" color="#FFFFFF" />
            </ScreenWrapper>
        );
    }

    return null;
}

