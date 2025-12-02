import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/auth.context';
import { useEvents } from '../../contexts/events.context';
import api from '../../services/api';
import { Event } from '../../types/models';
import { formatEventDate, isEventPast } from '../../utils/event.utils';
import { storage } from '../../utils/storage';

export default function EventDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const { rsvpForEvent, cancelRSVP, isUserRSVPd, refreshEvents } = useEvents();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [rsvping, setRsvping] = useState(false);

    const fetchEventDetails = async () => {
        try {
            const token = await storage.getItem('token');
            const response = await api.get(`/events/${id}`, {
                headers: token ? { 'x-auth-token': token } : {},
            });
            setEvent(response.data);
        } catch (error: any) {
            console.error('Error fetching event:', error);
            Alert.alert('Error', 'Failed to load event details');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchEventDetails();
        }
    }, [id]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchEventDetails();
        await refreshEvents();
    };

    const handleRSVP = async () => {
        if (!event || !user) return;

        const isPast = isEventPast(event);
        if (isPast) {
            Alert.alert('Event Ended', 'You cannot RSVP to past events.');
            return;
        }

        try {
            setRsvping(true);
            if (isUserRSVPd(event.id)) {
                await cancelRSVP(event.id);
                Alert.alert('Success', 'RSVP cancelled successfully');
            } else {
                await rsvpForEvent(event.id);
                Alert.alert('Success', 'You have RSVP\'d to this event!');
            }
            await fetchEventDetails();
            await refreshEvents();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update RSVP');
        } finally {
            setRsvping(false);
        }
    };

    const handleQRCode = () => {
        if (!event || !user) return;
        router.push({
            pathname: '/qr-code/[eventId]',
            params: { eventId: event.id },
        });
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (!event) {
        return (
            <View className="flex-1 justify-center items-center bg-white px-6">
                <FontAwesome name="exclamation-circle" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 text-lg font-semibold mt-4 text-center">
                    Event not found
                </Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mt-6 px-6 py-3 rounded-xl"
                    style={{ backgroundColor: '#2563EB' }}
                >
                    <Text className="text-white font-semibold">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isPast = isEventPast(event);
    const isRSVPd = user ? isUserRSVPd(event.id) : false;
    const canRSVP = !isPast;

    return (
        <ScrollView
            className="flex-1 bg-white"
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
            }
        >
            {/* Header Image */}
            {event.imageUrl && event.imageUrl.trim() !== '' && (
                <Image
                    source={{ uri: event.imageUrl.trim() }}
                    style={{ width: '100%', height: 256 }}
                    contentFit="cover"
                    transition={200}
                    placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
                    onError={(error) => {
                        console.error('Image load error for event:', event.id);
                        console.error('Image URL:', event.imageUrl);
                        console.error('Error:', error);
                    }}
                    onLoad={() => {
                        console.log('Image loaded for event:', event.id);
                    }}
                />
            )}

            <View className="px-6 pt-6 pb-8">
                {/* Title */}
                <Text className="text-3xl font-bold text-gray-900 mb-3">{event.title}</Text>

                {/* Date and Location */}
                <View className="mb-4">
                    <View className="flex-row items-center mb-2">
                        <FontAwesome name="calendar" size={18} color="#6B7280" />
                        <Text className="text-gray-700 ml-3 text-base">
                            {formatEventDate(event.date)}
                        </Text>
                    </View>
                    <View className="flex-row items-center">
                        <FontAwesome name="map-marker" size={18} color="#6B7280" />
                        <Text className="text-gray-700 ml-3 text-base flex-1">
                            {event.location}
                        </Text>
                    </View>
                </View>

                {/* Status Badge */}
                <View className="mb-4">
                    {isPast ? (
                        <View className="px-4 py-2 rounded-full self-start" style={{ backgroundColor: '#FEE2E2' }}>
                            <Text className="text-red-600 font-semibold text-sm">Event Ended</Text>
                        </View>
                    ) : (
                        <View className="px-4 py-2 rounded-full self-start" style={{ backgroundColor: '#D1FAE5' }}>
                            <Text className="text-green-600 font-semibold text-sm">Upcoming Event</Text>
                        </View>
                    )}
                </View>

                {/* Description */}
                <View className="mb-6">
                    <Text className="text-gray-700 text-lg font-semibold mb-2">Description</Text>
                    <Text className="text-gray-600 text-base leading-6">{event.description}</Text>
                </View>

                {/* Stats */}
                <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                    <View className="flex-row justify-around">
                        <View className="items-center">
                            <FontAwesome name="users" size={24} color="#2563EB" />
                            <Text className="text-gray-900 font-bold text-xl mt-2">{event.rsvpCount || 0}</Text>
                            <Text className="text-gray-500 text-xs mt-1">RSVPs</Text>
                        </View>
                        {event.category && (
                            <View className="items-center">
                                <FontAwesome name="tag" size={24} color="#9333EA" />
                                <Text className="text-gray-900 font-bold text-lg mt-2">{event.category}</Text>
                                <Text className="text-gray-500 text-xs mt-1">Category</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Action Buttons */}
                {user && (
                    <View className="space-y-3">
                        {canRSVP && (
                            <TouchableOpacity
                                onPress={handleRSVP}
                                disabled={rsvping}
                                className="rounded-xl py-4 items-center justify-center"
                                style={{
                                    backgroundColor: isRSVPd ? '#F3F4F6' : '#2563EB',
                                    opacity: rsvping ? 0.6 : 1,
                                }}
                            >
                                {rsvping ? (
                                    <ActivityIndicator size="small" color={isRSVPd ? '#6B7280' : '#FFFFFF'} />
                                ) : (
                                    <Text
                                        className="font-bold text-lg"
                                        style={{ color: isRSVPd ? '#6B7280' : '#FFFFFF' }}
                                    >
                                        {isRSVPd ? 'Cancel RSVP' : 'RSVP to Event'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {isRSVPd && !isPast && (
                            <TouchableOpacity
                                onPress={handleQRCode}
                                className="rounded-xl py-4 items-center justify-center border-2"
                                style={{
                                    borderColor: '#2563EB',
                                    backgroundColor: '#EFF6FF',
                                }}
                            >
                                <View className="flex-row items-center">
                                    <FontAwesome name="qrcode" size={20} color="#2563EB" />
                                    <Text className="text-blue-600 font-bold text-lg ml-2">
                                        View My QR Code
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {!user && (
                    <View className="bg-blue-50 rounded-xl p-4">
                        <Text className="text-blue-800 text-center">
                            Please log in to RSVP to this event
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

