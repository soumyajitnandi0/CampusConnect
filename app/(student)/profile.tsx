import FontAwesome from '@expo/vector-icons/FontAwesome';
import { storage } from "../../utils/storage";
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../services/supabase';

export default function ProfileScreen() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await storage.getItem('user');
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
        try {
            // Sign out from Supabase if session exists
            await supabase.auth.signOut();
            
            // Clear local storage
            await storage.removeItem('token');
            await storage.removeItem('user');
            
            // Navigate to login
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear local storage and navigate even if Supabase signout fails
            await storage.removeItem('token');
            await storage.removeItem('user');
            router.replace('/(auth)/login');
        }
    };

    if (loading) {
        return (
            <View 
                className="flex-1 justify-center items-center"
                style={{ backgroundColor: '#F0F7FF' }}
            >
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (!user) {
        return (
            <View 
                className="flex-1 justify-center items-center"
                style={{ backgroundColor: '#F0F7FF' }}
            >
                <Text className="text-gray-600">No user data</Text>
            </View>
        );
    }

    return (
        <ScrollView 
            className="flex-1"
            style={{ backgroundColor: '#F0F7FF' }}
            contentContainerStyle={{ flexGrow: 1 }}
        >
            <View className="p-6 pt-16">
                {/* Profile Header */}
                <View className="items-center mb-8">
                    <View 
                        className="w-28 h-28 rounded-full justify-center items-center mb-4"
                        style={{
                            backgroundColor: '#2563EB',
                            shadowColor: '#2563EB',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 8,
                        }}
                    >
                        <Text className="text-5xl text-white font-bold">
                            {user.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text className="text-3xl font-bold text-gray-900 mb-1">{user.name}</Text>
                    <Text className="text-gray-600 mb-2">{user.email}</Text>
                    <View 
                        className="px-4 py-1 rounded-full mt-1"
                        style={{ backgroundColor: '#EEF2FF' }}
                    >
                        <Text className="text-blue-600 font-semibold text-sm capitalize">
                            {user.role}
                        </Text>
                    </View>
                </View>

                {/* Student Details Card */}
                {user.role === 'student' && user.rollNo && (
                    <View 
                        className="bg-white p-5 rounded-2xl mb-6"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 4,
                        }}
                    >
                        <View className="flex-row items-center mb-4">
                            <View 
                                className="w-10 h-10 rounded-full justify-center items-center mr-3"
                                style={{ backgroundColor: '#DBEAFE' }}
                            >
                                <FontAwesome name="graduation-cap" size={20} color="#2563EB" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900">Student Details</Text>
                        </View>
                        <View className="border-t border-gray-100 pt-4 space-y-3">
                            <View className="flex-row items-center">
                                <FontAwesome name="id-card" size={16} color="#6B7280" />
                                <Text className="text-gray-600 ml-3">Roll No:</Text>
                                <Text className="text-gray-900 font-semibold ml-2">{user.rollNo}</Text>
                            </View>
                            <View className="flex-row items-center">
                                <FontAwesome name="calendar" size={16} color="#6B7280" />
                                <Text className="text-gray-600 ml-3">Year/Section:</Text>
                                <Text className="text-gray-900 font-semibold ml-2">{user.yearSection}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Logout Button */}
                <TouchableOpacity
                    className="rounded-xl items-center justify-center py-4 mt-auto mb-6"
                    onPress={handleLogout}
                    style={{
                        backgroundColor: '#EF4444',
                        shadowColor: '#EF4444',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                    }}
                >
                    <View className="flex-row items-center">
                        <FontAwesome name="sign-out" size={18} color="#FFFFFF" />
                        <Text className="text-white font-bold text-base ml-2">Logout</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
