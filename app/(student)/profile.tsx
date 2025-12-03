import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { supabase } from '../../services/supabase';
import { storage } from "../../utils/storage";

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
            <ScreenWrapper className="justify-center items-center">
                <ActivityIndicator size="large" color="#FFFFFF" />
            </ScreenWrapper>
        );
    }

    if (!user) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <Text className="text-gray-400">No user data</Text>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1 }}
            >
                <View className="p-6 pt-16 w-full max-w-md self-center">
                    {/* Profile Header */}
                    <View className="items-center mb-10">
                        <View className="relative">
                            <GlassContainer className="w-32 h-32 rounded-full justify-center items-center mb-4 p-0 border-2 border-white/20" intensity={40}>
                                <Text className="text-6xl text-white font-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                </Text>
                            </GlassContainer>
                            <View className="absolute bottom-4 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-black" />
                        </View>

                        <Text className="text-3xl font-bold text-white mb-1 text-center">{user.name}</Text>
                        <Text className="text-gray-400 mb-3 text-center text-base">{user.email}</Text>

                        <View className="px-6 py-1.5 rounded-full bg-white/10 border border-white/20">
                            <Text className="text-white font-semibold text-sm capitalize tracking-wide">
                                {user.role}
                            </Text>
                        </View>
                    </View>

                    {/* Student Details Card */}
                    {user.role === 'student' && user.rollNo && (
                        <GlassContainer className="mb-8 p-0 overflow-hidden" intensity={25}>
                            <View className="p-5 border-b border-white/5 bg-white/5">
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 rounded-full justify-center items-center mr-4 bg-blue-500/20">
                                        <FontAwesome name="graduation-cap" size={20} color="#60A5FA" />
                                    </View>
                                    <View>
                                        <Text className="text-lg font-bold text-white">Academic Details</Text>
                                        <Text className="text-gray-400 text-xs">Student Information</Text>
                                    </View>
                                </View>
                            </View>

                            <View className="p-5 space-y-5">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                        <View className="w-8 items-center">
                                            <FontAwesome name="id-card" size={16} color="#9CA3AF" />
                                        </View>
                                        <Text className="text-gray-300 ml-2">Roll Number</Text>
                                    </View>
                                    <Text className="text-white font-bold text-base">
                                        {user.rollNo || 'Not set'}
                                    </Text>
                                </View>

                                <View className="h-[1px] bg-white/5" />

                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                        <View className="w-8 items-center">
                                            <FontAwesome name="calendar" size={16} color="#9CA3AF" />
                                        </View>
                                        <Text className="text-gray-300 ml-2">Year & Section</Text>
                                    </View>
                                    <Text className="text-white font-bold text-base">
                                        {user.yearSection || 'Not set'}
                                    </Text>
                                </View>
                            </View>
                        </GlassContainer>
                    )}

                    {/* Logout Button */}
                    <GlassButton
                        title="Sign Out"
                        onPress={handleLogout}
                        variant="outline"
                        className="mt-auto mb-6 border-red-500/30 bg-red-500/5 active:bg-red-500/20"
                        textClassName="text-red-400 font-bold"
                        icon={<FontAwesome name="sign-out" size={18} color="#F87171" style={{ marginRight: 10 }} />}
                    />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}
