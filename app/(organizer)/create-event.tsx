import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { GlassInput } from '../../components/ui/GlassInput';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import api from '../../services/api';
import { storage } from "../../utils/storage";

export default function CreateEvent() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [mode, setMode] = useState('offline'); // 'online' or 'offline'
    const [participantCount, setParticipantCount] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [date, setDate] = useState<Date>(new Date());
    const [dateInput, setDateInput] = useState('');
    const [timeInput, setTimeInput] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const handleDateChange = (dateStr: string, timeStr: string) => {
        setDateInput(dateStr);
        setTimeInput(timeStr);

        if (dateStr && timeStr) {
            // Parse date and time
            const [year, month, day] = dateStr.split('-').map(Number);
            const [hours, minutes] = timeStr.split(':').map(Number);
            const newDate = new Date(year, month - 1, day, hours, minutes);

            // Validate date is not in the past
            const now = new Date();
            if (newDate < now) {
                Alert.alert('Invalid Date', 'Event date cannot be in the past. Please select a future date and time.');
                return;
            }

            setDate(newDate);
        }
    };

    const handleCreate = async () => {
        if (!title || !description) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (mode === 'offline' && !location) {
            Alert.alert('Error', 'Please provide a location for offline events');
            return;
        }

        // Validate date is set and not in the past
        if (!date || date < new Date()) {
            Alert.alert('Error', 'Please select a future date and time for the event');
            return;
        }

        try {
            setLoading(true);
            const token = await storage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'Not authorized');
                setLoading(false);
                return;
            }

            // Clean imageUrl - remove empty strings
            const cleanImageUrl = imageUrl && imageUrl.trim() !== '' ? imageUrl.trim() : undefined;

            console.log('Creating event with imageUrl:', cleanImageUrl);

            await api.post('/events', {
                title,
                description,
                date: date.toISOString(),
                location: mode === 'online' ? 'Online Event' : location,
                category: 'General', // Default for now
                imageUrl: cleanImageUrl
            }, {
                headers: { 'x-auth-token': token }
            });

            Alert.alert('Success', 'Event created successfully');
            router.back();
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.msg || 'Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 20 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View className="px-6 pt-16 pb-4 flex-row justify-between items-center">
                        <View>
                            <Text className="text-2xl font-bold text-white">Create Event</Text>
                            <Text className="text-gray-400 text-sm mt-1">Fill in the event details</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 rounded-full items-center justify-center bg-white/10"
                        >
                            <FontAwesome name="close" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <View className="px-6 pt-6">
                        {/* Image Placeholder */}
                        <GlassContainer className="h-48 rounded-2xl mb-6 justify-center items-center border border-dashed border-white/30 p-0" intensity={10}>
                            {imageUrl && imageUrl.trim() !== '' ? (
                                <Image
                                    source={{ uri: imageUrl.trim() }}
                                    style={{ width: '100%', height: '100%', borderRadius: 16 }}
                                    contentFit="cover"
                                    transition={200}
                                    onError={(error) => {
                                        console.error('Preview image error:', error);
                                        Alert.alert('Image Error', 'Could not load preview image. Please check the URL.');
                                    }}
                                />
                            ) : (
                                <View className="items-center">
                                    <FontAwesome name="image" size={40} color="#9CA3AF" />
                                    <Text className="text-gray-400 mt-2 text-sm">Add Cover Image</Text>
                                </View>
                            )}
                        </GlassContainer>

                        <View className="mb-4">
                            <GlassInput
                                label="Image URL (Optional)"
                                placeholder="https://example.com/image.jpg"
                                value={imageUrl}
                                onChangeText={setImageUrl}
                                autoCapitalize="none"
                                keyboardType="url"
                                icon="link"
                            />
                        </View>

                        {/* Event Name */}
                        <View className="mb-4">
                            <GlassInput
                                label="Event Name *"
                                placeholder="What's the Event Called?"
                                value={title}
                                onChangeText={setTitle}
                                maxLength={50}
                                icon="calendar"
                            />
                        </View>

                        {/* Mode of Event */}
                        <View className="mb-4">
                            <Text className="text-gray-300 font-semibold mb-3 text-sm ml-1">Mode of Event *</Text>
                            <GlassContainer className="p-0 overflow-hidden" intensity={20}>
                                <TouchableOpacity
                                    className={`flex-row items-center p-4 border-b border-white/10 ${mode === 'online' ? 'bg-white/5' : ''}`}
                                    onPress={() => setMode('online')}
                                >
                                    <View
                                        className="w-6 h-6 rounded-full border-2 mr-3 justify-center items-center"
                                        style={{
                                            borderColor: mode === 'online' ? '#A855F7' : '#6B7280',
                                        }}
                                    >
                                        {mode === 'online' && (
                                            <View className="w-3 h-3 rounded-full bg-purple-500" />
                                        )}
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-bold text-white">Online</Text>
                                        <Text className="text-gray-400 text-xs">Virtual event</Text>
                                    </View>
                                    <FontAwesome name="video-camera" size={20} color={mode === 'online' ? '#A855F7' : '#9CA3AF'} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className={`flex-row items-center p-4 ${mode === 'offline' ? 'bg-white/5' : ''}`}
                                    onPress={() => setMode('offline')}
                                >
                                    <View
                                        className="w-6 h-6 rounded-full border-2 mr-3 justify-center items-center"
                                        style={{
                                            borderColor: mode === 'offline' ? '#A855F7' : '#6B7280',
                                        }}
                                    >
                                        {mode === 'offline' && (
                                            <View className="w-3 h-3 rounded-full bg-purple-500" />
                                        )}
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-bold text-white">Offline</Text>
                                        <Text className="text-gray-400 text-xs">In-person event</Text>
                                    </View>
                                    <FontAwesome name="map-marker" size={20} color={mode === 'offline' ? '#A855F7' : '#9CA3AF'} />
                                </TouchableOpacity>
                            </GlassContainer>
                        </View>

                        {/* Location (if offline) */}
                        {mode === 'offline' && (
                            <View className="mb-4">
                                <GlassInput
                                    label="Location *"
                                    placeholder="Room: BDAG 703 (B)"
                                    value={location}
                                    onChangeText={setLocation}
                                    icon="map-marker"
                                />
                            </View>
                        )}

                        {/* Date and Time */}
                        <View className="mb-4">
                            <Text className="text-gray-300 font-semibold mb-2 text-sm ml-1">Date & Time *</Text>
                            <View className="flex-row space-x-3">
                                <View className="flex-1">
                                    <GlassInput
                                        placeholder="YYYY-MM-DD"
                                        value={dateInput}
                                        onChangeText={(text) => {
                                            setDateInput(text);
                                            if (text && timeInput) {
                                                handleDateChange(text, timeInput);
                                            }
                                        }}
                                        icon="calendar"
                                    />
                                </View>
                                <View className="flex-1">
                                    <GlassInput
                                        placeholder="HH:MM (24h)"
                                        value={timeInput}
                                        onChangeText={(text) => {
                                            setTimeInput(text);
                                            if (dateInput && text) {
                                                handleDateChange(dateInput, text);
                                            }
                                        }}
                                        icon="clock-o"
                                    />
                                </View>
                            </View>
                            <Text className="text-gray-500 text-xs mt-2 ml-1">
                                Format: YYYY-MM-DD and HH:MM (24-hour format)
                            </Text>
                            {date && date >= new Date() && (
                                <Text className="text-blue-400 text-xs mt-1 ml-1">
                                    Selected: {date.toLocaleString()}
                                </Text>
                            )}
                        </View>

                        {/* Participant Count */}
                        <View className="mb-4">
                            <GlassInput
                                label="Participant Count (Optional)"
                                placeholder="Enter number of participants"
                                value={participantCount}
                                onChangeText={setParticipantCount}
                                keyboardType="numeric"
                                icon="users"
                            />
                        </View>

                        {/* Description */}
                        <View className="mb-6">
                            <Text className="text-gray-300 font-semibold mb-2 text-sm ml-1">Description *</Text>
                            <GlassContainer className="p-4" intensity={20}>
                                <TextInput
                                    className="flex-1 text-base text-white"
                                    placeholder="Describe your event..."
                                    placeholderTextColor="#9CA3AF"
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    textAlignVertical="top"
                                    style={{ minHeight: 100 }}
                                />
                            </GlassContainer>
                        </View>

                        {/* Create Button */}
                        <GlassButton
                            title="Create Event"
                            onPress={handleCreate}
                            loading={loading}
                            className="mb-6"
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}
