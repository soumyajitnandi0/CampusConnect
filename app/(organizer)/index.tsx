import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import api from '../../services/api';

export default function OrganizerDashboard() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events');
            // In a real app, filter by organizer ID here or on backend
            setEvents(res.data);
        } catch (err) {
            console.error(err);
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
        <TouchableOpacity
            onPress={() => router.push({ pathname: '/(organizer)/event-details', params: { id: item._id } })}
            className="bg-white rounded-2xl mb-4 overflow-hidden mx-4 mt-2"
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
            }}
        >
            {item.imageUrl && item.imageUrl.trim() !== '' && (
                <Image 
                    source={{ uri: item.imageUrl.trim() }} 
                    style={{ width: '100%', height: 192 }}
                    contentFit="cover"
                    transition={200}
                />
            )}
            <View className="p-5">
                <Text className="text-xl font-bold mb-2 text-gray-900">{item.title}</Text>
                <View className="flex-row items-center mb-2">
                    <FontAwesome name="calendar" size={14} color="#6B7280" />
                    <Text className="text-gray-600 text-sm ml-2">
                        {new Date(item.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </Text>
                    {item.location && (
                        <>
                            <Text className="text-gray-400 mx-2">•</Text>
                            <FontAwesome name="map-marker" size={14} color="#6B7280" />
                            <Text className="text-gray-600 text-sm ml-1" numberOfLines={1}>
                                {item.location}
                            </Text>
                        </>
                    )}
                </View>
                <Text className="text-gray-700 mb-4 text-sm" numberOfLines={2}>
                    {item.description || 'No description available'}
                </Text>

                <View className="flex-row justify-between items-center pt-4 border-t border-gray-100">
                    <View className="flex-row items-center">
                        <FontAwesome name="users" size={16} color="#2563EB" />
                        <Text className="text-blue-600 font-semibold text-sm ml-2">
                            {item.rsvpCount || 0} RSVPs
                        </Text>
                    </View>
                    <View 
                        className="px-3 py-1 rounded-full"
                        style={{ backgroundColor: '#D1FAE5' }}
                    >
                        <Text className="text-green-800 text-xs font-bold">Active</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View 
                className="flex-1 justify-center items-center"
                style={{ backgroundColor: '#F0F7FF' }}
            >
                <ActivityIndicator size="large" color="#9333EA" />
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
                        <Text className="text-3xl font-bold text-gray-900">Dashboard</Text>
                        <Text className="text-gray-600 text-sm mt-1">Manage your events</Text>
                    </View>
                    <View 
                        className="w-12 h-12 rounded-full justify-center items-center"
                        style={{ backgroundColor: '#F3E8FF' }}
                    >
                        <FontAwesome name="calendar-check-o" size={24} color="#9333EA" />
                    </View>
                </View>
            </View>

            <FlatList
                data={events}
                renderItem={renderEvent}
                keyExtractor={(item) => item._id}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh}
                        tintColor="#9333EA"
                    />
                }
                ListEmptyComponent={
                    <View className="items-center mt-20 px-6">
                        <FontAwesome name="calendar-times-o" size={48} color="#9CA3AF" />
                        <Text className="text-center mt-4 text-gray-500 text-base font-semibold">
                            No events created yet
                        </Text>
                        <Text className="text-center mt-2 text-gray-400 text-sm">
                            Tap the + button to create your first event!
                        </Text>
                    </View>
                }
                contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
            />

            <TouchableOpacity
                className="absolute bottom-6 right-6 w-16 h-16 rounded-full justify-center items-center"
                onPress={() => router.push('/(organizer)/create-event')}
                style={{
                    backgroundColor: '#9333EA',
                    shadowColor: '#9333EA',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 8,
                }}
            >
                <FontAwesome name="plus" size={28} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
}
