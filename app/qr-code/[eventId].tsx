import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { QRCodeDisplay } from '../../components/qr-code-display';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
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
            <ScreenWrapper className="justify-center items-center">
                <Stack.Screen options={{ title: 'Event Ticket', headerTransparent: true, headerTintColor: 'white' }} />
                <Text className="text-white">Please login to view QR code</Text>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <Stack.Screen options={{ title: 'Event Ticket', headerTransparent: true, headerTintColor: 'white' }} />
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1, padding: 20 }}
            >
                <View className="flex-1 justify-center items-center">
                    <GlassContainer className="p-8 items-center w-full max-w-sm">
                        <View className="items-center mb-6">
                            <View
                                className="w-16 h-16 rounded-full justify-center items-center mb-4 bg-blue-600 shadow-lg shadow-blue-500/50"
                            >
                                <FontAwesome name="qrcode" size={32} color="#FFFFFF" />
                            </View>
                            <Text className="text-2xl font-bold text-white mb-2 text-center">
                                {event?.title || 'Event Check-In'}
                            </Text>
                            <Text className="text-gray-300 text-center">
                                Show this QR code at the event entrance
                            </Text>
                        </View>

                        <View className="bg-white p-4 rounded-2xl items-center justify-center mb-6">
                            <QRCodeDisplay
                                userId={user.id}
                                eventId={eventId}
                                size={200}
                                showLabel={false}
                            />
                        </View>

                        <GlassContainer className="mt-2 p-4 w-full" intensity={20}>
                            <View className="flex-row items-center mb-2">
                                <FontAwesome name="user" size={14} color="#60A5FA" />
                                <Text className="text-white font-semibold ml-2">
                                    {user.name}
                                </Text>
                            </View>
                            {user.role === 'student' && user.rollNo && (
                                <View className="flex-row items-center">
                                    <FontAwesome name="id-card" size={14} color="#60A5FA" />
                                    <Text className="text-gray-300 text-sm ml-2">
                                        Roll No: {user.rollNo}
                                    </Text>
                                </View>
                            )}
                        </GlassContainer>
                    </GlassContainer>

                    <GlassButton
                        title="Done"
                        onPress={() => router.back()}
                        className="mt-8 w-full max-w-sm"
                    />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

