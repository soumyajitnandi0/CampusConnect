import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
    const [showDatePicker, setShowDatePicker] = useState(false);
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
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
            style={{ backgroundColor: '#F0F7FF' }}
        >
            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View 
                    className="px-6 pt-16 pb-4 flex-row justify-between items-center"
                    style={{
                        backgroundColor: '#FFFFFF',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 4,
                    }}
                >
                    <View>
                        <Text className="text-2xl font-bold text-gray-900">Create Event</Text>
                        <Text className="text-gray-600 text-sm mt-1">Fill in the event details</Text>
                    </View>
                    <TouchableOpacity 
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: '#F3F4F6' }}
                    >
                        <FontAwesome name="close" size={20} color="#374151" />
                    </TouchableOpacity>
                </View>

                <View className="px-6 pt-6">
                    {/* Image Placeholder */}
                    <View 
                        className="h-48 rounded-2xl mb-6 justify-center items-center border-2 border-dashed"
                        style={{ 
                            backgroundColor: '#F9FAFB',
                            borderColor: '#E5E7EB',
                        }}
                    >
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
                    </View>
                    
                    <View className="mb-4">
                        <Text className="text-gray-700 font-semibold mb-2 text-sm">Image URL (Optional)</Text>
                        <View className="flex-row items-center bg-white rounded-xl p-4 border-2 border-gray-100"
                              style={{
                                  shadowColor: '#000',
                                  shadowOffset: { width: 0, height: 1 },
                                  shadowOpacity: 0.05,
                                  shadowRadius: 2,
                                  elevation: 2,
                              }}>
                            <FontAwesome name="link" size={18} color="#9CA3AF" style={{ marginRight: 12 }} />
                            <TextInput
                                className="flex-1 text-base text-gray-900"
                                placeholder="https://example.com/image.jpg"
                                placeholderTextColor="#9CA3AF"
                                value={imageUrl}
                                onChangeText={setImageUrl}
                                autoCapitalize="none"
                                keyboardType="url"
                            />
                        </View>
                    </View>

                    {/* Event Name */}
                    <View className="mb-4">
                        <Text className="text-gray-700 font-semibold mb-2 text-sm">Event Name *</Text>
                        <View className="flex-row items-center bg-white rounded-xl p-4 border-2 border-gray-100"
                              style={{
                                  shadowColor: '#000',
                                  shadowOffset: { width: 0, height: 1 },
                                  shadowOpacity: 0.05,
                                  shadowRadius: 2,
                                  elevation: 2,
                              }}>
                            <FontAwesome name="calendar" size={18} color="#9CA3AF" style={{ marginRight: 12 }} />
                            <TextInput
                                className="flex-1 text-base text-gray-900"
                                placeholder="What's the Event Called?"
                                placeholderTextColor="#9CA3AF"
                                value={title}
                                onChangeText={setTitle}
                                maxLength={50}
                            />
                        </View>
                    </View>

                    {/* Mode of Event */}
                    <View className="mb-4">
                        <Text className="text-gray-700 font-semibold mb-3 text-sm">Mode of Event *</Text>
                        <View 
                            className="rounded-2xl overflow-hidden"
                            style={{
                                backgroundColor: '#FFFFFF',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.05,
                                shadowRadius: 2,
                                elevation: 2,
                            }}
                        >
                            <TouchableOpacity
                                className="flex-row items-center p-4 border-b border-gray-100"
                                onPress={() => setMode('online')}
                            >
                                <View 
                                    className="w-6 h-6 rounded-full border-2 mr-3 justify-center items-center"
                                    style={{ 
                                        borderColor: mode === 'online' ? '#9333EA' : '#D1D5DB',
                                    }}
                                >
                                    {mode === 'online' && (
                                        <View 
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: '#9333EA' }}
                                        />
                                    )}
                                </View>
                                <View className="flex-1">
                                    <Text className="font-bold text-gray-900">Online</Text>
                                    <Text className="text-gray-400 text-xs">Virtual event</Text>
                                </View>
                                <FontAwesome name="video-camera" size={20} color={mode === 'online' ? '#9333EA' : '#9CA3AF'} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="flex-row items-center p-4"
                                onPress={() => setMode('offline')}
                            >
                                <View 
                                    className="w-6 h-6 rounded-full border-2 mr-3 justify-center items-center"
                                    style={{ 
                                        borderColor: mode === 'offline' ? '#9333EA' : '#D1D5DB',
                                    }}
                                >
                                    {mode === 'offline' && (
                                        <View 
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: '#9333EA' }}
                                        />
                                    )}
                                </View>
                                <View className="flex-1">
                                    <Text className="font-bold text-gray-900">Offline</Text>
                                    <Text className="text-gray-400 text-xs">In-person event</Text>
                                </View>
                                <FontAwesome name="map-marker" size={20} color={mode === 'offline' ? '#9333EA' : '#9CA3AF'} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Location (if offline) */}
                    {mode === 'offline' && (
                        <View className="mb-4">
                            <Text className="text-gray-700 font-semibold mb-2 text-sm">Location *</Text>
                            <View className="flex-row items-center bg-white rounded-xl p-4 border-2 border-gray-100"
                                  style={{
                                      shadowColor: '#000',
                                      shadowOffset: { width: 0, height: 1 },
                                      shadowOpacity: 0.05,
                                      shadowRadius: 2,
                                      elevation: 2,
                                  }}>
                                <FontAwesome name="map-marker" size={18} color="#9CA3AF" style={{ marginRight: 12 }} />
                                <TextInput
                                    className="flex-1 text-base text-gray-900"
                                    placeholder="Room: BDAG 703 (B)"
                                    placeholderTextColor="#9CA3AF"
                                    value={location}
                                    onChangeText={setLocation}
                                />
                            </View>
                        </View>
                    )}

                    {/* Date and Time */}
                    <View className="mb-4">
                        <Text className="text-gray-700 font-semibold mb-2 text-sm">Date & Time *</Text>
                        <View className="flex-row space-x-3">
                            <View className="flex-1">
                                <View className="flex-row items-center bg-white rounded-xl p-4 border-2 border-gray-100"
                                      style={{
                                          shadowColor: '#000',
                                          shadowOffset: { width: 0, height: 1 },
                                          shadowOpacity: 0.05,
                                          shadowRadius: 2,
                                          elevation: 2,
                                      }}>
                                    <FontAwesome name="calendar" size={18} color="#9CA3AF" style={{ marginRight: 12 }} />
                                    <TextInput
                                        className="flex-1 text-base text-gray-900"
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor="#9CA3AF"
                                        value={dateInput}
                                        onChangeText={(text) => {
                                            setDateInput(text);
                                            if (text && timeInput) {
                                                handleDateChange(text, timeInput);
                                            }
                                        }}
                                        keyboardType="default"
                                    />
                                </View>
                            </View>
                            <View className="flex-1">
                                <View className="flex-row items-center bg-white rounded-xl p-4 border-2 border-gray-100"
                                      style={{
                                          shadowColor: '#000',
                                          shadowOffset: { width: 0, height: 1 },
                                          shadowOpacity: 0.05,
                                          shadowRadius: 2,
                                          elevation: 2,
                                      }}>
                                    <FontAwesome name="clock-o" size={18} color="#9CA3AF" style={{ marginRight: 12 }} />
                                    <TextInput
                                        className="flex-1 text-base text-gray-900"
                                        placeholder="HH:MM (24h)"
                                        placeholderTextColor="#9CA3AF"
                                        value={timeInput}
                                        onChangeText={(text) => {
                                            setTimeInput(text);
                                            if (dateInput && text) {
                                                handleDateChange(dateInput, text);
                                            }
                                        }}
                                        keyboardType="default"
                                    />
                                </View>
                            </View>
                        </View>
                        <Text className="text-gray-400 text-xs mt-2">
                            Format: YYYY-MM-DD and HH:MM (24-hour format)
                        </Text>
                        {date && date >= new Date() && (
                            <Text className="text-blue-600 text-xs mt-1">
                                Selected: {date.toLocaleString()}
                            </Text>
                        )}
                    </View>

                    {/* Participant Count */}
                    <View className="mb-4">
                        <Text className="text-gray-700 font-semibold mb-2 text-sm">Participant Count (Optional)</Text>
                        <View className="flex-row items-center bg-white rounded-xl p-4 border-2 border-gray-100"
                              style={{
                                  shadowColor: '#000',
                                  shadowOffset: { width: 0, height: 1 },
                                  shadowOpacity: 0.05,
                                  shadowRadius: 2,
                                  elevation: 2,
                              }}>
                            <FontAwesome name="users" size={18} color="#9CA3AF" style={{ marginRight: 12 }} />
                            <TextInput
                                className="flex-1 text-base text-gray-900"
                                placeholder="Enter number of participants"
                                placeholderTextColor="#9CA3AF"
                                value={participantCount}
                                onChangeText={setParticipantCount}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    {/* Description */}
                    <View className="mb-6">
                        <Text className="text-gray-700 font-semibold mb-2 text-sm">Description *</Text>
                        <View 
                            className="bg-white rounded-xl p-4 border-2 border-gray-100"
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.05,
                                shadowRadius: 2,
                                elevation: 2,
                                minHeight: 120,
                            }}
                        >
                            <TextInput
                                className="flex-1 text-base text-gray-900"
                                placeholder="Describe your event..."
                                placeholderTextColor="#9CA3AF"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                textAlignVertical="top"
                                style={{ minHeight: 100 }}
                            />
                        </View>
                    </View>

                    {/* Create Button */}
                    <TouchableOpacity
                        className="rounded-xl items-center justify-center py-4 mb-6"
                        onPress={handleCreate}
                        disabled={loading}
                        style={{
                            backgroundColor: loading ? '#9CA3AF' : '#9333EA',
                            shadowColor: loading ? '#9CA3AF' : '#9333EA',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 8,
                        }}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Create Event</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
