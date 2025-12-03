import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/auth.context';
import { useEvents } from '../../contexts/events.context';
import { EventService } from '../../services/event.service';
import { Event } from '../../types/models';
import { formatEventDate, isEventPast } from '../../utils/event.utils';

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
            const eventData = await EventService.getEventById(id);
            setEvent(eventData);
        } catch (error: any) {
            console.error('Error fetching event:', error);
            Alert.alert('Error', error.message || 'Failed to load event details');
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
        if (!event || !user) {
            Alert.alert('Error', 'Please log in to RSVP for events');
            return;
        }

        // Check if event is canceled
        if (event.status === 'canceled') {
            Alert.alert('Event Canceled', 'This event has been canceled. You cannot RSVP to canceled events.');
            return;
        }

        const isPast = isEventPast(event);
        if (isPast) {
            Alert.alert('Event Ended', 'You cannot RSVP to past events.');
            return;
        }

        try {
            setRsvping(true);
            // Check if user is already RSVP'd - handle both array and string formats
            const rsvpsArray = event.rsvps || [];
            const userId = user.id || user._id;
            const isAlreadyRSVPd = rsvpsArray.some((rsvpId: string) => 
                rsvpId?.toString() === userId?.toString()
            );

            if (isAlreadyRSVPd) {
                await cancelRSVP(event.id);
                Alert.alert('Success', 'RSVP cancelled successfully');
            } else {
                await rsvpForEvent(event.id);
                Alert.alert('Success', 'You have RSVP\'d to this event!');
            }
            await fetchEventDetails();
            await refreshEvents();
        } catch (error: any) {
            console.error('RSVP error:', error);
            const errorMessage = error.response?.data?.msg || error.message || 'Failed to update RSVP';
            Alert.alert('Error', errorMessage);
        } finally {
            setRsvping(false);
        }
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
                <Text className="text-gray-400 text-lg font-semibold mt-4 text-center">
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
    const isCanceled = event?.status === 'canceled';
    const isRescheduled = event?.status === 'rescheduled';
    // Check if user is RSVP'd - handle both array and string formats
    const rsvpsArray = event?.rsvps || [];
    const userId = user?.id || user?._id;
    const isRSVPd = user && rsvpsArray.length > 0 ? rsvpsArray.some((rsvpId: string) => 
        rsvpId?.toString() === userId?.toString()
    ) : false;
    const canRSVP = !isPast && !isCanceled;

    return (
        <View className="flex-1 bg-black">
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60A5FA" />
                }
            >
                <View className="w-full max-w-4xl self-center min-h-full pb-10">
                    <View className="relative">
                        {/* Header Image */}
                        {event.imageUrl && event.imageUrl.trim() !== '' ? (
                            <Image
                                source={{ uri: event.imageUrl.trim() }}
                                style={{ width: '100%', height: 320 }}
                                contentFit="cover"
                                transition={200}
                                placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
                            />
                        ) : (
                            <LinearGradient
                                colors={['#1F2937', '#111827']}
                                className="w-full h-80 items-center justify-center"
                            >
                                <FontAwesome name="image" size={64} color="#374151" />
                            </LinearGradient>
                        )}

                        {/* Gradient Overlay for Text Readability */}
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            className="absolute bottom-0 left-0 right-0 h-32"
                        />

                        {/* Back Button Overlay */}
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="absolute top-12 left-6 w-10 h-10 rounded-full items-center justify-center bg-black/40 backdrop-blur-md border border-white/10"
                        >
                            <FontAwesome name="arrow-left" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <View className="px-6 -mt-12">
                        {/* Main Content Card */}
                        <View className="bg-[#0A0A0A] rounded-[32px] p-6 border border-white/10 shadow-2xl shadow-black/50">

                            {/* Title & Badge Row */}
                            <View className="flex-row justify-between items-start mb-6">
                                <Text className="text-3xl md:text-4xl font-bold text-white flex-1 mr-4 leading-tight">
                                    {event.title}
                                </Text>
                                {isCanceled ? (
                                    <View className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                                        <Text className="text-red-400 font-bold text-[10px] uppercase tracking-wider">Canceled</Text>
                                    </View>
                                ) : isRescheduled ? (
                                    <View className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                                        <Text className="text-yellow-400 font-bold text-[10px] uppercase tracking-wider">Rescheduled</Text>
                                    </View>
                                ) : isPast ? (
                                    <View className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                                        <Text className="text-red-400 font-bold text-[10px] uppercase tracking-wider">Ended</Text>
                                    </View>
                                ) : (
                                    <View className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                        <Text className="text-green-400 font-bold text-[10px] uppercase tracking-wider">Upcoming</Text>
                                    </View>
                                )}
                            </View>

                            {/* Date and Location */}
                            <View className="mb-8 space-y-4 bg-white/5 p-5 rounded-2xl border border-white/5">
                                {isRescheduled && event.rescheduledDate && (
                                    <View className="mb-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                        <Text className="text-yellow-400 text-xs font-bold mb-1">Event Rescheduled</Text>
                                        <Text className="text-yellow-300 text-sm">
                                            New Date: {formatEventDate(event.rescheduledDate)}
                                        </Text>
                                    </View>
                                )}
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 rounded-full bg-blue-500/10 items-center justify-center mr-4">
                                        <FontAwesome name="calendar" size={18} color="#60A5FA" />
                                    </View>
                                    <View>
                                        <Text className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-0.5">
                                            {isRescheduled ? 'Original Date & Time' : 'Date & Time'}
                                        </Text>
                                        <Text className="text-white text-base font-semibold">
                                            {formatEventDate(event.date)}
                                        </Text>
                                    </View>
                                </View>
                                <View className="h-[1px] bg-white/5" />
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 rounded-full bg-red-500/10 items-center justify-center mr-4">
                                        <FontAwesome name="map-marker" size={20} color="#F87171" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-0.5">Location</Text>
                                        <Text className="text-white text-base font-semibold">
                                            {event.location}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Stats Grid */}
                            <View className="flex-row mb-8 space-x-3">
                                <View className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5 items-center justify-center">
                                    <FontAwesome name="users" size={20} color="#60A5FA" />
                                    <Text className="text-white font-bold text-xl mt-2">{event.rsvpCount || 0}</Text>
                                    <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mt-1">Attending</Text>
                                </View>
                                {event.category && (
                                    <View className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5 items-center justify-center">
                                        <FontAwesome name="tag" size={20} color="#A855F7" />
                                        <Text className="text-white font-bold text-lg mt-2 capitalize">{event.category}</Text>
                                        <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mt-1">Category</Text>
                                    </View>
                                )}
                            </View>

                            {/* Description */}
                            <View className="mb-10">
                                <Text className="text-white text-xl font-bold mb-4">About Event</Text>
                                <Text className="text-gray-300 text-base leading-7 font-medium">{event.description}</Text>
                            </View>

                            {/* Action Buttons */}
                            {user && (
                                <View className="space-y-4">
                                    {canRSVP && (
                                        <TouchableOpacity
                                            onPress={handleRSVP}
                                            disabled={rsvping}
                                            className="rounded-2xl overflow-hidden"
                                        >
                                            <LinearGradient
                                                colors={isRSVPd ? ['#1F2937', '#111827'] : ['#3B82F6', '#2563EB']}
                                                className="py-4 items-center justify-center"
                                                style={{ opacity: rsvping ? 0.8 : 1 }}
                                            >
                                                {rsvping ? (
                                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                                ) : (
                                                    <Text className={`font-bold text-lg ${isRSVPd ? 'text-gray-400' : 'text-white'}`}>
                                                        {isRSVPd ? 'Cancel RSVP' : 'RSVP Now'}
                                                    </Text>
                                                )}
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    )}

                                    {isPast && isRSVPd && (
                                        <TouchableOpacity
                                            onPress={() => router.push({
                                                pathname: '/(student)/feedback',
                                                params: { eventId: event.id, eventTitle: event.title }
                                            })}
                                            className="rounded-2xl py-4 items-center justify-center border border-purple-500/30 bg-purple-500/10"
                                        >
                                            <View className="flex-row items-center">
                                                <FontAwesome name="star" size={18} color="#A855F7" />
                                                <Text className="text-purple-400 font-bold text-lg ml-2">
                                                    Rate & Review
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}

                            {!user && (
                                <View className="p-6 items-center bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                                    <Text className="text-blue-300 text-center font-medium">
                                        Sign in to RSVP and join this event
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

