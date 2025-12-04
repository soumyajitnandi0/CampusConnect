import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { EventCard } from '../../components/event-card';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useAuth } from '../../contexts/auth.context';
import { useEvents } from '../../contexts/events.context';
import { Event } from '../../types/models';

import { useWindowDimensions } from 'react-native';

export default function MyEventsScreen() {
    const router = useRouter();
    const { myEvents, loading, refreshEvents, isOfflineData } = useEvents();
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const { width } = useWindowDimensions();
    const numColumns = 1;

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshEvents();
        setRefreshing(false);
    };

    const handleEventPress = (event: Event) => {
        router.push({
            pathname: '/event/[id]',
            params: { id: event.id },
        });
    };

    const handleQRPress = (event: Event) => {
        if (!user) return;
        router.push({
            pathname: '/qr-code/[eventId]',
            params: { eventId: event.id },
        });
    };

    if (loading && myEvents.length === 0) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <ActivityIndicator size="large" color="#FFFFFF" />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <View className="px-6 pt-4 pb-4 w-full max-w-6xl self-center">
                <GlassContainer className="flex-row items-center justify-between p-6" intensity={20}>
                    <View>
                        <Text className="text-3xl font-bold text-white">My Events</Text>
                        <Text className="text-gray-300 text-sm mt-1">
                            {myEvents.length} event{myEvents.length !== 1 ? 's' : ''} registered
                        </Text>
                    </View>
                    {isOfflineData && (
                        <View className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/50">
                            <Text className="text-xs font-semibold text-yellow-400">Offline</Text>
                        </View>
                    )}
                </GlassContainer>
            </View>

            <FlatList
                key={numColumns}
                data={myEvents}
                keyExtractor={(item) => item.id}
                numColumns={numColumns}
                renderItem={({ item }) => (
                    <View className="px-6">
                        <EventCard
                            event={item}
                            onPress={() => handleEventPress(item)}
                            isRSVPd={true}
                            showActions={false}
                        />
                        <TouchableOpacity
                            className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4 flex-row items-center justify-center"
                            onPress={() => handleQRPress(item)}
                        >
                            <FontAwesome name="qrcode" size={20} color="#60A5FA" />
                            <Text className="text-blue-400 font-semibold ml-2">
                                Show QR Code
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#FFFFFF"
                    />
                }
                ListEmptyComponent={
                    <View className="items-center mt-20 px-6">
                        <FontAwesome name="calendar-times-o" size={48} color="#4B5563" />
                        <Text className="text-center mt-4 text-gray-400 text-base font-semibold">
                            No events registered
                        </Text>
                        <Text className="text-center mt-2 text-gray-500 text-sm">
                            RSVP to events to see them here!
                        </Text>
                        <TouchableOpacity
                            className="mt-6 px-6 py-3 rounded-xl bg-white/10 border border-white/20"
                            onPress={() => router.push('/(student)')}
                        >
                            <Text className="text-white font-semibold">Browse Events</Text>
                        </TouchableOpacity>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            />
        </ScreenWrapper>
    );
}
