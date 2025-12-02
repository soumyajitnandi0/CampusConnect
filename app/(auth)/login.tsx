import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
            const redirectUrl = Linking.createURL('/login');

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
                                const res = await api.post('/auth/sync', {}, {
                                    headers: { 'x-auth-token': session.access_token }
                                });

                                const user = res.data.user;

                                // If user doesn't have a role, redirect to role selection
                                if (!user || !user.role) {
                                    router.push({
                                        pathname: '/(auth)/select-role',
                                        params: { token: session.access_token }
                                    });
                                    setUseGoogleAuth(false);
                                    return;
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
                            } catch (syncError: any) {
                                console.error('Sync error:', syncError);
                                
                                // If sync fails with 400, user needs to select role
                                if (syncError.response?.status === 400) {
                                    router.push({
                                        pathname: '/(auth)/select-role',
                                        params: { token: session.access_token }
                                    });
                                    setUseGoogleAuth(false);
                                    return;
                                }
                                
                                // If 401, token might be invalid - try to get fresh session
                                if (syncError.response?.status === 401) {
                                    // Get fresh session
                                    const { data: { session: freshSession }, error: freshError } = await supabase.auth.getSession();
                                    
                                    if (!freshError && freshSession) {
                                        // Retry with fresh token
                                        try {
                                            const retryRes = await api.post('/auth/sync', {}, {
                                                headers: { 'x-auth-token': freshSession.access_token }
                                            });
                                            
                                            const retryUser = retryRes.data.user;
                                            
                                            if (!retryUser || !retryUser.role) {
                                                router.push({
                                                    pathname: '/(auth)/select-role',
                                                    params: { token: freshSession.access_token }
                                                });
                                                setUseGoogleAuth(false);
                                                return;
                                            }
                                            
                                            await storage.setItem('token', freshSession.access_token);
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
                                        } catch (retryError) {
                                            // Retry failed, show error
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
        } catch (err: any) {
            setUseGoogleAuth(false);
            console.error('Google login error:', err);
            Alert.alert('Login Failed', err.message || 'Something went wrong. Please try again.');
        }
    };


    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
            style={{ backgroundColor: '#F0F7FF' }}
        >
            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="flex-1 justify-center p-6 pt-20">
                    {/* Logo/Header Section */}
                    <View className="items-center mb-12">
                        <View 
                            className="w-20 h-20 rounded-3xl items-center justify-center mb-4" 
                            style={{ 
                                backgroundColor: '#4F46E5',
                                shadowColor: '#3B82F6',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 8,
                            }}
                        >
                            <FontAwesome name="graduation-cap" size={40} color="#FFFFFF" />
                        </View>
                        <Text className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</Text>
                        <Text className="text-gray-600 text-base">Sign in to continue your journey</Text>
                    </View>

                    {/* Email/Password Login Form */}
                    <View className="mb-4">
                        <Text className="text-gray-700 font-semibold mb-2 text-sm">Email Address</Text>
                        <View className="flex-row items-center bg-white rounded-xl p-4 border-2 border-gray-100 shadow-sm"
                              style={{
                                  shadowColor: '#000',
                                  shadowOffset: { width: 0, height: 1 },
                                  shadowOpacity: 0.05,
                                  shadowRadius: 2,
                                  elevation: 2,
                              }}>
                            <FontAwesome name="envelope" size={18} color="#9CA3AF" style={{ marginRight: 12 }} />
                            <TextInput
                                className="flex-1 text-base text-gray-900"
                                placeholder="Enter your email"
                                placeholderTextColor="#9CA3AF"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                            />
                        </View>
                    </View>

                    <View className="mb-6">
                        <Text className="text-gray-700 font-semibold mb-2 text-sm">Password</Text>
                        <View className="flex-row items-center bg-white rounded-xl p-4 border-2 border-gray-100 shadow-sm"
                              style={{
                                  shadowColor: '#000',
                                  shadowOffset: { width: 0, height: 1 },
                                  shadowOpacity: 0.05,
                                  shadowRadius: 2,
                                  elevation: 2,
                              }}>
                            <FontAwesome name="lock" size={18} color="#9CA3AF" style={{ marginRight: 12 }} />
                            <TextInput
                                className="flex-1 text-base text-gray-900"
                                placeholder="Enter your password"
                                placeholderTextColor="#9CA3AF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoComplete="password"
                            />
                        </View>
                    </View>

                    {/* Sign In Button */}
                    <TouchableOpacity
                        className="w-full rounded-xl items-center justify-center py-4 mb-6"
                        onPress={handleEmailLogin}
                        disabled={loading}
                        style={{
                            backgroundColor: loading ? '#9CA3AF' : '#4F46E5',
                            shadowColor: loading ? '#9CA3AF' : '#3B82F6',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 8,
                        }}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Sign In</Text>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View className="flex-row items-center my-6">
                        <View className="flex-1 h-px bg-gray-200" />
                        <Text className="mx-4 text-gray-500 text-sm font-medium">OR</Text>
                        <View className="flex-1 h-px bg-gray-200" />
                    </View>

                    {/* Google Sign In Button */}
                    <TouchableOpacity
                        className={`w-full bg-white rounded-xl items-center justify-center py-4 mb-6 flex-row border-2 ${
                            useGoogleAuth ? 'border-gray-200 opacity-50' : 'border-gray-200'
                        } shadow-md`}
                        onPress={handleGoogleLogin}
                        disabled={useGoogleAuth}
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 4,
                        }}
                    >
                        {useGoogleAuth ? (
                            <ActivityIndicator size="small" color="#4285F4" />
                        ) : (
                            <>
                                <FontAwesome name="google" size={20} color="#4285F4" style={{ marginRight: 12 }} />
                                <Text className="text-gray-700 font-semibold text-base">Continue with Google</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Signup Link */}
                    <View className="flex-row justify-center items-center mt-4">
                        <Text className="text-gray-600 text-sm">Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/signup')}>
                            <Text className="text-blue-600 font-bold text-sm">Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
