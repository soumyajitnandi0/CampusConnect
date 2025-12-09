import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CreateEventHeader } from '../../components/ui/CreateEventHeader';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { GlassInput } from '../../components/ui/GlassInput';
import { PremiumGlassCard } from '../../components/ui/PremiumGlassCard';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Theme } from '../../constants/theme';
import api from '../../services/api';
import { uploadImage } from '../../services/upload.service';
import { getEventCardImageUrl } from '../../utils/cloudinary';
import { hexToRgba } from '../../utils/colorUtils';
import { formatEventDate } from '../../utils/event.utils';
import { storage } from "../../utils/storage";

export default function CreateEvent() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [mode, setMode] = useState('offline'); // 'online' or 'offline'
    const [participantCount, setParticipantCount] = useState('');
    const [imagePublicId, setImagePublicId] = useState<string | null>(null);
    const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
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
        requestImagePermission();
    }, []);

    const requestImagePermission = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'We need access to your photos to upload event images.');
            }
        }
    };

    const handlePickImage = async () => {
        try {
            // Use string 'images' directly (MediaType is a type alias, not an object)
            // MediaTypeOptions.Images is deprecated, but string 'images' is the recommended format
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images', // Can also be ['images'] for array format
                allowsEditing: true,
                aspect: [16, 9], // Recommended 16:9 aspect ratio
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                setImagePreviewUri(asset.uri);
                
                // Upload image
                setUploadingImage(true);
                try {
                    const uploadResult = await uploadImage(asset.uri);
                    setImagePublicId(uploadResult.publicId);
                    Alert.alert('Success', 'Image uploaded successfully');
                } catch (error: any) {
                    Alert.alert('Upload Failed', error.message || 'Failed to upload image');
                    setImagePreviewUri(null);
                } finally {
                    setUploadingImage(false);
                }
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to pick image');
        }
    };

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

            // Use Cloudinary public ID for image
            const cleanImageUrl = imagePublicId || undefined;

            console.log('Creating event with imagePublicId:', cleanImageUrl);

            // Prepare duration object
            const duration = {
                days: days,
                hours: hours,
                minutes: minutes
            };

            const eventData = {
                title,
                description,
                date: date.toISOString(),
                location: mode === 'online' ? 'Online Event' : location,
                category: 'General', // Default for now
                imageUrl: cleanImageUrl,
                duration,
                club: selectedClub || undefined
            };

            console.log('Creating event with data:', JSON.stringify(eventData, null, 2));

            // API client automatically adds token via interceptor, no need to pass in headers
            const response = await api.post('/events', eventData);

            console.log('Event created successfully:', response);

            Alert.alert('Success', 'Event created successfully');
            router.back();
        } catch (err: any) {
            console.error('Error creating event:', err);
            // Handle both new error types (AppError) and legacy error format
            const errorMessage = err.message || err.response?.data?.msg || 'Failed to create event';
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <CreateEventHeader
                title="Create Event"
                subtitle="Bring your ideas to life"
                icon="magic"
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                        {/* Image Preview Section */}
                        <PremiumGlassCard style={styles.imageCard} intensity={Theme.blur.medium} gradient>
                            {imagePreviewUri || imagePublicId ? (
                                <View style={styles.imageWrapper}>
                                    <Image
                                        source={{ 
                                            uri: imagePreviewUri || (imagePublicId ? getEventCardImageUrl(imagePublicId, 800) : '')
                                        }}
                                        style={styles.previewImage}
                                        contentFit="cover"
                                        transition={200}
                                    />
                                    <LinearGradient
                                        colors={['transparent', hexToRgba(Theme.colors.background.primary, 0.8)]}
                                        style={styles.imageOverlay}
                                    />
                                    <View style={styles.imageTitleContainer}>
                                        <Text style={styles.imageTitle}>{title || 'Event Cover'}</Text>
                                    </View>
                                    {uploadingImage && (
                                        <View style={styles.uploadingOverlay}>
                                            <ActivityIndicator size="large" color={Theme.colors.accent.purpleLight} />
                                            <Text style={styles.uploadingText}>Uploading...</Text>
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={handlePickImage}
                                    disabled={uploadingImage}
                                    activeOpacity={0.8}
                                    style={styles.imagePlaceholderButton}
                                >
                                    <LinearGradient
                                        colors={[
                                            hexToRgba(Theme.colors.accent.purple, 0.1),
                                            hexToRgba(Theme.colors.accent.blue, 0.05),
                                        ]}
                                        style={styles.imagePlaceholder}
                                    >
                                        {uploadingImage ? (
                                            <>
                                                <ActivityIndicator size="large" color={Theme.colors.accent.purpleLight} />
                                                <Text style={styles.placeholderText}>Uploading...</Text>
                                            </>
                                        ) : (
                                            <>
                                                <PremiumGlassCard style={styles.placeholderIconContainer} intensity={Theme.blur.medium}>
                                                    <FontAwesome name="image" size={32} color={Theme.colors.accent.purpleLight} />
                                                </PremiumGlassCard>
                                                <Text style={styles.placeholderTitle}>Cover Image</Text>
                                                <Text style={styles.placeholderSubtitle}>Tap to upload (16:9 recommended)</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </PremiumGlassCard>

                        {/* Image Actions */}
                        {(imagePreviewUri || imagePublicId) && (
                            <View className="mb-4 flex-row gap-2">
                                <TouchableOpacity
                                    onPress={handlePickImage}
                                    disabled={uploadingImage}
                                    className="flex-1"
                                    activeOpacity={0.7}
                                >
                                    <GlassContainer className="p-3 items-center" intensity={20}>
                                        <FontAwesome name="refresh" size={16} color="#A855F7" />
                                        <Text className="text-gray-300 text-xs mt-1">Change Image</Text>
                                    </GlassContainer>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        setImagePublicId(null);
                                        setImagePreviewUri(null);
                                    }}
                                    disabled={uploadingImage}
                                    className="flex-1"
                                    activeOpacity={0.7}
                                >
                                    <GlassContainer className="p-3 items-center" intensity={20}>
                                        <FontAwesome name="trash" size={16} color="#EF4444" />
                                        <Text className="text-gray-300 text-xs mt-1">Remove</Text>
                                    </GlassContainer>
                                </TouchableOpacity>
                            </View>
                        )}

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
                            style={styles.createButton}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={loading 
                                    ? [Theme.colors.text.muted, Theme.colors.text.disabled]
                                    : [Theme.colors.accent.purple, Theme.colors.accent.purpleDark]
                                }
                                style={[styles.createButtonGradient, { opacity: loading ? 0.7 : 1 }]}
                            >
                                {loading ? (
                                    <View style={styles.createButtonContent}>
                                        <ActivityIndicator size="small" color={Theme.colors.text.primary} />
                                        <Text style={styles.createButtonText}>Creating...</Text>
                                    </View>
                                ) : (
                                    <View style={styles.createButtonContent}>
                                        <FontAwesome name="check-circle" size={Theme.typography.fontSize.xl} color={Theme.colors.text.primary} style={{ marginRight: Theme.spacing.sm }} />
                                        <Text style={styles.createButtonText}>Create Event</Text>
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

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    content: {
        paddingHorizontal: Theme.layout.padding.horizontal,
        paddingTop: Theme.spacing.xl,
    },
    imageCard: {
        marginBottom: Theme.spacing.xl,
        padding: 0,
        overflow: 'hidden',
        borderRadius: Theme.radius.xxl,
    },
    imageWrapper: {
        width: '100%',
        height: 220,
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        height: '40%',
        bottom: 0,
    },
    imageTitleContainer: {
        position: 'absolute',
        bottom: Theme.spacing.lg,
        left: Theme.spacing.lg,
        right: Theme.spacing.lg,
    },
    imageTitle: {
        fontSize: Theme.typography.fontSize.lg,
        fontWeight: '700',
        color: Theme.colors.text.primary,
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: hexToRgba(Theme.colors.background.primary, 0.5),
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadingText: {
        fontSize: Theme.typography.fontSize.sm,
        color: Theme.colors.text.primary,
        marginTop: Theme.spacing.sm,
    },
    imagePlaceholderButton: {
        width: '100%',
        height: 220,
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderIconContainer: {
        width: 80,
        height: 80,
        borderRadius: Theme.radius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Theme.spacing.lg,
        padding: 0,
    },
    placeholderTitle: {
        fontSize: Theme.typography.fontSize.base,
        fontWeight: '600',
        color: Theme.colors.text.secondary,
        marginBottom: Theme.spacing.xs,
    },
    placeholderSubtitle: {
        fontSize: Theme.typography.fontSize.xs,
        color: Theme.colors.text.muted,
    },
    placeholderText: {
        fontSize: Theme.typography.fontSize.base,
        fontWeight: '600',
        color: Theme.colors.text.secondary,
        marginTop: Theme.spacing.lg,
    },
    createButton: {
        marginTop: Theme.spacing.xl,
        marginBottom: Theme.spacing.xxxl,
        borderRadius: Theme.radius.full,
        overflow: 'hidden',
        ...Theme.shadows.md,
    },
    createButtonGradient: {
        paddingVertical: Theme.spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    createButtonText: {
        fontSize: Theme.typography.fontSize.lg,
        fontWeight: '700',
        color: Theme.colors.text.primary,
    },
});
