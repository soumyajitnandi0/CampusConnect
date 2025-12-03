import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import api from '../../services/api';
import { storage } from '../../utils/storage';

export default function EventDetails() {
    const { id } = useLocalSearchParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const router = useRouter();

    const fetchDetails = async () => {
        try {
            setRefreshing(true);
            const token = await storage.getItem('token');
            const res = await api.get(`/dashboard/event/${id}`, {
                headers: { 'x-auth-token': token }
            });
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const handleCancelEvent = async () => {
        Alert.alert(
            'Cancel Event',
            'Are you sure you want to cancel this event? This action cannot be undone.',
            [
                {
                    text: 'No',
                    style: 'cancel'
                },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setActionLoading(true);
                            const token = await storage.getItem('token');
                            
                            await api.post(`/events/${id}/cancel`, 
                                {},
                                { headers: { 'x-auth-token': token } }
                            );
                            Alert.alert('Success', 'Event has been canceled');
                            fetchDetails(); // Refresh data
                        } catch (err: any) {
                            Alert.alert('Error', err.response?.data?.msg || 'Failed to cancel event');
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) return (
        <ScreenWrapper className="justify-center items-center">
            <ActivityIndicator size="large" color="#A855F7" />
        </ScreenWrapper>
    );

    if (!data) return (
        <ScreenWrapper className="justify-center items-center">
            <Text className="text-white">Error loading details</Text>
        </ScreenWrapper>
    );

    const { event, stats, attendees, coming, feedbacks } = data;

    return (
        <ScreenWrapper>
            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchDetails}
                        tintColor="#A855F7"
                    />
                }
            >
                <View className="p-4">
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-4">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 rounded-full items-center justify-center bg-white/10"
                        >
                            <FontAwesome name="arrow-left" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold text-white">Event Details</Text>
                        <View className="w-10" />
                    </View>

                    {/* Event Header */}
                    <GlassContainer className="p-6 mb-4">
                        <Text className="text-2xl font-bold mb-2 text-white">{event.title}</Text>
                        <Text className="text-gray-300 mb-4">
                            {new Date(event.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })} • {event.location}
                        </Text>

                        {/* Status Badge */}
                        {event.status === 'canceled' && (
                            <View className="mb-3 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30">
                                <Text className="text-red-400 font-bold text-sm">Event Canceled</Text>
                                {event.cancelReason && (
                                    <Text className="text-red-300 text-xs mt-1">{event.cancelReason}</Text>
                                )}
                            </View>
                        )}
                        {event.status === 'rescheduled' && (
                            <View className="mb-3 px-3 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                                <Text className="text-yellow-400 font-bold text-sm">Event Rescheduled</Text>
                                {event.rescheduledDate && (
                                    <Text className="text-yellow-300 text-xs mt-1">
                                        New Date: {new Date(event.rescheduledDate).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View className="flex-row gap-3 mt-3">
                            {event.status !== 'canceled' && (
                                <>
                                    <GlassButton
                                        title="Open Scanner"
                                        icon="qrcode"
                                        onPress={() => router.push({
                                            pathname: '/(organizer)/scanner',
                                            params: { eventId: event._id }
                                        })}
                                        className="flex-1"
                                        variant="primary"
                                    />
                                    <GlassButton
                                        title="Reschedule"
                                        icon="calendar"
                                        onPress={() => router.push({
                                            pathname: '/(organizer)/reschedule-event',
                                            params: { eventId: event._id }
                                        })}
                                        className="flex-1"
                                        variant="secondary"
                                    />
                                </>
                            )}
                        </View>

                        {/* Cancel Button */}
                        {event.status !== 'canceled' && (
                            <TouchableOpacity
                                onPress={handleCancelEvent}
                                disabled={actionLoading}
                                className="mt-3 rounded-xl overflow-hidden border border-red-500/30"
                            >
                                <View className="py-3 items-center justify-center bg-red-500/10" style={{ opacity: actionLoading ? 0.7 : 1 }}>
                                    {actionLoading ? (
                                        <ActivityIndicator size="small" color="#EF4444" />
                                    ) : (
                                        <View className="flex-row items-center">
                                            <FontAwesome name="times-circle" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                                            <Text className="text-red-400 font-bold">Cancel Event</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        )}
                    </GlassContainer>

                    {/* Stats */}
                    <View className="flex-row justify-between mb-4">
                        <GlassContainer className="flex-1 mr-2 items-center p-4" intensity={20}>
                            <Text className="text-3xl font-bold text-blue-400">{stats.totalRSVPs}</Text>
                            <Text className="text-gray-400 text-xs mt-1">Total RSVPs</Text>
                        </GlassContainer>
                        <GlassContainer className="flex-1 mx-2 items-center p-4" intensity={20}>
                            <Text className="text-3xl font-bold text-green-400">{stats.attended}</Text>
                            <Text className="text-gray-400 text-xs mt-1">Checked In</Text>
                        </GlassContainer>
                        <GlassContainer className="flex-1 ml-2 items-center p-4" intensity={20}>
                            <Text className="text-3xl font-bold text-yellow-400">{stats.avgRating || '0'}</Text>
                            <Text className="text-gray-400 text-xs mt-1">Avg Rating</Text>
                        </GlassContainer>
                    </View>

                    {/* All Attendees (Coming) */}
                    <GlassContainer className="p-4 mb-4">
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                <FontAwesome name="users" size={20} color="#A855F7" />
                                <Text className="text-xl font-bold text-white ml-2">
                                    All Attendees ({coming?.length || 0})
                                </Text>
                            </View>
                            <View
                                className="px-3 py-1 rounded-full bg-purple-500/20"
                            >
                                <Text className="text-purple-300 text-xs font-semibold">
                                    {stats.attendanceRate || 0}% Checked In
                                </Text>
                            </View>
                        </View>

                        {coming && coming.length > 0 ? (
                            <View>
                                {coming.map((attendee: any, index: number) => (
                                    <View
                                        key={attendee.id || index}
                                        className="flex-row items-center justify-between p-3 mb-2 rounded-xl bg-white/5 border-l-4"
                                        style={{
                                            borderLeftColor: attendee.attended ? '#10B981' : '#4B5563',
                                        }}
                                    >
                                        <View className="flex-1">
                                            <View className="flex-row items-center">
                                                <View
                                                    className="w-10 h-10 rounded-full justify-center items-center mr-3"
                                                    style={{ backgroundColor: attendee.attended ? '#10B981' : '#4B5563' }}
                                                >
                                                    <Text className="text-white font-bold text-sm">
                                                        {attendee.name?.charAt(0)?.toUpperCase() || 'U'}
                                                    </Text>
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="font-semibold text-white">
                                                        {attendee.name}
                                                    </Text>
                                                    {attendee.rollNo && (
                                                        <Text className="text-gray-400 text-xs">
                                                            Roll No: {attendee.rollNo}
                                                            {attendee.yearSection && ` • ${attendee.yearSection}`}
                                                        </Text>
                                                    )}
                                                    {!attendee.rollNo && (
                                                        <Text className="text-gray-400 text-xs">
                                                            {attendee.email}
                                                        </Text>
                                                    )}
                                                    {attendee.checkInTime && (
                                                        <Text className="text-green-400 text-xs mt-1 font-medium">
                                                            Checked in: {new Date(attendee.checkInTime).toLocaleString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                        <View className="items-end">
                                            {attendee.attended ? (
                                                <View
                                                    className="px-3 py-1 rounded-full bg-green-500/20"
                                                >
                                                    <Text className="text-green-300 text-xs font-bold">✓ Checked In</Text>
                                                </View>
                                            ) : (
                                                <View
                                                    className="px-3 py-1 rounded-full bg-gray-600/30"
                                                >
                                                    <Text className="text-gray-400 text-xs font-semibold">Not Checked In</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View className="items-center py-8">
                                <FontAwesome name="user-times" size={32} color="#6B7280" />
                                <Text className="text-gray-500 mt-2">No attendees yet</Text>
                            </View>
                        )}
                    </GlassContainer>

                    {/* Feedback Section */}
                    {feedbacks && feedbacks.length > 0 && (
                        <GlassContainer className="p-4 mb-4">
                            <Text className="text-xl font-bold mb-3 text-white">
                                Feedback ({feedbacks.length})
                            </Text>
                            {feedbacks.map((fb: any, index: number) => (
                                <View
                                    key={fb.id || index}
                                    className="bg-white/5 p-3 rounded-xl mb-2"
                                >
                                    <View className="flex-row justify-between mb-1">
                                        <Text className="font-semibold text-white">{fb.user.name}</Text>
                                        <Text className="text-yellow-400 font-bold">{fb.rating} ★</Text>
                                    </View>
                                    {fb.comment && (
                                        <Text className="text-gray-300 text-sm">{fb.comment}</Text>
                                    )}
                                </View>
                            ))}
                        </GlassContainer>
                    )}

                    <View className="h-10" />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}
