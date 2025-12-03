import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { GlassInput } from '../../components/ui/GlassInput';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import api from '../../services/api';
import { sessionManager, storage } from "../../utils/storage";

export default function Signup() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState<'student' | 'organizer' | null>(null);

    // Common fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Student-specific fields
    const [rollNo, setRollNo] = useState('');
    const [yearSection, setYearSection] = useState('');

    const handleSignup = async () => {
        try {
            // Validation
            if (!name || !email || !password || !role) {
                Alert.alert('Error', 'Please fill in all required fields');
                return;
            }

            if (password !== confirmPassword) {
                Alert.alert('Error', 'Passwords do not match');
                return;
            }

            if (password.length < 6) {
                Alert.alert('Error', 'Password must be at least 6 characters');
                return;
            }

            if (role === 'student') {
                if (!rollNo || !yearSection) {
                    Alert.alert('Error', 'Please provide Roll No and Year/Section');
                    return;
                }
            }

            setLoading(true);

            const response = await api.post('/auth/signup', {
                name,
                email,
                password,
                role,
                ...(role === 'student' && { rollNo, yearSection }),
            });

            const { token, user } = response.data;

            await storage.setItem('token', token);
            await storage.setItem('user', JSON.stringify(user));
            await sessionManager.saveLoginTimestamp(); // Save login timestamp for 30-day session

            setLoading(false);

            // Validate user has a role before routing
            if (!user.role) {
                Alert.alert('Error', 'Account creation failed. Please try again.');
                return;
            }

            // Route based on role
            if (user.role === 'organizer') {
                router.replace('/(organizer)');
            } else {
                router.replace('/(student)');
            }
        } catch (err: any) {
            setLoading(false);
            const errorMsg = err.response?.data?.msg || err.message || 'Something went wrong';

            // Provide specific error messages
            if (err.response?.status === 400) {
                Alert.alert('Signup Failed', errorMsg);
            } else if (err.response?.status === 409 || errorMsg.includes('already exists')) {
                Alert.alert('Account Exists', 'An account with this email already exists. Please login instead.');
            } else {
                Alert.alert('Signup Failed', errorMsg);
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
                    <View className="flex-1 justify-center p-6">
                        {/* Header Section */}
                        <View className="items-center mb-8">
                            <GlassContainer className="w-20 h-20 items-center justify-center mb-4 rounded-2xl" intensity={30}>
                                <FontAwesome name="user-plus" size={30} color="#FFFFFF" />
                            </GlassContainer>
                            <Text className="text-3xl font-bold text-center mb-2 text-white">Create Account</Text>
                            <Text className="text-gray-400 text-center text-base">Join CampusConnect today</Text>
                        </View>

                        <GlassContainer className="p-6">
                            {/* Role Selection */}
                            <View className="mb-6">
                                <Text className="text-base font-semibold mb-3 text-gray-300">I am a:</Text>
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

                            {/* Common Fields */}
                            <View className="space-y-4">
                                <GlassInput
                                    label="Full Name"
                                    placeholder="Enter your full name"
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                />

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
                                    placeholder="Create a password (min 6 characters)"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    autoComplete="password-new"
                                />

                                <GlassInput
                                    label="Confirm Password"
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                    autoComplete="password-new"
                                />

                                {/* Student-specific fields */}
                                {role === 'student' && (
                                    <>
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
                                    </>
                                )}

                                {/* Signup Button */}
                                <GlassButton
                                    title="Create Account"
                                    onPress={handleSignup}
                                    loading={loading}
                                    disabled={!role}
                                    className="mt-4"
                                />
                            </View>

                            {/* Login Link */}
                            <View className="flex-row justify-center items-center mt-6">
                                <Text className="text-gray-400 text-sm">Already have an account? </Text>
                                <Text
                                    className="text-white font-bold text-sm underline"
                                    onPress={() => router.push('/login')}
                                >
                                    Login
                                </Text>
                            </View>
                        </GlassContainer>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

