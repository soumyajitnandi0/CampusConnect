import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import api from '../../services/api';
import { EventService } from '../../services/event.service';
import { supabase } from '../../services/supabase';
import { Event } from '../../types/models';
import { formatEventDate, isEventPast } from '../../utils/event.utils';
import { storage } from "../../utils/storage";

export default function ProfileScreen() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [upcomingRSVPs, setUpcomingRSVPs] = useState<Event[]>([]);
    const [loadingRSVPs, setLoadingRSVPs] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await storage.getItem('user');
                if (userData) {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);
                    
                    // Load upcoming RSVPs if user is a student
                    if (parsedUser.role === 'student' && parsedUser.id) {
                        loadUpcomingRSVPs(parsedUser.id);
                    }
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

    const loadUpcomingRSVPs = async (userId: string) => {
        try {
            setLoadingRSVPs(true);
            const token = await storage.getItem('token');
            if (!token) {
                setLoadingRSVPs(false);
                return;
            }

            // Fetch RSVPs with populated event data
            const response = await api.get(`/rsvps/user/${userId}`, {
                headers: {
                    'x-auth-token': token,
                },
            });

            const rsvpsData = response.data;
            
            // Filter for upcoming events with status 'going' and extract event data
            const upcomingEvents = rsvpsData
                .filter((rsvp: any) => rsvp.status === 'going' && rsvp.event)
                .map((rsvp: any) => {
                    const eventData = rsvp.event;
                    return EventService.transformEvent({
                        ...eventData,
                        rsvps: [],
                        checkedIn: [],
                    });
                })
                .filter((event: Event) => !isEventPast(event))
                .sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 5); // Limit to 5 upcoming events
            
            setUpcomingRSVPs(upcomingEvents);
        } catch (error) {
            console.error('Error loading upcoming RSVPs:', error);
        } finally {
            setLoadingRSVPs(false);
        }
    };

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

                    {/* Upcoming RSVPs Section */}
                    {user.role === 'student' && (
                        <GlassContainer className="mb-8 p-0 overflow-hidden" intensity={25}>
                            <View className="p-5 border-b border-white/5 bg-white/5">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                        <View className="w-10 h-10 rounded-full justify-center items-center mr-4 bg-purple-500/20">
                                            <FontAwesome name="calendar-check-o" size={20} color="#A855F7" />
                                        </View>
                                        <View>
                                            <Text className="text-lg font-bold text-white">Upcoming RSVPs</Text>
                                            <Text className="text-gray-400 text-xs">Events you're attending</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => user && user.id && loadUpcomingRSVPs(user.id)}
                                        disabled={loadingRSVPs}
                                        className="w-10 h-10 rounded-full items-center justify-center bg-purple-500/20 border border-purple-500/30"
                                    >
                                        {loadingRSVPs ? (
                                            <ActivityIndicator size="small" color="#A855F7" />
                                        ) : (
                                            <FontAwesome name="refresh" size={16} color="#A855F7" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View className="p-5 pt-4">
                                {loadingRSVPs ? (
                                    <View className="py-8 items-center">
                                        <ActivityIndicator size="small" color="#A855F7" />
                                        <Text className="text-gray-400 text-sm mt-2">Loading events...</Text>
                                    </View>
                                ) : upcomingRSVPs.length > 0 ? (
                                    <View>
                                        {upcomingRSVPs.map((event) => (
                                            <View key={event.id} className="mb-3 last:mb-0">
                                                <GlassContainer className="p-4" intensity={20}>
                                                    <View className="flex-row items-center">
                                                        <TouchableOpacity
                                                            onPress={() => router.push({
                                                                pathname: '/event/[id]',
                                                                params: { id: event.id }
                                                            })}
                                                            className="flex-1 mr-3"
                                                            activeOpacity={0.7}
                                                        >
                                                            <View>
                                                                <Text className="text-white font-bold text-base mb-2" numberOfLines={2}>
                                                                    {event.title}
                                                                </Text>
                                                                <View className="flex-row items-center mb-1.5">
                                                                    <View className="w-4 items-center">
                                                                        <FontAwesome name="calendar" size={11} color="#9CA3AF" />
                                                                    </View>
                                                                    <Text className="text-gray-400 text-xs ml-2 flex-1">
                                                                        {formatEventDate(event.date)}
                                                                    </Text>
                                                                </View>
                                                                {event.location && (
                                                                    <View className="flex-row items-center">
                                                                        <View className="w-4 items-center">
                                                                            <FontAwesome name="map-marker" size={11} color="#9CA3AF" />
                                                                        </View>
                                                                        <Text className="text-gray-400 text-xs ml-2 flex-1" numberOfLines={1}>
                                                                            {event.location}
                                                                        </Text>
                                                                    </View>
                                                                )}
                                                            </View>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={() => router.push({
                                                                pathname: '/qr-code/[eventId]',
                                                                params: { eventId: event.id }
                                                            })}
                                                            className="px-4 py-3 rounded-xl bg-blue-500/20 border border-blue-500/30 items-center justify-center min-w-[60px]"
                                                            activeOpacity={0.7}
                                                        >
                                                            <FontAwesome name="qrcode" size={20} color="#60A5FA" />
                                                            <Text className="text-blue-400 text-[10px] mt-1 font-bold">QR</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </GlassContainer>
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <View className="py-8 items-center">
                                        <FontAwesome name="calendar-times-o" size={32} color="#4B5563" />
                                        <Text className="text-gray-400 text-sm mt-2 text-center">
                                            No upcoming events
                                        </Text>
                                        <Text className="text-gray-500 text-xs mt-1 text-center">
                                            RSVP to events to see them here
                                        </Text>
                                    </View>
                                )}
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
