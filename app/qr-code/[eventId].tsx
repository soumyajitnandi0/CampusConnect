import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { QRCodeDisplay } from '../../components/qr-code-display';
import { useAuth } from '../../contexts/auth.context';
import { useEvents } from '../../contexts/events.context';

export default function QRCodeScreen() {
    const router = useRouter();
    const { eventId } = useLocalSearchParams<{ eventId: string }>();
    const { user } = useAuth();
    const { events } = useEvents();
    
    const event = events.find(e => e.id === eventId);

    if (!user) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text>Please login to view QR code</Text>
            </View>
        );
    }

    return (
        <ScrollView 
            className="flex-1"
            style={{ backgroundColor: '#F0F7FF' }}
            contentContainerStyle={{ flexGrow: 1, padding: 20 }}
        >
            <View className="flex-1 justify-center items-center">
                <View 
                    className="bg-white rounded-3xl p-8 items-center"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                        elevation: 8,
                    }}
                >
                    <View className="items-center mb-6">
                        <View 
                            className="w-16 h-16 rounded-full justify-center items-center mb-4"
                            style={{ backgroundColor: '#2563EB' }}
                        >
                            <FontAwesome name="qrcode" size={32} color="#FFFFFF" />
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 mb-2">
                            {event?.title || 'Event Check-In'}
                        </Text>
                        <Text className="text-gray-600 text-center">
                            Show this QR code at the event entrance
                        </Text>
                    </View>

                    <QRCodeDisplay
                        userId={user.id}
                        eventId={eventId}
                        size={250}
                        showLabel={true}
                    />

                    <View 
                        className="mt-6 p-4 rounded-xl w-full"
                        style={{ backgroundColor: '#EEF2FF' }}
                    >
                        <View className="flex-row items-center mb-2">
                            <FontAwesome name="user" size={14} color="#2563EB" />
                            <Text className="text-gray-700 font-semibold ml-2">
                                {user.name}
                            </Text>
                        </View>
                        {user.role === 'student' && user.rollNo && (
                            <View className="flex-row items-center">
                                <FontAwesome name="id-card" size={14} color="#2563EB" />
                                <Text className="text-gray-600 text-sm ml-2">
                                    Roll No: {user.rollNo}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <TouchableOpacity
                    className="mt-8 px-8 py-4 rounded-xl"
                    style={{ backgroundColor: '#2563EB' }}
                    onPress={() => router.back()}
                >
                    <Text className="text-white font-bold text-base">Done</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

