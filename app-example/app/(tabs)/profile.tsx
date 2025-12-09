import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await AsyncStorage.getItem('user');
                if (userData) {
                    setUser(JSON.parse(userData));
                } else {
                    router.replace('/(auth)/login');
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, [router]);

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        router.replace('/(auth)/login');
    };

    if (loading) {
        return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#2563eb" /></View>;
    }

    if (!user) {
        return <View className="flex-1 justify-center items-center"><Text>No user data</Text></View>;
    }

    return (
        <View className="flex-1 bg-white p-6 pt-12">
            <View className="items-center mb-8">
                <View className="w-24 h-24 bg-blue-100 rounded-full justify-center items-center mb-4">
                    <Text className="text-4xl text-blue-600 font-bold">{user.name.charAt(0)}</Text>
                </View>
                <Text className="text-2xl font-bold">{user.name}</Text>
                <Text className="text-gray-500">{user.email}</Text>
                <Text className="text-blue-600 mt-1 capitalize">{user.role}</Text>
            </View>

            {user.role === 'student' && (
                <View className="bg-gray-50 p-4 rounded-lg mb-6">
                    <Text className="font-semibold mb-2">Student Details</Text>
                    <Text>Roll No: {user.rollNo}</Text>
                    <Text>Year/Sec: {user.yearSection}</Text>
                </View>
            )}

            <TouchableOpacity
                className="bg-red-500 p-3 rounded-lg items-center mt-auto"
                onPress={handleLogout}
            >
                <Text className="text-white font-bold">Logout</Text>
            </TouchableOpacity>
        </View>
    );
}
