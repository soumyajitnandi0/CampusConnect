import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/auth.context';
import api from '../../services/api';
import { sessionManager, storage } from "../../utils/storage";

export default function SelectRole() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const token = params.token as string;
    const { refreshAuthState } = useAuth();
    
    const [role, setRole] = useState<'student' | 'organizer' | null>(null);
    const [loading, setLoading] = useState(false);
    const [rollNo, setRollNo] = useState('');
    const [yearSection, setYearSection] = useState('');

    // If no token, redirect to login
    useEffect(() => {
        if (!token) {
            Alert.alert('Error', 'No authentication token found. Please login again.', [
                {
                    text: 'OK',
                    onPress: () => router.replace('/(auth)/login')
                }
            ]);
        }
    }, [token]);

    const handleContinue = async () => {
        try {
            if (!role) {
                Alert.alert('Error', 'Please select a role');
                return;
            }

            if (role === 'student') {
                if (!rollNo || !yearSection) {
                    Alert.alert('Error', 'Please provide Roll No and Year/Section');
                    return;
                }
            }

            setLoading(true);

            const response = await api.post(
                '/auth/sync',
                {
                    role,
                    ...(role === 'student' && { rollNo, yearSection }),
                },
                {
                    headers: { 'x-auth-token': token },
                }
            );

            const user = response.data.user;
            
            // Ensure token is saved (it should already be saved from login, but ensure it's there)
            const savedToken = await storage.getItem('token');
            if (!savedToken && token) {
                await storage.setItem('token', token);
            }
            
            await storage.setItem('user', JSON.stringify(user));
            await sessionManager.saveLoginTimestamp(); // Save login timestamp for 30-day session
            await refreshAuthState(); // Refresh auth state to update context

            setLoading(false);

            if (user.role === 'organizer') {
                router.replace('/(organizer)');
            } else {
                router.replace('/(student)');
            }
        } catch (err: any) {
            setLoading(false);
            const errorMsg = err.response?.data?.msg || err.message || 'Failed to complete registration';
            
            // Handle specific error cases
            if (err.response?.status === 400) {
                Alert.alert('Invalid Information', errorMsg);
            } else if (err.response?.status === 401) {
                Alert.alert('Session Expired', 'Your session has expired. Please login again.', [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/(auth)/login')
                    }
                ]);
            } else {
                Alert.alert('Error', errorMsg);
            }
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
            style={{ backgroundColor: '#F0F7FF' }}
        >
            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ flexGrow: 1, paddingVertical: 20 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="flex-1 justify-center p-6 pt-16">
                    {/* Header Section */}
                    <View className="items-center mb-10">
                        <View 
                            className="w-20 h-20 rounded-2xl items-center justify-center mb-4" 
                            style={{ 
                                backgroundColor: '#4F46E5',
                                shadowColor: '#3B82F6',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 8,
                            }}
                        >
                            <FontAwesome name="user-circle-o" size={40} color="#FFFFFF" />
                        </View>
                        <Text className="text-3xl font-bold text-center mb-2 text-gray-900">Complete Registration</Text>
                        <Text className="text-gray-600 text-center text-base">Select your role to continue</Text>
                    </View>

                    {/* Role Selection */}
                    <View className="mb-6">
                        <Text className="text-base font-semibold mb-4 text-gray-700">I am a:</Text>
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                className="flex-1 rounded-xl p-5 border-2 items-center justify-center"
                                onPress={() => setRole('student')}
                                style={{
                                    backgroundColor: role === 'student' ? '#2563EB' : '#F3F4F6',
                                    borderColor: role === 'student' ? '#2563EB' : '#E5E7EB',
                                    shadowColor: role === 'student' ? '#2563EB' : 'transparent',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: role === 'student' ? 0.3 : 0,
                                    shadowRadius: 4,
                                    elevation: role === 'student' ? 4 : 0,
                                }}
                            >
                                <FontAwesome 
                                    name="graduation-cap" 
                                    size={24} 
                                    color={role === 'student' ? '#FFFFFF' : '#6B7280'} 
                                    style={{ marginBottom: 8 }}
                                />
                                <Text
                                    className={`text-center font-bold text-base ${
                                        role === 'student' ? 'text-white' : 'text-gray-600'
                                    }`}
                                >
                                    Student
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 rounded-xl p-5 border-2 items-center justify-center"
                                onPress={() => setRole('organizer')}
                                style={{
                                    backgroundColor: role === 'organizer' ? '#9333EA' : '#F3F4F6',
                                    borderColor: role === 'organizer' ? '#9333EA' : '#E5E7EB',
                                    shadowColor: role === 'organizer' ? '#9333EA' : 'transparent',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: role === 'organizer' ? 0.3 : 0,
                                    shadowRadius: 4,
                                    elevation: role === 'organizer' ? 4 : 0,
                                }}
                            >
                                <FontAwesome 
                                    name="calendar-check-o" 
                                    size={24} 
                                    color={role === 'organizer' ? '#FFFFFF' : '#6B7280'} 
                                    style={{ marginBottom: 8 }}
                                />
                                <Text
                                    className={`text-center font-bold text-base ${
                                        role === 'organizer' ? 'text-white' : 'text-gray-600'
                                    }`}
                                >
                                    Organizer
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Student-specific fields */}
                    {role === 'student' && (
                        <>
                            <View className="mb-4">
                                <Text className="text-gray-700 font-semibold mb-2 text-sm">Roll Number</Text>
                                <View className="flex-row items-center bg-white rounded-xl p-4 border-2 border-gray-100"
                                      style={{
                                          shadowColor: '#000',
                                          shadowOffset: { width: 0, height: 1 },
                                          shadowOpacity: 0.05,
                                          shadowRadius: 2,
                                          elevation: 2,
                                      }}>
                                    <FontAwesome name="id-card" size={18} color="#9CA3AF" style={{ marginRight: 12 }} />
                                    <TextInput
                                        className="flex-1 text-base text-gray-900"
                                        placeholder="Enter your roll number"
                                        placeholderTextColor="#9CA3AF"
                                        value={rollNo}
                                        onChangeText={setRollNo}
                                        autoCapitalize="characters"
                                    />
                                </View>
                            </View>

                            <View className="mb-4">
                                <Text className="text-gray-700 font-semibold mb-2 text-sm">Year/Section</Text>
                                <View className="flex-row items-center bg-white rounded-xl p-4 border-2 border-gray-100"
                                      style={{
                                          shadowColor: '#000',
                                          shadowOffset: { width: 0, height: 1 },
                                          shadowOpacity: 0.05,
                                          shadowRadius: 2,
                                          elevation: 2,
                                      }}>
                                    <FontAwesome name="calendar" size={18} color="#9CA3AF" style={{ marginRight: 12 }} />
                                    <TextInput
                                        className="flex-1 text-base text-gray-900"
                                        placeholder="e.g., 2nd Year, Section A"
                                        placeholderTextColor="#9CA3AF"
                                        value={yearSection}
                                        onChangeText={setYearSection}
                                    />
                                </View>
                            </View>
                        </>
                    )}

                    {/* Continue Button */}
                    <TouchableOpacity
                        className="w-full rounded-xl items-center justify-center py-4 mb-4"
                        onPress={handleContinue}
                        disabled={loading || !role}
                        style={{
                            backgroundColor: loading || !role 
                                ? '#9CA3AF' 
                                : role === 'student' 
                                ? '#2563EB' 
                                : '#9333EA',
                            shadowColor: loading || !role ? '#9CA3AF' : role === 'student' ? '#2563EB' : '#9333EA',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 8,
                        }}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Continue</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

