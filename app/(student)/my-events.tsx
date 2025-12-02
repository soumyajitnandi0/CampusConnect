import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { EventCard } from '../../components/event-card';
import { useAuth } from '../../contexts/auth.context';
import { useEvents } from '../../contexts/events.context';
import { Event } from '../../types/models';

export default function MyEventsScreen() {
    const router = useRouter();
    const { myEvents, loading, refreshEvents, isOfflineData } = useEvents();
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

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
            <View 
                className="flex-1 justify-center items-center"
                style={{ backgroundColor: '#F0F7FF' }}
            >
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <View 
            className="flex-1"
            style={{ backgroundColor: '#F9FAFB' }}
        >
            <View 
                className="p-6 pt-16 pb-4"
                style={{
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 4,
                }}
            >
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-3xl font-bold text-gray-900">My Events</Text>
                        <Text className="text-gray-600 text-sm mt-1">
                            {myEvents.length} event{myEvents.length !== 1 ? 's' : ''} registered
                        </Text>
                    </View>
                    {isOfflineData && (
                        <View 
                            className="px-3 py-1 rounded-full"
                            style={{ backgroundColor: '#FEF3C7' }}
                        >
                            <Text className="text-xs font-semibold text-yellow-800">Offline</Text>
                        </View>
                    )}
                </View>
            </View>

            <FlatList
                data={myEvents}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View className="px-4">
                        <EventCard
                            event={item}
                            onPress={() => handleEventPress(item)}
                            isRSVPd={true}
                            showActions={false}
                        />
                        <TouchableOpacity
                            className="bg-blue-50 rounded-xl p-4 mb-4 flex-row items-center justify-center"
                            onPress={() => handleQRPress(item)}
                        >
                            <FontAwesome name="qrcode" size={20} color="#2563EB" />
                            <Text className="text-blue-600 font-semibold ml-2">
                                Show QR Code
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#2563EB"
                    />
                }
                ListEmptyComponent={
                    <View className="items-center mt-20 px-6">
                        <FontAwesome name="calendar-times-o" size={48} color="#9CA3AF" />
                        <Text className="text-center mt-4 text-gray-500 text-base font-semibold">
                            No events registered
                        </Text>
                        <Text className="text-center mt-2 text-gray-400 text-sm">
                            RSVP to events to see them here!
                        </Text>
                        <TouchableOpacity
                            className="mt-6 px-6 py-3 rounded-xl"
                            style={{ backgroundColor: '#2563EB' }}
                            onPress={() => router.push('/(student)')}
                        >
                            <Text className="text-white font-semibold">Browse Events</Text>
                        </TouchableOpacity>
                    </View>
                }
                contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
            />
        </View>
    );
}

