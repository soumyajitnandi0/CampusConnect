import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import api from '../../services/api';
import { storage } from '../../utils/storage';

export default function EventDetails() {
    const { id } = useLocalSearchParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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

    if (loading) return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#9333EA" /></View>;
    if (!data) return <View className="flex-1 justify-center items-center"><Text>Error loading details</Text></View>;

    const { event, stats, attendees, coming, feedbacks } = data;

    return (
        <ScrollView 
            className="flex-1"
            style={{ backgroundColor: '#F9FAFB' }}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={fetchDetails}
                    tintColor="#9333EA"
                />
            }
        >
            <View className="p-4">
                {/* Event Header */}
                <View 
                    className="bg-white p-6 rounded-2xl mb-4"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 4,
                    }}
                >
                    <Text className="text-2xl font-bold mb-2 text-gray-900">{event.title}</Text>
                    <Text className="text-gray-600 mb-4">
                        {new Date(event.date).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })} • {event.location}
                    </Text>

                    <TouchableOpacity
                        className="bg-purple-600 rounded-xl p-4 flex-row items-center justify-center mt-2"
                        onPress={() => router.push({
                            pathname: '/(organizer)/scanner',
                            params: { eventId: event._id }
                        })}
                        style={{
                            shadowColor: '#9333EA',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 8,
                        }}
                    >
                        <FontAwesome name="qrcode" size={20} color="#FFFFFF" />
                        <Text className="text-white font-bold text-base ml-2">Open Scanner</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View className="flex-row justify-between mb-4">
                    <View 
                        className="bg-white p-4 rounded-xl shadow-sm flex-1 mr-2 items-center"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 2,
                        }}
                    >
                        <Text className="text-3xl font-bold text-blue-600">{stats.totalRSVPs}</Text>
                        <Text className="text-gray-600 text-xs mt-1">Total RSVPs</Text>
                    </View>
                    <View 
                        className="bg-white p-4 rounded-xl shadow-sm flex-1 mx-2 items-center"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 2,
                        }}
                    >
                        <Text className="text-3xl font-bold text-green-600">{stats.attended}</Text>
                        <Text className="text-gray-600 text-xs mt-1">Checked In</Text>
                    </View>
                    <View 
                        className="bg-white p-4 rounded-xl shadow-sm flex-1 ml-2 items-center"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 2,
                        }}
                    >
                        <Text className="text-3xl font-bold text-yellow-600">{stats.avgRating || '0'}</Text>
                        <Text className="text-gray-600 text-xs mt-1">Avg Rating</Text>
                    </View>
                </View>

                {/* All Attendees (Coming) */}
                <View 
                    className="bg-white rounded-2xl p-4 mb-4"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 2,
                    }}
                >
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center">
                            <FontAwesome name="users" size={20} color="#9333EA" />
                            <Text className="text-xl font-bold text-gray-900 ml-2">
                                All Attendees ({coming?.length || 0})
                            </Text>
                        </View>
                        <View 
                            className="px-3 py-1 rounded-full"
                            style={{ backgroundColor: '#EEF2FF' }}
                        >
                            <Text className="text-purple-600 text-xs font-semibold">
                                {stats.attendanceRate || 0}% Checked In
                            </Text>
                        </View>
                    </View>

                    {coming && coming.length > 0 ? (
                        <View>
                            {coming.map((attendee: any, index: number) => (
                                <View
                                    key={attendee.id || index}
                                    className="flex-row items-center justify-between p-3 mb-2 rounded-xl"
                                    style={{ 
                                        backgroundColor: attendee.attended ? '#D1FAE5' : '#F9FAFB',
                                        borderLeftWidth: 3,
                                        borderLeftColor: attendee.attended ? '#10B981' : '#E5E7EB',
                                    }}
                                >
                                    <View className="flex-1">
                                        <View className="flex-row items-center">
                                            <View 
                                                className="w-10 h-10 rounded-full justify-center items-center mr-3"
                                                style={{ backgroundColor: attendee.attended ? '#10B981' : '#9CA3AF' }}
                                            >
                                                <Text className="text-white font-bold text-sm">
                                                    {attendee.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </Text>
                                            </View>
                                            <View className="flex-1">
                                                <Text className="font-semibold text-gray-900">
                                                    {attendee.name}
                                                </Text>
                                                {attendee.rollNo && (
                                                    <Text className="text-gray-500 text-xs">
                                                        Roll No: {attendee.rollNo}
                                                        {attendee.yearSection && ` • ${attendee.yearSection}`}
                                                    </Text>
                                                )}
                                                {!attendee.rollNo && (
                                                    <Text className="text-gray-500 text-xs">
                                                        {attendee.email}
                                                    </Text>
                                                )}
                                                {attendee.checkInTime && (
                                                    <Text className="text-green-600 text-xs mt-1 font-medium">
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
                                                className="px-3 py-1 rounded-full"
                                                style={{ backgroundColor: '#10B981' }}
                                            >
                                                <Text className="text-white text-xs font-bold">✓ Checked In</Text>
                                            </View>
                                        ) : (
                                            <View 
                                                className="px-3 py-1 rounded-full"
                                                style={{ backgroundColor: '#F3F4F6' }}
                                            >
                                                <Text className="text-gray-600 text-xs font-semibold">Not Checked In</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View className="items-center py-8">
                            <FontAwesome name="user-times" size={32} color="#9CA3AF" />
                            <Text className="text-gray-500 mt-2">No attendees yet</Text>
                        </View>
                    )}
                </View>

                {/* Feedback Section */}
                {feedbacks && feedbacks.length > 0 && (
                    <View 
                        className="bg-white rounded-2xl p-4 mb-4"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 2,
                        }}
                    >
                        <Text className="text-xl font-bold mb-3 text-gray-900">
                            Feedback ({feedbacks.length})
                        </Text>
                        {feedbacks.map((fb: any, index: number) => (
                            <View 
                                key={fb.id || index} 
                                className="bg-gray-50 p-3 rounded-xl mb-2"
                            >
                                <View className="flex-row justify-between mb-1">
                                    <Text className="font-semibold text-gray-900">{fb.user.name}</Text>
                                    <Text className="text-yellow-600 font-bold">{fb.rating} ★</Text>
                                </View>
                                {fb.comment && (
                                    <Text className="text-gray-700 text-sm">{fb.comment}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                <View className="h-10" />
            </View>
        </ScrollView>
    );
}
