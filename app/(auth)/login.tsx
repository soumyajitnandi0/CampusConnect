import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { GlassInput } from '../../components/ui/GlassInput';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useAuth } from '../../contexts/auth.context';
import api from '../../services/api';
import { supabase } from '../../services/supabase';
import { sessionManager, storage } from "../../utils/storage";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
    const router = useRouter();
    const { signIn: contextSignIn, refreshAuthState } = useAuth();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [useGoogleAuth, setUseGoogleAuth] = useState(false);

    const handleOAuthSession = async (accessToken: string, refreshToken: string) => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            });

            if (sessionError) throw sessionError;

            if (session) {
                await storage.setItem('token', session.access_token);
                await sessionManager.saveLoginTimestamp(); // Save login timestamp

                // Check if user exists and has a role
                try {
                    // Temporarily store the Supabase token so the interceptor can use it
                    await storage.setItem('token', session.access_token);
                    
                    // First, try to sync without role to check if user exists
                    // If user exists with a role, we'll get the user back
                    // If user doesn't exist or has no role, we'll get a 400 error
                    const res = await api.post('/auth/sync', {});

                    // API client extracts data, so res is already the data object
                    const { token: jwtToken, user } = res;

                    // If user exists and has a role, proceed to dashboard
                    if (user && user.role) {
                        // Store the JWT token returned from sync (replaces Supabase token)
                        if (jwtToken) {
                            await storage.setItem('token', jwtToken);
                            console.log('[Login] JWT token stored after sync, length:', jwtToken.length);
                            // Verify token was stored
                            const storedToken = await storage.getItem('token');
                            console.log('[Login] Verified stored token matches:', storedToken === jwtToken);
                        } else {
                            console.warn('[Login] No JWT token returned from sync!');
                        }
                        await storage.setItem('user', JSON.stringify(user));
                        await sessionManager.saveLoginTimestamp(); // Update session timestamp

                        // Refresh auth state to ensure user is loaded in context
                        await refreshAuthState();

                        if (user.role === 'organizer') {
                            router.replace('/(organizer)');
                        } else {
                            router.replace('/(student)');
                        }
                        setUseGoogleAuth(false);
                        return;
                    }

                    // If user doesn't have a role, redirect to role selection
                    router.push({
                        pathname: '/(auth)/select-role',
                        params: { token: session.access_token }
                    });
                    setUseGoogleAuth(false);
                    return;
                } catch (syncError: any) {
                    // If sync fails with 400, it means user needs to select role (new user or user without role)
                    if (syncError.response?.status === 400) {
                        const errorMsg = syncError.response?.data?.msg || '';
                        
                        // If user exists with a role but there's a mismatch, show error
                        if (errorMsg.includes('already registered as')) {
                            Alert.alert(
                                'Account Already Exists',
                                errorMsg,
                                [{ text: 'OK' }]
                            );
                            setUseGoogleAuth(false);
                            return;
                        }
                        
                        // Otherwise, redirect to role selection (new user or user without role)
                        // This is expected behavior for new users
                        console.log('New user detected, redirecting to role selection');
                        router.push({
                            pathname: '/(auth)/select-role',
                            params: { token: session.access_token }
                        });
                        setUseGoogleAuth(false);
                        return;
                    }

                    // Log other errors
                    console.error('Sync error:', syncError);

                    // If 401, token might be invalid - try to get fresh session
                    if (syncError.response?.status === 401) {
                        // Get fresh session
                        const { data: { session: freshSession }, error: freshError } = await supabase.auth.getSession();

                        if (!freshError && freshSession) {
                            // Retry with fresh token
                            try {
                                // Temporarily store the fresh Supabase token
                                await storage.setItem('token', freshSession.access_token);
                                
                                const retryRes = await api.post('/auth/sync', {});

                                // API client extracts data, so retryRes is already the data object
                                const { token: retryJwtToken, user: retryUser } = retryRes;

                                if (retryUser && retryUser.role) {
                                    // Store the JWT token returned from sync (replaces Supabase token)
                                    if (retryJwtToken) {
                                        await storage.setItem('token', retryJwtToken);
                                    }
                                    await storage.setItem('user', JSON.stringify(retryUser));
                                    await sessionManager.saveLoginTimestamp();
                                    await refreshAuthState(); // Refresh auth state

                                    if (retryUser.role === 'organizer') {
                                        router.replace('/(organizer)');
                                    } else {
                                        router.replace('/(student)');
                                    }
                                    setUseGoogleAuth(false);
                                    return;
                                } else {
                                    // No role, redirect to role selection
                                    router.push({
                                        pathname: '/(auth)/select-role',
                                        params: { token: freshSession.access_token }
                                    });
                                    setUseGoogleAuth(false);
                                    return;
                                }
                            } catch (retryError) {
                                // Retry failed, show error
                                console.error('Google login retry failed:', retryError);
                            }
                        }
                    }

                    // Other errors - show message and clear state
                    const errorMsg = syncError.response?.data?.msg ||
                        (syncError.response?.status === 401
                            ? 'Authentication failed. Please try logging in again.'
                            : 'Failed to authenticate. Please try again.');

                    Alert.alert('Authentication Error', errorMsg);
                    setUseGoogleAuth(false);

                    // Clear potentially invalid tokens
                    await storage.removeItem('token');
                    return;
                }
            } else {
                setUseGoogleAuth(false);
                Alert.alert('Error', 'Failed to create session. Please try again.');
            }
        } catch (err: any) {
            setUseGoogleAuth(false);
            console.error('OAuth session error:', err);
            Alert.alert('Error', 'Failed to process authentication. Please try again.');
        }
    };

    // Handle OAuth callback on web when returning from Google authentication
    useEffect(() => {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const handleOAuthCallback = async () => {
                // Check if URL contains OAuth tokens in hash
                const hash = window.location.hash;
                if (hash && hash.includes('access_token')) {
                    try {
                        setUseGoogleAuth(true);
                        const params = new URLSearchParams(hash.substring(1));
                        const accessToken = params.get('access_token');
                        const refreshToken = params.get('refresh_token');

                        if (accessToken && refreshToken) {
                            // Clear the hash from URL
                            window.history.replaceState(null, '', window.location.pathname);
                            
                            await handleOAuthSession(accessToken, refreshToken);
                        }
                    } catch (err: any) {
                        console.error('OAuth callback error:', err);
                        setUseGoogleAuth(false);
                        Alert.alert('Authentication Error', 'Failed to complete authentication. Please try again.');
                    }
                }
            };

            handleOAuthCallback();
        }
    }, []);

    const handleEmailLogin = async () => {
        try {
            if (!email || !password) {
                Alert.alert('Error', 'Please enter email and password');
                return;
            }

            setLoading(true);

            // Use auth context signIn to properly update state
            await contextSignIn(email, password);

            // Refresh auth state to ensure user is loaded in context
            await refreshAuthState();

            setLoading(false);

            // Get user from storage to check role (contextSignIn already saved it)
            const userStr = await storage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);

                // Validate user has a role before routing
                if (!user.role) {
                    Alert.alert('Error', 'Your account is missing role information. Please contact support.');
                    return;
                }

                // Route based on role
                if (user.role === 'organizer') {
                    router.replace('/(organizer)');
                } else {
                    router.replace('/(student)');
                }
            }
        } catch (err: any) {
            setLoading(false);
            const errorMsg = err.response?.data?.msg || err.message || 'Invalid credentials';
            Alert.alert('Login Failed', errorMsg);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setUseGoogleAuth(true);
            
            // For web, use window location for redirect. For mobile, use deep link
            let redirectUrl: string;
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                // Use the login page URL as redirect (works with SPA routing)
                redirectUrl = `${window.location.origin}/login`;
                console.log('Web redirect URL:', redirectUrl);
            } else {
                redirectUrl = Linking.createURL('/login');
            }

            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                // For web, use standard browser redirect flow
                console.log('Initiating OAuth for web with redirect:', redirectUrl);
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: redirectUrl,
                        skipBrowserRedirect: true, // We'll manually redirect on web
                        queryParams: {
                            // Force web redirect format
                            access_type: 'offline',
                            prompt: 'consent',
                        },
                    },
                });

                if (error) {
                    setUseGoogleAuth(false);
                    console.error('OAuth error:', error);
                    throw error;
                }
                
                // Manually redirect to OAuth URL on web
                if (data?.url) {
                    console.log('OAuth URL from Supabase:', data.url);
                    
                    // Check if URL contains exp:// deep link (shouldn't happen on web, but handle it)
                    if (data.url.includes('exp://')) {
                        console.warn('Supabase returned Expo deep link on web, this should not happen');
                        // Try to extract the actual OAuth URL from the deep link
                        // Or use the redirect URL directly to construct the OAuth URL
                        setUseGoogleAuth(false);
                        Alert.alert('Error', 'OAuth configuration issue. Please check Supabase redirect URL settings.');
                        return;
                    }
                    
                    // Redirect to OAuth URL
                    window.location.href = data.url;
                } else {
                    setUseGoogleAuth(false);
                    console.error('No OAuth URL returned');
                    Alert.alert('Error', 'Failed to initiate Google Sign-In. Please try again.');
                }
                return;
            } else {
                // For mobile, use WebBrowser flow
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: redirectUrl,
                        skipBrowserRedirect: true,
                    },
                });

                if (error) throw error;

                if (data?.url) {
                    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

                    if (result.type === 'success' && result.url) {
                        const params = new URLSearchParams(result.url.split('#')[1]);
                        const accessToken = params.get('access_token');
                        const refreshToken = params.get('refresh_token');

                        if (accessToken && refreshToken) {
                            await handleOAuthSession(accessToken, refreshToken);
                        } else {
                            setUseGoogleAuth(false);
                            Alert.alert('Error', 'Invalid authentication response. Please try again.');
                        }
                    } else {
                        setUseGoogleAuth(false);
                        // User cancelled or error occurred
                        if (result.type === 'cancel') {
                            // User cancelled, don't show error
                        } else {
                            Alert.alert('Error', 'Authentication was cancelled or failed. Please try again.');
                        }
                    }
                } else {
                    setUseGoogleAuth(false);
                    Alert.alert('Error', 'Failed to initiate Google Sign-In. Please try again.');
                }
            }
        } catch (err: any) {
            setUseGoogleAuth(false);
            console.error('Google login error:', err);
            Alert.alert('Login Failed', err.message || 'Something went wrong. Please try again.');
        }
    };

    return (
        <ScreenWrapper>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="flex-1 justify-center p-6">
                        {/* Logo/Header Section */}
                        <View className="items-center mb-12">
                            <GlassContainer className="w-24 h-24 items-center justify-center mb-6 rounded-full" intensity={30}>
                                <FontAwesome name="graduation-cap" size={40} color="#FFFFFF" />
                            </GlassContainer>
                            <Text className="text-4xl font-bold text-white mb-2 tracking-tight">Welcome Back</Text>
                            <Text className="text-gray-400 text-base tracking-wide">Sign in to continue your journey</Text>
                        </View>

                        <GlassContainer className="p-6">
                            {/* Email/Password Login Form */}
                            <View className="space-y-4">
                                <GlassInput
                                    label="Email Address"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                />

                                <GlassInput
                                    label="Password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    autoComplete="password"
                                />

                                {/* Sign In Button */}
                                <GlassButton
                                    title="Sign In"
                                    onPress={handleEmailLogin}
                                    loading={loading}
                                    className="mt-4"
                                />
                            </View>

                            {/* Divider */}
                            <View className="flex-row items-center my-6">
                                <View className="flex-1 h-px bg-glass-border" />
                                <Text className="mx-4 text-gray-500 text-sm font-medium">OR</Text>
                                <View className="flex-1 h-px bg-glass-border" />
                            </View>

                            {/* Google Sign Up Button */}
                            <GlassButton
                                title="Continue with Google"
                                onPress={handleGoogleLogin}
                                disabled={useGoogleAuth}
                                variant="secondary"
                                loading={useGoogleAuth}
                                icon="google-plus"
                            />

                            {/* Signup Link */}
                            <View className="flex-row justify-center items-center mt-6">
                                <Text className="text-gray-400 text-sm">Don't have an account? </Text>
                                <Text
                                    className="text-white font-bold text-sm underline"
                                    onPress={() => router.push('/signup')}
                                >
                                    Sign Up
                                </Text>
                            </View>
                        </GlassContainer>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}
