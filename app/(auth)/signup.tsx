import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
                <View className="flex-1 justify-center p-6 pt-12">
                    {/* Header Section */}
                    <View className="items-center mb-8">
                        <View 
                            className="w-16 h-16 rounded-2xl items-center justify-center mb-4" 
                            style={{ 
                                backgroundColor: '#4F46E5',
                                shadowColor: '#3B82F6',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 8,
                            }}
                        >
                            <FontAwesome name="user-plus" size={30} color="#FFFFFF" />
                        </View>
                        <Text className="text-3xl font-bold text-center mb-2 text-gray-900">Create Account</Text>
                        <Text className="text-gray-600 text-center text-base">Join CampusConnect today</Text>
                    </View>

                    {/* Role Selection */}
                    <View className="mb-6">
                        <Text className="text-base font-semibold mb-3 text-gray-700">I am a:</Text>
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

                    {/* Common Fields */}
                    <View className="mb-4">
                        <Text className="text-gray-700 font-semibold mb-2 text-sm">Full Name</Text>
                        <View className="flex-row items-center bg-white rounded-xl p-4 border-2 border-gray-100"
                              style={{
                                  shadowColor: '#000',
                                  shadowOffset: { width: 0, height: 1 },
                                  shadowOpacity: 0.05,
                                  shadowRadius: 2,
                                  elevation: 2,
                              }}>
                            <FontAwesome name="user" size={18} color="#9CA3AF" style={{ marginRight: 12 }} />
                            <TextInput
                                className="flex-1 text-base text-gray-900"
                                placeholder="Enter your full name"
                                placeholderTextColor="#9CA3AF"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-700 font-semibold mb-2 text-sm">Email Address</Text>
                        <View className="flex-row items-center bg-white rounded-xl p-4 border-2 border-gray-100"
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

                    <View className="mb-4">
                        <Text className="text-gray-700 font-semibold mb-2 text-sm">Password</Text>
                        <View className="flex-row items-center bg-white rounded-xl p-4 border-2 border-gray-100"
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
                                placeholder="Create a password (min 6 characters)"
                                placeholderTextColor="#9CA3AF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoComplete="password-new"
                            />
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-700 font-semibold mb-2 text-sm">Confirm Password</Text>
                        <View className="flex-row items-center bg-white rounded-xl p-4 border-2 border-gray-100"
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
                                placeholder="Confirm your password"
                                placeholderTextColor="#9CA3AF"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                autoComplete="password-new"
                            />
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

                    {/* Signup Button */}
                    <TouchableOpacity
                        className="w-full rounded-xl items-center justify-center py-4 mb-6"
                        onPress={handleSignup}
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
                            <Text className="text-white font-bold text-lg">Create Account</Text>
                        )}
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View className="flex-row justify-center items-center mt-4 mb-6">
                        <Text className="text-gray-600 text-sm">Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/login')}>
                            <Text className="text-blue-600 font-bold text-sm">Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

