import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../../services/api';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student'); // 'student' or 'organizer'
    const [rollNo, setRollNo] = useState('');
    const [yearSection, setYearSection] = useState('');

    const router = useRouter();

    const handleSignup = async () => {
        try {
            const payload = {
                name,
                email,
                password,
                role,
                ...(role === 'student' && { rollNo, yearSection })
            };

            const res = await api.post('/auth/register', payload);
            await AsyncStorage.setItem('token', res.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(res.data.user));

            router.replace('/(tabs)');
        } catch (err: any) {
            Alert.alert('Signup Failed', err.response?.data?.msg || 'Something went wrong');
        }
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }} className="bg-white">
            <Text className="text-2xl font-bold mb-6 text-center">Create Account</Text>

            <View className="flex-row justify-center mb-6">
                <TouchableOpacity
                    onPress={() => setRole('student')}
                    className={`p-2 px-6 rounded-l-lg border ${role === 'student' ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}
                >
                    <Text className={`${role === 'student' ? 'text-white' : 'text-gray-700'}`}>Student</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setRole('organizer')}
                    className={`p-2 px-6 rounded-r-lg border ${role === 'organizer' ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}
                >
                    <Text className={`${role === 'organizer' ? 'text-white' : 'text-gray-700'}`}>Organizer</Text>
                </TouchableOpacity>
            </View>

            <TextInput
                className="w-full border border-gray-300 rounded-lg p-3 mb-4"
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
            />

            <TextInput
                className="w-full border border-gray-300 rounded-lg p-3 mb-4"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
            />

            <TextInput
                className="w-full border border-gray-300 rounded-lg p-3 mb-4"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            {role === 'student' && (
                <>
                    <TextInput
                        className="w-full border border-gray-300 rounded-lg p-3 mb-4"
                        placeholder="Roll No"
                        value={rollNo}
                        onChangeText={setRollNo}
                    />
                    <TextInput
                        className="w-full border border-gray-300 rounded-lg p-3 mb-4"
                        placeholder="Year & Section"
                        value={yearSection}
                        onChangeText={setYearSection}
                    />
                </>
            )}

            <TouchableOpacity
                className="w-full bg-blue-600 p-3 rounded-lg items-center mt-2"
                onPress={handleSignup}
            >
                <Text className="text-white font-bold text-lg">Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/login')} className="mt-4 items-center">
                <Text className="text-blue-600">Already have an account? Login</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
