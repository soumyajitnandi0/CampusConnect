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
                <View className="p-6 pt-16">
                    {/* Profile Header */}
                    <View className="items-center mb-8">
                        <GlassContainer className="w-28 h-28 rounded-full justify-center items-center mb-4 p-0" intensity={30}>
                            <Text className="text-5xl text-white font-bold">
                                {user.name.charAt(0).toUpperCase()}
                            </Text>
                        </GlassContainer>
                        <Text className="text-3xl font-bold text-white mb-1">{user.name}</Text>
                        <Text className="text-gray-400 mb-2">{user.email}</Text>
                        <View className="px-4 py-1 rounded-full mt-1 bg-white/10 border border-white/20">
                            <Text className="text-white font-semibold text-sm capitalize">
                                {user.role}
                            </Text>
                        </View>
                    </View>

                    {/* Organizer Stats Card */}
                    <GlassContainer className="mb-6 p-5" intensity={20}>
                        <View className="flex-row items-center mb-4">
                            <View className="w-10 h-10 rounded-full justify-center items-center mr-3 bg-white/10">
                                <FontAwesome name="calendar-check-o" size={20} color="#FFFFFF" />
                            </View>
                            <Text className="text-lg font-bold text-white">Organizer Dashboard</Text>
                        </View>
                        <View className="border-t border-glass-border pt-4">
                            <Text className="text-gray-300 text-sm">
                                Manage your events and track attendance from the dashboard.
                            </Text>
                        </View>
                    </GlassContainer>

                    {/* Logout Button */}
                    <GlassButton
                        title="Logout"
                        onPress={handleLogout}
                        variant="outline"
                        className="mt-auto mb-6 border-red-500/50 bg-red-500/10"
                        textClassName="text-red-400"
                        icon={<FontAwesome name="sign-out" size={18} color="#F87171" style={{ marginRight: 8 }} />}
                    />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}
