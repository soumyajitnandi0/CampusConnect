import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Platform, RefreshControl, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { EventCard } from '../../components/event-card';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { GlassInput } from '../../components/ui/GlassInput';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useAuth } from '../../contexts/auth.context';
import { useEvents } from '../../contexts/events.context';
import { Event } from '../../types/models';

export default function HomeScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    const numColumns = isWeb ? 3 : 1;
    const { events, loading, rsvpForEvent, cancelRSVP, isUserRSVPd, refreshEvents, isOfflineData } = useEvents();
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
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

    const renderHeader = () => {
        if (isWeb) {
            return (
                <View className="w-full max-w-[1280px] self-center px-6 pt-8 pb-6">
                    <View className="flex-row justify-between items-center mb-8">
                        {/* Left: Greeting */}
                        <View>
                            <Text className="text-gray-400 text-sm font-medium">Welcome back,</Text>
                            <Text className="text-white text-3xl font-bold">{user?.name?.split(' ')[0] || 'Student'}</Text>
                        </View>

                        {/* Center: Search */}
                        <View className="flex-1 max-w-xl mx-12">
                            <GlassInput
                                placeholder="Search events..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                icon="search"
                                containerStyle={{ marginBottom: 0, height: 50 }}
                            />
                        </View>

                        {/* Right: Icons */}
                        <View className="flex-row items-center space-x-4">
                            <TouchableOpacity>
                                <GlassContainer className="w-12 h-12 rounded-full" contentClassName="items-center justify-center p-0 h-full w-full" intensity={20}>
                                    <FontAwesome name="bell-o" size={20} color="#FFFFFF" />
                                </GlassContainer>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => router.push('/(student)/profile')}>
                                <GlassContainer className="w-12 h-12 rounded-full" contentClassName="items-center justify-center p-0 h-full w-full" intensity={20}>
                                    <Text className="text-white font-bold text-base">
                                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </Text>
                                </GlassContainer>
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>
            );
        }

        return (
            <View className="px-6 pt-6 pb-4">
                {/* Top Row: Greeting & Icons */}
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-gray-400 text-sm font-medium">Welcome back,</Text>
                        <Text className="text-white text-2xl font-bold">{user?.name?.split(' ')[0] || 'Student'}</Text>
                    </View>

                    <View className="flex-row items-center space-x-3">
                        <GlassContainer className="w-10 h-10 rounded-full" contentClassName="items-center justify-center p-0 h-full w-full" intensity={20}>
                            <FontAwesome name="bell-o" size={18} color="#FFFFFF" />
                        </GlassContainer>

                        <TouchableOpacity
                            onPress={() => router.push('/(student)/profile')}
                        >
                            <GlassContainer className="w-10 h-10 rounded-full" contentClassName="items-center justify-center p-0 h-full w-full" intensity={20}>
                                <Text className="text-white font-bold text-sm">
                                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </Text>
                            </GlassContainer>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar */}
                <View className="mb-4">
                    <GlassInput
                        placeholder="Search events..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        icon="search"
                        containerStyle={{ marginBottom: 0 }}
                    />
                </View>
            </View>
        );
    };

    if (loading && events.length === 0) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <ActivityIndicator size="large" color="#FFFFFF" />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <FlatList
                key={numColumns} // Force re-render when columns change
                data={filteredEvents}
                ListHeaderComponent={renderHeader}
                renderItem={({ item }) => (
                    <View className={isWeb ? "flex-1 px-3" : "px-6"}>
                        <EventCard
                            event={item}
                            onPress={() => handleEventPress(item)}
                            onRSVP={() => handleRSVP(item.id)}
                            isRSVPd={isUserRSVPd(item.id)}
                            showActions={true}
                        />
                    </View>
                )}
                keyExtractor={(item) => item.id}
                numColumns={numColumns}
                columnWrapperStyle={isWeb ? { paddingHorizontal: 24, marginBottom: 16, maxWidth: 1280, alignSelf: 'center', width: '100%' } : undefined}
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
                            {searchQuery ? 'No events match your search' : 'No events found'}
                        </Text>
                        <Text className="text-center mt-2 text-gray-500 text-sm">
                            {searchQuery ? 'Try a different search term' : 'Check back later for exciting events!'}
                        </Text>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            />
        </ScreenWrapper>
    );
}
