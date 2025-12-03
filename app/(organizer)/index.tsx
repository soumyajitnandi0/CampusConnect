import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { EventCard } from '../../components/event-card';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useAuth } from '../../contexts/auth.context';
import { EventService } from '../../services/event.service';

export default function OrganizerDashboard() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const { user } = useAuth();

    const fetchEvents = async () => {
        try {
            if (!user || !user.id) {
                console.error('User not found');
                setLoading(false);
                setRefreshing(false);
                return;
            }

            // Fetch only events created by this organizer (using authenticated endpoint)
            const organizerEvents = await EventService.getMyEvents();
            setEvents(organizerEvents);
        } catch (err: any) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchEvents();
    };

    const renderEvent = ({ item }: { item: any }) => (
        <View className="px-6">
            <EventCard
                event={item}
                onPress={() => router.push({ pathname: '/(organizer)/event-details', params: { id: item.id || item._id } })}
                showActions={false}
            />
        </View>
    );

    if (loading) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <ActivityIndicator size="large" color="#FFFFFF" />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <View className="px-6 pt-4 pb-4">
                <GlassContainer className="flex-row items-center justify-between p-6" intensity={20}>
                    <View>
                        <Text className="text-3xl font-bold text-white">Dashboard</Text>
                        <Text className="text-gray-300 text-sm mt-1">Manage your events</Text>
                    </View>
                    <GlassContainer className="w-12 h-12 rounded-full justify-center items-center p-0" intensity={30}>
                        <FontAwesome name="calendar-check-o" size={24} color="#FFFFFF" />
                    </GlassContainer>
                </GlassContainer>
            </View>

            <FlatList
                data={events}
                renderItem={renderEvent}
                keyExtractor={(item) => item.id || item._id || String(item)}
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
                            No events created yet
                        </Text>
                        <Text className="text-center mt-2 text-gray-500 text-sm">
                            Tap the + button to create your first event!
                        </Text>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            />

            <TouchableOpacity
                className="absolute bottom-24 right-6"
                onPress={() => router.push('/(organizer)/create-event')}
            >
                <GlassContainer className="w-16 h-16 rounded-full justify-center items-center p-0 border-white/20" intensity={40}>
                    <FontAwesome name="plus" size={28} color="#FFFFFF" />
                </GlassContainer>
            </TouchableOpacity>
        </ScreenWrapper>
    );
}
