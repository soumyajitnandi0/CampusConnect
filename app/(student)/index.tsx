import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { EventCard } from '../../components/event-card';
import { useAuth } from '../../contexts/auth.context';
import { useEvents } from '../../contexts/events.context';
import { Event } from '../../types/models';

export default function HomeScreen() {
    const router = useRouter();
    const { events, loading, rsvpForEvent, cancelRSVP, isUserRSVPd, refreshEvents, isOfflineData } = useEvents();
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('Posts');
    const [searchQuery, setSearchQuery] = useState('');

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshEvents();
        setRefreshing(false);
    };

    const handleRSVP = async (eventId: string) => {
        try {
            if (isUserRSVPd(eventId)) {
                await cancelRSVP(eventId);
            } else {
                await rsvpForEvent(eventId);
            }
        } catch (error: any) {
            alert(error.message || 'RSVP action failed');
        }
    };

    const handleEventPress = (event: Event) => {
        router.push({
            pathname: '/event/[id]',
            params: { id: event.id },
        });
    };

    // Filter events by search query
    const filteredEvents = events.filter(event => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            event.title.toLowerCase().includes(query) ||
            event.description.toLowerCase().includes(query) ||
            event.location.toLowerCase().includes(query)
        );
    });

    const renderHeader = () => (
        <View 
            className="bg-white pt-12 px-6 pb-4"
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 4,
            }}
        >
            <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity 
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: '#F3F4F6' }}
                >
                    <FontAwesome name="bell-o" size={20} color="#374151" />
                </TouchableOpacity>
                <View 
                    className="flex-1 mx-4 rounded-xl px-4 py-3 flex-row items-center"
                    style={{ 
                        backgroundColor: '#F9FAFB',
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                    }}
                >
                    <FontAwesome name="search" size={16} color="#9CA3AF" />
                    <TextInput 
                        placeholder="Search events..." 
                        placeholderTextColor="#9CA3AF"
                        className="ml-2 flex-1 text-gray-900"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity 
                    onPress={() => router.push('/(student)/profile')}
                    className="w-10 h-10 rounded-full"
                    style={{ backgroundColor: '#3B82F6' }}
                >
                    <View className="w-full h-full rounded-full justify-center items-center">
                        <Text className="text-white font-bold text-sm">U</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View className="flex-row justify-around bg-gray-50 rounded-xl p-1">
                {['Posts', 'Q&A', 'Community'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        className={`flex-1 px-4 py-2 rounded-lg items-center ${
                            activeTab === tab ? '' : ''
                        }`}
                        style={{
                            backgroundColor: activeTab === tab ? '#FFFFFF' : 'transparent',
                            shadowColor: activeTab === tab ? '#000' : 'transparent',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: activeTab === tab ? 0.1 : 0,
                            shadowRadius: 2,
                            elevation: activeTab === tab ? 2 : 0,
                        }}
                    >
                        <Text className={`font-semibold text-sm ${
                            activeTab === tab ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    if (loading && events.length === 0) {
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
            {renderHeader()}
            <FlatList
                data={filteredEvents}
                renderItem={({ item }) => (
                    <EventCard
                        event={item}
                        onPress={() => handleEventPress(item)}
                        onRSVP={() => handleRSVP(item.id)}
                        isRSVPd={isUserRSVPd(item.id)}
                        showActions={true}
                    />
                )}
                keyExtractor={(item) => item.id}
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
                            {searchQuery ? 'No events match your search' : 'No events found'}
                        </Text>
                        <Text className="text-center mt-2 text-gray-400 text-sm">
                            {searchQuery ? 'Try a different search term' : 'Check back later for exciting events!'}
                        </Text>
                    </View>
                }
                contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
            />
        </View>
    );
}
