import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { GlassInput } from '../../components/ui/GlassInput';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import api from '../../services/api';
import { formatEventDate } from '../../utils/event.utils';
import { storage } from "../../utils/storage";

export default function CreateEvent() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [mode, setMode] = useState('offline'); // 'online' or 'offline'
    const [participantCount, setParticipantCount] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [date, setDate] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow by default
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [durationDays, setDurationDays] = useState('');
    const [durationHours, setDurationHours] = useState('');
    const [durationMinutes, setDurationMinutes] = useState('');
    const [selectedClub, setSelectedClub] = useState<string | null>(null);
    const [clubs, setClubs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingClubs, setLoadingClubs] = useState(true);

    const router = useRouter();

    useEffect(() => {
        fetchClubs();
    }, []);

    const fetchClubs = async () => {
        try {
            const { ClubService } = await import('../../services/club.service');
            const myClubs = await ClubService.getMyClubs();
            setClubs(myClubs);
        } catch (err: any) {
            console.error('Error fetching clubs:', err);
        } finally {
            setLoadingClubs(false);
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            if (event.type === 'dismissed') {
                return;
            }
        } else {
            // iOS - keep picker open until user confirms
            if (event.type === 'dismissed') {
                setShowDatePicker(false);
                return;
            }
        }
        
        if (selectedDate) {
            const now = new Date();
            // Only check date part, not time
            const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            if (selectedDateOnly < nowDateOnly) {
                Alert.alert('Invalid Date', 'Event date cannot be in the past. Please select a future date.');
                return;
            }
            // Preserve the time when changing date
            const currentTime = date;
            selectedDate.setHours(currentTime.getHours(), currentTime.getMinutes());
            setDate(selectedDate);
            
            if (Platform.OS === 'ios') {
                setShowDatePicker(false);
            }
        }
    };

    const handleTimeChange = (event: any, selectedTime?: Date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
            if (event.type === 'dismissed') {
                return;
            }
        } else {
            // iOS - keep picker open until user confirms
            if (event.type === 'dismissed') {
                setShowTimePicker(false);
                return;
            }
        }
        
        if (selectedTime) {
            // Preserve the date when changing time
            const newDate = new Date(date);
            newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
            const now = new Date();
            if (newDate < now) {
                Alert.alert('Invalid Time', 'Event time cannot be in the past. Please select a future time.');
                return;
            }
            setDate(newDate);
            
            if (Platform.OS === 'ios') {
                setShowTimePicker(false);
            }
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
        const now = new Date();
        if (!date || date < now) {
            Alert.alert('Error', 'Please select a future date and time for the event');
            return;
        }

        // Validate duration - at least one field should have a value
        const days = durationDays ? parseInt(durationDays) : 0;
        const hours = durationHours ? parseInt(durationHours) : 0;
        const minutes = durationMinutes ? parseInt(durationMinutes) : 0;
        
        if (days === 0 && hours === 0 && minutes === 0) {
            Alert.alert('Error', 'Please specify event duration (at least 1 minute)');
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

            // Prepare duration object
            const duration = {
                days: days,
                hours: hours,
                minutes: minutes
            };

            await api.post('/events', {
                title,
                description,
                date: date.toISOString(),
                location: mode === 'online' ? 'Online Event' : location,
                category: 'General', // Default for now
                imageUrl: cleanImageUrl,
                duration,
                club: selectedClub || undefined
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
                    contentContainerStyle={{ paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header with Gradient */}
                    <LinearGradient
                        colors={['#1F2937', '#111827', '#0A0A0A']}
                        className="px-6 pt-16 pb-8"
                    >
                        <View className="flex-row justify-between items-center mb-6">
                            <View className="flex-1">
                                <View className="flex-row items-center mb-2">
                                    <GlassContainer className="w-12 h-12 rounded-full items-center justify-center p-0 mr-3" intensity={30}>
                                        <FontAwesome name="calendar-plus-o" size={24} color="#A855F7" />
                                    </GlassContainer>
                                    <View className="flex-1">
                                        <Text className="text-3xl font-bold text-white">Create Event</Text>
                                        <Text className="text-gray-400 text-sm mt-1">Bring your ideas to life</Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="w-10 h-10 rounded-full items-center justify-center bg-white/10 border border-white/20"
                            >
                                <FontAwesome name="times" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    <View className="px-6 -mt-4">
                        {/* Image Preview Section */}
                        <GlassContainer className="rounded-3xl mb-6 overflow-hidden p-0" intensity={20}>
                            {imageUrl && imageUrl.trim() !== '' ? (
                                <View className="relative">
                                    <Image
                                        source={{ uri: imageUrl.trim() }}
                                        style={{ width: '100%', height: 220 }}
                                        contentFit="cover"
                                        transition={200}
                                        onError={(error) => {
                                            console.error('Preview image error:', error);
                                            Alert.alert('Image Error', 'Could not load preview image. Please check the URL.');
                                        }}
                                    />
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                                        className="absolute bottom-0 left-0 right-0 h-20"
                                    />
                                    <View className="absolute bottom-4 left-4 right-4">
                                        <Text className="text-white font-bold text-lg">{title || 'Event Cover'}</Text>
                                    </View>
                                </View>
                            ) : (
                                <View className="h-48 items-center justify-center bg-gradient-to-br from-purple-500/10 to-blue-500/10">
                                    <GlassContainer className="w-20 h-20 rounded-full items-center justify-center mb-4" intensity={30}>
                                        <FontAwesome name="image" size={32} color="#A855F7" />
                                    </GlassContainer>
                                    <Text className="text-gray-300 font-semibold text-base">Cover Image</Text>
                                    <Text className="text-gray-500 text-xs mt-1">Add a URL to preview</Text>
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

                        {/* Club Selection */}
                        {!loadingClubs && clubs.length > 0 && (
                            <View className="mb-4">
                                <Text className="text-gray-300 font-semibold mb-3 text-sm ml-1">Select Club (Optional)</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                                    <TouchableOpacity
                                        onPress={() => setSelectedClub(null)}
                                        className="mr-3"
                                    >
                                        <GlassContainer
                                            className={`p-3 ${selectedClub === null ? 'border-2 border-purple-500/50' : ''}`}
                                            intensity={selectedClub === null ? 30 : 20}
                                        >
                                            <Text className={`font-semibold ${selectedClub === null ? 'text-white' : 'text-gray-400'}`}>
                                                No Club
                                            </Text>
                                        </GlassContainer>
                                    </TouchableOpacity>
                                    {clubs.map((club) => (
                                        <TouchableOpacity
                                            key={club.id}
                                            onPress={() => setSelectedClub(club.id)}
                                            className="mr-3"
                                        >
                                            <GlassContainer
                                                className={`p-3 ${selectedClub === club.id ? 'border-2 border-purple-500/50' : ''}`}
                                                intensity={selectedClub === club.id ? 30 : 20}
                                            >
                                                <Text className={`font-semibold ${selectedClub === club.id ? 'text-white' : 'text-gray-400'}`} numberOfLines={1}>
                                                    {club.name}
                                                </Text>
                                            </GlassContainer>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

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
                            <Text className="text-gray-300 font-semibold mb-3 text-sm ml-1">Event Mode *</Text>
                            <View className="flex-row space-x-3">
                                <TouchableOpacity
                                    className="flex-1"
                                    onPress={() => setMode('online')}
                                >
                                    <GlassContainer 
                                        className={`p-4 ${mode === 'online' ? 'border-2 border-purple-500/50' : ''}`} 
                                        intensity={mode === 'online' ? 30 : 20}
                                    >
                                        <View className="items-center">
                                            <View className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${mode === 'online' ? 'bg-purple-500/20' : 'bg-white/5'}`}>
                                                <FontAwesome 
                                                    name="video-camera" 
                                                    size={24} 
                                                    color={mode === 'online' ? '#A855F7' : '#9CA3AF'} 
                                                />
                                            </View>
                                            <Text className={`font-bold text-base mb-1 ${mode === 'online' ? 'text-white' : 'text-gray-400'}`}>
                                                Online
                                            </Text>
                                            <Text className="text-gray-500 text-xs text-center">Virtual event</Text>
                                        </View>
                                    </GlassContainer>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="flex-1"
                                    onPress={() => setMode('offline')}
                                >
                                    <GlassContainer 
                                        className={`p-4 ${mode === 'offline' ? 'border-2 border-purple-500/50' : ''}`} 
                                        intensity={mode === 'offline' ? 30 : 20}
                                    >
                                        <View className="items-center">
                                            <View className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${mode === 'offline' ? 'bg-purple-500/20' : 'bg-white/5'}`}>
                                                <FontAwesome 
                                                    name="map-marker" 
                                                    size={24} 
                                                    color={mode === 'offline' ? '#A855F7' : '#9CA3AF'} 
                                                />
                                            </View>
                                            <Text className={`font-bold text-base mb-1 ${mode === 'offline' ? 'text-white' : 'text-gray-400'}`}>
                                                Offline
                                            </Text>
                                            <Text className="text-gray-500 text-xs text-center">In-person event</Text>
                                        </View>
                                    </GlassContainer>
                                </TouchableOpacity>
                            </View>
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
                            <Text className="text-gray-300 font-semibold mb-3 text-sm ml-1">Date & Time *</Text>
                            <View className="flex-row" style={{ gap: 10 }}>
                                <TouchableOpacity
                                    style={{ flex: 1.4 }}
                                    onPress={() => setShowDatePicker(true)}
                                    activeOpacity={0.7}
                                >
                                    <GlassContainer className="p-3" intensity={20} style={{ minHeight: 75 }}>
                                        <View className="flex-row items-center" style={{ minHeight: 47 }}>
                                            <View className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center" style={{ marginRight: 8, flexShrink: 0 }}>
                                                <FontAwesome name="calendar" size={14} color="#60A5FA" />
                                            </View>
                                            <View style={{ flex: 1, justifyContent: 'center', minWidth: 0, paddingRight: 4 }}>
                                                <Text className="text-gray-400 text-xs mb-1">Date</Text>
                                                <Text className="text-white font-semibold" style={{ fontSize: 13 }} numberOfLines={1}>
                                                    {date.toLocaleDateString('en-US', { 
                                                        month: 'short', 
                                                        day: 'numeric', 
                                                        year: 'numeric' 
                                                    })}
                                                </Text>
                                            </View>
                                        </View>
                                    </GlassContainer>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ flex: 1 }}
                                    onPress={() => setShowTimePicker(true)}
                                    activeOpacity={0.7}
                                >
                                    <GlassContainer className="p-3" intensity={20} style={{ minHeight: 75 }}>
                                        <View className="flex-row items-center" style={{ minHeight: 47 }}>
                                            <View className="w-8 h-8 rounded-full bg-purple-500/20 items-center justify-center" style={{ marginRight: 8, flexShrink: 0 }}>
                                                <FontAwesome name="clock-o" size={14} color="#A855F7" />
                                            </View>
                                            <View style={{ flex: 1, justifyContent: 'center', minWidth: 0 }}>
                                                <Text className="text-gray-400 text-xs mb-1">Time</Text>
                                                <Text className="text-white font-semibold" style={{ fontSize: 13 }} numberOfLines={1}>
                                                    {date.toLocaleTimeString('en-US', { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit',
                                                        hour12: true 
                                                    })}
                                                </Text>
                                            </View>
                                        </View>
                                    </GlassContainer>
                                </TouchableOpacity>
                            </View>
                            
                            {/* Date Picker */}
                            {showDatePicker && (
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleDateChange}
                                    minimumDate={new Date()}
                                />
                            )}
                            
                            {/* Time Picker */}
                            {showTimePicker && (
                                <DateTimePicker
                                    value={date}
                                    mode="time"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleTimeChange}
                                    is24Hour={false}
                                />
                            )}
                            
                            {date && date >= new Date() && (
                                <View className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                                    <View className="flex-row items-center">
                                        <FontAwesome name="check-circle" size={14} color="#10B981" />
                                        <Text className="text-green-400 text-xs ml-2 font-medium">
                                            Selected: {formatEventDate(date)}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Event Duration */}
                        <View className="mb-4">
                            <Text className="text-gray-300 font-semibold mb-3 text-sm ml-1">Event Duration *</Text>
                            <View className="flex-row" style={{ gap: 8 }}>
                                <View className="flex-1">
                                    <GlassContainer className="p-3" intensity={20}>
                                        <View className="items-center">
                                            <View className="w-8 h-8 rounded-full bg-orange-500/20 items-center justify-center mb-2">
                                                <FontAwesome name="calendar" size={14} color="#F97316" />
                                            </View>
                                            <Text className="text-gray-400 text-xs mb-1">Days</Text>
                                            <TextInput
                                                className="text-white font-semibold text-center text-base"
                                                placeholder="0"
                                                placeholderTextColor="#6B7280"
                                                value={durationDays}
                                                onChangeText={(text) => {
                                                    const num = text.replace(/[^0-9]/g, '');
                                                    setDurationDays(num);
                                                }}
                                                keyboardType="numeric"
                                                maxLength={3}
                                            />
                                        </View>
                                    </GlassContainer>
                                </View>
                                <View className="flex-1">
                                    <GlassContainer className="p-3" intensity={20}>
                                        <View className="items-center">
                                            <View className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center mb-2">
                                                <FontAwesome name="clock-o" size={14} color="#3B82F6" />
                                            </View>
                                            <Text className="text-gray-400 text-xs mb-1">Hours</Text>
                                            <TextInput
                                                className="text-white font-semibold text-center text-base"
                                                placeholder="0"
                                                placeholderTextColor="#6B7280"
                                                value={durationHours}
                                                onChangeText={(text) => {
                                                    const num = text.replace(/[^0-9]/g, '');
                                                    if (parseInt(num) <= 23) {
                                                        setDurationHours(num);
                                                    }
                                                }}
                                                keyboardType="numeric"
                                                maxLength={2}
                                            />
                                        </View>
                                    </GlassContainer>
                                </View>
                                <View className="flex-1">
                                    <GlassContainer className="p-3" intensity={20}>
                                        <View className="items-center">
                                            <View className="w-8 h-8 rounded-full bg-purple-500/20 items-center justify-center mb-2">
                                                <FontAwesome name="hourglass" size={14} color="#A855F7" />
                                            </View>
                                            <Text className="text-gray-400 text-xs mb-1">Minutes</Text>
                                            <TextInput
                                                className="text-white font-semibold text-center text-base"
                                                placeholder="0"
                                                placeholderTextColor="#6B7280"
                                                value={durationMinutes}
                                                onChangeText={(text) => {
                                                    const num = text.replace(/[^0-9]/g, '');
                                                    if (parseInt(num) <= 59) {
                                                        setDurationMinutes(num);
                                                    }
                                                }}
                                                keyboardType="numeric"
                                                maxLength={2}
                                            />
                                        </View>
                                    </GlassContainer>
                                </View>
                            </View>
                            {((durationDays && parseInt(durationDays) > 0) || (durationHours && parseInt(durationHours) > 0) || (durationMinutes && parseInt(durationMinutes) > 0)) && (
                                <View className="mt-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <Text className="text-blue-400 text-xs text-center font-medium">
                                        Duration: {(durationDays && parseInt(durationDays) > 0) ? `${durationDays} day${parseInt(durationDays) !== 1 ? 's' : ''} ` : ''}
                                        {(durationHours && parseInt(durationHours) > 0) ? `${durationHours} hour${parseInt(durationHours) !== 1 ? 's' : ''} ` : ''}
                                        {(durationMinutes && parseInt(durationMinutes) > 0) ? `${durationMinutes} minute${parseInt(durationMinutes) !== 1 ? 's' : ''}` : ''}
                                    </Text>
                                </View>
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
                            <Text className="text-gray-300 font-semibold mb-3 text-sm ml-1">Description *</Text>
                            <GlassContainer className="p-5" intensity={20}>
                                <TextInput
                                    className="flex-1 text-base text-white leading-6"
                                    placeholder="Describe your event in detail..."
                                    placeholderTextColor="#6B7280"
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    textAlignVertical="top"
                                    style={{ minHeight: 120, fontSize: 16 }}
                                />
                                <View className="flex-row items-center mt-3 pt-3 border-t border-white/10">
                                    <FontAwesome name="info-circle" size={12} color="#6B7280" />
                                    <Text className="text-gray-500 text-xs ml-2">
                                        {description.length} characters
                                    </Text>
                                </View>
                            </GlassContainer>
                        </View>

                        {/* Create Button */}
                        <TouchableOpacity
                            onPress={handleCreate}
                            disabled={loading}
                            className="mb-6 rounded-2xl overflow-hidden"
                        >
                            <LinearGradient
                                colors={loading ? ['#6B7280', '#4B5563'] : ['#A855F7', '#9333EA']}
                                className="py-5 items-center justify-center"
                                style={{ opacity: loading ? 0.7 : 1 }}
                            >
                                {loading ? (
                                    <View className="flex-row items-center">
                                        <Text className="text-white font-bold text-lg mr-3">Creating...</Text>
                                    </View>
                                ) : (
                                    <View className="flex-row items-center">
                                        <FontAwesome name="check-circle" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
                                        <Text className="text-white font-bold text-lg">Create Event</Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}
