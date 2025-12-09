import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { GlassContainer } from '../../components/ui/GlassContainer';
import { GlassInput } from '../../components/ui/GlassInput';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import api from '../../services/api';
import { formatEventDate } from '../../utils/event.utils';
import { storage } from "../../utils/storage";

export default function RescheduleEvent() {
    const { eventId } = useLocalSearchParams<{ eventId: string }>();
    const [event, setEvent] = useState<any>(null);
    const [location, setLocation] = useState('');
    const [date, setDate] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const router = useRouter();

    useEffect(() => {
        fetchEventDetails();
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            setFetching(true);
            // API client automatically adds token via interceptor
            const res = await api.get(`/events/${eventId}`);
            // API client extracts data, so res is already the event object
            const eventData = res;
            setEvent(eventData);
            setLocation(eventData.location || '');
            setDate(new Date(eventData.date));
        } catch (err: any) {
            Alert.alert('Error', 'Failed to load event details');
            router.back();
        } finally {
            setFetching(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            if (event.type === 'dismissed') {
                return;
            }
        } else {
            if (event.type === 'dismissed') {
                setShowDatePicker(false);
                return;
            }
        }
        
        if (selectedDate) {
            const now = new Date();
            const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            if (selectedDateOnly < nowDateOnly) {
                Alert.alert('Invalid Date', 'Event date cannot be in the past. Please select a future date.');
                return;
            }
            const currentTime = date;
            selectedDate.setHours(currentTime.getHours(), currentTime.getMinutes());
            setDate(selectedDate);
            
            if (Platform.OS === 'ios') {
                setShowDatePicker(false);
            }
        }
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
            if (event.type === 'dismissed') {
                return;
            }
        } else {
            if (event.type === 'dismissed') {
                setShowTimePicker(false);
                return;
            }
        }
        
        if (selectedTime) {
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

    const handleReschedule = async () => {
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

            // API client automatically adds token via interceptor
            await api.post(`/events/${eventId}/reschedule`, {
                date: date.toISOString(),
                location: location
            });

            Alert.alert('Success', 'Event rescheduled successfully', [
                {
                    text: 'OK',
                    onPress: () => router.back()
                }
            ]);
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.msg || 'Failed to reschedule event');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <Text className="text-white">Loading...</Text>
            </ScreenWrapper>
        );
    }

    if (!event) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <Text className="text-white">Event not found</Text>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 120 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <LinearGradient
                        colors={['#1A202C', '#2D3748']}
                        className="px-6 pt-16 pb-4 flex-row justify-between items-center shadow-lg"
                    >
                        <View className="flex-row items-center">
                            <GlassContainer className="w-12 h-12 rounded-full items-center justify-center mr-3 p-0" intensity={30}>
                                <FontAwesome name="calendar" size={24} color="#FFFFFF" />
                            </GlassContainer>
                            <View>
                                <Text className="text-2xl font-bold text-white">Reschedule Event</Text>
                                <Text className="text-gray-300 text-sm mt-1">{event.title}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 rounded-full items-center justify-center bg-white/10 border border-white/20"
                        >
                            <FontAwesome name="close" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </LinearGradient>

                    <View className="px-6 pt-6">
                        {/* Current Event Info */}
                        <GlassContainer className="p-4 mb-6" intensity={20}>
                            <Text className="text-gray-400 text-xs mb-2 uppercase font-bold">Current Schedule</Text>
                            <Text className="text-white font-semibold text-base mb-1">
                                {formatEventDate(new Date(event.date))}
                            </Text>
                            <Text className="text-gray-300 text-sm">{event.location}</Text>
                        </GlassContainer>

                        {/* New Location */}
                        <View className="mb-4">
                            <GlassInput
                                label="New Location (Optional)"
                                placeholder={event.location || "Enter new location"}
                                value={location}
                                onChangeText={setLocation}
                                icon="map-marker"
                            />
                        </View>

                        {/* New Date and Time */}
                        <View className="mb-6">
                            <Text className="text-gray-300 font-semibold mb-3 text-sm ml-1">New Date & Time *</Text>
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
                                    onChange={onDateChange}
                                    minimumDate={new Date()}
                                />
                            )}

                            {/* Time Picker */}
                            {showTimePicker && (
                                <DateTimePicker
                                    value={date}
                                    mode="time"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onTimeChange}
                                    is24Hour={false}
                                />
                            )}

                            {date && date >= new Date() && (
                                <View className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                                    <View className="flex-row items-center">
                                        <FontAwesome name="check-circle" size={14} color="#10B981" />
                                        <Text className="text-green-400 text-xs ml-2 font-medium">
                                            New Schedule: {formatEventDate(date)}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Reschedule Button */}
                        <TouchableOpacity
                            onPress={handleReschedule}
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
                                        <Text className="text-white font-bold text-lg mr-3">Rescheduling...</Text>
                                    </View>
                                ) : (
                                    <View className="flex-row items-center">
                                        <FontAwesome name="calendar-check" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
                                        <Text className="text-white font-bold text-lg">Reschedule Event</Text>
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

