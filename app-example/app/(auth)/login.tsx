import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../../services/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleLogin = async () => {
        try {
            const res = await api.post('/auth/login', { email, password });
            await AsyncStorage.setItem('token', res.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(res.data.user));

            if (res.data.user.role === 'organizer') {
                // router.replace('/(organizer)/dashboard'); // TODO: Create organizer routes
                router.replace('/(tabs)');
            } else {
                router.replace('/(tabs)');
            }
        } catch (err: any) {
            Alert.alert('Login Failed', err.response?.data?.msg || 'Something went wrong');
        }
    };

    return (
        <View className="flex-1 justify-center items-center bg-white p-4">
            <Text className="text-2xl font-bold mb-6">CampusConnect Login</Text>

            <TextInput
                className="w-full border border-gray-300 rounded-lg p-3 mb-4"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
            />

            <TextInput
                className="w-full border border-gray-300 rounded-lg p-3 mb-6"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity
                className="w-full bg-blue-600 p-3 rounded-lg items-center"
                onPress={handleLogin}
            >
                <Text className="text-white font-bold text-lg">Login</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/signup')} className="mt-4">
                <Text className="text-blue-600">Don&apos;t have an account? Sign Up</Text>
            </TouchableOpacity>
        </View>
    );
}
