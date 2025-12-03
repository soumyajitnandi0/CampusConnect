import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { GlassInput } from '../../components/ui/GlassInput';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
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
        <ScreenWrapper>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1, paddingVertical: 20 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="flex-1 justify-center p-6 pt-16">
                        {/* Header Section */}
                        <View className="items-center mb-10">
                            <GlassContainer className="w-24 h-24 items-center justify-center mb-6 rounded-full" intensity={30}>
                                <FontAwesome name="user-circle-o" size={40} color="#FFFFFF" />
                            </GlassContainer>
                            <Text className="text-3xl font-bold text-center mb-2 text-white">Complete Registration</Text>
                            <Text className="text-gray-400 text-center text-base">Select your role to continue</Text>
                        </View>

                        <GlassContainer className="p-6">
                            {/* Role Selection */}
                            <View className="mb-6">
                                <Text className="text-base font-semibold mb-4 text-gray-300">I am a:</Text>
                                <View className="flex-row gap-3">
                                    <TouchableOpacity
                                        className={`flex-1 rounded-xl p-4 border items-center justify-center ${role === 'student'
                                                ? 'bg-white border-white'
                                                : 'bg-glass-white border-glass-border'
                                            }`}
                                        onPress={() => setRole('student')}
                                    >
                                        <FontAwesome
                                            name="graduation-cap"
                                            size={24}
                                            color={role === 'student' ? '#000000' : '#9CA3AF'}
                                            style={{ marginBottom: 8 }}
                                        />
                                        <Text
                                            className={`text-center font-bold text-base ${role === 'student' ? 'text-black' : 'text-gray-400'
                                                }`}
                                        >
                                            Student
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className={`flex-1 rounded-xl p-4 border items-center justify-center ${role === 'organizer'
                                                ? 'bg-white border-white'
                                                : 'bg-glass-white border-glass-border'
                                            }`}
                                        onPress={() => setRole('organizer')}
                                    >
                                        <FontAwesome
                                            name="calendar-check-o"
                                            size={24}
                                            color={role === 'organizer' ? '#000000' : '#9CA3AF'}
                                            style={{ marginBottom: 8 }}
                                        />
                                        <Text
                                            className={`text-center font-bold text-base ${role === 'organizer' ? 'text-black' : 'text-gray-400'
                                                }`}
                                        >
                                            Organizer
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Student-specific fields */}
                            {role === 'student' && (
                                <View className="space-y-4 mb-4">
                                    <GlassInput
                                        label="Roll Number"
                                        placeholder="Enter your roll number"
                                        value={rollNo}
                                        onChangeText={setRollNo}
                                        autoCapitalize="characters"
                                    />

                                    <GlassInput
                                        label="Year/Section"
                                        placeholder="e.g., 2nd Year, Section A"
                                        value={yearSection}
                                        onChangeText={setYearSection}
                                    />
                                </View>
                            )}

                            {/* Continue Button */}
                            <GlassButton
                                title="Continue"
                                onPress={handleContinue}
                                loading={loading}
                                disabled={!role}
                                className="mt-2"
                            />
                        </GlassContainer>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

